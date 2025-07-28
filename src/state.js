// src/state.js
import { SCREENS } from './constants/screens.js';
import { validateOnLoad, sanitizeBeforeSave } from './validator.js';

// ===== Defaults & helpers =====
export const DEFAULTS = {
  baseT0: 4,           // starting thread length per round
  roundsToWin: 3,
  threadCapBase: 5,    // cap = 5 + floor(audacity/2) (used in roundEngine, not here)
};

const emptyTally = () => ({ A: 0, B: 0, C: 0 });

// ===== Canonical initial state =====
let gameState = {
  schemaVersion: 1,
  currentScreen: SCREENS.WELCOME,

  // Meta / progression
  lives: 0,                           // set via initializeGame(participants)
  score: 0,                           // global score (updated at Fate Result)
  roundsToWin: DEFAULTS.roundsToWin,
  roundsWon: 0,
  roundNumber: 1,

  // Round runtime
  roundScore: 0,
  notWrongCount: 0,
  thread: 0,                          // set when a round starts
  nextRoundT0: DEFAULTS.baseT0,       // carry-over seed for next startRound
  weavePrimed: false,
  pendingBank: 0,                     // what will be added to score at Fate Result

  // Difficulty / gating
  audacity: 0,
  difficultyLevel: 1,
  correctAnswersThisDifficulty: 0,

  // Decks / IDs
  fateCardDeck: [],
  questionDeck: [],
  answeredQuestionIds: new Set(),     // persist as arrays
  completedFateCardIds: new Set(),

  // Fate state
  activeRoundEffects: [],
  activePowerUps: [],
  currentFateCard: null,
  pendingFateCard: null,              // set by Q / reveal
  activeFateCard: null,
  fateChoices: [null, null, null],    // each: { id, label, ... } | null

  // Question state
  currentQuestion: null,
  currentAnswers: [],                 // [{key:'A'|'B'|'C', label:string}]
  currentCategory: '',
  roundAnswerTally: emptyTally(),

  // Traits
  traits: { X: 0, Y: 0, Z: 0 },

  // Round summary bookkeeping
  roundEndedBy: null,                 // 'TIE_OFF' | 'SEVER' | null
  roundWon: false,                    // computed at end
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
    const res = validateOnLoad(raw);  // transforms arrays -> Sets, checks invariants
    if (!res.ok) return false;
    gameState = { ...gameState, ...res.data };
    return true;
  } catch {
    return false;
  }
};

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
    currentScreen: SCREENS.GAME_LOBBY, // Go to lobby after setup

    // game meta
    lives: Math.max(1, Number(participants) || 1) + 1, // “Strange, I’m seeing N+1…”
    score: 0,
    roundsWon: 0,
    roundNumber: 1,

    // round seed (actual thread set on startNewRound)
    roundScore: 0,
    notWrongCount: 0,
    thread: 0,
    nextRoundT0: DEFAULTS.baseT0,
    weavePrimed: false,
    pendingBank: 0,

    // gating
    audacity: 0,
    difficultyLevel: 1,
    correctAnswersThisDifficulty: 0,

    // IDs / decks bookkeeping
    answeredQuestionIds: new Set(),
    completedFateCardIds: new Set(),

    // fate/question state
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

    // traits
    traits: { X: 0, Y: 0, Z: 0 },

    // summary
    roundEndedBy: null,
    roundWon: false,
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

  // actions that mutate state (used by router/engines)
  spendThreadToWeave,
};

if (typeof window !== 'undefined') window.State = State;
