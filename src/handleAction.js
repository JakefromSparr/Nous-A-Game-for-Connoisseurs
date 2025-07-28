// src/handleAction.js
import { SCREENS } from './constants/screens.js';
import { ROUTES }  from './constants/routes.js';
import { State }   from './state.js';
import { UI }      from './ui.js';

import * as Q     from './engine/questionEngine.js';
import * as Fate  from './engine/fateEngine.js';
import * as Round from './engine/roundEngine.js';

/* ---------------- Internal helpers ---------------- */

function applyResult({ patch, next } = {}) {
  if (patch) State.patch(patch);

  const current = State.getState().currentScreen;
  const target  = next ?? current;

  if (target !== current) {
    State.patch({ currentScreen: target });
    UI.updateScreen(target);
  }

  // Evaluate labels with current state and compute disabled rules
  const cfg = ROUTES[target];
  const st  = State.getState();
  const labels = cfg.labels.map(l => (typeof l === 'function' ? l(st) : l));

  // NOTE: UI.setButtonLabels should accept (labels, isDisabledFn)
  UI.setButtonLabels(labels, (i) => {
    // Base rule: null action means disabled (taunt)
    if (cfg.actions[i] === null) return true;

    // Fate: disable empty choices (render NOUS)
    if (target === SCREENS.FATE && st.fateChoices[i] == null) return true;

    // Game Lobby: center disabled when no pending fate
    if (target === SCREENS.GAME_LOBBY && i === 1 && !st.pendingFateCard) return true;

    return false;
  });

  UI.updateDisplayValues(st);
  renderScreenBody(target, st);   // ensure screen body is populated (Question/Reveal/Fate)

  State.saveGame?.();
}

// Normalize state → UI renderers
function renderScreenBody(target, st) {
  if (target === SCREENS.QUESTION && st.currentQuestion) {
    const q = st.currentQuestion;
    const choices = {
      A: st.currentAnswers?.find(a => a.key === 'A')?.label || '',
      B: st.currentAnswers?.find(a => a.key === 'B')?.label || '',
      C: st.currentAnswers?.find(a => a.key === 'C')?.label || '',
    };
    UI.showQuestion({ title: q.title || '', text: q.text || '', choices });
  }
  if (target === SCREENS.FATE && st.activeFateCard) {
    UI.showFateCard(st.activeFateCard);
  }
  if (target === SCREENS.REVEAL && st.lastOutcome) {
    const r = st.lastOutcome;
    const outcomeText = `+${r.pointsGained || 0} points, ${r.threadDelta >= 0 ? '+' : ''}${r.threadDelta || 0} thread`;
    UI.showResult({
      correct: r.kind !== 'WRONG',
      question: r.questionText || '',
      answer: r.chosenLabel || '',
      explanation: r.explanation || '',
      outcomeText,
    });
  }
}

// Pull baseline cost (−1 thread) then draw a question
function doPull() {
  const s = State.getState();
  if (s.thread <= 0) return { next: SCREENS.ROUND_LOBBY };

  const afterPull = s.thread - 1;
  const { question, answers, category } = Q.drawQuestion(s);

  // If deck/tier exhausted, stay in Round Lobby (don’t show an empty Question screen)
  if (!question) {
    return { patch: { thread: afterPull }, next: SCREENS.ROUND_LOBBY };
  }

  return {
    patch: {
      thread: afterPull,
      currentQuestion: question,
      currentAnswers : answers,
      currentCategory: category ?? '',
    },
    next: SCREENS.QUESTION,
  };
}

// After REVEAL: decide where to go (Sever? Fate? Round Lobby?)
function afterRevealAccept() {
  const s = State.getState();
  if (s.thread <= 0) {
    const patch = Round.sever(s);                 // sets roundEndedBy, pendingBank=0, lives-1, thread:0
    return { patch, next: SCREENS.THREAD_SEVERED };
  }
  if (s.pendingFateCard) {
    const patch = Fate.armFate(s.pendingFateCard, s);   // sets activeFateCard + fateChoices
    return { patch, next: SCREENS.FATE };
  }
  return { next: SCREENS.ROUND_LOBBY };
}

/* ---------------- Action table ---------------- */

