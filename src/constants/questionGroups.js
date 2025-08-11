// src/constants/questionGroups.js
// Light taxonomy used by the soft-bias helper.
// (These mirror the clusters in traitConfig; no trait math here.)

export const QUESTION_GROUPS = Object.freeze({
  lateral_wordplay:   [101,103,106,107,108,209],
  factual_literal:    [102,105,201,203,206,207,208,401,402],
  framing_morality:   [104,109,202,204,205],
  uncanny_perception: [301,302,303],
  tier5_introspection:[501,502,503,504,505,506],
});

// Precompute id → Set(groups)
export const ID_TO_GROUPS = (() => {
  const m = new Map();
  for (const [group, ids] of Object.entries(QUESTION_GROUPS)) {
    for (const id of ids) {
      if (!m.has(id)) m.set(id, new Set());
      m.get(id).add(group);
    }
  }
  return m;
})();
