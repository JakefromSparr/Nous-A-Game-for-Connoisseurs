// src/engine/roundEngine.js
import { DEFAULTS } from '../state.js';
import { clamp } from './utils.js';

export function startRound(state) {
  const t0 = typeof state.nextRoundT0 === 'number' ? state.nextRoundT0 : DEFAULTS.baseT0;

  // Apply any fate effects that trigger at round start (e.g., thread +1)
  const startFx = Array.isArray(state.activeRoundEffects) ? state.activeRoundEffects : [];
  const startBonus = startFx
    .filter(e => e?.type === 'ROUND_START')
    .reduce((sum, e) => sum + (Number(e.threadDelta) || 0), 0);

  const keepEffects = startFx.filter(e => e?.type !== 'ROUND_START');

  return {
    // fresh runtime
    roundScore: 0,
    notWrongCount: 0,
    thread: t0 + startBonus,
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

    // keep round-long effects for HUD
    activeRoundEffects: keepEffects,
  };
}

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

export function sever(state) {
  return {
    pendingBank: 0,
    lives: Math.max(0, (state.lives || 0) - 1),
    nextRoundT0: null,
    roundEndedBy: 'SEVER',
    roundWon: (state.notWrongCount || 0) >= 3,
  };
}

export function finalizeRound(state, fateResolution = {}) {
  const { scoreDelta = 0, roundScoreDelta = 0, roundScoreMultiplier = 1 } = fateResolution;
  const bankAfterMods = ((state.pendingBank || 0) + roundScoreDelta) * roundScoreMultiplier;
  const newScore = (state.score || 0) + bankAfterMods + scoreDelta;
  const wonInc   = state.roundWon ? 1 : 0;

  return {
    score: newScore,
    pendingBank: 0,

    roundsWon: (state.roundsWon || 0) + wonInc,
    roundNumber: (state.roundNumber || 1) + 1,

    // clear per-round scratch (and loaded fate)
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

    activeRoundEffects: [], // <-- unlock Tempt Fate again in Game Lobby
    roundEndedBy: null,
    roundWon: false,
  };
}
