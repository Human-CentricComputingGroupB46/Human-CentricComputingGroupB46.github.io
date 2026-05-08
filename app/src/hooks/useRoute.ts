import { useCallback } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { useAllFloorData } from './useFloorData';
import { findRoute, isValidRoom, getRoomFloor } from '../core/graph';
import { ROOM_PREFIX } from '../core/constants';

export function useRoute(): () => void {
  const floors = useAllFloorData();
  const currentEntrance = useNavigationStore((s) => s.currentEntrance);
  const inputRoomNumber = useNavigationStore((s) => s.inputRoomNumber);
  const currentFloor = useNavigationStore((s) => s.currentFloor);
  const setRoute = useNavigationStore((s) => s.setRoute);
  const setError = useNavigationStore((s) => s.setError);
  const switchFloor = useNavigationStore((s) => s.switchFloor);
  const addRecentRoom = useNavigationStore((s) => s.addRecentRoom);

  return useCallback(() => {
    const digits = inputRoomNumber.trim();
    if (!digits) {
      setError('Please enter a room number.');
      return;
    }

    if (!isValidRoom(digits, floors)) {
      setError(`Room ${ROOM_PREFIX}${digits} not found.`);
      return;
    }

    const roomId = digits.startsWith(ROOM_PREFIX) ? digits : `${ROOM_PREFIX}${digits}`;
    const result = findRoute(currentEntrance, roomId, floors);

    if (!result) {
      setError(`No route available to ${roomId}.`);
      return;
    }

    const targetFloor = getRoomFloor(roomId, floors);
    if (targetFloor && targetFloor !== currentFloor) {
      switchFloor(targetFloor);
    }

    addRecentRoom(roomId);
    setRoute(roomId, result.path, result.floors);
  }, [
    floors, currentEntrance, inputRoomNumber, currentFloor,
    setRoute, setError, switchFloor, addRecentRoom,
  ]);
}
