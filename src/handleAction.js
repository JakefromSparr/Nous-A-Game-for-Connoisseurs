// src/handleAction.js
import { SCREENS } from './constants/screens.js';
import { ROUTES }  from './constants/routes.js';
import { State }   from './state.js';
import { UI }      from './ui.js';

import * as Q       from './engine/questionEngine.js';
import * as Fate    from './engine/fateEngine.js';
import * as Round   from './engine/roundEngine.js';
import * as Tutor   from './engine/tutorialEngine.js';
import { getObservedPresenceLine } from './engine/grinEngine.js';
import { composeFinalReading } from './engine/readingEngine.js';

/* ---------------- helpers ---------------- */

function renderScreenBody(target, st) {
  if (target === SCREENS.QUESTION && st.currentQuestion) {
    UI.showQuestion(st.currentQuestion, st.currentAnswers);
  }
  if (target === SCREENS.CROSSROADS) {
    UI.showCrossroads?.(st);
  }
  if (target === SCREENS.FATE && st.activeFateCard) {
    UI.showFateCard(st.activeFateCard);
    UI.showFateChoicesFromState(st);
  }
  if (target === SCREENS.REVEAL && st.lastOutcome) {
    UI.showResult(st.lastOutcome);
  }
  if (target === SCREENS.FATE_RESULT) {
    const summary = st.roundSummary;
    if (summary?.fateText) UI.showFateResult?.(summary.fateText);
  }
  if (target === SCREENS.THREAD_SEVERED) UI.showFailure?.(st.lostRoundPoints || 0);
  if (target === SCREENS.FINAL_READING) UI.showFinalReading?.(st.finalReading);
  if (target === SCREENS.WAITING_ROOM) {
    UI.showWaitingRoom?.(st);
  }
  if (target === SCREENS.GAME_LOBBY) {
    UI.showGameLobby?.(st);
  }
}

function applyResult({ patch, next } = {}) {
  const previous = State.getState().currentScreen;
  if (patch) State.patch(patch);

  const current = State.getState().currentScreen;
  const target  = next ?? current;

  if (target !== current) {
    State.patch({ currentScreen: target });
  }
  if (next !== undefined || target !== previous) {
    UI.updateScreen(target);
  }

  const cfg = ROUTES[target] || { labels: ['','',''], actions: [null,null,null] };
  const st  = State.getState();

  // Tutorial override: show [Back, Next, Skip] while tutorial overlay is active.
  let labels;
  if (st.tutorial?.active && ![SCREENS.QUESTION, SCREENS.REVEAL].includes(target)) {
    labels = ['Back','Next','Skip'];
  } else {
    labels = cfg.labels.map(l => (typeof l === 'function' ? l(st) : l));
  }

  UI.setButtonLabels(labels, (i) => {
    if (cfg.actions[i] === null && !st.tutorial?.active) return true;

    if (target === SCREENS.FATE && st.fateChoices[i] == null && !st.tutorial?.active) return true;

    if (target === SCREENS.GAME_LOBBY && i === 1 && !st.tutorial?.active) {
      if (st.firstEntryActive) return !!st.tasselTaken;
      const loaded = Array.isArray(st.activeRoundEffects) && st.activeRoundEffects.length > 0;
      return loaded;
    }
    if (target === SCREENS.ROUND_LOBBY && i === 0 && !st.tutorial?.active) {
      return !Round.canTieOff(st);
    }
    if (target === SCREENS.QUESTION && st.currentAnswers?.[i]?.unavailable) {
      return true;
    }
    if (target === SCREENS.CROSSROADS && !st.tutorial?.active) {
      const count = st.crossroadCandidates?.length || 0;
      if (i === 1) return count === 0;
      return count < 2;
    }
    return false;
  });

  UI.updateDisplayValues(st);
  renderScreenBody(target, st);
  State.saveGame?.();
}

/* Pull baseline cost then draw a question (tutorial uses tier:0) */
function doPull(requestedId = null) {
  const s = State.getState();
  if (s.thread <= 0) return { next: SCREENS.ROUND_LOBBY };

  const afterPull = s.thread - 1;
  const draw = s.tutorial?.active ? Tutor.drawTutorialQuestion : Q.drawQuestion;
  const { question, answers, category, patch: drawPatch } = draw(s, requestedId);

  if (!question) {
    return {
      patch: { thread: afterPull, ...(drawPatch || {}) },
      next: SCREENS.ROUND_LOBBY,
    };
  }

  return {
    patch: {
      ...(drawPatch || {}),
      thread: afterPull,
      currentQuestion: question,
      currentAnswers : answers,
      currentCategory: category ?? '',
    },
    next: SCREENS.QUESTION,
  };
}

