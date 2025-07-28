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
    app?.classList.add('is-transitioning');

    // next frame for smoother CSS transitions
    requestAnimationFrame(() => {
      screens.forEach((s) => {
        const active = s.dataset.screen === name;
        s.classList.toggle('is-active', active);
        s.setAttribute('aria-hidden', String(!active));
      });

      app?.setAttribute('data-game-state', name);
      controller?.setAttribute('data-controller-state', name);
      if (agentLog) agentLog.textContent = `Last state: ${name}`;
      if (ariaStatus) ariaStatus.textContent = pretty(name);

      if (name === 'WELCOME') updateWelcomeHighlight();
      app?.classList.remove('is-transitioning');
    });
  }

  /* ───── Controller labels/disabled states ───── */
  function setButtonLabels(labels = ['', '', ''], isDisabled) {
    for (let i = 0; i < 3; i++) {
      const btn = buttons[i];
      if (!btn) continue;

      const span = btn.querySelector('.button-label') || btn;
      const txt = labels[i] ?? '';
      span.textContent = txt || ' ';

      const disabled = typeof isDisabled === 'function' ? !!isDisabled(i) : !txt;
      btn.disabled = disabled;
      btn.setAttribute('aria-disabled', String(disabled));
      btn.classList.toggle('disabled', disabled);
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
      const divTxt = $('divinations-text') || document.querySelector('#divinations-display p');
      if (divTxt) divTxt.textContent = titles.length ? titles.join(', ') : '[None]';
    }
  }

  function showQuestion(q, answers) {
    const title = q?.title || q?.category || '';
    const text  = q?.text  || q?.prompt   || '';
    const arr   = Array.isArray(answers) ? answers : [{ label: q?.choices?.A ?? '' }, { label: q?.choices?.B ?? '' }, { label: q?.choices?.C ?? '' }];

    $('question-title')?.textContent = title;
    $('question-text') ?.textContent = text;
    $('answer-a')      ?.textContent = arr[0]?.label ?? '';
    $('answer-b')      ?.textContent = arr[1]?.label ?? '';
    $('answer-c')      ?.textContent = arr[2]?.label ?? '';
  }

  function showFateCard(card) {
    $('fate-card-title')?.textContent = card?.title ?? '';
    $('fate-card-text') ?.textContent = card?.text  ?? '';
  }

  function showFateChoicesFromState(state) {
    $('fate-a-text')?.textContent = state?.fateChoices?.[0]?.label ?? 'NOUS';
    $('fate-b-text')?.textContent = state?.fateChoices?.[1]?.label ?? 'NOUS';
    $('fate-c-text')?.textContent = state?.fateChoices?.[2]?.label ?? 'NOUS';
  }

  function showResult(r) {
    let headerText = 'Wrong';
    if (r?.kind === 'TYPICAL') headerText = 'Not Wrong';
    if (r?.kind === 'REVELATORY') headerText = 'Correct';
    
    let outcomeMessage = `Thread ${r.threadDelta >= 0 ? '+' : ''}${r.threadDelta}.`;
    if (r.pointsGained > 0) {
      outcomeMessage += ` Score +${r.pointsGained}.`;
    }

    $('result-header')        ?.textContent = headerText;
    $('result-question')      ?.textContent = r?.questionText     ?? '';
    $('result-chosen-answer') ?.textContent = r?.chosenLabel      ?? '';
    $('result-explanation')   ?.textContent = r?.explanation  ?? '';
    $('result-outcome-message')?.textContent = outcomeMessage;
  }

  function showFailure(ptsLost) {
    $('lost-points-display')?.textContent = ptsLost ?? 0;
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

  return {
    setButtonLabels,
    updateScreen,
    updateDisplayValues,
    showQuestion,
    showFateCard,
    showFateChoicesFromState,
    showResult,
    showFailure,
    showFateResult,
    moveWelcomeSelection,
    getWelcomeSelection,
    showParticipantEntry,
    adjustParticipantCount,
    getParticipantCount: () => pCount,
    confirmParticipants,
  };
})();

if (typeof window !== 'undefined') window.UI = UI;
