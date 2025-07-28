// src/engine/roundEngine.js
import { DEFAULTS } from '../state.js';
import { clamp } from './utils.js';

/**
 * Start a round: use nextRoundT0 if present, else baseT0.
 * Does NOT increment roundNumber (that happens at finalizeRound).
 * Returns a patch; router sets screen to ROUND_LOBBY.
 */
export function startRound(state) {
  const t0 = typeof state.nextRoundT0 === 'number' ? state.nextRoundT0 : DEFAULTS.baseT0;

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
  const nextRoundT0 = clamp((DEFAULTS.baseT0 + leftoverThread), 3, threadCap);

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
 * - Add pendingBank to global score.
 * - Increment roundsWon if roundWon.
 * - Advance roundNumber.
 * - Reset round-local fields for lobby.
 * nextRoundT0 remains whatever tieOff/sever set.
 */
export function finalizeRound(state) {
  const newScore = (state.score || 0) + (state.pendingBank || 0);
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

    roundEndedBy: null,
    roundWon: false,
  };
}
