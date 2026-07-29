import { DEFAULTS } from '../state.js';
import { clamp } from './utils.js';
import { ID_TO_GROUPS } from '../constants/questionGroups.js';

const INTRO_QUESTION_IDS = ['001', '002', '003'];

function questionWeight(question, state) {
  const preferredTier = Math.max(1, Number(state.difficultyLevel) || 1);
  const tierDistance = Math.abs((Number(question.tier) || 1) - preferredTier);
  let weight = 1 / (1 + tierDistance * 0.65);

  const groups = ID_TO_GROUPS.get(question.id) || new Set();
  for (const preferredGroup of state.traitRead?.routingNudge || []) {
    if (groups.has(preferredGroup)) weight *= 2.25;
  }

  const timesSeen = Number(state.tierSeen?.[question.tier]) || 0;
  weight *= 1 / (1 + timesSeen * 0.05);
  return weight;
}

function weightedPacket(questions, limit, state) {
  const remaining = [...questions];
  const selected = [];

  while (selected.length < limit && remaining.length) {
    const weights = remaining.map((question) => questionWeight(question, state));
    let cursor = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    let selectedIndex = weights.length - 1;
    for (let index = 0; index < weights.length; index += 1) {
      cursor -= weights[index];
      if (cursor <= 0) {
        selectedIndex = index;
        break;
      }
    }
    selected.push(remaining.splice(selectedIndex, 1)[0]);
  }

  return selected;
}

function prepareRoundQuestions(state, isIntroRound) {
  const deck = Array.isArray(state.questionDeck) ? state.questionDeck : [];

  if (isIntroRound) {
    const availableIds = new Set(deck.map((question) => String(question.id)));
    const ids = INTRO_QUESTION_IDS.filter((id) => availableIds.has(id));
    return { limit: ids.length, ids, drawPile: [...ids] };
  }

  const effectBonus = (state.activeRoundEffects || [])
    .reduce((total, effect) => total + (Number(effect?.cardPoolDelta) || 0), 0);
  const requestedLimit =
    DEFAULTS.roundCardLimitBase +
    (Number(state.cardPoolBonus) || 0) +
    effectBonus;
  const limit = clamp(requestedLimit, 1, DEFAULTS.roundCardLimitMax);
  const answered = state.answeredQuestionIds || new Set();
  const available = deck.filter((question) => {
    const tier = Number(question.tier);
    const tierIsAvailable =
      (tier >= 1 && tier <= 4) ||
      (tier === 5 && (state.roundsWon || 0) >= 2);
    return (
      tierIsAvailable &&
      Array.isArray(question.answers) &&
      question.answers.length >= 3 &&
      !answered.has(question.id)
    );
  });
  const ids = weightedPacket(available, limit, state).map((question) => question.id);

  return { limit, ids, drawPile: [...ids] };
}

export function startRound(state) {
  const isIntroRound = !!state.firstEntryActive;
  const t0 = isIntroRound
    ? (state.tasselTaken ? 4 : 3)
    : state.tasselTaken
      ? clamp(
        Number(state.nextRoundT0) || DEFAULTS.baseT0,
        DEFAULTS.baseT0,
        DEFAULTS.baseT0 + 2
      )
      : DEFAULTS.baseT0;
  const roundQuestions = prepareRoundQuestions(state, isIntroRound);

  // Apply any fate effects that trigger at round start (e.g., thread +1).
  const startFx = Array.isArray(state.activeRoundEffects) ? state.activeRoundEffects : [];
  const startBonus = startFx
    .filter((effect) => effect?.type === 'ROUND_START')
    .reduce((sum, effect) => sum + (Number(effect.threadDelta) || 0), 0);
  const keepEffects = startFx.filter((effect) => effect?.type !== 'ROUND_START');

  return {
    roundScore: 0,
    notWrongCount: 0,
    thread: t0 + startBonus,
    weavePrimed: false,
    isIntroRound,
    roundCardLimit: roundQuestions.limit,
    roundQuestionIds: roundQuestions.ids,
    roundDrawPile: roundQuestions.drawPile,
    roundIsRecycling: false,
    currentQuestionIsRepeat: false,
    crossroadCandidates: [],
    crossroadSelection: 0,

    currentQuestion: null,
    currentAnswers: [],
    currentCategory: '',
    roundAnswerTally: { A: 0, B: 0, C: 0 },

    activeFateCard: null,
    fateChoices: [null, null, null],

    roundEndedBy: null,
    roundWon: false,
    activeRoundEffects: keepEffects,
  };
}

export function canTieOff(state) {
  const requiredAnswers = state.isIntroRound ? 1 : 3;
  return (state.notWrongCount || 0) >= requiredAnswers;
}

export function tieOff(state) {
  const carriedThread = state.tasselTaken
    ? clamp(Number(state.thread) || 0, 0, 2)
    : 0;

  return {
    pendingBank: state.roundScore || 0,
    nextRoundT0: DEFAULTS.baseT0 + carriedThread,
    roundEndedBy: 'TIE_OFF',
    roundWon: canTieOff(state),
  };
}

export function sever(state) {
  return {
    lostRoundPoints: state.roundScore || 0,
    pendingBank: 0,
    lives: Math.max(0, (state.lives || 0) - 1),
    nextRoundT0: null,
    roundEndedBy: 'SEVER',
    roundWon: canTieOff(state),
  };
}

export function finalizeRound(state, fateResolution = {}) {
  const { scoreDelta = 0, roundScoreDelta = 0, roundScoreMultiplier = 1 } = fateResolution;
  const bankAfterMods = ((state.pendingBank || 0) + roundScoreDelta) * roundScoreMultiplier;
  const newScore = (state.score || 0) + bankAfterMods + scoreDelta;
  const wasIntro = !!state.isIntroRound;
  const wonInc = !wasIntro && state.roundWon ? 1 : 0;

  return {
    score: newScore,
    pendingBank: 0,

    roundsWon: (state.roundsWon || 0) + wonInc,
    roundNumber: (state.roundNumber || 1) + (wasIntro ? 0 : 1),
    firstEntryActive: false,

    roundScore: 0,
    notWrongCount: 0,
    thread: 0,
    weavePrimed: false,
    isIntroRound: false,
    roundCardLimit: DEFAULTS.roundCardLimitBase,
    roundQuestionIds: [],
    roundDrawPile: [],
    roundIsRecycling: false,
    currentQuestionIsRepeat: false,
    crossroadCandidates: [],
    crossroadSelection: 0,

    currentQuestion: null,
    currentAnswers: [],
    currentCategory: '',
    roundAnswerTally: { A: 0, B: 0, C: 0 },

    activeFateCard: null,
    fateChoices: [null, null, null],

    activeRoundEffects: [],
    activePowerUps: [],
    roundEndedBy: null,
    roundWon: false,
  };
}
