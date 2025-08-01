// src/state.js
import { SCREENS } from './constants/screens.js';
import { validateOnLoad, sanitizeBeforeSave } from './validator.js';

// ===== Defaults & helpers =====
export const DEFAULTS = {
  baseT0: 4,
  roundsToWin: 3,
  threadCapBase: 5,
};

const emptyTally = () => ({ A: 0, B: 0, C: 0 });

// ===== Canonical initial state =====
let gameState = {
  schemaVersion: 1,
  currentScreen: SCREENS.WELCOME,

  // Meta / progression
  lives: 0,
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

  // Difficulty / gating (game chooses tiers <= difficultyLevel)
  audacity: 0,
  difficultyLevel: 1,
  correctAnswersThisDifficulty: 0,

  // Decks / IDs
  fateCardDeck: [],
  questionDeck: [],
  answeredQuestionIds: new Set(),
  completedFateCardIds: new Set(),
  questionHistory: {},

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

  // Round summary
  roundEndedBy: null,
  roundWon: false,

  // Tutorial (non-persistent; validator strips unknown keys on save)
  tutorial: { active: false, step: 0, lastQ: null },
};

// ===== CRUD helpers =====
const patch = (partial = {}) => Object.assign(gameState, partial);
const getState = () => gameState;

// ===== Persistence =====
const SAVE_KEY = 'nous-save';

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
    const res = validateOnLoad(raw);
    if (!res.ok) return false;
    // merge parsed data into current shape (tutorial gets reset implicitly)
    gameState = { ...gameState, ...res.data };
    return true;
  } catch {
    return false;
  }
};

function resetSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}

// ===== Deck loader =====
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

// ===== Lifecycle =====
function initializeGame(participants = 1) {
  patch({
    currentScreen: SCREENS.GAME_LOBBY,

    lives: Math.max(1, Number(participants) || 1) + 1,
    score: 0,
    roundsWon: 0,
    roundNumber: 1,

    roundScore: 0,
    notWrongCount: 0,
    thread: 0,
    nextRoundT0: DEFAULTS.baseT0,
    weavePrimed: false,
    pendingBank: 0,

    audacity: 0,
    difficultyLevel: 1,
    correctAnswersThisDifficulty: 0,

    answeredQuestionIds: new Set(),
    completedFateCardIds: new Set(),
    questionHistory: {},

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

    tutorial: { active: false, step: 0, lastQ: null },
  });
}

// Spend 1 thread in Round Lobby to prime double points for the next question
function spendThreadToWeave() {
  if (gameState.thread <= 0 || gameState.weavePrimed) return false;
  patch({ thread: gameState.thread - 1, weavePrimed: true });
  return true;
}

// ===== Public API =====
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
  resetSave,

  // actions
  spendThreadToWeave,
};

if (typeof window !== 'undefined') window.State = State;
