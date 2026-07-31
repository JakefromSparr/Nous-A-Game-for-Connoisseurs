// src/engine/questionEngine.js

import { State } from '../state.js';
import { shuffle } from './utils.js';
import {
  OUTCOME,
  OUTCOME_EFFECT,
  WEAVE,
} from '../constants/answerLogic.js';
import { applyTraitDelta } from './traitEngine.js';

/* ---------- Outcome fallback for legacy questions ---------- */

function getKind(question, key) {
  if (question.answerKinds?.[key]) {
    return question.answerKinds[key];
  }

  if (question.correct) {
    if (key === question.correct) {
      return OUTCOME.TYPICAL;
    }

    const otherKeys = ['A', 'B', 'C'].filter(
      candidateKey => candidateKey !== question.correct
    );

    return key === otherKeys[0]
      ? OUTCOME.REVELATORY
      : OUTCOME.WRONG;
  }

  return key === 'C'
    ? OUTCOME.WRONG
    : OUTCOME.TYPICAL;
}

/* ---------- Answer identity ---------- */

/**
 * Normal questions are identified by their visible label.
 *
 * Tier 3 questions may display the same label three times, so their
 * buttonLabel becomes the identity used for history and repeat handling.
 */
function getAnswerIdentity(answer) {
  return answer?.buttonLabel || answer?.label || '';
}

function getPreviousSelections(question, state) {
  const previous =
    state.questionHistory?.[String(question.id)];

  if (Array.isArray(previous)) {
    return previous;
  }

  return previous ? [previous] : [];
}

/* ---------- Build shuffled A/B/C answers for the UI ---------- */

function buildAnswers(question) {
  const state = State.getState();

  const selectedAnswers = new Set(
    getPreviousSelections(question, state)
  );

  const shuffledAnswers = shuffle([
    ...(question.answers || []),
  ]);

  const keys = ['A', 'B', 'C'];

  let answers = shuffledAnswers
    .slice(0, 3)
    .map((answer, index) => {
      const label =
        answer.label || 'The words have faded.';

      const answerIdentity =
        getAnswerIdentity(answer);

      return {
        key: keys[index],
        label,
        buttonLabel: answer.buttonLabel,
        answerIdentity,
        answerClass: String(
          answer.answerClass || ''
        ).toUpperCase(),
        explanation:
          answer.explanation ||
          'Nous offers no explanation.',
        unavailable:
          selectedAnswers.has(answerIdentity),
      };
    });

  if (
    state.activePowerUps?.includes(
      'REMOVE_WRONG_ANSWER'
    )
  ) {
    const wrongIndex = answers.findIndex(
      answer =>
        answer.answerClass === OUTCOME.WRONG &&
        !answer.unavailable
    );

    if (wrongIndex >= 0) {
      answers.splice(wrongIndex, 1);
    }

    state.activePowerUps =
      state.activePowerUps.filter(
        power => power !== 'REMOVE_WRONG_ANSWER'
      );
  }

  return answers;
}

/* ---------- Availability and progression ---------- */

function hasAvailableAnswer(question, state) {
  const selectedAnswers = new Set(
    getPreviousSelections(question, state)
  );

  return (question.answers || []).some(answer => {
    const identity = getAnswerIdentity(answer);
    return !selectedAnswers.has(identity);
  });
}

function isAvailableAtCurrentProgress(
  question,
  state
) {
  const tier = Number(question.tier);

  if (
    state.isIntroRound ||
    state.tutorial?.active
  ) {
    return tier === 0;
  }

  if (tier >= 1 && tier <= 3) {
    return true;
  }

  if (tier === 4 || tier === 5) {
    return (state.roundNumber || 1) >= 3;
  }

  return false;
}

/* ---------- Prepare the current round's draw pile ---------- */

