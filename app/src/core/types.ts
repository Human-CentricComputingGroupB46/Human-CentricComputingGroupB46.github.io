export type FloorId = 'floor1' | 'floor2';

export type EntranceId = 'NW' | 'NE' | 'SW';

/** Normalized 2D point in floor space (x, y ∈ [0, 1]) */
export interface Point {
  x: number;
  y: number;
}

export type RoomType =
  | 'room'
  | 'toilet'
  | 'elevator'
  | 'staircase'
  | 'inaccessible'
  | 'entrance';

export interface Room {
  id: string;
  label: string;
  floor: FloorId;
  position: Point;
  width: number;
  height: number;
  type: RoomType;
}

export interface Entrance {
  id: EntranceId;
  floor: FloorId;
  position: Point;
}

export interface Corridor {
  id: string;
  floor: FloorId;
  path: Point[];
}

export interface GraphNode {
  id: string;
  position: Point;
  floor: FloorId;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface FloorData {
  id: FloorId;
  label: string;
  rooms: Room[];
  entrances: Entrance[];
  corridors: Corridor[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Per-floor floor-plan image metadata */
export interface FloorPlanMeta {
  src: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
}

export interface MapDetailLine {
  id: string;
  path: Point[];
  strokeWidth?: number;
  dash?: string;
  opacity?: number;
}

export interface RouteResult {
  path: GraphNode[];
  floors: FloorId[];
  totalWeight: number;
}
