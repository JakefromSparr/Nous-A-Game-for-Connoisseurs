// src/state.js
import { SCREENS } from './constants/screens.js';
import { validateOnLoad, sanitizeBeforeSave } from './validator.js';

/* ===== small util (local so no circular import) ===== */
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const emptyTally = () => ({ A: 0, B: 0, C: 0 });

/* ===== Defaults & helpers ===== */
export const DEFAULTS = {
  baseT0: 4,            // starting thread per round
  roundsToWin: 3,
  threadCapBase: 5,     // cap = 5 + floor(audacity/2) (used in roundEngine)
  difficultyMax: 7,     // global maximum available tiers in content
};

const SAVE_KEY = 'nous-save';

/* ===== Canonical initial state ===== */
let gameState = {
  schemaVersion: 1,
  currentScreen: SCREENS.WELCOME,

  // Meta / progression
  lives: 0,                           // set via initializeGame(participants)
  score: 0,
  roundsToWin: DEFAULTS.roundsToWin,
  roundsWon: 0,
  roundNumber: 1,

  // Round runtime
  roundScore: 0,
  notWrongCount: 0,
  thread: 0,
  nextRoundT0: DEFAULTS.baseT0,
  weavePrimed: false,
  pendingBank: 0,

  // Difficulty
  startingDifficulty: 3,              // user-chosen starting cap (1..3)
  difficultyLevel: 1,                 // current unlocked max (can grow to 7)
  correctAnswersThisDifficulty: 0,    // increments on TYPICAL/REVELATORY
  audacity: 0,

  // Decks / IDs
  fateCardDeck: [],
  questionDeck: [],
  answeredQuestionIds: new Set(),     // persisted as arrays
  completedFateCardIds: new Set(),

  // Fate state
  activeRoundEffects: [],
  activePowerUps: [],
  currentFateCard: null,
  pendingFateCard: null,
  activeFateCard: null,
  fateChoices: [null, null, null],

  // Question state
  currentQuestion: null,
  currentAnswers: [],
  currentCategory: '',
  roundAnswerTally: emptyTally(),

  // Traits
  traits: { X: 0, Y: 0, Z: 0 },

  // Round summary bookkeeping
  roundEndedBy: null,                 // 'TIE_OFF' | 'SEVER' | null
  roundWon: false,
};

/* ===== CRUD helpers ===== */
const patch = (partial = {}) => Object.assign(gameState, partial);
const getState = () => gameState;

/* ===== Persistence ===== */
const saveGame = () => {
  try {
    const { ok, data, errors } = sanitizeBeforeSave(gameState);
    if (!ok) console.warn('[SAVE] state normalized with warnings', errors);
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('[SAVE]', e);
    return false;
  }
};

const loadGame = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!raw) return false;
    const res = validateOnLoad(raw);  // transforms arrays -> Sets, checks invariants
    if (!res.ok) return false;
    gameState = { ...gameState, ...res.data };
    return true;
  } catch {
    return false;
  }
};

const clearSave = () => {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
  // hard reset to a clean welcome state
  gameState = {
    ...gameState,
    currentScreen: SCREENS.WELCOME,

    lives: 0,
    score: 0,
    roundsWon: 0,
    roundNumber: 1,

    roundScore: 0,
    notWrongCount: 0,
    thread: 0,
    nextRoundT0: DEFAULTS.baseT0,
    weavePrimed: false,
    pendingBank: 0,

    // keep user preference for startingDifficulty; reset live difficulty to it
    difficultyLevel: clamp(gameState.startingDifficulty || 1, 1, 3),
    correctAnswersThisDifficulty: 0,
    audacity: 0,

    answeredQuestionIds: new Set(),
    completedFateCardIds: new Set(),

    activeRoundEffects: [],
    activePowerUps: [],
    currentFateCard: null,
    pendingFateCard: null,
    activeFateCard: null,
    fateChoices: [null, null, null],

    currentQuestion: null,
    currentAnswers: [],
    currentCategory: '',
    roundAnswerTally: emptyTally(),

    traits: { X: 0, Y: 0, Z: 0 },

    roundEndedBy: null,
    roundWon: false,
  };
};

