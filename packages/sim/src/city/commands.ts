import { specOf } from "../data/buildings.js";
import { houseCapacity } from "../data/housing.js";
import { nextOrder, orderOf } from "../data/resources.js";
import { footprint, inBounds, isBuildableTerrain, neighbors4, tileAt } from "../map/grid.js";
import type { BuildCommand, BuildingType, City, Point, ResourceKind, WarehouseOrder } from "../types.js";
import { openTrade } from "./empire.js";
import { createBuilding } from "./helpers.js";

export function applyCommand(city: City, cmd: BuildCommand): string | null {
  if (cmd.type === "place") return place(city, cmd.building, cmd.x, cmd.y);
  if (cmd.type === "clear") return clearTile(city, cmd.x, cmd.y);
  if (cmd.type === "setOrder") return setOrder(city, cmd.x, cmd.y, cmd.resource, cmd.order);
  if (cmd.type === "openTrade") return openTrade(city, cmd.cityId);
  const cells = line(cmd.from, cmd.to);
  let last: string | null = null;
  for (const c of cells) last = place(city, cmd.building, c.x, c.y) ?? last;
  return last;
}

export function place(city: City, type: BuildingType, x: number, y: number): string | null {
  const spec = specOf(type);
  if (type === "road") return placeRoad(city, x, y);
  if (type === "aqueduct") return placeAqueduct(city, x, y);
  if (type === "garden") return placeGarden(city, x, y);
  if (type === "plaza") return placePlaza(city, x, y);

  if (!canFit(city, x, y, spec.size, type)) return "The land is not suitable.";
  if (city.treasury < spec.cost) return "The treasury cannot afford that.";

  const b = createBuilding(type, x, y);
  if (type === "house") b.capacity = houseCapacity(0, 1);
  city.buildings.push(b);
  for (const p of footprint(x, y, spec.size)) {
    const t = tileAt(city, p.x, p.y)!;
    t.buildingId = b.id;
    if (type === "house") t.road = t.road;
  }
  city.treasury -= spec.cost;
  return null;
}

function placeRoad(city: City, x: number, y: number): string | null {
  const t = tileAt(city, x, y);
  if (!t || !isBuildableTerrain(t.terrain)) return "The land is not suitable.";
  if (t.aqueduct) return "An aqueduct already stands there.";
  if (t.buildingId != null) return "Something already occupies that tile.";
  if (t.road) return null;
  if (city.treasury < 4) return "The treasury cannot afford that.";
  t.road = true;
  city.treasury -= 4;
  return null;
}

function placeAqueduct(city: City, x: number, y: number): string | null {
  const t = tileAt(city, x, y);
  if (!t || !isBuildableTerrain(t.terrain)) return "The land is not suitable.";
  if (t.road || t.garden) return "Roads cannot carry an aqueduct here.";
  if (t.buildingId != null || t.aqueduct) return "Something already occupies that tile.";
  if (city.treasury < 8) return "The treasury cannot afford that.";
  t.aqueduct = true;
  city.treasury -= 8;
  return null;
}

function placeGarden(city: City, x: number, y: number): string | null {
  const t = tileAt(city, x, y);
  if (!t || !isBuildableTerrain(t.terrain)) return "The land is not suitable.";
  if (t.buildingId != null || t.aqueduct) return "Something already occupies that tile.";
  if (city.treasury < 12) return "The treasury cannot afford that.";
  t.garden = true;
  city.treasury -= 12;
  return null;
}

function placePlaza(city: City, x: number, y: number): string | null {
  const t = tileAt(city, x, y);
  if (!t || !t.road) return "Plazas are laid on roads.";
  if (t.plaza) return null;
  if (city.treasury < 15) return "The treasury cannot afford that.";
  t.plaza = true;
  city.treasury -= 15;
  return null;
}

export function clearTile(city: City, x: number, y: number): string | null {
  const t = tileAt(city, x, y);
  if (!t) return "Out of bounds.";
  if (t.road) t.road = false;
  if (t.aqueduct) t.aqueduct = false;
  if (t.garden) t.garden = false;
  if (t.plaza) t.plaza = false;
  if (t.buildingId != null) {
    const b = city.buildings.find((bb) => bb.id === t.buildingId);
    if (b) {
      city.walkers = city.walkers.filter((w) => w.buildingId !== b.id);
      for (const p of footprint(b.x, b.y, b.size)) {
        const tt = tileAt(city, p.x, p.y);
        if (tt) tt.buildingId = null;
      }
      city.buildings = city.buildings.filter((bb) => bb.id !== b.id);
    }
  }
  return null;
}

function canFit(city: City, x: number, y: number, size: number, type: BuildingType): boolean {
  const spec = specOf(type);
  let meadow = 0;
  let trees = 0;
  let rock = 0;
  for (const p of footprint(x, y, size)) {
    if (!inBounds(city, p.x, p.y)) return false;
    const t = tileAt(city, p.x, p.y)!;
    if (t.buildingId != null || t.road || t.aqueduct) return false;
    const ok =
      isBuildableTerrain(t.terrain) ||
      type === "reservoir" ||
      (spec.needsTrees && t.terrain === "trees") ||
      (spec.needsRock && t.terrain === "rock");
    if (!ok) return false;
    if (t.terrain === "meadow") meadow++;
    if (t.terrain === "trees") trees++;
    if (t.terrain === "rock") rock++;
  }
  if (spec.needsMeadow && meadow < size) return false;
  if (spec.needsTrees && trees < 1) return false;
  if (spec.needsRock && rock < 1) return false;
  if (type === "dock" && !touchesWater(city, x, y, size)) return false;
  return true;
}

function touchesWater(city: City, x: number, y: number, size: number): boolean {
  for (const p of footprint(x, y, size)) {
    for (const n of neighbors4(p)) {
      if (tileAt(city, n.x, n.y)?.terrain === "water") return true;
    }
  }
  return false;
}

function setOrder(city: City, x: number, y: number, resource: ResourceKind, order: WarehouseOrder): string | null {
  const t = tileAt(city, x, y);
  if (!t || t.buildingId == null) return "There is no warehouse there.";
  const b = city.buildings.find((bb) => bb.id === t.buildingId);
  if (!b || (b.type !== "warehouse" && b.type !== "granary")) return "Orders are set on warehouses.";
  b.orders[resource] = order;
  return null;
}

export function cycleWarehouseOrder(city: City, x: number, y: number, resource: ResourceKind): WarehouseOrder | null {
  const t = tileAt(city, x, y);
  if (!t || t.buildingId == null) return null;
  const b = city.buildings.find((bb) => bb.id === t.buildingId);
  if (!b || (b.type !== "warehouse" && b.type !== "granary")) return null;
  const next = nextOrder(orderOf(b, resource));
  b.orders[resource] = next;
  return next;
}

function line(a: Point, b: Point): Point[] {
  const cells: Point[] = [];
  let x = a.x;
  let y = a.y;
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);
  cells.push({ x, y });
  while (x !== b.x || y !== b.y) {
    if (x !== b.x) x += dx;
    else y += dy;
    cells.push({ x, y });
  }
  return cells;
}
