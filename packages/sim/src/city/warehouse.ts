import { FOOD_KINDS, GOOD_KINDS, LOAD, accepts, addStock, getStock, isFood, orderOf, spaceLeft, takeStock } from "../data/resources.js";
import { specOf } from "../data/buildings.js";
import { chebyshev } from "../map/grid.js";
import type { Building, City, ResourceKind } from "../types.js";

export function nearestAcceptingStore(
  city: City,
  x: number,
  y: number,
  kind: ResourceKind,
  prefer: "granary" | "warehouse" | "any" = "any",
): Building | null {
  let best: Building | null = null;
  let bestD = 1e9;
  for (const b of city.buildings) {
    if (b.type !== "granary" && b.type !== "warehouse") continue;
    if (prefer === "granary" && b.type !== "granary") continue;
    if (prefer === "warehouse" && b.type !== "warehouse") continue;
    if (!accepts(b, kind)) continue;
    if (spaceLeft(b) < LOAD) continue;
    const d = chebyshev({ x, y }, { x: b.x, y: b.y });
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}

export function nearestWithStock(
  city: City,
  x: number,
  y: number,
  kind: ResourceKind,
  exceptId?: number,
): Building | null {
  let best: Building | null = null;
  let bestD = 1e9;
  for (const b of city.buildings) {
    if (b.id === exceptId) continue;
    if (getStock(b, kind) < LOAD) continue;
    if (b.type !== "granary" && b.type !== "warehouse" && b.type !== "market") {
      const recipe = specOf(b.type).recipe;
      if (!recipe || recipe.out !== kind) continue;
      if (b.employees <= 0) continue;
    } else if (b.employees <= 0) continue;
    const d = chebyshev({ x, y }, { x: b.x, y: b.y });
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}

export function nearestWorkshopWanting(city: City, x: number, y: number, kind: ResourceKind): Building | null {
  let best: Building | null = null;
  let bestD = 1e9;
  for (const b of city.buildings) {
    const recipe = specOf(b.type).recipe;
    if (!recipe || recipe.in !== kind) continue;
    if (b.employees <= 0) continue;
    if (getStock(b, kind) >= LOAD * 2) continue;
    if (spaceLeft(b) < LOAD) continue;
    const d = chebyshev({ x, y }, { x: b.x, y: b.y });
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}

export function cartDestination(city: City, x: number, y: number, kind: ResourceKind): Building | null {
  const workshop = nearestWorkshopWanting(city, x, y, kind);
  if (isFood(kind)) {
    return nearestAcceptingStore(city, x, y, kind, "granary") ?? nearestAcceptingStore(city, x, y, kind, "warehouse") ?? workshop;
  }
  return workshop ?? nearestAcceptingStore(city, x, y, kind, "warehouse") ?? nearestAcceptingStore(city, x, y, kind, "any");
}

export function deliverCargo(city: City, _x: number, _y: number, kind: ResourceKind, amount: number, near: (b: Building) => boolean): boolean {
  const tryGive = (b: Building): boolean => {
    if (!near(b)) return false;
    if (b.type === "granary" || b.type === "warehouse") {
      if (!accepts(b, kind) || spaceLeft(b) <= 0) return false;
    } else {
      const recipe = specOf(b.type).recipe;
      if (!recipe || recipe.in !== kind) return false;
      if (spaceLeft(b) <= 0) return false;
    }
    return addStock(b, kind, amount) > 0;
  };

  for (const b of city.buildings) {
    if (tryGive(b)) return true;
  }
  return false;
}

export function loadFromStore(
  city: City,
  _x: number,
  _y: number,
  near: (b: Building) => boolean,
  want?: ResourceKind,
): { kind: ResourceKind; amount: number } | null {
  for (const b of city.buildings) {
    if (!near(b)) continue;
    if (b.type !== "granary" && b.type !== "warehouse") continue;
    if (b.employees <= 0) continue;
    const kinds: ResourceKind[] = want
      ? [want]
      : b.type === "granary"
        ? [...FOOD_KINDS]
        : [...GOOD_KINDS, ...FOOD_KINDS];
    for (const k of kinds) {
      if (getStock(b, k) < LOAD) continue;
      const n = takeStock(b, k, LOAD);
      if (n > 0) return { kind: k, amount: n };
    }
  }
  return null;
}

export function warehouseGettingNeeds(warehouse: Building): ResourceKind | null {
  const keys = Object.keys(warehouse.orders) as ResourceKind[];
  for (const k of keys) {
    if (orderOf(warehouse, k) !== "getting") continue;
    if (getStock(warehouse, k) >= LOAD * 4) continue;
    if (spaceLeft(warehouse) < LOAD) continue;
    return k;
  }
  return null;
}
