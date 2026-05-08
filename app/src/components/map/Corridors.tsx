import type { Corridor, FloorPlanMeta } from '../../core/types';
import { COLORS } from '../../core/constants';

interface Props {
  corridors: Corridor[];
  plan: FloorPlanMeta;
}

export function Corridors({ corridors, plan }: Props) {
  return (
    <g data-layer="corridors">
      {corridors.map((c) => {
        const points = c.path
          .map((p) => `${p.x * plan.viewBoxWidth},${p.y * plan.viewBoxHeight}`)
          .join(' ');
        return (
          <polyline
            key={c.id}
            data-corridor-id={c.id}
            points={points}
            fill="none"
            stroke={COLORS.corridorStroke}
            strokeWidth={4}
            strokeDasharray="8 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}
