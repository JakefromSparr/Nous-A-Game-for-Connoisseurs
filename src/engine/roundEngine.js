// src/engine/roundEngine.js
import { DEFAULTS } from '../state.js';
import { clamp } from './utils.js';

/**
 * Start a round: use nextRoundT0 if present, else baseT0.
 * Applies any one-shot ROUND_START bonuses to the thread, then clears them.
 * Does NOT increment roundNumber (that happens in finalizeRound/finalizeSever).
 * Returns a patch; router sets screen to ROUND_LOBBY.
 */
export function startRound(state) {
  const baseT0 = (typeof state.nextRoundT0 === 'number' && state.nextRoundT0 != null)
    ? state.nextRoundT0
    : DEFAULTS.baseT0;

  // Apply one-shot ROUND_START effects (e.g., Scholar's Boon thread +1), then remove them.
  const effects = Array.isArray(state.activeRoundEffects) ? state.activeRoundEffects : [];
  let startBonus = 0;
  const remainingEffects = [];
  for (const e of effects) {
    if (e?.type === 'ROUND_START') {
      startBonus += Number(e.threadDelta || 0);
    } else {
      remainingEffects.push(e);
    }
  }

  const t0 = Math.max(0, baseT0 + startBonus);

  return {
    // fresh round runtime
    roundScore: 0,
    notWrongCount: 0,
    thread: t0,
    weavePrimed: false,

    // clear question/fate UI
    currentQuestion: null,
    currentAnswers: [],
    currentCategory: '',
    roundAnswerTally: { A: 0, B: 0, C: 0 },

    pendingFateCard: null,
    activeFateCard: null,
    fateChoices: [null, null, null],

    // bookkeeping
    roundEndedBy: null,
    roundWon: false,

    // consume one-shot start effects; keep other HUD tags
    activeRoundEffects: remainingEffects,
  };
}

/**
 * Player chooses to end the round (Tie Off) from Round Lobby.
 * - Bank roundScore into pendingBank.
 * - Compute carry-over thread for next round (nextRoundT0).
 * - Mark win if notWrongCount >= 3.
 * Global score is NOT updated here; that happens at Fate Resolution.
 */
export function tieOff(state) {
  const leftoverThread = Math.max(0, state.thread || 0);
  const threadCap = DEFAULTS.threadCapBase + Math.floor((state.audacity || 0) / 2);

  // next round's baseline is baseT0 + leftover, clamped to [3, threadCap]
  const nextRoundT0 = clamp(DEFAULTS.baseT0 + leftoverThread, 3, threadCap);

  return {
    pendingBank: state.roundScore || 0,
    nextRoundT0,
    roundEndedBy: 'TIE_OFF',
    roundWon: (state.notWrongCount || 0) >= 3,
  };
}

/**
 * Forced end (Sever): thread <= 0 after a question resolution.
 * - Lose 1 life.
 * - Bank 0.
 * - No carry-over (nextRoundT0 = null so next round starts at baseT0).
 * Round advance + scratch clear happen in finalizeSever() after the Sever screen.
 */
export function sever(state) {
  return {
    pendingBank: 0,
    lives: Math.max(0, (state.lives || 0) - 1),
    nextRoundT0: null,
    roundEndedBy: 'SEVER',
    roundWon: (state.notWrongCount || 0) >= 3,
  };
}

/**
 * Finalize round at Fate Resolution → Accept:
 * - Apply fateResolution to pending bank/global score
 * - Add adjusted bank to global score
 * - Increment roundsWon if roundWon
 * - Advance roundNumber
 * - Reset round-local fields
 * nextRoundT0 remains whatever tieOff/sever set earlier.
 */
export function finalizeRound(state, fateResolution = {}) {
  const {
    scoreDelta = 0,
    roundScoreDelta = 0,
    roundScoreMultiplier = 1,
  } = fateResolution;

  const rawBank = (state.pendingBank || 0) + roundScoreDelta;
  const bank = Math.max(0, Math.floor(rawBank * roundScoreMultiplier));

  const newScore = (state.score || 0) + bank + scoreDelta;
  const wonInc   = state.roundWon ? 1 : 0;

  return {
    score: newScore,
    pendingBank: 0,

    roundsWon: (state.roundsWon || 0) + wonInc,
    roundNumber: (state.roundNumber || 1) + 1,

    // clear round-local scratch
    roundScore: 0,
    notWrongCount: 0,
    thread: 0,
    weavePrimed: false,

    currentQuestion: null,
    currentAnswers: [],
    currentCategory: '',
    roundAnswerTally: { A: 0, B: 0, C: 0 },

    pendingFateCard: null,
    activeFateCard: null,
    fateChoices: [null, null, null],

    activeRoundEffects: [],

    roundEndedBy: null,
    roundWon: false,
  };
}

/**
 * Finalize after a Sever (Thread <= 0 path):
 * - Do NOT touch score/bank (bank is already 0)
 * - Advance roundNumber
 * - Clear round-local fields and HUD tags
 * Caller should route to GAME_OVER if lives <= 0; otherwise back to GAME_LOBBY.
 */
export function finalizeSever(state) {
  return {
    pendingBank: 0,

    // no change to score or roundsWon
    roundNumber: (state.roundNumber || 1) + 1,

    // clear round-local scratch
    roundScore: 0,
    notWrongCount: 0,
    thread: 0,
    weavePrimed: false,

    currentQuestion: null,
    currentAnswers: [],
    currentCategory: '',
    roundAnswerTally: { A: 0, B: 0, C: 0 },

    pendingFateCard: null,
    activeFateCard: null,
    fateChoices: [null, null, null],

    activeRoundEffects: [],

    roundEndedBy: null,
    roundWon: false,
  };
}
