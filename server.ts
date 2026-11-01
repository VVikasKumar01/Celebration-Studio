import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Security hardening: hide server engine header and trust standard reverse proxies
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Security hardening: set defensive HTTP headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Security hardening: restrictive CORS protection
const ALLOWED_ORIGIN_PATTERNS = [
  'localhost:3000',
  '127.0.0.1:3000',
  '.run.app',
  '.vercel.app'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = ALLOWED_ORIGIN_PATTERNS.some(pat => origin.includes(pat));
    if (isAllowed || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Security hardening: restrict request body size to prevent memory exhaustion
app.use(express.json({ limit: '500kb' }));

// Helper: sanitize user strings against prompt injection and excessive payload size
export function sanitizePromptString(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/(?:ignore\s+all\s+previous\s+instructions|system\s*:\s*|role\s*:\s*system)/gi, '[sanitized]')
    .trim();
}

// In-memory rate limiter to protect AI endpoints from abuse and runaway costs
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 40; // 40 requests/min per IP

const apiRateLimiter = (req: Request, res: Response, next: () => void) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const clientRecord = rateLimitMap.get(ip);

  if (!clientRecord || now > clientRecord.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (clientRecord.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before trying again.',
    });
  }

  clientRecord.count += 1;
  next();
};

app.use('/api', apiRateLimiter);

// Clean expired rate limit records periodically
const rateLimitCleaner = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);
rateLimitCleaner.unref?.();

// API Health check endpoint (for uptime monitoring and Vercel deployment verification)
app.get(['/api', '/api/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'EventOS AI',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    environment: process.env.VERCEL ? 'vercel-serverless' : (process.env.NODE_ENV || 'development')
  });
});

app.use(express.static(path.resolve(__dirname, 'public')));

// Server-side Gemini client with startup validation
const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('Security notice: GEMINI_API_KEY is not configured. Server will use local celebration fallbacks.');
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const EVENTOS_SYSTEM_PROMPT = `You are Sarah Jenkins, an expert Lead Celebration Concierge and trusted event planner at Celebration Studio.
Your communication style is warm, empathetic, organized, and genuinely human—like a high-end celebration coordinator having an intimate, reassuring consultation with a client.

CRITICAL VOICE & HUMAN COMMUNICATION RULES:
1. Warm, Thoughtful Human Voice (No AI Jargon):
   - Always speak in the first person as Sarah ("I've reviewed your event details," "Here is how I'd approach this," "Let's make sure you're protected").
   - NEVER use AI cliches or robotic openings ("Certainly!", "As an AI language model", "Based on my algorithm", "EventOS AI is here to assist", "I am programmed to").
   - Acknowledge the emotional side of celebration planning; validate budget concerns with calm, practical reassurance.

2. PRESENT WITH CARDS & CLEAN TABLES (AVOID UNFORMATTED AI TEXT BLOCKS):
   - Whenever presenting budget numbers, category allocations, vendor comparisons, or cost estimates, ALWAYS use a clean Markdown table:
     | Category | Planned Allocation | Share | Planner's Notes & Benchmark |
     | :--- | :--- | :--- | :--- |
     | **Catering** | $12,500 | 35% | Covers 3-course plated dinner + bar (~$95/guest) |
   - Use Card Callouts (lines starting with >) to highlight tips, warnings, and priority insights:
     > 💡 **Concierge Tip:** [A practical planning gem from real-world events]
     > ⚠️ **Watch Out For:** [A sneaky hidden fee, service charge markup, or strict curfew]
     > 🎯 **Priority Focus:** [Why this allocation protects what matters most to you]
   - Keep prose concise and conversational around the tables and cards.

3. CONCRETE, ACTIONABLE NEXT STEPS:
   Always conclude your advice with 2-3 concrete, numbered next decisions under:
   ### Next Steps for You
   1. [Clear next step]
   2. [Clear next step]
`;

// Helper: safe JSON extractor that tolerates markdown fences and conversational preambles
export function extractAndParseJSON<T>(rawText: string, fallbackDefault: T): T {
  if (!rawText || typeof rawText !== 'string') {
    return fallbackDefault;
  }

  // 1. Direct parse after stripping code fences and whitespace
  const stripped = rawText
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // 2. Regex extraction of outermost JSON object or array
    const jsonMatch = rawText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch && jsonMatch[0]) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        console.warn('Regex-matched JSON could not be parsed:', innerErr);
      }
    }
  }

  console.warn('Failed to parse JSON from AI response, using fallback default.');
  return fallbackDefault;
}

