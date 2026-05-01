// ============================================================
// CampusCompass - Constants
// ============================================================

import { GeoBounds, LatLng } from './types';

/** EB building center (XJTLU North Campus) */
export const EB_CENTER: LatLng = {
  lat: 31.27505,
  lng: 120.73950,
};

/** EB building geographic bounds for overlay anchoring */
export const EB_BOUNDS: GeoBounds = {
  north: 31.27575,
  south: 31.27430,
  east: 120.74060,
  west: 120.73840,
};

/** Default map zoom level */
export const DEFAULT_ZOOM = 19;

/** Canvas overlay dimensions (logical pixels) */
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

/** Color palette */
export const COLORS = {
  // UI
  headerBg: '#1a1a2e',
  primary: '#e67e22',
  primaryDark: '#d35400',
  accent: '#27ae60',
  textLight: '#ffffff',
  textDark: '#2c3e50',
  panelBg: '#f8f9fa',

  // Map elements
  roomFill: 'rgba(220, 230, 245, 0.7)',
  roomStroke: '#7f8c8d',
  roomLabel: '#2c3e50',
  corridorStroke: 'rgba(180, 190, 200, 0.8)',
  inaccessibleFill: 'rgba(200, 200, 200, 0.5)',
  inaccessibleHatch: '#bdc3c7',
  entranceMarker: '#e67e22',
  youAreHere: '#e67e22',
  destination: '#27ae60',
  routeLine: '#e67e22',
  elevatorFill: '#3498db',
  staircaseFill: '#9b59b6',
  toiletFill: '#1abc9c',
} as const;

/** Room number prefix */
export const ROOM_PREFIX = 'EB';
