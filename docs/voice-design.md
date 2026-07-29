# The Mirror That Learns to Grin  
*A Voice System & Haunting Engine for **NOUS***

---

## 🗺️ Overview
The narrator of **NOUS** is a mirror. It begins as a cool, detached observer, evolves into an insinuating **"we,"** and finally shatters into absence.  
Its voice shifts in response to player patterns, audacity, and risk. When the table is one round from victory, the UI itself turns hostile.

This document defines:

* The three-phase **Personality Arc** (`whisper → grin → shatter`)
* Trigger conditions that escalate the voice
* “Haunted Mode” UI antagonism
* State & engine scaffolding for implementation
* Sample flavor-text banks

---

## 🎭 The Personality Arc

### PHASE 1 — **The Whisper**  
**When** Rounds 1-2 _(or until a trigger)_  
**Voice** Observational, impersonal, third-person.  
**Goal** Unsettle without confrontation.

| Context | Sample Lines |
|---------|--------------|
| Ambient | “A familiar pattern forms.” &nbsp;· “It did not go unnoticed.” |
| Question | “Listen closely.” &nbsp;· “You already know which one you’ll pick.” |
| Reveal | “As expected.” &nbsp;· “It took something with it.” |

> **Intro Flavor**:  
> “How strange… it looks like there are **{pcount + 1}** of you. Ah well.”

---

### 🧠 The Trigger — *When the Mirror Grins*
Escalate the voice the **first** time any trigger fires:

| Trigger | Example Condition |
|---------|-------------------|
| **Pattern-Lock** | Three identical answer letters in a row |
| **Fate** | Drawing *The Candle and the Pyre* (or any keyed Fate card) |
| **Failure Cascade** | A full round with zero correct answers |
| **Hubris** | `audacity ≥ 2` |
| **Omen** | Group score hits a power of 6 (6, 36, 216…) |

**Effect**

```js
state.voicePhase = 'grin';
```

Enable mild UI glitches (flickers, timing feints).

---

### PHASE 2 — **The Grin**

**When** Immediately after trigger *(or by Round 3)*
**Voice** Personal, plural “we,” manipulative.
**Goal** Undermine confidence; fracture consensus.

| Context  | Sample Lines                                                                          |
| -------- | ------------------------------------------------------------------------------------- |
| Ambient  | “We warned you not to trust your instincts.” · “The thread tightens. We’re so proud.” |
| Question | “Go on. Prove us wrong.” · “We love it when you hesitate.”                            |
| Reveal   | “Comfort is a dangerous habit.” · “There it is. The crack in the wall.”               |

---

### 🪞💀 PHASE 3 — **The Shatter**

**When** Final reading / game end.
**Delivery** One line at a time. **Long pauses.**

```
There is no us.  
We told you from the beginning.  
Nous. Just you.
```

**UX finale**

* Background glitches & desaturates
* Music / SFX drop to silence
* Buttons fade to blank

---

## 🧯 Haunted Mode (Auto-Escalation)

When the group is **one round from victory**:

```js
state.isHaunted = true;   // roundsToWin - roundsWon === 1
```

| Haunted Effect                        | Description                                                              |
| ------------------------------------- | ------------------------------------------------------------------------ |
| **Veiled Path**                       | UI hints (hover outlines, focus rings) disappear.                        |
| **Visual Feints**                     | Answer text shuffles for 0.5 s before settling (keys A/B/C never remap). |
| **Misdirective Copy**                 | Result headers taunt: “Correct → *Not yet punished*.”                    |
| **Memory Games**                      | Re-plays an earlier line with one word changed.                          |
| **Cursed Run** *(optional hard-mode)* | One-time genuine key remap; final reading tagged **Cursed**.             |

---

## 🧩 Implementation

### 1 · State Schema (`state.js`)

```js
export const gameState = {
  voicePhase: 'whisper',   // 'whisper' | 'grin' | 'shatter'
  isHaunted:  false,       // UI antagonism flag
  lastVoice:  '',
  voiceFlags: {
    noticedTriplet:   false,
    sawFateCard:      false,
    allWrongRound:    false,
  },
  // ...existing game vars
};
```

### 2 · Voice Engine (`engine/voice.js`)

```js
import { Voice } from './constants/voice.js';

export function checkVoiceTriggers(state) {
  if (state.voicePhase === 'grin') return;

  const escalates =
    state.voiceFlags.noticedTriplet ||
    state.voiceFlags.sawFateCard   ||
    state.voiceFlags.allWrongRound ||
    state.audacity >= 2            ||
    isPowerOfSix(state.score);

  if (escalates) state.voicePhase = 'grin';

  // Haunted mode
  state.isHaunted = (state.roundsToWin - state.roundsWon === 1);
}

export function getFlavor(context, state) {
  const bank = Voice[state.voicePhase.toUpperCase()] || {};
  const lines = bank[context] || bank.ambient || [];
  const line  = lines[Math.random() * lines.length | 0] || '';
  return line.replace('{pcount+1}', state.playerCount + 1);
}
```

### 3 · Voice Constants (`constants/voice.js`)

```js
export const Voice = {
  WHISPER: {
    ambient: [
      "A familiar pattern forms.",
      "It did not go unnoticed.",
      "How unsurprising."
    ],
    question: [
      "Listen closely.",
      "You already know which one you'll pick."
    ],
    reveal: [
      "As expected.",
      "It took something with it."
    ]
  },

  GRIN: {
    ambient: [
      "We warned you not to trust your instincts.",
      "That choice wasn't unanimous.",
      "The thread tightens. We're so proud."
    ],
    question: [
      "Go on. Prove us wrong.",
      "We love it when you hesitate."
    ],
    reveal: [
      "Comfort is a dangerous habit.",
      "Accidents still count."
    ]
  },

  SHATTER: {
    lines: [
      "There is no us.",
      "We told you from the beginning.",
      "Nous. Just you."
    ]
  }
};
```

---

## 🗃️ Line Bank (Expandable)

| Phase       | Ambient           | Question | Reveal |
| ----------- | ----------------- | -------- | ------ |
| **Whisper** | See constant list | —        | —      |
| **Grin**    | See constant list | —        | —      |

Add new lines by extending the arrays; engine picks randomly.

## QUESTION TIER TAXONOMY
Tier	Name	Right-Answer Pattern	Player Feeling	Voice phase hook
0	Invitation	3 / 3	“Oh, everything works.”	Whisper
1	Classic Cut	2 of 3	“Bias revealed.”	Whisper
2	Moral Compass	2 of 3 (values)	“It’s about us now.”	Whisper → Grin
3	Scholar’s Gambit	2 of 3 (jargon vs folk)	“Am I smart or gullible?”	Grin
4	Unfair Game	1 of 3	“The mirror is cheating.”	Grin (UI glitches escalate)
5	Shattered Mirror	0 of 3 (projection)	“We’re exposed; nothing is real.”	Shatter

(If you keep Tier-3 split, label 3a/3b inside docs.)

## Implementation hooks
Engine flag	When set	Effect
state.tierIndex	Increment after N questions or specific Fate draw	Picks next tier pool
state.voicePhase	Already defined	Advance to grin when tier ≥ 2 or first voice trigger fires
state.isUnfair	When tier === 4	Answer evaluation flips to single-truth; UI taunts
state.isMirror	Tier 5 card drawn	Disable score display; show projection line after choice

## Orthogonal dials:

Tier intent (what kind of cut)
NOUS Rating (how deep it cuts)
Voice phase (how the mirror talks)
Fate cards (episodic twists)
