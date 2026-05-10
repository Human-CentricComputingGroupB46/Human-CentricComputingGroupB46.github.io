// EB Building - Second Floor Data
// Coordinate system: normalized [0, 1] relative to floor plan bounds.

import type { FloorData, Room, Entrance, Corridor, GraphNode, GraphEdge } from '../core/types';

const rooms: Room[] = [
  // North row
  { id: 'EB237', label: 'EB237', floor: 'floor2', position: { x: 0.27133, y: 0.24283 }, width: 0.07969, height: 0.14773, type: 'room' },
  { id: 'EB239', label: 'EB239', floor: 'floor2', position: { x: 0.27036, y: 0.32885 }, width: 0.08010, height: 0.01873, type: 'room' },
  { id: 'EB235', label: 'EB235', floor: 'floor2', position: { x: 0.34900, y: 0.32854 }, width: 0.06958, height: 0.02088, type: 'room' },
  { id: 'EB233', label: 'EB233', floor: 'floor2', position: { x: 0.34831, y: 0.24283 }, width: 0.06866, height: 0.14543, type: 'room' },
  { id: 'EB231', label: 'EB231', floor: 'floor2', position: { x: 0.42281, y: 0.24955 }, width: 0.07124, height: 0.18066, type: 'room' },
  { id: 'EB211', label: 'EB211', floor: 'floor2', position: { x: 0.67698, y: 0.23003 }, width: 0.25669, height: 0.15463, type: 'room' },

  // North inner rooms
  { id: 'EB230', label: 'EB230', floor: 'floor2', position: { x: 0.47791, y: 0.18638 }, width: 0.04, height: 0.065, type: 'room' },
  { id: 'EB225', label: 'EB225', floor: 'floor2', position: { x: 0.52274, y: 0.18638 }, width: 0.045, height: 0.065, type: 'room' },

  // Inner row
  { id: 'EB222', label: 'EB222', floor: 'floor2', position: { x: 0.56366, y: 0.35305 }, width: 0.04122, height: 0.03113, type: 'room' },
  { id: 'EB220', label: 'EB220', floor: 'floor2', position: { x: 0.60076, y: 0.35153 }, width: 0.03745, height: 0.03261, type: 'room' },
  { id: 'EB216', label: 'EB216', floor: 'floor2', position: { x: 0.63754, y: 0.35153 }, width: 0.04020, height: 0.03261, type: 'room' },
  { id: 'EB214', label: 'EB214', floor: 'floor2', position: { x: 0.67727, y: 0.35111 }, width: 0.03640, height: 0.03344, type: 'room' },
  { id: 'EB212', label: 'EB212', floor: 'floor2', position: { x: 0.71263, y: 0.35092 }, width: 0.03837, height: 0.03113, type: 'room' },
  { id: 'EB210', label: 'EB210', floor: 'floor2', position: { x: 0.74881, y: 0.35172 }, width: 0.03525, height: 0.03229, type: 'room' },
  { id: 'EB206', label: 'EB206', floor: 'floor2', position: { x: 0.78451, y: 0.35319 }, width: 0.03773, height: 0.03523, type: 'room' },

  // West block
  { id: 'EB236', label: 'EB236', floor: 'floor2', position: { x: 0.31128, y: 0.41084 }, width: 0.09826, height: 0.02873, type: 'room' },
  { id: 'EB238', label: 'EB238', floor: 'floor2', position: { x: 0.30544, y: 0.52643 }, width: 0.15915, height: 0.19129, type: 'room' },

  // East column
  { id: 'EB241', label: 'EB241', floor: 'floor2', position: { x: 0.86722, y: 0.37993 }, width: 0.07313, height: 0.07940, type: 'room' },
  { id: 'EB245', label: 'EB245', floor: 'floor2', position: { x: 0.86569, y: 0.46864 }, width: 0.07006, height: 0.08200, type: 'room' },
  { id: 'EB247', label: 'EB247', floor: 'floor2', position: { x: 0.86641, y: 0.55618 }, width: 0.07149, height: 0.08030, type: 'room' },
  { id: 'EB249', label: 'EB249', floor: 'floor2', position: { x: 0.86456, y: 0.63799 }, width: 0.07252, height: 0.07629, type: 'room' },
  { id: 'EB251', label: 'EB251', floor: 'floor2', position: { x: 0.86643, y: 0.69713 }, width: 0.07155, height: 0.03900, type: 'room' },
  { id: 'EB253', label: 'EB253', floor: 'floor2', position: { x: 0.86574, y: 0.74552 }, width: 0.06914, height: 0.03753, type: 'room' },
  { id: 'EB257', label: 'EB257', floor: 'floor2', position: { x: 0.84853, y: 0.78315 }, width: 0.03769, height: 0.02887, type: 'room' },
  { id: 'EB261', label: 'EB261', floor: 'floor2', position: { x: 0.86574, y: 0.91487 }, width: 0.07144, height: 0.11217, type: 'room' },

  // South row
  { id: 'EB265', label: 'EB265', floor: 'floor2', position: { x: 0.72475, y: 0.87832 }, width: 0.06954, height: 0.12419, type: 'room' },
  { id: 'EB265A', label: 'EB265A', floor: 'floor2', position: { x: 0.68937, y: 0.78853 }, width: 0.05214, height: 0.04407, type: 'room' },
  { id: 'EB269', label: 'EB269', floor: 'floor2', position: { x: 0.57243, y: 0.87903 }, width: 0.07591, height: 0.12546, type: 'room' },
  { id: 'EB271', label: 'EB271', floor: 'floor2', position: { x: 0.64998, y: 0.87900 }, width: 0.07487, height: 0.12717, type: 'room' },
  { id: 'EB273', label: 'EB273', floor: 'floor2', position: { x: 0.49643, y: 0.83961 }, width: 0.06960, height: 0.14302, type: 'room' },
  { id: 'EB275', label: 'EB275', floor: 'floor2', position: { x: 0.42140, y: 0.83826 }, width: 0.07384, height: 0.14310, type: 'room' },
  { id: 'EB277', label: 'EB277', floor: 'floor2', position: { x: 0.34734, y: 0.83692 }, width: 0.07252, height: 0.14010, type: 'room' },
  { id: 'EB279', label: 'EB279', floor: 'floor2', position: { x: 0.33564, y: 0.92697 }, width: 0.06030, height: 0.02880, type: 'room' },

  // SW corner cluster
  { id: 'EB280', label: 'EB280', floor: 'floor2', position: { x: 0.24600, y: 0.93772 }, width: 0.04, height: 0.05927, type: 'room' },
  { id: 'EB282', label: 'EB282', floor: 'floor2', position: { x: 0.16522, y: 0.93772 }, width: 0.05436, height: 0.06000, type: 'room' },
  { id: 'EB283', label: 'EB283', floor: 'floor2', position: { x: 0.28887, y: 0.79525 }, width: 0.04061, height: 0.05320, type: 'room' },
  { id: 'EB287', label: 'EB287', floor: 'floor2', position: { x: 0.24405, y: 0.79794 }, width: 0.03415, height: 0.05841, type: 'room' },

  // Facilities
  { id: 'F2_STAIR_NW', label: 'Stair', floor: 'floor2', position: { x: 0.15342, y: 0.21729 }, width: 0.03, height: 0.08966, type: 'staircase' },
  { id: 'F2_STAIR_SW', label: 'Stair', floor: 'floor2', position: { x: 0.15440, y: 0.80869 }, width: 0.03, height: 0.08333, type: 'staircase' },
  { id: 'F2_STAIR_NE', label: 'Stair', floor: 'floor2', position: { x: 0.88718, y: 0.20116 }, width: 0.02672, height: 0.09473, type: 'staircase' },
  { id: 'F2_TOILET_N', label: 'Toilet', floor: 'floor2', position: { x: 0.50325, y: 0.17025 }, width: 0.09254, height: 0.03210, type: 'toilet' },
  { id: 'F2_TOILET_SW', label: 'Toilet', floor: 'floor2', position: { x: 0.27036, y: 0.78450 }, width: 0.07693, height: 0.02787, type: 'toilet' },
  { id: 'F2_TOILET_SE', label: 'Toilet', floor: 'floor2', position: { x: 0.88425, y: 0.72401 }, width: 0.03267, height: 0.08754, type: 'toilet' },

  // Inaccessible
  { id: 'F2_ROOF', label: 'Roof Garden', floor: 'floor2', position: { x: 0.59582, y: 0.55959 }, width: 0.41316, height: 0.37185, type: 'inaccessible' },
];

