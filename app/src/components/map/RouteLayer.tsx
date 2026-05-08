import type { GraphNode, FloorPlanMeta } from '../../core/types';
import { COLORS } from '../../core/constants';

interface Props {
  route: GraphNode[];
  plan: FloorPlanMeta;
}

export function RouteLayer({ route, plan }: Props) {
  if (route.length < 2) return null;

  const d = route
    .map((n, i) => {
      const x = n.position.x * plan.viewBoxWidth;
      const y = n.position.y * plan.viewBoxHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const first = route[0];
  if (!first) return null;
  const startX = first.position.x * plan.viewBoxWidth;
  const startY = first.position.y * plan.viewBoxHeight;

  const last = route[route.length - 1];
  if (!last) return null;
  const endX = last.position.x * plan.viewBoxWidth;
  const endY = last.position.y * plan.viewBoxHeight;

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
        markerMid="url(#arrow-marker)"
      />
      {/* Start marker */}
      <circle cx={startX} cy={startY} r={10} fill={COLORS.youAreHere} />
      <circle cx={startX} cy={startY} r={10} fill="none" stroke="#fff" strokeWidth={2} />
      {/* End marker */}
      <circle cx={endX} cy={endY} r={12} fill={COLORS.destination} />
      <circle cx={endX} cy={endY} r={12} fill="none" stroke="#fff" strokeWidth={2.5} />
    </g>
  );
}
