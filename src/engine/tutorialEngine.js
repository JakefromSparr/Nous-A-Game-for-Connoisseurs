// src/engine/tutorialEngine.js
// Minimal, self-contained tutorial controller.
// Does not touch the main question deck.

export const Tutorial = {
  start(state) {
    state.tutorial = { active: true, step: 0, chosenKey: null, weaveHint: false };
  },
  isActive(state) {
    return !!state?.tutorial?.active;
  },
  // Return a "tutorial question" payload compatible with drawQuestion()
  draw(state) {
    const t = state.tutorial || {};
    const disableKey = t.step >= 1 ? t.chosenKey : null;

    const answers = [
      { key: 'A', label: 'A Plane',        answerClass: 'TYPICAL',    explanation: 'Planes do in fact have wheels (when they land).' },
      { key: 'B', label: 'A Dictionary',   answerClass: 'REVELATORY', explanation: '“Wheels” and “flies” are both words you’ll find inside.' },
      { key: 'C', label: 'A Garbage Truck',answerClass: 'TYPICAL',    explanation: 'The classic riddle answer—wheels, and… plenty of flies.' },
    ].map(a => ({ ...a, disabled: disableKey === a.key }));

    return {
      question : { id: 'TUT:001', category: 'Mind', tier: 1, title: 'What has wheels and flies?', text: 'Choose with care.' },
      answers,
      category: 'Tutorial',
    };
  },
  // Called when player selects an answer on the first pass
  recordChoice(state, key) {
    const t = state.tutorial || (state.tutorial = {});
    if (t.step === 0 && !t.chosenKey) t.chosenKey = key;
  },
  // Called after REVEAL → Accept (or Fight) to move tutorial forward.
  // After second pass, tutorial ends.
  advanceAfterReveal(state) {
    const t = state.tutorial;
    if (!t) return;
    if (t.step === 0) {
      t.step = 1;
      t.weaveHint = true; // router/UI can display hint
    } else {
      t.active = false;
      t.weaveHint = false;
    }
  }
};