const entrances: Entrance[] = [
  { id: 'NW', floor: 'floor2', position: { x: 0.08132, y: 0.31676 } },
  { id: 'NE', floor: 'floor2', position: { x: 0.93687, y: 0.34095 } },
  { id: 'SW', floor: 'floor2', position: { x: 0.07839, y: 0.87993 } },
];

const corridors: Corridor[] = [
  {
    id: 'F2_CORR_NORTH',
    floor: 'floor2',
    path: [
      { x: 0.17291, y: 0.36246 }, // J_N0
      { x: 0.27036, y: 0.36246 }, // DROP_EB239
      { x: 0.27133, y: 0.36246 }, // DROP_EB237
      { x: 0.31128, y: 0.36246 }, // DROP_EB236 / DROP_EB238
      { x: 0.34900, y: 0.36246 }, // DROP_EB235 / DROP_EB233
      { x: 0.35026, y: 0.36246 }, // J_N1
      { x: 0.42281, y: 0.36246 }, // DROP_EB231
      { x: 0.44186, y: 0.36246 }, // J_N2
      { x: 0.47791, y: 0.33881 }, // DROP_EB230
      { x: 0.50130, y: 0.32348 }, // DROP_TOI_N / J_N3
      { x: 0.52274, y: 0.32348 }, // DROP_EB225
      { x: 0.56366, y: 0.32348 }, // DROP_EB222
      { x: 0.60076, y: 0.32348 }, // DROP_EB220
      { x: 0.63754, y: 0.32348 }, // DROP_EB216
      { x: 0.67698, y: 0.32348 }, // DROP_EB211
      { x: 0.67727, y: 0.32348 }, // DROP_EB214
      { x: 0.71263, y: 0.32348 }, // DROP_EB212
      { x: 0.74881, y: 0.32348 }, // DROP_EB210
      { x: 0.78451, y: 0.32348 }, // DROP_EB206
      { x: 0.81799, y: 0.32348 }, // J_N4
    ],
  },
  {
    id: 'F2_CONN_NW',
    floor: 'floor2',
    path: [
      { x: 0.17291, y: 0.22700 }, // J_NW_TOP
      { x: 0.17291, y: 0.36246 }, // J_NW_BOT
    ],
  },
  {
    id: 'F2_CONN_NE',
    floor: 'floor2',
    path: [
      { x: 0.81799, y: 0.32348 }, // J_NE0
      { x: 0.85405, y: 0.32348 }, // J_NE1
      { x: 0.85405, y: 0.24552 }, // J_NE2
      { x: 0.89984, y: 0.24552 }, // J_NE3
    ],
  },
  {
    id: 'F2_CORR_EAST',
    floor: 'floor2',
    path: [
      { x: 0.81799, y: 0.32348 }, // J_E0
      { x: 0.81799, y: 0.37993 }, // DROP_EB241
      { x: 0.81799, y: 0.46864 }, // DROP_EB245
      { x: 0.81799, y: 0.55618 }, // DROP_EB247
      { x: 0.81799, y: 0.63799 }, // DROP_EB249
      { x: 0.81799, y: 0.69713 }, // DROP_EB251
      { x: 0.81799, y: 0.72401 }, // DROP_TOI_SE
      { x: 0.81799, y: 0.74552 }, // DROP_EB253
      { x: 0.81799, y: 0.78315 }, // DROP_EB257
      { x: 0.81799, y: 0.90143 }, // DROP_EB261 / J_E1
    ],
  },
  {
    id: 'F2_CORR_SOUTH',
    floor: 'floor2',
    path: [
      { x: 0.81799, y: 0.90143 }, // J_S0
      { x: 0.75660, y: 0.95654 }, // J_S1
      { x: 0.72475, y: 0.95654 }, // DROP_EB265
      { x: 0.68937, y: 0.95654 }, // DROP_EB265A
      { x: 0.64998, y: 0.95654 }, // DROP_EB271
      { x: 0.57243, y: 0.95654 }, // DROP_EB269
      { x: 0.52274, y: 0.95654 }, // J_S2
      { x: 0.52274, y: 0.92832 }, // J_S3
      { x: 0.49643, y: 0.92832 }, // DROP_EB273
      { x: 0.42919, y: 0.92832 }, // J_S4
      { x: 0.42919, y: 0.95654 }, // J_S5
      { x: 0.34734, y: 0.95654 }, // DROP_EB277
      { x: 0.33564, y: 0.95654 }, // DROP_EB279
      { x: 0.28790, y: 0.95654 }, // J_S6
      { x: 0.28790, y: 0.88262 }, // J_S7 / DROP_EB283
      { x: 0.27036, y: 0.88262 }, // DROP_TOI_SW
      { x: 0.24600, y: 0.88262 }, // DROP_EB280
      { x: 0.24405, y: 0.88262 }, // DROP_EB287
      { x: 0.18168, y: 0.88262 }, // DROP_EB282 / J_S8
    ],
  },
  {
    id: 'F2_CONN_SW',
    floor: 'floor2',
    path: [
      { x: 0.18168, y: 0.88262 }, // J_SW0
      { x: 0.18168, y: 0.84633 }, // J_SW1
    ],
  },
];

