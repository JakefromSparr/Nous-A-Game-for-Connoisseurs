// src/engine/questionEngine.js
import { State } from '../state.js';
import { shuffle } from './utils.js';
import { OUTCOME, OUTCOME_EFFECT, WEAVE } from '../constants/answerLogic.js';

// Toggleable demo fallback: allow repeats if the tier pool is exhausted.
// Keep FALSE to enforce "exhaust before repeat" per spec.
const ALLOW_REPEATS_WHEN_EXHAUSTED = false;

/* ---------- Outcome fallback (legacy decks only) ---------- */
function getKind(q, key) {
  // Legacy explicit map (rare in your deck)
  if (q.answerKinds && q.answerKinds[key]) return q.answerKinds[key];

  // Legacy fallback: q.correct marks TYPICAL; one other REVELATORY; last WRONG
  if (q.correct) {
    if (key === q.correct) return OUTCOME.TYPICAL;
    const others = ['A', 'B', 'C'].filter(k => k !== q.correct);
    return key === others[0] ? OUTCOME.REVELATORY : OUTCOME.WRONG;
  }

  // Defensive default
  return key === 'C' ? OUTCOME.WRONG : OUTCOME.TYPICAL;
}

/* ---------- Build shuffled A/B/C answers for UI ---------- */
function buildAnswers(q) {
  const shuffled = shuffle(q.answers || []);
  const keys = ['A', 'B', 'C'];
  return shuffled.slice(0, 3).map((a, i) => ({
    key: keys[i],
    label: a.label ?? '',
    answerClass: String(a.answerClass || '').toUpperCase(), // TYPICAL/REVELATORY/WRONG
    explanation: a.explanation ?? '',
  }));
}

/* ---------- Draw next question (tier + exhaustion) ---------- */
export function drawQuestion(_state) {
  const S = State.getState();
  const deck = S.questionDeck || [];
  const answered = S.answeredQuestionIds || new Set();
  const activeTier = Math.min(S.roundNumber || 1, 3);

  // Valid, unanswered, tier-legal, with 3 answers
  const pool = deck.filter(q =>
    !answered.has(q.id) &&
    (!q.tier || q.tier <= activeTier) &&
    Array.isArray(q.answers) && q.answers.length >= 3
  );

  let q = pool.length ? pool[(Math.random() * pool.length) | 0] : null;

  // Optional demo resilience: allow repeats if exhausted
  if (!q && ALLOW_REPEATS_WHEN_EXHAUSTED) {
    const repeatPool = deck.filter(q =>
      (!q.tier || q.tier <= activeTier) &&
      Array.isArray(q.answers) && q.answers.length >= 3
    );
    q = repeatPool.length ? repeatPool[(Math.random() * repeatPool.length) | 0] : null;
  }

  if (!q) return { question: null, answers: [], category: '' };

  return {
    question: q,
    answers: buildAnswers(q),
    category: q.category || q.title || '',
  };
}

/* ---------- Evaluate chosen answer (baseline already paid on Pull) ---------- */
export function evaluate(choiceIndex, _state) {
  const S = State.getState();
  const q = S.currentQuestion;
  const a = S.currentAnswers?.[choiceIndex];
  if (!q || !a) return { patch: {} };

  const key  = (a.key || '').toUpperCase();
  const cls  = String(a.answerClass || '').toUpperCase();
  const kind = (cls === 'TYPICAL' || cls === 'REVELATORY' || cls === 'WRONG') ? cls : getKind(q, key);
  const eff  = OUTCOME_EFFECT[kind] || { points: 0, threadDelta: 0 };

  // Round points (weave doubles); thread delta is post-baseline
  const weaveMult = S.weavePrimed ? WEAVE.multiplier : 1;
  const gainedPts = (eff.points || 0) * weaveMult;

  // Tally by key
  const tally = { ...(S.roundAnswerTally || { A:0, B:0, C:0 }) };
  tally[key] = (tally[key] || 0) + 1;

  const isNotWrong = (kind === OUTCOME.TYPICAL || kind === OUTCOME.REVELATORY);

  // Queue a fate every 3rd answer (if available)
  const totalAnswers = (tally.A || 0) + (tally.B || 0) + (tally.C || 0);
  let pendingFateCard = S.pendingFateCard || null;
  if (!pendingFateCard && totalAnswers % 3 === 0 && (S.fateCardDeck?.length || 0) > 0) {
    pendingFateCard = S.fateCardDeck.find(c => !S.completedFateCardIds?.has?.(c.id)) || null;
  }

  // Exhaust this question id
  S.answeredQuestionIds?.add?.(q.id);

  const patch = {
    roundScore: (S.roundScore || 0) + gainedPts,
    thread: (S.thread || 0) + (eff.threadDelta || 0),
    weavePrimed: false,

    roundAnswerTally: tally,
    notWrongCount: (S.notWrongCount || 0) + (isNotWrong ? 1 : 0),
    pendingFateCard,

    // Keep for REVEAL UI
    currentQuestion: S.currentQuestion,
    currentAnswers : S.currentAnswers,
    lastOutcome: {
      kind,
      chosenKey: key,
      chosenLabel: a.label || key,
      pointsGained: gainedPts,
      threadDelta: eff.threadDelta || 0,
      explanation: a.explanation || '',
      questionText: q.text || q.title || '',
    },
  };

  return { patch };
}
