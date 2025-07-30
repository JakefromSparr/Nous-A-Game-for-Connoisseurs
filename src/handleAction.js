// src/handleAction.js
import { SCREENS } from './constants/screens.js';
import { ROUTES }  from './constants/routes.js';
import { State }   from './state.js';
import { UI }      from './ui.js';

import * as Q       from './engine/questionEngine.js';
import * as Fate    from './engine/fateEngine.js';
import * as Round   from './engine/roundEngine.js';
import * as Tutor   from './engine/tutorialEngine.js';  // <-- NEW

/* ---------------- helpers ---------------- */

function renderScreenBody(target, st) {
  if (target === SCREENS.QUESTION && st.currentQuestion) {
    UI.showQuestion(st.currentQuestion, st.currentAnswers);
  }
  if (target === SCREENS.FATE && st.activeFateCard) {
    UI.showFateCard(st.activeFateCard);
    UI.showFateChoicesFromState(st);
  }
  if (target === SCREENS.REVEAL && st.lastOutcome) {
    UI.showResult(st.lastOutcome);
  }
}

function applyResult({ patch, next } = {}) {
  if (patch) State.patch(patch);

  const current = State.getState().currentScreen;
  const target  = next ?? current;

  if (target !== current) {
    State.patch({ currentScreen: target });
    UI.updateScreen(target);
  }

  const cfg = ROUTES[target];
  const st  = State.getState();
  const labels = cfg.labels.map(l => (typeof l === 'function' ? l(st) : l));

  UI.setButtonLabels(labels, (i) => {
    if (cfg.actions[i] === null) return true;

    if (target === SCREENS.FATE && st.fateChoices[i] == null) return true;

    if (target === SCREENS.GAME_LOBBY && i === 1) {
      const loaded = Array.isArray(st.activeRoundEffects) && st.activeRoundEffects.length > 0;
      return loaded;
    }
    return false;
  });

  UI.updateDisplayValues(st);
  renderScreenBody(target, st);
  State.saveGame?.();
}

// Pull baseline cost then draw a question (tutorial uses tier:0)
function doPull() {
  const s = State.getState();
  if (s.thread <= 0) return { next: SCREENS.ROUND_LOBBY };

  const afterPull = s.thread - 1;

  // Tutorial draw (tier 0 only)
  const draw = s.tutorial?.active ? Tutor.drawTutorialQuestion : Q.drawQuestion;
  const { question, answers, category } = draw(s);

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

// After REVEAL: decide where to go
function afterRevealAccept() {
  const s = State.getState();
  if (s.thread <= 0) {
    const patch = Round.sever(s);
    return { patch, next: SCREENS.THREAD_SEVERED };
  }

  // OPTIONAL: advance tutorial step after any reveal
  if (s.tutorial?.active) {
    Tutor.advanceStep();
  }

  return { next: SCREENS.ROUND_LOBBY };
}

/* ---------------- actions ---------------- */

const ACTIONS = {
  /* WELCOME / MENUS */
  'welcome-up'      : () => (UI.moveWelcomeSelection('up'),  {}),
  'welcome-down'    : () => (UI.moveWelcomeSelection('down'),{}),
  'welcome-select'  : () => {
    const choice = UI.getWelcomeSelection();

    if (choice === 'Play')     return { next: SCREENS.WAITING_ROOM };
    if (choice === 'Rules')    return { next: SCREENS.RULES };
    if (choice === 'Options')  return { next: SCREENS.OPTIONS };

    if (choice === 'Tutorial') {
      Tutor.startTutorial?.();
      return { next: SCREENS.GAME_LOBBY };
    }

    if (choice === 'Reset Save') {
      State.resetSave?.();
      // Drop back cleanly to Welcome; tutorial flag is non-persistent
      return { next: SCREENS.WELCOME };
    }

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
  'tempt-fate' : () => {
    const s = State.getState();
    const alreadyLoaded = Array.isArray(s.activeRoundEffects) && s.activeRoundEffects.length > 0;
    if (alreadyLoaded) return {};

    const deck = s.fateCardDeck || [];
    const available = deck.filter(c => !s.completedFateCardIds?.has?.(c.id));
    const card = available.length ? available[(Math.random() * available.length) | 0] : null;
    if (!card) return {};
    const patch = Fate.armFate(card, s);
    return { patch, next: SCREENS.FATE };
  },
  'enter-fate' : () => ACTIONS['tempt-fate'](),

  'to-round-lobby' : () => {
    const patch = Round.startRound(State.getState());
    return { patch, next: SCREENS.ROUND_LOBBY };
  },

  /* ROUND LOBBY */
  'tie-off' : () => {
    const patch = Round.tieOff(State.getState());
    return { patch, next: SCREENS.FATE_RESULT };
  },
  'weave'   : () => {
    State.spendThreadToWeave();
    return {};
  },
  'pull'    : () => doPull(),

  /* QUESTION */
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
  'reveal-fight'  : () => afterRevealAccept(),
  'reveal-accept' : () => afterRevealAccept(),

  /* FATE */
  'fate-choose-0' : () => {
    const s = State.getState();
    const choice = s.fateChoices[0];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    UI.showFateResult?.(choice.effect?.flavorText ?? '');
    return { patch, next: SCREENS.GAME_LOBBY };
  },
  'fate-choose-1' : () => {
    const s = State.getState();
    const choice = s.fateChoices[1];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    UI.showFateResult?.(choice.effect?.flavorText ?? '');
    return { patch, next: SCREENS.GAME_LOBBY };
  },
  'fate-choose-2' : () => {
    const s = State.getState();
    const choice = s.fateChoices[2];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    UI.showFateResult?.(choice.effect?.flavorText ?? '');
    return { patch, next: SCREENS.GAME_LOBBY };
  },

  /* FATE RESULT */
  'fate-fight'  : () => ({ next: SCREENS.ROUND_LOBBY }),
  'fate-accept' : () => {
    const s = State.getState();
    const fateRes = Fate.resolveRound(s.roundAnswerTally, s.roundWon);
    const patch   = Round.finalizeRound(s, fateRes);

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

/* ---------------- central router ---------------- */

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
  if (action === null) return;

  if (state.currentScreen === SCREENS.FATE && state.fateChoices[btnIndex] == null) return;

  const fn = ACTIONS[action];
  if (!fn) {
    console.warn(`Unimplemented action: ${action}`);
    return;
  }

  const res = fn() || {};
  applyResult(res);
}

export function refreshUI() {
  applyResult({});
}
