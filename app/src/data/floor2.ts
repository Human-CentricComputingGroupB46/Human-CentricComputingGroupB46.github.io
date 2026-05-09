// EB Building — Second Floor Data
// Coordinate system: normalized [0, 1] relative to floor plan bounds.
//
// Routing model:
//   * Floor-2 entry points are STAIRS (F2_STAIR_NW / F2_STAIR_NE / F2_STAIR_SW),
//     since you can only reach floor 2 from floor 1 via the cross-floor links in core/graph.ts.
//   * Corridor layout follows the manually-pulled JSON (6 corridors):
//       F2_CORR_NORTH (main E-W), F2_CONN_NW (stair→north), F2_CONN_NE (north→NE stair),
//       F2_CORR_EAST (vertical), F2_CORR_SOUTH (zigzag), F2_CONN_SW (south→SW stair).
//   * Each room hangs off a per-room drop-in junction lying on its corridor at the room's
//     centerline, so the door→drop edge is perpendicular to the corridor.

import type { FloorData, Room, Entrance, Corridor, GraphNode, GraphEdge } from '../core/types';

const rooms: Room[] = [
  // ── North row (face north, reached from F2_CORR_NORTH) ──
  { id: 'EB237', label: 'EB237', floor: 'floor2', position: { x: 0.23043, y: 0.25309 }, width: 0.07816, height: 0.14773, type: 'room' },
  { id: 'EB239', label: 'EB239', floor: 'floor2', position: { x: 0.23038, y: 0.33706 }, width: 0.08010, height: 0.01873, type: 'room' },
  { id: 'EB235', label: 'EB235', floor: 'floor2', position: { x: 0.31267, y: 0.33629 }, width: 0.08265, height: 0.02027, type: 'room' },
  { id: 'EB233', label: 'EB233', floor: 'floor2', position: { x: 0.31359, y: 0.25321 }, width: 0.08275, height: 0.14543, type: 'room' },
  { id: 'EB231', label: 'EB231', floor: 'floor2', position: { x: 0.39480, y: 0.26323 }, width: 0.07816, height: 0.18066, type: 'room' },
  { id: 'EB211', label: 'EB211', floor: 'floor2', position: { x: 0.64142, y: 0.24636 }, width: 0.23080, height: 0.14260, type: 'room' },

  // ── North inner rooms (near F2_CORR_NORTH) ──
  { id: 'EB230', label: 'EB230', floor: 'floor2', position: { x: 0.45592, y: 0.20456 }, width: 0.04, height: 0.065, type: 'room' },
  { id: 'EB225', label: 'EB225', floor: 'floor2', position: { x: 0.50092, y: 0.20456 }, width: 0.045, height: 0.065, type: 'room' },

  // ── Inner row (along F2_CORR_NORTH south side) ──
  { id: 'EB222', label: 'EB222', floor: 'floor2', position: { x: 0.54632, y: 0.36440 }, width: 0.04122, height: 0.03090, type: 'room' },
  { id: 'EB220', label: 'EB220', floor: 'floor2', position: { x: 0.58576, y: 0.36479 }, width: 0.03745, height: 0.02913, type: 'room' },
  { id: 'EB216', label: 'EB216', floor: 'floor2', position: { x: 0.62754, y: 0.36592 }, width: 0.04020, height: 0.03140, type: 'room' },
  { id: 'EB214', label: 'EB214', floor: 'floor2', position: { x: 0.66820, y: 0.36598 }, width: 0.03826, height: 0.02929, type: 'room' },
  { id: 'EB212', label: 'EB212', floor: 'floor2', position: { x: 0.70763, y: 0.36492 }, width: 0.03837, height: 0.03140, type: 'room' },
  { id: 'EB210', label: 'EB210', floor: 'floor2', position: { x: 0.74628, y: 0.36630 }, width: 0.03525, height: 0.02963, type: 'room' },
  { id: 'EB206', label: 'EB206', floor: 'floor2', position: { x: 0.78915, y: 0.36682 }, width: 0.04428, height: 0.03013, type: 'room' },

  // ── West block ──
  { id: 'EB236', label: 'EB236', floor: 'floor2', position: { x: 0.27364, y: 0.41735 }, width: 0.09826, height: 0.02873, type: 'room' },
  { id: 'EB238', label: 'EB238', floor: 'floor2', position: { x: 0.27441, y: 0.52818 }, width: 0.17019, height: 0.18366, type: 'room' },

  // ── East column (face west onto F2_CORR_EAST) ──
  { id: 'EB241', label: 'EB241', floor: 'floor2', position: { x: 0.87792, y: 0.38992 }, width: 0.08000, height: 0.07940, type: 'room' },
  { id: 'EB245', label: 'EB245', floor: 'floor2', position: { x: 0.87802, y: 0.47228 }, width: 0.07775, height: 0.08200, type: 'room' },
  { id: 'EB247', label: 'EB247', floor: 'floor2', position: { x: 0.87756, y: 0.55478 }, width: 0.07867, height: 0.07726, type: 'room' },
  { id: 'EB249', label: 'EB249', floor: 'floor2', position: { x: 0.87756, y: 0.63191 }, width: 0.07683, height: 0.07193, type: 'room' },
  { id: 'EB251', label: 'EB251', floor: 'floor2', position: { x: 0.87756, y: 0.68791 }, width: 0.07683, height: 0.03900, type: 'room' },
  { id: 'EB253', label: 'EB253', floor: 'floor2', position: { x: 0.87802, y: 0.73034 }, width: 0.07591, height: 0.04280, type: 'room' },
  { id: 'EB257', label: 'EB257', floor: 'floor2', position: { x: 0.86088, y: 0.76744 }, width: 0.04224, height: 0.02887, type: 'room' },
  { id: 'EB261', label: 'EB261', floor: 'floor2', position: { x: 0.87833, y: 0.88600 }, width: 0.08051, height: 0.10606, type: 'room' },

  // ── South row (reached from F2_CORR_SOUTH) ──
  { id: 'EB265',  label: 'EB265',  floor: 'floor2', position: { x: 0.72421, y: 0.85417 }, width: 0.07867, height: 0.10860, type: 'room' },
  { id: 'EB265A', label: 'EB265A', floor: 'floor2', position: { x: 0.68697, y: 0.77251 }, width: 0.05214, height: 0.04407, type: 'room' },
  { id: 'EB269',  label: 'EB269',  floor: 'floor2', position: { x: 0.64478, y: 0.85417 }, width: 0.07591, height: 0.11113, type: 'room' },
  { id: 'EB271',  label: 'EB271',  floor: 'floor2', position: { x: 0.56214, y: 0.85544 }, width: 0.08510, height: 0.11620, type: 'room' },
  { id: 'EB274',  label: 'EB274',  floor: 'floor2', position: { x: 0.53673, y: 0.77327 }, width: 0.03500, height: 0.04500, type: 'room' },
  { id: 'EB273',  label: 'EB273',  floor: 'floor2', position: { x: 0.47995, y: 0.81554 }, width: 0.07683, height: 0.13013, type: 'room' },
  { id: 'EB275',  label: 'EB275',  floor: 'floor2', position: { x: 0.39868, y: 0.81427 }, width: 0.08142, height: 0.12760, type: 'room' },
  { id: 'EB277',  label: 'EB277',  floor: 'floor2', position: { x: 0.31604, y: 0.81554 }, width: 0.07959, height: 0.12760, type: 'room' },
  { id: 'EB279',  label: 'EB279',  floor: 'floor2', position: { x: 0.30456, y: 0.89820 }, width: 0.06030, height: 0.02880, type: 'room' },

  // ── SW corner cluster ──
  { id: 'EB280', label: 'EB280', floor: 'floor2', position: { x: 0.21350, y: 0.91057 }, width: 0.04,    height: 0.05927, type: 'room' },
  { id: 'EB282', label: 'EB282', floor: 'floor2', position: { x: 0.13912, y: 0.90754 }, width: 0.06,    height: 0.06000, type: 'room' },
  { id: 'EB283', label: 'EB283', floor: 'floor2', position: { x: 0.25655, y: 0.77707 }, width: 0.04061, height: 0.05320, type: 'room' },
  { id: 'EB287', label: 'EB287', floor: 'floor2', position: { x: 0.20799, y: 0.77707 }, width: 0.03415, height: 0.05841, type: 'room' },

  // ── Facilities ──
  { id: 'F2_STAIR_NW', label: 'Stair',      floor: 'floor2', position: { x: 0.17217, y: 0.22659 }, width: 0.030,   height: 0.08966, type: 'staircase' },
  { id: 'F2_STAIR_SW', label: 'Stair',      floor: 'floor2', position: { x: 0.12442, y: 0.79341 }, width: 0.030,   height: 0.08333, type: 'staircase' },
  { id: 'F2_STAIR_NE', label: 'Stair',      floor: 'floor2', position: { x: 0.90087, y: 0.22026 }, width: 0.02672, height: 0.09473, type: 'staircase' },
  { id: 'F2_TOILET_N',  label: 'Toilet',    floor: 'floor2', position: { x: 0.48219, y: 0.14883 }, width: 0.09254, height: 0.040,   type: 'toilet' },
  { id: 'F2_TOILET_SW', label: 'Toilet',    floor: 'floor2', position: { x: 0.23472, y: 0.82014 }, width: 0.07693, height: 0.02787, type: 'toilet' },
  { id: 'F2_TOILET_SE', label: 'Toilet',    floor: 'floor2', position: { x: 0.93710, y: 0.70924 }, width: 0.04,    height: 0.08754, type: 'toilet' },

  // ── Inaccessible ──
  { id: 'F2_ROOF', label: 'Roof Garden', floor: 'floor2', position: { x: 0.56061, y: 0.53515 }, width: 0.39773, height: 0.30553, type: 'inaccessible' },
];

