// src/engine/questionEngine.js
import { State } from '../state.js';
import { shuffle } from './utils.js';
import { OUTCOME, OUTCOME_EFFECT, WEAVE } from '../constants/answerLogic.js';

/**
 * DEPRECATED/FALLBACK: Determines the outcome kind for a given question + key.
 * This is kept for compatibility with older data formats but is superseded
 * by the answerClass property carried in the new `buildAnswers` function.
 * @param {object} q - The question object.
 * @param {string} key - The answer key ('A', 'B', or 'C').
 * @returns {string} - The outcome kind (TYPICAL, REVELATORY, WRONG).
 */
function getKind(q, key) {
  // Preferred (old format): explicit map
  if (q.answerKinds && q.answerKinds[key]) return q.answerKinds[key];

  // answers[] form (old format)
  if (Array.isArray(q.answers)) {
    const a = q.answers.find(a => (a.key || '').toUpperCase() === key);
    const cls = (a?.answerClass || '').toUpperCase();
    if (cls === 'TYPICAL' || cls === 'REVELATORY' || cls === 'WRONG') return cls;
  }

  // Fallback: q.correct marks TYPICAL; pick one other as REVELATORY, last as WRONG
  if (q.correct) {
    if (key === q.correct) return OUTCOME.TYPICAL;
    const others = ['A', 'B', 'C'].filter(k => k !== q.correct);
    return key === others[0] ? OUTCOME.REVELATORY : OUTCOME.WRONG;
  }

  // Worst-case: assume C is WRONG, A/B TYPICAL
  return key === 'C' ? OUTCOME.WRONG : OUTCOME.TYPICAL;
}


/**
 * Builds the on-screen answers array from a normalized deck item.
 * It shuffles the answers, assigns keys ('A', 'B', 'C'), and carries
 * the answerClass and explanation for the reveal screen.
 * @param {object} q - The question object from the deck.
 * @returns {Array<object>} - An array of answer objects for the UI.
 */
function buildAnswers(q) {
  // Shuffle the answers from the question's `answers` array.
  const shuffled = shuffle(q.answers || []);
  const keys = ['A', 'B', 'C'];

  // Map the shuffled answers to a new format for the UI.
  return shuffled.slice(0, 3).map((a, i) => ({
    key: keys[i], // Assign a key (A, B, or C)
    label: a.label ?? '',
    answerClass: String(a.answerClass || '').toUpperCase(), // TYPICAL/REVELATORY/WRONG
    explanation: a.explanation ?? '',
  }));
}


/**
 * Draws the next question from the deck, respecting the current tier
 * and avoiding questions that have already been answered.
 * @param {object} state - The current application state.
 * @returns {object} - An object containing the new question, answers, and category.
 */
export function drawQuestion(state) {
  const S = State.getState(); // Use a fresh copy of the state
  const deck = S.questionDeck || [];
  const answered = S.answeredQuestionIds || new Set();
  const activeTier = Math.min(S.roundNumber || 1, 3);

  // Filter the deck to create a pool of eligible questions.
  const pool = deck.filter(q =>
    !answered.has(q.id) && // Use the new `id` field
    (typeof q.tier !== 'number' || q.tier <= activeTier)
  );

  // Select a random question from the pool.
  const q = pool.length ? pool[(Math.random() * pool.length) | 0] : null;
  if (!q) return { question: null, answers: [], category: '' };

  // Return the question and its formatted answers.
  return {
    question: q,
    answers: buildAnswers(q),
    category: q.category || q.title || '',
  };
}

/**
 * Evaluates a chosen answer and calculates the effects on the game state.
 * @param {number} choiceIndex - The index (0-2) of the chosen answer.
 * @param {object} _state - The current application state (passed but we get a fresh copy).
 * @returns {object} - A patch object to be applied to the state.
 */
export function evaluate(choiceIndex, _state) {
  const S = State.getState();
  const q = S.currentQuestion;
  const a = S.currentAnswers?.[choiceIndex];
  if (!q || !a) return { patch: {} };

  // Determine the outcome kind from the answer's class. Fallback to getKind for old formats.
  const key = (a.key || '').toUpperCase();
  const cls = String(a.answerClass || '').toUpperCase();
  const kind = (cls === 'TYPICAL' || cls === 'REVELATORY' || cls === 'WRONG') ? cls : getKind(q, key);
  const eff = OUTCOME_EFFECT[kind] || { points: 0, threadDelta: 0 };

  // Calculate points gained, applying weave multiplier if active.
  const weaveMult = S.weavePrimed ? WEAVE.multiplier : 1;
  const gainedPts = (eff.points || 0) * weaveMult;

  // Update the tally for the chosen answer key.
  const tally = { ...(S.roundAnswerTally || { A: 0, B: 0, C: 0 }) };
  tally[key] = (tally[key] || 0) + 1;

  const isNotWrong = (kind === OUTCOME.TYPICAL || kind === OUTCOME.REVELATORY);

  // Check if a fate card should be queued.
  const totalAnswers = (tally.A || 0) + (tally.B || 0) + (tally.C || 0);
  let pendingFateCard = S.pendingFateCard || null;
  if (!pendingFateCard && totalAnswers % 3 === 0 && (S.fateCardDeck?.length || 0) > 0) {
    pendingFateCard = S.fateCardDeck.find(c => !S.completedFateCardIds?.has?.(c.id)) || null;
  }

  // Mark the question as answered.
  const qid = q.id;
  S.answeredQuestionIds?.add?.(qid);

  // Construct the patch to update the state.
  const patch = {
    // Update round score, thread, and weave status.
    roundScore: (S.roundScore || 0) + gainedPts,
    thread: (S.thread || 0) + (eff.threadDelta || 0),
    weavePrimed: false,

    // Update bookkeeping stats.
    roundAnswerTally: tally,
    notWrongCount: (S.notWrongCount || 0) + (isNotWrong ? 1 : 0),
    pendingFateCard,

    // Keep current question/answers for the REVEAL screen UI.
    currentQuestion: S.currentQuestion,
    currentAnswers: S.currentAnswers,

    // Populate lastOutcome with detailed results for the REVEAL screen.
    lastOutcome: {
      kind,
      chosenKey: key,
      chosenLabel: a.label || key,
      pointsGained: gainedPts,
      threadDelta: eff.threadDelta || 0,
      explanation: a.explanation || '', // Add the explanation
      questionText: q.text || q.title || '',
    },
  };

  return { patch };
}
