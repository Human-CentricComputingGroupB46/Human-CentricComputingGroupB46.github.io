import { useCallback } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { useAllFloorData } from './useFloorData';
import { findRoute, isValidRoom, getRoomFloor } from '../core/graph';
import { ROOM_PREFIX } from '../core/constants';

export type RouteHandler = (roomCode?: string) => void;

const RESTRICTED_ROOM_IDS = new Set(['EB155', 'EB157', 'EB159', 'EB161']);
const DEFAULT_ROOM_NUMBER = '249';

export function useRoute(): RouteHandler {
  const floors = useAllFloorData();
  const currentEntrance = useNavigationStore((s) => s.currentEntrance);
  const inputRoomNumber = useNavigationStore((s) => s.inputRoomNumber);
  const currentFloor = useNavigationStore((s) => s.currentFloor);
  const setInputRoomNumber = useNavigationStore((s) => s.setInputRoomNumber);
  const setRoute = useNavigationStore((s) => s.setRoute);
  const setError = useNavigationStore((s) => s.setError);
  const switchFloor = useNavigationStore((s) => s.switchFloor);
  const addRecentRoom = useNavigationStore((s) => s.addRecentRoom);

  return useCallback((roomCode?: string) => {
    const rawRoomCode = (roomCode ?? inputRoomNumber).trim().toUpperCase();
    const roomNumber = rawRoomCode.startsWith(ROOM_PREFIX)
      ? rawRoomCode.slice(ROOM_PREFIX.length)
      : rawRoomCode || DEFAULT_ROOM_NUMBER;
    if (!rawRoomCode) {
      setInputRoomNumber(DEFAULT_ROOM_NUMBER);
    }
    const roomId = `${ROOM_PREFIX}${roomNumber}`;

    if (!roomNumber) {
      setError('Please enter a room number.');
      return;
    }

    if (!isValidRoom(roomId, floors)) {
      setError(`Room ${roomId} not found.`);
      return;
    }

    const result = findRoute(currentEntrance, roomId, floors);

    if (!result) {
      if (RESTRICTED_ROOM_IDS.has(roomId)) {
        setError(`You do not have permission to enter ${roomId}. Please try another room.`);
        return;
      }

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
    setInputRoomNumber, setRoute, setError, switchFloor, addRecentRoom,
  ]);
}
