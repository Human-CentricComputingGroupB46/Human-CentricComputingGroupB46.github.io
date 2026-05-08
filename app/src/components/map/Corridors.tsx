import { useState } from 'react';
import type { Corridor, FloorPlanMeta } from '../../core/types';
import { COLORS } from '../../core/constants';

interface Props {
  corridors: Corridor[];
  plan: FloorPlanMeta;
  designMode: boolean;
  selectedNodeId: string | null;
}

export function Corridors({ corridors, plan, designMode, selectedNodeId }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <g data-layer="corridors">
      {corridors.map((corridor) => {
        const d = corridor.path
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * plan.viewBoxWidth} ${p.y * plan.viewBoxHeight}`)
          .join(' ');
        const isSelected = designMode && selectedNodeId === corridor.id;
        const isHovered = designMode && hoveredId === corridor.id && !isSelected;

        // Compute label position at path midpoint
        const midIdx = Math.floor(corridor.path.length / 2);
        const midPt = corridor.path[midIdx]!;
        const labelX = midPt.x * plan.viewBoxWidth;
        const labelY = midPt.y * plan.viewBoxHeight;

        return (
          <g
            key={corridor.id}
            data-corridor-id={corridor.id}
            onMouseEnter={() => designMode && setHoveredId(corridor.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Hover highlight glow */}
            {isHovered && (
              <path
                d={d}
                fill="none"
                stroke="#f39c12"
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.35}
                pointerEvents="none"
              />
            )}
            <path
              d={d}
              fill="none"
              stroke={isSelected ? '#e74c3c' : isHovered ? '#f39c12' : COLORS.corridorStroke}
              strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
              strokeDasharray={isSelected ? 'none' : '6 4'}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ cursor: designMode ? 'pointer' : 'default' }}
            />
            {/* Hover label */}
            {isHovered && (
              <g pointerEvents="none">
                <rect
                  x={labelX - 40}
                  y={labelY - 22}
                  width={80}
                  height={18}
                  rx={4}
                  ry={4}
                  fill="rgba(0,0,0,0.75)"
                />
                <text
                  x={labelX}
                  y={labelY - 9}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="monospace"
                  fill="#f39c12"
                >
                  {corridor.id}
                </text>
              </g>
            )}
            {/* Design-mode waypoint handles */}
            {designMode &&
              corridor.path.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x * plan.viewBoxWidth}
                  cy={pt.y * plan.viewBoxHeight}
                  r={isSelected ? 5 : isHovered ? 4 : 3}
                  fill={isSelected ? '#e74c3c' : isHovered ? '#f39c12' : 'rgba(255,255,255,0.7)'}
                  stroke={isSelected ? '#fff' : '#e67e22'}
                  strokeWidth={1.5}
                  data-corridor-id={corridor.id}
                  data-waypoint-index={i}
                  style={{ cursor: 'grab' }}
                />
              ))}
          </g>
        );
      })}
    </g>
  );
}
