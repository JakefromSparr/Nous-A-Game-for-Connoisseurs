import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { State } from '../src/state.js';
import { evaluate } from '../src/engine/questionEngine.js';
import * as Fate from '../src/engine/fateEngine.js';
import * as Round from '../src/engine/roundEngine.js';
import { sanitizeBeforeSave, validateOnLoad } from '../src/validator.js';
import { composeFinalReading } from '../src/engine/readingEngine.js';
import { SCREENS } from '../src/constants/screens.js';
import { ROUTES } from '../src/constants/routes.js';

function answer(kind, label = 'Potential') {
  State.resetGame();
  State.patch({ currentQuestion: { id: 501, text: 'What do you see?' }, currentAnswers: [{ key: 'A', label, answerClass: kind }], thread: 3 });
  return evaluate(0, State.getState()).patch;
}

test('outcomes adjust Thread and answer-specific traits', () => {
  assert.equal(answer('WRONG').thread, 2);
  assert.equal(answer('TYPICAL').thread, 3);
  assert.equal(answer('REVELATORY').thread, 4);
  assert.notDeepEqual(State.getState().traits, { X: 0, Y: 0, Z: 0 });
  assert.equal(State.getState().classTally.REVELATORY, 1);
});

test('tie off banks points and finalization advances and scores', () => {
  const state = { roundScore: 4, thread: 2, notWrongCount: 3, audacity: 0, score: 1, roundsWon: 0, roundNumber: 1 };
  const tied = Round.tieOff(state);
  assert.deepEqual([tied.pendingBank, tied.roundWon], [4, true]);
  const final = Round.finalizeRound({ ...state, ...tied }, {});
  assert.deepEqual([final.score, final.roundsWon, final.roundNumber], [5, 1, 2]);
});

test('severed rounds lose their bank and still finalize', () => {
  const severed = Round.sever({ roundScore: 7, lives: 2, notWrongCount: 1 });
  assert.deepEqual([severed.lostRoundPoints, severed.lives], [7, 1]);
  const final = Round.finalizeRound({ ...severed, score: 3, roundsWon: 0, roundNumber: 1 }, {});
  assert.deepEqual([final.score, final.roundNumber], [3, 2]);
});

test('Fate effects remain in state and resolve later', () => {
  const state = { roundScore: 0, activeRoundEffects: [], activePowerUps: [], completedFateCardIds: new Set(), activeFateCard: { id: 'F', title: 'A wager' } };
  const patch = Fate.applyChoice({ effect: { type: 'APPLY_WAGER', target: 'C', reward: { type: 'SCORE', value: 2 } } }, state);
  assert.equal(patch.activeRoundEffects.length, 1);
  const result = Fate.resolveRound({ A: 0, B: 0, C: 2 }, true, { ...state, ...patch, pendingBank: 3 });
  assert.equal(result.roundScoreDelta, 4);
});

test('Fate uses one persisted card slot', () => {
  const patch = Fate.armFate({
    id: 'F',
    choices: [{ id: 'F:0', label: 'Choose', effect: null }],
  });

  assert.equal(patch.activeFateCard.id, 'F');
  assert.equal('currentFateCard' in patch, false);
  assert.equal('pendingFateCard' in patch, false);
});

test('fractional traits save and load', () => {
  State.resetGame();
  State.patch({ traits: { X: 0.6, Y: -0.3, Z: 0.25 } });
  const saved = sanitizeBeforeSave(State.getState());
  assert.equal(saved.ok, true);
  assert.equal(validateOnLoad(saved.data).ok, true);
});

test('Final Reading cites actual choices', () => {
  const reading = composeFinalReading({ traits: { X: 4, Y: 1, Z: -1 }, classTally: { TYPICAL: 1, REVELATORY: 2, WRONG: 0 }, choiceEvidence: [{ questionText: 'Which door?', chosenLabel: 'The side door' }] });
  assert.match(reading.paragraphs.join(' '), /Which door.*The side door/);
});

test('screens, routes, and HTML stay in sync', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const htmlScreens = [...html.matchAll(/data-screen="([^"]+)"/g)].map((match) => match[1]);
  const screenIds = Object.values(SCREENS);

  assert.deepEqual([...htmlScreens].sort(), [...screenIds].sort());
  assert.deepEqual(Object.keys(ROUTES).sort(), [...screenIds].sort());

  for (const [screen, route] of Object.entries(ROUTES)) {
    assert.equal(route.labels.length, 3, `${screen} must have three labels`);
    assert.equal(route.actions.length, 3, `${screen} must have three actions`);
  }
});
