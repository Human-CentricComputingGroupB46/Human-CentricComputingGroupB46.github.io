// ============================================================
// CampusCompass - Core Type Definitions
// ============================================================

/** Floor identifier */
export type FloorId = 'floor1' | 'floor2';

/** Entrance identifier */
export type EntranceId = 'NW' | 'NE' | 'SW';

/** 2D point in normalized relative coordinates (0–1) */
export interface Point {
  x: number;
  y: number;
}

/** Geographic coordinate */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Rectangular geographic bounds for anchoring the overlay */
export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ---- Building elements ----

export type RoomType =
  | 'room'
  | 'toilet'
  | 'elevator'
  | 'staircase'
  | 'inaccessible'
  | 'entrance';

export interface Room {
  id: string;           // e.g. "EB104"
  label: string;        // display label
  floor: FloorId;
  position: Point;      // center, normalized
  width: number;        // normalized
  height: number;       // normalized
  type: RoomType;
}

export interface Entrance {
  id: EntranceId;
  floor: FloorId;
  position: Point;
}

/** A corridor segment defined by a polyline of relative points */
export interface Corridor {
  id: string;
  floor: FloorId;
  path: Point[];
}

// ---- Navigation graph ----

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

// ---- Floor data bundle ----

export interface FloorData {
  id: FloorId;
  label: string;
  rooms: Room[];
  entrances: Entrance[];
  corridors: Corridor[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---- Application state ----

export interface AppState {
  currentFloor: FloorId;
  currentEntrance: EntranceId;
  inputRoomNumber: string;   // digits entered so far (e.g. "104")
  targetRoom: string | null; // full room id (e.g. "EB104")
  route: GraphNode[] | null;
  routeFloors: FloorId[];    // which floors the route passes through
  designMode: boolean;
  demoMode: boolean;
  message: string | null;    // status / error message
}

export type StateKey = keyof AppState;

/** Callback signature for state subscribers */
export type StateListener = (state: AppState, changed: StateKey[]) => void;
