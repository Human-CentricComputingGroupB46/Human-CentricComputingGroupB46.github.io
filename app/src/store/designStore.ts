import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FloorId, EntranceId, Point } from '../core/types';

export interface RoomOverride {
  position?: Point;
  width?: number;
  height?: number;
}

export interface EntranceOverride {
  position?: Point;
}

export interface CorridorOverride {
  path?: Point[];
}

export interface FloorOverrides {
  rooms: Record<string, RoomOverride>;
  entrances: Partial<Record<EntranceId, EntranceOverride>>;
  corridors: Record<string, CorridorOverride>;
}

type OverridesByFloor = Record<FloorId, FloorOverrides>;

const emptyOverrides = (): OverridesByFloor => ({
  floor1: { rooms: {}, entrances: {}, corridors: {} },
  floor2: { rooms: {}, entrances: {}, corridors: {} },
});

const MAX_HISTORY = 50;

/** Deep-clone the overrides snapshot for history */
function cloneOverrides(o: OverridesByFloor): OverridesByFloor {
  return JSON.parse(JSON.stringify(o)) as OverridesByFloor;
}

export interface DesignState {
  designMode: boolean;
  demoMode: boolean;
  selectedNodeId: string | null;
  overrides: OverridesByFloor;
  showFloorImage: boolean;

  // Undo / Redo
  history: OverridesByFloor[];
  historyIndex: number;

  toggleDesign: () => void;
  toggleDemo: () => void;
  toggleFloorImage: () => void;
  selectNode: (id: string | null) => void;
  patchRoom: (floor: FloorId, id: string, patch: RoomOverride) => void;
  patchEntrance: (floor: FloorId, id: EntranceId, patch: EntranceOverride) => void;
  patchCorridor: (floor: FloorId, id: string, patch: CorridorOverride) => void;
  undo: () => void;
  redo: () => void;
  resetFloor: (floor: FloorId) => void;
  resetAll: () => void;
  importFloor: (floor: FloorId, payload: FloorOverrides) => void;
}

/** Push current overrides onto history stack before a mutation, truncating any redo tail. */
function pushHistory(state: DesignState): {
  history: OverridesByFloor[];
  historyIndex: number;
} {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(cloneOverrides(state.overrides));
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  return { history: newHistory, historyIndex: newHistory.length - 1 };
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set) => ({
      designMode: false,
      demoMode: false,
      selectedNodeId: null,
      overrides: emptyOverrides(),
      showFloorImage: true,
      history: [emptyOverrides()],
      historyIndex: 0,

      toggleDesign: () =>
        set((s) => ({ designMode: !s.designMode, selectedNodeId: null })),

      toggleDemo: () => set((s) => ({ demoMode: !s.demoMode })),

      toggleFloorImage: () => set((s) => ({ showFloorImage: !s.showFloorImage })),

      selectNode: (id) => set({ selectedNodeId: id }),

      patchRoom: (floor, id, patch) =>
        set((s) => {
          const { history, historyIndex } = pushHistory(s);
          const floorOverride = s.overrides[floor];
          const prev = floorOverride.rooms[id] ?? {};
          return {
            history,
            historyIndex,
            overrides: {
              ...s.overrides,
              [floor]: {
                ...floorOverride,
                rooms: { ...floorOverride.rooms, [id]: { ...prev, ...patch } },
              },
            },
          };
        }),

      patchEntrance: (floor, id, patch) =>
        set((s) => {
          const { history, historyIndex } = pushHistory(s);
          const floorOverride = s.overrides[floor];
          const prev = floorOverride.entrances[id] ?? {};
          return {
            history,
            historyIndex,
            overrides: {
              ...s.overrides,
              [floor]: {
                ...floorOverride,
                entrances: { ...floorOverride.entrances, [id]: { ...prev, ...patch } },
              },
            },
          };
        }),

      patchCorridor: (floor, id, patch) =>
        set((s) => {
          const { history, historyIndex } = pushHistory(s);
          const floorOverride = s.overrides[floor];
          const prev = floorOverride.corridors[id] ?? {};
          return {
            history,
            historyIndex,
            overrides: {
              ...s.overrides,
              [floor]: {
                ...floorOverride,
                corridors: { ...floorOverride.corridors, [id]: { ...prev, ...patch } },
              },
            },
          };
        }),

      undo: () =>
        set((s) => {
          if (s.historyIndex <= 0) return s;
          const newIndex = s.historyIndex - 1;
          return {
            historyIndex: newIndex,
            overrides: cloneOverrides(s.history[newIndex]!),
          };
        }),

      redo: () =>
        set((s) => {
          if (s.historyIndex >= s.history.length - 1) return s;
          const newIndex = s.historyIndex + 1;
          return {
            historyIndex: newIndex,
            overrides: cloneOverrides(s.history[newIndex]!),
          };
        }),

      resetFloor: (floor) =>
        set((s) => {
          const { history, historyIndex } = pushHistory(s);
          return {
            history,
            historyIndex,
            overrides: { ...s.overrides, [floor]: { rooms: {}, entrances: {}, corridors: {} } },
          };
        }),

      resetAll: () =>
        set((s) => {
          const { history, historyIndex } = pushHistory(s);
          return { history, historyIndex, overrides: emptyOverrides() };
        }),

      importFloor: (floor, payload) =>
        set((s) => {
          const { history, historyIndex } = pushHistory(s);
          return { history, historyIndex, overrides: { ...s.overrides, [floor]: payload } };
        }),
    }),
    {
      name: 'campus-compass.design',
      version: 2,
      partialize: (s) => ({
        overrides: s.overrides,
        showFloorImage: s.showFloorImage,
        history: s.history.slice(0, s.historyIndex + 1),
        historyIndex: s.historyIndex,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<DesignState>),
      }),
    },
  ),
);
