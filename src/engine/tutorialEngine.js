// src/engine/tutorialEngine.js
// Lightweight, non-persisted tutorial engine.
// Uses existing screens (ROUND_LOBBY / QUESTION / REVEAL).
//
// Design (two loops of one riddle):
//   1) First Pull → ask the riddle → all choices are "not wrong" (treated as REVELATORY)
//   2) After first Reveal → return to Round Lobby, *encourage weaving*
//   3) Second Pull → same riddle; the previously chosen answer is disabled; weave doubles points
//   4) After Reveal → clean up and return to Game Lobby
//
// Important: this engine NEVER writes new keys into persisted state. It uses
// internal module variables for its own control flow. Patches it returns only
// touch fields you already have (thread, roundScore, currentQuestion, ...).

import { State } from '../state.js';
import { SCREENS } from '../constants/screens.js';
import { OUTCOME_EFFECT, WEAVE } from '../constants/answerLogic.js';

const EFFECT_REVELATORY = OUTCOME_EFFECT.REVELATORY || { points: 1, threadDelta: 1 };

// --- Internal tutorial control (NOT persisted) ---
let T_ACTIVE = false;         // is tutorial running?
let T_STEP   = 0;             // 0 = first loop, 1 = second loop
let T_LAST_KEY = null;        // key chosen in loop 1 ('A'|'B'|'C')
let T_REQUIRE_WEAVE = false;  // during loop 2, suggest/enforce weaving before Pull?

// --- Tutorial content (local; not part of the main deck) ---
const TUT_Q = {
  id: 'TUT001',
  category: 'Tutorial',
  title: 'What has wheels and flies?',
  text:
    'Welcome to Nous.\n' +
    'Pick what “has wheels and flies.”\n' +
    'Here’s the trick: in this tutorial, every angle is defensible.',
  answers: [
    {
      key: 'A',
      label: 'A Plane',
      explanation:
        'Planes “have wheels” (landing gear) and they literally fly. It’s literal; it’s also correct.',
    },
    {
      key: 'B',
      label: 'A Dictionary',
      explanation:
        'Both “wheels” and “flies” are inside it. The answer plays with words, not objects.',
    },
    {
      key: 'C',
      label: 'A Garbage Truck',
      explanation:
        'Classic riddle logic: it has wheels, and flies often follow it. Folk-knowledge counts.',
    },
  ],
};

// Utilities
function buildAnswers(disabledKey /* string|null */) {
  const keys = ['A', 'B', 'C'];
  return TUT_Q.answers.map((a, i) => ({
    key: keys[i],
    label: a.label,
    // UI will respect `.disabled` (handleAction already guards on QUESTION)
    disabled: disabledKey ? keys[i] === disabledKey : false,
    // Keep explanation for the Reveal screen
    explanation: a.explanation || '',
  }));
}

function clearQuestionPatch() {
  return {
    currentQuestion: null,
    currentAnswers: [],
    currentCategory: '',
  };
}

// --- Public API ---

/** Is the tutorial currently running? (Non-persisted) */
export function isActive() {
  return !!T_ACTIVE;
}

/** Start tutorial: reset internal flow and show the Round Lobby. */
export function start() {
  T_ACTIVE = true;
  T_STEP = 0;
  T_LAST_KEY = null;
  T_REQUIRE_WEAVE = false;

  const S = State.getState();

  // Put the player into a “fresh round-like” state, but do not alter global win/lives.
  // We keep this minimal so it won’t collide with validators.
  return {
    // light reset of round runtime
    roundScore: 0,
    notWrongCount: 0,
    thread: Math.max(3, Number(S.thread || 0) || 4), // ensure enough to pull twice
    weavePrimed: false,

    // clear any stray question
    ...clearQuestionPatch(),

    // tally (safe default)
    roundAnswerTally: { A: 0, B: 0, C: 0 },

    // ensure we’re visually in the round lobby
    // (router sets currentScreen itself; we return next from handleAction)
  };
}

/**
 * Tutorial "Pull": emulate the baseline cost, then set the tutorial question.
 * If we’re on step 1 and weaving is required/suggested, we can softly block until weavePrimed.
 */
