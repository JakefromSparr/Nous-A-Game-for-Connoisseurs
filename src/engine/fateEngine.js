/* Fate is deliberately state-driven: every armed effect must survive a reload. */

function normalizeFateChoices(options = []) {
  const out = [null, null, null];
  options.slice(0, 3).forEach((option, index) => {
    const o = option || {};
    out[index] = { id: o.id ?? String(index), label: o.label ?? 'Option', effect: o.effect ?? null };
  });
  return out;
}

export function armFate(card) {
  const options = Array.isArray(card?.choices) ? card.choices : (card?.options || []);
  return { activeFateCard: card ?? null, fateChoices: normalizeFateChoices(options), pendingFateCard: null };
}

function flatten(effect) {
  return (Array.isArray(effect) ? effect : [effect]).filter(Boolean);
}

export function applyChoice(choice, state) {
  const title = state.activeFateCard?.title || '';
  const activeRoundEffects = [...(state.activeRoundEffects || [])];
  const activePowerUps = [...(state.activePowerUps || [])];
  let roundScore = state.roundScore || 0;

  for (const effect of flatten(choice?.effect)) {
    if (effect.type === 'SCORE' || effect.type === 'IMMEDIATE_SCORE') {
      roundScore += Number(effect.value || 0);
    } else if (effect.type === 'POWER_UP' && effect.power) {
      activePowerUps.push(effect.power);
    } else {
      activeRoundEffects.push({ ...effect, cardTitle: title });
    }
  }

  const completedFateCardIds = new Set(state.completedFateCardIds || []);
  if (state.activeFateCard?.id != null) completedFateCardIds.add(state.activeFateCard.id);
  return {
    roundScore: Math.max(0, roundScore),
    activeRoundEffects,
    activePowerUps,
    completedFateCardIds,
    activeFateCard: null,
    fateChoices: [null, null, null],
  };
}

export function resolveRound(tally = {}, won = false, state = {}) {
  let scoreDelta = 0;
  let roundScoreDelta = 0;
  let roundScoreMultiplier = 1;

  for (const effect of state.activeRoundEffects || []) {
    if (effect.type === 'APPLY_WAGER') {
      const letter = String(effect.target || '').split('-').pop().toUpperCase();
      if (effect.reward?.type === 'SCORE') roundScoreDelta += Number(effect.reward.value || 0) * (tally[letter] || 0);
    } else if (effect.type === 'TALLY_TABLE') {
      const reward = effect.table?.[tally[String(effect.target || '').toUpperCase()] || 0];
      if (reward?.type === 'DOUBLE_ROUND_SCORE') roundScoreMultiplier *= 2;
      if (reward?.type === 'SCORE') scoreDelta += Number(reward.value || 0);
    } else if (effect.type === 'ROUND_PREDICTION') {
      const values = ['A', 'B', 'C'].map(key => [key, tally[key] || 0]);
      const max = Math.max(...values.map(([, count]) => count));
      const prediction = String(effect.prediction || effect.predict || '').toUpperCase();
      if (values.some(([key, count]) => key === prediction && count === max)) roundScoreMultiplier *= 2;
    } else if (effect.type === 'ROUND_MODIFIER' && won) {
      scoreDelta += effect.reward?.type === 'SCORE' ? Number(effect.reward.value || 0) : 3;
    }
  }

  const adjusted = ((state.pendingBank || state.roundScore || 0) + roundScoreDelta) * roundScoreMultiplier;
  return {
    scoreDelta, roundScoreDelta, roundScoreMultiplier,
    summaryText: `Round total: ${adjusted + scoreDelta}. Fate has finished counting.`,
  };
}
