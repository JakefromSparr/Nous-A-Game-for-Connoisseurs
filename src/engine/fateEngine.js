// src/engine/fateEngine.js
import { State } from '../state.js';

/* Scratch buffers (cleared at Fate Resolution) */
let immediateScore = 0;     // global points added at Fate Resolution
let roundEffects   = [];    // effects that apply to pending bank/tally at resolution

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
export function armFate(card /*, state */) {
  const opts = Array.isArray(card?.choices) ? card.choices : (card?.options || []);
  return {
    activeFateCard: card ?? null,
    fateChoices: normalizeFateChoices(opts),
    pendingFateCard: null,
  };
}

/* Apply a chosen fate option (pure: return a patch) */
export function applyChoice(choice, state) {
  if (!choice?.effect) {
    // null/ignored choice just clears the card
    return { activeFateCard: null, fateChoices: [null, null, null] };
  }

  // Apply the effect (may mutate runtime state or buffers)
  applyEffect(choice.effect, state.activeFateCard?.title || '');

  // Mark the card as completed (Set mutation is fine)
  state.completedFateCardIds?.add?.(state.activeFateCard?.id);

  // Mirror to Lobby “Active Divinations” (dedupe by card title)
  const title = state.activeFateCard?.title || '';
  const nextEffects = Array.isArray(state.activeRoundEffects) ? [...state.activeRoundEffects] : [];
  if (title && !nextEffects.some(e => e.cardTitle === title)) {
    nextEffects.push({ type: choice.effect.type, cardTitle: title });
  }

  // Return a patch; router applies it
  return {
    activeRoundEffects: nextEffects,
    activeFateCard: null,
    fateChoices: [null, null, null],
  };
}

/* Resolve all armed fate effects at end of round (FATE_RESULT → Accept) */
export function resolveRound(tally /* {A,B,C} */, won /* boolean */) {
  let scoreDelta       = immediateScore; // global score bonus
  let roundScoreDelta  = 0;              // add to pending bank
  let roundMultiplier  = 1;              // multiply pending bank

  roundEffects.forEach(e => {
    switch (e.type) {
      case 'APPLY_WAGER': {
        // e.target may be "answer-c" or "C"
        const letter = String(e.target || '').split('-').pop().toUpperCase();
        const count  = (tally?.[letter] || 0);
        if (e.reward?.type === 'SCORE') {
          roundScoreDelta += (Number(e.reward.value) || 0) * count;
        }
        break;
      }

      case 'TALLY_TABLE': {
        const letter = String(e.target || '').toUpperCase();
        const cnt    = (tally?.[letter] || 0);
        const rw     = e.table?.[cnt];
        if (!rw) break;
        if (rw.type === 'DOUBLE_ROUND_SCORE') roundMultiplier *= 2;
        else if (rw.type === 'SCORE')         scoreDelta      += (Number(rw.value) || 0);
        break;
      }

      case 'ROUND_PREDICTION': {
        const pred = String(e.predict || e.prediction || '').toUpperCase();
        const a = tally?.A || 0, b = tally?.B || 0, c = tally?.C || 0;
        const max = Math.max(a, b, c);
        const winners = [];
        if (a === max) winners.push('A');
        if (b === max) winners.push('B');
        if (c === max) winners.push('C');
        // Friendly rule: ties count as "correct" if pred is among winners.
        if (winners.includes(pred)) roundMultiplier *= 2;
        break;
      }

      case 'ROUND_MODIFIER': {
        // If you "survive" (win the round), gain +3 global points (or custom reward)
        const bonus = (e.reward?.type === 'SCORE') ? (Number(e.reward.value) || 0) : 3;
        if (won) scoreDelta += bonus;
        break;
      }

      default:
        // ignore unknown safely
        break;
    }
  });

  // reset for next round
  immediateScore = 0;
  roundEffects   = [];

  return { scoreDelta, roundScoreDelta, roundScoreMultiplier: roundMultiplier };
}

/* Internal: apply effect immediately OR stage for round end or round start */
function applyEffect(effect, cardTitle = '') {
  const S = State.getState();

  // Allow a single choice to carry multiple effects
  if (Array.isArray(effect)) {
    effect.forEach(e => applyEffect(e, cardTitle));
    return;
  }

  const e = effect || {};

  switch (e.type) {
    case 'IMMEDIATE_SCORE':
      immediateScore += Number(e.value || 0);
      break;

    case 'SCORE':
      // straight into this round’s score
      S.roundScore = (S.roundScore || 0) + Number(e.value || 0);
      break;

    case 'POWER_UP':
      S.activePowerUps = Array.isArray(S.activePowerUps) ? S.activePowerUps : [];
      S.activePowerUps.push(e.power);
      break;

    case 'APPLY_WAGER':
      roundEffects.push({
        type: 'APPLY_WAGER',
        target: String(e.target || '').toUpperCase(),
        reward: e.reward,
        cardTitle,
      });
      break;

    case 'TALLY_TABLE':
      roundEffects.push({
        type: 'TALLY_TABLE',
        target: String(e.target || '').toUpperCase(),
        table : e.table || {},
        cardTitle,
      });
      break;

    case 'ROUND_PREDICTION':
      roundEffects.push({
        type: 'ROUND_PREDICTION',
        predict: String(e.prediction || e.predict || '').toUpperCase(),
        cardTitle,
      });
      break;

    case 'ROUND_MODIFIER':
      roundEffects.push({
        type: 'ROUND_MODIFIER',
        modifier: String(e.modifier || '').toUpperCase(),
        reward: e.reward, // optional { type:'SCORE', value:n }
        cardTitle,
      });
      break;

    case 'ROUND_START':
      // Persist until the next round begins (Round.startRound should apply these)
      S.activeRoundEffects = Array.isArray(S.activeRoundEffects) ? S.activeRoundEffects : [];
      S.activeRoundEffects.push({
        type: 'ROUND_START',
        threadDelta: Number(e.threadDelta || 0),
        cardTitle,
      });
      break;

    default:
      // default: record as a round-end effect we don't explicitly model yet
      roundEffects.push({ ...e, cardTitle });
  }
}