export function pull() {
  if (!T_ACTIVE) return null;

  const S = State.getState();

  // Suggest weaving before the second pull.
  if (T_STEP === 1 && T_REQUIRE_WEAVE && !S.weavePrimed) {
    // Soft block: do not leave the lobby if they haven’t woven yet.
    // You can show a hint string via your UI layer if desired.
    return {
      patch: {},
      next: SCREENS.ROUND_LOBBY,
    };
  }

  if ((S.thread || 0) <= 0) {
    return { patch: {}, next: SCREENS.ROUND_LOBBY };
  }

  const afterPull = (S.thread || 0) - 1;
  const disabled = T_STEP === 1 ? T_LAST_KEY : null;

  return {
    patch: {
      thread: afterPull,
      currentQuestion: {
        id: TUT_Q.id,
        category: TUT_Q.category,
        title: TUT_Q.title,
        text: TUT_Q.text,
      },
      currentAnswers: buildAnswers(disabled),
      currentCategory: 'Tutorial',
    },
    next: SCREENS.QUESTION,
  };
}

/** Evaluate a chosen answer – in tutorial all answers are treated as REVELATORY (not wrong). */
export function evaluate(choiceIndex) {
  if (!T_ACTIVE) return { patch: {} };

  const S = State.getState();
  const a = S.currentAnswers?.[choiceIndex];
  if (!a) return { patch: {} };

  // force “not wrong” (revelatory) behavior
  const weaveMult = S.weavePrimed ? (WEAVE?.multiplier || 2) : 1;
  const gainedPts = (EFFECT_REVELATORY.points || 0) * weaveMult;

  // update tally
  const key = (a.key || '').toUpperCase();
  const tally = { ...(S.roundAnswerTally || { A: 0, B: 0, C: 0 }) };
  tally[key] = (tally[key] || 0) + 1;

  // remember selected key on loop 0 so we can disable it for loop 1
  if (T_STEP === 0) T_LAST_KEY = key;

  const patch = {
    roundScore: (S.roundScore || 0) + gainedPts,
    thread: (S.thread || 0) + (EFFECT_REVELATORY.threadDelta || 0),
    weavePrimed: false, // consume weave if it was primed

    roundAnswerTally: tally,
    notWrongCount: (S.notWrongCount || 0) + 1,

    // keep for REVEAL UI
    currentQuestion: S.currentQuestion,
    currentAnswers: S.currentAnswers,

    lastOutcome: {
      kind: 'REVELATORY',
      chosenKey: key,
      chosenLabel: a.label || key,
      pointsGained: gainedPts,
      threadDelta: EFFECT_REVELATORY.threadDelta || 0,
      explanation: a.explanation || '',
      questionText: S.currentQuestion?.text || S.currentQuestion?.title || '',
    },
  };

  return { patch };
}

/**
 * After the tutorial REVEAL: step through the flow.
 *  - After first reveal: return to ROUND_LOBBY, suggest weaving.
 *  - After second reveal: end tutorial → clean up and return to GAME_LOBBY.
 */
export function afterRevealAccept() {
  if (!T_ACTIVE) return { next: SCREENS.ROUND_LOBBY };

  if (T_STEP === 0) {
    // guide to weave on the next loop
    T_STEP = 1;
    T_REQUIRE_WEAVE = true;
    return { next: SCREENS.ROUND_LOBBY };
  }

  // second loop finished → end tutorial
  return finish();
}

/** Abort tutorial immediately (e.g., if user backs out). */
export function cancel() {
  if (!T_ACTIVE) return { patch: {} };
  return finish();
}

// --- Internals ---

function finish() {
  T_ACTIVE = false;
  T_STEP = 0;
  T_LAST_KEY = null;
  T_REQUIRE_WEAVE = false;

  // Light cleanup of question UI; do not touch global score/lives.
  return {
    patch: {
      weavePrimed: false,
      ...clearQuestionPatch(),
    },
    next: SCREENS.GAME_LOBBY,
  };
}
