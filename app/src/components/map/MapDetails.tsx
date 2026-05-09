import type { FloorPlanMeta, MapDetailLine } from '../../core/types';

interface Props {
  details: MapDetailLine[];
  plan: FloorPlanMeta;
}

export function MapDetails({ details, plan }: Props) {
  if (details.length === 0) return null;

  return (
    <g data-layer="map-details" pointerEvents="none">
      {details.map((line) => {
        const d = line.path
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * plan.viewBoxWidth} ${p.y * plan.viewBoxHeight}`)
          .join(' ');

        return (
          <path
            key={line.id}
            d={d}
            fill="none"
            stroke="rgba(226,232,240,0.9)"
            strokeWidth={line.strokeWidth ?? 2}
            strokeDasharray={line.dash}
            strokeLinecap="square"
            strokeLinejoin="miter"
            opacity={line.opacity ?? 0.8}
          />
        );
      })}
    </g>
  );
}
