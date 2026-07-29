# Working notes for coding assistants

NOUS is a narrative game, not a utility. Preserve the illusion that the deck watches and remembers.

## Architecture

- `src/state.js` owns the single game state and persistence.
- `src/handleAction.js` coordinates player actions and navigation.
- Files in `src/engine/` own game rules and do not manipulate the DOM.
- `src/ui.js` renders state and does not decide game outcomes.
- Card and narrative content lives in `src/constants/`.

Every screen must have the same identifier in `src/constants/screens.js`, `src/constants/routes.js`, and `index.html`.

## Change rules

- Keep the app framework-free unless a concrete requirement justifies otherwise.
- Preserve the three-button interaction model.
- Keep game state serializable and update `src/validator.js` when persisted state changes.
- Treat question and Fate card content as authored game material, not disposable fixtures.
- Run `npm test` and `npm run build` before handing off changes.

## Rights

All assets and game material are © Sparr Games LLC. Do not suggest open-sourcing or derivative licensing unless explicitly requested.
