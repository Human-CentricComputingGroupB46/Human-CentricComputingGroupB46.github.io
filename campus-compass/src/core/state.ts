// ============================================================
// CampusCompass - Global State (pub/sub)
// ============================================================

import { AppState, StateKey, StateListener, FloorId, EntranceId, GraphNode } from './types';

const initialState: AppState = {
  currentFloor: 'floor1',
  currentEntrance: 'NW',
  inputRoomNumber: '',
  targetRoom: null,
  route: null,
  routeFloors: [],
  designMode: false,
  demoMode: false,
  message: null,
};

let state: AppState = { ...initialState };
const listeners: StateListener[] = [];

/** Get a readonly snapshot of current state */
export function getState(): Readonly<AppState> {
  return state;
}

/** Update one or more state fields and notify listeners */
export function setState(patch: Partial<AppState>): void {
  const changed: StateKey[] = [];
  for (const key of Object.keys(patch) as StateKey[]) {
    if (state[key] !== patch[key]) {
      (state as unknown as Record<string, unknown>)[key] = patch[key];
      changed.push(key);
    }
  }
  if (changed.length > 0) {
    for (const fn of listeners) {
      fn(state, changed);
    }
  }
}

/** Subscribe to state changes */
export function subscribe(fn: StateListener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// ---- Convenience actions ----

export function switchFloor(floor: FloorId): void {
  setState({ currentFloor: floor });
}

export function selectEntrance(entrance: EntranceId): void {
  setState({ currentEntrance: entrance, route: null, message: null });
}

export function inputDigit(digit: string): void {
  setState({ inputRoomNumber: state.inputRoomNumber + digit });
}

export function clearInput(): void {
  setState({ inputRoomNumber: '', targetRoom: null, route: null, message: null });
}

export function backspace(): void {
  setState({ inputRoomNumber: state.inputRoomNumber.slice(0, -1) });
}

export function setRoute(target: string, route: GraphNode[], floors: FloorId[]): void {
  setState({ targetRoom: target, route, routeFloors: floors, message: `Shortest route shown on the Google Maps base layer.` });
}

export function setError(msg: string): void {
  setState({ message: msg, route: null, targetRoom: null });
}

export function toggleDesignMode(): void {
  setState({ designMode: !state.designMode });
}

export function toggleDemoMode(): void {
  setState({ demoMode: !state.demoMode });
}
