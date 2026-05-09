import { useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useDesignStore } from '../../store/designStore';
import { useFloorData } from '../../hooks/useFloorData';
import { floorPlans } from '../../core/floorPlans';
import { svgToRel, clientToSvg, snapRouteToCorridors } from '../../core/coordinate';
import { FloorImage } from './FloorImage';
import { Corridors } from './Corridors';
import { Rooms } from './Rooms';
import { Entrances } from './Entrances';
import { RouteLayer } from './RouteLayer';
import { OrientationBadge } from './OrientationBadge';
import styles from './MapView.module.css';

/** Euclidean distance between two points (in SVG coords) */
function distSvg(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Distance from point p to line segment ab */
function distToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return distSvg(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return distSvg(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** 8 resize handle positions */
type HandlePos = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

type DragTarget =
  | { type: 'room'; id: string }
  | { type: 'waypoint'; corridorId: string; index: number }
  | { type: 'entrance'; id: string }
  | { type: 'handle'; roomId: string; handle: HandlePos; initialCenter: { x: number; y: number }; initialW: number; initialH: number };

const HANDLE_SIZE = 8;      // visual size in SVG units
const HANDLE_HIT = 14;      // hit-test radius

/** Get the 8 handle positions (SVG coords) for a room rect */
function getHandlePositions(
  left: number, top: number, w: number, h: number,
): { pos: HandlePos; x: number; y: number }[] {
  const cx = left + w / 2;
  const cy = top + h / 2;
  const right = left + w;
  const bottom = top + h;
  return [
    { pos: 'nw', x: left,  y: top },
    { pos: 'n',  x: cx,    y: top },
    { pos: 'ne', x: right, y: top },
    { pos: 'e',  x: right, y: cy },
    { pos: 'se', x: right, y: bottom },
    { pos: 's',  x: cx,    y: bottom },
    { pos: 'sw', x: left,  y: bottom },
    { pos: 'w',  x: left,  y: cy },
  ];
}

export function MapView() {
  const currentFloor = useNavigationStore((s) => s.currentFloor);
  const currentEntrance = useNavigationStore((s) => s.currentEntrance);
  const route = useNavigationStore((s) => s.route);
  const targetRoom = useNavigationStore((s) => s.targetRoom);

  const designMode = useDesignStore((s) => s.designMode);
  const showFloorImage = useDesignStore((s) => s.showFloorImage);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const selectNode = useDesignStore((s) => s.selectNode);
  const patchRoom = useDesignStore((s) => s.patchRoom);
  const patchCorridor = useDesignStore((s) => s.patchCorridor);
  const patchEntrance = useDesignStore((s) => s.patchEntrance);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);

  const floorData = useFloorData(currentFloor);
  const plan = floorPlans[currentFloor];
  const svgRef = useRef<SVGSVGElement>(null);

  const floorRoute = useMemo(
    () => {
      if (!route) return [];
      return route.filter((n) => n.floor === currentFloor);
    },
    [route, currentFloor],
  );

  /** Unified path that follows corridor polylines, not sparse graph nodes */
  const unifiedPath = useMemo(
    () => snapRouteToCorridors(floorRoute, floorData.corridors),
    [floorRoute, floorData.corridors],
  );

  const dragRef = useRef<DragTarget | null>(null);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (!designMode) return;
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in an input field
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // Deselect on delete press (actual deletion could be added later)
        e.preventDefault();
        selectNode(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [designMode, undo, redo, selectNode]);

  // Find waypoint near a given SVG point (radius in SVG units)
  const findWaypoint = useCallback(
    (svgPt: { x: number; y: number }, radius: number) => {
      for (const c of floorData.corridors) {
        for (let i = 0; i < c.path.length; i++) {
          const pt = c.path[i]!;
          const wp = { x: pt.x * plan.viewBoxWidth, y: pt.y * plan.viewBoxHeight };
          if (distSvg(svgPt, wp) < radius) {
            return { corridor: c, index: i };
          }
        }
      }
      return null;
    },
    [floorData.corridors, plan],
  );

  // Find corridor near a given SVG point (for path hit-test)
  const findCorridor = useCallback(
    (svgPt: { x: number; y: number }, threshold: number) => {
      for (const c of floorData.corridors) {
        for (let i = 0; i < c.path.length - 1; i++) {
          const p0 = c.path[i]!;
          const p1 = c.path[i + 1]!;
          const a = { x: p0.x * plan.viewBoxWidth, y: p0.y * plan.viewBoxHeight };
          const b = { x: p1.x * plan.viewBoxWidth, y: p1.y * plan.viewBoxHeight };
          if (distToSegment(svgPt, a, b) < threshold) {
            return c;
          }
        }
      }
      return null;
    },
    [floorData.corridors, plan],
  );

  // Find a resize handle near a given SVG point for a specific room
  const findHandle = useCallback(
    (svgPt: { x: number; y: number }, room: typeof floorData.rooms[number]): HandlePos | null => {
      const cx = room.position.x * plan.viewBoxWidth;
      const cy = room.position.y * plan.viewBoxHeight;
      const sw = room.width * plan.viewBoxWidth;
      const sh = room.height * plan.viewBoxHeight;
      const left = cx - sw / 2;
      const top = cy - sh / 2;
      const handles = getHandlePositions(left, top, sw, sh);
      for (const h of handles) {
        if (distSvg(svgPt, { x: h.x, y: h.y }) < HANDLE_HIT) return h.pos;
      }
      return null;
    },
    [plan.viewBoxWidth, plan.viewBoxHeight],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!designMode || !svgRef.current) return;
      const svgPt = clientToSvg(svgRef.current, e.clientX, e.clientY);
      if (!svgPt) return;

      // Hit-test rooms first (highest priority)
      for (const room of floorData.rooms) {
        const cx = room.position.x * plan.viewBoxWidth;
        const cy = room.position.y * plan.viewBoxHeight;
        const w = room.width * plan.viewBoxWidth;
        const h = room.height * plan.viewBoxHeight;
        const left = cx - w / 2;
        const top = cy - h / 2;
        if (svgPt.x >= left && svgPt.x <= left + w && svgPt.y >= top && svgPt.y <= top + h) {
          selectNode(room.id);
          return;
        }
      }

      // Check waypoint hit
      if (findWaypoint(svgPt, 10)) {
        return; // waypoint clicks handled by mousedown/drag
      }

      // Check corridor path hit
      const corridor = findCorridor(svgPt, 10);
      if (corridor) {
        selectNode(corridor.id);
        return;
      }

      // Check entrance hit
      for (const ent of floorData.entrances) {
        const ex = ent.position.x * plan.viewBoxWidth;
        const ey = ent.position.y * plan.viewBoxHeight;
        if (distSvg(svgPt, { x: ex, y: ey }) < 16) {
          selectNode(ent.id);
          return;
        }
      }

      selectNode(null);
    },
    [designMode, plan, floorData.rooms, floorData.corridors, selectNode, findWaypoint, findCorridor],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!designMode || !svgRef.current) return;
      const svgPt = clientToSvg(svgRef.current, e.clientX, e.clientY);
      if (!svgPt) return;

      // Check room hit first — but check handles before full-drag
      for (const room of floorData.rooms) {
        const cx = room.position.x * plan.viewBoxWidth;
        const cy = room.position.y * plan.viewBoxHeight;
        const sw = room.width * plan.viewBoxWidth;
        const sh = room.height * plan.viewBoxHeight;
        const left = cx - sw / 2;
        const top = cy - sh / 2;
        if (svgPt.x >= left && svgPt.x <= left + sw && svgPt.y >= top && svgPt.y <= top + sh) {
          // Check handle hit first
          const handle = findHandle(svgPt, room);
          if (handle) {
            dragRef.current = {
              type: 'handle',
              roomId: room.id,
              handle,
              initialCenter: { x: room.position.x, y: room.position.y },
              initialW: room.width,
              initialH: room.height,
            };
            selectNode(room.id);
            return;
          }
          // Full room drag
          dragRef.current = { type: 'room', id: room.id };
          selectNode(room.id);
          return;
        }
      }

      // Check waypoint hit
      const wp = findWaypoint(svgPt, 10);
      if (wp) {
        dragRef.current = { type: 'waypoint', corridorId: wp.corridor.id, index: wp.index };
        selectNode(wp.corridor.id);
        return;
      }

      // Check entrance hit
      for (const ent of floorData.entrances) {
        const ex = ent.position.x * plan.viewBoxWidth;
        const ey = ent.position.y * plan.viewBoxHeight;
        if (distSvg(svgPt, { x: ex, y: ey }) < 16) {
          dragRef.current = { type: 'entrance', id: ent.id };
          selectNode(ent.id);
          return;
        }
      }

      // Check corridor path hit (for selection only, not drag)
      const corridor = findCorridor(svgPt, 10);
      if (corridor) {
        selectNode(corridor.id);

        // Ctrl+click: add waypoint
        if (e.ctrlKey) {
          const rel = svgToRel(svgPt.x, svgPt.y, plan);
          const newPath = [...corridor.path];
          let bestIdx = 0;
          let bestDist = Infinity;
          for (let i = 0; i < corridor.path.length - 1; i++) {
            const p0 = corridor.path[i]!;
            const p1 = corridor.path[i + 1]!;
            const a = { x: p0.x * plan.viewBoxWidth, y: p0.y * plan.viewBoxHeight };
            const b = { x: p1.x * plan.viewBoxWidth, y: p1.y * plan.viewBoxHeight };
            const d = distToSegment(svgPt, a, b);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = i + 1;
            }
          }
          newPath.splice(bestIdx, 0, rel);
          patchCorridor(currentFloor, corridor.id, { path: newPath });
        }
        return;
      }
    },
    [designMode, plan, floorData.rooms, floorData.corridors, currentFloor, selectNode, findWaypoint, findCorridor, findHandle, patchCorridor],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragRef.current || !designMode || !svgRef.current) return;
      const svgPt = clientToSvg(svgRef.current, e.clientX, e.clientY);
      if (!svgPt) return;

      const d = dragRef.current;

      if (d.type === 'handle') {
        // Resize via handle
        const rel = svgToRel(svgPt.x, svgPt.y, plan);
        const hw = plan.viewBoxWidth;
        const hh = plan.viewBoxHeight;
        const ic = d.initialCenter;
        const iw = d.initialW;
        const ih = d.initialH;

        // Bounding box in normalized coords
        const origLeft = ic.x - iw / 2;
        const origRight = ic.x + iw / 2;
        const origTop = ic.y - ih / 2;
        const origBottom = ic.y + ih / 2;

        let newLeft = origLeft;
        let newRight = origRight;
        let newTop = origTop;
        let newBottom = origBottom;

        switch (d.handle) {
          case 'nw': newLeft = rel.x; newTop = rel.y; break;
          case 'n':  newTop = rel.y; break;
          case 'ne': newRight = rel.x; newTop = rel.y; break;
          case 'e':  newRight = rel.x; break;
          case 'se': newRight = rel.x; newBottom = rel.y; break;
          case 's':  newBottom = rel.y; break;
          case 'sw': newLeft = rel.x; newBottom = rel.y; break;
          case 'w':  newLeft = rel.x; break;
        }

        // Enforce minimum size
        const MIN = 0.005;
        if (newRight - newLeft < MIN) {
          if (d.handle.includes('w')) newLeft = newRight - MIN;
          else newRight = newLeft + MIN;
        }
        if (newBottom - newTop < MIN) {
          if (d.handle.includes('n')) newTop = newBottom - MIN;
          else newBottom = newTop + MIN;
        }

        const newW = newRight - newLeft;
        const newH = newBottom - newTop;
        const newCx = (newLeft + newRight) / 2;
        const newCy = (newTop + newBottom) / 2;

        patchRoom(currentFloor, d.roomId, {
          position: { x: newCx, y: newCy },
          width: newW,
          height: newH,
        });
      } else if (d.type === 'room') {
        const rel = svgToRel(svgPt.x, svgPt.y, plan);
        patchRoom(currentFloor, d.id, { position: rel });
      } else if (d.type === 'waypoint') {
        const rel = svgToRel(svgPt.x, svgPt.y, plan);
        const { corridorId, index } = d;
        const corridor = floorData.corridors.find((c) => c.id === corridorId);
        if (!corridor) return;
        const newPath = corridor.path.map((p) => ({ ...p }));
        newPath[index] = rel;
        patchCorridor(currentFloor, corridorId, { path: newPath });
      } else if (d.type === 'entrance') {
        const rel = svgToRel(svgPt.x, svgPt.y, plan);
        patchEntrance(currentFloor, d.id as 'NW' | 'NE' | 'SW', { position: rel });
      }
    },
    [designMode, plan, currentFloor, floorData.corridors, patchRoom, patchCorridor, patchEntrance],
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const designHint = useMemo(() => {
    if (!designMode) return null;
    if (selectedNodeId && floorData.corridors.some((c) => c.id === selectedNodeId)) {
      return 'Ctrl+click path to add waypoint | Drag waypoints | ⌘Z undo';
    }
    if (selectedNodeId && floorData.entrances.some((e) => e.id === selectedNodeId)) {
      return 'Drag entrance to move | ⌘Z undo';
    }
    if (selectedNodeId && floorData.rooms.some((r) => r.id === selectedNodeId)) {
      return 'Drag center to move | Drag handles to resize | ⌘Z undo';
    }
    return 'Click to select | Drag rooms/entrances | Ctrl+click corridor = add waypoint';
  }, [designMode, selectedNodeId, floorData.corridors, floorData.entrances, floorData.rooms]);

  // Compute the selected room's SVG bounding box for handles
  const selectedRoom = designMode && selectedNodeId
    ? floorData.rooms.find((r) => r.id === selectedNodeId) ?? null
    : null;

  const selectedRoomRect = selectedRoom
    ? (() => {
        const sw = selectedRoom.width * plan.viewBoxWidth;
        const sh = selectedRoom.height * plan.viewBoxHeight;
        const sx = selectedRoom.position.x * plan.viewBoxWidth - sw / 2;
        const sy = selectedRoom.position.y * plan.viewBoxHeight - sh / 2;
        return { left: sx, top: sy, width: sw, height: sh };
      })()
    : null;

  return (
    <div className={styles.wrapper}>
      <svg
        ref={svgRef}
        className={`${styles.svg} ${designMode ? styles.svgDesign : ''}`}
        viewBox={`0 0 ${plan.viewBoxWidth} ${plan.viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <pattern
            id="hatch-pattern"
            patternUnits="userSpaceOnUse"
            width={10}
            height={10}
            patternTransform="rotate(45 0 0)"
          >
            <line x1={0} y1={0} x2={0} y2={10} stroke="#bdc3c7" strokeWidth={1.5} />
          </pattern>
        </defs>

        {/* Floor image — togglable */}
        {showFloorImage && <FloorImage plan={plan} />}

        <Corridors
          corridors={floorData.corridors}
          plan={plan}
          designMode={designMode}
          selectedNodeId={selectedNodeId}
        />
        <Rooms rooms={floorData.rooms} plan={plan} targetRoomId={targetRoom} />
        <Entrances
          entrances={floorData.entrances}
          plan={plan}
          currentEntrance={currentEntrance}
          designMode={designMode}
          selectedNodeId={selectedNodeId}
        />
        {unifiedPath.length > 1 && <RouteLayer path={unifiedPath} plan={plan} />}
        <OrientationBadge plan={plan} />

        {/* Design mode highlight + control handles */}
        {designMode && selectedRoomRect && (
          <g data-layer="design-highlight">
            {/* Selection outline */}
            <rect
              x={selectedRoomRect.left - 3}
              y={selectedRoomRect.top - 3}
              width={selectedRoomRect.width + 6}
              height={selectedRoomRect.height + 6}
              fill="none"
              stroke="#e74c3c"
              strokeWidth={2}
              strokeDasharray="6 4"
              rx={2}
              ry={2}
            />
            {/* 8 Resize handles */}
            {getHandlePositions(
              selectedRoomRect.left,
              selectedRoomRect.top,
              selectedRoomRect.width,
              selectedRoomRect.height,
            ).map((h) => (
              <rect
                key={h.pos}
                x={h.x - HANDLE_SIZE / 2}
                y={h.y - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                fill="#fff"
                stroke="#e74c3c"
                strokeWidth={1.5}
                rx={1}
                ry={1}
                style={{ cursor: `${h.pos}-resize` }}
                data-handle-pos={h.pos}
              />
            ))}
            {/* Hint text */}
            <text
              x={12}
              y={plan.viewBoxHeight - 12}
              fontSize={12}
              fontFamily="system-ui, sans-serif"
              fill="#e74c3c"
              opacity={0.9}
            >
              {designHint}
            </text>
          </g>
        )}

        {/* Design mode hint when nothing selected */}
        {designMode && !selectedRoomRect && (
          <g data-layer="design-hint">
            <text
              x={12}
              y={plan.viewBoxHeight - 12}
              fontSize={12}
              fontFamily="system-ui, sans-serif"
              fill="#e74c3c"
              opacity={0.9}
            >
              {designHint}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