function prepareDrawPile(state) {
  const deck = state.questionDeck || [];

  const questionsById = new Map(
    deck.map(question => [
      String(question.id),
      question,
    ])
  );

  const roundQuestionIds = Array.isArray(
    state.roundQuestionIds
  )
    ? state.roundQuestionIds
    : [];

  let drawPile = Array.isArray(
    state.roundDrawPile
  )
    ? [...state.roundDrawPile]
    : [];

  let isRepeat = Boolean(
    state.roundIsRecycling
  );

  drawPile = drawPile.filter(id => {
    const question = questionsById.get(
      String(id)
    );

    return (
      question &&
      isAvailableAtCurrentProgress(
        question,
        state
      ) &&
      hasAvailableAnswer(question, state)
    );
  });

  if (
    drawPile.length === 0 &&
    roundQuestionIds.length > 0
  ) {
    drawPile = shuffle([
      ...roundQuestionIds,
    ]).filter(id => {
      const question = questionsById.get(
        String(id)
      );

      return (
        question &&
        isAvailableAtCurrentProgress(
          question,
          state
        ) &&
        hasAvailableAnswer(
          question,
          state
        )
      );
    });

    isRepeat = true;
  }

  return {
    questionsById,
    drawPile,
    isRepeat,
  };
}

/* ---------- Crossroads ---------- */

export function prepareCrossroads(_state) {
  const state = State.getState();
  const prepared = prepareDrawPile(state);

  const firstId = prepared.drawPile[0];

  const firstQuestion =
    firstId === undefined
      ? null
      : prepared.questionsById.get(
          String(firstId)
        );

  const differentCategoryId =
    prepared.drawPile
      .slice(1)
      .find(id => {
        const question =
          prepared.questionsById.get(
            String(id)
          );

        return (
          question?.category &&
          question.category !==
            firstQuestion?.category
        );
      });

  const candidates =
    firstId === undefined
      ? []
      : [
          firstId,
          differentCategoryId ??
            prepared.drawPile[1],
        ].filter(
          id => id !== undefined
        );

  return {
    candidates,
    patch: {
      roundDrawPile:
        prepared.drawPile,
      roundIsRecycling:
        prepared.isRepeat,
      crossroadCandidates:
        candidates,
      crossroadSelection: 0,
    },
  };
}

/* ---------- Draw a question ---------- */

export function drawQuestion(
  _state,
  requestedId = null
) {
  const state = State.getState();
  const prepared = prepareDrawPile(state);

  const {
    questionsById,
    isRepeat,
  } = prepared;

  const drawPile = [
    ...prepared.drawPile,
  ];

  let question = null;
  let answers = [];

  if (requestedId !== null) {
    const requestedIndex =
      drawPile.findIndex(
        id =>
          String(id) ===
          String(requestedId)
      );

    if (requestedIndex >= 0) {
      const [selectedId] =
        drawPile.splice(
          requestedIndex,
          1
        );

      question =
        questionsById.get(
          String(selectedId)
        ) || null;

      if (question) {
        answers =
          buildAnswers(question);
      }
    }
  }

  while (
    drawPile.length > 0 &&
    !question
  ) {
    const nextId = drawPile.shift();

    const candidate =
      questionsById.get(
        String(nextId)
      );

    if (!candidate) {
      continue;
    }

    const candidateAnswers =
      buildAnswers(candidate);

    const hasSelectableAnswer =
      candidateAnswers.some(
        answer => !answer.unavailable
      );

    if (!hasSelectableAnswer) {
      continue;
    }

    question = candidate;
    answers = candidateAnswers;
  }

  if (!question) {
    return {
      question: null,
      answers: [],
      category: '',
      patch: {
        roundDrawPile: drawPile,
        roundIsRecycling:
          isRepeat,
      },
    };
  }

  const tierSeen = {
    ...(state.tierSeen || {}),
  };

  const tier = question.tier || 0;

  tierSeen[tier] =
    (tierSeen[tier] || 0) + 1;

  return {
    question,
    answers,
    category:
      question.category ||
      question.title ||
      '',
    patch: {
      roundDrawPile: drawPile,
      roundIsRecycling: isRepeat,
      currentQuestionIsRepeat:
        isRepeat,
      crossroadCandidates: [],
      crossroadSelection: 0,
      tierSeen,
    },
  };
}

/* ---------- Evaluate the selected answer ---------- */

