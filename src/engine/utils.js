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

export const clamp = (n,min,max)=>Math.min(max,Math.max(min,n));
