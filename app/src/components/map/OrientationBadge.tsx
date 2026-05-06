import type { FloorPlanMeta } from '../../core/types';

interface Props {
  plan: FloorPlanMeta;
}

export function OrientationBadge({ plan }: Props) {
  const cx = plan.viewBoxWidth - 42;
  const cy = 30;

  return (
    <g data-layer="orientation" pointerEvents="none" opacity={0.65}>
      <circle cx={cx} cy={cy} r={18} fill="#fff" stroke="#cbd5e1" strokeWidth={1.5} />
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight="bold" fill="#1a1a2e">
        N
      </text>
      <text x={cx} y={cy + 7} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#64748b">
        &#9650;
      </text>
    </g>
  );
}
