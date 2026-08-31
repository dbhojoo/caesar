import { specOf } from "../data/buildings.js";
import { HOUSING } from "../data/housing.js";
import type { City } from "../types.js";
import { inBounds } from "./grid.js";

/** C3: DES at range 1, then every STEP tiles add SZE, RANGE capped at 6. */
export function desirabilityField(city: City): Int16Array {
  const field = new Int16Array(city.width * city.height);
  for (let i = 0; i < city.tiles.length; i++) {
    const tile = city.tiles[i];
    if (!tile.garden && !tile.plaza) continue;
    const gx = i % city.width;
    const gy = Math.floor(i / city.width);
    if (tile.garden) {
      applyRing(city, field, gx, gy, 1, 1, 3);
      applyRing(city, field, gx, gy, 1, 2, 2);
      applyRing(city, field, gx, gy, 1, 3, 1);
    }
    if (tile.plaza) {
      applyRing(city, field, gx, gy, 1, 1, 4);
      applyRing(city, field, gx, gy, 1, 2, 2);
    }
  }
  for (const b of city.buildings) {
    if (b.type === "rubble") continue;
    const spec = specOf(b.type);
    let des = spec.des;
    let range = Math.min(6, spec.range);
    if (b.type === "house") {
      des = Math.min(6, Math.floor(b.houseLevel / 3));
      range = 2;
    }
    if (range <= 0 && des === 0) continue;
    const step = Math.max(1, spec.step || 1);
    const sizeStep = spec.sizeStep;
    for (let r = 1; r <= Math.max(range, des !== 0 ? 1 : 0); r++) {
      const value = des + Math.floor((r - 1) / step) * sizeStep;
      applyRing(city, field, b.x, b.y, b.size, r, value);
    }
  }
  return field;
}

function applyRing(
  city: City,
  field: Int16Array,
  x: number,
  y: number,
  size: number,
  range: number,
  value: number,
): void {
  const x0 = x - range;
  const y0 = y - range;
  const x1 = x + size - 1 + range;
  const y1 = y + size - 1 + range;
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      if (!inBounds(city, xx, yy)) continue;
      const onInner =
        xx >= x - (range - 1) &&
        xx <= x + size - 1 + (range - 1) &&
        yy >= y - (range - 1) &&
        yy <= y + size - 1 + (range - 1);
      if (range > 1 && onInner) continue;
      const inside = xx >= x && xx < x + size && yy >= y && yy < y + size;
      if (inside) continue;
      field[yy * city.width + xx] += value;
    }
  }
}

export function desirabilityAt(field: Int16Array, city: City, x: number, y: number, size: number): number {
  let sum = 0;
  let n = 0;
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      if (!inBounds(city, x + dx, y + dy)) continue;
      sum += field[(y + dy) * city.width + (x + dx)];
      n++;
    }
  }
  return n ? Math.round(sum / n) : 0;
}

export function houseDesirabilityHint(level: number): { devolve: number; evolve: number } {
  const spec = HOUSING[level];
  return { devolve: spec.devolveAt, evolve: spec.evolveAt };
}
