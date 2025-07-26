## **AGENTS.md**

```markdown
# AGENTS.md — Working Notes for AI & Codex Assistants

## 🎯 Mission Summary

- **Nous** is a _narrative game engine_, **not** a utility.
- The illusion of sentience **must** be preserved.
- All logic flows through modular JS engines; UI is display-only.

---

## 🔑 Core Concepts (2025 build)

| Element             | Purpose                                             |
|---------------------|-----------------------------------------------------|
| **Question Deck**   | Mind / Body / Soul cards<br>Past / Present / Future tags |
| **Fate Deck**       | 3 sub-types:<br>• Dynamics (risk-reward)<br>• Directions (bounties)<br>• Divinations (trait-based revelations) |
| **Last Deck**       | Endgame prompts, secret awards, final Reading       |
| **Thread**          | Shared health / timer; runs out → _Thread Severed_  |
| **Traits (X Y Z)**  | Hidden axes updated each answer; drive Fate & Reading |

---

## 🧩 Module Responsibilities

| File | Owns | Never does |
|------|------|------------|
| `state.js` | single `gameState`, `patch()`, save / load | no gameplay math |
| `questionEngine.js` | draw / shuffle, score, apply trait deltas | DOM work |
| `fateEngine.js` | draw Fate, apply effects, resolve round | touch UI |
| `traitEngine.js` | fire threshold events (TODO) | scoring |
| `handleAction.js` | routes Button 1-3 per screen via `ROUTES` | store data |
| `ui.js` | show screens, swap labels, update HUD | decide actions |

---

## 📐 Coding Standards

1. Card data lives in JSON modules (`data/*.js`) — **never** hard-code.
2. Engines return `{ nextScreen, statePatch }`; router handles UI.
3. All new screens must be added to `constants/screens.js` **and** `routes.js`.
4. A CI run (`npm test`) must simulate a full playthrough without crashes.

---

## 🔍 Logging

Write a single bullet per tweak in `logs/improvements.md`:


---

## ☑ Validation Checklist

Automated tests must confirm:

- Game flows Welcome → Final Reading using only Buttons 1-3.
- Thread adjusts: **Wrong -1**, **Revelatory +1**, **Typical 0**.
- Divinations pull from top trait pair without repetition.
- Any missing card property falls back to safe placeholder text.
- `prefers-reduced-motion` disables transition wipe.

---

## 🛑 IP Notice

All assets © 2025 **Sparr Games**.  
Assistants may not suggest open-sourcing or derivative licensing unless explicitly instructed.

> _“This is not a tool. This is an experience. Protect the magic.”_


