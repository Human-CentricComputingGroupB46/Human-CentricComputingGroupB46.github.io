import type { Point, FloorPlanMeta, GraphNode, Corridor } from './types';

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

/**
 * Snap a route (ordered GraphNode[]) to corridor waypoints so the rendered
 * path follows the visual corridor polylines instead of straight lines
 * between sparse graph nodes.
 *
 * For each consecutive pair of nodes (A, B) in the route, we look for a
 * corridor that passes near both, then extract the sub-path of that
 * corridor's polyline between A and B.  Falls back to a direct segment
 * when nodes don't share a corridor.
 */
const SNAP_THRESHOLD = 0.04; // normalized-distance tolerance for "on corridor"

export function snapRouteToCorridors(
  route: GraphNode[],
  corridors: Corridor[],
): Point[] {
  if (route.length === 0) return [];
  if (route.length === 1) return [{ ...route[0]!.position }];

  const result: Point[] = [];

  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]!;
    const b = route[i + 1]!;

    // Try to find a corridor that contains both a and b
    let bestCorridor: Corridor | null = null;
    let idxA = -1;
    let idxB = -1;

    for (const c of corridors) {
      let ca = -1;
      let cb = -1;
      let minDA = Infinity;
      let minDB = Infinity;

      for (let j = 0; j < c.path.length; j++) {
        const pt = c.path[j]!;
        const dA = distance(a.position, pt);
        const dB = distance(b.position, pt);
        if (dA < SNAP_THRESHOLD && dA < minDA) { minDA = dA; ca = j; }
        if (dB < SNAP_THRESHOLD && dB < minDB) { minDB = dB; cb = j; }
      }

      if (ca >= 0 && cb >= 0 && ca !== cb) {
        bestCorridor = c;
        idxA = ca;
        idxB = cb;
        break; // first match wins
      }
    }

    if (bestCorridor && idxA >= 0 && idxB >= 0) {
      // Walk the corridor path from idxA to idxB (inclusive)
      const step = idxA < idxB ? 1 : -1;
      for (let k = idxA; k !== idxB + step; k += step) {
        result.push({ ...bestCorridor.path[k]! });
      }
    } else {
      // Fallback: direct segment
      result.push({ ...a.position });
      result.push({ ...b.position });
    }
  }

  // Deduplicate consecutive identical points
  const deduped: Point[] = [];
  for (const pt of result) {
    const last = deduped[deduped.length - 1];
    if (!last || distance(last, pt) > 0.0001) {
      deduped.push(pt);
    }
  }

  return deduped;
}
