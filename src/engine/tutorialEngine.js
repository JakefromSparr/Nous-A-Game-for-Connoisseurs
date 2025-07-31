// src/engine/tutorialEngine.js
import { State } from '../state.js';

/**
 * Minimal tutorial driver:
 * - Forces draws from TIER 0 only (IDs TUT001, TUT002), in order.
 * - Falls back to first available tutorial question if both were answered
 *   (so the tutorial never stalls).
 */

const TUTORIAL_IDS = ['TUT001', 'TUT002'];

export function startTutorial() {
  const s = State.getState();
  State.patch({ tutorial: { ...(s.tutorial || {}), active: true, step: 0, lastQ: null } });
  // show first hint
  if (typeof window !== 'undefined' && window.UI) {
    const anchor = document.getElementById('controller');
    window.UI.bindCoachHandlers({
      onNext: () => window.UI.hideCoach() /* you can swap this for your real step-advance */,
      onSkip: () => window.UI.hideCoach(),
    });
    window.UI.showCoach({ text: 'These three buttons are all you need. The labels change.', anchor, placement: 'top' });
  }
}

/** End tutorial mode */
export function endTutorial() {
  const s = State.getState();
  State.patch({ tutorial: { active: false, step: 0, lastQ: null } });
}

/**
 * Draw a tutorial question:
 * - Filters deck for tier:0 AND ID in TUTORIAL_IDS
 * - Prefers the next in sequence based on tutorial.step
 * - Ensures we don’t repeat already-answered questions (unless both answered)
 * Returns { question, answers, category }
 */
export function drawTutorialQuestion(state) {
  const deck = state.questionDeck || [];
  const answered = state.answeredQuestionIds || new Set();
  const step = state.tutorial?.step ?? 0;

  // all eligible tutorial questions (tier 0, whitelisted IDs)
  const tutPool = deck.filter(
    q => q && q.tier === 0 && TUTORIAL_IDS.includes(String(q.id))
  );

  if (tutPool.length === 0) {
    // no tutorial content present — fallback to null so router returns to lobby
    return { question: null, answers: [], category: '' };
  }

  // Prefer the next ID in sequence
  const preferredId = TUTORIAL_IDS[Math.min(step, TUTORIAL_IDS.length - 1)];
  let q =
    tutPool.find(q => String(q.id) === preferredId && !answered.has(q.id)) ||
    tutPool.find(q => !answered.has(q.id)) ||
    tutPool[0];

  // Build A/B/C answers without shuffling (tutorial is didactic)
  const keys = ['A', 'B', 'C'];
  const answers = (q?.answers || []).slice(0, 3).map((a, i) => ({
    key: keys[i],
    label: a?.label ?? '',
    answerClass: String(a?.answerClass || '').toUpperCase(),
    explanation: a?.explanation ?? '',
  }));

  return {
    question: q || null,
    answers,
    category: q?.category || q?.title || '',
  };
}

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
