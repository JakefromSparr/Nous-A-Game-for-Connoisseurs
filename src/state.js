// src/state.js
import { SCREENS } from './constants/screens.js';
import { validateOnLoad, sanitizeBeforeSave } from './validator.js';

/* ===========================
   Defaults & small helpers
   =========================== */
export const DEFAULTS = {
  baseT0: 4,           // starting thread for Round 1
  roundsToWin: 3,      // how many rounds to win the game
  threadCapBase: 5,    // not yet used; placeholder for future caps
};

const emptyTally = () => ({ A: 0, B: 0, C: 0 });

function buildInitialState() {
  return {
    schemaVersion: 1,

    /* ---- Screen ---- */
    currentScreen: SCREENS.WELCOME,

    /* ---- Meta / progression ---- */
    lives: 0,
    score: 0,
    roundsToWin: DEFAULTS.roundsToWin,
    roundsWon: 0,
    roundNumber: 1,

    /* ---- Round runtime ---- */
    roundScore: 0,
    notWrongCount: 0,
    thread: 0,
    nextRoundT0: DEFAULTS.baseT0,   // seed for next round’s starting thread
    weavePrimed: false,             // spend thread to double next Q points
    pendingBank: 0,                 // reserved for future use (bank animations, etc.)

    /* ---- Difficulty / gating ----
       The question engine chooses from tiers <= difficultyLevel. */
    audacity: 0,
    difficultyLevel: 1,
    correctAnswersThisDifficulty: 0,

    /* ---- Decks / IDs ---- */
    fateCardDeck: [],
    questionDeck: [],
    answeredQuestionIds: new Set(),
    completedFateCardIds: new Set(),
    questionHistory: {},

    /* ---- Fate state ---- */
    activeRoundEffects: [],
    activePowerUps: [],
    currentFateCard: null,
    pendingFateCard: null,
    activeFateCard: null,
    fateChoices: [null, null, null],

    /* ---- Question state ---- */
    currentQuestion: null,
    currentAnswers: [],
    currentCategory: '',
    roundAnswerTally: emptyTally(),

    /* ---- Traits / routing (group-mind read) ---- */
    traits: { X: 0, Y: 0, Z: 0 },                  // running vector (-9..+9 clamp applied elsewhere)
    classTally: { TYPICAL: 0, REVELATORY: 0, WRONG: 0 }, // optional running counts by outcome class
    traitRead: null,                                // { routingNudge: string[], flavor: string, ... } (ephemeral)
    traitSummary: null,                             // last computed summary blob (ephemeral, safe to drop)
    tierSeen: {},                                   // novelty stats per tier (used by soft-bias)

    /* ---- Round summary ---- */
    roundEndedBy: null, // 'SEVER', 'TIE_OFF', etc.
    roundWon: false,

    /* ---- Tutorial (non-persistent) ---- */
    tutorial: { active: false, step: 0, lastQ: null },
  };
}

/* ===========================
   Canonical in-memory state
   =========================== */
let gameState = buildInitialState();

/* ===========================
   CRUD helpers
   =========================== */
const patch = (partial = {}) => Object.assign(gameState, partial);
const getState = () => gameState;

/* ===========================
   Persistence
   =========================== */
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

    // Merge parsed data into current shape (keeps any new runtime fields),
    // but always reset transient tutorial/session fields as desired.
    gameState = { ...gameState, ...res.data, tutorial: { active: false, step: 0, lastQ: null } };
    return true;
  } catch (e) {
    console.warn('[LOAD] failed to parse save, starting fresh', e);
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

/* ===========================
   Deck loader (dynamic import)
   =========================== */
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

/* ===========================
   Lifecycle
   =========================== */
function initializeGame(participants = 1) {
  patch({
    currentScreen: SCREENS.GAME_LOBBY,

    // Meta / progression
    lives: Math.max(1, Number(participants) || 1) + 1, // little buffer for the group
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

    // Difficulty / gating
    audacity: 0,
    difficultyLevel: 1,
    correctAnswersThisDifficulty: 0,

    // Reset run-specific ID sets/history
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

    // Traits / routing
    traits: { X: 0, Y: 0, Z: 0 },
    classTally: { TYPICAL: 0, REVELATORY: 0, WRONG: 0 },
    traitRead: null,
    traitSummary: null,
    tierSeen: {},

    // Round summary
    roundEndedBy: null,
    roundWon: false,

    // Tutorial (explicitly off at a new game start)
    tutorial: { active: false, step: 0, lastQ: null },
  });
}

function resetGame() {
  gameState = buildInitialState();
}

/* Spend 1 thread in Round Lobby to prime double points on next question */
function spendThreadToWeave() {
  if (gameState.thread <= 0 || gameState.weavePrimed) return false;
  patch({ thread: gameState.thread - 1, weavePrimed: true });
  return true;
}

/* ===========================
   Public API
   =========================== */
export const State = {
  // data
  patch,
  getState,

  // lifecycle
  loadData,
  initializeGame,
  resetGame,

  // persistence
  saveGame,
  loadGame,
  resetSave,

  // actions
  spendThreadToWeave,
};

// Handy for quick dev pokes in the console
if (typeof window !== 'undefined') window.State = State;
