import type { City } from "../types.js";
import { footprint, inBounds, neighbors4, tileAt } from "./grid.js";

export interface WaterMaps {
  /** 0 none, 1 well, 2 fountain */
  access: Uint8Array;
  pipes: Uint8Array;
  reservoirFilled: Set<number>;
}

const PIPE_RANGE = 10;
const WELL_RANGE = 2;
const FOUNTAIN_RANGE = 4;

export function computeWater(city: City): WaterMaps {
  const pipes = new Uint8Array(city.width * city.height);
  const access = new Uint8Array(city.width * city.height);
  const filled = new Set<number>();

  const reservoirs = city.buildings.filter((b) => b.type === "reservoir" && b.employees > 0);
  const sourceIds = new Set<number>();
  for (const r of reservoirs) {
    if (touchesWater(city, r.x, r.y, r.size) && r.employees >= 5) {
      sourceIds.add(r.id);
      filled.add(r.id);
      r.filled = true;
    } else {
      r.filled = false;
    }
  }

  // Aqueduct flood-fill from filled reservoirs to empty ones.
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of reservoirs) {
      if (filled.has(r.id)) continue;
      if (connectedByAqueduct(city, r, filled)) {
        filled.add(r.id);
        r.filled = true;
        changed = true;
      }
    }
  }

  for (const r of city.buildings) {
    if (r.type !== "reservoir") continue;
    if (!filled.has(r.id)) continue;
    stampRange(city, pipes, r.x, r.y, r.size, PIPE_RANGE, 1);
  }

  for (const b of city.buildings) {
    if (b.type === "well") {
      stampRange(city, access, b.x, b.y, 1, WELL_RANGE, 1);
    }
    if (b.type === "fountain" && b.employees > 0 && pipes[b.y * city.width + b.x]) {
      stampRange(city, access, b.x, b.y, 1, FOUNTAIN_RANGE, 2);
    }
  }

  return { access, pipes, reservoirFilled: filled };
}

function stampRange(
  city: City,
  field: Uint8Array,
  x: number,
  y: number,
  size: number,
  range: number,
  value: number,
): void {
  for (let yy = y - range; yy < y + size + range; yy++) {
    for (let xx = x - range; xx < x + size + range; xx++) {
      if (!inBounds(city, xx, yy)) continue;
      const i = yy * city.width + xx;
      if (field[i] < value) field[i] = value;
    }
  }
}

function touchesWater(city: City, x: number, y: number, size: number): boolean {
  for (const p of footprint(x, y, size)) {
    for (const n of neighbors4(p)) {
      const t = tileAt(city, n.x, n.y);
      if (t?.terrain === "water") return true;
    }
  }
  return false;
}

function connectedByAqueduct(city: City, dest: { x: number; y: number; size: number }, filled: Set<number>): boolean {
  const start = edgeAqueducts(city, dest.x, dest.y, dest.size);
  if (!start.length) return false;
  const seen = new Set<number>();
  const q = [...start];
  while (q.length) {
    const p = q.pop()!;
    const k = p.y * city.width + p.x;
    if (seen.has(k)) continue;
    seen.add(k);
    for (const n of neighbors4(p)) {
      if (!inBounds(city, n.x, n.y)) continue;
      const t = tileAt(city, n.x, n.y);
      if (t?.aqueduct) q.push(n);
      if (t?.buildingId != null) {
        const b = city.buildings.find((bb) => bb.id === t.buildingId);
        if (b?.type === "reservoir" && filled.has(b.id)) return true;
      }
    }
  }
  return false;
}

function edgeAqueducts(city: City, x: number, y: number, size: number) {
  const out = [];
  for (const p of footprint(x, y, size)) {
    for (const n of neighbors4(p)) {
      if (tileAt(city, n.x, n.y)?.aqueduct) out.push(n);
    }
  }
  return out;
}

export function waterAt(maps: WaterMaps, city: City, x: number, y: number): number {
  return maps.access[y * city.width + x] ?? 0;
}
