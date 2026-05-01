// ============================================================
// CampusCompass - Canvas Renderer
// ============================================================
//
// Draws rooms, corridors, entrances, route, and markers
// onto a <canvas> element using normalized coordinates.
// ============================================================

import { FloorData, GraphNode, EntranceId } from './types';
import { COLORS } from './constants';
import { relToPixel } from './coordinate';

/** Main render function — clears and redraws everything */
export function renderFloor(
  ctx: CanvasRenderingContext2D,
  floorData: FloorData,
  options: {
    width: number;
    height: number;
    currentEntrance: EntranceId;
    route: GraphNode[] | null;
    targetRoom: string | null;
    designMode: boolean;
  },
): void {
  const { width: w, height: h } = options;
  ctx.clearRect(0, 0, w, h);

  // 1. Background
  ctx.fillStyle = 'rgba(240, 243, 247, 0.35)';
  ctx.fillRect(0, 0, w, h);

  // 2. Corridors
  drawCorridors(ctx, floorData, w, h);

  // 3. Rooms
  drawRooms(ctx, floorData, w, h, options.targetRoom, options.designMode);

  // 4. Entrances
  drawEntrances(ctx, floorData, w, h, options.currentEntrance);

  // 5. Route overlay
  if (options.route && options.route.length > 1) {
    drawRoute(ctx, options.route, w, h);
  }

  // 6. Orientation label
  drawOrientation(ctx, w);
}

// ---- Corridors ----

function drawCorridors(
  ctx: CanvasRenderingContext2D,
  data: FloorData,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.strokeStyle = COLORS.corridorStroke;
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);

  for (const corridor of data.corridors) {
    if (corridor.path.length < 2) continue;
    ctx.beginPath();
    const start = relToPixel(corridor.path[0], w, h);
    ctx.moveTo(start.px, start.py);
    for (let i = 1; i < corridor.path.length; i++) {
      const p = relToPixel(corridor.path[i], w, h);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.restore();
}

// ---- Rooms ----

function drawRooms(
  ctx: CanvasRenderingContext2D,
  data: FloorData,
  w: number,
  h: number,
  targetRoom: string | null,
  designMode: boolean,
): void {
  for (const room of data.rooms) {
    const center = relToPixel(room.position, w, h);
    const rw = room.width * w;
    const rh = room.height * h;
    const x = center.px - rw / 2;
    const y = center.py - rh / 2;

    // Fill
    if (room.type === 'inaccessible') {
      ctx.fillStyle = COLORS.inaccessibleFill;
      ctx.fillRect(x, y, rw, rh);
      drawHatch(ctx, x, y, rw, rh);
    } else if (room.id === targetRoom) {
      ctx.fillStyle = 'rgba(39, 174, 96, 0.35)';
      ctx.fillRect(x, y, rw, rh);
    } else {
      ctx.fillStyle = getFillByType(room.type);
      ctx.fillRect(x, y, rw, rh);
    }

    // Border
    ctx.strokeStyle = room.id === targetRoom ? COLORS.destination : COLORS.roomStroke;
    ctx.lineWidth = room.id === targetRoom ? 2.5 : 1;
    ctx.strokeRect(x, y, rw, rh);

    // Label
    const fontSize = Math.max(9, Math.min(12, rw / room.label.length * 1.2));
    ctx.font = `${fontSize}px "Segoe UI", sans-serif`;
    ctx.fillStyle = COLORS.roomLabel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(room.label, center.px, center.py);

    // Design mode: show drag handle
    if (designMode && room.type !== 'inaccessible') {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x - 2, y - 2, rw + 4, rh + 4);
      ctx.setLineDash([]);
    }
  }
}

function getFillByType(type: string): string {
  switch (type) {
    case 'elevator': return 'rgba(52, 152, 219, 0.25)';
    case 'staircase': return 'rgba(155, 89, 182, 0.25)';
    case 'toilet': return 'rgba(26, 188, 156, 0.25)';
    default: return COLORS.roomFill;
  }
}

