export const ROOM_PREFIX = 'EB';

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
  corridorStroke: 'rgba(180, 190, 200, 0.85)',
  inaccessibleFill: 'rgba(200, 200, 200, 0.5)',
  inaccessibleHatch: '#bdc3c7',
  entranceMarker: '#e67e22',
  youAreHere: '#e67e22',
  destination: '#27ae60',
  routeLine: '#e67e22',
  elevatorFill: 'rgba(52, 152, 219, 0.25)',
  staircaseFill: 'rgba(155, 89, 182, 0.25)',
  toiletFill: 'rgba(26, 188, 156, 0.25)',
} as const;

export const MAX_RECENT_ROOMS = 6;
