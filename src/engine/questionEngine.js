// src/engine/questionEngine.js
import { State } from '../state.js';
import { shuffle } from './utils.js';
import { OUTCOME, OUTCOME_EFFECT, WEAVE } from '../constants/answerLogic.js';

// Determine outcome kind for a given question + key ('A' | 'B' | 'C')
function getKind(q, key) {
  // Preferred: explicit map
  if (q.answerKinds && q.answerKinds[key]) return q.answerKinds[key];

  // answers[] form
  if (Array.isArray(q.answers)) {
    const a = q.answers.find(a => (a.key || '').toUpperCase() === key);
    const cls = (a?.answerClass || '').toUpperCase();
    if (cls === 'TYPICAL' || cls === 'REVELATORY' || cls === 'WRONG') return cls;
  }

  // Fallback: q.correct marks TYPICAL; pick one other as REVELATORY, last as WRONG
  if (q.correct) {
    if (key === q.correct) return OUTCOME.TYPICAL;
    const others = ['A','B','C'].filter(k => k !== q.correct);
    return key === others[0] ? OUTCOME.REVELATORY : OUTCOME.WRONG;
  }

  // Worst-case: assume C is WRONG, A/B TYPICAL
  return key === 'C' ? OUTCOME.WRONG : OUTCOME.TYPICAL;
}

// Build on-screen answers array [{key,label}] from either deck form
function buildAnswers(q) {
  if (Array.isArray(q.answers) && q.answers.length >= 3) {
    const mapped = q.answers.map(a => ({ key: (a.key || '').toUpperCase(), label: a.label || String(a.key) }));
    return shuffle(mapped);
  }
  const arr = [
    { key: 'A', label: q.choices?.A ?? 'A' },
    { key: 'B', label: q.choices?.B ?? 'B' },
    { key: 'C', label: q.choices?.C ?? 'C' },
  ];
  return shuffle(arr);
}

// Draw next question, respecting tier (<= active) and exhaustion
export function drawQuestion(state) {
  const S = State.getState(); // use fresh state (Sets mutate)
  const deck = S.questionDeck || [];
  const answered = S.answeredQuestionIds || new Set();
  const activeTier = Math.min(S.roundNumber || 1, 3);

  const pool = deck.filter(q =>
    !answered.has(q.id ?? q.questionId) &&
    (typeof q.tier !== 'number' || q.tier <= activeTier)
  );

  const q = pool.length ? pool[(Math.random() * pool.length) | 0] : null;
  if (!q) return { question: null, answers: [], category: '' };

  return {
    question: q,
    answers: buildAnswers(q),
    category: q.category || q.title || '',
  };
}

// Evaluate a chosen answer (choiceIndex 0..2). Baseline pull already applied.
export function evaluate(choiceIndex, state) {
  const S = State.getState();
  const q = S.currentQuestion;
  const a = S.currentAnswers?.[choiceIndex];

  if (!q || !a) return { patch: {} };

  const key  = (a.key || '').toUpperCase();
  const kind = getKind(q, key);
  const eff  = OUTCOME_EFFECT[kind] || { points: 0, threadDelta: 0 };

  // Round points (weave doubles), thread delta (post-baseline), tallies
  const weaveMult = S.weavePrimed ? WEAVE.multiplier : 1;
  const gainedPts = (eff.points || 0) * weaveMult;

  // Update tally counts by key (A/B/C)
  const tally = { ...(S.roundAnswerTally || { A:0, B:0, C:0 }) };
  tally[key] = (tally[key] || 0) + 1;

  const isNotWrong = (kind === OUTCOME.TYPICAL || kind === OUTCOME.REVELATORY);

  // Optional deterministic fate queueing (every 3rd answer)
  const totalAnswers = (tally.A || 0) + (tally.B || 0) + (tally.C || 0);
  let pendingFateCard = S.pendingFateCard || null;
  if (!pendingFateCard && totalAnswers % 3 === 0 && (S.fateCardDeck?.length || 0) > 0) {
    pendingFateCard = S.fateCardDeck.find(c => !S.completedFateCardIds?.has?.(c.id)) || null;
  }

  // Mark as answered to exhaust later draws
  const qid = q.id ?? q.questionId;
  S.answeredQuestionIds?.add?.(qid);

  const patch = {
    // round outputs
    roundScore: (S.roundScore || 0) + gainedPts,
    thread: (S.thread || 0) + (eff.threadDelta || 0),
    weavePrimed: false,

    // bookkeeping
    roundAnswerTally: tally,
    notWrongCount: (S.notWrongCount || 0) + (isNotWrong ? 1 : 0),
    pendingFateCard,

    // clear current question (REVEAL screen renders from last fields if desired)
    currentQuestion: S.currentQuestion,   // keep for REVEAL text if needed
    currentAnswers : S.currentAnswers,
    lastOutcome: {                         // optional payload for REVEAL UI
      kind,
      chosenKey: key,
      chosenLabel: a.label || key,
      pointsGained: gainedPts,
      threadDelta: eff.threadDelta || 0,
      questionText: q.text || q.prompt || '',
    },
  };

  return { patch };
}
