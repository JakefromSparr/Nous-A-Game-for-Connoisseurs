// src/constants/traitConfig.js

/**
 * Cluster weights = maintainable signal.
 * We map question IDs into a few diagnostic clusters and give each cluster
 * a weight triplet {X,Y,Z}. IDs not listed use weight 1 on all axes.
 */
const GROUPS = Object.freeze({
  // Wordplay / ambiguous framing → pushes Y (conventional↔radical) & Z (figurative↔empirical)
  lateral_wordplay:   [101,103,106,107,108,209],

  // Straight fact / physics / calendar → pushes Z (empirical) and a bit X (analytical)
  factual_literal:    [102,105,201,203,206,207,208,401,402],

  // Framing / morality / risk appetite → pushes Y primarily
  framing_morality:   [104,109,202,204,205],

  // Dread / perception / horror → pushes Z (figurative) and a touch of Y
  uncanny_perception: [301,302,303],

  // Tier-5 handled with per-answer overrides below
  tier5_introspection:[501,502,503,504,505,506],
});

const WEIGHT_BY_GROUP = Object.freeze({
  lateral_wordplay  : { X: 0.8, Y: 1.2, Z: 1.1 },
  factual_literal   : { X: 0.6, Y: 0.5, Z: 1.5 },
  framing_morality  : { X: 0.5, Y: 1.6, Z: 0.7 },
  uncanny_perception: { X: 0.4, Y: 0.9, Z: 1.3 },
});

// Build base loadings from clusters
const BASE_LOADINGS = Object.fromEntries(
  Object.entries(GROUPS).flatMap(([group, ids]) => {
    const w = WEIGHT_BY_GROUP[group];
    return !w ? [] : ids.map(id => [id, { axisWeight: w }]);
  })
);

// Tier-5: per-answer overrides by *label* (works even when answers are shuffled)
const TIER5_OVERRIDES = {
  501: {
    axisWeight: { X: 1.0, Y: 1.0, Z: 1.2 },
    overridesByAnswer: {
      'Potential': { X: +0.6, Y: +0.3, Z: -0.4 },
      'Burden'   : { X: -0.2, Y: +0.7, Z: -0.3 },
      'Nothing'  : { X: -0.5, Y: -0.4, Z: +0.8 },
    },
  },
  502: {
    axisWeight: { X: 1.2, Y: 1.0, Z: 1.1 },
    overridesByAnswer: {
      'It Couldn’t Be': { X: -0.7, Y: -0.2, Z: +0.6 },
      'It Seems to Be': { X: +0.5, Y: +0.6, Z: -0.4 },
      'It Has to Be'  : { X: -0.2, Y: -0.7, Z: +0.4 },
    },
  },
  503: {
    axisWeight: { X: 0.8, Y: 0.8, Z: 1.0 },
    overridesByAnswer: {
      'He died'    : { X: -0.3, Y: -0.2, Z: +0.7 },
      'He found it': { X: +0.6, Y: +0.5, Z: -0.5 },
      'He hid'     : { X: +0.2, Y: +0.6, Z: -0.2 },
    },
  },
  504: {
    axisWeight: { X: 0.8, Y: 1.0, Z: 0.9 },
    overridesByAnswer: {
      'Doubt': { X: -0.4, Y: -0.1, Z: +0.3 },
      'Need' : { X: +0.3, Y: +0.5, Z: -0.3 },
      'Love' : { X: +0.2, Y: +0.6, Z: -0.4 },
    },
  },
  505: {
    axisWeight: { X: 1.3, Y: 1.0, Z: 0.7 },
    overridesByAnswer: {
      'Forward' : { X: +0.7, Y: +0.3, Z: -0.2 },
      'Backward': { X: -0.5, Y: -0.2, Z: +0.1 },
      'The Side': { X: +0.4, Y: +0.6, Z: -0.3 },
    },
  },
  506: {
    axisWeight: { X: 0.7, Y: 0.9, Z: 1.3 },
    overridesByAnswer: {
      'It Will Vanish'     : { X: -0.1, Y: +0.4, Z: -0.8 },
      'It Will Distort'    : { X: +0.2, Y: +0.6, Z: -0.6 },
      'It Will Be The Same': { X: -0.3, Y: -0.5, Z: +0.8 },
    },
  },
};

export const TRAIT_LOADINGS = Object.freeze({
  ...BASE_LOADINGS,
  ...TIER5_OVERRIDES,
});
