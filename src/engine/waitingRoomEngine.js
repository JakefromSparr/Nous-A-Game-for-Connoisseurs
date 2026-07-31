import {
  WAITING_ROOM_PHASES,
  getWaitingRoomPhase,
} from '../constants/waitingRoom.js';
import { getObservedPresenceLine } from './grinEngine.js';

export function confirmGathering(gathered) {
  const gatheredCount = Math.max(1, Number(gathered) || 1);
  const observedCount = gatheredCount + 1;

  return {
    gatheredCount,
    observedCount,
    waitingRoomReceiptText: getObservedPresenceLine(gatheredCount),
    waitingRoomReceiptVisible: true,
    waitingRoomPhase: WAITING_ROOM_PHASES.OBSERVED,
  };
}

export function chooseTurnBack(state = {}) {
  const phase = getWaitingRoomPhase(state);

  if (phase === WAITING_ROOM_PHASES.OBSERVED) {
    return {
      waitingRoomReceiptText: '',
      waitingRoomReceiptVisible: false,
      waitingRoomPhase: WAITING_ROOM_PHASES.ENTRY,
    };
  }
  if (phase === WAITING_ROOM_PHASES.ACCEPT_REJECTED) {
    return { waitingRoomPhase: WAITING_ROOM_PHASES.RESOLVED_NO_USE };
  }
  return {};
}

export function chooseAccept(state = {}) {
  const phase = getWaitingRoomPhase(state);

  if (phase === WAITING_ROOM_PHASES.OBSERVED) {
    return { waitingRoomPhase: WAITING_ROOM_PHASES.ACCEPT_REJECTED };
  }
  if (phase === WAITING_ROOM_PHASES.ACCEPT_REJECTED) {
    return { waitingRoomPhase: WAITING_ROOM_PHASES.RESOLVED_NO_US };
  }
  return {};
}
