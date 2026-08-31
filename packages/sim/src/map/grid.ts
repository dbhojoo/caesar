import type { City, Point, Terrain, Tile } from "../types.js";

export function idx(city: City, x: number, y: number): number {
  return y * city.width + x;
}

export function inBounds(city: City, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < city.width && y < city.height;
}

export function tileAt(city: City, x: number, y: number): Tile | null {
  if (!inBounds(city, x, y)) return null;
  return city.tiles[idx(city, x, y)];
}

export function neighbors4(p: Point): Point[] {
  return [
    { x: p.x, y: p.y - 1 },
    { x: p.x + 1, y: p.y },
    { x: p.x, y: p.y + 1 },
    { x: p.x - 1, y: p.y },
  ];
}

export function chebyshev(a: Point, b: Point): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function manhattan(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function footprint(x: number, y: number, size: number): Point[] {
  const cells: Point[] = [];
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) cells.push({ x: x + dx, y: y + dy });
  }
  return cells;
}

export function ringAround(x: number, y: number, size: number, range: number): Point[] {
  const cells: Point[] = [];
  const x0 = x - range;
  const y0 = y - range;
  const x1 = x + size - 1 + range;
  const y1 = y + size - 1 + range;
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      const inside = xx >= x && xx < x + size && yy >= y && yy < y + size;
      if (!inside) cells.push({ x: xx, y: yy });
    }
  }
  return cells;
}

export function isRoadLike(tile: Tile | null): boolean {
  if (!tile) return false;
  return tile.road || tile.garden || tile.plaza;
}

export function isBuildableTerrain(t: Terrain): boolean {
  return t === "grass" || t === "meadow";
}

export function makeTiles(width: number, height: number, fill: Terrain = "grass"): Tile[] {
  return Array.from({ length: width * height }, () => ({
    terrain: fill,
    road: false,
    aqueduct: false,
    garden: false,
    plaza: false,
    mergeable: false,
    buildingId: null,
  }));
}
