// src/constants/routes.js
import { SCREENS } from './screens.js';
import { State }   from '../state.js';           // <-- for dynamic labels

/* Helper: blank-out a button that isn’t meant to do anything */
const DISABLED = () => '';

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
  },

  [SCREENS.CREDITS]: {
    btnMap : { 0:'back-to-welcome', 1:'no-op',          2:'no-op'       },
    labels : ['Main Menu',DISABLED,DISABLED]
  }
};
