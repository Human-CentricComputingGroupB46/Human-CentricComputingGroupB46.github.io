import type { Point, FloorPlanMeta } from '../../core/types';
import { COLORS } from '../../core/constants';

interface Props {
  /** Unified path that follows corridor polylines (not sparse graph nodes) */
  path: Point[];
  plan: FloorPlanMeta;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function RouteLayer({ path, plan }: Props) {
  if (path.length < 2) return null;

  const svgPoints = path.map((p) => ({
    x: p.x * plan.viewBoxWidth,
    y: p.y * plan.viewBoxHeight,
  }));

  const d = svgPoints
    .map((p, i) => {
      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    })
    .join(' ');

  const routeLength = svgPoints.reduce((sum, pt, i) => {
    if (i === 0) return sum;
    return sum + dist(svgPoints[i - 1]!, pt);
  }, 0);
  const arrowCount = Math.round(clamp(routeLength / 130, 2, 18));
  const duration = clamp(routeLength / 90, 5, 18);
  const arrows = Array.from({ length: arrowCount }, (_, i) => ({
    id: i,
    begin: `${-(i * duration) / arrowCount}s`,
  }));

  return (
    <g data-layer="route" pointerEvents="none">
      {/* Route shadow */}
      <path
        d={d}
        fill="none"
        stroke="rgba(242, 138, 26, 0.22)"
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Route highlight */}
      <path
        d={d}
        fill="none"
        stroke="rgba(255, 255, 255, 0.52)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Route line */}
      <path
        d={d}
        fill="none"
        stroke={COLORS.routeLine}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Direction indicators */}
      <g opacity={0.78}>
        {arrows.map((arrow) => (
          <g key={arrow.id}>
            <path
              d="M -3 -3.2 L 4.2 0 L -3 3.2 Z"
              fill="rgba(255, 250, 235, 0.78)"
              stroke="rgba(255, 255, 255, 0.34)"
              strokeWidth={0.6}
              strokeLinejoin="round"
            >
              <animateMotion
                path={d}
                dur={`${duration}s`}
                begin={arrow.begin}
                repeatCount="indefinite"
                rotate="auto"
              />
            </path>
          </g>
        ))}
      </g>
    </g>
  );
}
