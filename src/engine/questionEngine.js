
// src/engine/questionEngine.js
import { TRAIT_LOADINGS }   from '../constants/traitConfig.js';
import { SCREENS } from '../constants/screens.js';
import { State } from '../state.js';
import { shuffle, clamp } from './utils.js';
import { CLASS_SCORES, CLASS_TRAIT_BASE } from '../constants/answerLogic.js';


export function draw(){
  const S = State.getState();
  if (!S.questionDeck.length) return null;
  const q = S.questionDeck.shift();     // simple queue, or however you want
  const answers = shuffle([...q.answers]);
  State.patch({
    currentQuestion : q,
    currentAnswers  : answers
  });
  return { ...q, answers };
}

export function evaluate(letter){
  const S = State.getState();
  const q = S.currentQuestion;
  const idx = String(letter).toUpperCase().charCodeAt(0) - 65; // A->0
  const ans = S.currentAnswers[idx];

  if (!q || !ans) {
    console.error('[EVALUATE] Missing question or answer', letter);
    return {};
  }

  const cls = ans.answerClass;
  if (!cls) {
    console.error('[EVALUATE] Missing classification for answer', letter);
    return {};
  }

  // tally + history
  S.roundAnswerTally[letter] = (S.roundAnswerTally[letter] || 0) + 1;
  recordAnswer(q.questionId, letter);

  // score + thread
  const { points = 0, thread = 0 } = CLASS_SCORES[cls] || {};
  S.score      += points;
  S.roundScore += points;
  S.thread      = Math.max(0, S.thread + thread);

  // track streak of non-wrong answers
  S.notWrongCount = cls === 'Wrong' ? 0 : S.notWrongCount + 1;

  // trait deltas
  applyTraitDelta(cls, q.questionId);

  const patch = {
    score         : S.score,
    roundScore    : S.roundScore,
    thread        : S.thread,
    traits        : { ...S.traits },
    lastClassification : cls,
    lastAnswerCorrect  : cls !== 'Wrong',
    currentQuestion : null,
    currentAnswers  : []
  };

  return {
    nextScreen: SCREENS.REVEAL,
    statePatch: patch
  };
}

export function applyTraitDelta(cls, qId){
  const S   = State.getState();
  const cfg = TRAIT_LOADINGS[qId] || {};
  const wt  = cfg.axisWeight || {};
  const ov  = cfg.overrides?.[cls] || {};
  const base= CLASS_TRAIT_BASE[cls];

  ['X','Y','Z'].forEach(axis=>{
    const delta = axis in ov ? ov[axis] : base[axis] * (wt[axis] ?? 1);
    S.traits[axis] = clamp(S.traits[axis] + delta, -9, 9);
  });
}

/* Utility */
export function recordAnswer(qid,letter){
  State.getState().answeredThisRound.push({qid,letter});
}

