// src/engine/questionEngine.js
import { State } from '../state.js';
import { shuffle } from './utils.js';
import { OUTCOME, OUTCOME_EFFECT, WEAVE } from '../constants/answerLogic.js';
import { applyTraitDelta } from './traitEngine.js';

/* ---------- Outcome fallback (legacy decks only) ---------- */
function getKind(q, key) {
  if (q.answerKinds && q.answerKinds[key]) return q.answerKinds[key];

  if (q.correct) {
    if (key === q.correct) return OUTCOME.TYPICAL;
    const others = ['A', 'B', 'C'].filter(k => k !== q.correct);
    return key === others[0] ? OUTCOME.REVELATORY : OUTCOME.WRONG;
  }
  return key === 'C' ? OUTCOME.WRONG : OUTCOME.TYPICAL;
}

/* ---------- Build shuffled A/B/C answers for UI ---------- */
function buildAnswers(q) {
  const S = State.getState();
  const previous = S.questionHistory?.[String(q.id)];
  const selectedLabels = new Set(
    Array.isArray(previous) ? previous : (previous ? [previous] : [])
  );
  const shuffled = shuffle([...(q.answers || [])]);
  const keys = ['A', 'B', 'C'];
  let answers = shuffled.slice(0, 3).map((a, i) => {
    const label = a.label ?? '';
    return {
      key: keys[i],
      label: label || 'The words have faded.',
      answerClass: String(a.answerClass || '').toUpperCase(),
      explanation: a.explanation || 'Nous offers no explanation.',
      unavailable: selectedLabels.has(label),
    };
  });

  if (S.activePowerUps?.includes('REMOVE_WRONG_ANSWER')) {
    const wrong = answers.findIndex((answer) =>
      answer.answerClass === OUTCOME.WRONG && !answer.unavailable
    );
    if (wrong >= 0) answers.splice(wrong, 1);
    S.activePowerUps = S.activePowerUps.filter(p => p !== 'REMOVE_WRONG_ANSWER');
  }
  return answers;
}

/* ---------- Draw from this round's finite packet, then recycle it ---------- */
export function drawQuestion(_state) {
  const S = State.getState();
  const deck = S.questionDeck || [];
  const byId = new Map(deck.map((question) => [String(question.id), question]));
  const roundIds = Array.isArray(S.roundQuestionIds) ? S.roundQuestionIds : [];
  let drawPile = Array.isArray(S.roundDrawPile) ? [...S.roundDrawPile] : [];
  let isRepeat = !!S.roundIsRecycling;

  if (!drawPile.length && roundIds.length) {
    drawPile = shuffle([...roundIds]);
    isRepeat = true;
  }

  let q = null;
  let answers = [];
  while (drawPile.length && !q) {
    const nextId = drawPile.shift();
    const candidate = byId.get(String(nextId));
    if (!candidate) continue;
    const candidateAnswers = buildAnswers(candidate);
    if (!candidateAnswers.some((answer) => !answer.unavailable)) continue;
    q = candidate;
    answers = candidateAnswers;
  }

  if (!q) {
    return {
      question: null,
      answers: [],
      category: '',
      patch: { roundDrawPile: drawPile, roundIsRecycling: isRepeat },
    };
  }

  const tierSeen = { ...(S.tierSeen || {}) };
  tierSeen[q.tier || 0] = (tierSeen[q.tier || 0] || 0) + 1;

  return {
    question: q,
    answers,
    category: q.category || q.title || '',
    patch: {
      roundDrawPile: drawPile,
      roundIsRecycling: isRepeat,
      currentQuestionIsRepeat: isRepeat,
      tierSeen,
    },
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
  const tally = { ...(S.roundAnswerTally || { A: 0, B: 0, C: 0 }) };
  tally[key] = (tally[key] || 0) + 1;

  const isNotWrong = (kind === 'TYPICAL' || kind === 'REVELATORY');
  const isRepeat = !!S.currentQuestionIsRepeat;
  const collectsTraits = !isRepeat && !S.tutorial?.active;

  // Exhaust this question id
  S.answeredQuestionIds?.add?.(q.id);

  // Track refresh history (to punish exact repeats)
  let historyPatch = null;
  if (a.label) {
    const hist = { ...(S.questionHistory || {}) };
    const previous = hist[String(q.id)];
    const selected = Array.isArray(previous) ? [...previous] : (previous ? [previous] : []);
    if (!selected.includes(a.label)) selected.push(a.label);
    hist[String(q.id)] = selected;
    historyPatch = hist;
  }

  // A recycled card constrains the choice, so it no longer contributes traits.
  if (collectsTraits) applyTraitDelta(q.id, kind, a.label);

  const choiceEvidence = !collectsTraits
    ? (S.choiceEvidence || [])
    : [...(S.choiceEvidence || []), {
        questionId: q.id,
        questionText: q.text || q.title || 'A question without a name.',
        chosenLabel: a.label || 'the unspoken answer',
        kind,
      }].slice(-12);

  const weightIsActive = (S.activeRoundEffects || []).some(e => e.type === 'ROUND_MODIFIER' && e.modifier === 'WEIGHT');
  const fateThreadDelta = kind === OUTCOME.WRONG && weightIsActive ? -1 : 0;

  const patch = {
    // scores/thread
    roundScore: (S.roundScore || 0) + gainedPts,
    thread: (S.thread || 0) + (eff.threadDelta || 0) + fateThreadDelta,
    weavePrimed: false,

    // tallies + bookkeeping
    roundAnswerTally: tally,
    notWrongCount: (S.notWrongCount || 0) + (isNotWrong ? 1 : 0),
    choiceEvidence,

    // keep current question/answers for REVEAL UI
    currentQuestion: S.currentQuestion,
    currentAnswers : S.currentAnswers,

    // payload for REVEAL
    lastOutcome: {
      kind,                                  // 'TYPICAL' | 'REVELATORY' | 'WRONG'
      chosenKey: key,
      chosenLabel: a.label || key,
      pointsGained: gainedPts,
      threadDelta: (eff.threadDelta || 0) + fateThreadDelta,
      explanation: a.explanation || '',
      questionText: q.text || q.title || '',
      questionId: q.id,
      insert: q.insert || '',
      isRepeat,
    },
  };

  if (historyPatch) patch.questionHistory = historyPatch;

  // Difficulty stepper
  if (isNotWrong && collectsTraits) {
    const count = (S.correctAnswersThisDifficulty || 0) + 1;
    if (count >= 2) {
      patch.difficultyLevel = Math.min((S.difficultyLevel || 1) + 1, 7);
      patch.correctAnswersThisDifficulty = 0;
    } else {
      patch.correctAnswersThisDifficulty = count;
    }
  } else {
    patch.correctAnswersThisDifficulty = S.correctAnswersThisDifficulty || 0;
  }

  return { patch };
}

