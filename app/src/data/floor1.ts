// EB Building — First Floor Data
// Coordinate system: normalized [0, 1] relative to floor plan bounds.

import type { FloorData, Room, Entrance, Corridor, GraphNode, GraphEdge } from '../core/types';

const rooms: Room[] = [
  // North-west cluster
  { id: 'EB142', label: 'EB142', floor: 'floor1', position: { x: 0.17585, y: 0.22483 }, width: 0.05, height: 0.03, type: 'room' },
  { id: 'EB139', label: 'EB139', floor: 'floor1', position: { x: 0.25298, y: 0.27422 }, width: 0.035, height: 0.135, type: 'room' },
  { id: 'EB137', label: 'EB137', floor: 'floor1', position: { x: 0.25390, y: 0.36415 }, width: 0.035, height: 0.04, type: 'room' },
  { id: 'EB133', label: 'EB133', floor: 'floor1', position: { x: 0.32185, y: 0.29449 }, width: 0.075, height: 0.18, type: 'room' },

  // North / central corridor rooms
  { id: 'EB131A', label: 'EB131A', floor: 'floor1', position: { x: 0.38062, y: 0.24636 }, width: 0.035, height: 0.075, type: 'room' },
  { id: 'EB131', label: 'EB131', floor: 'floor1', position: { x: 0.43205, y: 0.34136 }, width: 0.14, height: 0.09, type: 'room' },
  { id: 'EB119', label: 'EB119', floor: 'floor1', position: { x: 0.53949, y: 0.28436 }, width: 0.07, height: 0.155, type: 'room' },
  { id: 'EB115', label: 'EB115', floor: 'floor1', position: { x: 0.60560, y: 0.28562 }, width: 0.06, height: 0.155, type: 'room' },
  { id: 'EB111', label: 'EB111', floor: 'floor1', position: { x: 0.66713, y: 0.28436 }, width: 0.06, height: 0.155, type: 'room' },
  { id: 'EB109', label: 'EB109', floor: 'floor1', position: { x: 0.71396, y: 0.25649 }, width: 0.03, height: 0.095, type: 'room' },
  { id: 'EB108', label: 'EB108', floor: 'floor1', position: { x: 0.74518, y: 0.25522 }, width: 0.03, height: 0.095, type: 'room' },

  // Mid-corridor rooms (south side of central corridor)
  { id: 'EB121', label: 'EB121', floor: 'floor1', position: { x: 0.53949, y: 0.37555 }, width: 0.07, height: 0.025, type: 'room' },
  { id: 'EB117', label: 'EB117', floor: 'floor1', position: { x: 0.60560, y: 0.37555 }, width: 0.06, height: 0.025, type: 'room' },
  { id: 'EB113', label: 'EB113', floor: 'floor1', position: { x: 0.66805, y: 0.37555 }, width: 0.06, height: 0.025, type: 'room' },

  // West area
  { id: 'EB136', label: 'EB136', floor: 'floor1', position: { x: 0.27778, y: 0.49588 }, width: 0.05, height: 0.105, type: 'room' },
  { id: 'EB132', label: 'EB132', floor: 'floor1', position: { x: 0.33379, y: 0.49335 }, width: 0.06, height: 0.105, type: 'room' },

  // East area
  { id: 'EB106', label: 'EB106', floor: 'floor1', position: { x: 0.72406, y: 0.44522 }, width: 0.045, height: 0.055, type: 'room' },
  { id: 'EB102', label: 'EB102', floor: 'floor1', position: { x: 0.80762, y: 0.43255 }, width: 0.075, height: 0.085, type: 'room' },

  // South area
  { id: 'EB138', label: 'EB138', floor: 'floor1', position: { x: 0.29981, y: 0.59721 }, width: 0.13, height: 0.10, type: 'room' },
  { id: 'EB104', label: 'EB104', floor: 'floor1', position: { x: 0.77457, y: 0.55035 }, width: 0.145, height: 0.145, type: 'room' },

  // South-east block — visually present but NOT reachable on floor 1
  { id: 'EB155', label: 'EB155', floor: 'floor1', position: { x: 0.79844, y: 0.72641 }, width: 0.10, height: 0.07, type: 'room' },
  { id: 'EB157', label: 'EB157', floor: 'floor1', position: { x: 0.79018, y: 0.77454 }, width: 0.04, height: 0.025, type: 'room' },
  { id: 'EB159', label: 'EB159', floor: 'floor1', position: { x: 0.82874, y: 0.78341 }, width: 0.04, height: 0.04, type: 'room' },
  { id: 'EB161', label: 'EB161', floor: 'floor1', position: { x: 0.80762, y: 0.88474 }, width: 0.08, height: 0.07, type: 'room' },

  // Facilities
  { id: 'F1_ELEV_N', label: 'Lift/Stair', floor: 'floor1', position: { x: 0.16391, y: 0.27802 }, width: 0.02, height: 0.05, type: 'elevator' },
  { id: 'F1_STAIR_NW', label: 'Stair', floor: 'floor1', position: { x: 0.21717, y: 0.25396 }, width: 0.03, height: 0.09, type: 'staircase' },
  { id: 'F1_STAIR_NE', label: 'Stair', floor: 'floor1', position: { x: 0.83150, y: 0.25016 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F1_STAIR_SW', label: 'Stair', floor: 'floor1', position: { x: 0.1777, y: 0.7657 }, width: 0.03, height: 0.04, type: 'staircase' },
  { id: 'F1_TOILET_N', label: 'Toilet', floor: 'floor1', position: { x: 0.72957, y: 0.18683 }, width: 0.06, height: 0.04, type: 'toilet' },

  // Inaccessible area
  { id: 'F1_INACCESS', label: 'Inaccessible area', floor: 'floor1', position: { x: 0.50092, y: 0.57948 }, width: 0.27, height: 0.205, type: 'inaccessible' },
];

const entrances: Entrance[] = [
  { id: 'NW', floor: 'floor1', position: { x: 0.14003, y: 0.32996 } },
  { id: 'NE', floor: 'floor1', position: { x: 0.85262, y: 0.35529 } },
  { id: 'SW', floor: 'floor1', position: { x: 0.14554, y: 0.86447 } },
];

const corridors: Corridor[] = [
  {
    id: 'F1_CORR_NORTH',
    floor: 'floor1',
    path: [
      { x: 0.13819771005233644, y: 0.33248892275555486 }, // J_NW (extends to NW entrance)
      { x: 0.196, y: 0.3338 },                            // J_F1_N1
    ],
  },
  {
    id: 'F1_CORR_MID',
    floor: 'floor1',
    path: [
      { x: 0.20151002910001575, y: 0.3974455423364573 },
      { x: 0.278855984978233, y: 0.4124718280629345 },
      { x: 0.41775185328923686, y: 0.4184823362924373 },
      { x: 0.5081703619960403, y: 0.4207363033957609 },
      { x: 0.56617647834267, y: 0.42038342685188057 },
      { x: 0.6230495115078294, y: 0.41228626785354083 },
      { x: 0.7167140447123606, y: 0.4008866341372114 },
      { x: 0.808, y: 0.37216 },                          // J_M7 (drop-in for EB102)
      { x: 0.8535377716657667, y: 0.3578213916161091 }, // J_NE (extends to NE entrance)
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
      { x: 0.1437073852451179, y: 0.8657378089700224 }, // J_SW (extends to SW entrance)
      { x: 0.1437073852451179, y: 0.6567447666141696 }, // J_F1_S1
      { x: 0.14278911153904564, y: 0.3350221544888903 }, // near J_NW
    ],
  },
];

// ─── Graph ────────────────────────────────────────────
// Junction nodes merged where corridor waypoints coincide.
// EB155/157/159/161 have NO door nodes — they are intentionally unreachable on floor 1.
// SW path only connects to NW; no interior shortcut exists.

const nodes: GraphNode[] = [
  // Entrances
  { id: 'NW', position: { x: 0.14003, y: 0.32996 }, floor: 'floor1' },
  { id: 'NE', position: { x: 0.85262, y: 0.35529 }, floor: 'floor1' },
  { id: 'SW', position: { x: 0.14554, y: 0.86447 }, floor: 'floor1' },

  // Corridor junctions — positions match corridor waypoints exactly so the
  // navigation polyline overlays the dashed corridor.
  // J_NW — F1_CORR_NORTH[0] / F1_CORR_SW[2] (visually at NW entrance)
  { id: 'J_NW', position: { x: 0.13820, y: 0.33249 }, floor: 'floor1' },
  // J_F1_N1 — F1_CORR_NORTH[1] + F1_CONN_W[0]
  { id: 'J_F1_N1', position: { x: 0.196, y: 0.3376 }, floor: 'floor1' },
  // J_M0 — F1_CORR_MID[0] + F1_CONN_W[1]
  { id: 'J_M0', position: { x: 0.20151, y: 0.39745 }, floor: 'floor1' },
  { id: 'J_M1', position: { x: 0.27886, y: 0.41247 }, floor: 'floor1' },
  { id: 'J_M2', position: { x: 0.41775, y: 0.41848 }, floor: 'floor1' },
  { id: 'J_M3', position: { x: 0.50817, y: 0.42074 }, floor: 'floor1' },
  { id: 'J_M4', position: { x: 0.56618, y: 0.42038 }, floor: 'floor1' },
  { id: 'J_M5', position: { x: 0.62305, y: 0.41229 }, floor: 'floor1' },
  { id: 'J_M6', position: { x: 0.71671, y: 0.40089 }, floor: 'floor1' },
  // J_M7 — collinear waypoint between J_M6 and J_NE, drop point for EB102
  { id: 'J_M7', position: { x: 0.808, y: 0.37216 }, floor: 'floor1' },
  // J_NE — F1_CORR_MID[8] (visually at NE entrance)
  { id: 'J_NE', position: { x: 0.85354, y: 0.35782 }, floor: 'floor1' },
  // F1_CORR_SW junctions
  { id: 'J_SW', position: { x: 0.14371, y: 0.86574 }, floor: 'floor1' },
  { id: 'J_F1_S1', position: { x: 0.14371, y: 0.65674 }, floor: 'floor1' },
  // South-east branch (extends from J_M6 downward, serves EB104 / EB106)
  { id: 'J_SE0', position: { x: 0.717, y: 0.46 }, floor: 'floor1' },
  { id: 'J_SE1', position: { x: 0.717, y: 0.55 }, floor: 'floor1' },

  // ── Per-room drop-in junctions on the mid corridor ──
  // Each sits on the corridor polyline at the room's vertical centerline (x = room.x),
  // so the door→drop edge is perpendicular to the corridor (shortest visual path).
  // y values are linear interpolations along the corresponding F1_CORR_MID segment.
  { id: 'DROP_EB137',  position: { x: 0.254, y: 0.408 }, floor: 'floor1' }, // J_M0 → J_M1
  { id: 'DROP_EB138',  position: { x: 0.300, y: 0.413 }, floor: 'floor1' }, // J_M1 → J_M2
  { id: 'DROP_EB133',  position: { x: 0.322, y: 0.414 }, floor: 'floor1' },
  { id: 'DROP_EB132',  position: { x: 0.334, y: 0.415 }, floor: 'floor1' },
  { id: 'DROP_EB131A', position: { x: 0.381, y: 0.417 }, floor: 'floor1' },
  { id: 'DROP_EB131',  position: { x: 0.432, y: 0.419 }, floor: 'floor1' }, // J_M2 → J_M3
  { id: 'DROP_EB119',  position: { x: 0.539, y: 0.421 }, floor: 'floor1' }, // J_M3 → J_M4 (also EB121)
  { id: 'DROP_EB115',  position: { x: 0.606, y: 0.415 }, floor: 'floor1' }, // J_M4 → J_M5 (also EB117)
  { id: 'DROP_EB111',  position: { x: 0.667, y: 0.407 }, floor: 'floor1' }, // J_M5 → J_M6 (also EB113)
  { id: 'DROP_EB108',  position: { x: 0.745, y: 0.392 }, floor: 'floor1' }, // J_M6 → J_M7

  // Door nodes — one per reachable room, at room position
  // (EB155/157/159/161 intentionally omitted)
  { id: 'D_EB142', position: { x: 0.17585, y: 0.22483 }, floor: 'floor1' },
  { id: 'D_EB139', position: { x: 0.25298, y: 0.27422 }, floor: 'floor1' },
  { id: 'D_EB137', position: { x: 0.25390, y: 0.36415 }, floor: 'floor1' },
  { id: 'D_EB133', position: { x: 0.32185, y: 0.29449 }, floor: 'floor1' },
  { id: 'D_EB131A', position: { x: 0.38062, y: 0.24636 }, floor: 'floor1' },
  { id: 'D_EB131', position: { x: 0.43205, y: 0.34136 }, floor: 'floor1' },
  { id: 'D_EB119', position: { x: 0.53949, y: 0.28436 }, floor: 'floor1' },
  { id: 'D_EB115', position: { x: 0.60560, y: 0.28562 }, floor: 'floor1' },
  { id: 'D_EB111', position: { x: 0.66713, y: 0.28436 }, floor: 'floor1' },
  { id: 'D_EB109', position: { x: 0.71396, y: 0.25649 }, floor: 'floor1' },
  { id: 'D_EB108', position: { x: 0.74518, y: 0.25522 }, floor: 'floor1' },
  { id: 'D_EB121', position: { x: 0.53949, y: 0.37555 }, floor: 'floor1' },
  { id: 'D_EB117', position: { x: 0.60560, y: 0.37555 }, floor: 'floor1' },
  { id: 'D_EB113', position: { x: 0.66805, y: 0.37555 }, floor: 'floor1' },
  { id: 'D_EB136', position: { x: 0.27778, y: 0.49588 }, floor: 'floor1' },
  { id: 'D_EB132', position: { x: 0.33379, y: 0.49335 }, floor: 'floor1' },
  { id: 'D_EB106', position: { x: 0.72406, y: 0.44522 }, floor: 'floor1' },
  { id: 'D_EB102', position: { x: 0.80762, y: 0.43255 }, floor: 'floor1' },
  { id: 'D_EB138', position: { x: 0.29981, y: 0.59721 }, floor: 'floor1' },
  { id: 'D_EB104', position: { x: 0.77457, y: 0.55035 }, floor: 'floor1' },

  // Facility nodes (same id as room id)
  { id: 'F1_ELEV_N', position: { x: 0.16391, y: 0.27802 }, floor: 'floor1' },
  { id: 'F1_STAIR_NW', position: { x: 0.21717, y: 0.25396 }, floor: 'floor1' },
  { id: 'F1_STAIR_NE', position: { x: 0.83150, y: 0.25016 }, floor: 'floor1' },
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

// NOTE: NW and SW are connected on floor 1 via the exterior corridor (J_SW → J_F1_S1 → J_NW).
// SW has NO direct interior connections — all routes from SW must traverse J_NW first.
const edges: GraphEdge[] = [
  // ── Entrance connections ──
  edge('NW', 'J_NW'),
  edge('NE', 'J_NE'),
  edge('SW', 'J_SW'),

  // ── Corridor backbone ──
  // F1_CORR_NORTH: J_NW → J_F1_N1
  edge('J_NW', 'J_F1_N1'),
  // F1_CONN_W: J_F1_N1 → J_M0
  edge('J_F1_N1', 'J_M0'),
  // F1_CORR_MID: J_M0 → ... → J_NE (subdivided by per-room drop-in junctions)
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
  // F1_CORR_SW: J_SW → J_F1_S1 → J_NW (exterior path only, no interior shortcuts)
  edge('J_SW', 'J_F1_S1'),
  edge('J_F1_S1', 'J_NW'),

  // ── South-east branch: J_M6 → J_SE0 → J_SE1 ──
  edge('J_M6', 'J_SE0'),
  edge('J_SE0', 'J_SE1'),

  // ── Door → drop-in / junction (perpendicular drop wherever possible) ──
  // NW cluster (no drop-ins — corridor doesn't extend that far north)
  edge('J_F1_N1', 'D_EB142'),
  edge('J_F1_N1', 'D_EB139'),
  // Mid-corridor (north side) — vertical drop from corridor
  edge('DROP_EB137',  'D_EB137'),
  edge('DROP_EB133',  'D_EB133'),
  edge('DROP_EB131A', 'D_EB131A'),
  edge('DROP_EB131',  'D_EB131'),
  edge('DROP_EB119',  'D_EB119'),
  edge('DROP_EB115',  'D_EB115'),
  edge('DROP_EB111',  'D_EB111'),
  edge('DROP_EB108',  'D_EB108'),
  edge('J_M6', 'D_EB109'), // EB109 already nearly aligned with J_M6
  // Mid-corridor (south side) — share drop-ins with the north-side rooms
  edge('DROP_EB119', 'D_EB121'),
  edge('DROP_EB115', 'D_EB117'),
  edge('DROP_EB111', 'D_EB113'),
  // West area
  edge('J_M1', 'D_EB136'), // EB136 already aligned with J_M1
  edge('DROP_EB132', 'D_EB132'),
  // East area — EB106 sits on the SE branch entry; EB102 sits on J_M7
  edge('J_SE0', 'D_EB106'),
  edge('J_M7', 'D_EB102'),
  // South area (EB138 reached via its own drop on the mid corridor)
  edge('DROP_EB138', 'D_EB138'),
  // EB104 — reachable via SE branch
  edge('J_SE1', 'D_EB104'),

  // ── Facilities ──
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
