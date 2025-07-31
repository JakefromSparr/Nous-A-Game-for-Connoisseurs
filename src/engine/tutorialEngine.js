// src/engine/tutorialEngine.js
import { State }     from '../state.js';
import { UI }        from '../ui.js';
import { SCREENS }   from '../constants/screens.js';
import { COACH_STEPS } from '../constants/tutorialSteps.js';

let _coachIndex = 0;
let _running    = false;

// Display the current step (assumes UI is already on the step.screen)
function _displayStep() {
  const step = COACH_STEPS[_coachIndex];
  if (!step) return _end();

  // highlight target
  const anchor = document.getElementById(step.anchorId);
  UI.hideCoach({ clearAnchor: true });
  UI.showCoach({
    text:      step.text,
    anchor:    anchor || undefined,
    placement: step.placement,
  });
}

// Advance to next step, possibly switching screens
function _onNext() {
  const prev    = COACH_STEPS[_coachIndex];
  _coachIndex++;
  const next    = COACH_STEPS[_coachIndex];

  if (!next) {
    UI.hideCoach();
    return _end();
  }

  // If we need to switch screens:
  if (next.screen && next.screen !== prev.screen) {
    UI.hideCoach();
    State.patch({ currentScreen: next.screen });
    UI.updateScreen(next.screen);
    // wait for your 0.7s fade-in
    setTimeout(_displayStep, 750);
  } else {
    _displayStep();
  }
}

function _onSkip() {
  UI.hideCoach();
  _end();
}

function _end() {
  _running = false;
  State.patch({ tutorial: { active: false, step: 0, lastQ: null } });
}

// Public API
export function startTutorial() {
  if (_running) return;
  _running    = true;
  _coachIndex = 0;

  State.patch({ tutorial: { active: true, step: 0, lastQ: null } });
  UI.bindCoachHandlers({ onNext: _onNext, onSkip: _onSkip });

  // go to first step's screen
  const first = COACH_STEPS[0];
  State.patch({ currentScreen: first.screen });
  UI.updateScreen(first.screen);

  // slight delay to let the screen render
  setTimeout(_displayStep, 750);
}

export function endTutorial() {
  _end();
}
