// src/engine/lastEngine.js
import { State }      from '../state.js';
import * as Fate from './fateEngine.js';      
import { SCREENS }    from '../constants/screens.js';

/* ─────────── round helpers ─────────── */

export function startNewRound () {
  const S = State.getState();

  State.patch({
    roundNumber   : S.roundNumber + 1,
    roundScore    : 0,
    thread        : (S.roundsToWin - S.roundsWon) + 1,
    notWrongCount : 0,
    activeRoundEffects : [],
    roundAnswerTally   : { A:0, B:0, C:0 },
    activePowerUps     : [],
    answeredThisRound  : [],
    currentFateCard    : null,
    currentAnswers     : [],
    currentCategory    : 'Mind, Past'
  });

  /* promote any pending card */
  if (S.pendingFateCard) {
    State.patch({ activeFateCard: S.pendingFateCard, pendingFateCard:null });

    // Scholar’s Boon quick effect
    if (S.activeFateCard.id === 'DYN005') {
      S.thread += 1;
    }
  }

  return { nextScreen: SCREENS.ROUND_LOBBY };
}

/* spend a Thread to swap category hint */
export function spendThreadToWeave () {
  const S = State.getState();
  if (S.thread <= 0) return false;
  S.thread--;
  shuffleNextCategory();
  return true;
}

export function pullThread () {
  const S = State.getState();
  if (S.thread > 0) S.thread--;
}

export function cutThread () {
  endRound('escape');
  return true;
}

export function shuffleNextCategory () {
  const cats = ['Mind, Present','Body, Future','Soul, Past'];
  State.patch({ currentCategory: cats[Math.random()*cats.length|0] });
}

/* ─────────── END-OF-ROUND LOGIC ─────────── */
export function endRound (result='lose') {
  const S   = State.getState();

  /* resolve fate effects first */
  const tally      = S.roundAnswerTally;
  const fateResult = Fate.resolveRound(tally, result==='win');

  /* apply fate deltas */
  if (fateResult) {
    S.score      += fateResult.scoreDelta       ?? 0;
    S.roundScore += fateResult.roundScoreDelta  ?? 0;
    S.roundScore *= fateResult.roundScoreMultiplier ?? 1;
  }

  /* outcome bookkeeping */
  if (result==='win'){
    S.roundsWon++;
    S.score     += S.roundScore;
  } else if (result==='lose'){
    S.lives--;
  } else if (result==='escape'){
    S.score     += S.roundScore;
  }

  /* clear per-round scratch */
  S.roundScore        = 0;
  S.activeRoundEffects= [];
  S.roundAnswerTally  = { A:0, B:0, C:0 };
  S.answeredThisRound = [];
  S.activePowerUps    = [];
  S.activeFateCard    = null;

  /* decide next screen */
  if (S.lives <= 0)       return { nextScreen: SCREENS.GAME_OVER };
  if (S.roundsWon >= S.roundsToWin) return { nextScreen: SCREENS.FINAL_READING };
  return { nextScreen: SCREENS.GAME_LOBBY };
}

/* ─────────── difficulty ramp (optional) ─────────── */
export function advanceDifficulty () {
  const S = State.getState();
  if (S.difficultyLevel < 3) {
    S.difficultyLevel++;
    S.correctAnswersThisDifficulty = 0;
    console.log(`[DIFFICULTY] now ${S.difficultyLevel}`);
  }
}

