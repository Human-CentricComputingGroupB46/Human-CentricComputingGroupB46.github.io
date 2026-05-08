import type { FloorId, FloorPlanMeta } from './types';

const FLOORS_BASE = `${import.meta.env.BASE_URL}floors/`;

// Both floors share floor1's native pixel size as the SVG viewBox so the
// normalized [0,1] data renders consistently across floors. The floor2
// PNG (3072×4096 portrait phone photo) will appear stretched until it is
// re-cropped to a landscape aspect — this is content-side, not architecture.
const SHARED_VIEWBOX_WIDTH = 1389;
const SHARED_VIEWBOX_HEIGHT = 1007;

export const floorPlans: Record<FloorId, FloorPlanMeta> = {
  floor1: {
    src: `${FLOORS_BASE}EB_1floor.png`,
    viewBoxWidth: SHARED_VIEWBOX_WIDTH,
    viewBoxHeight: SHARED_VIEWBOX_HEIGHT,
  },
  floor2: {
    src: `${FLOORS_BASE}EB_2floor.png`,
    viewBoxWidth: SHARED_VIEWBOX_WIDTH,
    viewBoxHeight: SHARED_VIEWBOX_HEIGHT,
  },
};

export const FLOOR_LABELS: Record<FloorId, string> = {
  floor1: 'Floor 1',
  floor2: 'Floor 2',
};

export const FLOOR_ORDER: readonly FloorId[] = ['floor1', 'floor2'] as const;
