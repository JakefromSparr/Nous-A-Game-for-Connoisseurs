# NOUS — A Game for Connoisseurs

A haunted, single-mind trivia game. The group shares three buttons, one Thread, and one final Reading.

[Play NOUS](https://nous-a-game-for-connoisseurs.vercel.app/)

## What runs in production

NOUS is a static browser app: HTML, CSS, and vanilla JavaScript. It has no backend, database, or Node server.

npm and Vite are development tools only. They install the two project dependencies, run tests, and turn the source into the static `dist/` folder that Vercel hosts.

## Run locally

```sh
npm install
npm run dev
```

## Verify a change

```sh
npm test
npm run build
```

## Project map

```text
index.html                 Screens and three-button controller
style.css                  Visual design and responsive layout

src/
  script.js                Browser entry point
  state.js                 State, save/load, and game initialization
  handleAction.js          Maps button presses to game actions
  ui.js                    DOM rendering
  validator.js             Saved-state validation
  constants/               Questions, Fate cards, routes, and written content
  engine/                  Question, Fate, round, trait, tutorial, and Reading rules

test/
  game.test.js             Core-loop regression tests

docs/
  game-design.md           Rules and design blueprint
  question-craft.md        Question-writing guide
  voice-design.md          Nous voice and haunting system
```

## Deployment

Vercel should use the standard Vite settings:

- Build command: `npm run build`
- Output directory: `dist`

No platform-specific application code is required.

## Rights

All code, game systems, written content, and mechanics are © Sparr Games LLC. Internal prototype for playtesting and demonstration only. No redistribution without permission.
