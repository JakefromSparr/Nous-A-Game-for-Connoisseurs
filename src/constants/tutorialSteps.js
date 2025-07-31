/** Advance tutorial step (call after a reveal accept if you like) */
export function advanceStep() {
  const s = State.getState();
  const cur = s.tutorial?.step ?? 0;
  State.patch({ tutorial: { ...(s.tutorial || {}), step: cur + 1 } });
}
// src/engine/tutorialEngine.js (excerpt)

// Minimal step model. You can extend with `when(state)` to gate by screen/phase.
export const COACH_STEPS = [
  // Welcome / controls
  {
    id: 'welcome-1',
    screen: SCREENS.WELCOME,
    text: 'These three buttons are all you need. The labels change. We’ll still know what you meant to press.',
    anchorId: 'controller',
    placement: 'top',
  },
  {
    id: 'welcome-2',
    screen: SCREENS.WELCOME,
    text: 'Move the cursor with Up and Down. Use Select to commit. Simple—until it isn’t.',
    anchorId: 'controller',
    placement: 'top',
  },

  // Parlor / Game Lobby
  {
    id: 'lobby-score',
    screen: SCREENS.GAME_LOBBY,
    text: 'The Parlor shows your total score and active divinations.',
    anchorId: 'hud',
    placement: 'top',
  },
  {
    id: 'lobby-rounds',
    screen: SCREENS.GAME_LOBBY,
    text: 'Rounds to Win: get this to zero… lose lives when your thread severs.',
    anchorId: 'rounds-display',
    placement: 'right',
  },
  {
    id: 'lobby-tempt',
    screen: SCREENS.GAME_LOBBY,
    text: 'Tempt Fate draws a card that bends the round. You can only follow one destiny at a time.',
    anchorId: 'btn1',
    placement: 'top',
  },
  {
    id: 'lobby-push',
    screen: SCREENS.GAME_LOBBY,
    text: 'Push On to begin a round. Thread is your breath. It frays so easily.',
    anchorId: 'btn2',
    placement: 'top',
  },

  // Round Lobby HUD
  {
    id: 'hud-thread',
    screen: SCREENS.ROUND_LOBBY,
    text: 'Thread: how many pulls you can risk before something notices.',
    anchorId: 'thread-display',
    placement: 'right',
  },
  {
    id: 'hud-score',
    screen: SCREENS.ROUND_LOBBY,
    text: 'Round Score: points you’ve earned—but not yet kept.',
    anchorId: 'round-score',
    placement: 'right',
  },

  // Round Lobby Actions
  {
    id: 'action-tieoff',
    screen: SCREENS.ROUND_LOBBY,
    text: 'Bank your round score and end it. Safety is a kind of bravery.',
    anchorId: 'btn0',
    placement: 'top',
  },
  {
    id: 'action-weave',
    screen: SCREENS.ROUND_LOBBY,
    text: 'Pay one thread now to double the next question’s points. No stacking.',
    anchorId: 'btn1',
    placement: 'top',
  },
  {
    id: 'action-pull',
    screen: SCREENS.ROUND_LOBBY,
    text: 'Pulling always costs one thread up front. Some answers refund. Wrong ones make you bleed.',
    anchorId: 'btn2',
    placement: 'top',
  },

  // Question & Reveal
  {
    id: 'question-step',
    screen: SCREENS.QUESTION,
    text: 'Some answers are Correct. Some are Revelatory. All of them tell us something about you.',
    anchorId: 'question-text',
    placement: 'bottom',
  },
  {
    id: 'select-answer',
    screen: SCREENS.QUESTION,
    text: 'Select an answer to see the result.',
    anchorId: 'btn2',
    placement: 'top',
  },
  {
    id: 'reveal-step',
    screen: SCREENS.REVEAL,
    text: 'Correct answers refund your thread; wrong answers leave teeth marks.',
    anchorId: 'result-explanation',
    placement: 'top',
  },

  // Sever & Fate
  {
    id: 'severed',
    screen: SCREENS.THREAD_SEVERED,
    text: 'Thread at zero severs the round. You lose a life and your points turn to dust.',
    anchorId: 'lost-points-display',
    placement: 'top',
  },
  {
    id: 'fate-step',
    screen: SCREENS.FATE,
    text: 'Choose a destiny: one pays now, one wagers on your pattern, one changes the room.',
    anchorId: 'fate-card-title',
    placement: 'bottom',
  },
  {
    id: 'parlor-return',
    screen: SCREENS.GAME_LOBBY,
    text: 'The Parlor: your total score has been updated.',
    anchorId: 'score-display',
    placement: 'top',
  },

  // Closing
  {
    id: 'closing',
    screen: SCREENS.GAME_LOBBY,
    text: 'That’s all you need. The rest is you—and what gets noticed.',
    anchorId: 'controller',
    placement: 'top',
  },
];

