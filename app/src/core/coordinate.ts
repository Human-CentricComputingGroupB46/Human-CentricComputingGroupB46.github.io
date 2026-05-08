import type { Point, FloorPlanMeta } from './types';

/** Normalized [0,1] point → SVG user-space coordinates for a given floor plan */
export function relToSvg(p: Point, plan: FloorPlanMeta): { x: number; y: number } {
  return { x: p.x * plan.viewBoxWidth, y: p.y * plan.viewBoxHeight };
}

/** SVG user-space coordinates → normalized [0,1] point */
export function svgToRel(svgX: number, svgY: number, plan: FloorPlanMeta): Point {
  return { x: svgX / plan.viewBoxWidth, y: svgY / plan.viewBoxHeight };
}

/** Convert client (mouse) coordinates to SVG user-space using the SVG's CTM */
export function clientToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}

/** Euclidean distance between two normalized points */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
