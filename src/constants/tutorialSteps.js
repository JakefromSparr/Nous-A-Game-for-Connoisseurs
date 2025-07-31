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
  { id: 'welcome-1',
    text: 'These three buttons are all you need. The labels change. We’ll still know what you meant to press.',
    anchorId: 'controller', placement: 'top'
  },
  { id: 'welcome-2',
    text: 'Move the cursor with Up and Down. Use Select to commit. Simple—until it isn’t.',
    anchorId: 'controller', placement: 'top'
  },

  // Game lobby
  { id: 'lobby-tempt',
    text: 'Tempt Fate draws a card that bends the round. You can only follow one destiny at a time.',
    anchorId: 'btn1', placement: 'top'
  },
  { id: 'lobby-push',
    text: 'Push On to begin a round. Thread is your breath. It frays so easily.',
    anchorId: 'btn2', placement: 'top'
  },

  // Round lobby HUD
  { id: 'hud-thread',
    text: 'Thread: how many pulls you can risk before something notices.',
    anchorId: 'thread-display', placement: 'right'
  },
  { id: 'hud-roundscore',
    text: 'Round Score: points you’ve earned—but not yet kept.',
    anchorId: 'round-score', placement: 'right'
  },
  { id: 'hud-rounds-to-win',
    text: 'Rounds to Win: get this to zero. If you can.',
    anchorId: 'rounds-display', placement: 'right'
  },

  // Round lobby actions
  { id: 'pull',
    text: 'Pulling always costs one thread up front. Some answers refund. Wrong ones make you bleed.',
    anchorId: 'btn2', placement: 'top'
  },
  { id: 'weave',
    text: 'Pay one thread now to double the next question’s points. No stacking. We’re not that generous.',
    anchorId: 'btn1', placement: 'top'
  },
  { id: 'tieoff',
    text: 'Bank your round score and end it. Safety is a kind of bravery. Or a confession.',
    anchorId: 'btn0', placement: 'top'
  },

  // Question & reveal
  { id: 'question-choice',
    text: 'Some answers are Correct. Some are Revelatory. All of them tell us something about you.',
    anchorId: 'question-text', placement: 'bottom'
  },
  { id: 'reveal',
    text: 'Correct (the clever kind) refunds your pull. Not Wrong earns points. Wrong leaves teeth marks.',
    anchorId: 'result-explanation', placement: 'top'
  },

  // Fate
  { id: 'fate-arm',
    text: 'Choose a destiny: one pays now, one wagers on your pattern, one changes the room. All are binding.',
    anchorId: 'fate-card-title', placement: 'bottom'
  },

  // Sever & close
  { id: 'severed',
    text: 'Thread at zero severs the round. You lose a life, and your points turn to dust.',
    anchorId: 'lost-points-display', placement: 'top'
  },
  { id: 'closing',
    text: 'That’s all you need. The rest is you—and what gets noticed.',
    anchorId: 'controller', placement: 'top'
  },
];
