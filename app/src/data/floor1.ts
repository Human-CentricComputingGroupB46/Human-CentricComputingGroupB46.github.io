// EB Building - First Floor Data
// Coordinate system: normalized [0, 1] relative to floor plan bounds.

import type { FloorData, Room, Entrance, Corridor, GraphNode, GraphEdge } from '../core/types';

const rooms: Room[] = [
  // North-west cluster
  { id: 'EB142', label: 'EB142', floor: 'floor1', position: { x: 0.18266, y: 0.20318 }, width: 0.05, height: 0.03360, type: 'room' },
  { id: 'EB139', label: 'EB139', floor: 'floor1', position: { x: 0.26256, y: 0.25224 }, width: 0.035, height: 0.135, type: 'room' },
  { id: 'EB137', label: 'EB137', floor: 'floor1', position: { x: 0.26256, y: 0.34633 }, width: 0.035, height: 0.04, type: 'room' },
  { id: 'EB133', label: 'EB133', floor: 'floor1', position: { x: 0.32980, y: 0.27375 }, width: 0.075, height: 0.18, type: 'room' },

  // North / central corridor rooms
  { id: 'EB131A', label: 'EB131A', floor: 'floor1', position: { x: 0.38924, y: 0.22536 }, width: 0.035, height: 0.075, type: 'room' },
  { id: 'EB131', label: 'EB131', floor: 'floor1', position: { x: 0.43796, y: 0.31944 }, width: 0.14, height: 0.09, type: 'room' },
  { id: 'EB119', label: 'EB119', floor: 'floor1', position: { x: 0.54223, y: 0.26299 }, width: 0.07, height: 0.155, type: 'room' },
  { id: 'EB115', label: 'EB115', floor: 'floor1', position: { x: 0.60849, y: 0.26030 }, width: 0.06, height: 0.155, type: 'room' },
  { id: 'EB111', label: 'EB111', floor: 'floor1', position: { x: 0.66988, y: 0.26030 }, width: 0.06, height: 0.155, type: 'room' },
  { id: 'EB109', label: 'EB109', floor: 'floor1', position: { x: 0.71665, y: 0.23573 }, width: 0.03059, height: 0.095, type: 'room' },
  { id: 'EB108', label: 'EB108', floor: 'floor1', position: { x: 0.75173, y: 0.23342 }, width: 0.03324, height: 0.095, type: 'room' },

  // Mid-corridor rooms (south side of central corridor)
  { id: 'EB121', label: 'EB121', floor: 'floor1', position: { x: 0.54223, y: 0.35439 }, width: 0.07, height: 0.02291, type: 'room' },
  { id: 'EB117', label: 'EB117', floor: 'floor1', position: { x: 0.60751, y: 0.35439 }, width: 0.06, height: 0.025, type: 'room' },
  { id: 'EB113', label: 'EB113', floor: 'floor1', position: { x: 0.66890, y: 0.35573 }, width: 0.06, height: 0.025, type: 'room' },

  // West area
  { id: 'EB136', label: 'EB136', floor: 'floor1', position: { x: 0.28887, y: 0.47939 }, width: 0.05, height: 0.105, type: 'room' },
  { id: 'EB132', label: 'EB132', floor: 'floor1', position: { x: 0.33954, y: 0.48073 }, width: 0.06, height: 0.105, type: 'room' },

  // East area
  { id: 'EB106', label: 'EB106', floor: 'floor1', position: { x: 0.73029, y: 0.42966 }, width: 0.04355, height: 0.055, type: 'room' },
  { id: 'EB102', label: 'EB102', floor: 'floor1', position: { x: 0.82091, y: 0.41487 }, width: 0.075, height: 0.085, type: 'room' },

  // South area
  { id: 'EB138', label: 'EB138', floor: 'floor1', position: { x: 0.30933, y: 0.58423 }, width: 0.13, height: 0.10, type: 'room' },
  { id: 'EB104', label: 'EB104', floor: 'floor1', position: { x: 0.78418, y: 0.53715 }, width: 0.15533, height: 0.15046, type: 'room' },

  // South-east block - visually present but not reachable on floor 1
  { id: 'EB155', label: 'EB155', floor: 'floor1', position: { x: 0.80727, y: 0.71729 }, width: 0.10, height: 0.07, type: 'room' },
  { id: 'EB157', label: 'EB157', floor: 'floor1', position: { x: 0.80045, y: 0.77375 }, width: 0.04, height: 0.025, type: 'room' },
  { id: 'EB159', label: 'EB159', floor: 'floor1', position: { x: 0.84040, y: 0.78315 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB161', label: 'EB161', floor: 'floor1', position: { x: 0.82091, y: 0.88262 }, width: 0.08, height: 0.07, type: 'room' },

  // Facilities
  { id: 'F1_ELEV_N', label: 'Lift/Stair', floor: 'floor1', position: { x: 0.17096, y: 0.25762 }, width: 0.02049, height: 0.05, type: 'elevator' },
  { id: 'F1_STAIR_NW', label: 'Stair', floor: 'floor1', position: { x: 0.22748, y: 0.23477 }, width: 0.03, height: 0.09, type: 'staircase' },
  { id: 'F1_STAIR_NE', label: 'Stair', floor: 'floor1', position: { x: 0.84789, y: 0.23418 }, width: 0.02985, height: 0.09527, type: 'staircase' },
  { id: 'F1_STAIR_SW', label: 'Stair', floor: 'floor1', position: { x: 0.18850, y: 0.79383 }, width: 0.03, height: 0.08317, type: 'staircase' },
  { id: 'F1_TOILET_N', label: 'Toilet', floor: 'floor1', position: { x: 0.73614, y: 0.20923 }, width: 0.06, height: 0.04, type: 'toilet' },

  // Inaccessible area
  { id: 'F1_INACCESS', label: 'Inaccessible area', floor: 'floor1', position: { x: 0.50520, y: 0.56272 }, width: 0.27, height: 0.205, type: 'inaccessible' },
];

const entrances: Entrance[] = [
  { id: 'NW', floor: 'floor1', position: { x: 0.13296, y: 0.31407 } },
  { id: 'NE', floor: 'floor1', position: { x: 0.88425, y: 0.33423 } },
  { id: 'SW', floor: 'floor1', position: { x: 0.13199, y: 0.85708 } },
];

const corridors: Corridor[] = [
  {
    id: 'F1_CORR_NORTH',
    floor: 'floor1',
    path: [
      { x: 0.13588, y: 0.31407 }, // J_NW
      { x: 0.21774, y: 0.31407 }, // J_F1_N1
    ],
  },
  {
    id: 'F1_CORR_MID',
    floor: 'floor1',
    path: [
      { x: 0.21774, y: 0.38396 }, // J_M0
      { x: 0.26256, y: 0.38396 }, // DROP_EB137
      { x: 0.28790, y: 0.38396 }, // J_M1
      { x: 0.30933, y: 0.38396 }, // DROP_EB138
      { x: 0.32980, y: 0.38396 }, // DROP_EB133
      { x: 0.33954, y: 0.38396 }, // DROP_EB132
      { x: 0.38924, y: 0.38396 }, // DROP_EB131A
      { x: 0.43601, y: 0.38396 }, // J_M2
      { x: 0.43796, y: 0.38396 }, // DROP_EB131
      { x: 0.54417, y: 0.38396 }, // J_M3 / DROP_EB119
      { x: 0.61044, y: 0.38396 }, // J_M4 / DROP_EB115
      { x: 0.67085, y: 0.38396 }, // J_M5 / DROP_EB111
      { x: 0.72932, y: 0.38396 }, // J_M6
      { x: 0.75270, y: 0.33557 }, // DROP_EB108
      { x: 0.82091, y: 0.33557 }, // J_M7
      { x: 0.88523, y: 0.33557 }, // J_NE
    ],
  },
  {
    id: 'F1_CONN_W',
    floor: 'floor1',
    path: [
      { x: 0.21774, y: 0.31407 }, // J_F1_N1
      { x: 0.21774, y: 0.38396 }, // J_M0
    ],
  },
  {
    id: 'F1_CORR_SW',
    floor: 'floor1',
    path: [
      { x: 0.13296, y: 0.85573 }, // J_SW
      { x: 0.13296, y: 0.60439 }, // J_F1_S1
      { x: 0.13296, y: 0.31407 }, // near J_NW
    ],
  },
];

const nodes: GraphNode[] = [
  // Entrances
  { id: 'NW', position: { x: 0.13296, y: 0.31407 }, floor: 'floor1' },
  { id: 'NE', position: { x: 0.88425, y: 0.33423 }, floor: 'floor1' },
  { id: 'SW', position: { x: 0.13199, y: 0.85708 }, floor: 'floor1' },

  // Corridor junctions. These match corridor waypoints so the highlighted
  // navigation route can snap to the dashed corridor polyline.
  { id: 'J_NW', position: { x: 0.13588, y: 0.31407 }, floor: 'floor1' },
  { id: 'J_F1_N1', position: { x: 0.21774, y: 0.31407 }, floor: 'floor1' },
  { id: 'J_M0', position: { x: 0.21774, y: 0.38396 }, floor: 'floor1' },
  { id: 'J_M1', position: { x: 0.28790, y: 0.38396 }, floor: 'floor1' },
  { id: 'J_M2', position: { x: 0.43601, y: 0.38396 }, floor: 'floor1' },
  { id: 'J_M3', position: { x: 0.54417, y: 0.38396 }, floor: 'floor1' },
  { id: 'J_M4', position: { x: 0.61044, y: 0.38396 }, floor: 'floor1' },
  { id: 'J_M5', position: { x: 0.67085, y: 0.38396 }, floor: 'floor1' },
  { id: 'J_M6', position: { x: 0.72932, y: 0.38396 }, floor: 'floor1' },
  { id: 'J_M7', position: { x: 0.82091, y: 0.33557 }, floor: 'floor1' },
  { id: 'J_NE', position: { x: 0.88523, y: 0.33557 }, floor: 'floor1' },
  { id: 'J_SW', position: { x: 0.13296, y: 0.85573 }, floor: 'floor1' },
  { id: 'J_F1_S1', position: { x: 0.13296, y: 0.60439 }, floor: 'floor1' },

  // South-east branch (extends from J_M6 downward, serves EB104 / EB106)
  { id: 'J_SE0', position: { x: 0.717, y: 0.46 }, floor: 'floor1' },
  { id: 'J_SE1', position: { x: 0.717, y: 0.55 }, floor: 'floor1' },

  // Per-room drop-in junctions on the mid corridor.
  { id: 'DROP_EB137', position: { x: 0.26256, y: 0.38396 }, floor: 'floor1' },
  { id: 'DROP_EB138', position: { x: 0.30933, y: 0.38396 }, floor: 'floor1' },
  { id: 'DROP_EB133', position: { x: 0.32980, y: 0.38396 }, floor: 'floor1' },
  { id: 'DROP_EB132', position: { x: 0.33954, y: 0.38396 }, floor: 'floor1' },
  { id: 'DROP_EB131A', position: { x: 0.38924, y: 0.38396 }, floor: 'floor1' },
  { id: 'DROP_EB131', position: { x: 0.43796, y: 0.38396 }, floor: 'floor1' },
  { id: 'DROP_EB119', position: { x: 0.54417, y: 0.38396 }, floor: 'floor1' },
  { id: 'DROP_EB115', position: { x: 0.61044, y: 0.38396 }, floor: 'floor1' },
  { id: 'DROP_EB111', position: { x: 0.67085, y: 0.38396 }, floor: 'floor1' },
  { id: 'DROP_EB108', position: { x: 0.75270, y: 0.33557 }, floor: 'floor1' },

  // Door nodes - one per reachable room, at room position.
  // EB155/157/159/161 are intentionally omitted.
  { id: 'D_EB142', position: { x: 0.18266, y: 0.20318 }, floor: 'floor1' },
  { id: 'D_EB139', position: { x: 0.26256, y: 0.25224 }, floor: 'floor1' },
  { id: 'D_EB137', position: { x: 0.26256, y: 0.34633 }, floor: 'floor1' },
  { id: 'D_EB133', position: { x: 0.32980, y: 0.27375 }, floor: 'floor1' },
  { id: 'D_EB131A', position: { x: 0.38924, y: 0.22536 }, floor: 'floor1' },
  { id: 'D_EB131', position: { x: 0.43796, y: 0.31944 }, floor: 'floor1' },
  { id: 'D_EB119', position: { x: 0.54223, y: 0.26299 }, floor: 'floor1' },
  { id: 'D_EB115', position: { x: 0.60849, y: 0.26030 }, floor: 'floor1' },
  { id: 'D_EB111', position: { x: 0.66988, y: 0.26030 }, floor: 'floor1' },
  { id: 'D_EB109', position: { x: 0.71665, y: 0.23573 }, floor: 'floor1' },
  { id: 'D_EB108', position: { x: 0.75173, y: 0.23342 }, floor: 'floor1' },
  { id: 'D_EB121', position: { x: 0.54223, y: 0.35439 }, floor: 'floor1' },
  { id: 'D_EB117', position: { x: 0.60751, y: 0.35439 }, floor: 'floor1' },
  { id: 'D_EB113', position: { x: 0.66890, y: 0.35573 }, floor: 'floor1' },
  { id: 'D_EB136', position: { x: 0.28887, y: 0.47939 }, floor: 'floor1' },
  { id: 'D_EB132', position: { x: 0.33954, y: 0.48073 }, floor: 'floor1' },
  { id: 'D_EB106', position: { x: 0.73029, y: 0.42966 }, floor: 'floor1' },
  { id: 'D_EB102', position: { x: 0.82091, y: 0.41487 }, floor: 'floor1' },
  { id: 'D_EB138', position: { x: 0.30933, y: 0.58423 }, floor: 'floor1' },
  { id: 'D_EB104', position: { x: 0.78418, y: 0.53715 }, floor: 'floor1' },

  // Facility nodes
  { id: 'F1_ELEV_N', position: { x: 0.17096, y: 0.25762 }, floor: 'floor1' },
  { id: 'F1_STAIR_NW', position: { x: 0.22748, y: 0.23477 }, floor: 'floor1' },
  { id: 'F1_STAIR_NE', position: { x: 0.84789, y: 0.23418 }, floor: 'floor1' },
  { id: 'F1_STAIR_SW', position: { x: 0.18850, y: 0.79383 }, floor: 'floor1' },
];

const nodeMap = new Map<string, GraphNode>(nodes.map(n => [n.id, n]));

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function edge(from: string, to: string): GraphEdge {
  const a = nodeMap.get(from);
  const b = nodeMap.get(to);
  if (!a || !b) throw new Error(`floor1 graph: unknown node "${from}" or "${to}"`);
  return { from, to, weight: dist(a.position, b.position) };
}

// NW and SW are connected on floor 1 via the exterior corridor.
// SW has no direct interior connection.
const edges: GraphEdge[] = [
  // Entrance connections
  edge('NW', 'J_NW'),
  edge('NE', 'J_NE'),
  edge('SW', 'J_SW'),

  // Corridor backbone
  edge('J_NW', 'J_F1_N1'),
  edge('J_F1_N1', 'J_M0'),
  edge('J_M0', 'DROP_EB137'),
  edge('DROP_EB137', 'J_M1'),
  edge('J_M1', 'DROP_EB138'),
  edge('DROP_EB138', 'DROP_EB133'),
  edge('DROP_EB133', 'DROP_EB132'),
  edge('DROP_EB132', 'DROP_EB131A'),
  edge('DROP_EB131A', 'J_M2'),
  edge('J_M2', 'DROP_EB131'),
  edge('DROP_EB131', 'J_M3'),
  edge('J_M3', 'DROP_EB119'),
  edge('DROP_EB119', 'J_M4'),
  edge('J_M4', 'DROP_EB115'),
  edge('DROP_EB115', 'J_M5'),
  edge('J_M5', 'DROP_EB111'),
  edge('DROP_EB111', 'J_M6'),
  edge('J_M6', 'DROP_EB108'),
  edge('DROP_EB108', 'J_M7'),
  edge('J_M7', 'J_NE'),
  edge('J_SW', 'J_F1_S1'),
  edge('J_F1_S1', 'J_NW'),

  // South-east branch
  edge('J_M6', 'J_SE0'),
  edge('J_SE0', 'J_SE1'),

  // Door to drop-in / junction
  edge('J_F1_N1', 'D_EB142'),
  edge('J_F1_N1', 'D_EB139'),
  edge('DROP_EB137', 'D_EB137'),
  edge('DROP_EB133', 'D_EB133'),
  edge('DROP_EB131A', 'D_EB131A'),
  edge('DROP_EB131', 'D_EB131'),
  edge('DROP_EB119', 'D_EB119'),
  edge('DROP_EB115', 'D_EB115'),
  edge('DROP_EB111', 'D_EB111'),
  edge('DROP_EB108', 'D_EB108'),
  edge('J_M6', 'D_EB109'),
  edge('DROP_EB119', 'D_EB121'),
  edge('DROP_EB115', 'D_EB117'),
  edge('DROP_EB111', 'D_EB113'),
  edge('J_M1', 'D_EB136'),
  edge('DROP_EB132', 'D_EB132'),
  edge('J_M6', 'D_EB106'),
  edge('J_M7', 'D_EB102'),
  edge('DROP_EB138', 'D_EB138'),
  edge('J_SE1', 'D_EB104'),

  // Facilities
  edge('J_F1_N1', 'F1_ELEV_N'),
  edge('J_F1_N1', 'F1_STAIR_NW'),
  edge('J_NE', 'F1_STAIR_NE'),
  edge('J_SW', 'F1_STAIR_SW'),
];

export const floor1Data: FloorData = {
  id: 'floor1',
  label: 'First Floor',
  rooms,
  entrances,
  corridors,
  nodes,
  edges,
};