const ACTIONS = {
  /* WELCOME / MENUS */
  'welcome-up'      : () => (UI.moveWelcomeSelection('up'),  {}),
  'welcome-down'    : () => (UI.moveWelcomeSelection('down'),{}),
  'welcome-select'  : () => {
    const choice = UI.getWelcomeSelection();
    if (choice === 'Play')    return { next: SCREENS.WAITING_ROOM };
    if (choice === 'Rules')   return { next: SCREENS.RULES };
    if (choice === 'Options') return { next: SCREENS.OPTIONS };
    return {};
  },
  'back-to-welcome' : () => ({ next: SCREENS.WELCOME }),
  'rules-more'      : () => ({}),
  'options-down'    : () => (UI.moveOptions?.('down'),{}),
  'options-up'      : () => (UI.moveOptions?.('up'),  {}),
  'options-select'  : () => (UI.selectOption?.(),     {}),

  /* WAITING ROOM */
  'participants-down': () => (UI.adjustParticipantCount(-1), {}),
  'participants-up'  : () => (UI.adjustParticipantCount(+1), {}),
  'participants-confirm': () => {
    const n = UI.confirmParticipants();
    State.initializeGame(n);
    return { next: SCREENS.GAME_LOBBY };
  },

  /* GAME LOBBY */
  'enter-fate'     : () => {
    const s = State.getState();
    if (!s.pendingFateCard) return {};
    const patch = Fate.armFate(s.pendingFateCard, s);
    return { patch, next: SCREENS.FATE };
  },
  'to-round-lobby' : () => {
    const patch = Round.startRound(State.getState()); // engine is source of truth
    return { patch, next: SCREENS.ROUND_LOBBY };
  },
  'back-to-welcome': () => ({ next: SCREENS.WELCOME }),

  /* ROUND LOBBY */
  'tie-off' : () => {
    const patch = Round.tieOff(State.getState()); // sets pendingBank, roundWon flag, nextRoundT0
    return { patch, next: SCREENS.FATE_RESULT };
  },
  'weave'   : () => {
    State.spendThreadToWeave(); // centralize weave logic
    return {};
  },
  'pull'    : () => doPull(),

  /* QUESTION (answers 0/1/2) */
  'choose-0': () => {
    const res = Q.evaluate(0, State.getState());
    return { patch: res?.patch, next: SCREENS.REVEAL };
  },
  'choose-1': () => {
    const res = Q.evaluate(1, State.getState());
    return { patch: res?.patch, next: SCREENS.REVEAL };
  },
  'choose-2': () => {
    const res = Q.evaluate(2, State.getState());
    return { patch: res?.patch, next: SCREENS.REVEAL };
  },

  /* REVEAL */
  'reveal-fight'  : () => afterRevealAccept(),  // placeholder
  'reveal-accept' : () => afterRevealAccept(),

  /* FATE (1–3 options; empty slots disabled in UI, but we also guard here) */
  'fate-choose-0' : () => {
    const s = State.getState();
    const choice = s.fateChoices[0];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    return { patch, next: SCREENS.GAME_LOBBY };
  },
  'fate-choose-1' : () => {
    const s = State.getState();
    const choice = s.fateChoices[1];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    return { patch, next: SCREENS.GAME_LOBBY };
  },
  'fate-choose-2' : () => {
    const s = State.getState();
    const choice = s.fateChoices[2];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    return { patch, next: SCREENS.GAME_LOBBY };
  },

  /* FATE RESULT */
  'fate-fight'  : () => ({ next: SCREENS.ROUND_LOBBY }), // taunt placeholder
  'fate-accept' : () => {
    const s = State.getState();
    // Apply Fate math, then finalize round atomically in the engine
    const fateRes = Fate.resolveRound(s.roundAnswerTally, s.roundWon);
    const patch = Round.finalizeRound(s, fateRes);

    // Decide next: if the round you just finalized got you to the threshold, go to Final Reading
    const roundsWonNext = (s.roundsWon || 0) + (s.roundWon ? 1 : 0);
    const next = roundsWonNext >= (s.roundsToWin || 3)
      ? SCREENS.FINAL_READING
      : SCREENS.GAME_LOBBY;

    return { patch, next };
  },

  /* THREAD SEVERED */
  'sever-ack'   : () => ({ next: SCREENS.GAME_LOBBY }),

  /* META */
  'reading-a'   : () => ({}),
  'reading-b'   : () => ({}),
  'reading-c'   : () => ({}),
  'quit-game'   : () => ({ next: SCREENS.CREDITS }),
};

/* ---------------- Central router (0-based) ---------------- */

export function handleAction(btnIndex) {
  const state = State.getState();
  const cfg   = ROUTES[state.currentScreen];

  if (!cfg) {
    console.warn(`Unknown screen: ${state.currentScreen}`);
    return;
  }

  const action = cfg.actions?.[btnIndex];
  if (action === undefined) {
    console.warn(`No action for button ${btnIndex} on ${state.currentScreen}`);
    return;
  }
  if (action === null) {
    // disabled / taunt; optional "thunk" SFX here
    return;
  }

  // Extra guard for FATE empty slots (UI already disables)
  if (state.currentScreen === SCREENS.FATE && state.fateChoices[btnIndex] == null) return;

  const fn = ACTIONS[action];
  if (!fn) {
    console.warn(`Unimplemented action: ${action}`);
    return;
  }

  const res = fn() || {};
  applyResult(res);
}

// Re-evaluate labels/disabled with current state
export function refreshUI() { 
  applyResult({});
}
