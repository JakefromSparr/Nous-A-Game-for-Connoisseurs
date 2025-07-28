// src/handleAction.js
import { SCREENS } from './constants/screens.js';
import { ROUTES }  from './constants/routes.js';
import { State }   from './state.js';
import { UI }      from './ui.js';

import * as Q     from './engine/questionEngine.js';
import * as Fate  from './engine/fateEngine.js';
import * as Round from './engine/roundEngine.js'; // rename file if you still have lastEngine.js

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
  State.saveGame?.();
}

// Pull baseline cost (−1 thread) then draw a question
function doPull() {
  const s = State.getState();
  if (s.thread <= 0) return { next: SCREENS.ROUND_LOBBY };

  const afterPull = s.thread - 1;
  const { question, answers, category } = Q.drawQuestion(s);

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
    const patch = Round.sever(s);                 // sets roundEndedBy, pendingBank=0, lives-1
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
    // If you also keep State.startNewRound(), call it; Round.startRound returns patch regardless
    State.startNewRound?.();
    const patch = Round.startRound(State.getState());
    return { patch, next: SCREENS.ROUND_LOBBY };
  },
  'back-to-welcome': () => ({ next: SCREENS.WELCOME }),

  /* ROUND LOBBY */
  'tie-off' : () => {
    const patch = Round.tieOff(State.getState()); // sets pendingBank, roundWon flag, nextRoundT0
    return { patch, next: SCREENS.FATE_RESULT };
  },
  'weave'   : () => {
    const s = State.getState();
    if (s.thread <= 0 || s.weavePrimed) return {};
    return { patch: { thread: s.thread - 1, weavePrimed: true } };
  },
  'pull'    : () => doPull(),

  /* QUESTION (answers 0/1/2) */
  'choose-0': () => {
    const res = Q.evaluate(0, State.getState()); // applies typical/revelatory/wrong deltas; clears weavePrimed if used
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
  'reveal-fight'  : () => afterRevealAccept(),  // identical for now; can diverge later
  'reveal-accept' : () => afterRevealAccept(),

  /* FATE (1–3 options; empty slots disabled in UI, but we also guard here) */
  'fate-choose-0' : () => {
    const s = State.getState();
    const choice = s.fateChoices[0];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    return { patch, next: SCREENS.FATE_RESULT };
  },
  'fate-choose-1' : () => {
    const s = State.getState();
    const choice = s.fateChoices[1];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    return { patch, next: SCREENS.FATE_RESULT };
  },
  'fate-choose-2' : () => {
    const s = State.getState();
    const choice = s.fateChoices[2];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    return { patch, next: SCREENS.FATE_RESULT };
  },

  /* FATE RESULT */
  'fate-fight'  : () => ({ next: SCREENS.ROUND_LOBBY }), // taunt placeholder; wire later if needed
  'fate-accept' : () => {
    const patch = Round.finalizeRound(State.getState()); // adds pendingBank to score, inc roundsWon if roundWon, adv roundNumber, compute nextRoundT0
    return { patch, next: SCREENS.GAME_LOBBY };
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
