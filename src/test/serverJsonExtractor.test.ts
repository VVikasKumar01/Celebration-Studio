import { describe, it, expect } from 'vitest';
import { extractAndParseJSON } from '../utils/promptSanitizer';

describe('Server LLM JSON Extractor & Sanitizer', () => {
  it('parses pristine JSON objects directly', () => {
    const raw = JSON.stringify({
      scenarioSummary: 'Guest count surge',
      costDelta: 3500,
    });
    const parsed = extractAndParseJSON(raw, null);
    expect(parsed).toEqual({
      scenarioSummary: 'Guest count surge',
      costDelta: 3500,
    });
  });

  it('strips Markdown json code fences cleanly', () => {
    const raw = `\`\`\`json
{
  "baseQuoteAmount": 5000,
  "trueEstimatedTotal": 6800,
  "overallVerdict": "Proceed with Caution"
}
\`\`\``;
    const parsed = extractAndParseJSON(raw, null);
    expect(parsed).toEqual({
      baseQuoteAmount: 5000,
      trueEstimatedTotal: 6800,
      overallVerdict: 'Proceed with Caution',
    });
  });

  it('extracts embedded JSON when conversational preambles or postambles are present', () => {
    const raw = `Here is the forensic audit breakdown you requested:

{
  "vendorName": "Artisan Culinary",
  "baseQuoteAmount": 7800,
  "identifiedHiddenFees": [
    { "item": "Admin Surcharge", "estimatedDollarImpact": 1872 }
  ]
}

I hope this helps protect your celebration budget!`;

    const parsed = extractAndParseJSON<{ vendorName: string; baseQuoteAmount: number } | null>(raw, null);
    expect(parsed).not.toBeNull();
    expect(parsed?.vendorName).toBe('Artisan Culinary');
    expect(parsed?.baseQuoteAmount).toBe(7800);
  });

  it('recovers with fallback default when input is completely malformed or unparseable', () => {
    const malformed = 'Unfortunately, I cannot generate valid JSON at this moment.';
    const fallback = { fallback: true };
    const parsed = extractAndParseJSON(malformed, fallback);
    expect(parsed).toEqual(fallback);
  });

  it('handles empty, null, or undefined inputs gracefully without throwing', () => {
    const fallback = { safe: true };
    expect(extractAndParseJSON('', fallback)).toEqual(fallback);
    expect(extractAndParseJSON(null as any, fallback)).toEqual(fallback);
    expect(extractAndParseJSON(undefined as any, fallback)).toEqual(fallback);
  });
});
