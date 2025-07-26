// src/engine/utils.js
/**
 * Return a new array with items shuffled in-place (Fisher-Yates).
 * If you don’t want mutation, call with [...arr].
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Inclusive random integer helper (0-max by default). */
export function randInt(max, min = 0) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Return a random element from an array (undefined if empty). */
export function sample(arr) {
  return arr.length ? arr[randInt(arr.length - 1)] : undefined;
}

export const clamp = (n,min,max)=>Math.min(max,Math.max(min,n));
