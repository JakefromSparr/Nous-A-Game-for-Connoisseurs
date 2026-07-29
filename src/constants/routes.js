// src/constants/routes.js
import { SCREENS } from './screens.js';

// Exactly 3 labels and 3 actions per screen.
// labels[i]: string | (state)=>string
// actions[i]: string | null  (null = visible but disabled / taunt)
export const ROUTES = {
  // ───────────── ENTRY ─────────────
  [SCREENS.WELCOME]: {
    labels: ['Down','Select','Up'],
    actions: ['welcome-down','welcome-select','welcome-up'],
  },

  [SCREENS.WAITING_ROOM]: {
    labels: [
      s => (s.waitingRoomReceiptVisible ? 'Turn Back' : 'Less'),
      s => (s.waitingRoomReceiptVisible ? 'Enter' : 'Confirm'),
      s => (s.waitingRoomReceiptVisible ? '' : 'More'),
    ],
    actions: ['participants-down','participants-confirm','participants-up'],
  },

  [SCREENS.RULES]: {
    labels: ['I’ve Heard Enough','',''],
    actions: ['back-to-welcome', null, null],
  },

  [SCREENS.OPTIONS]: {
    // Left is now Back so players aren’t trapped in Options
    labels: ['Back','Confirm','Harder →'],
    actions: ['back-to-welcome','options-select','options-next-difficulty'],
  },

  // ───────────── MAIN LOBBY ─────────────
  [SCREENS.GAME_LOBBY]: {
    labels: [
      () => 'Turn Back',
      s => {
        if (s.firstEntryActive) return s.tasselTaken ? 'In Hand' : 'Take Tassel';
        return Array.isArray(s.activeRoundEffects) && s.activeRoundEffects.length > 0
          ? 'NOUS'
          : 'Tempt Fate';
      },
      () => 'Push On',
    ],
    actions: ['back-to-welcome','parlor-middle','to-round-lobby'],
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
    actions: ['reveal-fight', null, 'reveal-accept'],   // Plead Case = null (visible, disabled)
  },

  // ───────────── FATE (1–3 options; holes render NOUS) ─────────────
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
    actions: ['fate-fight', null, 'fate-accept'],
  },

  // ───────────── THREAD SEVERED ─────────────
  [SCREENS.THREAD_SEVERED]: {
    labels: ['NOUS','NO USE','NOUS'],
    actions: [null, 'sever-ack', null],                 // only center does anything
  },

  // ───────────── FINAL READING ─────────────
  [SCREENS.FINAL_READING]: {
    labels: ['', 'Play Again', ''],
    actions: [null, 'reset-game', null],
  },
};
