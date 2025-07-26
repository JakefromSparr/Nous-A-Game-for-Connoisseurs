// src/constants/routes.js
import { SCREENS } from './screens.js';
import { State }   from '../state.js';           // <-- for dynamic labels

/* Helper: blank-out a button that isn’t meant to do anything */
const DISABLED = () => '';

/**
 * ROUTES describes, per screen:
 *   — btnMap  : { 1: actionName, 2: actionName, 3: actionName }
 *   — labels  : [labelBtn1, labelBtn2, labelBtn3]
 *     A label can be:
 *       • a string (static), or
 *       • a () => string  (dynamic – evaluated each time the screen shows)
 */
export const ROUTES = {
  /* ─────────────── ENTRY FLOW ─────────────── */
  [SCREENS.WELCOME]: {
    btnMap : { 1:'welcome-down', 2:'welcome-select', 3:'welcome-up' },
    labels : ['Down','Select','Up']
  },

  [SCREENS.WAITING_ROOM]: {
    btnMap : { 1:'participants-down', 2:'participants-confirm', 3:'participants-up' },
    labels : ['Less','Confirm','More']
  },

  [SCREENS.RULES]: {
    btnMap : { 1:'back-to-welcome', 2:'no-op',          3:'go-options'   },
    labels : ['I’ve Heard Enough','NOUS','Tell Me More']
  },

  [SCREENS.OPTIONS]: {
    btnMap : { 1:'options-down',   2:'option-select',  3:'options-up'   },
    labels : ['Down','Select','Up']
  },

  /* ─────────────── CORE LOBBY ─────────────── */
  [SCREENS.GAME_LOBBY]: {
    btnMap : { 1:'turn-back',      2:'tempt-fate',     3:'next-round'   },
    labels : ['Turn Back','Tempt Fate','Push On']
  },

  /* ─────────────── FATE CARD ─────────────── */
  [SCREENS.FATE]: {
    btnMap : { 1:'fate-a',         2:'fate-b',         3:'fate-c'       },
    labels : [
      () => State.getState().currentFateCard?.choices?.[0]?.label ?? '—',
      () => State.getState().currentFateCard?.choices?.[1]?.label ?? 'NOUS',
      () => State.getState().currentFateCard?.choices?.[2]?.label ?? 'NOUS'
    ]
  },

  /* ─────────────── ROUND LOBBY ─────────────── */
  [SCREENS.ROUND_LOBBY]: {
    btnMap : { 1:'end-round',      2:'double-points',  3:'start-question' },
    labels : ['Cut the Thread','Weave to Fate','Pull the Thread']
  },

  /* ─────────────── ACTIVE QUESTION ─────────────── */
  [SCREENS.QUESTION]: {
    btnMap : { 1:'answer-a',       2:'answer-b',       3:'answer-c'    },
    labels : ['Choose A','Choose B','Choose C']
  },

  /* ─────────────── QUESTION RESULT ─────────────── */
  [SCREENS.QUESTION_RESULT]: {
    btnMap : { 1:'challenge-result', 2:'plead-result', 3:'accept-result' },
    labels : ['Fight Fate','Plead Case','Accept Fate']
  },

  /* ─────────────── THREAD SEVERED ─────────────── */
  [SCREENS.THREAD_SEVERED]: {
    btnMap : { 1:'no-op',          2:'no-op',          3:'no-op'       },
    labels : ['NOUS','NO USE','NOUS']
  },

  /* ─────────────── FATE RESULT ─────────────── */
  [SCREENS.FATE_RESULT]: {
    btnMap : { 1:'challenge-result', 2:'plead-result', 3:'accept-result' },
    labels : ['Fight Fate','Plead Case','Accept Fate']
  },

  /* ─────────────── FINAL ARC ─────────────── */
  [SCREENS.LAST_DECK]: {
    btnMap : { 1:'turn-back',      2:'tempt-fate',     3:'next-round'  }, // tweak if different
    labels : ['Turn Back','Tempt Fate','Push On']
  },

  [SCREENS.FINAL_QUESTION]: {
    btnMap : { 1:'answer-a',       2:'answer-b',       3:'answer-c'    },
    labels : ['Choose A','Choose B','Choose C']
  },

  [SCREENS.FINAL_RESULT]: {
    btnMap : { 1:'challenge-result', 2:'plead-result', 3:'accept-result' },
    labels : ['Fight Fate','Plead Case','Accept Fate']
  },

  [SCREENS.FINAL_READING]: {
    btnMap : { 1:'save-reading',   2:'restart-game',   3:'quit-game'   },
    labels : ['Save Reading','Again!','Quit']
  },

  /* ─────────────── END GAME / META ─────────────── */
  [SCREENS.GAME_OVER]: {
    btnMap : { 1:'restart-game',   2:'no-op',          3:'quit-game'   },
    labels : ['Try Again','NOUS','Exit']
  },

  [SCREENS.RESULTS]: {
    btnMap : { 1:'restart-game',   2:'save-reading',   3:'quit-game'   },
    labels : ['Play Again','Save Reading','Quit']
  },

  [SCREENS.CREDITS]: {
    btnMap : { 1:'back-to-welcome', 2:'no-op',          3:'no-op'       },
    labels : ['Main Menu',DISABLED,DISABLED]
  }
};
