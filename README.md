# Celebration Studio — AI-Powered Event Planning Platform

> **Hack2Skill Submission** · Smart Assistant Challenge · Vertical: Personal Celebration Concierge

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285f4?logo=google)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com/)

---

## Chosen Vertical

**Personal Celebration Concierge** — An intelligent assistant that guides individuals through the entire lifecycle of planning weddings, birthday parties, corporate galas, and social celebrations; from initial budget discovery through vendor sourcing, timeline management, and scenario trade-off analysis.

---

## Approach & Logic

### Core Problem Statement

Celebration planning is emotionally high-stakes and financially complex. People face:
- Hidden vendor fees that blow budgets after contracts are signed
- No clear understanding of domino-effect consequences when one constraint changes
- Timeline dependencies that are invisible until it is too late
- Overwhelming, generic advice that ignores their specific priorities

### Solution Architecture

Celebration Studio solves this with five integrated AI-powered workflows:

```
┌─────────────────────────────────────────────────────────┐
│                  Celebration Studio                     │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Discovery   │    Budget    │   Timeline   │  Scenario  │
│  Workflow    │  Allocation  │  & Roadmap   │  Engine    │
│              │  Rebalancer  │              │            │
├──────────────┴──────────────┴──────────────┴────────────┤
│              Vendor Quotation & Fee Forensics           │
├─────────────────────────────────────────────────────────┤
│         Sarah Jenkins — AI Celebration Concierge        │
│         (Gemini 2.0 Flash via /api/chat)                │
└─────────────────────────────────────────────────────────┘
```

### AI Decision Logic

The assistant ("Sarah Jenkins") is a **stateful, context-aware** persona — not a generic chatbot. Every API call includes:

1. **Live event context** (budget, guest count, priority matrix, blocked tasks)
2. **Conversation history** (last 20 turns for continuity)
3. **Role-specific system prompt** (warm, human tone; structured Markdown output)

This allows Sarah to give advice like:
> "You've allocated 35% to catering for 120 guests — that gives you ≈$95/head, which is tight for a plated dinner. Here's how I'd restructure..."

---

## How the Solution Works

### 1. Discovery Workflow
Users input their event type, vibe, guest count, budget ceiling, and priority matrix. The AI synthesises a complete baseline plan (budget allocation + timeline tasks + vendor checklist) as a structured JSON object.

### 2. Budget Allocation & Rebalancing
An interactive slider-based rebalancer lets users shift priority weights. The AI immediately explains the trade-offs and suggests reallocation strategies aligned with the user's stated priorities.

### 3. Timeline & Task Dependency Roadmap
Tasks are organised into milestones (`T-24W` through `Day-Of`). Dependency chains are visualised so users can see which tasks block others — and which are already blocked.

### 4. Scenario Trade-Off Engine
Users describe a change ("What if I add 30 guests?") and the engine returns:
- Exact cost delta
- Domino effects across all categories
- Three distinct trade-off strategies (A/B/C) with pros/cons

### 5. Vendor Quotation & Hidden Fee Forensics
Users paste vendor proposals; the AI audits them for:
- Hidden fees (service charges, corkage, setup/breakdown, overtime)
- Missing scope details
- Red-flag clauses
- Negotiation tips

---

## Project Structure

```
celebration-studio/
├── src/
│   ├── components/         # React UI components (lazy-loaded)
│   │   ├── AICoordinatorDrawer.tsx   # Persistent AI chat drawer
│   │   ├── BudgetWorkflow.tsx        # Budget allocation UI
│   │   ├── DiscoveryWorkflow.tsx     # Event discovery & intake
│   │   ├── ScenarioWorkflow.tsx      # Scenario & trade-off engine
│   │   ├── TimelineWorkflow.tsx      # Task timeline & dependencies
│   │   ├── VendorWorkflow.tsx        # Vendor audit & RFP generator
│   │   └── vendor/                   # Sub-components for vendor modals
│   ├── hooks/
│   │   ├── useLocalStorage.ts    # Generic debounced persistence hook
│   │   ├── useModalA11y.ts       # Accessible modal focus trap & Escape
│   │   └── useScrollSpy.ts       # Active section scroll detection
│   ├── utils/
│   │   └── promptSanitizer.ts    # Prompt injection defence & JSON parser
│   ├── types/event.ts            # Shared TypeScript domain types
│   ├── constants.ts              # All magic strings & numbers (centralised)
│   ├── data/sampleEvents.ts      # Three pre-seeded sample events
│   └── App.tsx                   # Root component
├── server.ts                     # Express + Gemini API server
├── api/index.ts                  # Vercel serverless adapter
├── eslint.config.js              # ESLint flat config (TS + React + a11y)
├── .prettierrc                   # Code formatting rules
├── vitest.config.ts              # Unit test configuration
└── vercel.json                   # Vercel routing & function config
```

---

## Assumptions Made

1. **Client-only persistence** — Event data is stored in `localStorage`. No database is needed for the MVP; the data is personal and device-local by design.
2. **Gemini as the sole AI provider** — The `GEMINI_API_KEY` is required. The server gracefully degrades with local fallback data if the key is absent.
3. **Single planner, single device** — No multi-user collaboration in v1.
4. **Sepolia/testnet not applicable** — This is a web app, not a blockchain project.
5. **Currency** — All monetary values default to USD; locale formatting is applied via `Intl.NumberFormat`.

---

## Running Locally

```bash
# 1. Clone
git clone https://github.com/VVikasKumar01/Celebration-Studio.git
cd Celebration-Studio

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# → Add your GEMINI_API_KEY to .env

# 4. Start development server
npm run dev
# → Opens at http://localhost:3000
```

---

## Code Quality

```bash
npm run lint        # ESLint (TS + React Hooks + jsx-a11y)
npm run lint:fix    # Auto-fix lint errors
npm run typecheck   # TypeScript strict type-check
npm run test        # Vitest unit test suite
```

---

## Deployment

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for full deployment instructions.

---

## Evaluation Coverage

| Criterion | Implementation |
|---|---|
| **Code Quality** | TypeScript strict mode · ESLint flat config · Prettier · JSDoc on all exports · constants.ts · custom hooks |
| **Security** | Prompt injection sanitiser · In-memory rate limiter · Restrictive CORS · 500 KB body limit · No secrets in client code |
| **Efficiency** | Lazy-loaded route chunks · Debounced localStorage writes · Passive scroll listener · Code-split modals |
| **Testing** | Vitest unit suite covering budget calculations, timeline dependencies, vendor workflow, accessibility hooks |
| **Accessibility** | `useModalA11y` focus trap · ARIA labels on all interactive elements · `role="dialog"` · SR-only headings · Skip nav |
| **Problem Alignment** | Five workflow modules directly map to the five core celebration planning pain points |
