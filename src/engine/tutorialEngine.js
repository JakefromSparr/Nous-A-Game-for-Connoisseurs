// src/engine/tutorialEngine.js
import { State } from '../state.js';
import { UI }    from '../ui.js';
import { COACH_STEPS } from '../constants/tutorialSteps.js'; // pull your steps array into its own file

let _coachIndex = 0;
let _running    = false;

function _showStep() {
  const step = COACH_STEPS[_coachIndex];
  if (!step) return _end();

  const anchorEl = document.getElementById(step.anchorId);
  UI.showCoach({
    text:      step.text,
    anchor:    anchorEl || undefined,
    placement: step.placement,
  });
}

function _onNext() {
  UI.hideCoach();
  _coachIndex += 1;
  _showStep();
}

function _onSkip() {
  UI.hideCoach();
  _end();
}

function _end() {
  _running = false;
  State.patch({ tutorial: { active: false, step: 0, lastQ: null } });
}

export function startTutorial() {
  if (_running) return;
  _running    = true;
  _coachIndex = 0;

  State.patch({ tutorial: { active: true, step: 0, lastQ: null } });
  UI.bindCoachHandlers({ onNext: _onNext, onSkip: _onSkip });

  // slight delay so DOM is ready
  setTimeout(_showStep, 0);
}

export function endTutorial() {
  _end();
}

export function advanceStep() {
  const s   = State.getState();
  const cur = s.tutorial?.step ?? 0;
  State.patch({ tutorial: { ...(s.tutorial || {}), step: cur + 1 } });
}

// ------------------------------------------------------------------
// Legacy tutorial question logic (if you still need it below)

const TUTORIAL_IDS = ['TUT001', 'TUT002'];

export function drawTutorialQuestion(state) {
  const deck     = state.questionDeck || [];
  const answered = state.answeredQuestionIds || new Set();
  const step     = state.tutorial?.step ?? 0;

  const tutPool = deck.filter(
    q => q.tier === 0 && TUTORIAL_IDS.includes(String(q.id))
  );
  if (!tutPool.length) return { question: null, answers: [], category: '' };

  const preferredId = TUTORIAL_IDS[Math.min(step, TUTORIAL_IDS.length - 1)];
  let q =
    tutPool.find(q => String(q.id) === preferredId && !answered.has(q.id)) ||
    tutPool.find(q => !answered.has(q.id)) ||
    tutPool[0];

  const keys = ['A', 'B', 'C'];
  const answers = (q.answers || []).slice(0,3).map((a,i) => ({
    key:         keys[i],
    label:       a.label,
    answerClass: a.answerClass,
    explanation: a.explanation,
  }));

  return { question: q, answers, category: q.category || q.title || '' };
}
