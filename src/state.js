// src/state.js
import { SCREENS } from './constants/screens.js';

/* ─────────── initial store ─────────── */
let gameState = {
  currentScreen : SCREENS.WELCOME,
  lives         : 0,
  roundsToWin   : 3,
  score         : 0,
  roundScore    : 0,
  roundNumber   : 1,
  traits        : { X:0, Y:0, Z:0 },
  fateCardDeck  : [],
  questionDeck  : []
};

/* ─────────── CRUD helpers ─────────── */
const patch    = (partial={}) => Object.assign(gameState, partial);
const getState = ()            => gameState;

const saveGame = () => {
  try { localStorage.setItem('nous-save', JSON.stringify(gameState)); return true; }
  catch(e){ console.error('[SAVE]',e); return false; }
};

const loadGame = () => {
  try {
    const raw = localStorage.getItem('nous-save');
    if (!raw) return false;
    patch(JSON.parse(raw));
    return true;
  } catch(e){ console.error('[LOAD]',e); return false; }
};

/* ─────────── deck loader ─────────── */
async function loadData () {
  /*  fate = JS module, questions = pure JSON  */
  const [{ default: fateDeck }, { default: questions }] = await Promise.all([
    import('./constants/fateDeck.js'),
    import('./constants/questionDeck.json', { with:{ type:'json' } })
  ]);

  /* normalise questions array (in case it’s wrapped) */
  const qDeck = Array.isArray(questions.questions) ? questions.questions : questions;

  patch({
    fateCardDeck : [...fateDeck],
    questionDeck : [...qDeck]
  });
}

/* ─────────── game init ─────────── */
function initializeGame (participants=1){
  patch({
    currentScreen : SCREENS.WAITING_ROOM,
    lives         : participants + 1,
    score         : 0,
    roundsWon     : 0,
    roundNumber   : 1,
    roundScore    : 0,
    thread        : 4,
    audacity      : 0,
    difficultyLevel            : 1,
    correctAnswersThisDifficulty: 0,
    answeredQuestionIds : new Set(),
    completedFateCardIds: new Set(),
    activeRoundEffects  : [],
    currentFateCard     : null,
    pendingFateCard     : null,
    activeFateCard      : null,
    currentQuestion     : null,
    currentAnswers      : [],
    notWrongCount       : 0,
    currentCategory     : 'Mind, Past',
    roundAnswerTally    : { A:0, B:0, C:0 },
    traits              : { X:0, Y:0, Z:0 },
    activePowerUps      : [],
    answeredThisRound   : [],
  });
}

/* ─────────── public API ─────────── */
export const State = {
  /* data */
  patch, getState,

  /* lifecycle */
  loadData, initializeGame,
  saveGame, loadGame
};

if (typeof window!=='undefined') window.State = State;
