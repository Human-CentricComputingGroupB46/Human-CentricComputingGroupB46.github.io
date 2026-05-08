import { useMemo, useRef, useCallback } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useDesignStore } from '../../store/designStore';
import { useFloorData } from '../../hooks/useFloorData';
import { floorPlans } from '../../core/floorPlans';
import { svgToRel, clientToSvg } from '../../core/coordinate';
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

type DragTarget =
  | { type: 'room'; id: string }
  | { type: 'waypoint'; corridorId: string; index: number }
  | { type: 'entrance'; id: string };

export function MapView() {
  const currentFloor = useNavigationStore((s) => s.currentFloor);
  const currentEntrance = useNavigationStore((s) => s.currentEntrance);
  const route = useNavigationStore((s) => s.route);
  const targetRoom = useNavigationStore((s) => s.targetRoom);
  const designMode = useDesignStore((s) => s.designMode);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const selectNode = useDesignStore((s) => s.selectNode);
  const patchRoom = useDesignStore((s) => s.patchRoom);
  const patchCorridor = useDesignStore((s) => s.patchCorridor);
  const patchEntrance = useDesignStore((s) => s.patchEntrance);

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

  const dragRef = useRef<DragTarget | null>(null);

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

      // Check room hit first
      for (const room of floorData.rooms) {
        const cx = room.position.x * plan.viewBoxWidth;
        const cy = room.position.y * plan.viewBoxHeight;
        const w = room.width * plan.viewBoxWidth;
        const h = room.height * plan.viewBoxHeight;
        const left = cx - w / 2;
        const top = cy - h / 2;
        if (svgPt.x >= left && svgPt.x <= left + w && svgPt.y >= top && svgPt.y <= top + h) {
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
          // Insert at the nearest segment
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
    [designMode, plan, floorData.rooms, floorData.corridors, currentFloor, selectNode, findWaypoint, findCorridor, patchCorridor],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragRef.current || !designMode || !svgRef.current) return;
      const svgPt = clientToSvg(svgRef.current, e.clientX, e.clientY);
      if (!svgPt) return;

      if (dragRef.current.type === 'room') {
        const rel = svgToRel(svgPt.x, svgPt.y, plan);
        patchRoom(currentFloor, dragRef.current.id, { position: rel });
      } else if (dragRef.current.type === 'waypoint') {
        const rel = svgToRel(svgPt.x, svgPt.y, plan);
        const { corridorId, index } = dragRef.current;
        const corridor = floorData.corridors.find((c) => c.id === corridorId);
        if (!corridor) return;
        const newPath = corridor.path.map((p) => ({ ...p }));
        newPath[index] = rel;
        patchCorridor(currentFloor, corridorId, { path: newPath });
      } else if (dragRef.current.type === 'entrance') {
        const rel = svgToRel(svgPt.x, svgPt.y, plan);
        patchEntrance(currentFloor, dragRef.current.id as 'NW' | 'NE' | 'SW', { position: rel });
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
      return '[design mode] Ctrl+click path to add waypoint. Drag waypoints to reshape.';
    }
    if (selectedNodeId && floorData.entrances.some((e) => e.id === selectedNodeId)) {
      return '[design mode] Drag entrance marker to reposition it.';
    }
    return '[design mode] Click & drag rooms/entrances to move. Ctrl+click corridor to add waypoint.';
  }, [designMode, selectedNodeId, floorData.corridors, floorData.entrances]);

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
          <marker
            id="arrow-marker"
            viewBox="0 0 10 6"
            refX={5}
            refY={3}
            markerWidth={8}
            markerHeight={6}
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#e67e22" />
          </marker>
        </defs>

        <FloorImage plan={plan} />
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
        {floorRoute.length > 1 && <RouteLayer route={floorRoute} plan={plan} />}
        <OrientationBadge plan={plan} />

        {/* Design mode highlight */}
        {designMode && selectedNodeId && (
          <g data-layer="design-highlight">
            {(() => {
              const room = floorData.rooms.find((r) => r.id === selectedNodeId);
              if (room) {
                const cx = room.position.x * plan.viewBoxWidth;
                const cy = room.position.y * plan.viewBoxHeight;
                const w = room.width * plan.viewBoxWidth;
                const h = room.height * plan.viewBoxHeight;
                const x = cx - w / 2;
                const y = cy - h / 2;
                return (
                  <rect
                    x={x - 3}
                    y={y - 3}
                    width={w + 6}
                    height={h + 6}
                    fill="none"
                    stroke="#e74c3c"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    rx={2}
                    ry={2}
                  />
                );
              }
              return null;
            })()}
            <text
              x={12}
              y={plan.viewBoxHeight - 12}
              fontSize={13}
              fontFamily="monospace"
              fill="#e74c3c"
            >
              {designHint}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
