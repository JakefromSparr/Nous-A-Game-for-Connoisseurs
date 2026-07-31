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
      buttonLabel: a.buttonLabel ?? '',
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

function selectedLabelsFor(question, state) {
  const previous = state.questionHistory?.[String(question.id)];
  return new Set(Array.isArray(previous) ? previous : (previous ? [previous] : []));
}

function hasAvailableAnswer(question, state) {
  const selected = selectedLabelsFor(question, state);
  return (question.answers || []).some((answer) => !selected.has(answer.label));
}

function isAvailableAtCurrentProgress(question, state) {
  const tier = Number(question.tier);
  if (state.isIntroRound || state.tutorial?.active) {
    return tier === 0;
  }
  if (tier >= 1 && tier <= 3) {
    return true;
  }
  if (tier === 4 || tier === 5) {
    return (state.roundNumber || 1) >= 3;
  }
  return false;
}

function prepareDrawPile(state) {
  const deck = state.questionDeck || [];
  const byId = new Map(deck.map((question) => [String(question.id), question]));
  const roundIds = Array.isArray(state.roundQuestionIds) ? state.roundQuestionIds : [];
  let drawPile = Array.isArray(state.roundDrawPile) ? [...state.roundDrawPile] : [];
  let isRepeat = !!state.roundIsRecycling;

  drawPile = drawPile.filter((id) => {
    const question = byId.get(String(id));
    return (
      question &&
      isAvailableAtCurrentProgress(question, state) &&
      hasAvailableAnswer(question, state)
    );
  });

  if (!drawPile.length && roundIds.length) {
    drawPile = shuffle([...roundIds]).filter((id) => {
      const question = byId.get(String(id));
      return (
        question &&
        isAvailableAtCurrentProgress(question, state) &&
        hasAvailableAnswer(question, state)
      );
    });
    isRepeat = true;
  }

  return { byId, drawPile, isRepeat };
}

export function prepareCrossroads(_state) {
  const S = State.getState();
  const prepared = prepareDrawPile(S);
  const firstId = prepared.drawPile[0];
  const firstQuestion = prepared.byId.get(String(firstId));
  const differentCategoryId = prepared.drawPile.slice(1).find((id) => {
    const question = prepared.byId.get(String(id));
    return question?.category && question.category !== firstQuestion?.category;
  });
  const candidates = firstId === undefined
    ? []
    : [
        firstId,
        differentCategoryId ?? prepared.drawPile[1],
      ].filter((id) => id !== undefined);

  return {
    candidates,
    patch: {
      roundDrawPile: prepared.drawPile,
      roundIsRecycling: prepared.isRepeat,
      crossroadCandidates: candidates,
      crossroadSelection: 0,
    },
  };
}

/* ---------- Draw from this round's finite packet, then recycle it ---------- */
export function drawQuestion(_state, requestedId = null) {
  const S = State.getState();
  const prepared = prepareDrawPile(S);
  const { byId, isRepeat } = prepared;
  const drawPile = [...prepared.drawPile];

  let q = null;
  let answers = [];
  if (requestedId !== null) {
    const requestedIndex = drawPile.findIndex(
      (id) => String(id) === String(requestedId)
    );
    if (requestedIndex >= 0) {
      const [selectedId] = drawPile.splice(requestedIndex, 1);
      q = byId.get(String(selectedId)) || null;
      if (q) answers = buildAnswers(q);
    }
  }

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
      crossroadCandidates: [],
      crossroadSelection: 0,
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
        category: q.category || '',
        tier: Number(q.tier) || 0,
        roundNumber: Number(S.roundNumber) || 1,
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

