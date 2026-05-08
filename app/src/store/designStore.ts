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

export interface FloorOverrides {
  rooms: Record<string, RoomOverride>;
  entrances: Partial<Record<EntranceId, EntranceOverride>>;
}

type OverridesByFloor = Record<FloorId, FloorOverrides>;

const emptyOverrides = (): OverridesByFloor => ({
  floor1: { rooms: {}, entrances: {} },
  floor2: { rooms: {}, entrances: {} },
});

export interface DesignState {
  designMode: boolean;
  demoMode: boolean;
  selectedNodeId: string | null;
  overrides: OverridesByFloor;

  toggleDesign: () => void;
  toggleDemo: () => void;
  selectNode: (id: string | null) => void;
  patchRoom: (floor: FloorId, id: string, patch: RoomOverride) => void;
  patchEntrance: (floor: FloorId, id: EntranceId, patch: EntranceOverride) => void;
  resetFloor: (floor: FloorId) => void;
  resetAll: () => void;
  importFloor: (floor: FloorId, payload: FloorOverrides) => void;
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set) => ({
      designMode: false,
      demoMode: false,
      selectedNodeId: null,
      overrides: emptyOverrides(),

      toggleDesign: () =>
        set((s) => ({ designMode: !s.designMode, selectedNodeId: null })),

      toggleDemo: () => set((s) => ({ demoMode: !s.demoMode })),

      selectNode: (id) => set({ selectedNodeId: id }),

      patchRoom: (floor, id, patch) =>
        set((s) => {
          const floorOverride = s.overrides[floor];
          const prev = floorOverride.rooms[id] ?? {};
          return {
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
          const floorOverride = s.overrides[floor];
          const prev = floorOverride.entrances[id] ?? {};
          return {
            overrides: {
              ...s.overrides,
              [floor]: {
                ...floorOverride,
                entrances: { ...floorOverride.entrances, [id]: { ...prev, ...patch } },
              },
            },
          };
        }),

      resetFloor: (floor) =>
        set((s) => ({
          overrides: { ...s.overrides, [floor]: { rooms: {}, entrances: {} } },
        })),

      resetAll: () => set({ overrides: emptyOverrides() }),

      importFloor: (floor, payload) =>
        set((s) => ({ overrides: { ...s.overrides, [floor]: payload } })),
    }),
    {
      name: 'campus-compass.design',
      version: 1,
      partialize: (s) => ({ overrides: s.overrides }),
    },
  ),
);
