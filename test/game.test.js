import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { State } from '../src/state.js';
import {
  drawQuestion,
  evaluate,
  prepareCrossroads,
} from '../src/engine/questionEngine.js';
import * as Fate from '../src/engine/fateEngine.js';
import * as Round from '../src/engine/roundEngine.js';
import { sanitizeBeforeSave, validateOnLoad } from '../src/validator.js';
import { composeFinalReading } from '../src/engine/readingEngine.js';
import { SCREENS } from '../src/constants/screens.js';
import { ROUTES } from '../src/constants/routes.js';
import questionDeck from '../src/constants/questionDeck.js';
import { ID_TO_GROUPS } from '../src/constants/questionGroups.js';
import { TRAIT_LOADINGS } from '../src/constants/traitConfig.js';

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
  const patch = Fate.applyChoice({ id: 'F:0', label: 'Wait', effect: { type: 'APPLY_WAGER', target: 'C', reward: { type: 'SCORE', value: 2 } } }, state);
  assert.equal(patch.activeRoundEffects.length, 1);
  assert.deepEqual(patch.fateEvidence[0], {
    cardId: 'F',
    cardTitle: 'A wager',
    choiceId: 'F:0',
    chosenLabel: 'Wait',
    effectTypes: ['APPLY_WAGER'],
    roundNumber: 1,
  });
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

  const olderSave = { ...saved.data };
  delete olderSave.fateEvidence;
  const loadedOlderSave = validateOnLoad(olderSave);
  assert.equal(loadedOlderSave.ok, true);
  assert.deepEqual(loadedOlderSave.data.fateEvidence, []);
});

test('Final Reading cites actual choices', () => {
  const reading = composeFinalReading({ traits: { X: 4, Y: 1, Z: -1 }, classTally: { TYPICAL: 1, REVELATORY: 2, WRONG: 0 }, choiceEvidence: [{ questionText: 'Which door?', chosenLabel: 'The side door', kind: 'REVELATORY' }] });
  assert.match(reading.paragraphs.join(' '), /Which door.*The side door/);
});

test('Final Reading changes its portrait for distinct trait patterns', () => {
  const evidence = [
    { questionId: 101, questionText: 'Which way?', chosenLabel: 'The measured path', kind: 'TYPICAL', category: 'Mind', tier: 1 },
    { questionId: 202, questionText: 'What remains?', chosenLabel: 'The implication', kind: 'REVELATORY', category: 'Soul', tier: 2 },
    { questionId: 303, questionText: 'What moved?', chosenLabel: 'The shadow', kind: 'WRONG', category: 'Body', tier: 3 },
    { questionId: 401, questionText: 'What can be proven?', chosenLabel: 'The record', kind: 'TYPICAL', category: 'Mind', tier: 4 },
  ];
  const analytical = composeFinalReading({
    traits: { X: -6, Y: -1, Z: 3 },
    classTally: { TYPICAL: 3, REVELATORY: 1, WRONG: 0 },
    choiceEvidence: evidence,
  });
  const figurative = composeFinalReading({
    traits: { X: 1, Y: 2, Z: -6 },
    classTally: { TYPICAL: 1, REVELATORY: 3, WRONG: 0 },
    choiceEvidence: evidence,
  });

  assert.equal(analytical.title, 'The Measured Doubt');
  assert.equal(analytical.meta.primary, 'X-');
  assert.equal(figurative.title, 'The Question Beneath');
  assert.equal(figurative.meta.primary, 'Z-');
  assert.notDeepEqual(analytical.paragraphs, figurative.paragraphs);
});

