# NOUS — A Game for Connoisseurs

A haunted, single‑mind trivia prototype built with **Vite** + vanilla JS.\
Three on‑screen (or physical) buttons. One shared will. The deck watches back.

---

## Quickstart

```bash
# 1) Clone
git clone https://github.com/JakefromSparr/Nous-A-Game-for-Connoisseurs.git
cd Nous-A-Game-for-Connoisseurs

# 2) Install
npm install

# 3) Run the local dev server
npm run dev
# then open the local URL printed by Vite
```

## Build & Deploy

- **Build:** `npm run build`
- **Preview build:** `npm run preview`
- **Netlify:** deploy from repo root. `vite.config.js` uses `base: './'` so asset paths work.
- **SPA redirect** (so deep links don’t 404):

```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200
```

---

## Project Layout

```text
.
├─ index.html                 # All UI screens + 3-button controller
├─ style.css                  # Theming and layout
├─ netlify.toml               # Deployment configuration
├─ vite.config.js             # Vite build configuration (base: './')
├─ src/
│  ├─ script.js               # App entry: loads data, binds controller, saves on unload
│  ├─ state.js                # Single state store, save/load, initialization
│  ├─ ui.js                   # Pure presentation (DOM updates only)
│  ├─ handleAction.js         # Central router (0-based buttons → actions)
│  ├─ validator.js            # Zod schemas (persisted <-> runtime Sets)
│  ├─ constants/
│  │  ├─ screens.js           # Canonical screen IDs
│  │  ├─ routes.js            # 3 labels + 3 actions per screen (null = taunt)
│  │  ├─ answerLogic.js       # OUTCOME / WEAVE tables
│  │  ├─ questionDeck.js      # Normalized JS deck (export default Question[])
│  │  └─ fateDeck.js          # Fate cards (export default FateCard[])
│  └─ engine/
│     ├─ questionEngine.js    # Draw/evaluate questions → lastOutcome for REVEAL
│     ├─ fateEngine.js        # Arm/apply fate choices; resolveRound modifiers
│     └─ roundEngine.js       # startRound / tieOff / sever / finalize(+fate)
└─ aboutNous.md               # Theme, philosophy, and detailed mechanics
```

---

## Controls

- Exactly **three buttons**, indexed **0, 1, 2** (`btn0`, `btn1`, `btn2`).
- Each screen defines **three labels and three actions** in `src/constants/routes.js`.
- A `null` action is a deliberate **taunt** (renders “NOUS”, disabled).

---

## Save / Load

- Game state auto‑saves to `localStorage["nous-save"]`.
- To reset: DevTools → **Application** → **Local Storage** → remove `nous-save`.

---

## Notes for Contributors

- **UI is dumb.** All logic routes through `handleAction.js` → engines → `State.patch()`.
- **Round start** is owned by `roundEngine.startRound()` (single source of truth).
- **Reveal screen** renders from `lastOutcome` produced by `questionEngine.evaluate()`.
- **Fate** math is applied at **FATE\_RESULT → Accept** via `fateEngine.resolveRound()` and `roundEngine.finalizeRound()`.

See **aboutNous.md** for the design blueprint (thread rules, weave, fate types, data formats).

---

## License / Rights

All code, game systems, written content, and mechanics are © **Sparr Games LLC**.\
Internal prototype for playtesting and demonstration only. No redistribution without permission.

---

## Final Reminder

This is not a tool.\
This is an *experience*.\
Preserve the magic.

