// src/script.js
import { UI } from './ui.js';
import { State } from './state.js';
import { handleAction, refreshUI } from './handleAction.js';
import { ROUTES, guardRoutes } from './constants/routes.js';
import { SCREENS } from './constants/screens.js';

// On load, support ?reset=1 or #reset to clear save
if (location.search.includes('reset=1') || location.hash.includes('reset')) {
  localStorage.removeItem('nous-save');
}
// Shift+R on Welcome to clear save and reload
window.addEventListener('keydown', (e) => {
  if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
    const s = window.State?.getState?.();
    if (s?.currentScreen === 'WELCOME') {
      localStorage.removeItem('nous-save');
      location.reload();
    }
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Load decks from JSON files, then try restoring a saved game state.
  await State.loadData();
  State.loadGame?.();

  // 2) Guard routes once at boot to ensure state transitions are valid.
  guardRoutes(ROUTES);

  // 3) Ensure we’re on a valid screen; otherwise, fall back to the WELCOME screen.
  const s = State.getState();
  if (!ROUTES[s.currentScreen]) {
    State.patch({ currentScreen: SCREENS.WELCOME });
  }

  // 4) Perform the initial UI render based on the current state.
  refreshUI();

  // 5) Set up the main controller event listener for user actions.
  // It delegates clicks on buttons with a `data-btn` attribute.
  document.getElementById('controller')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-btn]');
    if (!btn) return; // Ignore clicks that are not on a button
    
    // Pass the button's index (0, 1, or 2) to the handler.
    handleAction(parseInt(btn.dataset.btn, 10) || 0);
  });

  // 6) Persist the game state to localStorage when the user leaves.
  window.addEventListener('beforeunload', () => State.saveGame?.());
});
