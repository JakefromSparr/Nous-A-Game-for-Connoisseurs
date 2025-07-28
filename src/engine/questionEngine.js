// src/engine/fateEngine.js
import { State } from '../state.js';

/* Scratch buffers for the current round’s fate effects */
let immediateScore = 0;           // global points awarded at Fate Resolution
let roundEffects   = [];          // effects that apply to the round’s bank/tally

/* Normalize 0..3 options → array of length 3 with null placeholders */
function normalizeFateChoices(options = []) {
  const out = [null, null, null];
  for (let i = 0; i < Math.min(3, options.length); i++) {
    const o = options[i] || {};
    out[i] = {
      id: o.id ?? `${i}`,
      label: o.label ?? 'Option',
      effect: o.effect ?? null,
    };
  }
  return out;
}

/* Arm a pending card: set activeFateCard + fateChoices; clear pending */
export function armFate(card, state) {
  const opts = Array.isArray(card?.choices) ? card.choices : (card?.options || []);
  return {
    activeFateCard: card ?? null,
    fateChoices: normalizeFateChoices(opts),
    pendingFateCard: null,
  };
}

/* Apply a chosen fate option (pure patch), clear active card */
export function applyChoice(choice, state) {
  if (!choice?.effect) {
    // null/ignored choice just clears the card
    return { activeFateCard: null, fateChoices: [null, null, null] };
  }

  applyEffect(choice.effect, state.activeFateCard?.title || '');
  state.completedFateCardIds?.add?.(state.activeFateCard?.id); // be defensive

  return { activeFateCard: null, fateChoices: [null, null, null] };
}

/* Resolve all armed fate effects at end of round (FATE_RESULT → Accept) */
export function resolveRound(tally /* {A,B,C} */, _won) {
  let scoreDelta       = immediateScore; // global score bonus at resolution
  let roundScoreDelta  = 0;              // modifies pending bank additively
  let roundMultiplier  = 1;              // modifies pending bank multiplicatively

  roundEffects.forEach(e => {
    if (e.type === 'APPLY_WAGER') {
      const letter = String(e.target || '').split('-').pop().toUpperCase();
      const count  = (tally?.[letter] || 0);
      if (e.reward?.type === 'SCORE') roundScoreDelta += (e.reward.value || 0) * count;

    } else if (e.type === 'TALLY_TABLE') {
      const cnt = (tally?.[e.target] || 0);
      const rw  = e.table?.[cnt];
      if (!rw) return;

      if (rw.type === 'DOUBLE_ROUND_SCORE') roundMultiplier *= 2;
      else if (rw.type === 'SCORE')         scoreDelta      += (rw.value || 0);
    }
  });

  // reset for next round
  immediateScore = 0;
  roundEffects   = [];

  return { scoreDelta, roundScoreDelta, roundScoreMultiplier: roundMultiplier };
}

/* Internal: apply a single effect immediately (to scratch or state) */
function applyEffect(e = {}, cardTitle = '') {
  const S = State.getState();

  switch (e.type) {
    case 'IMMEDIATE_SCORE':
      immediateScore += Number(e.value || 0);
      break;

    case 'SCORE':
      // affects roundScore immediately (allowed by blueprint)
      S.roundScore = (S.roundScore || 0) + Number(e.value || 0);
      break;

    case 'POWER_UP':
      S.activePowerUps = Array.isArray(S.activePowerUps) ? S.activePowerUps : [];
      S.activePowerUps.push(e.power);
      break;

    // Delayed effects resolved at FATE_RESULT (use resolveRound)
    default:
      roundEffects.push({ ...e, cardTitle });
  }
}
