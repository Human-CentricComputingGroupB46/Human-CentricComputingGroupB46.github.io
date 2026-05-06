import type { Entrance, EntranceId, FloorPlanMeta } from '../../core/types';
import { COLORS } from '../../core/constants';
import styles from './Entrances.module.css';

interface Props {
  entrances: Entrance[];
  plan: FloorPlanMeta;
  currentEntrance: EntranceId;
}

export function Entrances({ entrances, plan, currentEntrance }: Props) {
  return (
    <g data-layer="entrances">
      {entrances.map((ent) => {
        const cx = ent.position.x * plan.viewBoxWidth;
        const cy = ent.position.y * plan.viewBoxHeight;
        const isActive = ent.id === currentEntrance;
        const radius = isActive ? 16 : 12;

        return (
          <g key={ent.id} data-entrance-id={ent.id}>
            {/* Outer ring */}
            <circle cx={cx} cy={cy} r={radius} fill={COLORS.entranceMarker} opacity={isActive ? 1 : 0.45} />
            {/* Pulse ring for active */}
            {isActive && (
              <circle
                cx={cx}
                cy={cy}
                r={radius + 8}
                fill="none"
                stroke={COLORS.entranceMarker}
                strokeWidth={2}
                opacity={0.4}
                className={styles.pulse}
              />
            )}
            {/* White border */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#fff" strokeWidth={2} />
            {/* Label */}
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={isActive ? 12 : 10}
              fontWeight="bold"
              fontFamily="Segoe UI, system-ui, sans-serif"
              fill="#fff"
              pointerEvents="none"
            >
              {ent.id}
            </text>
          </g>
        );
      })}
    </g>
  );
}