test('Final Reading interprets Fate choices and remains deterministic', () => {
  const state = {
    traits: { X: 3.5, Y: 4.5, Z: -2 },
    classTally: { TYPICAL: 2, REVELATORY: 4, WRONG: 1 },
    choiceEvidence: [
      { questionId: 110, questionText: 'What happens when you cross a line?', chosenLabel: 'You get in trouble.', kind: 'REVELATORY', category: 'Soul', tier: 1 },
      { questionId: 405, questionText: 'Which phrase was borrowed?', chosenLabel: 'A sight for sore eyes', kind: 'TYPICAL', category: 'Mind', tier: 4 },
    ],
    fateEvidence: [{
      cardId: 'DYN002',
      cardTitle: 'Predictive Loop',
      chosenLabel: "Predict 'B'",
      effectTypes: ['ROUND_PREDICTION'],
    }],
  };
  const first = composeFinalReading(state);
  const second = composeFinalReading(state);
  const text = first.paragraphs.join(' ');

  assert.deepEqual(first, second);
  assert.equal(first.meta.fatePattern, 'LEVERAGE');
  assert.match(text, /Predictive Loop.*Predict 'B'/);
  assert.match(text, /consensus|agreement/i);
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

test('First Entry uses only cards 001–003 and starts with three or four Thread', () => {
  const base = {
    questionDeck,
    firstEntryActive: true,
    tasselTaken: false,
    activeRoundEffects: [],
  };
  const withoutTassel = Round.startRound(base);
  const withTassel = Round.startRound({ ...base, tasselTaken: true });

  assert.deepEqual(withoutTassel.roundQuestionIds, ['001', '002', '003']);
  assert.equal(withoutTassel.thread, 3);
  assert.equal(withTassel.thread, 4);
  assert.equal(withTassel.isIntroRound, true);
});

test('First Entry is a prologue and does not count as a won round', () => {
  const state = {
    isIntroRound: true,
    notWrongCount: 1,
    roundScore: 2,
    thread: 2,
    score: 0,
    roundsWon: 0,
    roundNumber: 1,
    lives: 2,
  };
  const tied = Round.tieOff(state);
  const finalized = Round.finalizeRound({ ...state, ...tied }, {});

  assert.equal(tied.roundWon, true);
  assert.equal(finalized.score, 2);
  assert.equal(finalized.roundsWon, 0);
  assert.equal(finalized.roundNumber, 1);
  assert.equal(finalized.firstEntryActive, false);
});

test('normal rounds deal six unanswered non-tutorial cards from any tier', () => {
  const highTierDeck = questionDeck.filter((question) => question.tier >= 4);
  const state = {
    questionDeck: highTierDeck,
    answeredQuestionIds: new Set(),
    firstEntryActive: false,
    nextRoundT0: 4,
    activeRoundEffects: [],
    difficultyLevel: 1,
    roundsWon: 2,
  };
  const round = Round.startRound(state);

  assert.equal(round.roundQuestionIds.length, 6);
  assert.equal(round.roundCardLimit, 6);
  assert.equal(round.roundQuestionIds.every((id) => {
    const question = highTierDeck.find((item) => item.id === id);
    return question && question.tier >= 4;
  }), true);
});

test('a round packet recycles only after its unseen cards are exhausted', () => {
  State.resetGame();
  const shape = questionDeck.find((question) => question.id === '001');
  const classic = questionDeck.find((question) => question.id === '002');
  State.patch({
    questionDeck: [shape, classic],
    roundQuestionIds: ['001', '002'],
    roundDrawPile: ['001', '002'],
    roundIsRecycling: false,
    isIntroRound: true,
    questionHistory: {},
  });

  const first = drawQuestion(State.getState());
  State.patch(first.patch);
  const second = drawQuestion(State.getState());
  State.patch(second.patch);
  const recycled = drawQuestion(State.getState());

  assert.equal(first.question.id, '001');
  assert.equal(second.question.id, '002');
  assert.equal(recycled.patch.currentQuestionIsRepeat, true);
  assert.equal(['001', '002'].includes(recycled.question.id), true);
});

test('recycled cards disable prior answers and do not collect traits again', () => {
  State.resetGame();
  const shape = questionDeck.find((question) => question.id === '001');
  State.patch({
    questionDeck: [shape],
    roundQuestionIds: ['001'],
    roundDrawPile: ['001'],
    roundIsRecycling: false,
    isIntroRound: true,
    questionHistory: {},
    thread: 10,
  });

  const first = drawQuestion(State.getState());
  State.patch({
    ...first.patch,
    currentQuestion: first.question,
    currentAnswers: first.answers,
  });
  const squareIndex = first.answers.findIndex((item) => item.label === 'Square');
  State.patch(evaluate(squareIndex, State.getState()).patch);
  const traitsAfterFirstChoice = { ...State.getState().traits };

  const recycled = drawQuestion(State.getState());
  const square = recycled.answers.find((item) => item.label === 'Square');
  assert.equal(recycled.patch.currentQuestionIsRepeat, true);
  assert.equal(square.unavailable, true);

  State.patch({
    ...recycled.patch,
    currentQuestion: recycled.question,
    currentAnswers: recycled.answers,
  });
  const triangleIndex = recycled.answers.findIndex((item) => item.label === 'Triangle');
  State.patch(evaluate(triangleIndex, State.getState()).patch);
  assert.deepEqual(State.getState().traits, traitsAfterFirstChoice);
});

test('tutorial cards are isolated from the normal deck and preserve authored copy', () => {
  const tutorial = questionDeck.filter((question) => question.tier === 0);
  const shape = tutorial.find((question) => question.id === '001');
  const classic = tutorial.find((question) => question.id === '002');
  const afterWord = tutorial.find((question) => question.id === '003');

  assert.deepEqual(tutorial.map((question) => question.id), ['001', '002', '003']);
  assert.equal(shape.answers[1].label, 'Square');
  assert.equal(shape.insert, 'Every story has two sides. Questions are less considerate.');
  assert.equal(classic.title, 'A Classic');
  assert.equal(afterWord.title, 'After Word');
});

test('Tier 5 cards stay gated until two normal rounds are won', () => {
  const gatedDeck = questionDeck.filter((question) => question.tier >= 4);
  const base = {
    questionDeck: gatedDeck,
    answeredQuestionIds: new Set(),
    firstEntryActive: false,
    activeRoundEffects: [],
  };
  const beforeGate = Round.startRound({ ...base, roundsWon: 1 });
  const afterGate = Round.startRound({ ...base, roundsWon: 2 });

  assert.equal(beforeGate.roundQuestionIds.every((id) => {
    return gatedDeck.find((question) => question.id === id)?.tier === 4;
  }), true);
  assert.equal(afterGate.roundQuestionIds.some((id) => {
    return gatedDeck.find((question) => question.id === id)?.tier === 5;
  }), true);

  State.resetGame();
  const tierOne = questionDeck.find((question) => question.id === 102);
  const tierFive = questionDeck.find((question) => question.id === 501);
  State.patch({
    questionDeck: [tierFive, tierOne],
    roundQuestionIds: [501, 102],
    roundDrawPile: [501, 102],
    roundsWon: 1,
  });
  assert.deepEqual(prepareCrossroads(State.getState()).candidates, [102]);
});

test('normal rounds reset to four Thread unless the tassel carries up to two', () => {
  const withoutTassel = Round.startRound({
    questionDeck,
    answeredQuestionIds: new Set(),
    firstEntryActive: false,
    tasselTaken: false,
    nextRoundT0: 6,
    activeRoundEffects: [],
    roundsWon: 0,
  });

  const withTassel = Round.startRound({
    questionDeck,
    answeredQuestionIds: new Set(),
    firstEntryActive: false,
    tasselTaken: true,
    nextRoundT0: 6,
    activeRoundEffects: [],
    roundsWon: 0,
  });

  assert.equal(withoutTassel.thread, 4);
  assert.equal(withTassel.thread, 6);
  assert.equal(Round.tieOff({
    roundScore: 3,
    notWrongCount: 3,
    tasselTaken: false,
    thread: 4,
  }).nextRoundT0, 4);
  assert.equal(Round.tieOff({
    roundScore: 3,
    notWrongCount: 3,
    tasselTaken: true,
    thread: 1,
  }).nextRoundT0, 5);
  assert.equal(Round.tieOff({
    roundScore: 3,
    notWrongCount: 3,
    tasselTaken: true,
    thread: 4,
  }).nextRoundT0, 6);
});

test('Crossroads offers two packet cards and spends only the selected path', () => {
  State.resetGame();
  const capital = questionDeck.find((question) => question.id === 102);
  const between = questionDeck.find((question) => question.id === 103);
  const eyeWitness = questionDeck.find((question) => question.id === 105);
  State.patch({
    questionDeck: [capital, eyeWitness, between],
    roundQuestionIds: [102, 105, 103],
    roundDrawPile: [102, 105, 103],
    roundIsRecycling: false,
    questionHistory: {},
  });

  const crossroads = prepareCrossroads(State.getState());
  assert.deepEqual(crossroads.candidates, [102, 103]);
  assert.deepEqual(crossroads.patch.roundDrawPile, [102, 105, 103]);

  State.patch(crossroads.patch);
  const selected = drawQuestion(State.getState(), 103);
  assert.equal(selected.question.id, 103);
  assert.deepEqual(selected.patch.roundDrawPile, [102, 105]);
});

test('new Tier 1 and Tier 4 cards are valid and trait-routed', () => {
  const expected = new Map([
    [110, { tier: 1, classes: ['TYPICAL', 'REVELATORY', 'WRONG'] }],
    [111, { tier: 1, classes: ['TYPICAL', 'REVELATORY', 'WRONG'] }],
    [112, { tier: 1, classes: ['TYPICAL', 'REVELATORY', 'WRONG'] }],
    [403, { tier: 4, classes: ['TYPICAL', 'WRONG', 'WRONG'] }],
    [404, { tier: 4, classes: ['TYPICAL', 'WRONG', 'WRONG'] }],
    [405, { tier: 4, classes: ['TYPICAL', 'WRONG', 'WRONG'] }],
  ]);

  assert.equal(new Set(questionDeck.map((question) => question.id)).size, questionDeck.length);

  for (const [id, shape] of expected) {
    const question = questionDeck.find((candidate) => candidate.id === id);
    assert.ok(question, `question ${id} should exist`);
    assert.equal(question.tier, shape.tier);
    assert.equal(question.answers.length, 3);
    assert.deepEqual(
      question.answers.map((answer) => answer.answerClass),
      shape.classes
    );
    assert.ok(ID_TO_GROUPS.get(id)?.size, `question ${id} should have a routing group`);
    assert.ok(TRAIT_LOADINGS[id]?.axisWeight, `question ${id} should have trait weights`);
  }
});
