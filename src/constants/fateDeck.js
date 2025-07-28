/**
 * @typedef {{ type: string, [k: string]: any }} FateEffect
 * @typedef {{ id: string, label: string, effect?: FateEffect }} FateOption
 * @typedef {{ id: string, title: string, text: string, choices: FateOption[] }} FateCard
 */

/** @type {FateCard[]} */
const fateDeck = [
  {
    id: "DYN001",
    title: "The Candle and the Pyre",
    text: "A moth whispers to you as it flutters by. 'Isn't the fire beautiful?' You have two choices:\n- Catch the moth and gain two points now.\n- Let it go, and for this round, every 'C' answer will earn you an extra point.",
    choices: [
      {
        id: "DYN001:0",
        label: "Now",
        effect: {
          type: "IMMEDIATE_SCORE",
          value: 2,
          flavorText: "You snatch the moth from the air. Its dust glitters on your fingers as you feel a surge of insight."
        }
      },
      {
        id: "DYN001:1",
        label: "Wait",
        effect: {
          type: "APPLY_WAGER",
          target: "answer-c",
          reward: { type: "SCORE", value: 1 },
          flavorText: "You let the moth spiral towards the flame. You feel a strange connection to its fate, tied to your future choices."
        }
      },
      { 
        id: "DYN001:2",
        label: "Ignore" 
      }
    ]
  },
  {
    id: "DYN002",
    title: "Predictive Loop",
    text: "Nous knows what you will choose. Do you? Predict which answer ('A', 'B', or 'C') you will select most frequently this round. If you are correct, your round score will be doubled.",
    choices: [
      { id: "DYN002:0", label: "Predict 'A'", effect: { type: "ROUND_PREDICTION", prediction: "A" } },
      { id: "DYN002:1", label: "Predict 'B'", effect: { type: "ROUND_PREDICTION", prediction: "B" } },
      { id: "DYN002:2", label: "Predict 'C'", effect: { type: "ROUND_PREDICTION", prediction: "C" } }
    ]
  },
  {
    id: "DYN003",
    title: "The Forked Path",
    text: "The path splits. Choose your burden for this round. Survive, and gain a reward of 3 points.",
    choices: [
      { id: "DYN003:0", label: "Veil", effect: { type: "ROUND_MODIFIER", modifier: "VEIL", flavorText: "A fog clouds your vision. The answers become indistinct shapes." } },
      { id: "DYN003:1", label: "Weight", effect: { type: "ROUND_MODIFIER", modifier: "WEIGHT", flavorText: "Every misstep feels heavier. The thread groans under the strain." } }
    ]
  },
  {
    id: "DYN004",
    title: "The Tallyman's Gambit",
    text: "You accept the Tallyman's Gambit. Each time you answer 'C' this round, a tally is marked. The final count will determine your fate.",
    choices: [
      { id: "DYN004:0", label: "Accept", effect: { type: "TALLY_TABLE", target: "C", table: { "0": { type: "DOUBLE_ROUND_SCORE" } } } }
    ]
  },
  {
    id: "DYN005",
    title: "Scholar's Boon",
    text: "Scholar's Boon: Your knowledge protects you.\nGain +1 Thread at the start of this round.",
    choices: [
      {
        id: "DYN005:0",
        label: "Accept Boon",
        effect: {
          type: "POWER_UP",
          power: "REMOVE_WRONG_ANSWER",
          flavorText: "You feel a quiet confidence. One of the wrong paths fades from view, leaving only certainty and a single doubt."
        }
      },
      {
        id: "DYN005:1",
        label: "Turn it down",
        effect: {
          type: "SCORE",
          value: -1
        }
      }
    ]
  }
];

export default fateDeck;
