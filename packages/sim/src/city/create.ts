import { defaultEmpire } from "../data/empire.js";
import { resetIds } from "../ids.js";
import { makeTiles } from "../map/grid.js";
import { mulberry32 } from "../rng.js";
import type { City, Climate, Terrain } from "../types.js";

export interface NewCityOptions {
  id?: string;
  name?: string;
  width?: number;
  height?: number;
  climate?: Climate;
  treasury?: number;
  seed?: number;
  year?: number;
}

export function createCity(opts: NewCityOptions = {}): City {
  resetIds(1);
  const width = opts.width ?? 48;
  const height = opts.height ?? 48;
  const seed = opts.seed ?? 330;
  const tiles = makeTiles(width, height);
  const rng = mulberry32(seed);
  // C3 plants a merge bit on a subset of tiles at map creation.
  for (const t of tiles) t.mergeable = rng() < 0.55;
  return {
    id: opts.id ?? "city",
    name: opts.name ?? "Colonia",
    climate: opts.climate ?? "central",
    tick: 0,
    seed,
    treasury: opts.treasury ?? 3000,
    taxRate: 7,
    wage: 30,
    width,
    height,
    tiles,
    buildings: [],
    walkers: [],
    entry: { x: Math.floor(width / 2), y: height - 2 },
    messages: [],
    nextId: 1,
    empire: defaultEmpire(),
  };
}

export function paintTerrain(city: City, x: number, y: number, terrain: Terrain): void {
  if (x < 0 || y < 0 || x >= city.width || y >= city.height) return;
  city.tiles[y * city.width + x].terrain = terrain;
}

export function paintRect(city: City, x0: number, y0: number, x1: number, y1: number, terrain: Terrain): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) paintTerrain(city, x, y, terrain);
  }
}

export function cityRng(city: City): () => number {
  return mulberry32((city.seed + city.tick * 17) >>> 0);
}
