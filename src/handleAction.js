// src/handleAction.js
import { SCREENS }  from './constants/screens.js';
import { ROUTES }   from './constants/routes.js';
import { State }    from './state.js';
import { UI }       from './ui.js';

import * as Q     from './engine/questionEngine.js';
import * as Fate  from './engine/fateEngine.js';
import * as Last  from './engine/lastEngine.js';
import * as Trait from './engine/traitEngine.js';

/* ---------------------------------------------------------
   ACTION IMPLEMENTATIONS (real + stub)
--------------------------------------------------------- */
function noOp () { return {}; }

/* Navigation helpers */
function handleWelcomeSelect () {
  const choice = UI.getWelcomeSelection();
  if (choice === 'Play')     return { nextScreen: SCREENS.WAITING_ROOM };
  if (choice === 'Rules')    return { nextScreen: SCREENS.RULES };
  if (choice === 'Options')  return { nextScreen: SCREENS.OPTIONS };
  return {};
}

function confirmParticipants () {
  const count = UI.confirmParticipants();
  State.initializeGame(count);
  return { nextScreen: SCREENS.GAME_LOBBY };
}

/* Core gameplay helpers */
function startQuestion () {
  const q = Q.draw();
  if (!q) return {};                       // deck empty?
  return {
    nextScreen : SCREENS.QUESTION,
    statePatch : { currentQuestion: q }
  };
}

function answer (letter) {
  return Q.evaluate(letter);               // expects { nextScreen, statePatch }
}

function temptFate   () { return Fate.drawAndApply(); }
function endRound    () { return Last.resolveRound(); }
function chooseFate  (idx){ 
  const flavor = State.chooseFateOption(idx);
  UI.showFateResult(flavor);
  return { nextScreen: SCREENS.GAME_LOBBY };
}

/* --- SINGLE ACTION REGISTRY ------------------------------------------- */
const ACTIONS = {
  /* welcome & menu */
  'welcome-up'          : () => UI.moveWelcomeSelection('up'),
  'welcome-down'        : () => UI.moveWelcomeSelection('down'),
  'welcome-select'      : handleWelcomeSelect,
  'back-to-welcome'     : () => ({ nextScreen: SCREENS.WELCOME }),
  'go-options'          : () => ({ nextScreen: SCREENS.OPTIONS }),
  'options-down'        : () => UI.moveOptions?.('down') ?? {},
  'options-up'          : () => UI.moveOptions?.('up')   ?? {},
  'option-select'       : () => UI.selectOption?.()      ?? {},

  /* waiting room */
  'participants-up'     : () => UI.adjustParticipantCount(1),
  'participants-down'   : () => UI.adjustParticipantCount(-1),
  'participants-confirm': confirmParticipants,

  /* lobby / round */
  'turn-back'           : () => ({ nextScreen: SCREENS.WELCOME }), // tweak as needed
  'tempt-fate'          : temptFate,
  'next-round'          : () => { State.startNewRound(); return { nextScreen: SCREENS.ROUND_LOBBY }; },
  'end-round'           : endRound,
  'double-points'       : () => State.spendThreadToWeave() ? {} : {},

  /* question & answers */
  'start-question'      : startQuestion,
  'answer-a'            : () => answer('A'),
  'answer-b'            : () => answer('B'),
  'answer-c'            : () => answer('C'),

  /* fate-card choices */
  'fate-a'              : () => chooseFate(0),
  'fate-b'              : () => chooseFate(1),
  'fate-c'              : () => chooseFate(2),

  /* result resolution */
  'accept-result'       : () => ({ nextScreen: SCREENS.ROUND_LOBBY }),
  'challenge-result'    : noOp,   // TODO
  'plead-result'        : noOp,   // TODO

  /* meta */
  'restart-game'        : () => ({ nextScreen: SCREENS.WELCOME }),
  'quit-game'           : () => ({ nextScreen: SCREENS.CREDITS }),
  'save-reading'        : noOp,

  /* placeholder */
  'no-op'               : noOp
};

/* =========================================================
   CENTRAL ROUTER
========================================================= */
export function handleAction (btnId){
  const currentScreen = State.getState().currentScreen;
  const route         = ROUTES[currentScreen];

  if (!route){
    console.warn(`Unknown screen "${currentScreen}"`);
    return;
  }

  const actionName = route.btnMap[btnId];
  if (!actionName){
    console.warn(`No btn ${btnId} mapping on "${currentScreen}"`);
    return;
  }

  const fn = ACTIONS[actionName];
  if (!fn){
    console.warn(`Action "${actionName}" not implemented`);
    return;
  }

  const result = fn();             // might be {}, or { nextScreen, statePatch }
  applyResult(result);
}

/* =========================================================
   RESULT → STATE + UI
========================================================= */
function applyResult ({ nextScreen, statePatch } = {}){
  if (statePatch) State.patch(statePatch);

  /* change screen if needed */
  const target = nextScreen ?? State.getState().currentScreen;
  if (target !== State.getState().currentScreen){
    State.patch({ currentScreen: target });
    UI.updateScreen(target);
  }

  /* refresh labels */
  const labels = ROUTES[target].labels.map(l => typeof l === 'function' ? l() : l);
  UI.setButtonLabels(labels);

  /* refresh HUD / scores etc. */
  UI.updateDisplayValues(State.getState());
}