function openCrossroads() {
  const s = State.getState();
  if (s.thread <= 0) return { next: SCREENS.ROUND_LOBBY };
  const prepared = Q.prepareCrossroads(s);
  if (!prepared.candidates?.length) {
    return { patch: prepared.patch, next: SCREENS.ROUND_LOBBY };
  }
  return { patch: prepared.patch, next: SCREENS.CROSSROADS };
}

/* After REVEAL: decide where to go */
function afterRevealAccept() {
  const s = State.getState();
  if (s.thread <= 0) {
    const patch = Round.sever(s);
    return { patch, next: SCREENS.THREAD_SEVERED };
  }

  if (s.tutorial?.active) {
    Tutor.advanceStep?.();
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

    if (choice === 'Play') {
      State.clearWaitingRoomReceipt?.();
      UI.showParticipantEntry?.();
      return { next: SCREENS.WAITING_ROOM };
    }
    if (choice === 'Rules')    return { next: SCREENS.RULES };
    if (choice === 'Options')  return { next: SCREENS.OPTIONS };

    if (choice === 'Tutorial') {
      Tutor.startTutorial?.();
      return { next: SCREENS.WELCOME };
    }

    if (choice === 'Reset Save') {
      State.resetSave?.();
      State.clearWaitingRoomReceipt?.();
      UI.showParticipantFlavor?.('');
      return { next: SCREENS.WELCOME };
    }
    return {};
  },
  'back-to-welcome' : () => {
    State.clearWaitingRoomReceipt?.();
    UI.showParticipantFlavor?.('');
    return { next: SCREENS.WELCOME };
  },

  /* OPTIONS — matches your routes */
  'options-next-difficulty' : () => {
    const s = State.getState();
    const cur = Math.max(1, Math.min(3, Number(s.startingDifficulty || 1)));
    const next = cur >= 3 ? 1 : cur + 1;
    State.patch({ difficultyLevel: next, startingDifficulty: next });
    return {};
  },
  'options-select' : () => ({ next: SCREENS.WELCOME }),

  /* WAITING ROOM */
  'participants-down': () => {
    const s = State.getState();

    if (s.waitingRoomReceiptVisible) {
      State.clearWaitingRoomReceipt?.();
      UI.showParticipantFlavor?.('');
      return {};
    }

    UI.adjustParticipantCount(-1);
    return {};
  },
  'participants-up'  : () => {
    if (State.getState().waitingRoomReceiptVisible) return {};

    UI.adjustParticipantCount(+1);
    return {};
  },
  'participants-confirm': () => {
    const s = State.getState();

    if (s.waitingRoomReceiptVisible) {
      const gathered = Math.max(1, Number(s.gatheredCount || UI.confirmParticipants()) || 1);
      State.initializeGame(gathered);
      return { next: SCREENS.GAME_LOBBY };
    }

    const gathered = UI.confirmParticipants();
    const observed = Number(gathered) + 1;
    const line = getObservedPresenceLine(gathered);

    State.patch({
      gatheredCount: gathered,
      observedCount: observed,
      waitingRoomReceiptText: line,
      waitingRoomReceiptVisible: true,
    });
    UI.showParticipantFlavor(line);

    // Stay on WAITING_ROOM while the receipt phase shows.
    return {};
  },

  /* GAME LOBBY */
  'parlor-middle' : () => {
    const s = State.getState();
    if (s.firstEntryActive) {
      if (s.tasselTaken) return {};
      return { patch: { tasselTaken: true } };
    }

    const alreadyLoaded = Array.isArray(s.activeRoundEffects) && s.activeRoundEffects.length > 0;
    if (alreadyLoaded) return {};

    const deck = s.fateCardDeck || [];
    const available = deck.filter(c => !s.completedFateCardIds?.has?.(c.id));
    const card = available.length ? available[(Math.random() * available.length) | 0] : null;
    if (!card) return {};
    const patch = Fate.armFate(card, s);
    return { patch, next: SCREENS.FATE };
  },
  'to-round-lobby' : () => {
    const patch = Round.startRound(State.getState());
    return { patch, next: SCREENS.ROUND_LOBBY };
  },

  /* ROUND LOBBY */
  'tie-off' : () => {
    const s = State.getState();
    if (!Round.canTieOff(s)) return {};

    const tied = Round.tieOff(s);
    const resolvedState = { ...s, ...tied };

    // Build summary for the FATE_RESULT screen; do not finalize yet.
    const fateRes = Fate.resolveRound?.(s.roundAnswerTally, tied.roundWon, resolvedState) || { summaryText: '' };
    const roundPoints = s.roundScore || 0;

    const summary = {
      points  : roundPoints,
      fateText: fateRes.summaryText || `Round total: ${roundPoints}.`,
      raw     : fateRes,
    };

    const patch = {
      ...tied, roundSummary: summary,
      pendingFateResolution: fateRes,
    };

    return { patch, next: SCREENS.FATE_RESULT };
  },

  'weave'   : () => {
    State.spendThreadToWeave();
    return {};
  },
  'pull'    : () => {
    const s = State.getState();
    return s.isIntroRound || s.tutorial?.active ? doPull() : openCrossroads();
  },

  /* CROSSROADS */
  'crossroad-left' : () => {
    const s = State.getState();
    const count = s.crossroadCandidates?.length || 0;
    if (count < 2) return {};
    UI.queueCrossroadMotion?.('left');
    return {
      patch: {
        crossroadSelection:
          ((Number(s.crossroadSelection) || 0) - 1 + count) % count,
      },
    };
  },
  'crossroad-right' : () => {
    const s = State.getState();
    const count = s.crossroadCandidates?.length || 0;
    if (count < 2) return {};
    UI.queueCrossroadMotion?.('right');
    return {
      patch: {
        crossroadSelection:
          ((Number(s.crossroadSelection) || 0) + 1) % count,
      },
    };
  },
  'crossroad-select' : () => {
    const s = State.getState();
    const candidates = s.crossroadCandidates || [];
    const selected = Math.max(
      0,
      Math.min(candidates.length - 1, Number(s.crossroadSelection) || 0)
    );
    const questionId = candidates[selected];
    return questionId === undefined ? {} : doPull(questionId);
  },

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

  /* FATE (in-round card choices) */
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

  /* FATE RESULT (end-of-round summary) */
  'fate-fight'  : () => ({ next: SCREENS.ROUND_LOBBY }),
  'fate-accept' : () => {
    const s = State.getState();
    const fateRes = s.pendingFateResolution || Fate.resolveRound?.(s.roundAnswerTally, s.roundWon, s) || {};
    const patch   = Round.finalizeRound(s, fateRes);

    const roundsWonNext =
      (s.roundsWon || 0) + (!s.isIntroRound && s.roundWon ? 1 : 0);
    const isFinal = roundsWonNext >= (s.roundsToWin || 3);
    const next = isFinal
      ? SCREENS.FINAL_READING
      : SCREENS.GAME_LOBBY;

    // Clean up summary
    patch.roundSummary = null;
    patch.pendingFateResolution = null;
    if (isFinal) patch.finalReading = composeFinalReading(s);

    return { patch, next };
  },

  /* THREAD SEVERED */
  'sever-ack'   : () => {
    const s = State.getState();
    const patch = Round.finalizeRound(s, {});
    if (s.lives <= 0) patch.finalReading = composeFinalReading(s);
    return { patch, next: s.lives <= 0 ? SCREENS.FINAL_READING : SCREENS.GAME_LOBBY };
  },

  /* FINAL READING */
  'reset-game'  : () => {
    State.resetGame?.();
    State.loadData?.();
    State.clearWaitingRoomReceipt?.();
    UI.showParticipantEntry?.();
    return { next: SCREENS.WAITING_ROOM };
  },
};

/* ---------------- central router ---------------- */

export function handleAction(btnIndex) {
  const state = State.getState();

  // Tutorial take-over: buttons are [Back, Next, Skip]
  if (state.tutorial?.active && ![SCREENS.QUESTION, SCREENS.REVEAL].includes(state.currentScreen)) {
    if (btnIndex === 0) {
      Tutor.prevStep?.();
    } else if (btnIndex === 1) {
      Tutor.advanceStep?.();
    } else if (btnIndex === 2) {
      Tutor.endTutorial?.();
    }
    applyResult({});
    return;
  }

  const cfg = ROUTES[state.currentScreen];

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
