// src/engine/grinEngine.js
import { State } from '../state.js';
import { FLAVOR_TEXT, GRIN_PHASES } from '../constants/flavorText.js';

const PHASE_ORDER = [GRIN_PHASES.WHISPER, GRIN_PHASES.GRIN, GRIN_PHASES.SHATTER];

function stableHash(value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function numberWord(n) {
  const words = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
  };

  return words[n] || String(n);
}

export function capitalNumberWord(n) {
  const word = numberWord(n);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function ordinalWord(n) {
  const words = {
    1: 'first',
    2: 'second',
    3: 'third',
    4: 'fourth',
    5: 'fifth',
    6: 'sixth',
    7: 'seventh',
    8: 'eighth',
    9: 'ninth',
  }

  return words[n] || `${n}th`;
}

function interpolate(line, context = {}) {
  return String(line ?? '').replace(/\{([A-Za-z0-9_]+)\}/g, (match, token) => {
    if (Object.prototype.hasOwnProperty.call(context, token)) {
      return String(context[token]);
    }
    return match;
  });
}

export function getGrinPhase(state = State.getState()) {
  const explicit = state?.grinPhase;
  if (PHASE_ORDER.includes(explicit)) return explicit;

  const roundsWon = Number(state?.roundsWon || 0);
  const roundNumber = Number(state?.roundNumber || 1);
  const traitMagnitude = Object.values(state?.traits || {})
    .reduce((sum, value) => sum + Math.abs(Number(value) || 0), 0);

  if (roundsWon >= 2 || roundNumber >= 3 || traitMagnitude >= 15) return GRIN_PHASES.SHATTER;
  if (roundsWon >= 1 || roundNumber >= 2 || traitMagnitude >= 8) return GRIN_PHASES.GRIN;
  return GRIN_PHASES.WHISPER;
}

export function getGrinLine(key, context = {}, options = {}) {
  const state = options.state || State.getState();
  const phase = options.phase || getGrinPhase(state);
  const entry = FLAVOR_TEXT[key];
  if (!entry) return '';

  const variants = entry[phase] || entry[GRIN_PHASES.WHISPER] || [];
  const lines = Array.isArray(variants) ? variants : [variants];
  if (!lines.length) return '';

  const seed = options.seed ?? { key, phase, context };
  const index = Number.isInteger(options.variantIndex)
    ? options.variantIndex
    : stableHash(seed) % lines.length;

  return interpolate(lines[((index % lines.length) + lines.length) % lines.length], context);
}
