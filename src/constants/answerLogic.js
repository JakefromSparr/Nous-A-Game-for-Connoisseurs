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

export const WEAVE = { cost: 1, multiplier: 2 };

// Base trait vector by outcome class
export const CLASS_TRAIT_BASE = Object.freeze({
  TYPICAL:    { X: -1, Y: -1, Z: -1 },
  REVELATORY: { X:  2, Y:  3, Z:  2 },
  WRONG:      { X: -2, Y: -2, Z: -2 },
});
