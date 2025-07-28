// src/constants/screens.js
export const SCREENS = Object.freeze({
  WELCOME        : 'WELCOME',
  WAITING_ROOM   : 'WAITING_ROOM',
  RULES          : 'RULES',
  OPTIONS        : 'OPTIONS',
  GAME_LOBBY     : 'GAME_LOBBY',
  ROUND_LOBBY    : 'ROUND_LOBBY',
  QUESTION       : 'QUESTION',
  REVEAL         : 'REVEAL',
  FATE           : 'FATE',
  FATE_RESULT    : 'FATE_RESULT',
  THREAD_SEVERED : 'THREAD_SEVERED',
  FINAL_READING  : 'FINAL_READING',
  CREDITS        : 'CREDITS',
});

// If you want to keep experimental screens around, park them here for later:
// export const FUTURE_SCREENS = Object.freeze({
//   LAST_DECK:'LAST_DECK', FINAL_QUESTION:'FINAL_QUESTION', FINAL_RESULT:'FINAL_RESULT',
//   GAME_OVER:'GAME_OVER', RESULTS:'RESULTS',
// });

export const ALL_SCREENS = Object.freeze(Object.values(SCREENS));
