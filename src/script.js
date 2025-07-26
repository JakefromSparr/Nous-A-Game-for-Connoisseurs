import { UI } from './ui.js';
import { State } from './state.js';
import { handleAction } from './handleAction.js';

document.addEventListener('DOMContentLoaded', async () => {
  await State.loadData();
  UI.initialize();

  document
    .getElementById('controller')
    .addEventListener('click', (e) => {
      const btn = e.target.closest('[data-btn]');
      if (btn) handleAction(parseInt(btn.dataset.btn, 10));
    });

  window.addEventListener('beforeunload', State.saveGame);
});