function drawHatch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.inaccessibleHatch;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = 8;
  for (let i = -h; i < w; i += step) {
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
  }
  ctx.stroke();
  ctx.restore();
}

// ---- Entrances ----

function drawEntrances(
  ctx: CanvasRenderingContext2D,
  data: FloorData,
  w: number,
  h: number,
  currentEntrance: EntranceId,
): void {
  for (const ent of data.entrances) {
    const p = relToPixel(ent.position, w, h);
    const isActive = ent.id === currentEntrance;
    const radius = isActive ? 14 : 10;

    // Outer ring
    ctx.beginPath();
    ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? COLORS.entranceMarker : 'rgba(230, 126, 34, 0.4)';
    ctx.fill();

    // Pulse ring for active entrance
    if (isActive) {
      ctx.beginPath();
      ctx.arc(p.px, p.py, radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.entranceMarker;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // White border
    ctx.beginPath();
    ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ent.id, p.px, p.py);
  }
}

// ---- Route ----

function drawRoute(
  ctx: CanvasRenderingContext2D,
  route: GraphNode[],
  w: number,
  h: number,
): void {
  if (route.length < 2) return;

  ctx.save();

  // Route shadow
  ctx.strokeStyle = 'rgba(230, 126, 34, 0.3)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawRoutePolyline(ctx, route, w, h);

  // Route line
  ctx.strokeStyle = COLORS.routeLine;
  ctx.lineWidth = 4;
  drawRoutePolyline(ctx, route, w, h);

  // Start marker (already drawn as entrance)
  // End marker: green circle
  const end = relToPixel(route[route.length - 1].position, w, h);
  ctx.beginPath();
  ctx.arc(end.px, end.py, 10, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.destination;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Arrow heads along route
  drawArrowHeads(ctx, route, w, h);

  ctx.restore();
}

function drawRoutePolyline(
  ctx: CanvasRenderingContext2D,
  route: GraphNode[],
  w: number,
  h: number,
): void {
  ctx.beginPath();
  const start = relToPixel(route[0].position, w, h);
  ctx.moveTo(start.px, start.py);
  for (let i = 1; i < route.length; i++) {
    const p = relToPixel(route[i].position, w, h);
    ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
}

function drawArrowHeads(
  ctx: CanvasRenderingContext2D,
  route: GraphNode[],
  w: number,
  h: number,
): void {
  const arrowSize = 6;
  ctx.fillStyle = COLORS.routeLine;

  // Place arrows every few segments
  for (let i = 2; i < route.length; i += 3) {
    const prev = relToPixel(route[i - 1].position, w, h);
    const curr = relToPixel(route[i].position, w, h);
    const angle = Math.atan2(curr.py - prev.py, curr.px - prev.px);
    const midX = (prev.px + curr.px) / 2;
    const midY = (prev.py + curr.py) / 2;

    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize, -arrowSize * 0.6);
    ctx.lineTo(-arrowSize, arrowSize * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ---- Orientation ----

function drawOrientation(ctx: CanvasRenderingContext2D, w: number): void {
  ctx.save();
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(44, 62, 80, 0.6)';
  ctx.textAlign = 'center';
  ctx.fillText('Orientation', w / 2, 14);
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.fillText('Top = North · Bottom = South · Left = West · Right = East', w / 2, 26);
  ctx.restore();
}

// ---- Hit testing for design mode ----

export function hitTestRoom(
  floorData: FloorData,
  clickX: number,
  clickY: number,
  canvasW: number,
  canvasH: number,
): string | null {
  for (const room of floorData.rooms) {
    if (room.type === 'inaccessible') continue;
    const center = relToPixel(room.position, canvasW, canvasH);
    const rw = room.width * canvasW;
    const rh = room.height * canvasH;
    const x = center.px - rw / 2;
    const y = center.py - rh / 2;
    if (clickX >= x && clickX <= x + rw && clickY >= y && clickY <= y + rh) {
      return room.id;
    }
  }
  return null;
}
