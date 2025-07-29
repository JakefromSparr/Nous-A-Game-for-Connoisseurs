// src/handleAction.js
import { SCREENS } from './constants/screens.js';
import { ROUTES }  from './constants/routes.js';
import { State }   from './state.js';
import { UI }      from './ui.js';

import * as Q     from './engine/questionEngine.js';
import * as Fate  from './engine/fateEngine.js';
import * as Round from './engine/roundEngine.js';
import { Tutorial } from './engine/tutorialEngine.js';

/* ---------------- helpers ---------------- */

function renderScreenBody(target, st) {
  if (target === SCREENS.QUESTION && st.currentQuestion) {
    UI.showQuestion(st.currentQuestion, st.currentAnswers);
  }
  if (target === SCREENS.FATE && st.activeFateCard) {
    UI.showFateCard(st.activeFateCard);
    UI.showFateChoicesFromState(st); // show on-card labels too
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
    if (cfg.actions[i] === null) return true; // taunt/disabled

    // Fate screen: disable missing choices
    if (target === SCREENS.FATE && st.fateChoices[i] == null) return true;

    // Game Lobby: center disabled once a fate is already loaded for this round
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

// Pull baseline cost (−1 thread) then draw a question
function doPull() {
  const s = State.getState();
  if (s.thread <= 0) return { next: SCREENS.ROUND_LOBBY };

  const afterPull = s.thread - 1;

  // Tutorial override: if active, pull the tutorial question instead of deck.
  if (Tutorial.isActive(s)) {
    const { question, answers, category } = Tutorial.draw(s);
    return {
      patch: {
        thread: afterPull,
        currentQuestion: question,
        currentAnswers : answers,
        currentCategory: category,
      },
      next: SCREENS.QUESTION,
    };
  }

  const { question, answers, category } = Q.drawQuestion(s);

  if (!question) {
    // deck/tier exhausted → stay in lobby
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

// After REVEAL: decide where to go (Sever? → sever screen, else back to Round Lobby)
// NOTE: we no longer auto-enter Fate here (no auto-queued cards).
function afterRevealAccept() {
  const s = State.getState();
  if (s.thread <= 0) {
    const patch = Round.sever(s);
    return { patch, next: SCREENS.THREAD_SEVERED };
  }
  const st2 = State.getState();
  if (Tutorial.isActive(st2)) {
    Tutorial.advanceAfterReveal(st2);
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
    if (choice === 'Play')    return { next: SCREENS.WAITING_ROOM };
    if (choice === 'Rules')   return { next: SCREENS.RULES };
    if (choice === 'Options') return { next: SCREENS.OPTIONS };
    if (choice === 'Tutorial') {
      const s = State.getState();
      import('./engine/tutorialEngine.js').then(() => {
        // ensure tutorial flag exists
        s.tutorial = s.tutorial || {};
        // start tutorial and jump to Game Lobby
        Tutorial.start(s);
        applyResult({ next: SCREENS.GAME_LOBBY });
      });
      return {};
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
  // Tempt Fate: only if nothing already loaded for this round
  'tempt-fate' : () => {
    const s = State.getState();
    const alreadyLoaded = Array.isArray(s.activeRoundEffects) && s.activeRoundEffects.length > 0;
    if (alreadyLoaded) return {}; // disabled by UI, but guard anyway

    const deck = s.fateCardDeck || [];
    const available = deck.filter(c => !s.completedFateCardIds?.has?.(c.id));
    const card = available.length ? available[(Math.random() * available.length) | 0] : null;
    if (!card) return {}; // no cards left

    const patch = Fate.armFate(card, s);
    return { patch, next: SCREENS.FATE };
  },

  // Keep old name working, just in case a route still uses it
  'enter-fate' : () => ACTIONS['tempt-fate'](),

  'to-round-lobby' : () => {
    const patch = Round.startRound(State.getState()); // applies ROUND_START bonuses too
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

  /* QUESTION (answers 0/1/2) */
  'choose-0': () => {
    const res = Q.evaluate(0, State.getState());
    // If tutorial is active and a choice was made, record the key for disabling on second pass
    const st = State.getState();
    if (Tutorial.isActive(st)) {
      const a = st.currentAnswers?.[0];
      if (a?.key) Tutorial.recordChoice(st, String(a.key).toUpperCase());
    }
    return { patch: res?.patch, next: SCREENS.REVEAL };
  },
  'choose-1': () => {
    const res = Q.evaluate(1, State.getState());
    // If tutorial is active and a choice was made, record the key for disabling on second pass
    const st = State.getState();
    if (Tutorial.isActive(st)) {
      const a = st.currentAnswers?.[1];
      if (a?.key) Tutorial.recordChoice(st, String(a.key).toUpperCase());
    }
    return { patch: res?.patch, next: SCREENS.REVEAL };
  },
  'choose-2': () => {
    const res = Q.evaluate(2, State.getState());
    // If tutorial is active and a choice was made, record the key for disabling on second pass
    const st = State.getState();
    if (Tutorial.isActive(st)) {
      const a = st.currentAnswers?.[2];
      if (a?.key) Tutorial.recordChoice(st, String(a.key).toUpperCase());
    }
    return { patch: res?.patch, next: SCREENS.REVEAL };
  },

  /* REVEAL */
  'reveal-fight'  : () => afterRevealAccept(),
  'reveal-accept' : () => afterRevealAccept(),

  /* FATE (choose a pre-round effect; then return to Game Lobby, not Fate Result) */
  'fate-choose-0' : () => {
    const s = State.getState();
    const choice = s.fateChoices[0];
    if (!choice) return {};
    const patch = Fate.applyChoice(choice, s);
    UI.showFateResult?.(choice.effect?.flavorText ?? ''); // optional flavor
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

  /* FATE RESULT — end-of-round only */
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
  if (action === null) return; // deliberate taunt

  // extra guard on FATE
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
