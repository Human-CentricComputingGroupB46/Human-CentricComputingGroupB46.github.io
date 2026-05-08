import { useMemo } from 'react';
import type { FloorData, FloorId } from '../core/types';
import { useDesignStore } from '../store/designStore';
import { applyOverrides, getBaseFloorData, ALL_FLOOR_IDS } from '../store/selectors';

/** Effective floor data for a single floor, with design-mode overrides applied. */
export function useFloorData(floor: FloorId): FloorData {
  const overrides = useDesignStore((s) => s.overrides[floor]);
  return useMemo(
    () => applyOverrides(getBaseFloorData(floor), overrides),
    [floor, overrides],
  );
}

/** Effective data for ALL floors, used by the routing engine. */
export function useAllFloorData(): FloorData[] {
  const overrides = useDesignStore((s) => s.overrides);
  return useMemo(
    () => ALL_FLOOR_IDS.map((id) => applyOverrides(getBaseFloorData(id), overrides[id])),
    [overrides],
  );
}
