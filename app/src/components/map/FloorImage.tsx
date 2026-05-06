import type { FloorPlanMeta } from '../../core/types';

interface Props {
  plan: FloorPlanMeta;
}

export function FloorImage({ plan }: Props) {
  return (
    <image
      data-layer="floor-image"
      href={plan.src}
      x={0}
      y={0}
      width={plan.viewBoxWidth}
      height={plan.viewBoxHeight}
      preserveAspectRatio="none"
      style={{ opacity: 0.55 }}
    />
  );
}
