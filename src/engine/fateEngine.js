// src/engine/fateEngine.js
import { State } from '../state.js';

/* ─────────── module-level scratch data ─────────── */
let immediateScore = 0;      // points awarded instantly
let roundEffects   = [];     // effects that resolve at end of round

/* =================================================
   1.  DRAW A CARD
================================================= */
export function draw () {
  const S = State.getState();
  if (S.pendingFateCard) return null;           // already have one queued

  const deck = S.fateCardDeck;
  if (!deck.length) return null;

  const card = deck[Math.random() * deck.length | 0];
  State.patch({ pendingFateCard: card });       // store for the lobby
  return card;
}

/* =================================================
   2.  PROMOTE THE CARD TO "CURRENT" ON SCREEN
================================================= */
export function setCurrent (card) {
  State.patch({ currentFateCard: card });
}

/* =================================================
   3.  BUTTON LABELS FOR THE CONTROLLER
================================================= */
export function getButtonLabels () {
  const card = State.getState().currentFateCard;
  if (!card) return ['','',''];

  const labels = card.choices.map(c => c.label || '');
  while (labels.length < 3) labels.push('');
  return labels.slice(0, 3);
}

/* =================================================
   4.  PLAYER CHOOSES AN OPTION
================================================= */
export function choose (idx) {
  const S     = State.getState();
  const card  = S.currentFateCard;
  if (!card) return null;

  const choice = card.choices[idx];
  if (!choice?.effect) {                        // null or “ignore”
    State.patch({ currentFateCard: null });
    return null;
  }

  applyEffect(choice.effect, card.title);
  S.completedFateCardIds.add(card.id);
  State.patch({ currentFateCard: null });
  return choice.effect.flavorText ?? null;
}

/* =================================================
   5.  ROUND RESOLUTION (called from lastEngine)
================================================= */
export function resolveRound (tally /* {A,B,C} */, _won) {
  let scoreDelta       = immediateScore;
  let roundScoreDelta  = 0;
  let roundMultiplier  = 1;

  roundEffects.forEach(e => {
    if (e.type === 'APPLY_WAGER') {
      const letter = e.target.split('-').pop().toUpperCase();
      const count  = tally[letter] || 0;
      if (e.reward?.type === 'SCORE') roundScoreDelta += e.reward.value * count;

    } else if (e.type === 'TALLY_TABLE') {
      const cnt = tally[e.target] || 0;
      const rw  = e.table?.[cnt];
      if (!rw) return;

      if (rw.type === 'DOUBLE_ROUND_SCORE')       roundMultiplier *= 2;
      else if (rw.type === 'SCORE')               scoreDelta      += rw.value;
    }
  });

  /* reset scratch buffers for next round */
  immediateScore = 0;
  roundEffects   = [];

  return {
    scoreDelta,
    roundScoreDelta,
    roundScoreMultiplier: roundMultiplier
  };
}

/* =================================================
   6.  INTERNAL EFFECT HANDLER
================================================= */
function applyEffect (e = {}, cardTitle = '') {
  const S = State.getState();

  switch (e.type) {
    case 'IMMEDIATE_SCORE':
      immediateScore += e.value;
      break;

    case 'SCORE':
      S.roundScore += e.value;                  // straight into this round
      break;

    case 'POWER_UP':
      S.activePowerUps.push(e.power);
      break;

    /* effects that wait until resolveRound() */
    default:
      roundEffects.push({ ...e, cardTitle, count: 0 });
  }
}
