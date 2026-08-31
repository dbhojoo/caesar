import type { City, Point } from "../types.js";
import { inBounds, neighbors4, tileAt } from "./grid.js";

export type PassFn = (city: City, x: number, y: number) => boolean;

export function roadsPass(city: City, x: number, y: number): boolean {
  const t = tileAt(city, x, y);
  return !!t && (t.road || t.garden || t.plaza);
}

export function groundPass(city: City, x: number, y: number): boolean {
  const t = tileAt(city, x, y);
  if (!t) return false;
  if (t.terrain === "water" || t.terrain === "rock") return false;
  return true;
}

/** Destination walkers: BFS, fail past 500 tiles (documented C3/Pharaoh cap). */
export function findPath(city: City, from: Point, to: Point, pass: PassFn, limit = 500): Point[] | null {
  if (from.x === to.x && from.y === to.y) return [from];
  const key = (p: Point) => p.y * city.width + p.x;
  const q: Point[] = [from];
  const came = new Map<number, Point | null>();
  came.set(key(from), null);
  let head = 0;
  let steps = 0;
  while (head < q.length && steps < limit) {
    const cur = q[head++];
    steps++;
    for (const n of neighbors4(cur)) {
      if (!inBounds(city, n.x, n.y)) continue;
      if (!pass(city, n.x, n.y) && !(n.x === to.x && n.y === to.y)) continue;
      const k = key(n);
      if (came.has(k)) continue;
      came.set(k, cur);
      if (n.x === to.x && n.y === to.y) {
        const path: Point[] = [n];
        let p: Point | null | undefined = cur;
        while (p) {
          path.push(p);
          p = came.get(key(p)) ?? null;
        }
        path.reverse();
        return path;
      }
      q.push(n);
    }
  }
  return null;
}

export function nearestRoad(city: City, x: number, y: number, size: number): Point | null {
  const spots: Point[] = [];
  for (let i = 0; i < size; i++) {
    spots.push({ x: x + i, y: y - 1 });
    spots.push({ x: x + size, y: y + i });
    spots.push({ x: x + i, y: y + size });
    spots.push({ x: x - 1, y: y + i });
  }
  for (const s of spots) {
    if (roadsPass(city, s.x, s.y)) return s;
  }
  return null;
}

const CARDINALS: Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

/** Road near 8 tiles in a cardinal direction from the building origin. */
export function roamTarget(city: City, origin: Point, dir: number): Point | null {
  const d = CARDINALS[dir & 3];
  const center = { x: origin.x + d.x * 8, y: origin.y + d.y * 8 };
  const search = [
    center,
    { x: center.x + 1, y: center.y },
    { x: center.x - 1, y: center.y },
    { x: center.x, y: center.y + 1 },
    { x: center.x, y: center.y - 1 },
    { x: center.x + 1, y: center.y + 1 },
    { x: center.x - 1, y: center.y - 1 },
    { x: center.x + 2, y: center.y },
    { x: center.x - 2, y: center.y },
    { x: center.x, y: center.y + 2 },
    { x: center.x, y: center.y - 2 },
  ];
  for (const s of search) {
    if (roadsPass(city, s.x, s.y)) return s;
  }
  return nearestRoad(city, origin.x, origin.y, 1);
}
