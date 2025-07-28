// src/constants/routes.js
import { SCREENS } from './screens.js';

// Canonical: exactly 3 labels and 3 actions per screen.
// labels[i] may be a string or (state)=>string
// actions[i] is a string or null (null => disabled taunt)
/**
 * ROUTES describes, per screen:
 *   — btnMap  : { 0: actionName, 1: actionName, 2: actionName }
 *   — labels  : [labelBtn1, labelBtn2, labelBtn3]
 *     A label can be:
 *       • a string (static), or
 *       • a () => string  (dynamic – evaluated each time the screen shows)
 */
export const ROUTES = {
  /* ─────────────── ENTRY FLOW ─────────────── */
  [SCREENS.WELCOME]: {
    btnMap : { 0:'welcome-down', 1:'welcome-select', 2:'welcome-up' },
    labels : ['Down','Select','Up']
  },

  [SCREENS.WAITING_ROOM]: {
    btnMap : { 0:'participants-down', 1:'participants-confirm', 2:'participants-up' },
    labels : ['Less','Confirm','More']
  },

  [SCREENS.RULES]: {
    btnMap : { 0:'back-to-welcome', 1:'no-op',          2:'go-options'   },
    labels : ['I’ve Heard Enough','NOUS','Tell Me More']
  },

  [SCREENS.OPTIONS]: {
    btnMap : { 0:'options-down',   1:'option-select',  2:'options-up'   },
    labels : ['Down','Select','Up']
  },

  /* ─────────────── CORE LOBBY ─────────────── */
  [SCREENS.GAME_LOBBY]: {
    btnMap : { 0:'turn-back',      1:'tempt-fate',     2:'next-round'   },
    labels : ['Turn Back','Tempt Fate','Push On']
  },

  /* ─────────────── FATE CARD ─────────────── */
  [SCREENS.FATE]: {
    btnMap : { 0:'fate-a',         1:'fate-b',         2:'fate-c'       },
    labels : [
      () => State.getState().currentFateCard?.choices?.[0]?.label ?? '—',
      () => State.getState().currentFateCard?.choices?.[1]?.label ?? 'NOUS',
      () => State.getState().currentFateCard?.choices?.[2]?.label ?? 'NOUS'
    ]
  },

  /* ─────────────── ROUND LOBBY ─────────────── */
  [SCREENS.ROUND_LOBBY]: {
    btnMap : { 0:'end-round',      1:'double-points',  2:'start-question' },
    labels : ['Cut the Thread','Weave to Fate','Pull the Thread']
  },

  /* ─────────────── ACTIVE QUESTION ─────────────── */
  [SCREENS.QUESTION]: {
    btnMap : { 0:'answer-a',       1:'answer-b',       2:'answer-c'    },
    labels : ['Choose A','Choose B','Choose C']
  },

  /* ─────────────── REVEAL ─────────────── */
  [SCREENS.REVEAL]: {
    btnMap : { 0:'challenge-result', 1:'plead-result', 2:'accept-result' },
    labels : ['Fight Fate','', 'Accept Fate']
  },

  /* ─────────────── THREAD SEVERED ─────────────── */
  [SCREENS.THREAD_SEVERED]: {
    btnMap : { 0:'no-op',          1:'no-op',          2:'no-op'       },
    labels : ['NOUS','NO USE','NOUS']
  },

  /* ─────────────── FATE RESULT ─────────────── */
  [SCREENS.FATE_RESULT]: {
    btnMap : { 0:'challenge-result', 1:'plead-result', 2:'accept-result' },
    labels : ['Fight Fate','', 'Accept Fate']
  },

  /* ─────────────── FINAL ARC ─────────────── */
  [SCREENS.LAST_DECK]: {
    btnMap : { 0:'turn-back',      1:'tempt-fate',     2:'next-round'  }, // tweak if different
    labels : ['Turn Back','Tempt Fate','Push On']
  },

  [SCREENS.FINAL_QUESTION]: {
    btnMap : { 0:'answer-a',       1:'answer-b',       2:'answer-c'    },
    labels : ['Choose A','Choose B','Choose C']
  },

  [SCREENS.FINAL_RESULT]: {
    btnMap : { 0:'challenge-result', 1:'plead-result', 2:'accept-result' },
    labels : ['Fight Fate','Plead Case','Accept Fate']
  },

  [SCREENS.FINAL_READING]: {
    btnMap : { 0:'save-reading',   1:'restart-game',   2:'quit-game'   },
    labels : ['Save Reading','Again!','Quit']
  },

  /* ─────────────── END GAME / META ─────────────── */
  [SCREENS.GAME_OVER]: {
    btnMap : { 0:'restart-game',   1:'no-op',          2:'quit-game'   },
    labels : ['Try Again','NOUS','Exit']
  },

  [SCREENS.RESULTS]: {
    btnMap : { 0:'restart-game',   1:'save-reading',   2:'quit-game'   },
    labels : ['Play Again','Save Reading','Quit']
=======
export const ROUTES = {
  // ───────────── ENTRY ─────────────
  [SCREENS.WELCOME]: {
    labels: ['Down','Select','Up'],
    actions: ['welcome-down','welcome-select','welcome-up'],
  },

  [SCREENS.WAITING_ROOM]: {
    labels: ['Less','Confirm','More'],
    actions: ['participants-down','participants-confirm','participants-up'],
  },

  [SCREENS.RULES]: {
    labels: ['I’ve Heard Enough','NOUS','Tell Me More'],
    actions: ['back-to-welcome', null, 'rules-more'], // Plead-style taunt in middle
  },

  [SCREENS.OPTIONS]: {
    labels: ['Down','Select','Up'],
    actions: ['options-down','options-select','options-up'],
  },

  // ───────────── MAIN LOBBY ─────────────
  [SCREENS.GAME_LOBBY]: {
    labels: [
      () => 'Turn Back',
      s => (s.pendingFateCard ? 'Tempt Fate' : 'NOUS'),
      () => 'Push On',
    ],
    actions: ['back-to-welcome','enter-fate','to-round-lobby'], // UI will disable center when NOUS
  },

  // ───────────── ROUND LOBBY ─────────────
  [SCREENS.ROUND_LOBBY]: {
    labels: ['Tie Off Thread','Weave the Thread','Pull the Thread'],
    actions: ['tie-off','weave','pull'],
  },

  // ───────────── QUESTION ─────────────
  [SCREENS.QUESTION]: {
    labels: [
      s => s.currentAnswers?.[0]?.label ?? 'A',
      s => s.currentAnswers?.[1]?.label ?? 'B',
      s => s.currentAnswers?.[2]?.label ?? 'C',
    ],
    actions: ['choose-0','choose-1','choose-2'],
  },

  // ───────────── REVEAL ─────────────
  [SCREENS.REVEAL]: {
    labels: ['Fight Fate','Plead Case','Accept Fate'],
    actions: ['reveal-fight', null, 'reveal-accept'], // Plead is a taunt
  },

  // ───────────── FATE (1–3 options; holes = NOUS) ─────────────
  [SCREENS.FATE]: {
    labels: [
      s => s.fateChoices?.[0]?.label ?? 'NOUS',
      s => s.fateChoices?.[1]?.label ?? 'NOUS',
      s => s.fateChoices?.[2]?.label ?? 'NOUS',
    ],
    actions: ['fate-choose-0','fate-choose-1','fate-choose-2'], // UI disables where choice==null
  },

  // ───────────── FATE RESULT ─────────────
  [SCREENS.FATE_RESULT]: {
    labels: ['Fight Fate','Plead Case','Accept Fate'],
    actions: ['fate-fight', null, 'fate-accept'], // Plead is a taunt
  },

  // ───────────── THREAD SEVERED ─────────────
  [SCREENS.THREAD_SEVERED]: {
    labels: ['NOUS','NO USE','NOUS'],
    actions: [null, 'sever-ack', null], // only center does something
  },

  // ───────────── FINAL READING / CREDITS ─────────────
  [SCREENS.FINAL_READING]: {
    labels: [
      s => s.readingButtons?.[0] ?? 'A',
      s => s.readingButtons?.[1] ?? 'B',
      s => s.readingButtons?.[2] ?? 'C',
    ],
    actions: ['reading-a','reading-b','reading-c'],
  },

  [SCREENS.CREDITS]: {
    labels: ['Main Menu','NOUS','NOUS'],
    actions: ['back-to-welcome', null, null],
  },
};
  [SCREENS.CREDITS]: {
    btnMap : { 0:'back-to-welcome', 1:'no-op',          2:'no-op'       },
    labels : ['Main Menu',DISABLED,DISABLED]
// Guard: enforce 3 labels/actions & types
export function guardRoutes(routes) {
  for (const [screen, cfg] of Object.entries(routes)) {
    if (!cfg?.labels || cfg.labels.length !== 3) throw new Error(`Route ${screen}: needs 3 labels`);
    if (!cfg?.actions || cfg.actions.length !== 3) throw new Error(`Route ${screen}: needs 3 actions`);
    cfg.labels.forEach((l,i) => {
      const ok = typeof l === 'string' || typeof l === 'function';
      if (!ok) throw new Error(`Route ${screen}[${i}] label must be string or fn(state)`);
    });
    cfg.actions.forEach((a,i) => {
      if (a !== null && typeof a !== 'string') {
        throw new Error(`Route ${screen}[${i}] action must be string or null`);
      }
    });
  }
}
