# About **NOUS**

**NOUS** is a social, single‑mind experience. One interface, **three buttons**, and a deck that seems to watch back.  
Inspired by *Ouija*, Barnum‑style cold reading, and personality tests, it uses trivia as camouflage: every answer quietly feeds a model that bends the night’s Fate.

Players think they’re playing a clever trivia game.  
But the game is really playing them.

---

## Table Experience

- **One shared will.** Three buttons (0/1/2). Decisions are made out loud and under pressure. Consensus becomes story.
- **Mind / Body / Soul** categories.
- Each answer is classified and scored:
  - **TYPICAL** — safe, common, conventional.
  - **REVELATORY** — lateral, literal, tricky, pedantic.
  - **WRONG** — boldly incorrect (and revealing).
- Hidden **X/Y/Z** trait axes and visible **A/B/C** tallies steer Fate.

---

## Night in Three Acts

| Phase | What Players See | What the Engine Does |
|------:|------------------|----------------------|
| 1 · **Questions** | Three answers; **Thread** visibly depletes | Apply baseline **Pull −1**; add outcome deltas; update streaks and tallies |
| 2 · **Fate** | A drawn card with up to three choices | Queue immediate tweaks or round‑long wagers/predictions/modifiers |
| 3 · **Final Reading** | A bespoke epilogue | Uses trait totals + flags + results to assemble the reading |

---

## Core Systems (Blueprint)

### Thread & Answers

- **Pull baseline:** −1 **Thread** before reveal.
- **Outcomes** (post‑baseline deltas):
  - **TYPICAL** → `+2 points`, `+0 thread`  ⇒ **net −1**
  - **REVELATORY** → `+1 point`, `+1 thread` ⇒ **net 0**
  - **WRONG** → `+0 points`, `−1 thread`   ⇒ **net −2**
- **Weave:** Spend 1 thread in **Round Lobby** to **double the next question’s points only**. No stacking. Clears after one use.
- **Sever:** If `thread ≤ 0` after applying outcome deltas ⇒ forced round end, lose 1 **life**, bank `0`.

### Round Lifecycle

- **Start of round:** `thread = nextRoundT0 || baseT0` (baseT0 = **4**). Clears round scratch. (Any `ROUND_START` fate effects are applied here.)
- **Continue past 3:** Hitting **3+ not‑wrong** does **not** auto‑end; players may keep pulling.
- **End of round:** Only by **Tie Off** (player choice) or **Sever** (thread ≤ 0).
- **Win condition:** Checked at end; **win** if `notWrongCount ≥ 3`.

### Banking & Carry‑Over

- **Tie Off:**
  - `pendingBank = roundScore` (do **not** add to global score yet).
  - Compute carry‑over next round thread:
    - `threadCap = 5 + floor(audacity/2)`
    - `nextRoundT0 = clamp(baseT0 + leftoverThread, 3, threadCap)`
  - Record whether round was won (`notWrongCount ≥ 3`).
- **Sever:** `pendingBank = 0`, `lives -= 1`, no carry‑over (`nextRoundT0 = null`).
- **Global score:** Updated **only** at **Fate Resolution**.

### Fate Resolution

- At **FATE_RESULT → Accept**:
  - Apply fate math to the bank and global score:
    - `roundScoreDelta` (additive modifications to bank)
    - `roundScoreMultiplier` (multiplicative modifier on bank)
    - `scoreDelta` (global points, independent of bank)
  - `score += (pendingBank + roundScoreDelta) * roundScoreMultiplier + scoreDelta`
  - If `roundWon`, then `roundsWon++`. Always `roundNumber++`.
  - Clear round scratch; return to **Game Lobby**, or proceed to **Final Reading** when `roundsWon === roundsToWin`.

---

## Data Formats (Reference)

### Questions — `src/constants/questionDeck.js`

```ts
// Answer classes are case‑insensitive in the engine; use canonical uppercase
// TYPICAL | REVELATORY | WRONG

export type Answer = {
  label: string;
  answerClass: 'TYPICAL' | 'REVELATORY' | 'WRONG';
  explanation: string;
};

export type Question = {
  id: number | string;
  category: 'Mind' | 'Body' | 'Soul';
  tier: 1 | 2 | 3;
  title: string;
  text: string;
  answers: [Answer, Answer, Answer];
};

declare const questions: Question[];
export default questions;
```

- The engine shuffles `answers` and preserves `answerClass` & `explanation` for the **Reveal** screen.

### Fate Cards — `src/constants/fateDeck.js`

Supported `effect.type`s:

- `IMMEDIATE_SCORE { value }` — adds to a round‑end buffer applied as `scoreDelta`.
- `SCORE { value }` — immediate change to this round’s `roundScore`.
- `POWER_UP { power }` — pushes a token into `activePowerUps`.
- `APPLY_WAGER { target:'answer-c'|'A'|'B'|'C', reward:{ type:'SCORE', value } }` — pay per letter tally at resolution.
- `TALLY_TABLE { target:'A'|'B'|'C', table:{ [n]: { type:'DOUBLE_ROUND_SCORE'|'SCORE', value? } } }`.
- `ROUND_PREDICTION { prediction:'A'|'B'|'C' }` — doubles bank if the predicted letter is the most chosen (ties count).
- `ROUND_MODIFIER { modifier, reward? }` — if the round is **won**, add default `+3` (or custom) to global score.
- `ROUND_START { threadDelta }` — one‑shot: applied to next round’s starting thread.

**Choices UI:** Up to **3** options. If fewer than 3, empty slots render as **NOUS** and are disabled.

---

## Routing Contract

- Exactly **3 labels** and **3 actions** per screen. The router enforces this.
- Buttons are **0‑based**: `btn0`, `btn1`, `btn2` → `actions[0..2]`.
- Labels may be **static strings** or `(state) => string`.
- A button is disabled when:
  - Its mapped **action is `null`** (taunt).
  - **Fate** screen slot has **no choice** (renders NOUS).
  - **Game Lobby** middle button has **no pending fate**.

---

## Writing Tone

- The game is a **mirror**, not a scold. Voice is wry, a little too observant, never mean.
- **Revelatory** explanations reward lateral thinking. Avoid smugness; prize specificity.
- Keep **Wrong** fun or uncanny—never cruel.

---

## Persistence & Validation

- Saves to `localStorage['nous-save']`. Sets are serialized as arrays and rehydrated on load.
- `validator.js` syncs `currentScreen` to `SCREENS` automatically and guards invariants.
- Dev tip: to reset a corrupted save, open DevTools → **Application** → **Local Storage** → delete `nous-save`.

---

## Credits

Created by **Jake Spencer**.  
© **Sparr Games LLC**. Internal prototype; do not redistribute without permission.

> *Nous is watching. Tread lightly.*

