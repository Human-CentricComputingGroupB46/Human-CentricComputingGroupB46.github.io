import { useEffect, useRef } from 'react';
import { useDesignStore } from '../store/designStore';
import { useNavigationStore } from '../store/navigationStore';
import { useAllFloorData } from './useFloorData';
import { findRoute, getRoomFloor } from '../core/graph';
import { ROOM_PREFIX } from '../core/constants';
import type { EntranceId } from '../core/types';

interface DemoEntry {
  entrance: EntranceId;
  roomNum: string; // digits only, e.g. "104"
}

const DEMO_SEQUENCE: DemoEntry[] = [
  { entrance: 'NW', roomNum: '104' },
  { entrance: 'NE', roomNum: '161' },
  { entrance: 'SW', roomNum: '109' },
  { entrance: 'NW', roomNum: '131' },
  { entrance: 'NE', roomNum: '237' },
  { entrance: 'SW', roomNum: '282' },
  { entrance: 'NW', roomNum: '155' },
  { entrance: 'NE', roomNum: '211' },
  { entrance: 'SW', roomNum: '261' },
];

const CYCLE_MS = 6_000;

export function useDemoMode() {
  const demoMode = useDesignStore((s) => s.demoMode);
  const toggleDemo = useDesignStore((s) => s.toggleDemo);
  const floors = useAllFloorData();
  const selectEntrance = useNavigationStore((s) => s.selectEntrance);
  const setRoute = useNavigationStore((s) => s.setRoute);
  const setError = useNavigationStore((s) => s.setError);
  const switchFloor = useNavigationStore((s) => s.switchFloor);
  const addRecentRoom = useNavigationStore((s) => s.addRecentRoom);
  const clearInput = useNavigationStore((s) => s.clearInput);
  const inputDigit = useNavigationStore((s) => s.inputDigit);
  const currentFloor = useNavigationStore((s) => s.currentFloor);

  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!demoMode) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    const runDemoStep = () => {
      const entry = DEMO_SEQUENCE[indexRef.current % DEMO_SEQUENCE.length];
      if (!entry) return;
      indexRef.current = (indexRef.current + 1) % DEMO_SEQUENCE.length;

      // Clear previous state
      clearInput();

      // Select entrance
      selectEntrance(entry.entrance);

      // Type room number digit by digit (since inputDigit adds one char at a time)
      for (const ch of entry.roomNum) {
        inputDigit(ch);
      }

      // Compute route
      const roomId = `${ROOM_PREFIX}${entry.roomNum}`;
      const result = findRoute(entry.entrance, roomId, floors);

      if (result) {
        const targetFloor = getRoomFloor(roomId, floors);
        if (targetFloor && targetFloor !== currentFloor) {
          switchFloor(targetFloor);
        }
        addRecentRoom(roomId);
        setRoute(roomId, result.path, result.floors);
      } else {
        setError(`Demo: No route to ${roomId}`);
      }
    };

    // Run initial step immediately
    runDemoStep();

    // Then cycle
    timerRef.current = setInterval(runDemoStep, CYCLE_MS);

    // Timeout to auto-exit demo after 90 seconds (~15 cycles)
    const exitTimer = setTimeout(() => {
      toggleDemo();
    }, 90_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(exitTimer);
    };
  }, [
    demoMode,
    toggleDemo,
    floors,
    selectEntrance,
    setRoute,
    setError,
    switchFloor,
    addRecentRoom,
    clearInput,
    inputDigit,
    currentFloor,
  ]);
}
