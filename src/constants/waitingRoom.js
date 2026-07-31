export const WAITING_ROOM_PHASES = Object.freeze({
  ENTRY: 'ENTRY',
  OBSERVED: 'OBSERVED',
  ACCEPT_REJECTED: 'ACCEPT_REJECTED',
  RESOLVED_NO_USE: 'RESOLVED_NO_USE',
  RESOLVED_NO_US: 'RESOLVED_NO_US',
});

export function getWaitingRoomPhase(state = {}) {
  return state.waitingRoomPhase || (
    state.waitingRoomReceiptVisible
      ? WAITING_ROOM_PHASES.OBSERVED
      : WAITING_ROOM_PHASES.ENTRY
  );
}

export function isWaitingRoomResolved(phase) {
  return [
    WAITING_ROOM_PHASES.RESOLVED_NO_USE,
    WAITING_ROOM_PHASES.RESOLVED_NO_US,
  ].includes(phase);
}

export function getWaitingRoomLabels(state = {}) {
  const phase = getWaitingRoomPhase(state);

  if (phase === WAITING_ROOM_PHASES.ENTRY) {
    return ['Less', 'Confirm', 'More'];
  }
  if (phase === WAITING_ROOM_PHASES.RESOLVED_NO_USE) {
    return ['No Use', 'Nous', 'Accept'];
  }
  if (phase === WAITING_ROOM_PHASES.RESOLVED_NO_US) {
    return ['Turn Back', 'Nous', 'No Us'];
  }
  return ['Turn Back', 'Nous', 'Accept'];
}
