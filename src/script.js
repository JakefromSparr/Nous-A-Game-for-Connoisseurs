// src/script.js
import { UI } from './ui.js';
import { State } from './state.js';
import { handleAction, refreshUI } from './handleAction.js'; // refreshUI is a 1-liner we add below
import { ROUTES, guardRoutes } from './constants/routes.js';
import { SCREENS } from './constants/screens.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Load decks, then try restoring save
  await State.loadData();
  State.loadGame?.();

  // 2) Guard routes once at boot
  guardRoutes(ROUTES);

  // 3) Ensure we’re on a valid screen (fallback to WELCOME)
  const s = State.getState();
  if (!ROUTES[s.currentScreen]) {
    State.patch({ currentScreen: SCREENS.WELCOME });
  }

  // 4) Initial render
  refreshUI();

  // 5) Controller events (0-based buttons)
  document.getElementById('controller')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-btn]');
    if (!btn) return;
    handleAction(parseInt(btn.dataset.btn, 10) || 0);
  });

  // 6) Persist on exit
  window.addEventListener('beforeunload', () => State.saveGame?.());
});
