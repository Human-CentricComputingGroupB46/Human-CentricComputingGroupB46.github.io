import { create } from 'zustand';
import type { FloorId, EntranceId, GraphNode } from '../core/types';
import { MAX_RECENT_ROOMS } from '../core/constants';

export interface NavigationState {
  currentFloor: FloorId;
  currentEntrance: EntranceId;
  inputRoomNumber: string;
  targetRoom: string | null;
  route: GraphNode[] | null;
  routeFloors: FloorId[];
  message: string | null;
  recentRooms: string[];

  switchFloor: (f: FloorId) => void;
  selectEntrance: (e: EntranceId) => void;
  setInputRoomNumber: (value: string) => void;
  inputDigit: (d: string) => void;
  clearInput: () => void;
  backspace: () => void;
  setRoute: (target: string, route: GraphNode[], floors: FloorId[]) => void;
  setError: (msg: string) => void;
  addRecentRoom: (roomId: string) => void;
  resetInput: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentFloor: 'floor1',
  currentEntrance: 'NW',
  inputRoomNumber: '',
  targetRoom: null,
  route: null,
  routeFloors: [],
  message: null,
  recentRooms: [],

  switchFloor: (f) => set({ currentFloor: f }),

  selectEntrance: (e) => set({ currentEntrance: e, route: null, message: null }),

  setInputRoomNumber: (value) =>
    set({
      inputRoomNumber: value.replace(/\D/g, '').slice(0, 8),
      targetRoom: null,
      route: null,
      routeFloors: [],
      message: null,
    }),

  inputDigit: (d) =>
    set((s) => ({
      inputRoomNumber: `${s.inputRoomNumber}${d}`.slice(0, 8),
      targetRoom: null,
      route: null,
      routeFloors: [],
      message: null,
    })),

  clearInput: () =>
    set({ inputRoomNumber: '', targetRoom: null, route: null, message: null }),

  backspace: () =>
    set((s) => ({
      inputRoomNumber: s.inputRoomNumber.slice(0, -1),
      targetRoom: null,
      route: null,
      routeFloors: [],
      message: null,
    })),

  setRoute: (target, route, floors) =>
    set({
      targetRoom: target,
      route,
      routeFloors: floors,
      message: null,
    }),

  setError: (msg) => set({ message: msg, route: null, targetRoom: null }),

  addRecentRoom: (roomId) =>
    set((s) => {
      const next = s.recentRooms.filter((r) => r !== roomId);
      next.unshift(roomId);
      if (next.length > MAX_RECENT_ROOMS) next.length = MAX_RECENT_ROOMS;
      return { recentRooms: next };
    }),

  resetInput: () =>
    set({
      inputRoomNumber: '',
      targetRoom: null,
      route: null,
      routeFloors: [],
      message: null,
    }),
}));
