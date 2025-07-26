
export default [
  {
    "id": "DYN001",
    "title": "The Candle and the Pyre",
    "rarity": "Common",
    "tags": ["Choice", "Wager", "Score"],
    "text": "A moth whispers to you as it flutters by. 'Isn't the fire beautiful?' You have two choices:\n- Catch the moth and gain two points now.\n- Let it go, and for this round, every 'C' answer will earn you an extra point.",
    "choices": [
      {
        "label": "Now",
        "effect": {
          "type": "IMMEDIATE_SCORE",
          "value": 2,
          "flavorText": "You snatch the moth from the air. Its dust glitters on your fingers as you feel a surge of insight."
        }
      },
      {
        "label": "Wait",
        "effect": {
          "type": "APPLY_WAGER",
          "target": "answer-c",
          "reward": { "type": "SCORE", "value": 1 },
          "flavorText": "You let the moth spiral towards the flame. You feel a strange connection to its fate, tied to your future choices."
        }
      },
      { "label": "Ignore" }
    ]
  },
  {
    "id": "DYN002",
    "title": "Predictive Loop",
    "rarity": "Uncommon",
    "tags": ["Prediction", "Gamble", "Score"],
    "text": "Nous knows what you will choose. Do you? Predict which answer ('A', 'B', or 'C') you will select most frequently this round. If you are correct, your round score will be doubled.",
    "choices": [
      { "label": "Predict 'A'", "effect": { "type": "ROUND_PREDICTION", "prediction": "A" } },
      { "label": "Predict 'B'", "effect": { "type": "ROUND_PREDICTION", "prediction": "B" } },
      { "label": "Predict 'C'", "effect": { "type": "ROUND_PREDICTION", "prediction": "C" } }
    ],
    "duration": "round",
    "resolveAt": "endOfRound",
    "reward": { "type": "DOUBLE_ROUND_SCORE" }
  },
  {
    "id": "DYN003",
    "title": "The Forked Path",
    "rarity": "Uncommon",
    "tags": ["Risk", "Modifier", "High-Stakes"],
    "audacityMin": 2,
    "text": "The path splits. Choose your burden for this round. Survive, and gain a reward of 3 points.",
    "choices": [
      { "label": "Veil", "effect": { "type": "ROUND_MODIFIER", "modifier": "VEIL", "flavorText": "A fog clouds your vision. The answers become indistinct shapes." } },
      { "label": "Weight", "effect": { "type": "ROUND_MODIFIER", "modifier": "WEIGHT", "flavorText": "Every misstep feels heavier. The thread groans under the strain." } }
    ],
    "duration": "round",
    "resolveAt": "endOfRound",
    "reward": { "type": "SCORE", "value": 3 }
  },
  {
    "id": "DYN004",
    "title": "The Tallyman's Gambit",
    "rarity": "Uncommon",
    "tags": ["Gamble", "Consequence", "Pact"],
    "text": "You accept the Tallyman's Gambit. Each time you answer 'C' this round, a tally is marked. The final count will determine your fate.",
      "choices": [
        { "label": "Accept", "effect": { "type": "TALLY_TABLE", "target": "C", "table": { "0": { "type": "DOUBLE_ROUND_SCORE" } } } }
      ],
    "duration": "round",
    "resolveAt": "endOfRound"
  },
  {
    "id": "DYN005",
    "title": "Scholar's Boon",
    "rarity": "Common",
    "tags": ["Utility", "Safety"],
    "text": "Scholar's Boon: Your knowledge protects you.\nGain +1 Thread at the start of this round.",
    "choices": [
      {
        "label": "Accept Boon",
        "effect": {
          "type": "POWER_UP",
          "power": "REMOVE_WRONG_ANSWER",
          "flavorText": "You feel a quiet confidence. One of the wrong paths fades from view, leaving only certainty and a single doubt."
        }
      },
      {
        "label": "Turn it down",
        "effect": {
          "type": "SCORE",
          "value": -1
        }
      }
    ]
  }
];
