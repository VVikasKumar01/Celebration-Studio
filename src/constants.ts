/**
 * @file constants.ts
 * @description Central configuration constants for Celebration Studio.
 *
 * All magic strings, numeric limits, storage keys, and section IDs live
 * here. Import from this file instead of hard-coding values inline so
 * that a single change propagates everywhere.
 */

// ---------------------------------------------------------------------------
// LocalStorage persistence keys
// ---------------------------------------------------------------------------

/** Primary storage key for the serialised EventState array (v3 with assets). */
export const STORAGE_KEY = 'eventos_ai_events_v3_assets';

/** Legacy storage key — checked as a fallback migration source. */
export const LEGACY_STORAGE_KEY = 'eventos_ai_events_v2_light';

// ---------------------------------------------------------------------------
// Studio section IDs (must match the `id` props on each workflow section)
// ---------------------------------------------------------------------------

/** Ordered list of studio section element IDs used for scroll-spy. */
export const STUDIO_SECTIONS = [
  'discovery',
  'budget',
  'timeline',
  'scenarios',
  'vendors',
] as const;

/** Type derived from the sections tuple so it can be used as a prop type. */
export type StudioSection = (typeof STUDIO_SECTIONS)[number];

// ---------------------------------------------------------------------------
// Scroll / UX thresholds
// ---------------------------------------------------------------------------

/** Pixels scrolled before the "scroll to top" FAB becomes visible. */
export const SCROLL_TOP_THRESHOLD_PX = 400;

/**
 * Pixels from the top of the viewport at which an in-view section is
 * considered "active" in the navigation scroll-spy.
 */
export const SCROLL_SPY_OFFSET_PX = 200;

/**
 * Milliseconds to debounce localStorage writes so rapid typing does not
 * thrash storage on every keystroke.
 */
export const STORAGE_DEBOUNCE_MS = 400;

/**
 * Milliseconds to wait after a view transition before smooth-scrolling to
 * a target section. Allows the DOM to mount before querying the element.
 */
export const SCROLL_AFTER_TRANSITION_MS = 150;

// ---------------------------------------------------------------------------
// Server / API limits (mirrored from server.ts — kept in sync manually)
// ---------------------------------------------------------------------------

/** Maximum character length accepted for a chat message. */
export const MAX_CHAT_MESSAGE_LENGTH = 2000;

/** Maximum number of chat history turns sent as context to the AI. */
export const MAX_HISTORY_ITEMS = 20;

/** Rate-limit window duration in milliseconds (1 minute). */
export const RATE_LIMIT_WINDOW_MS = 60 * 1_000;

/** Maximum AI API requests allowed per IP within the rate-limit window. */
export const RATE_LIMIT_MAX_REQUESTS = 40;

/** Rate-limit cleaner sweep interval (5 minutes). */
export const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1_000;

// ---------------------------------------------------------------------------
// AI model identifiers
// ---------------------------------------------------------------------------

/** Gemini model used for all planning and chat completions. */
export const GEMINI_MODEL = 'gemini-2.0-flash';
