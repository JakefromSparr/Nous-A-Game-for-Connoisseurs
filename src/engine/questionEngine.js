// src/engine/questionEngine.js
import { State } from '../state.js';
import { shuffle, clamp } from './utils.js';
import { OUTCOME, OUTCOME_EFFECT, WEAVE } from '../constants/answerLogic.js';
import { TRAIT_LOADINGS } from '../constants/traitConfig.js';
import { CLASS_TRAIT_BASE } from '../constants/answerLogic.js';

// Toggleable fallback: allow repeats if the tier pool is exhausted.
const ALLOW_REPEATS_WHEN_EXHAUSTED = false;

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
  const shuffled = shuffle(q.answers || []);
  const keys = ['A', 'B', 'C'];
  return shuffled.slice(0, 3).map((a, i) => ({
    key: keys[i],
    label: a.label ?? '',
    answerClass: String(a.answerClass || '').toUpperCase(), // TYPICAL/REVELATORY/WRONG
    explanation: a.explanation ?? '',
  }));
}

/* ---------- Trait application per answer ---------- */
const toTitle = (clsUpper) =>
  clsUpper ? clsUpper[0] + clsUpper.slice(1).toLowerCase() : '';

function applyTraitDelta(questionId, kindUpper) {
  const S = State.getState();
  const titleKey = toTitle(kindUpper); // 'TYPICAL' -> 'Typical'

  const cfg  = TRAIT_LOADINGS[questionId] || {};
  const wt   = cfg.axisWeight || {};                   // e.g., { Z: 1.5 }
  const ov   = (cfg.overrides && cfg.overrides[titleKey]) || null;
  const base = CLASS_TRAIT_BASE[titleKey] || { X: 0, Y: 0, Z: 0 };

  ['X', 'Y', 'Z'].forEach(axis => {
    const overrideVal = ov && (ov[axis] ?? null);
    const weight      = (wt[axis] != null) ? wt[axis] : 1;
    const delta       = (overrideVal != null) ? overrideVal : (base[axis] || 0) * weight;

    S.traits[axis] = clamp((S.traits[axis] || 0) + delta, -9, 9);
  });
}

/* ---------- Draw next question (tier gating by difficultyLevel) ---------- */
export function drawQuestion(_state) {
  const S = State.getState();
  const deck = S.questionDeck || [];
  const answered = S.answeredQuestionIds || new Set();

  // **Key change**: use current unlocked difficulty to gate tiers.
  const activeTier = Math.max(1, Math.min(S.difficultyLevel || 1, 7));

  // Valid, unanswered, <= activeTier, and has 3+ answers
  const pool = deck.filter(q =>
    !answered.has(q.id) &&
    (!q.tier || q.tier <= activeTier) &&
    Array.isArray(q.answers) && q.answers.length >= 3
  );

  let q = pool.length ? pool[(Math.random() * pool.length) | 0] : null;

  // Optional: allow repeats when exhausted (for demo resilience)
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
  const tally = { ...(S.roundAnswerTally || { A: 0, B: 0, C: 0 }) };
  tally[key] = (tally[key] || 0) + 1;

  const isNotWrong = (kind === OUTCOME.TYPICAL || kind === OUTCOME.REVELATORY);

  // No auto Fate queuing — Tempt Fate is explicit in Game Lobby.

  // Exhaust this question id
  S.answeredQuestionIds?.add?.(q.id);

  // Apply trait deltas
  applyTraitDelta(q.id, kind);

  const patch = {
    // scores/thread
    roundScore: (S.roundScore || 0) + gainedPts,
    thread: (S.thread || 0) + (eff.threadDelta || 0),
    weavePrimed: false,

    // tallies + bookkeeping
    roundAnswerTally: tally,
    notWrongCount: (S.notWrongCount || 0) + (isNotWrong ? 1 : 0),

    // keep current question/answers for REVEAL UI
    currentQuestion: S.currentQuestion,
    currentAnswers : S.currentAnswers,

    // payload for REVEAL
    lastOutcome: {
      kind,                                  // 'TYPICAL' | 'REVELATORY' | 'WRONG'
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