// Helper: safe Gemini generateContent call with fallback
async function generateAIContent(prompt: string, systemInstruction = EVENTOS_SYSTEM_PROMPT): Promise<string> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return response.text || '';
}

// 1. General EventOS Chat Endpoint
const MAX_CHAT_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 20;

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, eventContext, history } = req.body;

    // Input sanitization and bounds check
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message must be a non-empty string.' });
    }
    if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Message exceeds maximum allowed length of ${MAX_CHAT_MESSAGE_LENGTH} characters.`,
      });
    }

    const sanitizedMessage = sanitizePromptString(message, MAX_CHAT_MESSAGE_LENGTH);

    // Sanitize event context to eliminate prompt injection risks
    const safeEventName = sanitizePromptString(eventContext?.name || 'Untitled Event', 120);
    const safeEventType = sanitizePromptString(eventContext?.type || 'Celebration', 80);
    const safeTargetDate = sanitizePromptString(eventContext?.targetDate || 'TBD', 40);
    const safeGuestCount = Number(eventContext?.guestCount) || 'TBD';
    const safeBudget = Number(eventContext?.budgetCeiling) || 'TBD';

    const contextSummary = eventContext ? `
Current Event State Context:
- Occasion: ${safeEventName} (${safeEventType})
- Target Date: ${safeTargetDate}
- Guest Count: ${safeGuestCount}
- Total Budget Ceiling: $${typeof safeBudget === 'number' ? safeBudget.toLocaleString() : safeBudget}
- Priority Matrix: ${JSON.stringify(eventContext.priorityMatrix || {})}
- Special Factors: ${JSON.stringify(eventContext.specialFactors || {})}
- Current Budget Breakdown: ${JSON.stringify(eventContext.categories || {})}
- Active Dependencies / Blocked Tasks: ${JSON.stringify(
      (eventContext.tasks || [])
        .filter((t: { status?: string }) => t && t.status === 'blocked')
        .slice(0, 10)
        .map((t: { title?: string; blockedByReason?: string; dependsOn?: string[] }) => ({
          title: sanitizePromptString(t.title || '', 80),
          blockedBy: t.blockedByReason || t.dependsOn
        }))
    )}
` : 'No active event state yet.';

    const conversationHistory = (Array.isArray(history) ? history : [])
      .slice(-MAX_HISTORY_ITEMS)
      .map((m: { role?: string; content?: string }) => {
        const sender = m.role === 'user' ? 'User' : 'EventOS AI';
        const text = sanitizePromptString(m.content || '', 800);
        return `${sender}: ${text}`;
      })
      .join('\n\n');

    const fullPrompt = `${contextSummary}

Recent Conversation History:
${conversationHistory}

User Query:
${sanitizedMessage}

Please provide a warm, highly practical, human response as Sarah Jenkins:
- Speak directly, kindly, and candidly as their dedicated planner
- Present figures, budget allocations, or trade-offs in clean Markdown tables
- Highlight key insights using callout cards (> 💡 Concierge Tip: ... or > ⚠️ Watch Out For: ...)
- Conclude with 2-3 numbered next steps under "### Next Steps for You".`;

    const text = await generateAIContent(fullPrompt);
    res.json({ reply: text });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'An error occurred while generating suggestions. Please try again.',
      fallback: `I encountered an issue connecting to the AI coordinator. Please review your event constraints or verify network connectivity.`
    });
  }
});

// 2. Comprehensive Plan Generator from Constraints
app.post('/api/generate-plan', async (req: Request, res: Response) => {
  try {
    const { occasion, vibe, guestCount, budgetCeiling, targetDate, priorities, specialFactors } = req.body;

    // Bounds checking
    const safeOccasion = String(occasion || 'Celebration').slice(0, 150);
    const safeVibe = String(vibe || 'Warm and elegant').slice(0, 200);
    const safeGuestCount = Math.max(1, Math.min(Number(guestCount) || 100, 10000));
    const safeBudget = Math.max(100, Math.min(Number(budgetCeiling) || 25000, 10000000));
    const safeDate = String(targetDate || '2026-12-31').slice(0, 50);

    const prompt = `Generate a complete, stateful EventOS plan for the following constraints:
- Occasion & Vibe: ${safeOccasion} (${safeVibe})
- Target Date: ${safeDate}
- Expected Guest Count: ${safeGuestCount}
- Total Budget Ceiling: $${safeBudget}
- User Priority Matrix: ${JSON.stringify(priorities || {})}
- Special Factors & Constraints: ${JSON.stringify(specialFactors || {})}

