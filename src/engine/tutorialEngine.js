// src/engine/tutorialEngine.js
import { State } from '../state.js';

/**
 * Minimal tutorial driver:
 * - Forces draws from TIER 0 only (IDs TUT001, TUT002), in order.
 * - Falls back to first available tutorial question if both were answered
 *   (so the tutorial never stalls).
 */

const TUTORIAL_IDS = ['TUT001', 'TUT002'];

/** Start tutorial mode (non-persistent; saved state strips it) */
export function startTutorial() {
  const s = State.getState();
  State.patch({
    tutorial: { active: true, step: 0, lastQ: null },
    // land in GAME_LOBBY per current flow; handleAction already sets the screen
    // keep decks & answered IDs intact
  });
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