const entrances: Entrance[] = [
  { id: 'NW', floor: 'floor2', position: { x: 0.08861, y: 0.31982 } },
  { id: 'NE', floor: 'floor2', position: { x: 0.93251, y: 0.29196 } },
  { id: 'SW', floor: 'floor2', position: { x: 0.09045, y: 0.86574 } },
];

// Corridors — exactly as pulled from the floor plan (do NOT modify).
const corridors: Corridor[] = [
  {
    id: 'F2_CORR_NORTH',
    floor: 'floor2',
    path: [
      { x: 0.17309, y: 0.37049 },
      { x: 0.35308, y: 0.37175 },
      { x: 0.44582, y: 0.37049 },
      { x: 0.50918, y: 0.34009 },
      { x: 0.82232, y: 0.34262 },
    ],
  },
  {
    id: 'F2_CONN_NW',
    floor: 'floor2',
    path: [
      { x: 0.172, y: 0.227 },
      { x: 0.17126, y: 0.36795 },
    ],
  },
  {
    id: 'F2_CONN_NE',
    floor: 'floor2',
    path: [
      { x: 0.82599, y: 0.33756 },
      { x: 0.85997, y: 0.33756 },
      { x: 0.86180, y: 0.21976 },
      { x: 0.901, y: 0.22 },
    ],
  },
  {
    id: 'F2_CORR_EAST',
    floor: 'floor2',
    path: [
      { x: 0.82415, y: 0.34009 },
      { x: 0.82323, y: 0.89487 },
    ],
  },
  {
    id: 'F2_CORR_SOUTH',
    floor: 'floor2',
    path: [
      { x: 0.82048, y: 0.89614 },
      { x: 0.76722, y: 0.92274 },
      { x: 0.51194, y: 0.92654 },
      { x: 0.51102, y: 0.89867 },
      { x: 0.39532, y: 0.89867 },
      { x: 0.39532, y: 0.92654 },
      { x: 0.26400, y: 0.92654 },
      { x: 0.26400, y: 0.86067 },
      { x: 0.12442, y: 0.86194 },
    ],
  },
  {
    id: 'F2_CONN_SW',
    floor: 'floor2',
    path: [
      { x: 0.12351, y: 0.86067 },
      { x: 0.124, y: 0.793 },
    ],
  },
];

