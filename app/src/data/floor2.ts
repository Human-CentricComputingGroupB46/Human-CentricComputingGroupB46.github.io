// EB Building — Second Floor Data

import type { FloorData, Room, Entrance, Corridor, GraphNode, GraphEdge } from '../core/types';

const rooms: Room[] = [
  // North corridor (west → east)
  { id: 'EB237', label: 'EB237', floor: 'floor2', position: { x: 0.13, y: 0.10 }, width: 0.07, height: 0.07, type: 'room' },
  { id: 'EB239', label: 'EB239', floor: 'floor2', position: { x: 0.13, y: 0.19 }, width: 0.05, height: 0.04, type: 'room' },
  { id: 'EB235', label: 'EB235', floor: 'floor2', position: { x: 0.20, y: 0.19 }, width: 0.05, height: 0.04, type: 'room' },
  { id: 'EB233', label: 'EB233', floor: 'floor2', position: { x: 0.22, y: 0.10 }, width: 0.07, height: 0.07, type: 'room' },
  { id: 'EB231', label: 'EB231', floor: 'floor2', position: { x: 0.32, y: 0.10 }, width: 0.07, height: 0.07, type: 'room' },
  { id: 'EB211', label: 'EB211', floor: 'floor2', position: { x: 0.50, y: 0.08 }, width: 0.12, height: 0.08, type: 'room' },

  // Inner corridor rooms
  { id: 'EB222', label: 'EB222', floor: 'floor2', position: { x: 0.33, y: 0.25 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB220', label: 'EB220', floor: 'floor2', position: { x: 0.38, y: 0.25 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB218', label: 'EB218', floor: 'floor2', position: { x: 0.43, y: 0.25 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB216', label: 'EB216', floor: 'floor2', position: { x: 0.48, y: 0.25 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB214', label: 'EB214', floor: 'floor2', position: { x: 0.53, y: 0.25 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB212', label: 'EB212', floor: 'floor2', position: { x: 0.58, y: 0.25 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB210', label: 'EB210', floor: 'floor2', position: { x: 0.63, y: 0.25 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB206', label: 'EB206', floor: 'floor2', position: { x: 0.70, y: 0.25 }, width: 0.05, height: 0.04, type: 'room' },

  // West block
  { id: 'EB236', label: 'EB236', floor: 'floor2', position: { x: 0.13, y: 0.32 }, width: 0.08, height: 0.06, type: 'room' },
  { id: 'EB238', label: 'EB238', floor: 'floor2', position: { x: 0.18, y: 0.42 }, width: 0.12, height: 0.10, type: 'room' },

  // Roof Garden (inaccessible)
  { id: 'F2_ROOF', label: 'Roof Garden', floor: 'floor2', position: { x: 0.35, y: 0.40 }, width: 0.25, height: 0.15, type: 'inaccessible' },

  // East corridor (north → south)
  { id: 'EB241', label: 'EB241', floor: 'floor2', position: { x: 0.82, y: 0.22 }, width: 0.07, height: 0.06, type: 'room' },
  { id: 'EB245', label: 'EB245', floor: 'floor2', position: { x: 0.82, y: 0.32 }, width: 0.06, height: 0.05, type: 'room' },
  { id: 'EB247', label: 'EB247', floor: 'floor2', position: { x: 0.82, y: 0.40 }, width: 0.06, height: 0.05, type: 'room' },
  { id: 'EB249', label: 'EB249', floor: 'floor2', position: { x: 0.82, y: 0.50 }, width: 0.06, height: 0.04, type: 'room' },
  { id: 'EB251', label: 'EB251', floor: 'floor2', position: { x: 0.82, y: 0.56 }, width: 0.06, height: 0.04, type: 'room' },
  { id: 'EB253', label: 'EB253', floor: 'floor2', position: { x: 0.82, y: 0.62 }, width: 0.06, height: 0.04, type: 'room' },
  { id: 'EB257', label: 'EB257', floor: 'floor2', position: { x: 0.82, y: 0.68 }, width: 0.06, height: 0.04, type: 'room' },
  { id: 'EB259', label: 'EB259', floor: 'floor2', position: { x: 0.82, y: 0.74 }, width: 0.06, height: 0.04, type: 'room' },

  // South-west block
  { id: 'EB282', label: 'EB282', floor: 'floor2', position: { x: 0.04, y: 0.70 }, width: 0.06, height: 0.06, type: 'room' },
  { id: 'EB287', label: 'EB287', floor: 'floor2', position: { x: 0.10, y: 0.65 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB283', label: 'EB283', floor: 'floor2', position: { x: 0.15, y: 0.65 }, width: 0.05, height: 0.04, type: 'room' },
  { id: 'EB280', label: 'EB280', floor: 'floor2', position: { x: 0.10, y: 0.72 }, width: 0.04, height: 0.04, type: 'room' },

  // South corridor rooms
  { id: 'EB277', label: 'EB277', floor: 'floor2', position: { x: 0.22, y: 0.65 }, width: 0.06, height: 0.05, type: 'room' },
  { id: 'EB275', label: 'EB275', floor: 'floor2', position: { x: 0.30, y: 0.65 }, width: 0.06, height: 0.05, type: 'room' },
  { id: 'EB273', label: 'EB273', floor: 'floor2', position: { x: 0.38, y: 0.65 }, width: 0.06, height: 0.05, type: 'room' },
  { id: 'EB271', label: 'EB271', floor: 'floor2', position: { x: 0.46, y: 0.72 }, width: 0.06, height: 0.05, type: 'room' },
  { id: 'EB269', label: 'EB269', floor: 'floor2', position: { x: 0.54, y: 0.72 }, width: 0.06, height: 0.05, type: 'room' },
  { id: 'EB279', label: 'EB279', floor: 'floor2', position: { x: 0.22, y: 0.75 }, width: 0.06, height: 0.05, type: 'room' },
  { id: 'EB265A', label: 'EB265A', floor: 'floor2', position: { x: 0.62, y: 0.68 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB265', label: 'EB265', floor: 'floor2', position: { x: 0.68, y: 0.72 }, width: 0.06, height: 0.05, type: 'room' },
  { id: 'EB261', label: 'EB261', floor: 'floor2', position: { x: 0.76, y: 0.78 }, width: 0.06, height: 0.05, type: 'room' },

  // Facilities
  { id: 'F2_ELEV_NW', label: 'Lift/Stair', floor: 'floor2', position: { x: 0.09, y: 0.10 }, width: 0.03, height: 0.04, type: 'elevator' },
  { id: 'F2_ELEV_SW', label: 'Lift/Stair', floor: 'floor2', position: { x: 0.09, y: 0.65 }, width: 0.03, height: 0.04, type: 'elevator' },
  { id: 'F2_STAIR_NE', label: 'Stair', floor: 'floor2', position: { x: 0.85, y: 0.10 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F2_STAIR_SE', label: 'Stair', floor: 'floor2', position: { x: 0.85, y: 0.78 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F2_TOILET_N', label: 'Toilet', floor: 'floor2', position: { x: 0.40, y: 0.08 }, width: 0.04, height: 0.04, type: 'toilet' },
  { id: 'F2_TOILET_SW', label: 'Toilet', floor: 'floor2', position: { x: 0.12, y: 0.60 }, width: 0.04, height: 0.03, type: 'toilet' },
  { id: 'F2_TOILET_SE', label: 'Toilet', floor: 'floor2', position: { x: 0.78, y: 0.56 }, width: 0.04, height: 0.03, type: 'toilet' },
];

// Floor-2 entrance markers correspond to stair/elevator landings (no street-level entry).
const entrances: Entrance[] = [
  { id: 'NW', floor: 'floor2', position: { x: 0.09, y: 0.14 } },
  { id: 'NE', floor: 'floor2', position: { x: 0.85, y: 0.14 } },
  { id: 'SW', floor: 'floor2', position: { x: 0.09, y: 0.69 } },
];

const corridors: Corridor[] = [
  {
    id: 'F2_CORR_NORTH',
    floor: 'floor2',
    path: [
      { x: 0.09, y: 0.18 }, { x: 0.13, y: 0.18 }, { x: 0.22, y: 0.18 },
      { x: 0.32, y: 0.18 }, { x: 0.42, y: 0.18 }, { x: 0.50, y: 0.18 },
      { x: 0.65, y: 0.18 }, { x: 0.76, y: 0.18 }, { x: 0.85, y: 0.18 },
    ],
  },
  {
    id: 'F2_CORR_INNER',
    floor: 'floor2',
    path: [
      { x: 0.30, y: 0.30 }, { x: 0.33, y: 0.30 }, { x: 0.38, y: 0.30 },
      { x: 0.43, y: 0.30 }, { x: 0.48, y: 0.30 }, { x: 0.53, y: 0.30 },
      { x: 0.58, y: 0.30 }, { x: 0.63, y: 0.30 }, { x: 0.70, y: 0.30 },
      { x: 0.76, y: 0.30 },
    ],
  },
  {
    id: 'F2_CORR_EAST',
    floor: 'floor2',
    path: [
      { x: 0.76, y: 0.18 }, { x: 0.76, y: 0.30 }, { x: 0.76, y: 0.40 },
      { x: 0.76, y: 0.50 }, { x: 0.76, y: 0.60 }, { x: 0.76, y: 0.72 },
      { x: 0.76, y: 0.80 },
    ],
  },
  {
    id: 'F2_CORR_SOUTH',
    floor: 'floor2',
    path: [
      { x: 0.09, y: 0.69 }, { x: 0.15, y: 0.69 }, { x: 0.22, y: 0.69 },
      { x: 0.30, y: 0.69 }, { x: 0.38, y: 0.69 }, { x: 0.46, y: 0.69 },
      { x: 0.54, y: 0.69 }, { x: 0.62, y: 0.69 }, { x: 0.68, y: 0.69 },
      { x: 0.76, y: 0.72 },
    ],
  },
  {
    id: 'F2_CONN_W',
    floor: 'floor2',
    path: [
      { x: 0.09, y: 0.18 }, { x: 0.09, y: 0.35 },
      { x: 0.09, y: 0.55 }, { x: 0.09, y: 0.69 },
    ],
  },
  { id: 'F2_CONN_MID', floor: 'floor2', path: [{ x: 0.30, y: 0.18 }, { x: 0.30, y: 0.30 }] },
];

const nodes: GraphNode[] = [
  { id: 'F2_NW', position: { x: 0.09, y: 0.14 }, floor: 'floor2' },
  { id: 'F2_NE', position: { x: 0.85, y: 0.14 }, floor: 'floor2' },
  { id: 'F2_SW', position: { x: 0.09, y: 0.69 }, floor: 'floor2' },

  { id: 'F2N_J1', position: { x: 0.09, y: 0.18 }, floor: 'floor2' },
  { id: 'F2N_J2', position: { x: 0.13, y: 0.18 }, floor: 'floor2' },
  { id: 'F2N_J3', position: { x: 0.22, y: 0.18 }, floor: 'floor2' },
  { id: 'F2N_J4', position: { x: 0.30, y: 0.18 }, floor: 'floor2' },
  { id: 'F2N_J5', position: { x: 0.42, y: 0.18 }, floor: 'floor2' },
  { id: 'F2N_J6', position: { x: 0.50, y: 0.18 }, floor: 'floor2' },
  { id: 'F2N_J7', position: { x: 0.65, y: 0.18 }, floor: 'floor2' },
  { id: 'F2N_J8', position: { x: 0.76, y: 0.18 }, floor: 'floor2' },
  { id: 'F2N_J9', position: { x: 0.85, y: 0.18 }, floor: 'floor2' },

  { id: 'F2I_J1', position: { x: 0.30, y: 0.30 }, floor: 'floor2' },
  { id: 'F2I_J2', position: { x: 0.38, y: 0.30 }, floor: 'floor2' },
  { id: 'F2I_J3', position: { x: 0.48, y: 0.30 }, floor: 'floor2' },
  { id: 'F2I_J4', position: { x: 0.58, y: 0.30 }, floor: 'floor2' },
  { id: 'F2I_J5', position: { x: 0.70, y: 0.30 }, floor: 'floor2' },
  { id: 'F2I_J6', position: { x: 0.76, y: 0.30 }, floor: 'floor2' },

  { id: 'F2E_J1', position: { x: 0.76, y: 0.40 }, floor: 'floor2' },
  { id: 'F2E_J2', position: { x: 0.76, y: 0.50 }, floor: 'floor2' },
  { id: 'F2E_J3', position: { x: 0.76, y: 0.60 }, floor: 'floor2' },
  { id: 'F2E_J4', position: { x: 0.76, y: 0.72 }, floor: 'floor2' },
  { id: 'F2E_J5', position: { x: 0.76, y: 0.80 }, floor: 'floor2' },

  { id: 'F2S_J1', position: { x: 0.09, y: 0.69 }, floor: 'floor2' },
  { id: 'F2S_J2', position: { x: 0.15, y: 0.69 }, floor: 'floor2' },
  { id: 'F2S_J3', position: { x: 0.22, y: 0.69 }, floor: 'floor2' },
  { id: 'F2S_J4', position: { x: 0.30, y: 0.69 }, floor: 'floor2' },
  { id: 'F2S_J5', position: { x: 0.38, y: 0.69 }, floor: 'floor2' },
  { id: 'F2S_J6', position: { x: 0.46, y: 0.69 }, floor: 'floor2' },
  { id: 'F2S_J7', position: { x: 0.54, y: 0.69 }, floor: 'floor2' },
  { id: 'F2S_J8', position: { x: 0.62, y: 0.69 }, floor: 'floor2' },
  { id: 'F2S_J9', position: { x: 0.68, y: 0.69 }, floor: 'floor2' },

  { id: 'F2W_J1', position: { x: 0.09, y: 0.35 }, floor: 'floor2' },
  { id: 'F2W_J2', position: { x: 0.09, y: 0.55 }, floor: 'floor2' },

  { id: 'D_EB237', position: { x: 0.13, y: 0.18 }, floor: 'floor2' },
  { id: 'D_EB239', position: { x: 0.13, y: 0.19 }, floor: 'floor2' },
  { id: 'D_EB235', position: { x: 0.22, y: 0.19 }, floor: 'floor2' },
  { id: 'D_EB233', position: { x: 0.22, y: 0.18 }, floor: 'floor2' },
  { id: 'D_EB231', position: { x: 0.32, y: 0.18 }, floor: 'floor2' },
  { id: 'D_EB211', position: { x: 0.50, y: 0.18 }, floor: 'floor2' },
  { id: 'D_EB236', position: { x: 0.13, y: 0.32 }, floor: 'floor2' },
  { id: 'D_EB238', position: { x: 0.18, y: 0.42 }, floor: 'floor2' },

  { id: 'D_EB222', position: { x: 0.33, y: 0.30 }, floor: 'floor2' },
  { id: 'D_EB220', position: { x: 0.38, y: 0.30 }, floor: 'floor2' },
  { id: 'D_EB218', position: { x: 0.43, y: 0.30 }, floor: 'floor2' },
  { id: 'D_EB216', position: { x: 0.48, y: 0.30 }, floor: 'floor2' },
  { id: 'D_EB214', position: { x: 0.53, y: 0.30 }, floor: 'floor2' },
  { id: 'D_EB212', position: { x: 0.58, y: 0.30 }, floor: 'floor2' },
  { id: 'D_EB210', position: { x: 0.63, y: 0.30 }, floor: 'floor2' },
  { id: 'D_EB206', position: { x: 0.70, y: 0.30 }, floor: 'floor2' },

  { id: 'D_EB241', position: { x: 0.76, y: 0.25 }, floor: 'floor2' },
  { id: 'D_EB245', position: { x: 0.76, y: 0.35 }, floor: 'floor2' },
  { id: 'D_EB247', position: { x: 0.76, y: 0.42 }, floor: 'floor2' },
  { id: 'D_EB249', position: { x: 0.76, y: 0.50 }, floor: 'floor2' },
  { id: 'D_EB251', position: { x: 0.76, y: 0.56 }, floor: 'floor2' },
  { id: 'D_EB253', position: { x: 0.76, y: 0.62 }, floor: 'floor2' },
  { id: 'D_EB257', position: { x: 0.76, y: 0.68 }, floor: 'floor2' },
  { id: 'D_EB259', position: { x: 0.76, y: 0.74 }, floor: 'floor2' },

  { id: 'D_EB282', position: { x: 0.09, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB287', position: { x: 0.12, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB283', position: { x: 0.15, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB280', position: { x: 0.10, y: 0.72 }, floor: 'floor2' },
  { id: 'D_EB277', position: { x: 0.22, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB275', position: { x: 0.30, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB273', position: { x: 0.38, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB271', position: { x: 0.46, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB269', position: { x: 0.54, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB279', position: { x: 0.22, y: 0.75 }, floor: 'floor2' },
  { id: 'D_EB265A', position: { x: 0.62, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB265', position: { x: 0.68, y: 0.69 }, floor: 'floor2' },
  { id: 'D_EB261', position: { x: 0.76, y: 0.80 }, floor: 'floor2' },

  { id: 'F2_ELEV_NW', position: { x: 0.09, y: 0.10 }, floor: 'floor2' },
  { id: 'F2_ELEV_SW', position: { x: 0.09, y: 0.65 }, floor: 'floor2' },
  { id: 'F2_STAIR_NE', position: { x: 0.85, y: 0.10 }, floor: 'floor2' },
  { id: 'F2_STAIR_SE', position: { x: 0.85, y: 0.78 }, floor: 'floor2' },
];

const nodeMap = new Map<string, GraphNode>(nodes.map(n => [n.id, n]));

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function edge(from: string, to: string): GraphEdge {
  const a = nodeMap.get(from);
  const b = nodeMap.get(to);
  if (!a || !b) throw new Error(`floor2 graph: unknown node "${from}" or "${to}"`);
  return { from, to, weight: dist(a.position, b.position) };
}

const edges: GraphEdge[] = [
  edge('F2_NW', 'F2N_J1'),
  edge('F2_NW', 'F2_ELEV_NW'),

  edge('F2N_J1', 'F2N_J2'),
  edge('F2N_J2', 'F2N_J3'),
  edge('F2N_J3', 'F2N_J4'),
  edge('F2N_J4', 'F2N_J5'),
  edge('F2N_J5', 'F2N_J6'),
  edge('F2N_J6', 'F2N_J7'),
  edge('F2N_J7', 'F2N_J8'),
  edge('F2N_J8', 'F2N_J9'),
  edge('F2N_J9', 'F2_NE'),
  edge('F2N_J9', 'F2_STAIR_NE'),

  edge('F2N_J2', 'D_EB237'),
  edge('F2N_J2', 'D_EB239'),
  edge('F2N_J3', 'D_EB233'),
  edge('F2N_J3', 'D_EB235'),
  edge('F2N_J4', 'D_EB231'),
  edge('F2N_J6', 'D_EB211'),

  edge('F2N_J4', 'F2I_J1'),

  edge('F2I_J1', 'D_EB222'),
  edge('D_EB222', 'F2I_J2'),
  edge('F2I_J2', 'D_EB220'),
  edge('F2I_J2', 'D_EB218'),
  edge('F2I_J2', 'F2I_J3'),
  edge('F2I_J3', 'D_EB216'),
  edge('F2I_J3', 'D_EB214'),
  edge('F2I_J3', 'F2I_J4'),
  edge('F2I_J4', 'D_EB212'),
  edge('F2I_J4', 'D_EB210'),
  edge('F2I_J4', 'F2I_J5'),
  edge('F2I_J5', 'D_EB206'),
  edge('F2I_J5', 'F2I_J6'),

  edge('F2N_J8', 'F2I_J6'),
  edge('F2I_J6', 'F2E_J1'),
  edge('F2I_J6', 'D_EB241'),
  edge('F2E_J1', 'D_EB245'),
  edge('F2E_J1', 'D_EB247'),
  edge('F2E_J1', 'F2E_J2'),
  edge('F2E_J2', 'D_EB249'),
  edge('F2E_J2', 'D_EB251'),
  edge('F2E_J2', 'F2E_J3'),
  edge('F2E_J3', 'D_EB253'),
  edge('F2E_J3', 'D_EB257'),
  edge('F2E_J3', 'F2E_J4'),
  edge('F2E_J4', 'D_EB259'),
  edge('F2E_J4', 'F2E_J5'),
  edge('F2E_J5', 'D_EB261'),
  edge('F2E_J5', 'F2_STAIR_SE'),

  edge('F2E_J4', 'F2S_J9'),
  edge('F2S_J9', 'D_EB265'),
  edge('F2S_J9', 'F2S_J8'),
  edge('F2S_J8', 'D_EB265A'),
  edge('F2S_J8', 'F2S_J7'),
  edge('F2S_J7', 'D_EB269'),
  edge('F2S_J7', 'F2S_J6'),
  edge('F2S_J6', 'D_EB271'),
  edge('F2S_J6', 'F2S_J5'),
  edge('F2S_J5', 'D_EB273'),
  edge('F2S_J5', 'F2S_J4'),
  edge('F2S_J4', 'D_EB275'),
  edge('F2S_J4', 'F2S_J3'),
  edge('F2S_J3', 'D_EB277'),
  edge('F2S_J3', 'D_EB279'),
  edge('F2S_J3', 'F2S_J2'),
  edge('F2S_J2', 'D_EB283'),
  edge('F2S_J2', 'D_EB287'),
  edge('F2S_J2', 'F2S_J1'),
  edge('F2S_J1', 'D_EB282'),
  edge('F2S_J1', 'D_EB280'),
  edge('F2S_J1', 'F2_SW'),
  edge('F2_SW', 'F2_ELEV_SW'),

  edge('F2N_J1', 'F2W_J1'),
  edge('F2W_J1', 'D_EB236'),
  edge('F2W_J1', 'D_EB238'),
  edge('F2W_J1', 'F2W_J2'),
  edge('F2W_J2', 'F2S_J1'),
];

export const floor2Data: FloorData = {
  id: 'floor2',
  label: 'Second Floor',
  rooms,
  entrances,
  corridors,
  nodes,
  edges,
};
