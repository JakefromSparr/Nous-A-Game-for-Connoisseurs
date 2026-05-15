// src/engine/grinEngine.js
// Centralized voice-selection engine for Nous.
// It selects phase-aware flavor text, interpolates tokens, and keeps UI files free of voice logic.

import { State } from '../state.js';
import { FLAVOR_TEXT, GRIN_PHASES } from '../constants/flavorText.js';

const PHASE_ORDER = [
  GRIN_PHASES.WHISPER,
  GRIN_PHASES.GRIN,
  GRIN_PHASES.SHATTER,
];

/**
 * Stable deterministic hash for choosing repeatable variants.
 * This prevents the line from changing every render unless the seed changes.
 */
function stableHash(value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  let hash = 2166136261;

  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/**
 * Convert small numbers into lowercase words.
 * Used for voice lines like "Three, you say?"
 */
export function numberWord(n) {
  const value = Number(n);

  const words = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten',
    11: 'eleven',
    12: 'twelve',
  };

  return words[value] || String(n);
}

/**
 * Convert small numbers into capitalized words.
 * Used for sentence starts like "Three, you say?"
 */
export function capitalNumberWord(n) {
  const word = numberWord(n);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Convert small numbers into ordinal words.
 * Used for lines like "We sense a fourth."
 */
export function ordinalWord(n) {
  const value = Number(n);

  const words = {
    0: 'zeroth',
    1: 'first',
    2: 'second',
    3: 'third',
    4: 'fourth',
    5: 'fifth',
    6: 'sixth',
    7: 'seventh',
    8: 'eighth',
    9: 'ninth',
    10: 'tenth',
    11: 'eleventh',
    12: 'twelfth',
  };

  if (words[value]) return words[value];

  const mod100 = value % 100;
  const mod10 = value % 10;

  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;

  return `${value}th`;
}

/**
 * Inject context values into a flavor line.
 * Example:
 * "We sense a {observedOrdinal}."
 * becomes:
 * "We sense a fourth."
 */
function interpolate(line, context = {}) {
  return String(line ?? '').replace(/\{([A-Za-z0-9_]+)\}/g, (match, token) => {
    if (Object.prototype.hasOwnProperty.call(context, token)) {
      return String(context[token]);
    }

    return match;
  });
}

/**
 * Add common derived values so flavorText.js can stay expressive.
 * This lets you pass { gathered: 3, observed: 4 } and still use:
 * {gatheredWord}, {observedWord}, {observedOrdinal}, etc.
 */
export function enrichGrinContext(context = {}) {
  const enriched = { ...context };

  const gathered =
    enriched.gathered ??
    enriched.gatheredCount ??
    enriched.playerCount ??
    enriched.participants ??
    enriched.declaredCount;

  const observed =
    enriched.observed ??
    enriched.observedCount ??
    enriched.feltCount ??
    enriched.seenCount;

  if (gathered != null) {
    enriched.gathered = gathered;
    enriched.gatheredCount = gathered;
    enriched.gatheredWord = capitalNumberWord(gathered);
    enriched.gatheredWordLower = numberWord(gathered);
    enriched.gatheredOrdinal = ordinalWord(gathered);
  }

  if (observed != null) {
    enriched.observed = observed;
    enriched.observedCount = observed;
    enriched.observedWord = numberWord(observed);
    enriched.observedWordCapital = capitalNumberWord(observed);
    enriched.observedOrdinal = ordinalWord(observed);
  }

  return enriched;
}

/**
 * Determine current voice phase.
 *
 * WHISPER:
 * Early, restrained, observational.
 *
 * GRIN:
 * More intimate, more confident, more "We know what you are doing."
 *
 * SHATTER:
 * Late-stage rupture. Shorter, stranger, harsher.
 */
export function getGrinPhase(state = State.getState()) {
  const explicit = state?.grinPhase;

  if (PHASE_ORDER.includes(explicit)) {
    return explicit;
  }

  const roundsWon = Number(state?.roundsWon || 0);
  const roundNumber = Number(state?.roundNumber || 1);

  const traitMagnitude = Object.values(state?.traits || {}).reduce(
    (sum, value) => sum + Math.abs(Number(value) || 0),
    0
  );

  const isHaunted = Boolean(state?.isHaunted);
  const isShattered = Boolean(state?.isShattered);

  if (
    isShattered ||
    roundsWon >= 2 ||
    roundNumber >= 3 ||
    traitMagnitude >= 15
  ) {
    return GRIN_PHASES.SHATTER;
  }

  if (
    isHaunted ||
    roundsWon >= 1 ||
    roundNumber >= 2 ||
    traitMagnitude >= 8
  ) {
    return GRIN_PHASES.GRIN;
  }

  return GRIN_PHASES.WHISPER;
}

/**
 * Get all available line variants for a key and phase.
 * Falls back to WHISPER if the current phase has no lines.
 */
export function getGrinVariants(key, options = {}) {
  const state = options.state || State.getState();
  const phase = options.phase || getGrinPhase(state);

  const entry = FLAVOR_TEXT[key];

  if (!entry) return [];

  const variants =
    entry[phase] ||
    entry[GRIN_PHASES.WHISPER] ||
    [];

  return Array.isArray(variants) ? variants : [variants];
}

/**
 * Main public function.
 *
 * Example:
 * getGrinLine('WAITING_ROOM_OBSERVED', {
 *   gathered: 3,
 *   observed: 4,
 * });
 *
 * Supports:
 * - phase-aware variants
 * - deterministic variant selection
 * - token interpolation
 * - automatic number words and ordinal words
 */
export function getGrinLine(key, context = {}, options = {}) {
  const state = options.state || State.getState();
  const phase = options.phase || getGrinPhase(state);
  const enrichedContext = enrichGrinContext(context);

  const entry = FLAVOR_TEXT[key];

  if (!entry) {
    if (options.fallback != null) return String(options.fallback);
    return '';
  }

  const variants =
    entry[phase] ||
    entry[GRIN_PHASES.WHISPER] ||
    [];

  const lines = Array.isArray(variants) ? variants : [variants];

  if (!lines.length) {
    if (options.fallback != null) return String(options.fallback);
    return '';
  }

  const seed =
    options.seed ??
    state?.grinSeed ??
    state?.sessionId ??
    { key, phase, context: enrichedContext };

  const index = Number.isInteger(options.variantIndex)
    ? options.variantIndex
    : stableHash(seed) % lines.length;

  const safeIndex = ((index % lines.length) + lines.length) % lines.length;

  return interpolate(lines[safeIndex], enrichedContext);
}

/**
 * Convenience helper for Waiting Room receipt.
 * This keeps the calling code simpler and avoids mismatched variable names.
 */
export function getObservedPresenceLine(gathered, options = {}) {
  const observed = Number(gathered) + 1;

  return getGrinLine(
    'WAITING_ROOM_OBSERVED',
    {
      gathered,
      observed,
    },
    options
  );
}
