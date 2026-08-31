import { specOf } from "../data/buildings.js";
import { FOOD_KINDS, GOOD_KINDS, LOAD, getStock, takeStock } from "../data/resources.js";
import { chebyshev } from "../map/grid.js";
import { findPath, nearestRoad, roadsPass } from "../map/path.js";
import { computeWater } from "../map/water.js";
import type { Building, City, ResourceKind } from "../types.js";
import { spawnDestination, spawnPatrol } from "./walkers.js";
import { cartDestination, nearestWithStock, warehouseGettingNeeds } from "./warehouse.js";

export function produceAndTrade(city: City): void {
  produceRaw(city);
  produceWorkshops(city);
  runWarehouses(city);
  runMarkets(city);
}

function produceRaw(city: City): void {
  for (const b of city.buildings) {
    const spec = specOf(b.type);
    if (!spec.produces || b.employees <= 0) continue;
    b.production += b.employees;
    if (b.production >= 200) {
      b.production -= 200;
      sendOutputCart(city, b, spec.produces);
    }
  }
}

function produceWorkshops(city: City): void {
  for (const b of city.buildings) {
    const recipe = specOf(b.type).recipe;
    if (!recipe || b.employees <= 0) continue;
    if (hasOutgoingCart(city, b)) continue;
    if (getStock(b, recipe.in) < LOAD) {
      sendFetchCart(city, b, recipe.in);
      continue;
    }
    b.production += b.employees;
    if (b.production >= 200) {
      b.production -= 200;
      takeStock(b, recipe.in, LOAD);
      sendOutputCart(city, b, recipe.out);
    }
  }
}

function runWarehouses(city: City): void {
  for (const b of city.buildings) {
    if (b.type !== "warehouse" || b.employees <= 0) continue;
    if (city.walkers.some((w) => w.buildingId === b.id && w.kind === "warehouseGetter")) continue;
    const need = warehouseGettingNeeds(b);
    if (!need) continue;
    const src = nearestWithStock(city, b.x, b.y, need, b.id);
    const from = nearestRoad(city, b.x, b.y, b.size);
    if (!src || !from) continue;
    const to = nearestRoad(city, src.x, src.y, src.size);
    if (!to || !findPath(city, from, to, roadsPass)) continue;
    const w = spawnDestination(city, "warehouseGetter", from, to, b.id);
    if (w) w.cargo = undefined;
  }
}

function runMarkets(city: City): void {
  for (const market of city.buildings) {
    if (market.type !== "market" || market.employees <= 0) continue;
    const food = Object.values(market.stocks.foods).reduce((a, n) => a + (n ?? 0), 0);
    if (food < 80) sendBuyer(city, market, "food");
    else if (GOOD_KINDS.some((g) => getStock(market, g) < 80)) sendBuyer(city, market, "goods");
    spawnPatrol(city, market, "marketTrader");
  }
}

function hasOutgoingCart(city: City, b: Building): boolean {
  return city.walkers.some((w) => w.buildingId === b.id && (w.kind === "cartPusher" || w.kind === "warehouseGetter" || w.kind === "marketBuyer"));
}

function sendOutputCart(city: City, b: Building, kind: ResourceKind): void {
  if (hasOutgoingCart(city, b)) return;
  const dest = cartDestination(city, b.x, b.y, kind);
  const from = nearestRoad(city, b.x, b.y, b.size);
  if (!dest || !from) return;
  const to = nearestRoad(city, dest.x, dest.y, dest.size);
  if (!to) return;
  const w = spawnDestination(city, "cartPusher", from, to, b.id);
  if (w) w.cargo = { kind, amount: LOAD };
}

function sendFetchCart(city: City, b: Building, kind: ResourceKind): void {
  if (hasOutgoingCart(city, b)) return;
  const src = nearestWithStock(city, b.x, b.y, kind, b.id);
  const from = nearestRoad(city, b.x, b.y, b.size);
  if (!src || !from) return;
  const to = nearestRoad(city, src.x, src.y, src.size);
  if (!to || !findPath(city, from, to, roadsPass)) return;
  spawnDestination(city, "cartPusher", from, to, b.id);
}

function sendBuyer(city: City, market: Building, want: "food" | "goods"): void {
  if (city.walkers.some((w) => w.buildingId === market.id && w.kind === "marketBuyer")) return;
    const dest =
      want === "food"
        ? FOOD_KINDS.map((k) => nearestWithStock(city, market.x, market.y, k)).find((b) => b) ?? null
        : GOOD_KINDS.map((g) => nearestWithStock(city, market.x, market.y, g)).find((b) => b) ?? null;
  const from = nearestRoad(city, market.x, market.y, market.size);
  if (!dest || !from) return;
  const to = nearestRoad(city, dest.x, dest.y, dest.size);
  if (!to || !findPath(city, from, to, roadsPass)) return;
  spawnDestination(city, "marketBuyer", from, to, market.id);
}

export function spawnServiceWalkers(city: City): void {
  sendActorsToTheaters(city);
  const pipes = computeWater(city).pipes;
  for (const b of city.buildings) {
    const spec = specOf(b.type);
    const kind = spec.walker;
    if (!kind) continue;
    if (kind === "marketTrader") continue;
    if (kind === "actor" && b.shows <= 0) continue;
    if (spec.needsPipes && !pipes[b.y * city.width + b.x]) continue;
    spawnPatrol(city, b, kind);
  }
}

function sendActorsToTheaters(city: City): void {
  for (const colony of city.buildings) {
    if (colony.type !== "actorColony" || colony.employees <= 0) continue;
    if (city.walkers.some((w) => w.buildingId === colony.id && w.kind === "performer")) continue;
    const theater = city.buildings
      .filter((b) => b.type === "theater" && b.employees > 0 && b.shows < 1)
      .sort((a, b) => chebyshev({ x: colony.x, y: colony.y }, { x: a.x, y: a.y }) - chebyshev({ x: colony.x, y: colony.y }, { x: b.x, y: b.y }))[0];
    if (!theater) continue;
    const from = nearestRoad(city, colony.x, colony.y, colony.size);
    const to = nearestRoad(city, theater.x, theater.y, theater.size);
    if (!from || !to) continue;
    spawnDestination(city, "performer", from, to, colony.id);
  }
  for (const b of city.buildings) {
    if (b.type === "theater" && b.employees <= 0) b.shows = 0;
  }
}
