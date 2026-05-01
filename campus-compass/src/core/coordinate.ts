// ============================================================
// CampusCompass - Coordinate Transformations
// ============================================================
//
// Building elements use normalized relative coords (0–1).
// The canvas overlay is anchored to EB building geographic bounds.
// This module converts between the two systems.
// ============================================================

import { Point, GeoBounds, LatLng } from './types';
import { EB_BOUNDS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

/** Convert normalized (0–1) point to canvas pixel position */
export function relToPixel(p: Point, w = CANVAS_WIDTH, h = CANVAS_HEIGHT): { px: number; py: number } {
  return { px: p.x * w, py: p.y * h };
}

/** Convert canvas pixel position to normalized (0–1) point */
export function pixelToRel(px: number, py: number, w = CANVAS_WIDTH, h = CANVAS_HEIGHT): Point {
  return { x: px / w, y: py / h };
}

/** Convert normalized point to geographic coordinates */
export function relToLatLng(p: Point, bounds: GeoBounds = EB_BOUNDS): LatLng {
  return {
    lat: bounds.north - p.y * (bounds.north - bounds.south),
    lng: bounds.west + p.x * (bounds.east - bounds.west),
  };
}

/** Convert geographic coordinates to normalized point */
export function latLngToRel(ll: LatLng, bounds: GeoBounds = EB_BOUNDS): Point {
  return {
    x: (ll.lng - bounds.west) / (bounds.east - bounds.west),
    y: (bounds.north - ll.lat) / (bounds.north - bounds.south),
  };
}

/** Euclidean distance between two normalized points */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
