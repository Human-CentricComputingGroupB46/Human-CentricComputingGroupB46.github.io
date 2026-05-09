import type { Point, FloorPlanMeta } from '../../core/types';
import { COLORS } from '../../core/constants';

interface Props {
  /** Unified path that follows corridor polylines (not sparse graph nodes) */
  path: Point[];
  plan: FloorPlanMeta;
}

export function RouteLayer({ path, plan }: Props) {
  if (path.length < 2) return null;

  const d = path
    .map((p, i) => {
      const x = p.x * plan.viewBoxWidth;
      const y = p.y * plan.viewBoxHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <g data-layer="route">
      {/* Route shadow */}
      <path
        d={d}
        fill="none"
        stroke="rgba(230, 126, 34, 0.25)"
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Route line */}
      <path
        d={d}
        fill="none"
        stroke={COLORS.routeLine}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
