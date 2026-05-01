// ============================================================
// CampusCompass - Graph & Dijkstra Shortest Path
// ============================================================

import { GraphNode, GraphEdge, FloorId, EntranceId } from './types';
import { floor1Data } from '../data/floor1';
import { floor2Data } from '../data/floor2';
import { ROOM_PREFIX } from './constants';

// ---- Adjacency list representation ----

interface AdjEntry {
  to: string;
  weight: number;
}

type AdjList = Map<string, AdjEntry[]>;

/** Build adjacency list from edges (undirected graph) */
function buildAdjList(edges: GraphEdge[]): AdjList {
  const adj: AdjList = new Map();
  const addEdge = (from: string, to: string, w: number) => {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from)!.push({ to, weight: w });
  };
  for (const e of edges) {
    addEdge(e.from, e.to, e.weight);
    addEdge(e.to, e.from, e.weight);
  }
  return adj;
}

// ---- Cross-floor links ----

const crossFloorEdges: GraphEdge[] = [
  // Elevator NW: F1 ↔ F2
  { from: 'F1_ELEV_N', to: 'F2_ELEV_NW', weight: 0.15 },
  // Staircase NE
  { from: 'F1_STAIR_NE', to: 'F2_STAIR_NE', weight: 0.12 },
  // Staircase / Elevator SW
  { from: 'F1_STAIR_SW', to: 'F2_ELEV_SW', weight: 0.15 },
];

/** Merged adjacency list across both floors */
function buildFullGraph(): { adj: AdjList; allNodes: Map<string, GraphNode> } {
  const allEdges = [...floor1Data.edges, ...floor2Data.edges, ...crossFloorEdges];
  const adj = buildAdjList(allEdges);

  const allNodes = new Map<string, GraphNode>();
  for (const n of [...floor1Data.nodes, ...floor2Data.nodes]) {
    allNodes.set(n.id, n);
  }

  return { adj, allNodes };
}

// ---- Dijkstra ----

interface DijkstraResult {
  dist: Map<string, number>;
  prev: Map<string, string | null>;
}

function dijkstra(adj: AdjList, source: string): DijkstraResult {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  // Initialize
  for (const id of adj.keys()) {
    dist.set(id, Infinity);
    prev.set(id, null);
  }
  dist.set(source, 0);

  // Simple priority queue (adequate for our small graph ~100 nodes)
  while (true) {
    let u: string | null = null;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < best) {
        best = d;
        u = id;
      }
    }
    if (u === null) break;
    visited.add(u);

    for (const { to, weight } of adj.get(u) || []) {
      const alt = best + weight;
      if (alt < (dist.get(to) ?? Infinity)) {
        dist.set(to, alt);
        prev.set(to, u);
      }
    }
  }

  return { dist, prev };
}

/** Reconstruct path from Dijkstra result */
function reconstructPath(prev: Map<string, string | null>, target: string): string[] {
  const path: string[] = [];
  let cur: string | null = target;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  return path;
}

// ---- Public API ----

export interface RouteResult {
  path: GraphNode[];
  floors: FloorId[];
  totalWeight: number;
}

/** Resolve room number to door node ID */
function roomToDoorNode(roomId: string): string | null {
  return `D_${roomId}`;
}

/** Resolve entrance to graph node ID based on target floor context */
function entranceToNodeId(entrance: EntranceId, _targetFloor: FloorId): string {
  // On floor 1, entrances are directly NW/NE/SW
  // On floor 2, they map to F2_NW / F2_NE / F2_SW
  // But since the graph is cross-floor, we always start from floor 1 entrance
  return entrance;
}

/**
 * Find shortest route from an entrance to a room.
 * Returns null if no path exists.
 */
export function findRoute(entrance: EntranceId, roomId: string): RouteResult | null {
  const { adj, allNodes } = buildFullGraph();

  const sourceId = entranceToNodeId(entrance, 'floor1');
  const targetId = roomToDoorNode(roomId);

  if (!targetId || !adj.has(sourceId) || !adj.has(targetId)) {
    return null;
  }

  const { dist: distMap, prev } = dijkstra(adj, sourceId);
  const targetDist = distMap.get(targetId);

  if (targetDist === undefined || targetDist === Infinity) {
    return null;
  }

  const pathIds = reconstructPath(prev, targetId);
  const path: GraphNode[] = pathIds
    .map(id => allNodes.get(id))
    .filter((n): n is GraphNode => n !== undefined);

  // Determine which floors the route passes through
  const floors = [...new Set(path.map(n => n.floor))];

  return { path, floors, totalWeight: targetDist };
}

/** Get all valid room IDs across both floors */
export function getAllRoomIds(): string[] {
  return [...floor1Data.rooms, ...floor2Data.rooms]
    .filter(r => r.type === 'room' || r.type === 'toilet')
    .map(r => r.id);
}

/** Check if a room ID is valid */
export function isValidRoom(roomNumber: string): boolean {
  const roomId = roomNumber.startsWith(ROOM_PREFIX) ? roomNumber : `${ROOM_PREFIX}${roomNumber}`;
  return getAllRoomIds().includes(roomId);
}

/** Get the floor a room is on */
export function getRoomFloor(roomId: string): FloorId | null {
  if (floor1Data.rooms.find(r => r.id === roomId)) return 'floor1';
  if (floor2Data.rooms.find(r => r.id === roomId)) return 'floor2';
  return null;
}
