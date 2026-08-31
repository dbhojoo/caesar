import { specOf } from "../data/buildings.js";
import { allocId } from "../ids.js";
import { chebyshev } from "../map/grid.js";
import type { Building, City, ServiceAccess, Stocks, Walker, WalkerKind } from "../types.js";

export function emptyServices(): ServiceAccess {
  return {
    religion: {},
    entertainment: 0,
    entertainmentPoints: 0,
    education: 0,
    school: 0,
    library: 0,
    academy: 0,
    barber: 0,
    bath: 0,
    doctor: 0,
    hospital: 0,
    market: 0,
  };
}

export function emptyStocks(): Stocks {
  return { foods: {}, goods: {}, raws: {} };
}

export function pushMessage(city: City, text: string): void {
  city.messages.push({ tick: city.tick, text });
  if (city.messages.length > 40) city.messages.splice(0, city.messages.length - 40);
}

export function createBuilding(type: Building["type"], x: number, y: number): Building {
  const spec = specOf(type);
  return {
    id: allocId(),
    type,
    x,
    y,
    size: spec.size,
    employees: 0,
    laborAccess: type === "well" || type === "house" ? 300 : 0,
    fire: 0,
    damage: 0,
    houseLevel: 0,
    population: 0,
    capacity: 0,
    services: emptyServices(),
    stocks: emptyStocks(),
    production: 0,
    walkerIds: [],
    roamCycle: 0,
    filled: false,
    shows: 0,
    orders: {},
  };
}

export function createWalker(kind: WalkerKind, x: number, y: number, buildingId: number | null): Walker {
  return {
    id: allocId(),
    kind,
    buildingId,
    x,
    y,
    fx: x,
    fy: y,
    path: [],
    pathIndex: 0,
    progress: 0,
    tilesWalked: 0,
    mode: "destination",
    roamDir: 0,
  };
}

export function buildingAt(city: City, x: number, y: number): Building | undefined {
  const t = city.tiles[y * city.width + x];
  if (t?.buildingId == null) return undefined;
  return city.buildings.find((b) => b.id === t.buildingId);
}

export function houses(city: City): Building[] {
  return city.buildings.filter((b) => b.type === "house");
}

export function occupiedHouses(city: City): Building[] {
  return houses(city).filter((b) => b.population > 0);
}

export function nearFootprint(x: number, y: number, b: { x: number; y: number; size: number }, range = 1): boolean {
  for (let dy = 0; dy < b.size; dy++) {
    for (let dx = 0; dx < b.size; dx++) {
      if (chebyshev({ x, y }, { x: b.x + dx, y: b.y + dy }) <= range) return true;
    }
  }
  return false;
}