/* ===== Deck loader ===== */
async function loadData() {
  const [{ default: fateDeck }, { default: questionDeck }] = await Promise.all([
    import('./constants/fateDeck.js'),
    import('./constants/questionDeck.js'),
  ]);

  patch({
    fateCardDeck: Array.isArray(fateDeck) ? [...fateDeck] : [],
    questionDeck: Array.isArray(questionDeck) ? [...questionDeck] : [],
  });
}

/* ===== Lifecycle ===== */
function initializeGame(participants = 1) {
  const start = clamp(gameState.startingDifficulty || 1, 1, 3);

  patch({
    currentScreen: SCREENS.GAME_LOBBY,

    lives: Math.max(1, Number(participants) || 1) + 1, // “Strange… N+1…”
    score: 0,
    roundsWon: 0,
    roundNumber: 1,

    roundScore: 0,
    notWrongCount: 0,
    thread: 0,
    nextRoundT0: DEFAULTS.baseT0,
    weavePrimed: false,
    pendingBank: 0,

    // set current difficulty to the chosen starting tier (1..3)
    difficultyLevel: start,
    correctAnswersThisDifficulty: 0,
    audacity: 0,

    answeredQuestionIds: new Set(),
    completedFateCardIds: new Set(),

    activeRoundEffects: [],
    activePowerUps: [],
    currentFateCard: null,
    pendingFateCard: null,
    activeFateCard: null,
    fateChoices: [null, null, null],

    currentQuestion: null,
    currentAnswers: [],
    currentCategory: '',
    roundAnswerTally: emptyTally(),

    traits: { X: 0, Y: 0, Z: 0 },

    roundEndedBy: null,
    roundWon: false,
  });
}

/* ===== Mutators / helpers ===== */

// Spend 1 thread in Round Lobby to prime double points for the next question
function spendThreadToWeave() {
  if (gameState.thread <= 0 || gameState.weavePrimed) return false;
  patch({ thread: gameState.thread - 1, weavePrimed: true });
  return true;
}

// Called after each reveal accept (so we know the outcome)
function noteAnswerOutcome(kindUpper) {
  const k = String(kindUpper || '').toUpperCase();
  const isNotWrong = (k === 'TYPICAL' || k === 'REVELATORY');
  if (!isNotWrong) return;

  const nextCount = (gameState.correctAnswersThisDifficulty || 0) + 1;
  let nextLevel = gameState.difficultyLevel || 1;

  // Every 4 not-wrong answers → unlock next difficulty (up to 7)
  if (nextCount >= 4) {
    nextLevel = clamp(nextLevel + 1, 1, DEFAULTS.difficultyMax);
  }

  patch({
    correctAnswersThisDifficulty: nextCount >= 4 ? 0 : nextCount,
    difficultyLevel: nextLevel,
  });
}

// Options: cycle startingDifficulty (1..3). If no game is running yet,
// also update current difficulty to match (so the lobby uses it immediately).
function setStartingDifficulty(next) {
  const val = clamp(Number(next) || 1, 1, 3);
  const isFresh = (gameState.score === 0 && gameState.roundNumber <= 1 && gameState.roundsWon === 0);
  patch({
    startingDifficulty: val,
    difficultyLevel: isFresh ? val : gameState.difficultyLevel,
  });
}

/* ===== Public API ===== */
export const State = {
  // data
  patch,
  getState,

  // lifecycle
  loadData,
  initializeGame,

  // persistence
  saveGame,
  loadGame,
  clearSave,

  // actions that mutate state (used by router/engines)
  spendThreadToWeave,
  noteAnswerOutcome,
  setStartingDifficulty,
};

if (typeof window !== 'undefined') window.State = State;
