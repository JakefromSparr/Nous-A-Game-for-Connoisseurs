// src/ui.js
// Pure presentation layer – no game logic, no routing.

export const UI = (() => {
  /* ───── DOM refs ───── */
  const app        = document.getElementById('app-container');
  const controller = document.getElementById('controller');
  const ariaStatus = document.getElementById('aria-status');
  const agentLog   = document.getElementById('last-change');

  // 0-based controller buttons (ids must be btn0/btn1/btn2 in index.html)
  const buttons = [
    document.getElementById('btn0'),
    document.getElementById('btn1'),
    document.getElementById('btn2'),
  ];
  const screens = Array.from(document.querySelectorAll('.game-screen'));

  /* ───── Welcome list navigation ───── */
  const welcomeLis = Array.from(document.querySelectorAll('#welcome-options li'));
  let welcomeIdx = 0;

  const getWelcomeSelection = () =>
    (welcomeLis[welcomeIdx]?.textContent || '')
      .replace(/^\s*[^A-Za-z0-9]*/, '')
      .trim();

  const updateWelcomeHighlight = () => {
    welcomeLis.forEach((li, i) => li.classList.toggle('selected', i === welcomeIdx));
    if (ariaStatus) ariaStatus.textContent = getWelcomeSelection();
  };

  const moveWelcomeSelection = (dir) => {
    if (!welcomeLis.length) return;
    if (dir === 'up')   welcomeIdx = (welcomeIdx - 1 + welcomeLis.length) % welcomeLis.length;
    if (dir === 'down') welcomeIdx = (welcomeIdx + 1) % welcomeLis.length;
    updateWelcomeHighlight();
  };

  /* ───── Screen swap ───── */
  const pretty = (name) => String(name || '').replace(/_/g, ' ').toLowerCase();

  function updateScreen(name) {
    if (app) app.classList.add('is-transitioning');

    // next frame for smoother CSS transitions
    requestAnimationFrame(() => {
      screens.forEach((s) => {
        const active = s.dataset.screen === name;
        s.classList.toggle('is-active', active);
        s.setAttribute('aria-hidden', String(!active));
      });

      if (app) app.setAttribute('data-game-state', name);
      if (controller) controller.setAttribute('data-controller-state', name);
      if (agentLog) agentLog.textContent = `Last state: ${name}`;
      if (ariaStatus) ariaStatus.textContent = pretty(name);

      if (String(name).toLowerCase() === 'welcome') updateWelcomeHighlight();
      if (app) app.classList.remove('is-transitioning');
    });
  }

  /* ───── Controller labels/disabled states ─────
     - labels: array of 3 strings
     - isDisabled: optional fn(index)->boolean for per-button disabled logic
  */
  function setButtonLabels(labels = ['', '', ''], isDisabled) {
    for (let i = 0; i < 3; i++) {
      const btn = buttons[i];
      if (!btn) continue;

      const span = btn.querySelector('.button-label') || btn;
      const txt = labels[i] ?? '';
      span.textContent = txt || ' ';

      // A button is disabled if the isDisabled function says so, OR if it has no label.
      const disabled = typeof isDisabled === 'function' ? !!isDisabled(i) : !txt;
      btn.disabled = disabled;
      btn.setAttribute('aria-disabled', String(disabled));
      btn.classList.toggle('disabled', disabled);
      // Hide only if no label at all (keeps layout stable when disabled)
      btn.classList.toggle('hidden', !txt);
    }
  }

  /* ───── HUD / Question / Fate rendering ───── */
  const $ = (id) => document.getElementById(id);

  function updateDisplayValues(data) {
    const updateText = (id, value) => {
      const el = $(id);
      if (el) el.textContent = value;
    };

    if ('lives' in data) updateText('lives-display', data.lives);
    if ('roundsToWin' in data && 'roundsWon' in data) updateText('rounds-display', data.roundsToWin - data.roundsWon);
    if ('score' in data) updateText('score-display', data.score);
    if ('thread' in data) updateText('thread-display', data.thread);
    if ('roundScore' in data) updateText('round-score', data.roundScore);
    if ('roundNumber' in data) updateText('round-number-display', data.roundNumber);
    if ('currentCategory' in data) updateText('category-hint', data.currentCategory || '[Faded Ink]');
    if ('activeRoundEffects' in data && Array.isArray(data.activeRoundEffects)) {
  const titles = data.activeRoundEffects.map((e) => e.cardTitle).filter(Boolean);
  const text = titles.length ? titles.join(', ') : '[None]';
  const lobby = document.getElementById('divinations-text');
  if (lobby) lobby.textContent = text;
  const round = document.getElementById('divinations-text-round');
  if (round) round.textContent = text;
}
  }
  
  // Flexible: works with (q,answers[]) OR legacy q.choices.{A,B,C}
  function showQuestion(q, answers) {
    const title = q?.title || q?.category || '';
    const text  = q?.text  || q?.prompt   || '';
    const arr   = Array.isArray(answers)
      ? answers
      : [
          { label: q?.choices?.A ?? '' },
          { label: q?.choices?.B ?? '' },
          { label: q?.choices?.C ?? '' },
        ];

    const t1 = $('question-title'); if (t1) t1.textContent = title;
    const t2 = $('question-text');  if (t2) t2.textContent = text;
    const aA = $('answer-a');       if (aA) aA.textContent = arr[0]?.label ?? '';
    const aB = $('answer-b');       if (aB) aB.textContent = arr[1]?.label ?? '';
    const aC = $('answer-c');       if (aC) aC.textContent = arr[2]?.label ?? '';
  }

  function showFateCard(card) {
    const f1 = $('fate-card-title'); if (f1) f1.textContent = card?.title ?? '';
    const f2 = $('fate-card-text');  if (f2) f2.textContent = card?.text  ?? '';
  }

  // For on-screen text (controller labels come from ROUTES via setButtonLabels)
  function showFateChoicesFromState(state) {
    const eA = $('fate-a-text'); if (eA) eA.textContent = state?.fateChoices?.[0]?.label ?? 'NOUS';
    const eB = $('fate-b-text'); if (eB) eB.textContent = state?.fateChoices?.[1]?.label ?? 'NOUS';
    const eC = $('fate-c-text'); if (eC) eC.textContent = state?.fateChoices?.[2]?.label ?? 'NOUS';
  }

  function showResult(r) {
    let headerText = 'Wrong';
    if (r?.kind === 'TYPICAL') headerText = 'Not Wrong';
    if (r?.kind === 'REVELATORY') headerText = 'Correct';

    let outcomeMessage = `Thread ${r.threadDelta >= 0 ? '+' : ''}${r.threadDelta}.`;
    if (r.pointsGained > 0) outcomeMessage += ` Score +${r.pointsGained}.`;

    const h  = $('result-header');          if (h)  h.textContent  = headerText;
    const q1 = $('result-question');        if (q1) q1.textContent = r?.questionText ?? '';
    const a  = $('result-chosen-answer');   if (a)  a.textContent  = r?.chosenLabel  ?? '';
    const ex = $('result-explanation');     if (ex) ex.textContent = r?.explanation  ?? '';
    const om = $('result-outcome-message'); if (om) om.textContent = outcomeMessage;
  }

  function showFailure(ptsLost) {
    const el = $('lost-points-display');
    if (el) el.textContent = ptsLost ?? 0;
  }

  function showFateResult(text) {
    const el = $('divination-outcome');
    if (el) el.textContent = text ?? '';
  }

  /* ───── Participants mini‑view ───── */
  const countDisp = $('participant-count-display');
  const flavor    = $('participant-flavor');
  let   pCount    = 1;

  const updatePDisp = () => { if (countDisp) countDisp.textContent = pCount; };
  const adjustParticipantCount = (d) => { pCount = Math.max(1, Math.min(20, pCount + d)); updatePDisp(); };
  const confirmParticipants = () => {
    if (flavor) {
      flavor.textContent = `Strange... it looks like there are ${pCount + 1} of you here. Ah well.`;
      flavor.hidden = false;
    }
    return pCount;
  };
  const showParticipantEntry = () => {
    pCount = 1; if (flavor) flavor.hidden = true; updatePDisp(); updateScreen('WAITING_ROOM');
  };

  /* ───── Coach overlay (render-only; tutorialEngine owns the script) ───── */
  let _lastCoachArgs = null;

  // Patched: reveal overlay for measurement, then position on next frame.
  function showCoach(args = {}) {
    _lastCoachArgs = args;
    const { text, anchor, placement = 'right' } = args;

    const overlay = document.getElementById('coach-overlay');
    const callout = document.getElementById('coach-callout');
    const content = document.getElementById('coach-text');
    if (!overlay || !callout || !content) return;

    content.textContent = text || '';

    // Make overlay participate in layout so offsetWidth/Height are real
    overlay.hidden = false;
    const prevVis = callout.style.visibility;
    callout.style.visibility = 'hidden';

    // Highlight target for focus ring
    if (anchor && anchor.getBoundingClientRect) {
      anchor.classList.add('coach-highlight');
    }

    requestAnimationFrame(() => {
      const vpW = window.innerWidth, vpH = window.innerHeight;
      let top = vpH * 0.5 - callout.offsetHeight * 0.5;
      let left = vpW * 0.5 - callout.offsetWidth * 0.5;

      if (anchor && anchor.getBoundingClientRect) {
        const r = anchor.getBoundingClientRect();
        const pad = 12;
        switch (placement) {
          case 'left':
            top  = Math.max(16, r.top + window.scrollY);
            left = Math.max(16, r.left + window.scrollX - callout.offsetWidth - pad);
            break;
          case 'bottom':
            top  = r.bottom + window.scrollY + pad;
            left = Math.max(16, r.left + window.scrollX);
            break;
          case 'top':
            top  = Math.max(16, r.top + window.scrollY - callout.offsetHeight - pad);
            left = Math.max(16, r.left + window.scrollX);
            break;
          case 'right':
          default:
            top  = Math.max(16, r.top + window.scrollY);
            left = r.right + window.scrollX + pad;
            break;
        }
      }

      callout.style.top = `${top}px`;
      callout.style.left = `${left}px`;
      callout.style.visibility = prevVis || 'visible';
    });
  }

  function hideCoach({ clearAnchor = true } = {}) {
    _lastCoachArgs = null;
    const overlay = document.getElementById('coach-overlay');
    if (overlay) overlay.hidden = true;
    if (clearAnchor) {
      document.querySelectorAll('.coach-highlight')
        .forEach(el => el.classList.remove('coach-highlight'));
    }
  }

  /** Allow tutorialEngine to hook UI buttons */
  function bindCoachHandlers({ onNext, onSkip } = {}) {
    const next = document.getElementById('coach-next');
    const skip = document.getElementById('coach-skip');
    if (next) next.onclick = (e) => { e.preventDefault(); onNext && onNext(); };
    if (skip) skip.onclick = (e) => { e.preventDefault(); onSkip && onSkip(); };
  }

  // Keep the callout aligned on resize/orientation changes
  window.addEventListener('resize', () => {
    const overlay = document.getElementById('coach-overlay');
    if (!overlay || overlay.hidden || !_lastCoachArgs) return;
    showCoach(_lastCoachArgs);
  });

  return {
    /* router hooks */
    setButtonLabels,
    updateScreen,
    updateDisplayValues,

    /* rendering helpers */
    showQuestion,
    showFateCard,
    showFateChoicesFromState,
    showResult,
    showFailure,
    showFateResult,

    /* welcome nav */
    moveWelcomeSelection,
    getWelcomeSelection,

    /* participant dialog */
    showParticipantEntry,
    adjustParticipantCount,
    getParticipantCount: () => pCount,
    confirmParticipants,

    /* coach overlay (controlled by tutorialEngine) */
    showCoach,
    hideCoach,
    bindCoachHandlers,
  };
})();

if (typeof window !== 'undefined') window.UI = UI;
