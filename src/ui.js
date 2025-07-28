// src/ui.js
// Pure presentation layer – no game logic, no routing.
import { State } from './state.js';

export const UI = (() => {
  /* ─────────────── DOM refs ─────────────── */
  const app         = document.getElementById('app-container');
  const controller  = document.getElementById('controller');
  const ariaStatus  = document.getElementById('aria-status');
  const agentLog    = document.getElementById('last-change');

  const buttons = [
    document.getElementById('btn0'),
    document.getElementById('btn1'),
    document.getElementById('btn2')
  ];
  const screens = document.querySelectorAll('.game-screen');

  /* welcome-screen list navigation ------------------------------ */
  const welcomeLis  = Array.from(document.querySelectorAll('#welcome-options li'));
  let   welcomeIdx  = 0;
  const updateWelcomeHighlight = () => {
    welcomeLis.forEach((li,i)=>li.classList.toggle('selected', i===welcomeIdx));
    ariaStatus.textContent = getWelcomeSelection();
  };
  const moveWelcomeSelection = dir=>{
    if (dir==='up'  ) welcomeIdx=(welcomeIdx-1 + welcomeLis.length)%welcomeLis.length;
    if (dir==='down') welcomeIdx=(welcomeIdx+1)%welcomeLis.length;
    updateWelcomeHighlight();
  };
  const getWelcomeSelection   = ()=>
    welcomeLis[welcomeIdx]?.textContent.replace(/^\s*[^A-Za-z0-9]*/, '').trim() || '';

  /* screen swap ------------------------------------------------- */
  function updateScreen(name){
    app.classList.add('is-transitioning');

    setTimeout(()=>{
      screens.forEach(s=>{
        s.classList.toggle('is-active', s.dataset.screen===name);
        s.setAttribute('aria-hidden', s.dataset.screen!==name);
      });

      app.setAttribute       ('data-game-state',      name);
      controller.setAttribute('data-controller-state',name);
      agentLog.textContent   = `Last state: ${name}`;
      ariaStatus.textContent = name.replace(/-/g,' ');

      if (name==='WELCOME') updateWelcomeHighlight();
      app.classList.remove('is-transitioning');
    }, 700);
  }

  /* button-label swap ------------------------------------------- */
  function setButtonLabels([l1='',l2='',l3='']){
    [l1,l2,l3].forEach((txt,i)=>{
      const btn   = buttons[i];
      const span  = btn.querySelector('.button-label');
      span.textContent = txt || ' ';
      btn.disabled     = !txt;
      btn.classList.toggle('hidden', !txt);
    });
  }

  /* HUD / Question / Fate rendering ----------------------------- */
  const ids = sel=>document.getElementById(sel);

  function updateDisplayValues(data){
    if ('lives'        in data) ids('lives-display')      .textContent=data.lives;
    if ('roundsToWin'  in data && 'roundsWon' in data){
      ids('rounds-display').textContent=data.roundsToWin-data.roundsWon;
    }
    if ('score'        in data) ids('score-display')      .textContent=data.score;
    if ('thread'       in data) ids('thread-display')     .textContent=data.thread;
    if ('roundScore'   in data) ids('round-score')        .textContent=data.roundScore;
    if ('roundNumber'  in data) ids('round-number-display').textContent=data.roundNumber;
    if ('currentCategory' in data) ids('category-hint')   .textContent=data.currentCategory;
    if ('activeRoundEffects' in data){
      const titles=data.activeRoundEffects.map(e=>e.cardTitle).filter(Boolean);
      ids('divinations-display').querySelector('p').textContent=titles.length?titles.join(', '):'[None]';
    }
  }

  function showQuestion(q){
    ids('question-title').textContent=q.title||'';
    ids('question-text' ).textContent=q.text ||'';
    ids('answer-a').textContent=q.choices?.A||'';
    ids('answer-b').textContent=q.choices?.B||'';
    ids('answer-c').textContent=q.choices?.C||'';
    const labels = (State.getState().currentAnswers||[]).map(a=>a.label);
    while(labels.length<3) labels.push('');
    setButtonLabels(labels);
  }

  function showFateCard(card){
    ids('fate-card-title').textContent=card.title;
    ids('fate-card-text' ).textContent=card.text;
  }

  function showFateChoices(){
    const choices = State.getState().fateChoices || [];
    const labels = [0,1,2].map(i => {
      const c = choices[i];
      if (c === null) return '';
      return c?.label ?? 'NOUS';
    });
    setButtonLabels(labels);
  }

  function showResult(r){
    ids('result-header'        ).textContent=r.correct?'Correct':'Incorrect';
    ids('result-question'      ).textContent=r.question;
    ids('result-chosen-answer' ).textContent=r.answer;
    ids('result-explanation'   ).textContent=r.explanation;
    ids('result-outcome-message').textContent=r.outcomeText;
    setButtonLabels(['Fight Fate','', 'Accept Fate']);
  }

  function showFailure(ptsLost){
    ids('lost-points-display').textContent=ptsLost;
  }

  function showFateResult(txt){
    if (txt){ console.log('[FATE RESULT]',txt); }
    setButtonLabels(['Fight Fate','', 'Accept Fate']);
  }

  /* participant mini-view --------------------------------------- */
  const countDisp = ids('participant-count-display');
  const flavor    = ids('participant-flavor');
  let   pCount    = 1;
  const updatePDisp       = ()=>{ countDisp.textContent=pCount; };
  const showParticipantEntry=()=>{
    pCount=1; flavor.hidden=true; updatePDisp(); updateScreen('participants');
  };
  const adjustParticipantCount=(d)=>{ pCount=Math.max(1,Math.min(20,pCount+d)); updatePDisp(); };
  const confirmParticipants =()=>{
    flavor.textContent=`Strange... it looks like there are ${pCount+1} of you here. Ah well.`;
    flavor.hidden=false; return pCount;
  };

  return {
    /* router hooks */
    setButtonLabels,
    updateScreen,
    updateDisplayValues,

    /* rendering helpers */
    showQuestion, showFateCard, showFateChoices,
    showResult,   showFailure,  showFateResult,

    /* welcome nav */
    moveWelcomeSelection:dir=>moveWelcomeSelection(dir),
    getWelcomeSelection,

    /* participant dialog */
    showParticipantEntry,
    adjustParticipantCount,
    getParticipantCount:()=>pCount,
    confirmParticipants
  };
})();

if (typeof window!=='undefined') window.UI = UI;
