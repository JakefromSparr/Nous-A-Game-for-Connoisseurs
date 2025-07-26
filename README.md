# Nous-A-Game-for-Connoisseurs
A haunted trivia experience where players work together or fall apart
**Nous** is a social, experiential game played by a group acting as a single mind. Inspired by *Ouija*, *Barnum psychology*, and *personality tests*, it uses trivia not as a test of knowledge—but as a mirror. Every answer you give tells it something. About you. About your group. About what you’re hiding from yourselves.

Players think they’re playing a clever trivia game.  
But the game is really playing them.

---

## How It Works

- **Trivia Cards** test knowledge in categories of *Mind*, *Body*, and *Soul*. But each choice is scored in secret, revealing traits and tendencies.
- **Fate Cards** interpret these traits through *Divinations*, *Group Dynamics*, and eerie *Directions*—crafted to feel uncomfortably personal.
- **The Last Deck** delivers final questions, secret awards, and a group reading that feels… too accurate.

---

## About This Prototype

This version of **Nous** is a playable prototype, designed for internal playtesting, iteration, and demonstration purposes only.

All code, game systems, written content, and mechanics are authored by **Jake Spencer** and are the sole intellectual property of **Sparr Games**.  
Distribution, duplication, or derivative work without permission is strictly prohibited.

> *Nous is watching. Tread lightly.*

**NOUS** is a social, single-mind experience: three physical buttons, one shared will, and a deck that seems to _watch_.  
Inspired by **Ouija**, cold-reading psychology, and asymmetrical horror games, it uses trivia as camouflage — every answer quietly feeds a trait model that twists the night’s Fate.

---

##  The Night in Three Acts

| Phase | What Players See | What the Engine Does |
|-------|------------------|----------------------|
| **1 · Questions** | Mind / Body / Soul prompts, three answers (A · B · C) | Awards **Thread** & **Score**, updates hidden trait axes (X · Y · Z) |
| **2 · Fate** | A drawn **Fate Card** (Dynamic · Direction · Divination) with three ominous choices | Applies round-long effects or instant rewards / penalties |
| **3 · Last Deck** | Final questions and a group _Reading_ eerily tailored to the table | Combines trait totals + hidden flags to generate bespoke epilogue |

---

## Running the Prototype

```bash
# clone & install
git clone https://github.com/JakefromSparr/Nous.git
cd Nous
npm install      # installs dev server + linting

# start local hot-reload server
npm run dev
## Final Reminder

This is not a tool.  
This is an *experience.*  
Preserve the magic.


src/
  constants/
    answerLogic.js      # scoring & trait tables
    traitConfig.js      # axisWeight + overrides per question
    screens.js          # enum of 18 screens
    routes.js           # button→action→label map
  engine/
    questionEngine.js   # draws / scores questions
    fateEngine.js       # draws / resolves Fate
    traitEngine.js      # (WIP) threshold events
    lastEngine.js       # round flow helpers
  state.js              # single mutable store + patch()
  handleAction.js       # finite-state router
  ui.js                 # pure presentation
public/
  index.html            # three buttons + screens
