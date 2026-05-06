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

export function MapView() {
  const currentFloor = useNavigationStore((s) => s.currentFloor);
  const currentEntrance = useNavigationStore((s) => s.currentEntrance);
  const route = useNavigationStore((s) => s.route);
  const targetRoom = useNavigationStore((s) => s.targetRoom);
  const designMode = useDesignStore((s) => s.designMode);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const selectNode = useDesignStore((s) => s.selectNode);
  const patchRoom = useDesignStore((s) => s.patchRoom);

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

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!designMode || !svgRef.current) return;
      const svgPt = clientToSvg(svgRef.current, e.clientX, e.clientY);
      if (!svgPt) return;

      // Hit-test rooms: find the room whose rect contains this point
      let hit: string | null = null;
      for (const room of floorData.rooms) {
        if (room.type === 'inaccessible') continue;
        const cx = room.position.x * plan.viewBoxWidth;
        const cy = room.position.y * plan.viewBoxHeight;
        const w = room.width * plan.viewBoxWidth;
        const h = room.height * plan.viewBoxHeight;
        const left = cx - w / 2;
        const top = cy - h / 2;
        if (svgPt.x >= left && svgPt.x <= left + w && svgPt.y >= top && svgPt.y <= top + h) {
          hit = room.id;
          break;
        }
      }
      selectNode(hit);
    },
    [designMode, plan, floorData.rooms, selectNode],
  );

  // Design-mode drag
  const dragRef = useRef<string | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!designMode || !svgRef.current) return;
      const svgPt = clientToSvg(svgRef.current, e.clientX, e.clientY);
      if (!svgPt) return;
      for (const room of floorData.rooms) {
        if (room.type === 'inaccessible') continue;
        const cx = room.position.x * plan.viewBoxWidth;
        const cy = room.position.y * plan.viewBoxHeight;
        const w = room.width * plan.viewBoxWidth;
        const h = room.height * plan.viewBoxHeight;
        const left = cx - w / 2;
        const top = cy - h / 2;
        if (svgPt.x >= left && svgPt.x <= left + w && svgPt.y >= top && svgPt.y <= top + h) {
          dragRef.current = room.id;
          selectNode(room.id);
          return;
        }
      }
    },
    [designMode, plan, floorData.rooms, selectNode],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragRef.current || !designMode || !svgRef.current) return;
      const svgPt = clientToSvg(svgRef.current, e.clientX, e.clientY);
      if (!svgPt) return;
      const rel = svgToRel(svgPt.x, svgPt.y, plan);
      patchRoom(currentFloor, dragRef.current, { position: rel });
    },
    [designMode, plan, currentFloor, patchRoom],
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

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
        <Corridors corridors={floorData.corridors} plan={plan} />
        <Rooms rooms={floorData.rooms} plan={plan} targetRoomId={targetRoom} />
        <Entrances entrances={floorData.entrances} plan={plan} currentEntrance={currentEntrance} />
        {floorRoute.length > 1 && <RouteLayer route={floorRoute} plan={plan} />}
        <OrientationBadge plan={plan} />

        {/* Design mode highlight */}
        {designMode && selectedNodeId && (
          <g data-layer="design-highlight">
            {(() => {
              const room = floorData.rooms.find((r) => r.id === selectedNodeId);
              if (!room) return null;
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
            })()}
            <text
              x={12}
              y={plan.viewBoxHeight - 12}
              fontSize={13}
              fontFamily="monospace"
              fill="#e74c3c"
            >
              [design mode] Click &amp; drag a room to move it. Select to inspect.
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