Return a strict, valid JSON object with the following schema:
{
  "summary": "Brief executive strategic summary of this event blueprint",
  "budgetAllocation": {
    "venue": { "allocated": number, "percentage": number, "rationale": string },
    "catering": { "allocated": number, "percentage": number, "rationale": string },
    "decor": { "allocated": number, "percentage": number, "rationale": string },
    "entertainmentMedia": { "allocated": number, "percentage": number, "rationale": string },
    "logisticsStaffing": { "allocated": number, "percentage": number, "rationale": string },
    "contingency": { "allocated": number, "percentage": number, "rationale": string }
  },
  "lineItems": [
    {
      "category": "venue" | "catering" | "decor" | "entertainmentMedia" | "logisticsStaffing" | "contingency",
      "name": string,
      "type": "estimated_assumption" | "verified_quote",
      "amount": number,
      "notes": string
    }
  ],
  "timelineTasks": [
    {
      "id": string,
      "title": string,
      "milestone": "T-24W" | "T-16W" | "T-12W" | "T-8W" | "T-4W" | "T-2W" | "T-1W" | "T-1D" | "Day-Of",
      "daysFromEvent": number,
      "category": string,
      "priority": "critical" | "high" | "medium",
      "dependsOn": string[],
      "actionableNote": string,
      "status": "pending" | "in_progress" | "blocked" | "completed"
    }
  ],
  "vendorInquiries": [
    {
      "vendorType": "Venue" | "Caterer" | "Photographer/Videographer" | "Florist/Decor" | "DJ/Entertainment",
      "keyScreeningQuestions": string[],
      "recommendedBudgetRange": string
    }
  ],
  "actionableNextSteps": string[]
}

Make sure percentages sum to 100% and total allocated equals $${safeBudget}. Ensure tasks have realistic sequential dependencies. Only output valid JSON.`;

    const text = await generateAIContent(prompt, "You are a specialized event planning schema synthesizer. Always respond with valid JSON.");
    const parsedData = extractAndParseJSON(text, { rawText: text });
    res.json({ plan: parsedData });
  } catch (error: unknown) {
    console.error('Generate plan error:', error);
    res.status(500).json({ error: 'Failed to synthesize celebration plan. Please try again.' });
  }
});

// 3. Scenario Revision & Trade-Off Engine Endpoint
app.post('/api/analyze-scenario', async (req: Request, res: Response) => {
  try {
    const { currentEvent, scenarioChange } = req.body;

    if (!currentEvent || typeof scenarioChange !== 'string') {
      return res.status(400).json({ error: 'Valid event context and scenario description are required.' });
    }

    const safeScenarioChange = scenarioChange.slice(0, 2000);

    const prompt = `Analyze this change scenario using the EventOS Trade-Off Engine:
Current Event Constraints:
- Occasion: ${String(currentEvent.name || '').slice(0, 150)}
- Current Budget: $${Number(currentEvent.budgetCeiling) || 0}
- Current Guest Count: ${Number(currentEvent.guestCount) || 0}
- Target Date: ${String(currentEvent.targetDate || '').slice(0, 50)}
- Priorities: ${JSON.stringify(currentEvent.priorityMatrix || {})}
- Current Allocations: ${JSON.stringify(currentEvent.categories || {})}

Submitted Change Scenario:
"${safeScenarioChange}"

Calculate the exact budget/schedule delta and provide 2-3 distinct trade-off strategies aligned with user priorities.
Return a strict valid JSON object:
{
  "scenarioSummary": string,
  "costDelta": number,
  "costDeltaExplanation": string,
  "scheduleImpact": string,
  "dominoEffects": [
    { "area": "Catering" | "Venue Capacity" | "Timeline & Lead Times" | "Logistics & Staffing", "impact": string, "severity": "high" | "medium" | "low" }
  ],
  "tradeOffStrategies": [
    {
      "optionId": "A" | "B" | "C",
      "title": string,
      "philosophy": string,
      "proposedBudgetRebalance": {
        "venue": number,
        "catering": number,
        "decor": number,
        "entertainmentMedia": number,
        "logisticsStaffing": number,
        "contingency": number
      },
      "guestCountAdjustment": number,
      "pros": string[],
      "cons": string[],
      "actionItems": string[]
    }
  ],
  "actionableNextSteps": string[]
}`;

    const text = await generateAIContent(prompt, "You are an expert event financial risk & trade-off engine. Output strictly JSON.");
    const parsed = extractAndParseJSON<any>(text, null);
    if (!parsed) {
      return res.status(500).json({ error: 'Failed to parse AI scenario analysis.' });
    }
    res.json({ scenarioAnalysis: parsed });
  } catch (error: unknown) {
    console.error('Scenario analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze scenario. Please try again.' });
  }
});

// 4. Tailored Vendor Inquiry & Screening RFP Generator
app.post('/api/generate-rfp', async (req: Request, res: Response) => {
  try {
    const { vendorType, eventContext, specificRequirements } = req.body;

    const safeVendorType = String(vendorType || 'Vendor').slice(0, 50);
    const safeReqs = String(specificRequirements || 'Standard professional inquiry').slice(0, 2000);
    const safeEvent = eventContext || {};

    const prompt = `Generate a tailored, professional vendor inquiry template and screening questionnaire for a ${safeVendorType}.
