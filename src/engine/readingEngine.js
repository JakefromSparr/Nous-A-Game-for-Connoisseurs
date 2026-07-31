import {
  ANSWER_PATTERNS,
  AXIS_PROFILES,
  CLOSING_PREDICTIONS,
  CONFIDENCE_LINES,
  CONSENSUS_PATTERNS,
  FATE_PATTERNS,
  SECONDARY_PRESSURES,
} from '../constants/readingText.js';
import { computeTraitRead } from './traitEngine.js';

const AXES = ['X', 'Y', 'Z'];
const KINDS = ['TYPICAL', 'REVELATORY', 'WRONG'];

function stableHash(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  let hash = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pick(options, seed, fallback = '') {
  const values = Array.isArray(options) ? options.filter(Boolean) : [];
  if (!values.length) return fallback;
  return values[stableHash(seed) % values.length];
}

function interpolate(text, values = {}) {
  return String(text || '').replace(/\{([A-Za-z0-9_]+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

function axisKey(axis, value) {
  return `${axis}${Number(value) >= 0 ? '+' : '-'}`;
}

function rankedAxes(traits = {}) {
  return AXES
    .map((axis) => ({ axis, value: Number(traits[axis]) || 0 }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function confidenceBand(read, evidenceCount) {
  const confidence = Number(read?.confidence) || 0;
  if (confidence >= 0.28 && evidenceCount >= 7) return 'FIXED';
  if (confidence >= 0.12 && evidenceCount >= 4) return 'FORMING';
  return 'FAINT';
}

function answerPattern(tally = {}) {
  const counts = Object.fromEntries(KINDS.map((kind) => [kind, Number(tally[kind]) || 0]));
  const total = KINDS.reduce((sum, kind) => sum + counts[kind], 0);
  if (!total) return 'DIVIDED';

  const typicalRatio = counts.TYPICAL / total;
  const revelatoryRatio = counts.REVELATORY / total;
  const wrongRatio = counts.WRONG / total;

  if (wrongRatio >= 0.3) return 'PLAUSIBLE';
  if (revelatoryRatio >= 0.48) return 'LATERAL';
  if (typicalRatio >= 0.55) return 'FAMILIAR';
  return 'DIVIDED';
}

function consensusPattern(primary, tally = {}) {
  const typical = Number(tally.TYPICAL) || 0;
  const revelatory = Number(tally.REVELATORY) || 0;
  const wrong = Number(tally.WRONG) || 0;
  const total = typical + revelatory + wrong;

  if (total && wrong / total >= 0.3) return 'MOMENTUM';
  if (primary === 'X-' || primary === 'Z+' || typical > revelatory + 1) {
    return 'VERIFICATION';
  }
  if (primary === 'X+' || primary === 'Y+' || primary === 'Z-' || revelatory > typical) {
    return 'REFRAMING';
  }
  return 'NEGOTIATION';
}

function diagnosticScore(item = {}, index = 0) {
  const kindScore = {
    REVELATORY: 5,
    WRONG: 4,
    TYPICAL: 2,
  }[String(item.kind || '').toUpperCase()] || 1;
  const tierScore = Math.max(0, Number(item.tier) || 0) * 0.6;
  return kindScore + tierScore + index * 0.01;
}

function selectEvidence(evidence = []) {
  const candidates = evidence
    .filter((item) => item?.questionText && item?.chosenLabel)
    .map((item, index) => ({ ...item, _score: diagnosticScore(item, index) }))
    .sort((a, b) => b._score - a._score);

  if (!candidates.length) return [];

  const selected = [candidates[0]];
  const contrast = candidates.find((item) => (
    item !== candidates[0] &&
    (
      String(item.kind || '') !== String(candidates[0].kind || '') ||
      String(item.category || '') !== String(candidates[0].category || '')
    )
  ));
  const second = contrast || candidates[1];
  if (second) selected.push(second);
  return selected;
}

function evidenceSentence(item, index) {
  const rawQuestion = String(item.questionText || '').trim();
  const rawAnswer = String(item.chosenLabel || '').trim().replace(/[.!?]+$/, '');
  const question = `“${rawQuestion}${/[.!?]$/.test(rawQuestion) ? '' : '.'}”`;
  const answer = `“${rawAnswer}”`;
  const lead = index === 0 ? 'Consider' : 'Then consider';

  if (item.kind === 'REVELATORY') {
    return `${lead} ${question} You chose ${answer}, the answer that required the frame to move. The group did not merely find another truth; it gave itself permission to prefer one.`;
  }
  if (item.kind === 'WRONG') {
    return `${lead} ${question} You chose ${answer}. It was not correct, but it was plausible enough to become communal. That is more revealing than an ordinary mistake.`;
  }
  return `${lead} ${question} You chose ${answer}, the answer that survived first contact with common sense. Familiarity is not obedience here. It is where the negotiation begins.`;
}

function fateStyle(item = {}) {
  const effectTypes = Array.isArray(item.effectTypes) ? item.effectTypes : [];
  if (effectTypes.some((type) => type === 'IMMEDIATE_SCORE' || type === 'SCORE')) {
    return 'IMMEDIATE';
  }
  if (effectTypes.some((type) => (
    type === 'APPLY_WAGER' ||
    type === 'TALLY_TABLE' ||
    type === 'ROUND_PREDICTION'
  ))) {
    return 'LEVERAGE';
  }
  if (effectTypes.includes('ROUND_MODIFIER')) return 'BURDEN';
  if (effectTypes.some((type) => type === 'POWER_UP' || type === 'ROUND_START')) {
    return 'PROTECTION';
  }
  return 'REFUSAL';
}

function seedFromState(state, read) {
  return {
    traits: read?.traits || state.traits || {},
    tally: state.classTally || {},
    choices: (state.choiceEvidence || []).map((item) => [
      item.questionId,
      item.chosenLabel,
      item.kind,
    ]),
    fate: (state.fateEvidence || []).map((item) => [item.cardId, item.chosenLabel]),
  };
}

export function composeFinalReading(state = {}) {
  const read = state.traitRead || computeTraitRead(state);
  const traits = read?.traits || state.traits || {};
  const ranked = rankedAxes(traits);
  const evidence = (state.choiceEvidence || []).filter((item) => item?.chosenLabel);
  const selectedEvidence = selectEvidence(evidence);
  const primaryMagnitude = Math.abs(ranked[0]?.value || 0);
  const primary = primaryMagnitude >= 0.35
    ? axisKey(ranked[0].axis, ranked[0].value)
    : 'BALANCED';
  const secondary = ranked[1] && Math.abs(ranked[1].value) >= 0.25
    ? axisKey(ranked[1].axis, ranked[1].value)
    : null;
  const confidence = confidenceBand(read, evidence.length);
  const habit = answerPattern(state.classTally);
  const consensus = consensusPattern(primary, state.classTally);
  const latestFate = (state.fateEvidence || []).filter((item) => item?.chosenLabel).slice(-1)[0];
  const fate = latestFate ? fateStyle(latestFate) : null;
  const seed = seedFromState(state, read);
  const profile = primary === 'BALANCED' ? null : AXIS_PROFILES[primary];

  const opening = [
    pick(CONFIDENCE_LINES[confidence], { seed, section: 'confidence' }),
    profile
      ? pick(profile.portraits, { seed, section: 'portrait' })
      : 'You resisted becoming simple enough to name. Each clear tendency produced a counterexample before it could harden into a rule.',
  ].filter(Boolean).join(' ');

  const paragraphs = [opening];

  if (secondary && secondary !== primary) {
    const pressure = pick(SECONDARY_PRESSURES[secondary], { seed, section: 'secondary' });
    const shadow = profile
      ? pick(profile.shadows, { seed, section: 'shadow' })
      : '';
    paragraphs.push([pressure, shadow].filter(Boolean).join(' '));
  }

  paragraphs.push(pick(ANSWER_PATTERNS[habit], { seed, section: 'habit' }));

  if (selectedEvidence.length) {
    paragraphs.push(selectedEvidence.map(evidenceSentence).join(' '));
  }

  if (latestFate && fate) {
    const fateText = pick(FATE_PATTERNS[fate], { seed, section: 'fate' });
    paragraphs.push(interpolate(fateText, {
      card: latestFate.cardTitle || 'Fate',
      choice: latestFate.chosenLabel,
    }));
  }

  paragraphs.push(pick(CONSENSUS_PATTERNS[consensus], { seed, section: 'consensus' }));
  paragraphs.push(pick(
    CLOSING_PREDICTIONS[primary] || CLOSING_PREDICTIONS.BALANCED,
    { seed, section: 'closing' }
  ));

  return {
    title: profile?.title || 'The Unresolved Pattern',
    paragraphs: paragraphs.filter(Boolean),
    meta: {
      primary,
      secondary,
      confidence,
      answerPattern: habit,
      consensusPattern: consensus,
      fatePattern: fate,
      evidenceCount: evidence.length,
    },
  };
}
