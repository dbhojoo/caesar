import { computeWater } from "../map/water.js";
import { desirabilityField } from "../map/desirability.js";
import type { City, Overlay } from "../types.js";
import { cityStats } from "./stats.js";

export interface ViewWalker {
  id: number;
  kind: string;
  x: number;
  y: number;
  fx: number;
  fy: number;
}

export interface ViewBuilding {
  id: number;
  type: string;
  x: number;
  y: number;
  size: number;
  houseLevel: number;
  population: number;
  filled: boolean;
  employees: number;
  fire: number;
  damage: number;
}

export interface CitySnapshot {
  id: string;
  name: string;
  tick: number;
  width: number;
  height: number;
  tiles: { terrain: string; road: boolean; aqueduct: boolean; garden: boolean; plaza: boolean }[];
  buildings: ViewBuilding[];
  walkers: ViewWalker[];
  stats: ReturnType<typeof cityStats>;
  messages: { tick: number; text: string }[];
  water: number[];
  pipes: number[];
  desirability: number[];
  overlay: Overlay;
}

export function snapshot(city: City, overlay: Overlay = "none"): CitySnapshot {
  const water = computeWater(city);
  const des = desirabilityField(city);
  return {
    id: city.id,
    name: city.name,
    tick: city.tick,
    width: city.width,
    height: city.height,
    tiles: city.tiles.map((t) => ({
      terrain: t.terrain,
      road: t.road,
      aqueduct: t.aqueduct,
      garden: t.garden,
      plaza: t.plaza,
    })),
    buildings: city.buildings.map((b) => ({
      id: b.id,
      type: b.type,
      x: b.x,
      y: b.y,
      size: b.size,
      houseLevel: b.houseLevel,
      population: b.population,
      filled: b.filled,
      employees: b.employees,
      fire: b.fire,
      damage: b.damage,
    })),
    walkers: city.walkers.map((w) => ({
      id: w.id,
      kind: w.kind,
      x: w.x,
      y: w.y,
      fx: w.fx,
      fy: w.fy,
    })),
    stats: cityStats(city),
    messages: city.messages.slice(-8),
    water: Array.from(water.access),
    pipes: Array.from(water.pipes),
    desirability: Array.from(des),
    overlay,
  };
}