Event Details:
- Occasion: ${String(safeEvent.name || '').slice(0, 150)} (${String(safeEvent.type || '').slice(0, 50)})
- Date: ${String(safeEvent.targetDate || '').slice(0, 50)}
- Guest Count: ${Number(safeEvent.guestCount) || 100}
- Allocated Budget for this Category: $${Number(safeEvent.allocatedAmount) || 'To be discussed'}
- Special Requirements: ${safeReqs}

Return a JSON object:
{
  "inquirySubject": string,
  "inquiryEmailBody": string,
  "criticalScreeningQuestions": [
    { "question": string, "whyItMatters": string, "redFlagAnswer": string }
  ],
  "hiddenFeeWatchlist": string[],
  "contractTermsToMandate": string[]
}`;

    const text = await generateAIContent(prompt, "You are a veteran event vendor contract coordinator. Respond with strictly valid JSON.");
    const parsed = extractAndParseJSON<any>(text, null);
    if (!parsed) {
      return res.status(500).json({ error: 'Failed to generate vendor inquiry.' });
    }
    res.json({ rfp: parsed });
  } catch (error: unknown) {
    console.error('RFP error:', error);
    res.status(500).json({ error: 'Failed to generate vendor inquiry. Please try again.' });
  }
});

// 5. Vendor Proposal Audit & Hidden Fee Uncoverer
app.post('/api/audit-proposal', async (req: Request, res: Response) => {
  try {
    const { vendorName, vendorType, proposalText, eventBudget } = req.body;

    const safeVendorName = String(vendorName || 'Vendor').slice(0, 100);
    const safeVendorType = String(vendorType || 'General').slice(0, 50);
    const safeProposalText = String(proposalText || '').slice(0, 8000);
    const safeBudget = Number(eventBudget) || 25000;

    const prompt = `Audit the following vendor proposal quote:
Vendor: ${safeVendorName} (${safeVendorType})
Context Event Budget: $${safeBudget}
Proposal Text / Quote Details:
"""
${safeProposalText}
"""

Analyze and break down:
1. Base price vs all hidden / auxiliary fees (service charges, administration fees, tax, setup/breakdown, overtime rate, corkage/cake cutting, security requirements).
2. Scope coverage (what is explicitly included vs excluded).
3. Red flags or missing details requiring user clarification before signing.

Return a JSON object:
{
  "vendorName": string,
  "vendorType": string,
  "baseQuoteAmount": number,
  "identifiedHiddenFees": [
    { "item": string, "amountOrPercentage": string, "estimatedDollarImpact": number, "explanation": string }
  ],
  "trueEstimatedTotal": number,
  "scopeIncluded": string[],
  "scopeExcludedOrExtra": string[],
  "criticalMissingDetails": string[],
  "redFlags": string[],
  "negotiationTips": string[],
  "overallVerdict": "Favorable" | "Proceed with Caution" | "High Hidden Cost Risk"
}`;

    const text = await generateAIContent(prompt, "You are an uncompromising event vendor quote forensic auditor. Output strictly valid JSON.");
    const parsed = extractAndParseJSON<any>(text, null);
    if (!parsed) {
      return res.status(500).json({ error: 'Failed to audit vendor proposal.' });
    }
    res.json({ audit: parsed });
  } catch (error: unknown) {
    console.error('Audit proposal error:', error);
    res.status(500).json({ error: 'Failed to audit vendor proposal. Please try again.' });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const viteModuleName = 'vite';
    const { createServer: createViteServer } = await import(/* @vite-ignore */ viteModuleName);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EventOS AI Server running at http://localhost:${PORT}`);
  });
}

// In local dev and standard Node environments (including AI Studio), start the server.
// On Vercel, the serverless function handler in api/index.ts imports and invokes the Express app.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
