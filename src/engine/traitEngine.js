// src/engine/traitEngine.js
import { State } from '../state.js';
import { clamp } from './utils.js';
import { TRAIT_LOADINGS } from '../constants/traitConfig.js';
import { CLASS_TRAIT_BASE } from '../constants/answerLogic.js';

// ---- helpers ----
const toTitle = (u) => (u ? u[0] + u.slice(1).toLowerCase() : '');

/**
 * Ensure trait-related fields exist in state.
 */
export function ensureTraitState() {
  const S = State.getState();
  if (!S.traits) S.traits = { X: 0, Y: 0, Z: 0 };
  if (!S.classTally) S.classTally = { Typical: 0, Revelatory: 0, Wrong: 0 };
  if (!S.traitRead) S.traitRead = null;
  return S;
}

/**
 * Apply trait delta for a single answered question.
 * @param {number|string} questionId
 * @param {'TYPICAL'|'REVELATORY'|'WRONG'} kindUpper
 * @param {string} [chosenLabel] // stable even with shuffling
 */
export function applyTraitDelta(questionId, kindUpper, chosenLabel) {
  const S = ensureTraitState();

  const titleKey = toTitle(kindUpper); // 'TYPICAL' -> 'Typical'
  const cfg      = TRAIT_LOADINGS[questionId] || {};
  const weight   = cfg.axisWeight || {}; // {X?,Y?,Z?}
  const ovClass  = cfg.overrides?.[titleKey] || null;
  const ovAns    = chosenLabel && cfg.overridesByAnswer?.[chosenLabel] || null;

  const base     = CLASS_TRAIT_BASE[titleKey] || { X: 0, Y: 0, Z: 0 };

  ['X','Y','Z'].forEach(axis => {
    const w  = (weight[axis] != null) ? weight[axis] : 1;
    const b  = base[axis] || 0;
    const d  = (ovAns?.[axis] ?? ovClass?.[axis] ?? b) * w;
    S.traits[axis] = clamp((S.traits[axis] || 0) + d, -9, 9);
  });

  // Tally by class for meta/signals
  S.classTally[titleKey] = (S.classTally[titleKey] || 0) + 1;

  // Update read & cache to state
  S.traitRead = computeTraitRead(S);
}

/**
 * Compute a normalized read + archetype + suggestions.
 * Returns a pure object; also used to cache into state.
 */
export function computeTraitRead(S0) {
  const S = S0 || State.getState();
  const { X = 0, Y = 0, Z = 0 } = S.traits || {};
  const t = S.classTally || { Typical:0, Revelatory:0, Wrong:0 };

  const n = (t.Typical|0) + (t.Revelatory|0) + (t.Wrong|0);
  const norm = Math.sqrt(X*X + Y*Y + Z*Z) / (9 * Math.sqrt(3));
  const confidence = norm * Math.sqrt(n / (n + 6));

  const primary = pickPrimaryAxis(X, Y, Z);
  const archetype = pickArchetype(X, Y, Z, confidence);

  return {
    traits: { X, Y, Z },
    classTally: { ...t, total: n },
    norm,
    confidence,
    primary,
    archetype,
    routingNudge: routingFromTraits(X, Y, Z),
    intrusion: pickIntrusionLine(X, Y, Z, t, confidence),
  };
}

function pickPrimaryAxis(X, Y, Z) {
  const abs = { X: Math.abs(X), Y: Math.abs(Y), Z: Math.abs(Z) };
  const key = (abs.X >= abs.Y && abs.X >= abs.Z) ? 'X' :
              (abs.Y >= abs.Z) ? 'Y' : 'Z';
  const dir = ({X, Y, Z})[key] >= 0 ? '+' : '-';
  return key + dir; // e.g., 'Z+' (Empirical), 'Y-' (Conventional)
}

function pickArchetype(X, Y, Z, c) {
  // Simple but legible buckets. Tune thresholds in playtests.
  const strong = 3.2; // axis magnitude
  const tags = [];
  if (X >  strong) tags.push('Innovative');
  if (X < -strong) tags.push('Analytical');
  if (Y >  strong) tags.push('Radical');
  if (Y < -strong) tags.push('Conventional');
  if (Z >  strong) tags.push('Empirical');
  if (Z < -strong) tags.push('Figurative');

  let name = 'Unresolved Pattern';
  if (tags.length === 1) name = `The ${tags[0]}`;
  else if (tags.length === 2) name = `The ${tags[0]} ${tags[1]}`;
  else if (tags.length >= 3) name = `The Contradiction`;

  return { name, tags, strength: c };
}

function routingFromTraits(X, Y, Z) {
  const prefer = [];
  if (Z >= 2) prefer.push('factual_literal');
  if (Z <= -2) prefer.push('lateral_wordplay', 'uncanny_perception');
  if (Y >= 2) prefer.push('framing_morality'); // riskier choices, Fate-heavy
  return prefer;
}

function pickIntrusionLine(X, Y, Z, tally, c) {
  if (c < 0.55) return null; // hold back until confident

  // A few flavored lines. Add more; gate by axes.
  if (Z >= 3 && X <= -1) {
    return "You’re measuring the doorframe again. You will fit.";
  }
  if (Z <= -3 && X >= 2) {
    return "You never answer the question asked. That’s why you’re interesting.";
  }
  if (Y >= 3) {
    return "One of you keeps tugging the plan sideways. They’re usually right… at first.";
  }
  if ((tally.Wrong|0) >= 3 && (tally.total|0) >= 6) {
    return "Stop performing for each other. I already know.";
  }
  return null;
}
