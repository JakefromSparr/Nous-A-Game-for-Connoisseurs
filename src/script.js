// src/script.js
import { State } from './state.js';
import { handleAction, refreshUI } from './handleAction.js';
import { UI } from './ui.js';

function bindController() {
  const btn = (id) => document.getElementById(id);

  btn('btn0')?.addEventListener('click', () => handleAction(0));
  btn('btn1')?.addEventListener('click', () => handleAction(1));
  btn('btn2')?.addEventListener('click', () => handleAction(2));

  // Keyboard convenience (desktop): ↑ = up, ↓ = down, Enter/Space = select
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowup')   { handleAction(2); e.preventDefault(); }
    if (key === 'arrowdown') { handleAction(0); e.preventDefault(); }
    if (key === 'enter' || key === ' ') { handleAction(1); e.preventDefault(); }
  });
}

async function boot() {
  try {
    // Load save (if any) before drawing, then decks
    State.loadGame();
    await State.loadData?.();

    // First paint:
    // - set the correct screen’s DOM (for WELCOME this also draws the initial highlight)
    UI.updateScreen(State.getState().currentScreen);
    // - compute labels/disabled for the current screen
    refreshUI();

    bindController();
    window.addEventListener('beforeunload', () => State.saveGame?.());
  } catch (err) {
    console.error('[BOOT]', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
