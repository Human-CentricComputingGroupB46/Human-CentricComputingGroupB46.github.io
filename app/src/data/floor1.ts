// EB Building — First Floor Data
// Coordinate system: normalized [0, 1] relative to floor plan bounds.

import type { FloorData, Room, Entrance, Corridor, GraphNode, GraphEdge } from '../core/types';

const rooms: Room[] = [
  // North-west cluster
  { id: 'EB142', label: 'EB142', floor: 'floor1', position: { x: 0.1823, y: 0.2514 }, width: 0.02, height: 0.025, type: 'room' },
  { id: 'EB139', label: 'EB139', floor: 'floor1', position: { x: 0.2502, y: 0.2907 }, width: 0.035, height: 0.10, type: 'room' },
  { id: 'EB137', label: 'EB137', floor: 'floor1', position: { x: 0.2511, y: 0.3654 }, width: 0.04, height: 0.035, type: 'room' },
  { id: 'EB133', label: 'EB133', floor: 'floor1', position: { x: 0.3182, y: 0.3110 }, width: 0.075, height: 0.14, type: 'room' },

  // North / central corridor rooms
  { id: 'EB131A', label: 'EB131A', floor: 'floor1', position: { x: 0.3733, y: 0.2692 }, width: 0.035, height: 0.05, type: 'room' },
  { id: 'EB131', label: 'EB131', floor: 'floor1', position: { x: 0.4073, y: 0.3439 }, width: 0.10, height: 0.08, type: 'room' },
  { id: 'EB119', label: 'EB119', floor: 'floor1', position: { x: 0.5018, y: 0.3084 }, width: 0.055, height: 0.12, type: 'room' },
  { id: 'EB115', label: 'EB115', floor: 'floor1', position: { x: 0.5634, y: 0.3084 }, width: 0.06, height: 0.12, type: 'room' },
  { id: 'EB111', label: 'EB111', floor: 'floor1', position: { x: 0.6230, y: 0.3097 }, width: 0.055, height: 0.12, type: 'room' },
  { id: 'EB109', label: 'EB109', floor: 'floor1', position: { x: 0.6598, y: 0.2806 }, width: 0.02, height: 0.06, type: 'room' },
  { id: 'EB105', label: 'EB105', floor: 'floor1', position: { x: 0.6809, y: 0.2818 }, width: 0.02, height: 0.06, type: 'room' },

  // Mid-corridor rooms (south side of central corridor)
  { id: 'EB121', label: 'EB121', floor: 'floor1', position: { x: 0.5046, y: 0.3844 }, width: 0.03, height: 0.025, type: 'room' },
  { id: 'EB117', label: 'EB117', floor: 'floor1', position: { x: 0.5624, y: 0.3819 }, width: 0.035, height: 0.025, type: 'room' },
  { id: 'EB113', label: 'EB113', floor: 'floor1', position: { x: 0.6230, y: 0.3857 }, width: 0.04, height: 0.025, type: 'room' },

  // West area
  { id: 'EB136', label: 'EB136', floor: 'floor1', position: { x: 0.2704, y: 0.4756 }, width: 0.05, height: 0.08, type: 'room' },
  { id: 'EB132', label: 'EB132', floor: 'floor1', position: { x: 0.3283, y: 0.4769 }, width: 0.065, height: 0.08, type: 'room' },

  // East area
  { id: 'EB106', label: 'EB106', floor: 'floor1', position: { x: 0.6644, y: 0.4414 }, width: 0.035, height: 0.035, type: 'room' },
  { id: 'EB102', label: 'EB102', floor: 'floor1', position: { x: 0.7388, y: 0.4300 }, width: 0.07, height: 0.07, type: 'room' },

  // South area
  { id: 'EB138', label: 'EB138', floor: 'floor1', position: { x: 0.2971, y: 0.5681 }, width: 0.12, height: 0.10, type: 'room' },
  { id: 'EB104', label: 'EB104', floor: 'floor1', position: { x: 0.7066, y: 0.5326 }, width: 0.12, height: 0.12, type: 'room' },

  // South-east block — visually present but NOT reachable on floor 1
  { id: 'EB155', label: 'EB155', floor: 'floor1', position: { x: 0.7314, y: 0.7011 }, width: 0.08, height: 0.07, type: 'room' },
  { id: 'EB157', label: 'EB157', floor: 'floor1', position: { x: 0.7231, y: 0.7492 }, width: 0.04, height: 0.025, type: 'room' },
  { id: 'EB159', label: 'EB159', floor: 'floor1', position: { x: 0.7553, y: 0.7581 }, width: 0.02, height: 0.04, type: 'room' },
  { id: 'EB161', label: 'EB161', floor: 'floor1', position: { x: 0.7433, y: 0.8455 }, width: 0.08, height: 0.07, type: 'room' },

  // Facilities
  { id: 'F1_ELEV_N', label: 'Lift/Stair', floor: 'floor1', position: { x: 0.1823, y: 0.2869 }, width: 0.02, height: 0.05, type: 'elevator' },
  { id: 'F1_ELEV_E', label: 'Lift/Stair', floor: 'floor1', position: { x: 0.6129, y: 0.5655 }, width: 0.04, height: 0.04, type: 'elevator' },
  { id: 'F1_STAIR_NW', label: 'Stair', floor: 'floor1', position: { x: 0.2190, y: 0.2742 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F1_STAIR_NE', label: 'Stair', floor: 'floor1', position: { x: 0.7544, y: 0.2882 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F1_STAIR_SW', label: 'Stair', floor: 'floor1', position: { x: 0.1777, y: 0.7657 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F1_TOILET_N', label: 'Toilet', floor: 'floor1', position: { x: 0.6699, y: 0.2324 }, width: 0.04, height: 0.04, type: 'toilet' },

  // Inaccessible area
  { id: 'F1_INACCESS', label: 'Inaccessible area', floor: 'floor1', position: { x: 0.4780, y: 0.5605 }, width: 0.235, height: 0.19, type: 'inaccessible' },
];

const entrances: Entrance[] = [
  { id: 'NW', floor: 'floor1', position: { x: 0.1593, y: 0.3388 } },
  { id: 'NE', floor: 'floor1', position: { x: 0.7874, y: 0.3591 } },
  { id: 'SW', floor: 'floor1', position: { x: 0.1474, y: 0.8277 } },
];

const corridors: Corridor[] = [
  {
    id: 'F1_CORR_NORTH',
    floor: 'floor1',
    path: [
      { x: 0.1602, y: 0.3388 },
      { x: 0.1960, y: 0.3338 },
    ],
  },
  {
    id: 'F1_CORR_MID',
    floor: 'floor1',
    path: [
      { x: 0.2034, y: 0.3920 },
      { x: 0.2860, y: 0.3996 },
      { x: 0.4192, y: 0.4098 },
      { x: 0.5092, y: 0.4123 },
      { x: 0.6221, y: 0.4072 },
      { x: 0.6726, y: 0.4072 },
      { x: 0.7388, y: 0.3604 },
      { x: 0.7874, y: 0.3604 },
    ],
  },
  {
    id: 'F1_CONN_W',
    floor: 'floor1',
    path: [
      { x: 0.1979, y: 0.3376 },
      { x: 0.2043, y: 0.3958 },
    ],
  },
  {
    id: 'F1_CORR_SW',
    floor: 'floor1',
    path: [
      { x: 0.1474, y: 0.8265 },
      { x: 0.1483, y: 0.6479 },
      { x: 0.1584, y: 0.3376 },
    ],
  },
];

// ─── Graph ────────────────────────────────────────────
// Junction nodes merged where corridor waypoints coincide.
// EB155/157/159/161 have NO door nodes — they are intentionally unreachable on floor 1.
// SW path only connects to NW; no interior shortcut exists.

const nodes: GraphNode[] = [
  // Entrances
  { id: 'NW', position: { x: 0.1593, y: 0.3388 }, floor: 'floor1' },
  { id: 'NE', position: { x: 0.7874, y: 0.3591 }, floor: 'floor1' },
  { id: 'SW', position: { x: 0.1474, y: 0.8277 }, floor: 'floor1' },

  // Corridor junctions (merged where they coincide)
  // J_NW — F1_CORR_NORTH[0] + F1_CORR_SW[2], near NW entrance
  { id: 'J_NW', position: { x: 0.158, y: 0.338 }, floor: 'floor1' },
  // J_N1 — F1_CORR_NORTH[1] + F1_CONN_W[0]
  { id: 'J_N1', position: { x: 0.197, y: 0.336 }, floor: 'floor1' },
  // J_M0 — F1_CORR_MID[0] + F1_CONN_W[1]
  { id: 'J_M0', position: { x: 0.204, y: 0.394 }, floor: 'floor1' },
  { id: 'J_M1', position: { x: 0.286, y: 0.400 }, floor: 'floor1' },
  { id: 'J_M2', position: { x: 0.419, y: 0.410 }, floor: 'floor1' },
  { id: 'J_M3', position: { x: 0.509, y: 0.412 }, floor: 'floor1' },
  { id: 'J_M4', position: { x: 0.622, y: 0.407 }, floor: 'floor1' },
  { id: 'J_M5', position: { x: 0.673, y: 0.407 }, floor: 'floor1' },
  { id: 'J_M6', position: { x: 0.739, y: 0.360 }, floor: 'floor1' },
  // J_NE — F1_CORR_MID[7], near NE entrance
  { id: 'J_NE', position: { x: 0.787, y: 0.360 }, floor: 'floor1' },
  // F1_CORR_SW junctions
  { id: 'J_SW', position: { x: 0.147, y: 0.827 }, floor: 'floor1' },
  { id: 'J_S1', position: { x: 0.148, y: 0.648 }, floor: 'floor1' },
  // South-east branch (extends from J_M6 downward, serves EB104 area)
  { id: 'J_SE0', position: { x: 0.739, y: 0.45 }, floor: 'floor1' },
  { id: 'J_SE1', position: { x: 0.739, y: 0.55 }, floor: 'floor1' },

  // Door nodes — one per reachable room, at room position
  // (EB155/157/159/161 intentionally omitted)
  { id: 'D_EB142', position: { x: 0.1823, y: 0.2514 }, floor: 'floor1' },
  { id: 'D_EB139', position: { x: 0.2502, y: 0.2907 }, floor: 'floor1' },
  { id: 'D_EB137', position: { x: 0.2511, y: 0.3654 }, floor: 'floor1' },
  { id: 'D_EB133', position: { x: 0.3182, y: 0.3110 }, floor: 'floor1' },
  { id: 'D_EB131A', position: { x: 0.3733, y: 0.2692 }, floor: 'floor1' },
  { id: 'D_EB131', position: { x: 0.4073, y: 0.3439 }, floor: 'floor1' },
  { id: 'D_EB119', position: { x: 0.5018, y: 0.3084 }, floor: 'floor1' },
  { id: 'D_EB115', position: { x: 0.5634, y: 0.3084 }, floor: 'floor1' },
  { id: 'D_EB111', position: { x: 0.6230, y: 0.3097 }, floor: 'floor1' },
  { id: 'D_EB109', position: { x: 0.6598, y: 0.2806 }, floor: 'floor1' },
  { id: 'D_EB105', position: { x: 0.6809, y: 0.2818 }, floor: 'floor1' },
  { id: 'D_EB121', position: { x: 0.5046, y: 0.3844 }, floor: 'floor1' },
  { id: 'D_EB117', position: { x: 0.5624, y: 0.3819 }, floor: 'floor1' },
  { id: 'D_EB113', position: { x: 0.6230, y: 0.3857 }, floor: 'floor1' },
  { id: 'D_EB136', position: { x: 0.2704, y: 0.4756 }, floor: 'floor1' },
  { id: 'D_EB132', position: { x: 0.3283, y: 0.4769 }, floor: 'floor1' },
  { id: 'D_EB106', position: { x: 0.6644, y: 0.4414 }, floor: 'floor1' },
  { id: 'D_EB102', position: { x: 0.7388, y: 0.4300 }, floor: 'floor1' },
  { id: 'D_EB138', position: { x: 0.2971, y: 0.5681 }, floor: 'floor1' },
  { id: 'D_EB104', position: { x: 0.7066, y: 0.5326 }, floor: 'floor1' },

  // Facility nodes (same id as room id)
  { id: 'F1_ELEV_N', position: { x: 0.1823, y: 0.2869 }, floor: 'floor1' },
  { id: 'F1_ELEV_E', position: { x: 0.6129, y: 0.5655 }, floor: 'floor1' },
  { id: 'F1_STAIR_NW', position: { x: 0.2190, y: 0.2742 }, floor: 'floor1' },
  { id: 'F1_STAIR_NE', position: { x: 0.7544, y: 0.2882 }, floor: 'floor1' },
  { id: 'F1_STAIR_SW', position: { x: 0.1777, y: 0.7657 }, floor: 'floor1' },
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

// NOTE: NW and SW are connected on floor 1 via the exterior corridor (J_SW → J_S1 → J_NW).
// SW has NO direct interior connections — all routes from SW must traverse J_NW first.
const edges: GraphEdge[] = [
  // ── Entrance connections ──
  edge('NW', 'J_NW'),
  edge('NE', 'J_NE'),
  edge('SW', 'J_SW'),

  // ── Corridor backbone ──
  // F1_CORR_NORTH: J_NW → J_N1
  edge('J_NW', 'J_N1'),
  // F1_CONN_W: J_N1 → J_M0
  edge('J_N1', 'J_M0'),
  // F1_CORR_MID: J_M0 → ... → J_NE
  edge('J_M0', 'J_M1'),
  edge('J_M1', 'J_M2'),
  edge('J_M2', 'J_M3'),
  edge('J_M3', 'J_M4'),
  edge('J_M4', 'J_M5'),
  edge('J_M5', 'J_M6'),
  edge('J_M6', 'J_NE'),
  // F1_CORR_SW: J_SW → J_S1 → J_NW (exterior path only, no interior shortcuts)
  edge('J_SW', 'J_S1'),
  edge('J_S1', 'J_NW'),

  // ── South-east branch: J_M6 → J_SE0 → J_SE1 ──
  edge('J_M6', 'J_SE0'),
  edge('J_SE0', 'J_SE1'),

  // ── Door → nearest junction ──
  // NW cluster
  edge('J_N1', 'D_EB142'),
  edge('J_N1', 'D_EB139'),
  edge('J_M0', 'D_EB137'),
  edge('J_M1', 'D_EB133'),
  // North / central
  edge('J_M2', 'D_EB131A'),
  edge('J_M2', 'D_EB131'),
  edge('J_M3', 'D_EB119'),
  edge('J_M4', 'D_EB115'),
  edge('J_M4', 'D_EB111'),
  edge('J_M5', 'D_EB109'),
  edge('J_M5', 'D_EB105'),
  // Mid-corridor (south side)
  edge('J_M3', 'D_EB121'),
  edge('J_M4', 'D_EB117'),
  edge('J_M4', 'D_EB113'),
  // West area
  edge('J_M1', 'D_EB136'),
  edge('J_M1', 'D_EB132'),
  // East area
  edge('J_M5', 'D_EB106'),
  edge('J_M6', 'D_EB102'),
  // South area (EB138 only reachable via J_M1 — through the mid corridor)
  edge('J_M1', 'D_EB138'),
  // EB104 — reachable via SE branch
  edge('J_SE1', 'D_EB104'),

  // ── Facilities ──
  edge('J_N1', 'F1_ELEV_N'),
  edge('J_M4', 'F1_ELEV_E'),
  edge('J_N1', 'F1_STAIR_NW'),
  edge('J_M6', 'F1_STAIR_NE'),
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
