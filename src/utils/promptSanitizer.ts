/**
 * @file src/utils/promptSanitizer.ts
 * @description Shared utility for sanitising user-supplied strings before they
 * are interpolated into AI prompts.  Prevents prompt-injection attacks by
 * stripping well-known jailbreak patterns and enforcing a maximum length.
 */

/**
 * Sanitises a user-supplied value for safe interpolation into an AI prompt.
 *
 * @param input     - Raw value from the request body (may be any type).
 * @param maxLength - Maximum character length to retain (default 2 000).
 * @returns A clean, trimmed string.  Returns an empty string for non-string input.
 *
 * @example
 * const safe = sanitizePromptString(req.body.message, 500);
 */
export function sanitizePromptString(input: unknown, maxLength = 2_000): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(
      /(?:ignore\s+all\s+previous\s+instructions|system\s*:\s*|role\s*:\s*system)/gi,
      '[sanitized]',
    )
    .trim();
}

/**
 * Attempts to extract and parse a JSON object or array from raw AI-generated
 * text, which may include Markdown code fences or conversational preamble.
 *
 * Strategy:
 * 1. Strip ` ```json ` / ` ``` ` fences and attempt a direct `JSON.parse`.
 * 2. Fall back to a regex extraction of the outermost `{…}` or `[…]`.
 * 3. Return `fallbackDefault` if both attempts fail.
 *
 * @template T         - Expected shape of the parsed value.
 * @param rawText      - Raw string returned by the AI model.
 * @param fallbackDefault - Value to return when parsing is impossible.
 * @returns The parsed value or `fallbackDefault`.
 *
 * @example
 * const data = extractAndParseJSON<MySchema>(aiText, { items: [] });
 */
export function extractAndParseJSON<T>(rawText: string, fallbackDefault: T): T {
  if (!rawText || typeof rawText !== 'string') {
    return fallbackDefault;
  }

  // 1. Strip Markdown code fences and attempt a direct parse
  const stripped = rawText
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    // 2. Regex extraction of outermost JSON object or array
    const jsonMatch = rawText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch?.[0]) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch (innerErr) {
        console.warn('[extractAndParseJSON] Regex-matched JSON could not be parsed:', innerErr);
      }
    }
  }

  console.warn('[extractAndParseJSON] Failed to parse JSON from AI response, using fallback default.');
  return fallbackDefault;
}
