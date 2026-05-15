// src/constants/flavorText.js
// Centralized voice lines for Nous. Engines select and interpolate; UI only displays.
//
// Voice rule:
// Nous speaks as We and Us.
// It should feel like a séance medium with a clipboard:
// observant, ritual, clinical, and increasingly fear-inducing.
//
// WHISPER = unease.
// The room is wrong, but politely wrong.
//
// GRIN = dread.
// The room is no longer pretending to be neutral.
//
// SHATTER = fear.
// The room breaks. The language should feel colder, shorter, and less safe.

export const GRIN_PHASES = {
  WHISPER: 'WHISPER',
  GRIN: 'GRIN',
  SHATTER: 'SHATTER',
};

export const FLAVOR_TEXT = {
  WAITING_ROOM_OBSERVED: {
    [GRIN_PHASES.WHISPER]: [
      'How strange.\n\nIt feels like there are {observed} here with Us tonight.',
      '{gatheredWord}, you say?\n\nWe sense a {observedOrdinal}. Ah well.',
    ],
    [GRIN_PHASES.GRIN]: [
      '{gatheredWord}, you say?\n\nThen who is breathing behind you?',
      'We counted {observedWord}.\n\nAnother among you does not wish to be known. Yet.',
    ],
    [GRIN_PHASES.SHATTER]: [
      '{gatheredWord} came in.\n\n{observedWord} are still here. It is waiting.',
      'Do not count again.\n\nIt moves when named.',
    ],
  },

  // Existing trait intrusion lines, staged here for future migration.
  TRAIT_INTRUSION_MEASURING_DOORFRAME: {
    [GRIN_PHASES.WHISPER]: [
      'You are measuring the doorframe again.\n\nYou will fit.',
    ],
    [GRIN_PHASES.GRIN]: [
      'You keep measuring the doorframe.\n\nIt keeps changing.',
    ],
    [GRIN_PHASES.SHATTER]: [
      'No frame.\n\nNo door.\n\nStill inside.',
    ],
  },

  TRAIT_INTRUSION_NEVER_ANSWER_ASKED: {
    [GRIN_PHASES.WHISPER]: [
      'You rarely answer the question asked.\n\nThat is why We are listening.',
    ],
    [GRIN_PHASES.GRIN]: [
      'You answer beside the question.\n\nSomething beside you answers too.',
    ],
    [GRIN_PHASES.SHATTER]: [
      'The question opened.\n\nYou stepped through.',
    ],
  },

  TRAIT_INTRUSION_PLAN_SIDEWAYS: {
    [GRIN_PHASES.WHISPER]: [
      'Someone keeps tugging the plan sideways.\n\nWe have noticed.',
    ],
    [GRIN_PHASES.GRIN]: [
      'Someone keeps pulling sideways.\n\nThe room is starting to follow.',
    ],
    [GRIN_PHASES.SHATTER]: [
      'The plan bent.\n\nSo did the walls.',
    ],
  },

  TRAIT_INTRUSION_STOP_PERFORMING: {
    [GRIN_PHASES.WHISPER]: [
      'Stop performing for each other.\n\nWe already know.',
    ],
    [GRIN_PHASES.GRIN]: [
      'The wrong answers were not accidents.\n\nSomething clapped when you chose them.',
    ],
    [GRIN_PHASES.SHATTER]: [
      'Not wrong.\n\nOffered.',
    ],
  },
};
