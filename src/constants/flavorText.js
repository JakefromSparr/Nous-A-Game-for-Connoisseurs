// src/constants/flavorText.js
// Centralized voice lines for Nous. Engines select and interpolate; UI only displays.

export const GRIN_PHASES = {
  WHISPER: 'WHISPER',
  GRIN: 'GRIN',
  SHATTER: 'SHATTER',
};

export const FLAVOR_TEXT = {
  WAITING_ROOM_OBSERVED: {
    [GRIN_PHASES.WHISPER]: [
      'Nous hears {gathered} gathered. It observes {observed}.',
      '{gathered} gathered. {observed} observed. Nous does not miscount.',
      'You count {gathered}. Nous counts {observed}. Begin anyway.',
    ],
    [GRIN_PHASES.GRIN]: [
      'You brought {gathered}. Nous brought the number to {observed}.',
      '{gathered} voices at the table. {observed} shadows listening.',
    ],
    [GRIN_PHASES.SHATTER]: [
      '{gathered} gathered. {observed} observed. One of those numbers is inside you.',
    ],
  },

  // Existing trait intrusion lines, staged here for future migration.
  TRAIT_INTRUSION_MEASURING_DOORFRAME: {
    [GRIN_PHASES.WHISPER]: [
      'You’re measuring the doorframe again. You will fit.',
    ],
  },
  TRAIT_INTRUSION_NEVER_ANSWER_ASKED: {
    [GRIN_PHASES.WHISPER]: [
      'You never answer the question asked. That’s why you’re interesting.',
    ],
  },
  TRAIT_INTRUSION_PLAN_SIDEWAYS: {
    [GRIN_PHASES.WHISPER]: [
      'One of you keeps tugging the plan sideways. They’re usually right… at first.',
    ],
  },
  TRAIT_INTRUSION_STOP_PERFORMING: {
    [GRIN_PHASES.WHISPER]: [
      'Stop performing for each other. I already know.',
    ],
  },
};
