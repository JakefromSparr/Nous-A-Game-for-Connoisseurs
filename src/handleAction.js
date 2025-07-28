// src/handleAction.js
import { SCREENS } from './constants/screens.js';
import { ROUTES }  from './constants/routes.js';
import { State }   from './state.js';
import { UI }      from './ui.js';

import * as Q     from './engine/questionEngine.js';
import * as Fate  from './engine/fateEngine.js';
import * as Round from './engine/roundEngine.js';

/* ---------------- internal helpers ---------------- */
function renderScreenBody(target, st) {
  if (target === SCREENS.QUESTION && st.currentQuestion) {
    UI.showQuestion(st.currentQuestion, st.currentAnswers);
  }
  if (target === SCREENS.FATE && st.activeFateCard) {
    UI.showFateCard(st.activeFateCard);
    UI.showFateChoicesFromState(st);
  }
  if (target === SCREENS.REVEAL && st.lastOutcome) {
    const r = st.lastOutcome;
    const outcomeText = `+${r.pointsGained || 0} points, ${r.threadDelta >= 0 ? '+' : ''}${r.threadDelta || 0} thread`;
    UI.showResult({
      kind: r.kind,
      questionText: r.questionText || '',
      chosenLabel: r.chosenLabel || '',
      explanation: r.explanation || '',
      pointsGained: r.pointsGained || 0,
      threadDelta: r.threadDelta || 0,
      outcomeText,
    });
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
    if (cfg.actions[i] === null) return true;                         // taunt
    if (target === SCREENS.FATE && st.fateChoices[i] == null) return true; // empty slot
    if (target === SCREENS.GAME_LOBBY && i === 1 && !st.pendingFateCard) return true; // no fate
    return false;
  });

  UI.updateDisplayValues(st);
  renderScreenBody(target, st);
  State.saveGame?.();
}

// Pull baseline −1 then draw a question
function doPull() {
  const s = State.getState();
  if (s.thread <= 0) return { next: SCREENS.ROUND_LOBBY };

  const afterPull = s.thread - 1;
  const { question, answers, category } = Q.drawQuestion(s);

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

function afterRevealAccept() {
  const s = State.getState();
  if (s.thread <= 0) {
    const patch = Round.sever(s);
    return { patch, next: SCREENS.THREAD_SEVERED };
  }
  if (s.pendingFateCard) {
    const patch = Fate.armFate(s.pendingFateCard, s);
    return { patch, next: SCREENS.FATE };
  }
  return { next: SCREENS.ROUND_LOBBY };
}

/* ---------------- actions table ---------------- */
const ACTIONS = {
  // WELCOME / MENUS
  'welcome-up'     : () => { UI.moveWelcomeSelection('up');   return {}; },
  'welcome-down'   : () => { UI.moveWelcomeSelection('down'); return {}; },
  'welcome-select' : () => {
    const choice = UI.getWelcomeSelection();
    if (choice === 'Play')    return { next: SCREENS.WAITING_ROOM };
    if (choice === 'Rules')   return { next: SCREENS.RULES };
    if (choice === 'Options') return { next: SCREENS.OPTIONS };
    return {};
  },
  'back-to-welcome': () => ({ next: SCREENS.WELCOME }),
  'rules-more'     : () => ({}),
  'options-down'   : () => { UI.moveOptions?.('down'); return {}; },
  'options-up'     : () => { UI.moveOptions?.('up');   return {}; },
  'options-select' : () => { UI.selectOption?.();      return {}; },

  // WAITING ROOM
  'participants-down': () => { UI.adjustParticipantCount(-1); return {}; },
  'participants-up'  : () => { UI.adjustParticipantCount(+1); return {}; },
  'participants-confirm': () => {
    const n = UI.confirmParticipants();
    State.initializeGame(n);
    return { next: SCREENS.GAME_LOBBY };
  },

  // GAME LOBBY
  'enter-fate'    : () => {
    const s = State.getState();
    if (!s.pendingFateCard) return {};
    const patch = Fate.armFate(s.pendingFateCard, s);
    return { patch, next: SCREENS.FATE };
  },
  'to-round-lobby': () => {
    const patch = Round.startRound(State.getState());
    return { patch, next: SCREENS.ROUND_LOBBY };
  },

  // ROUND LOBBY
  'tie-off' : () => ({ patch: Round.tieOff(State.getState()), next: SCREENS.FATE_RESULT }),
  'weave'   : () => { State.spendThreadToWeave(); return {}; },
  'pull'    : () => doPull(),

  // QUESTION
  'choose-0': () => ({ patch: Q.evaluate(0, State.getState())?.patch, next: SCREENS.REVEAL }),
  'choose-1': () => ({ patch: Q.evaluate(1, State.getState())?.patch, next: SCREENS.REVEAL }),
  'choose-2': () => ({ patch: Q.evaluate(2, State.getState())?.patch, next: SCREENS.REVEAL }),

  // REVEAL
  'reveal-fight' : () => afterRevealAccept(),
  'reveal-accept': () => afterRevealAccept(),

  // FATE (guarded by UI disable)
  'fate-choose-0': () => {
    const s = State.getState();
    const c = s.fateChoices[0];
    if (!c) return {};
    return { patch: Fate.applyChoice(c, s), next: SCREENS.FATE_RESULT };
  },
  'fate-choose-1': () => {
    const s = State.getState();
    const c = s.fateChoices[1];
    if (!c) return {};
    return { patch: Fate.applyChoice(c, s), next: SCREENS.FATE_RESULT };
  },
  'fate-choose-2': () => {
    const s = State.getState();
    const c = s.fateChoices[2];
    if (!c) return {};
    return { patch: Fate.applyChoice(c, s), next: SCREENS.FATE_RESULT };
  },

  // FATE RESULT
  'fate-fight' : () => ({ next: SCREENS.ROUND_LOBBY }),
  'fate-accept': () => {
    const s = State.getState();
    const fateRes = Fate.resolveRound(s.roundAnswerTally, s.roundWon);
    const patch = Round.finalizeRound(s, fateRes);

    // Decide next: if the round you just finalized got you to the threshold, go to Final Reading
    const roundsWonNext = (s.roundsWon || 0) + (s.roundWon ? 1 : 0);
    const next = roundsWonNext >= (s.roundsToWin || 3)
      ? SCREENS.FINAL_READING
      : SCREENS.GAME_LOBBY;

    return { patch, next };
  },

  // THREAD SEVERED
  'sever-ack' : () => ({ next: SCREENS.GAME_LOBBY }),

  // META (stubs)
  'reading-a' : () => ({}),
  'reading-b' : () => ({}),
  'reading-c' : () => ({}),
  'quit-game' : () => ({ next: SCREENS.CREDITS }),
};

/* ---------------- central router (0-based) ---------------- */
export function handleAction(btnIndex) {
  const state = State.getState();
  const cfg   = ROUTES[state.currentScreen];
  if (!cfg) return;

  const action = cfg.actions?.[btnIndex];
  if (action === undefined || action === null) return; // undefined or taunt

  if (state.currentScreen === SCREENS.FATE && state.fateChoices[btnIndex] == null) return;

  const fn = ACTIONS[action];
  if (!fn) return;

  const res = fn() || {};
  applyResult(res);
}

export function refreshUI() {
  applyResult({});
}