const nodes: GraphNode[] = [
  // Stair entry points
  { id: 'F2_STAIR_NW', position: { x: 0.15342, y: 0.21729 }, floor: 'floor2' },
  { id: 'F2_STAIR_SW', position: { x: 0.15440, y: 0.80869 }, floor: 'floor2' },
  { id: 'F2_STAIR_NE', position: { x: 0.88718, y: 0.20116 }, floor: 'floor2' },

  // Corridor junctions
  { id: 'J_NW_TOP', position: { x: 0.17291, y: 0.22700 }, floor: 'floor2' },
  { id: 'J_NW_BOT', position: { x: 0.17291, y: 0.36246 }, floor: 'floor2' },
  { id: 'J_N0', position: { x: 0.17291, y: 0.36246 }, floor: 'floor2' },
  { id: 'J_N1', position: { x: 0.35026, y: 0.36246 }, floor: 'floor2' },
  { id: 'J_N2', position: { x: 0.44186, y: 0.36246 }, floor: 'floor2' },
  { id: 'J_N3', position: { x: 0.50130, y: 0.32348 }, floor: 'floor2' },
  { id: 'J_N4', position: { x: 0.81799, y: 0.32348 }, floor: 'floor2' },
  { id: 'J_NE0', position: { x: 0.81799, y: 0.32348 }, floor: 'floor2' },
  { id: 'J_NE1', position: { x: 0.85405, y: 0.32348 }, floor: 'floor2' },
  { id: 'J_NE2', position: { x: 0.85405, y: 0.24552 }, floor: 'floor2' },
  { id: 'J_NE3', position: { x: 0.89984, y: 0.24552 }, floor: 'floor2' },
  { id: 'J_E0', position: { x: 0.81799, y: 0.32348 }, floor: 'floor2' },
  { id: 'J_E1', position: { x: 0.81799, y: 0.90143 }, floor: 'floor2' },
  { id: 'J_S0', position: { x: 0.81799, y: 0.90143 }, floor: 'floor2' },
  { id: 'J_S1', position: { x: 0.75660, y: 0.95654 }, floor: 'floor2' },
  { id: 'J_S2', position: { x: 0.52274, y: 0.95654 }, floor: 'floor2' },
  { id: 'J_S3', position: { x: 0.52274, y: 0.92832 }, floor: 'floor2' },
  { id: 'J_S4', position: { x: 0.42919, y: 0.92832 }, floor: 'floor2' },
  { id: 'J_S5', position: { x: 0.42919, y: 0.95654 }, floor: 'floor2' },
  { id: 'J_S6', position: { x: 0.28790, y: 0.95654 }, floor: 'floor2' },
  { id: 'J_S7', position: { x: 0.28790, y: 0.88262 }, floor: 'floor2' },
  { id: 'J_S8', position: { x: 0.18168, y: 0.88262 }, floor: 'floor2' },
  { id: 'J_SW0', position: { x: 0.18168, y: 0.88262 }, floor: 'floor2' },
  { id: 'J_SW1', position: { x: 0.18168, y: 0.84633 }, floor: 'floor2' },

  // North corridor drop-ins
  { id: 'DROP_EB239', position: { x: 0.27036, y: 0.36246 }, floor: 'floor2' },
  { id: 'DROP_EB237', position: { x: 0.27133, y: 0.36246 }, floor: 'floor2' },
  { id: 'DROP_EB236', position: { x: 0.31128, y: 0.36246 }, floor: 'floor2' },
  { id: 'DROP_EB238', position: { x: 0.31128, y: 0.36246 }, floor: 'floor2' },
  { id: 'DROP_EB235', position: { x: 0.34900, y: 0.36246 }, floor: 'floor2' },
  { id: 'DROP_EB233', position: { x: 0.34900, y: 0.36246 }, floor: 'floor2' },
  { id: 'DROP_EB231', position: { x: 0.42281, y: 0.36246 }, floor: 'floor2' },
  { id: 'DROP_EB230', position: { x: 0.47791, y: 0.33881 }, floor: 'floor2' },
  { id: 'DROP_TOI_N', position: { x: 0.50130, y: 0.32348 }, floor: 'floor2' },
  { id: 'DROP_EB225', position: { x: 0.52274, y: 0.32348 }, floor: 'floor2' },
  { id: 'DROP_EB222', position: { x: 0.56366, y: 0.32348 }, floor: 'floor2' },
  { id: 'DROP_EB220', position: { x: 0.60076, y: 0.32348 }, floor: 'floor2' },
  { id: 'DROP_EB216', position: { x: 0.63754, y: 0.32348 }, floor: 'floor2' },
  { id: 'DROP_EB211', position: { x: 0.67698, y: 0.32348 }, floor: 'floor2' },
  { id: 'DROP_EB214', position: { x: 0.67727, y: 0.32348 }, floor: 'floor2' },
  { id: 'DROP_EB212', position: { x: 0.71263, y: 0.32348 }, floor: 'floor2' },
  { id: 'DROP_EB210', position: { x: 0.74881, y: 0.32348 }, floor: 'floor2' },
  { id: 'DROP_EB206', position: { x: 0.78451, y: 0.32348 }, floor: 'floor2' },

  // East corridor drop-ins
  { id: 'DROP_EB241', position: { x: 0.81799, y: 0.37993 }, floor: 'floor2' },
  { id: 'DROP_EB245', position: { x: 0.81799, y: 0.46864 }, floor: 'floor2' },
  { id: 'DROP_EB247', position: { x: 0.81799, y: 0.55618 }, floor: 'floor2' },
  { id: 'DROP_EB249', position: { x: 0.81799, y: 0.63799 }, floor: 'floor2' },
  { id: 'DROP_EB251', position: { x: 0.81799, y: 0.69713 }, floor: 'floor2' },
  { id: 'DROP_TOI_SE', position: { x: 0.81799, y: 0.72401 }, floor: 'floor2' },
  { id: 'DROP_EB253', position: { x: 0.81799, y: 0.74552 }, floor: 'floor2' },
  { id: 'DROP_EB257', position: { x: 0.81799, y: 0.78315 }, floor: 'floor2' },
  { id: 'DROP_EB261', position: { x: 0.81799, y: 0.90143 }, floor: 'floor2' },

  // South corridor drop-ins
  { id: 'DROP_EB265', position: { x: 0.72475, y: 0.95654 }, floor: 'floor2' },
  { id: 'DROP_EB265A', position: { x: 0.68937, y: 0.95654 }, floor: 'floor2' },
  { id: 'DROP_EB271', position: { x: 0.64998, y: 0.95654 }, floor: 'floor2' },
  { id: 'DROP_EB269', position: { x: 0.57243, y: 0.95654 }, floor: 'floor2' },
  { id: 'DROP_EB273', position: { x: 0.49643, y: 0.92832 }, floor: 'floor2' },
  { id: 'DROP_EB275', position: { x: 0.42140, y: 0.92832 }, floor: 'floor2' },
  { id: 'DROP_EB277', position: { x: 0.34734, y: 0.95654 }, floor: 'floor2' },
  { id: 'DROP_EB279', position: { x: 0.33564, y: 0.95654 }, floor: 'floor2' },
  { id: 'DROP_EB283', position: { x: 0.28790, y: 0.88262 }, floor: 'floor2' },
  { id: 'DROP_TOI_SW', position: { x: 0.27036, y: 0.88262 }, floor: 'floor2' },
  { id: 'DROP_EB280', position: { x: 0.24600, y: 0.88262 }, floor: 'floor2' },
  { id: 'DROP_EB287', position: { x: 0.24405, y: 0.88262 }, floor: 'floor2' },
  { id: 'DROP_EB282', position: { x: 0.18168, y: 0.88262 }, floor: 'floor2' },

  // Door nodes
  { id: 'D_EB237', position: { x: 0.27133, y: 0.24283 }, floor: 'floor2' },
  { id: 'D_EB239', position: { x: 0.27036, y: 0.32885 }, floor: 'floor2' },
  { id: 'D_EB235', position: { x: 0.34900, y: 0.32854 }, floor: 'floor2' },
  { id: 'D_EB233', position: { x: 0.34831, y: 0.24283 }, floor: 'floor2' },
  { id: 'D_EB231', position: { x: 0.42281, y: 0.24955 }, floor: 'floor2' },
  { id: 'D_EB211', position: { x: 0.67698, y: 0.23003 }, floor: 'floor2' },
  { id: 'D_EB230', position: { x: 0.47791, y: 0.18638 }, floor: 'floor2' },
  { id: 'D_EB225', position: { x: 0.52274, y: 0.18638 }, floor: 'floor2' },
  { id: 'D_EB222', position: { x: 0.56366, y: 0.35305 }, floor: 'floor2' },
  { id: 'D_EB220', position: { x: 0.60076, y: 0.35153 }, floor: 'floor2' },
  { id: 'D_EB216', position: { x: 0.63754, y: 0.35153 }, floor: 'floor2' },
  { id: 'D_EB214', position: { x: 0.67727, y: 0.35111 }, floor: 'floor2' },
  { id: 'D_EB212', position: { x: 0.71263, y: 0.35092 }, floor: 'floor2' },
  { id: 'D_EB210', position: { x: 0.74881, y: 0.35172 }, floor: 'floor2' },
  { id: 'D_EB206', position: { x: 0.78451, y: 0.35319 }, floor: 'floor2' },
  { id: 'D_EB236', position: { x: 0.31128, y: 0.41084 }, floor: 'floor2' },
  { id: 'D_EB238', position: { x: 0.30544, y: 0.52643 }, floor: 'floor2' },
  { id: 'D_EB241', position: { x: 0.86722, y: 0.37993 }, floor: 'floor2' },
  { id: 'D_EB245', position: { x: 0.86569, y: 0.46864 }, floor: 'floor2' },
  { id: 'D_EB247', position: { x: 0.86641, y: 0.55618 }, floor: 'floor2' },
  { id: 'D_EB249', position: { x: 0.86456, y: 0.63799 }, floor: 'floor2' },
  { id: 'D_EB251', position: { x: 0.86643, y: 0.69713 }, floor: 'floor2' },
  { id: 'D_EB253', position: { x: 0.86574, y: 0.74552 }, floor: 'floor2' },
  { id: 'D_EB257', position: { x: 0.84853, y: 0.78315 }, floor: 'floor2' },
  { id: 'D_EB261', position: { x: 0.86574, y: 0.91487 }, floor: 'floor2' },
  { id: 'D_EB265', position: { x: 0.72475, y: 0.87832 }, floor: 'floor2' },
  { id: 'D_EB265A', position: { x: 0.68937, y: 0.78853 }, floor: 'floor2' },
  { id: 'D_EB269', position: { x: 0.57243, y: 0.87903 }, floor: 'floor2' },
  { id: 'D_EB271', position: { x: 0.64998, y: 0.87900 }, floor: 'floor2' },
  { id: 'D_EB273', position: { x: 0.49643, y: 0.83961 }, floor: 'floor2' },
  { id: 'D_EB275', position: { x: 0.42140, y: 0.83826 }, floor: 'floor2' },
  { id: 'D_EB277', position: { x: 0.34734, y: 0.83692 }, floor: 'floor2' },
  { id: 'D_EB279', position: { x: 0.33564, y: 0.92697 }, floor: 'floor2' },
  { id: 'D_EB280', position: { x: 0.24600, y: 0.93772 }, floor: 'floor2' },
  { id: 'D_EB282', position: { x: 0.16522, y: 0.93772 }, floor: 'floor2' },
  { id: 'D_EB283', position: { x: 0.28887, y: 0.79525 }, floor: 'floor2' },
  { id: 'D_EB287', position: { x: 0.24405, y: 0.79794 }, floor: 'floor2' },
  { id: 'D_F2_TOILET_N', position: { x: 0.50325, y: 0.17025 }, floor: 'floor2' },
  { id: 'D_F2_TOILET_SW', position: { x: 0.27036, y: 0.78450 }, floor: 'floor2' },
  { id: 'D_F2_TOILET_SE', position: { x: 0.88425, y: 0.72401 }, floor: 'floor2' },
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
  // Corridor backbones
  edge('F2_STAIR_NW', 'J_NW_TOP'),
  edge('J_NW_TOP', 'J_NW_BOT'),
  edge('J_NW_BOT', 'J_N0'),

  edge('J_N0', 'DROP_EB239'),
  edge('DROP_EB239', 'DROP_EB237'),
  edge('DROP_EB237', 'DROP_EB236'),
  edge('DROP_EB236', 'DROP_EB238'),
  edge('DROP_EB238', 'DROP_EB235'),
  edge('DROP_EB235', 'DROP_EB233'),
  edge('DROP_EB233', 'J_N1'),
  edge('J_N1', 'DROP_EB231'),
  edge('DROP_EB231', 'J_N2'),
  edge('J_N2', 'DROP_EB230'),
  edge('DROP_EB230', 'DROP_TOI_N'),
  edge('DROP_TOI_N', 'J_N3'),
  edge('J_N3', 'DROP_EB225'),
  edge('DROP_EB225', 'DROP_EB222'),
  edge('DROP_EB222', 'DROP_EB220'),
  edge('DROP_EB220', 'DROP_EB216'),
  edge('DROP_EB216', 'DROP_EB211'),
  edge('DROP_EB211', 'DROP_EB214'),
  edge('DROP_EB214', 'DROP_EB212'),
  edge('DROP_EB212', 'DROP_EB210'),
  edge('DROP_EB210', 'DROP_EB206'),
  edge('DROP_EB206', 'J_N4'),
  edge('J_N4', 'J_NE0'),
  edge('J_N4', 'J_E0'),

  edge('J_NE0', 'J_NE1'),
  edge('J_NE1', 'J_NE2'),
  edge('J_NE2', 'J_NE3'),
  edge('J_NE3', 'F2_STAIR_NE'),

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
  edge('J_E1', 'J_S0'),

  edge('J_S0', 'J_S1'),
  edge('J_S1', 'DROP_EB265'),
  edge('DROP_EB265', 'DROP_EB265A'),
  edge('DROP_EB265A', 'DROP_EB271'),
  edge('DROP_EB271', 'DROP_EB269'),
  edge('DROP_EB269', 'J_S2'),
  edge('J_S2', 'J_S3'),
  edge('J_S3', 'DROP_EB273'),
  edge('DROP_EB273', 'J_S4'),
  edge('J_S4', 'DROP_EB275'),
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
  edge('J_S8', 'J_SW0'),

  edge('J_SW0', 'J_SW1'),
  edge('J_SW1', 'F2_STAIR_SW'),

  // Door / facility connections
  edge('DROP_EB237', 'D_EB237'),
  edge('DROP_EB239', 'D_EB239'),
  edge('DROP_EB235', 'D_EB235'),
  edge('DROP_EB233', 'D_EB233'),
  edge('DROP_EB236', 'D_EB236'),
  edge('DROP_EB238', 'D_EB238'),
  edge('DROP_EB231', 'D_EB231'),
  edge('DROP_EB230', 'D_EB230'),
  edge('DROP_EB225', 'D_EB225'),
  edge('DROP_TOI_N', 'D_F2_TOILET_N'),
  edge('DROP_EB211', 'D_EB211'),
  edge('DROP_EB222', 'D_EB222'),
  edge('DROP_EB220', 'D_EB220'),
  edge('DROP_EB216', 'D_EB216'),
  edge('DROP_EB214', 'D_EB214'),
  edge('DROP_EB212', 'D_EB212'),
  edge('DROP_EB210', 'D_EB210'),
  edge('DROP_EB206', 'D_EB206'),

  edge('DROP_EB241', 'D_EB241'),
  edge('DROP_EB245', 'D_EB245'),
  edge('DROP_EB247', 'D_EB247'),
  edge('DROP_EB249', 'D_EB249'),
  edge('DROP_EB251', 'D_EB251'),
  edge('DROP_TOI_SE', 'D_F2_TOILET_SE'),
  edge('DROP_EB253', 'D_EB253'),
  edge('DROP_EB257', 'D_EB257'),
  edge('DROP_EB261', 'D_EB261'),

  edge('DROP_EB265', 'D_EB265'),
  edge('DROP_EB265A', 'D_EB265A'),
  edge('DROP_EB269', 'D_EB269'),
  edge('DROP_EB271', 'D_EB271'),
  edge('DROP_EB273', 'D_EB273'),
  edge('DROP_EB275', 'D_EB275'),
  edge('DROP_EB277', 'D_EB277'),
  edge('DROP_EB279', 'D_EB279'),
  edge('DROP_EB287', 'D_EB287'),
  edge('DROP_EB283', 'D_EB283'),
  edge('DROP_EB280', 'D_EB280'),
  edge('DROP_EB282', 'D_EB282'),
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
