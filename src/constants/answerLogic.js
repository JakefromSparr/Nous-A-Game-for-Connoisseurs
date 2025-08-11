// src/constants/answerLogic.js

export const OUTCOME = {
  TYPICAL: 'TYPICAL',
  REVELATORY: 'REVELATORY',
  WRONG: 'WRONG',
};

export const OUTCOME_EFFECT = {
  TYPICAL:    { points: 2, threadDelta:  0 },
  REVELATORY: { points: 1, threadDelta: +1 },
  WRONG:      { points: 0, threadDelta: -1 },
};

export const WEAVE = Object.freeze({ cost: 1, multiplier: 2 });

/**
 * Base trait vector by outcome class (tempered).
 * These are multiplied by per-question axisWeight (traitConfig), with
 * possible overrides by class/answer (esp. Tier-5).
 *
 * Axes:
 *  X — Logical style: Analytical (–) ↔ Innovative (+)
 *  Y — Framing: Conventional (–) ↔ Radical (+)
 *  Z — Epistemic: Figurative (–) ↔ Empirical (+)
 */
export const CLASS_TRAIT_BASE = Object.freeze({
  TYPICAL:    { X: -0.4, Y: -0.6, Z: +0.8 }, // literal, conventional, empirical
  REVELATORY: { X: +0.8, Y: +0.7, Z: -0.8 }, // lateral, radical, figurative
  WRONG:      { X: -0.6, Y: +0.2, Z: -0.2 }, // incoherent tilt; slight radical/figurative
});
