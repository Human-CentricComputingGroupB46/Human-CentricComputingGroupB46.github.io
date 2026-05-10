import type { Entrance, EntranceId, FloorPlanMeta } from '../../core/types';
import { COLORS } from '../../core/constants';
import styles from './Entrances.module.css';

interface Props {
  entrances: Entrance[];
  plan: FloorPlanMeta;
  currentEntrance: EntranceId;
  designMode: boolean;
  selectedNodeId: string | null;
}

export function Entrances({ entrances, plan, currentEntrance, designMode, selectedNodeId }: Props) {
  return (
    <g data-layer="entrances">
      {entrances.map((ent) => {
        const cx = ent.position.x * plan.viewBoxWidth;
        const cy = ent.position.y * plan.viewBoxHeight;
        const isActive = ent.id === currentEntrance;
        const isSelected = designMode && selectedNodeId === ent.id;
        const radius = isActive ? 16 : 12;

        return (
          <g
            key={ent.id}
            data-entrance-id={ent.id}
            style={{ cursor: designMode ? 'grab' : 'default' }}
          >
            {/* Design-mode selection highlight */}
            {isSelected && (
              <circle
                cx={cx}
                cy={cy}
                r={radius + 6}
                fill="none"
                stroke="#e74c3c"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={radius + 4}
              fill={COLORS.entranceMarker}
              opacity={isActive ? 0.2 : 0.08}
            />
            {/* Outer ring */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill={COLORS.entranceMarker}
              opacity={isActive || isSelected ? 1 : 0.5}
            />
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
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#fff" strokeWidth={1.8} opacity={0.9} />
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
