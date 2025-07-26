
// src/engine/questionEngine.js
import { TRAIT_LOADINGS }   from '../constants/traitConfig.js';
import { State } from '../state.js';
import { shuffle } from './utils.js';    
import { CLASS_SCORES, TRAIT_MAP, CLASS_TRAIT_BASE } from '../constants/answerLogic.js';


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
  /* replicate the big switch you had before:
       – update tally
       – score changes
       – thread changes
       – trait changes
       – difficulty escalation
  */
  /* finally return { nextScreen, statePatch } so router can handle UI */
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

