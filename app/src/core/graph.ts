import type { GraphNode, GraphEdge, FloorId, EntranceId, FloorData, RouteResult } from './types';
import { ROOM_PREFIX } from './constants';

interface AdjEntry {
  to: string;
  weight: number;
}

type AdjList = Map<string, AdjEntry[]>;

/** Cross-floor links (elevators / staircases between floor 1 and floor 2) */
const crossFloorEdges: GraphEdge[] = [
  { from: 'F1_ELEV_N', to: 'F2_ELEV_NW', weight: 0.15 },
  { from: 'F1_STAIR_NW', to: 'F2_ELEV_NW', weight: 0.15 },
  { from: 'F1_STAIR_NE', to: 'F2_STAIR_NE', weight: 0.12 },
  { from: 'F1_ELEV_E', to: 'F2_STAIR_SE', weight: 0.15 },
  { from: 'F1_STAIR_SW', to: 'F2_ELEV_SW', weight: 0.15 },
];

function buildAdjList(edges: GraphEdge[]): AdjList {
  const adj: AdjList = new Map();
  const addEdge = (from: string, to: string, w: number) => {
    const list = adj.get(from);
    if (list) list.push({ to, weight: w });
    else adj.set(from, [{ to, weight: w }]);
  };
  for (const e of edges) {
    addEdge(e.from, e.to, e.weight);
    addEdge(e.to, e.from, e.weight);
  }
  return adj;
}

interface BuiltGraph {
  adj: AdjList;
  nodes: Map<string, GraphNode>;
}

function buildFullGraph(floors: FloorData[]): BuiltGraph {
  const allEdges: GraphEdge[] = [];
  const nodes = new Map<string, GraphNode>();
  for (const floor of floors) {
    for (const e of floor.edges) allEdges.push(e);
    for (const n of floor.nodes) nodes.set(n.id, n);
  }
  for (const e of crossFloorEdges) allEdges.push(e);
  return { adj: buildAdjList(allEdges), nodes };
}

interface DijkstraResult {
  dist: Map<string, number>;
  prev: Map<string, string | null>;
}

function dijkstra(adj: AdjList, source: string): DijkstraResult {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const id of adj.keys()) {
    dist.set(id, Infinity);
    prev.set(id, null);
  }
  dist.set(source, 0);

  // Simple priority queue via linear scan — adequate for ~150 nodes
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

    const neighbours = adj.get(u);
    if (!neighbours) continue;
    for (const { to, weight } of neighbours) {
      const alt = best + weight;
      const cur = dist.get(to);
      if (alt < (cur ?? Infinity)) {
        dist.set(to, alt);
        prev.set(to, u);
      }
    }
  }

  return { dist, prev };
}

function reconstructPath(prev: Map<string, string | null>, target: string): string[] {
  const path: string[] = [];
  let cur: string | null = target;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  return path;
}

function roomToDoorNode(roomId: string): string {
  return `D_${roomId}`;
}

/** Resolve entrance id to its source node id in the merged graph (always floor 1 entrances). */
function entranceToNodeId(entrance: EntranceId): string {
  return entrance;
}

/** Find the shortest route from an entrance to a target room across both floors. */
export function findRoute(
  entrance: EntranceId,
  roomId: string,
  floors: FloorData[],
): RouteResult | null {
  const { adj, nodes } = buildFullGraph(floors);

  const sourceId = entranceToNodeId(entrance);
  const targetId = roomToDoorNode(roomId);

  if (!adj.has(sourceId) || !adj.has(targetId)) return null;

  const { dist, prev } = dijkstra(adj, sourceId);
  const targetDist = dist.get(targetId);
  if (targetDist === undefined || targetDist === Infinity) return null;

  const pathIds = reconstructPath(prev, targetId);
  const path: GraphNode[] = [];
  for (const id of pathIds) {
    const n = nodes.get(id);
    if (n) path.push(n);
  }

  const seenFloors = new Set<FloorId>();
  for (const n of path) seenFloors.add(n.floor);
  const floorList: FloorId[] = [...seenFloors];

  return { path, floors: floorList, totalWeight: targetDist };
}

/** All valid room IDs (rooms + toilets) across the supplied floors. */
export function getAllRoomIds(floors: FloorData[]): string[] {
  const ids: string[] = [];
  for (const floor of floors) {
    for (const r of floor.rooms) {
      if (r.type === 'room' || r.type === 'toilet') ids.push(r.id);
    }
  }
  return ids;
}

/** Validate a digit-only room number (e.g., "104") against floor data. */
export function isValidRoom(roomNumber: string, floors: FloorData[]): boolean {
  const roomId = roomNumber.startsWith(ROOM_PREFIX) ? roomNumber : `${ROOM_PREFIX}${roomNumber}`;
  return getAllRoomIds(floors).includes(roomId);
}

/** Resolve which floor a room id belongs to. */
export function getRoomFloor(roomId: string, floors: FloorData[]): FloorId | null {
  for (const floor of floors) {
    if (floor.rooms.some(r => r.id === roomId)) return floor.id;
  }
  return null;
}
