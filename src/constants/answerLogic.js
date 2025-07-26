export const CLASS_SCORES = Object.freeze({
  Typical    : { points: 2, thread:  0 },
  Revelatory : { points: 1, thread:  1 },
  Wrong      : { points: 0, thread: -1 }
});

export const TRAIT_MAP = Object.freeze({
  Typical    : { X:+1,  Y: 0, Z:-1 },
  Revelatory : { X: 0,  Y:+2, Z:+1 },
  Wrong      : { X:-1,  Y:-1, Z: 0 }
});

export const CLASS_TRAIT_BASE = Object.freeze({
  Typical    : { X:-1, Y:-1, Z:-1 },
  Revelatory : { X:+2, Y:+3, Z:+2 },
  Wrong      : { X:-2, Y:-2, Z:-2 }
});
