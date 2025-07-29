// src/handleAction.js
import { SCREENS } from './constants/screens.js';
import { ROUTES }  from './constants/routes.js';
import { State }   from './state.js';
import { UI }      from './ui.js';

import * as Q        from './engine/questionEngine.js';
import * as Fate     from './engine/fateEngine.js';
import * as Round    from './engine/roundEngine.js';
import * as Tutorial from './engine/tutorialEngine.js'; // assumed present

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
// Also handle natural difficulty ramp here (we now know the last outcome).
function afterRevealAccept() {
  const s = State.getState();

  // 1) Difficulty ramp based on the last answer outcome
  const kind = s.lastOutcome?.kind;
  if (kind) State.noteAnswerOutcome(kind);

  // 2) End-of-thread handling
  if (s.thread <= 0) {
    const patch = Round.sever(s);
    return { patch, next: SCREENS.THREAD_SEVERED };
  }
  return { next: SCREENS.ROUND_LOBBY };
}

/* ---------------- actions ---------------- */

const ACTIONS = {
  /* WELCOME / MENUS */
  'welcome-up'      : () => (UI.moveWelcomeSelection('up'),  {}),
  'welcome-down'    : () => (UI.moveWelcomeSelection('down'),{}),
  'welcome-select'  : () => {
    const choice = (UI.getWelcomeSelection() || '').toLowerCase();
    if (choice === 'play')     return { next: SCREENS.WAITING_ROOM };
    if (choice === 'rules')    return { next: SCREENS.RULES };
    if (choice === 'options')  return { next: SCREENS.OPTIONS };
    if (choice === 'tutorial') return { next: SCREENS.TUTORIAL };
    if (choice === 'reset save') {
      State.clearSave();
      return { next: SCREENS.WELCOME };
    }
    return {};
  },
  'back-to-welcome' : () => ({ next: SCREENS.WELCOME }),
  'rules-more'      : () => ({}),

  // Options: left is Back, center Confirm (noop for now), right cycles difficulty 1→3
  'options-select'            : () => ({}),
  'options-next-difficulty'   : () => {
    const s = State.getState();
    const next = (s.startingDifficulty % 3) + 1;  // 1→2→3→1
    State.setStartingDifficulty(next);
    return {}; // UI reads from state
  },

  /* WAITING ROOM */
  'participants-down': () => (UI.adjustParticipantCount(-1), {}),
  'participants-up'  : () => (UI.adjustParticipantCount(+1), {}),
  'participants-confirm': () => {
    const n = UI.confirmParticipants();
    State.initializeGame(n);
    return { next: SCREENS.GAME_LOBBY };
  },

  /* TUTORIAL LANDING */
  'tutorial-begin' : () => {
    const res = (Tutorial?.begin && Tutorial.begin(State.getState())) || null;
    return res || { next: SCREENS.QUESTION };
  },
  'tutorial-more'  : () => {
    const res = (Tutorial?.more && Tutorial.more(State.getState())) || null;
    return res || {};
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
  // legacy name if an old route still references it
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

  /* FATE (choose a pre-round effect; then return to Game Lobby) */
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

  // guard on FATE
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
