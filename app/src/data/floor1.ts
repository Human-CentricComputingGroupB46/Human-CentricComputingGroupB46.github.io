// EB Building — First Floor Data
// Coordinate system: normalized [0, 1] relative to floor plan bounds.
//   x: 0 = west edge,  1 = east edge
//   y: 0 = north edge, 1 = south edge

import type { FloorData, Room, Entrance, Corridor, GraphNode, GraphEdge } from '../core/types';

const rooms: Room[] = [
  // North corridor rooms (west → east)
  { id: 'EB140', label: 'EB140', floor: 'floor1', position: { x: 0.05, y: 0.12 }, width: 0.05, height: 0.08, type: 'room' },
  { id: 'EB139', label: 'EB139', floor: 'floor1', position: { x: 0.13, y: 0.12 }, width: 0.07, height: 0.08, type: 'room' },
  { id: 'EB137', label: 'EB137', floor: 'floor1', position: { x: 0.13, y: 0.22 }, width: 0.05, height: 0.05, type: 'room' },
  { id: 'EB133', label: 'EB133', floor: 'floor1', position: { x: 0.22, y: 0.12 }, width: 0.08, height: 0.08, type: 'room' },
  { id: 'EB131A', label: 'EB131A', floor: 'floor1', position: { x: 0.32, y: 0.08 }, width: 0.05, height: 0.05, type: 'room' },
  { id: 'EB131', label: 'EB131', floor: 'floor1', position: { x: 0.35, y: 0.12 }, width: 0.10, height: 0.08, type: 'room' },
  { id: 'EB119', label: 'EB119', floor: 'floor1', position: { x: 0.47, y: 0.12 }, width: 0.08, height: 0.08, type: 'room' },
  { id: 'EB115', label: 'EB115', floor: 'floor1', position: { x: 0.57, y: 0.12 }, width: 0.07, height: 0.08, type: 'room' },
  { id: 'EB111', label: 'EB111', floor: 'floor1', position: { x: 0.66, y: 0.12 }, width: 0.07, height: 0.08, type: 'room' },
  { id: 'EB109', label: 'EB109', floor: 'floor1', position: { x: 0.76, y: 0.08 }, width: 0.04, height: 0.05, type: 'room' },
  { id: 'EB107', label: 'EB107', floor: 'floor1', position: { x: 0.82, y: 0.08 }, width: 0.04, height: 0.05, type: 'room' },

  // Middle corridor rooms
  { id: 'EB121', label: 'EB121', floor: 'floor1', position: { x: 0.47, y: 0.25 }, width: 0.05, height: 0.04, type: 'room' },
  { id: 'EB117', label: 'EB117', floor: 'floor1', position: { x: 0.55, y: 0.25 }, width: 0.05, height: 0.04, type: 'room' },
  { id: 'EB113', label: 'EB113', floor: 'floor1', position: { x: 0.63, y: 0.25 }, width: 0.05, height: 0.04, type: 'room' },
  { id: 'EB136', label: 'EB136', floor: 'floor1', position: { x: 0.18, y: 0.35 }, width: 0.08, height: 0.08, type: 'room' },
  { id: 'EB132', label: 'EB132', floor: 'floor1', position: { x: 0.28, y: 0.35 }, width: 0.08, height: 0.08, type: 'room' },
  { id: 'EB106', label: 'EB106', floor: 'floor1', position: { x: 0.63, y: 0.33 }, width: 0.07, height: 0.07, type: 'room' },
  { id: 'EB102', label: 'EB102', floor: 'floor1', position: { x: 0.74, y: 0.30 }, width: 0.10, height: 0.10, type: 'room' },

  // South area
  { id: 'EB138', label: 'EB138', floor: 'floor1', position: { x: 0.18, y: 0.50 }, width: 0.12, height: 0.10, type: 'room' },
  { id: 'EB104', label: 'EB104', floor: 'floor1', position: { x: 0.70, y: 0.45 }, width: 0.12, height: 0.10, type: 'room' },

  // South-east block
  { id: 'EB155', label: 'EB155', floor: 'floor1', position: { x: 0.72, y: 0.60 }, width: 0.10, height: 0.07, type: 'room' },
  { id: 'EB157', label: 'EB157', floor: 'floor1', position: { x: 0.78, y: 0.68 }, width: 0.05, height: 0.04, type: 'room' },
  { id: 'EB159', label: 'EB159', floor: 'floor1', position: { x: 0.84, y: 0.68 }, width: 0.05, height: 0.04, type: 'room' },
  { id: 'EB161', label: 'EB161', floor: 'floor1', position: { x: 0.76, y: 0.78 }, width: 0.08, height: 0.07, type: 'room' },

  // Facilities
  { id: 'F1_ELEV_N', label: 'Lift/Stair', floor: 'floor1', position: { x: 0.20, y: 0.25 }, width: 0.04, height: 0.04, type: 'elevator' },
  { id: 'F1_ELEV_E', label: 'Lift/Stair', floor: 'floor1', position: { x: 0.60, y: 0.25 }, width: 0.04, height: 0.04, type: 'elevator' },
  { id: 'F1_STAIR_NW', label: 'Stair', floor: 'floor1', position: { x: 0.06, y: 0.18 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F1_STAIR_NE', label: 'Stair', floor: 'floor1', position: { x: 0.85, y: 0.12 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F1_STAIR_SW', label: 'Stair', floor: 'floor1', position: { x: 0.10, y: 0.72 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F1_TOILET_N', label: 'Toilet', floor: 'floor1', position: { x: 0.73, y: 0.12 }, width: 0.04, height: 0.04, type: 'toilet' },

  // Inaccessible area
  { id: 'F1_INACCESS', label: 'Inaccessible area', floor: 'floor1', position: { x: 0.40, y: 0.55 }, width: 0.25, height: 0.15, type: 'inaccessible' },
];

const entrances: Entrance[] = [
  { id: 'NW', floor: 'floor1', position: { x: 0.05, y: 0.20 } },
  { id: 'NE', floor: 'floor1', position: { x: 0.88, y: 0.22 } },
  { id: 'SW', floor: 'floor1', position: { x: 0.10, y: 0.80 } },
];

const corridors: Corridor[] = [
  {
    id: 'F1_CORR_NORTH',
    floor: 'floor1',
    path: [
      { x: 0.05, y: 0.20 }, { x: 0.13, y: 0.20 }, { x: 0.22, y: 0.20 },
      { x: 0.35, y: 0.20 }, { x: 0.47, y: 0.20 }, { x: 0.57, y: 0.20 },
      { x: 0.66, y: 0.20 }, { x: 0.76, y: 0.20 }, { x: 0.85, y: 0.20 },
      { x: 0.88, y: 0.22 },
    ],
  },
  {
    id: 'F1_CORR_MID',
    floor: 'floor1',
    path: [
      { x: 0.18, y: 0.30 }, { x: 0.28, y: 0.30 }, { x: 0.40, y: 0.30 },
      { x: 0.50, y: 0.30 }, { x: 0.63, y: 0.30 }, { x: 0.74, y: 0.30 },
    ],
  },
  { id: 'F1_CONN_W', floor: 'floor1', path: [{ x: 0.18, y: 0.20 }, { x: 0.18, y: 0.30 }] },
  { id: 'F1_CONN_E', floor: 'floor1', path: [{ x: 0.70, y: 0.20 }, { x: 0.70, y: 0.30 }] },
  {
    id: 'F1_CORR_SE',
    floor: 'floor1',
    path: [
      { x: 0.70, y: 0.40 }, { x: 0.70, y: 0.55 },
      { x: 0.70, y: 0.68 }, { x: 0.70, y: 0.78 },
    ],
  },
  {
    id: 'F1_CORR_SW',
    floor: 'floor1',
    path: [
      { x: 0.10, y: 0.80 }, { x: 0.10, y: 0.65 }, { x: 0.18, y: 0.55 },
    ],
  },
];

const nodes: GraphNode[] = [
  { id: 'NW', position: { x: 0.05, y: 0.20 }, floor: 'floor1' },
  { id: 'NE', position: { x: 0.88, y: 0.22 }, floor: 'floor1' },
  { id: 'SW', position: { x: 0.10, y: 0.80 }, floor: 'floor1' },

  { id: 'N_J1', position: { x: 0.13, y: 0.20 }, floor: 'floor1' },
  { id: 'N_J2', position: { x: 0.18, y: 0.20 }, floor: 'floor1' },
  { id: 'N_J3', position: { x: 0.22, y: 0.20 }, floor: 'floor1' },
  { id: 'N_J4', position: { x: 0.35, y: 0.20 }, floor: 'floor1' },
  { id: 'N_J5', position: { x: 0.47, y: 0.20 }, floor: 'floor1' },
  { id: 'N_J6', position: { x: 0.57, y: 0.20 }, floor: 'floor1' },
  { id: 'N_J7', position: { x: 0.66, y: 0.20 }, floor: 'floor1' },
  { id: 'N_J8', position: { x: 0.70, y: 0.20 }, floor: 'floor1' },
  { id: 'N_J9', position: { x: 0.76, y: 0.20 }, floor: 'floor1' },
  { id: 'N_J10', position: { x: 0.85, y: 0.20 }, floor: 'floor1' },

  { id: 'M_J1', position: { x: 0.18, y: 0.30 }, floor: 'floor1' },
  { id: 'M_J2', position: { x: 0.28, y: 0.30 }, floor: 'floor1' },
  { id: 'M_J3', position: { x: 0.40, y: 0.30 }, floor: 'floor1' },
  { id: 'M_J4', position: { x: 0.50, y: 0.30 }, floor: 'floor1' },
  { id: 'M_J5', position: { x: 0.63, y: 0.30 }, floor: 'floor1' },
  { id: 'M_J6', position: { x: 0.70, y: 0.30 }, floor: 'floor1' },
  { id: 'M_J7', position: { x: 0.74, y: 0.30 }, floor: 'floor1' },

  { id: 'SE_J1', position: { x: 0.70, y: 0.40 }, floor: 'floor1' },
  { id: 'SE_J2', position: { x: 0.70, y: 0.55 }, floor: 'floor1' },
  { id: 'SE_J3', position: { x: 0.70, y: 0.68 }, floor: 'floor1' },
  { id: 'SE_J4', position: { x: 0.70, y: 0.78 }, floor: 'floor1' },

  { id: 'SW_J1', position: { x: 0.10, y: 0.65 }, floor: 'floor1' },
  { id: 'SW_J2', position: { x: 0.18, y: 0.55 }, floor: 'floor1' },

  { id: 'D_EB140', position: { x: 0.08, y: 0.20 }, floor: 'floor1' },
  { id: 'D_EB139', position: { x: 0.13, y: 0.20 }, floor: 'floor1' },
  { id: 'D_EB137', position: { x: 0.13, y: 0.22 }, floor: 'floor1' },
  { id: 'D_EB133', position: { x: 0.22, y: 0.20 }, floor: 'floor1' },
  { id: 'D_EB131A', position: { x: 0.35, y: 0.12 }, floor: 'floor1' },
  { id: 'D_EB131', position: { x: 0.35, y: 0.20 }, floor: 'floor1' },
  { id: 'D_EB119', position: { x: 0.47, y: 0.20 }, floor: 'floor1' },
  { id: 'D_EB115', position: { x: 0.57, y: 0.20 }, floor: 'floor1' },
  { id: 'D_EB111', position: { x: 0.66, y: 0.20 }, floor: 'floor1' },
  { id: 'D_EB109', position: { x: 0.76, y: 0.15 }, floor: 'floor1' },
  { id: 'D_EB107', position: { x: 0.82, y: 0.15 }, floor: 'floor1' },
  { id: 'D_EB121', position: { x: 0.47, y: 0.30 }, floor: 'floor1' },
  { id: 'D_EB117', position: { x: 0.55, y: 0.30 }, floor: 'floor1' },
  { id: 'D_EB113', position: { x: 0.63, y: 0.30 }, floor: 'floor1' },
  { id: 'D_EB136', position: { x: 0.18, y: 0.30 }, floor: 'floor1' },
  { id: 'D_EB132', position: { x: 0.28, y: 0.30 }, floor: 'floor1' },
  { id: 'D_EB106', position: { x: 0.63, y: 0.30 }, floor: 'floor1' },
  { id: 'D_EB102', position: { x: 0.74, y: 0.30 }, floor: 'floor1' },
  { id: 'D_EB138', position: { x: 0.18, y: 0.45 }, floor: 'floor1' },
  { id: 'D_EB104', position: { x: 0.70, y: 0.40 }, floor: 'floor1' },
  { id: 'D_EB155', position: { x: 0.70, y: 0.60 }, floor: 'floor1' },
  { id: 'D_EB157', position: { x: 0.76, y: 0.68 }, floor: 'floor1' },
  { id: 'D_EB159', position: { x: 0.84, y: 0.68 }, floor: 'floor1' },
  { id: 'D_EB161', position: { x: 0.70, y: 0.78 }, floor: 'floor1' },

  { id: 'F1_ELEV_N', position: { x: 0.20, y: 0.25 }, floor: 'floor1' },
  { id: 'F1_ELEV_E', position: { x: 0.60, y: 0.25 }, floor: 'floor1' },
  { id: 'F1_STAIR_NW', position: { x: 0.06, y: 0.18 }, floor: 'floor1' },
  { id: 'F1_STAIR_NE', position: { x: 0.85, y: 0.12 }, floor: 'floor1' },
  { id: 'F1_STAIR_SW', position: { x: 0.10, y: 0.72 }, floor: 'floor1' },
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

// NOTE: NW and SW are NOT connected on floor 1 — must transit via cross-floor edges.
const edges: GraphEdge[] = [
  edge('NW', 'D_EB140'),
  edge('D_EB140', 'N_J1'),
  edge('N_J1', 'N_J2'),
  edge('N_J2', 'N_J3'),
  edge('N_J3', 'N_J4'),
  edge('N_J4', 'N_J5'),
  edge('N_J5', 'N_J6'),
  edge('N_J6', 'N_J7'),
  edge('N_J7', 'N_J8'),
  edge('N_J8', 'N_J9'),
  edge('N_J9', 'N_J10'),
  edge('N_J10', 'NE'),

  edge('N_J1', 'D_EB139'),
  edge('N_J1', 'D_EB137'),
  edge('N_J3', 'D_EB133'),
  edge('N_J4', 'D_EB131'),
  edge('N_J4', 'D_EB131A'),
  edge('N_J5', 'D_EB119'),
  edge('N_J6', 'D_EB115'),
  edge('N_J7', 'D_EB111'),
  edge('N_J9', 'D_EB109'),
  edge('N_J10', 'D_EB107'),

  edge('N_J2', 'M_J1'),
  edge('N_J8', 'M_J6'),

  edge('M_J1', 'M_J2'),
  edge('M_J2', 'M_J3'),
  edge('M_J3', 'M_J4'),
  edge('M_J4', 'M_J5'),
  edge('M_J5', 'M_J6'),
  edge('M_J6', 'M_J7'),

  edge('M_J1', 'D_EB136'),
  edge('M_J2', 'D_EB132'),
  edge('M_J4', 'D_EB121'),
  edge('M_J4', 'D_EB117'),
  edge('M_J5', 'D_EB113'),
  edge('M_J5', 'D_EB106'),
  edge('M_J7', 'D_EB102'),

  edge('M_J6', 'SE_J1'),
  edge('SE_J1', 'D_EB104'),
  edge('SE_J1', 'SE_J2'),
  edge('SE_J2', 'D_EB155'),
  edge('SE_J2', 'SE_J3'),
  edge('SE_J3', 'D_EB157'),
  edge('SE_J3', 'D_EB159'),
  edge('SE_J3', 'SE_J4'),
  edge('SE_J4', 'D_EB161'),

  edge('M_J1', 'D_EB138'),

  edge('SW', 'SW_J1'),
  edge('SW_J1', 'F1_STAIR_SW'),
  edge('SW_J1', 'SW_J2'),
  edge('SW_J2', 'D_EB138'),

  edge('N_J2', 'F1_ELEV_N'),
  edge('N_J6', 'F1_ELEV_E'),
  edge('NW', 'F1_STAIR_NW'),
  edge('N_J10', 'F1_STAIR_NE'),
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