// ─── Graph ────────────────────────────────────────────
//
// Junction nodes sit exactly on corridor waypoints. Drop-in nodes sit on corridor
// segments at each room's centerline (x for horizontal corridors, y for vertical ones).
// Door→drop edges are perpendicular to the corridor.
//
// Corridor topology:
//   F2_CONN_NW[1] ≈ F2_CORR_NORTH[0]     at ~(0.172, 0.369)
//   F2_CORR_NORTH[4] ≈ F2_CORR_EAST[0] ≈ F2_CONN_NE[0]  at ~(0.823, 0.341)
//   F2_CORR_EAST[1] ≈ F2_CORR_SOUTH[0]    at ~(0.822, 0.895)
//   F2_CORR_SOUTH[8] ≈ F2_CONN_SW[0]      at ~(0.124, 0.861)

const nodes: GraphNode[] = [
  // ── Stair entry points ──
  { id: 'F2_STAIR_NW', position: { x: 0.17217, y: 0.22659 }, floor: 'floor2' },
  { id: 'F2_STAIR_SW', position: { x: 0.12442, y: 0.79341 }, floor: 'floor2' },
  { id: 'F2_STAIR_NE', position: { x: 0.90087, y: 0.22026 }, floor: 'floor2' },

  // ── F2_CONN_NW (top→bottom) ──
  { id: 'J_NW_TOP', position: { x: 0.172,    y: 0.227   }, floor: 'floor2' },
  { id: 'J_NW_BOT', position: { x: 0.17126,  y: 0.36795 }, floor: 'floor2' }, // joins F2_CORR_NORTH[0]

  // ── F2_CORR_NORTH (W→E) ──
  { id: 'J_N0', position: { x: 0.17309, y: 0.37049 }, floor: 'floor2' }, // = J_NW_BOT
  { id: 'J_N1', position: { x: 0.35308, y: 0.37175 }, floor: 'floor2' },
  { id: 'J_N2', position: { x: 0.44582, y: 0.37049 }, floor: 'floor2' },
  { id: 'J_N3', position: { x: 0.50918, y: 0.34009 }, floor: 'floor2' },
  { id: 'J_N4', position: { x: 0.82232, y: 0.34262 }, floor: 'floor2' }, // joins F2_CORR_EAST[0] + F2_CONN_NE[0]

  // ── F2_CONN_NE (W→E then N) ──
  { id: 'J_NE0', position: { x: 0.82599, y: 0.33756 }, floor: 'floor2' }, // = J_N4
  { id: 'J_NE1', position: { x: 0.85997, y: 0.33756 }, floor: 'floor2' },
  { id: 'J_NE2', position: { x: 0.86180, y: 0.21976 }, floor: 'floor2' },
  { id: 'J_NE3', position: { x: 0.901,   y: 0.22    }, floor: 'floor2' }, // near F2_STAIR_NE

  // ── F2_CORR_EAST (N→S) ──
  { id: 'J_E0', position: { x: 0.82415, y: 0.34009 }, floor: 'floor2' }, // = J_N4
  { id: 'J_E1', position: { x: 0.82323, y: 0.89487 }, floor: 'floor2' }, // joins F2_CORR_SOUTH[0]

  // ── F2_CORR_SOUTH (E→W zigzag) ──
  { id: 'J_S0', position: { x: 0.82048, y: 0.89614 }, floor: 'floor2' }, // = J_E1
  { id: 'J_S1', position: { x: 0.76722, y: 0.92274 }, floor: 'floor2' },
  { id: 'J_S2', position: { x: 0.51194, y: 0.92654 }, floor: 'floor2' },
  { id: 'J_S3', position: { x: 0.51102, y: 0.89867 }, floor: 'floor2' },
  { id: 'J_S4', position: { x: 0.39532, y: 0.89867 }, floor: 'floor2' },
  { id: 'J_S5', position: { x: 0.39532, y: 0.92654 }, floor: 'floor2' },
  { id: 'J_S6', position: { x: 0.26400, y: 0.92654 }, floor: 'floor2' },
  { id: 'J_S7', position: { x: 0.26400, y: 0.86067 }, floor: 'floor2' },
  { id: 'J_S8', position: { x: 0.12442, y: 0.86194 }, floor: 'floor2' }, // joins F2_CONN_SW[0]

  // ── F2_CONN_SW (S→N) ──
  { id: 'J_SW0', position: { x: 0.12351, y: 0.86067 }, floor: 'floor2' }, // = J_S8
  { id: 'J_SW1', position: { x: 0.124,   y: 0.793   }, floor: 'floor2' }, // near F2_STAIR_SW

  // ── Per-room drop-ins on F2_CORR_NORTH ──
  // Seg J_N0→J_N1  (y ≈ 0.370→0.372)
  { id: 'DROP_EB237', position: { x: 0.230, y: 0.371 }, floor: 'floor2' },
  { id: 'DROP_EB233', position: { x: 0.314, y: 0.372 }, floor: 'floor2' },
  { id: 'DROP_EB235', position: { x: 0.313, y: 0.372 }, floor: 'floor2' },
  { id: 'DROP_EB236', position: { x: 0.274, y: 0.371 }, floor: 'floor2' },
  { id: 'DROP_EB238', position: { x: 0.274, y: 0.371 }, floor: 'floor2' }, // same x as EB236
  // Seg J_N1→J_N2  (y ≈ 0.372→0.370)
  { id: 'DROP_EB231', position: { x: 0.395, y: 0.371 }, floor: 'floor2' },
  // Seg J_N2→J_N3  (y ≈ 0.370→0.340)
  { id: 'DROP_EB230', position: { x: 0.456, y: 0.357 }, floor: 'floor2' },
  { id: 'DROP_EB225', position: { x: 0.501, y: 0.344 }, floor: 'floor2' },
  { id: 'DROP_TOI_N', position: { x: 0.482, y: 0.350 }, floor: 'floor2' },
  // Seg J_N3→J_N4  (y ≈ 0.340→0.343)
  { id: 'DROP_EB211', position: { x: 0.641, y: 0.342 }, floor: 'floor2' },
  { id: 'DROP_EB222', position: { x: 0.546, y: 0.341 }, floor: 'floor2' },
  { id: 'DROP_EB220', position: { x: 0.586, y: 0.341 }, floor: 'floor2' },
  { id: 'DROP_EB216', position: { x: 0.628, y: 0.342 }, floor: 'floor2' },
  { id: 'DROP_EB214', position: { x: 0.668, y: 0.342 }, floor: 'floor2' },
  { id: 'DROP_EB212', position: { x: 0.708, y: 0.342 }, floor: 'floor2' },
  { id: 'DROP_EB210', position: { x: 0.746, y: 0.343 }, floor: 'floor2' },
  { id: 'DROP_EB206', position: { x: 0.789, y: 0.343 }, floor: 'floor2' },

  // ── Per-room drop-ins on F2_CORR_EAST (x ≈ 0.823) ──
  { id: 'DROP_EB241',  position: { x: 0.823, y: 0.390 }, floor: 'floor2' },
  { id: 'DROP_EB245',  position: { x: 0.823, y: 0.472 }, floor: 'floor2' },
  { id: 'DROP_EB247',  position: { x: 0.823, y: 0.555 }, floor: 'floor2' },
  { id: 'DROP_EB249',  position: { x: 0.823, y: 0.632 }, floor: 'floor2' },
  { id: 'DROP_EB251',  position: { x: 0.823, y: 0.688 }, floor: 'floor2' },
  { id: 'DROP_EB253',  position: { x: 0.823, y: 0.730 }, floor: 'floor2' },
  { id: 'DROP_EB257',  position: { x: 0.823, y: 0.767 }, floor: 'floor2' },
  { id: 'DROP_EB261',  position: { x: 0.823, y: 0.886 }, floor: 'floor2' },
  { id: 'DROP_TOI_SE', position: { x: 0.823, y: 0.709 }, floor: 'floor2' },

  // ── Per-room drop-ins on F2_CORR_SOUTH ──
  // Seg J_S1→J_S2  (y ≈ 0.925, x: 0.767→0.512)
  { id: 'DROP_EB265',  position: { x: 0.724, y: 0.925 }, floor: 'floor2' },
  { id: 'DROP_EB265A', position: { x: 0.687, y: 0.925 }, floor: 'floor2' },
  { id: 'DROP_EB269',  position: { x: 0.645, y: 0.925 }, floor: 'floor2' },
  { id: 'DROP_EB271',  position: { x: 0.562, y: 0.926 }, floor: 'floor2' },
  { id: 'DROP_EB274',  position: { x: 0.537, y: 0.926 }, floor: 'floor2' },
  // Seg J_S3→J_S4  (y ≈ 0.899, x: 0.511→0.395)
  { id: 'DROP_EB273',  position: { x: 0.480, y: 0.899 }, floor: 'floor2' },
  { id: 'DROP_EB275',  position: { x: 0.399, y: 0.899 }, floor: 'floor2' },
  // Seg J_S5→J_S6  (y ≈ 0.927, x: 0.395→0.264)
  { id: 'DROP_EB277',  position: { x: 0.316, y: 0.927 }, floor: 'floor2' },
  { id: 'DROP_EB279',  position: { x: 0.305, y: 0.927 }, floor: 'floor2' },
  // Seg J_S7→J_S8  (y ≈ 0.861, x: 0.264→0.124)
  { id: 'DROP_EB287',  position: { x: 0.208, y: 0.861 }, floor: 'floor2' },
  { id: 'DROP_EB283',  position: { x: 0.257, y: 0.861 }, floor: 'floor2' },
  { id: 'DROP_EB280',  position: { x: 0.214, y: 0.861 }, floor: 'floor2' },
  { id: 'DROP_EB282',  position: { x: 0.139, y: 0.861 }, floor: 'floor2' },
  { id: 'DROP_TOI_SW', position: { x: 0.235, y: 0.861 }, floor: 'floor2' },

  // ── Door nodes (one per room, at room center) ──
  { id: 'D_EB237',  position: { x: 0.23043, y: 0.25309 }, floor: 'floor2' },
  { id: 'D_EB239',  position: { x: 0.23038, y: 0.33706 }, floor: 'floor2' },
  { id: 'D_EB235',  position: { x: 0.31267, y: 0.33629 }, floor: 'floor2' },
  { id: 'D_EB233',  position: { x: 0.31359, y: 0.25321 }, floor: 'floor2' },
  { id: 'D_EB231',  position: { x: 0.39480, y: 0.26323 }, floor: 'floor2' },
  { id: 'D_EB211',  position: { x: 0.64142, y: 0.24636 }, floor: 'floor2' },
  { id: 'D_EB230',  position: { x: 0.45592, y: 0.20456 }, floor: 'floor2' },
  { id: 'D_EB225',  position: { x: 0.50092, y: 0.20456 }, floor: 'floor2' },
  { id: 'D_EB222',  position: { x: 0.54632, y: 0.36440 }, floor: 'floor2' },
  { id: 'D_EB220',  position: { x: 0.58576, y: 0.36479 }, floor: 'floor2' },
  { id: 'D_EB216',  position: { x: 0.62754, y: 0.36592 }, floor: 'floor2' },
  { id: 'D_EB214',  position: { x: 0.66820, y: 0.36598 }, floor: 'floor2' },
  { id: 'D_EB212',  position: { x: 0.70763, y: 0.36492 }, floor: 'floor2' },
  { id: 'D_EB210',  position: { x: 0.74628, y: 0.36630 }, floor: 'floor2' },
  { id: 'D_EB206',  position: { x: 0.78915, y: 0.36682 }, floor: 'floor2' },
  { id: 'D_EB236',  position: { x: 0.27364, y: 0.41735 }, floor: 'floor2' },
  { id: 'D_EB238',  position: { x: 0.27441, y: 0.52818 }, floor: 'floor2' },
  { id: 'D_EB241',  position: { x: 0.87792, y: 0.38992 }, floor: 'floor2' },
  { id: 'D_EB245',  position: { x: 0.87802, y: 0.47228 }, floor: 'floor2' },
  { id: 'D_EB247',  position: { x: 0.87756, y: 0.55478 }, floor: 'floor2' },
  { id: 'D_EB249',  position: { x: 0.87756, y: 0.63191 }, floor: 'floor2' },
  { id: 'D_EB251',  position: { x: 0.87756, y: 0.68791 }, floor: 'floor2' },
  { id: 'D_EB253',  position: { x: 0.87802, y: 0.73034 }, floor: 'floor2' },
  { id: 'D_EB257',  position: { x: 0.86088, y: 0.76744 }, floor: 'floor2' },
  { id: 'D_EB261',  position: { x: 0.87833, y: 0.88600 }, floor: 'floor2' },
  { id: 'D_EB265',  position: { x: 0.72421, y: 0.85417 }, floor: 'floor2' },
  { id: 'D_EB265A', position: { x: 0.68697, y: 0.77251 }, floor: 'floor2' },
  { id: 'D_EB269',  position: { x: 0.64478, y: 0.85417 }, floor: 'floor2' },
  { id: 'D_EB271',  position: { x: 0.56214, y: 0.85544 }, floor: 'floor2' },
  { id: 'D_EB274',  position: { x: 0.53673, y: 0.77327 }, floor: 'floor2' },
  { id: 'D_EB273',  position: { x: 0.47995, y: 0.81554 }, floor: 'floor2' },
  { id: 'D_EB275',  position: { x: 0.39868, y: 0.81427 }, floor: 'floor2' },
  { id: 'D_EB277',  position: { x: 0.31604, y: 0.81554 }, floor: 'floor2' },
  { id: 'D_EB279',  position: { x: 0.30456, y: 0.89820 }, floor: 'floor2' },
  { id: 'D_EB280',  position: { x: 0.21350, y: 0.91057 }, floor: 'floor2' },
  { id: 'D_EB282',  position: { x: 0.13912, y: 0.90754 }, floor: 'floor2' },
  { id: 'D_EB283',  position: { x: 0.25655, y: 0.77707 }, floor: 'floor2' },
  { id: 'D_EB287',  position: { x: 0.20799, y: 0.77707 }, floor: 'floor2' },
  { id: 'D_F2_TOILET_N',  position: { x: 0.48219, y: 0.14883 }, floor: 'floor2' },
  { id: 'D_F2_TOILET_SW', position: { x: 0.23472, y: 0.82014 }, floor: 'floor2' },
  { id: 'D_F2_TOILET_SE', position: { x: 0.93710, y: 0.70924 }, floor: 'floor2' },
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
  // ═══════════════════════════════════════════════
  // CORRIDOR BACKBONES (follow corridor polylines exactly)
  // ═══════════════════════════════════════════════

  // ── F2_CONN_NW ──
  edge('F2_STAIR_NW', 'J_NW_TOP'),
  edge('J_NW_TOP', 'J_NW_BOT'),
  edge('J_NW_BOT', 'J_N0'), // gap between CONN_NW end and NORTH start

  // ── F2_CORR_NORTH (with per-room drop-ins) ──
  edge('J_N0', 'DROP_EB237'),
  edge('DROP_EB237', 'DROP_EB236'),
  edge('DROP_EB236', 'DROP_EB238'),
  edge('DROP_EB238', 'DROP_EB235'),
  edge('DROP_EB235', 'DROP_EB233'),
  edge('DROP_EB235', 'J_N1'),
  edge('J_N1', 'DROP_EB231'),
  edge('DROP_EB231', 'J_N2'),
  edge('J_N2', 'DROP_EB230'),
  edge('DROP_EB230', 'DROP_TOI_N'),
  edge('DROP_TOI_N', 'DROP_EB225'),
  edge('DROP_EB225', 'J_N3'),
  edge('J_N3', 'DROP_EB222'),
  edge('DROP_EB222', 'DROP_EB220'),
  edge('DROP_EB220', 'DROP_EB216'),
  edge('DROP_EB216', 'DROP_EB211'),
  edge('DROP_EB211', 'DROP_EB214'),
  edge('DROP_EB214', 'DROP_EB212'),
  edge('DROP_EB212', 'DROP_EB210'),
  edge('DROP_EB210', 'DROP_EB206'),
  edge('DROP_EB206', 'J_N4'),
  edge('J_N4', 'J_NE0'), // join with F2_CONN_NE
  edge('J_N4', 'J_E0'),  // join with F2_CORR_EAST

  // ── F2_CONN_NE ──
  edge('J_NE0', 'J_NE1'),
  edge('J_NE1', 'J_NE2'),
  edge('J_NE2', 'J_NE3'),
  edge('J_NE3', 'F2_STAIR_NE'),

  // ── F2_CORR_EAST (with per-room drop-ins) ──
  edge('J_E0', 'DROP_EB241'),
  edge('DROP_EB241', 'DROP_EB245'),
  edge('DROP_EB245', 'DROP_EB247'),
  edge('DROP_EB247', 'DROP_EB249'),
  edge('DROP_EB249', 'DROP_EB251'),
  edge('DROP_EB251', 'DROP_TOI_SE'),
  edge('DROP_TOI_SE', 'DROP_EB253'),
  edge('DROP_EB253', 'DROP_EB257'),
  edge('DROP_EB257', 'DROP_EB261'),
  edge('DROP_EB261', 'J_E1'),
  edge('J_E1', 'J_S0'), // join with F2_CORR_SOUTH

  // ── F2_CORR_SOUTH (with per-room drop-ins) ──
  edge('J_S0', 'J_S1'),
  edge('J_S1', 'DROP_EB265'),
  edge('DROP_EB265', 'DROP_EB265A'),
  edge('DROP_EB265A', 'DROP_EB269'),
  edge('DROP_EB269', 'DROP_EB271'),
  edge('DROP_EB271', 'DROP_EB274'),
  edge('DROP_EB274', 'J_S2'),
  edge('J_S2', 'J_S3'),
  edge('J_S3', 'DROP_EB273'),
  edge('DROP_EB273', 'DROP_EB275'),
  edge('DROP_EB275', 'J_S4'),
  edge('J_S4', 'J_S5'),
  edge('J_S5', 'DROP_EB277'),
  edge('DROP_EB277', 'DROP_EB279'),
  edge('DROP_EB279', 'J_S6'),
  edge('J_S6', 'J_S7'),
  edge('J_S7', 'DROP_EB283'),
  edge('DROP_EB283', 'DROP_TOI_SW'),
  edge('DROP_TOI_SW', 'DROP_EB280'),
  edge('DROP_EB280', 'DROP_EB287'),
  edge('DROP_EB287', 'DROP_EB282'),
  edge('DROP_EB282', 'J_S8'),
  edge('J_S8', 'J_SW0'), // join with F2_CONN_SW

  // ── F2_CONN_SW ──
  edge('J_SW0', 'J_SW1'),
  edge('J_SW1', 'F2_STAIR_SW'),

  // ═══════════════════════════════════════════════
  // DOOR / FACILITY CONNECTIONS (perpendicular drops)
  // ═══════════════════════════════════════════════

  // North corridor drops north/south
  edge('DROP_EB237', 'D_EB237'),
  edge('D_EB237',   'D_EB239'),   // EB239 chained through EB237
  edge('DROP_EB235', 'D_EB235'),
  edge('DROP_EB233', 'D_EB233'),
  edge('DROP_EB236', 'D_EB236'),
  edge('DROP_EB238', 'D_EB238'),
  edge('DROP_EB231', 'D_EB231'),
  edge('DROP_EB230', 'D_EB230'),
  edge('DROP_EB225', 'D_EB225'),
  edge('DROP_TOI_N', 'D_F2_TOILET_N'),
  edge('DROP_EB211', 'D_EB211'),
  // Inner row (south of corridor)
  edge('DROP_EB222', 'D_EB222'),
  edge('DROP_EB220', 'D_EB220'),
  edge('DROP_EB216', 'D_EB216'),
  edge('DROP_EB214', 'D_EB214'),
  edge('DROP_EB212', 'D_EB212'),
  edge('DROP_EB210', 'D_EB210'),
  edge('DROP_EB206', 'D_EB206'),

  // East corridor drops east (horizontal)
  edge('DROP_EB241',  'D_EB241'),
  edge('DROP_EB245',  'D_EB245'),
  edge('DROP_EB247',  'D_EB247'),
  edge('DROP_EB249',  'D_EB249'),
  edge('DROP_EB251',  'D_EB251'),
  edge('DROP_TOI_SE', 'D_F2_TOILET_SE'),
  edge('DROP_EB253',  'D_EB253'),
  edge('DROP_EB257',  'D_EB257'),
  edge('DROP_EB261',  'D_EB261'),

  // South corridor drops north/south
  edge('DROP_EB265',  'D_EB265'),
  edge('DROP_EB265A', 'D_EB265A'),
  edge('DROP_EB269',  'D_EB269'),
  edge('DROP_EB271',  'D_EB271'),
  edge('DROP_EB274',  'D_EB274'),
  edge('DROP_EB273',  'D_EB273'),
  edge('DROP_EB275',  'D_EB275'),
  edge('DROP_EB277',  'D_EB277'),
  edge('DROP_EB279',  'D_EB279'),
  edge('DROP_EB287',  'D_EB287'),
  edge('DROP_EB283',  'D_EB283'),
  edge('DROP_EB280',  'D_EB280'),
  edge('DROP_EB282',  'D_EB282'),
  edge('DROP_TOI_SW', 'D_F2_TOILET_SW'),
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