export function evaluate(
  choiceIndex,
  _state
) {
  const state = State.getState();

  const question =
    state.currentQuestion;

  const answer =
    state.currentAnswers?.[
      choiceIndex
    ];

  if (!question || !answer) {
    return { patch: {} };
  }

  const key = String(
    answer.key || ''
  ).toUpperCase();

  const answerClass = String(
    answer.answerClass || ''
  ).toUpperCase();

  const kind =
    answerClass === 'TYPICAL' ||
    answerClass === 'REVELATORY' ||
    answerClass === 'WRONG'
      ? answerClass
      : getKind(question, key);

  const effect =
    OUTCOME_EFFECT[kind] || {
      points: 0,
      threadDelta: 0,
    };

  const weaveMultiplier =
    state.weavePrimed
      ? WEAVE.multiplier
      : 1;

  const pointsGained =
    (effect.points || 0) *
    weaveMultiplier;

  const tally = {
    ...(state.roundAnswerTally || {
      A: 0,
      B: 0,
      C: 0,
    }),
  };

  tally[key] =
    (tally[key] || 0) + 1;

  const isNotWrong =
    kind === OUTCOME.TYPICAL ||
    kind === OUTCOME.REVELATORY;

  const isRepeat = Boolean(
    state.currentQuestionIsRepeat
  );

  const collectsTraits =
    !isRepeat &&
    !state.tutorial?.active;

  state.answeredQuestionIds?.add?.(
    question.id
  );

  const answerIdentity =
    answer.answerIdentity ||
    answer.buttonLabel ||
    answer.label ||
    key;

  /* ---------- Record answer history ---------- */

  let historyPatch = null;

  if (answerIdentity) {
    const history = {
      ...(state.questionHistory || {}),
    };

    const previous =
      history[String(question.id)];

    const selected = Array.isArray(
      previous
    )
      ? [...previous]
      : previous
        ? [previous]
        : [];

    if (
      !selected.includes(
        answerIdentity
      )
    ) {
      selected.push(answerIdentity);
    }

    history[String(question.id)] =
      selected;

    historyPatch = history;
  }

  /* ---------- Traits and evidence ---------- */

  if (collectsTraits) {
    applyTraitDelta(
      question.id,
      kind,
      answerIdentity
    );
  }

  const choiceEvidence =
    !collectsTraits
      ? state.choiceEvidence || []
      : [
          ...(state.choiceEvidence ||
            []),
          {
            questionId:
              question.id,
            questionText:
              question.text ||
              question.title ||
              'A question without a name.',
            chosenLabel:
              answerIdentity ||
              'the unspoken answer',
            kind,
            category:
              question.category ||
              '',
            tier:
              Number(
                question.tier
              ) || 0,
            roundNumber:
              Number(
                state.roundNumber
              ) || 1,
          },
        ].slice(-12);

  const weightIsActive = (
    state.activeRoundEffects || []
  ).some(
    activeEffect =>
      activeEffect.type ===
        'ROUND_MODIFIER' &&
      activeEffect.modifier ===
        'WEIGHT'
  );

  const fateThreadDelta =
    kind === OUTCOME.WRONG &&
    weightIsActive
      ? -1
      : 0;

  /* ---------- State patch ---------- */

  const patch = {
    roundScore:
      (state.roundScore || 0) +
      pointsGained,

    thread:
      (state.thread || 0) +
      (effect.threadDelta || 0) +
      fateThreadDelta,

    weavePrimed: false,

    roundAnswerTally: tally,

    notWrongCount:
      (state.notWrongCount || 0) +
      (isNotWrong ? 1 : 0),

    choiceEvidence,

    currentQuestion:
      state.currentQuestion,

    currentAnswers:
      state.currentAnswers,

    lastOutcome: {
      kind,
      chosenKey: key,
      chosenLabel: answerIdentity,
      pointsGained,
      threadDelta:
        (effect.threadDelta || 0) +
        fateThreadDelta,
      explanation:
        answer.explanation || '',
      questionText:
        question.text ||
        question.title ||
        '',
      questionId: question.id,
      insert:
        question.insert || '',
      isRepeat,
    },
  };

  if (historyPatch) {
    patch.questionHistory =
      historyPatch;
  }

  /* ---------- Difficulty progression ---------- */

  if (
    isNotWrong &&
    collectsTraits
  ) {
    const correctCount =
      (state.correctAnswersThisDifficulty ||
        0) + 1;

    if (correctCount >= 2) {
      patch.difficultyLevel =
        Math.min(
          (state.difficultyLevel ||
            1) + 1,
          7
        );

      patch.correctAnswersThisDifficulty =
        0;
    } else {
      patch.correctAnswersThisDifficulty =
        correctCount;
    }
  } else {
    patch.correctAnswersThisDifficulty =
      state.correctAnswersThisDifficulty ||
      0;
  }

  return { patch };
}
