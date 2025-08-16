// src/engine/tutorialEngine.js
import { State }   from '../state.js';
import { UI }      from '../ui.js';
import { SCREENS } from '../constants/screens.js';
import { COACH_STEPS } from '../constants/tutorialSteps.js';

let _running = false;

/** Helpers */
const getStepIdx = () => Math.max(0, (State.getState().tutorial?.step ?? 0));
const getStep    = () => COACH_STEPS[getStepIdx()] || null;

function goTo(screen) {
  const s = State.getState();
  if (s.currentScreen !== screen) {
    State.patch({ currentScreen: screen });
    UI.updateScreen(screen);
  }
}

/** Draw a tutorial (Tier-0) question immediately and route to QUESTION */
function _forceTutorialQuestion(which = 0) {
  const s   = State.getState();
  const deck = s.questionDeck || [];
  const answered = s.answeredQuestionIds || new Set();

  const TUTORIAL_IDS = ['TUT001', 'TUT002'];
  const pool = deck.filter(q => q.tier === 0 && TUTORIAL_IDS.includes(String(q.id)));
  if (!pool.length) return;

  const preferredId = TUTORIAL_IDS[Math.min(which, TUTORIAL_IDS.length - 1)];
  const q =
    pool.find(x => String(x.id) === preferredId && !answered.has(x.id)) ||
    pool.find(x => !answered.has(x.id)) ||
    pool[0];

  const keys = ['A','B','C'];
  const answers = (q.answers || []).slice(0,3).map((a,i)=>({
    key: keys[i],
    label: a.label,
    answerClass: a.answerClass,
    explanation: a.explanation,
  }));

  State.patch({
    currentQuestion: q,
    currentAnswers : answers,
    currentCategory: q.category || q.title || '',
  });
  goTo(SCREENS.QUESTION);
}

/** Core: display current step, optionally run a task (like “ask a card”) */
function _displayStep() {
  const step = getStep();
  if (!step) return _end();

  // Switch screens first, then place the coach
  goTo(step.screen);

  // Place the overlay (lighter veil by default; tunable per step)
  const anchor = step.anchorId ? document.getElementById(step.anchorId) : null;
  UI.hideCoach({ clearAnchor: true });
  UI.showCoach({
    text:      step.text,
    anchor:    anchor || undefined,
    placement: step.placement || 'right',
    veil:      step.veil ?? 0.18,   // <— lighter, readable
    blur:      step.blur ?? 0,      // <— no blur unless explicitly requested
  });

  // Optional per-step task
  if (step.task && step.task.type === 'ask-tutorial-q') {
    _forceTutorialQuestion(step.task.which ?? 0);
    // Optionally, auto-advance after the player accepts the reveal (see handleAction’s afterRevealAccept)
    const s = State.getState();
    const t = { ...(s.tutorial || {}) };
    t.awaitRevealToAdvance = !!step.task.autoAdvanceAfterReveal;
    State.patch({ tutorial: t });
  }
}

/** Advance / back / end */
function _advanceStep() {
  const s = State.getState();
  const next = (s.tutorial?.step ?? 0) + 1;
  State.patch({ tutorial: { ...(s.tutorial||{}), step: next } });
  _displayStep();
}

function _prevStep() {
  const s = State.getState();
  const prev = Math.max(0, (s.tutorial?.step ?? 0) - 1);
  State.patch({ tutorial: { ...(s.tutorial||{}), step: prev } });
  _displayStep();
}

function _end() {
  _running = false;
  UI.hideCoach();
  State.patch({ tutorial: { active: false, step: 0, lastQ: null, awaitRevealToAdvance: false } });
}

/** Public API */
export function startTutorial() {
  if (_running) return;
  _running = true;
  State.patch({ tutorial: { active: true, step: 0, lastQ: null, awaitRevealToAdvance: false } });
  UI.bindCoachHandlers({ onNext: _advanceStep, onSkip: _end });
  _displayStep();
}
export function advanceStep()   { _advanceStep(); }
export function prevStep()      { _prevStep(); }
export function endTutorial()   { _end(); }

/**
 * Hook: after a REVEAL “Accept” while tutorial is running,
 * auto-advance if the step requested it (used by ask-tutorial-q).
 */
export function maybeAdvanceAfterReveal() {
  const s = State.getState();
  if (s.tutorial?.active && s.tutorial.awaitRevealToAdvance) {
    const t = { ...(s.tutorial||{}) };
    t.awaitRevealToAdvance = false;
    State.patch({ tutorial: t });
    _advanceStep();
  }
}
