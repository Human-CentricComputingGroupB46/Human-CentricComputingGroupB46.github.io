import type { Room, RoomType, FloorPlanMeta } from '../../core/types';
import { COLORS } from '../../core/constants';

interface Props {
  rooms: Room[];
  plan: FloorPlanMeta;
  targetRoomId: string | null;
}

function fillByType(type: RoomType): string {
  switch (type) {
    case 'elevator':
      return COLORS.elevatorFill;
    case 'staircase':
      return COLORS.staircaseFill;
    case 'toilet':
      return COLORS.toiletFill;
    case 'inaccessible':
      return COLORS.inaccessibleFill;
    default:
      return COLORS.roomFill;
  }
}

export function Rooms({ rooms, plan, targetRoomId }: Props) {
  return (
    <g data-layer="rooms">
      {rooms.map((room) => {
        const cx = room.position.x * plan.viewBoxWidth;
        const cy = room.position.y * plan.viewBoxHeight;
        const w = room.width * plan.viewBoxWidth;
        const h = room.height * plan.viewBoxHeight;
        const x = cx - w / 2;
        const y = cy - h / 2;
        const isTarget = room.id === targetRoomId;
        const fontSize = Math.min(14, Math.max(8, w / Math.max(1, room.label.length) * 1.4));

        return (
          <g
            key={room.id}
            data-room-id={room.id}
            data-room-type={room.type}
            data-room-target={isTarget ? 'true' : undefined}
          >
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={isTarget ? 'rgba(39, 174, 96, 0)' : fillByType(room.type)}
              stroke={isTarget ? 'rgba(39, 174, 96, 0)' : COLORS.roomStroke}
              strokeWidth={isTarget ? 2.5 : 1}
              opacity={0}
              rx={2}
              ry={2}
            />
            {room.type === 'inaccessible' && (
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="url(#hatch-pattern)"
                stroke="none"
                opacity={0}
                pointerEvents="none"
              />
            )}
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fontFamily="Segoe UI, system-ui, sans-serif"
              fill={COLORS.roomLabel}
              opacity={0}
              pointerEvents="none"
            >
              {room.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
