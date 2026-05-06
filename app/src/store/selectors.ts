import type { FloorId, FloorData, Room, Entrance, GraphNode, GraphEdge } from '../core/types';
import { distance } from '../core/coordinate';
import { floor1Data } from '../data/floor1';
import { floor2Data } from '../data/floor2';
import type { FloorOverrides } from './designStore';

const baseFloors: Record<FloorId, FloorData> = {
  floor1: floor1Data,
  floor2: floor2Data,
};

/** Returns base floor data without any design-mode overrides applied. */
export function getBaseFloorData(floor: FloorId): FloorData {
  return baseFloors[floor];
}

/** Apply design-mode overrides to a floor and recompute affected graph weights. */
export function applyOverrides(base: FloorData, overrides: FloorOverrides): FloorData {
  const roomOverrides = overrides.rooms;
  const entranceOverrides = overrides.entrances;

  const rooms: Room[] = base.rooms.map((r) => {
    const o = roomOverrides[r.id];
    if (!o) return r;
    return {
      ...r,
      position: o.position ?? r.position,
      width: o.width ?? r.width,
      height: o.height ?? r.height,
    };
  });

  const entrances: Entrance[] = base.entrances.map((e) => {
    const o = entranceOverrides[e.id];
    if (!o) return e;
    return { ...e, position: o.position ?? e.position };
  });

  // Door nodes follow the room they belong to. Entrance nodes follow the entrance.
  const nodes: GraphNode[] = base.nodes.map((n) => {
    if (n.id.startsWith('D_')) {
      const roomId = n.id.slice(2);
      const o = roomOverrides[roomId];
      if (o?.position) return { ...n, position: o.position };
    }
    if (n.id === 'NW' || n.id === 'NE' || n.id === 'SW') {
      const o = entranceOverrides[n.id];
      if (o?.position) return { ...n, position: o.position };
    }
    return n;
  });

  // Recompute edge weights from updated node positions.
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edges: GraphEdge[] = base.edges.map((e) => {
    const a = nodeMap.get(e.from);
    const b = nodeMap.get(e.to);
    if (!a || !b) return e;
    return { ...e, weight: distance(a.position, b.position) };
  });

  return { ...base, rooms, entrances, nodes, edges };
}

/** Floors as an array, in canonical order. */
export const ALL_FLOOR_IDS: FloorId[] = ['floor1', 'floor2'];
