import { specOf } from "../data/buildings.js";
import { GOOD_KINDS, LOAD, TRADE_PRICE, addStock, getStock, takeStock } from "../data/resources.js";
import { TICKS_PER_TILE } from "../time.js";
import type { Building, City, God, Point, Walker, WalkerKind } from "../types.js";
import { chebyshev, neighbors4 } from "../map/grid.js";
import { findPath, groundPass, nearestRoad, roadsPass, roamTarget } from "../map/path.js";
import { createWalker, nearFootprint } from "./helpers.js";
import { deliverCargo, loadFromStore } from "./warehouse.js";

const ROAM_LIMIT = 26;
const SERVICE_RANGE = 2;
const SERVICE_LIFE = 96;
const NO_ROAM = new Set<WalkerKind>(["cartPusher", "marketBuyer", "warehouseGetter", "caravan", "docker", "performer"]);

export function moveWalkers(city: City): void {
  for (const w of city.walkers) {
    w.progress += 1;
    if (w.progress < TICKS_PER_TILE) {
      interpolate(w);
      continue;
    }
    w.progress = 0;
    stepWalker(city, w);
    interpolate(w);
  }
}

function interpolate(w: Walker): void {
  const next = w.path[w.pathIndex + 1];
  if (!next) {
    w.fx = w.x;
    w.fy = w.y;
    return;
  }
  const t = w.progress / TICKS_PER_TILE;
  w.fx = w.x + (next.x - w.x) * t;
  w.fy = w.y + (next.y - w.y) * t;
}

function stepWalker(city: City, w: Walker): void {
  const roamLimit = w.kind === "schoolchild" ? 21 : ROAM_LIMIT;
  if (w.mode === "roam" && w.tilesWalked >= roamLimit) {
    if (w.kind === "schoolchild") {
      finishWalker(city, w);
      return;
    }
    beginReturn(city, w);
  }

  const next = w.path[w.pathIndex + 1];
  if (next) {
    w.pathIndex += 1;
    w.x = next.x;
    w.y = next.y;
    w.tilesWalked += 1;
    onEnterTile(city, w);
    return;
  }

  if (w.mode === "destination" && w.kind !== "immigrant") {
    if (NO_ROAM.has(w.kind)) {
      beginReturn(city, w);
      return;
    }
    w.mode = "roam";
    continueRoam(city, w);
    return;
  }
  if (w.mode === "roam") {
    continueRoam(city, w);
    return;
  }
  if (w.mode === "return" || w.kind === "immigrant") {
    finishWalker(city, w);
  }
}

function continueRoam(city: City, w: Walker): void {
  const options = neighbors4({ x: w.x, y: w.y }).filter((n) => roadsPass(city, n.x, n.y));
  if (!options.length) {
    beginReturn(city, w);
    return;
  }
  const prev = w.path[w.pathIndex - 1];
  const forward = options.filter((n) => !prev || n.x !== prev.x || n.y !== prev.y);
  const choices = forward.length ? forward : options;
  const pick = choices[(w.x * 31 + w.y * 17 + w.tilesWalked + w.roamDir) % choices.length];
  w.path = [{ x: w.x, y: w.y }, pick];
  w.pathIndex = 0;
}

function beginReturn(city: City, w: Walker): void {
  const home = city.buildings.find((b) => b.id === w.buildingId);
  const dest = home ? nearestRoad(city, home.x, home.y, home.size) ?? { x: home.x, y: home.y } : null;
  w.mode = "return";
  if (!dest) {
    finishWalker(city, w);
    return;
  }
  const path = findPath(city, { x: w.x, y: w.y }, dest, roadsPass);
  w.path = path ?? [{ x: w.x, y: w.y }];
  w.pathIndex = 0;
}

function finishWalker(city: City, w: Walker): void {
  const home = city.buildings.find((b) => b.id === w.buildingId);
  if (w.cargo && home) {
    if (w.kind === "marketBuyer" || w.kind === "warehouseGetter") {
      addStock(home, w.cargo.kind, w.cargo.amount);
      w.cargo = undefined;
    } else if (w.kind === "cartPusher") {
      const recipe = specOf(home.type).recipe;
      if (recipe && w.cargo.kind === recipe.in) {
        addStock(home, w.cargo.kind, w.cargo.amount);
        w.cargo = undefined;
      }
    }
  }
  if (home) home.walkerIds = home.walkerIds.filter((id) => id !== w.id);
  city.walkers = city.walkers.filter((x) => x.id !== w.id);
}

function onEnterTile(city: City, w: Walker): void {
  applyLaborSight(city, w);
  applyServices(city, w);
  applyRiskRelief(city, w);
  if (w.kind === "immigrant") trySettle(city, w);
  if (w.kind === "cartPusher") tryCart(city, w);
  if (w.kind === "marketBuyer") tryLoadMarket(city, w);
  if (w.kind === "warehouseGetter") tryLoadGetter(city, w);
  if (w.kind === "marketTrader") tryFeedHouses(city, w);
  if (w.kind === "performer") tryDeliverPerformer(city, w);
  if (w.kind === "caravan" || w.kind === "docker") tryTrade(city, w);
}

function aroundHouses(city: City, x: number, y: number): Building[] {
  const out: Building[] = [];
  for (const h of city.buildings) {
    if (h.type !== "house" || h.population <= 0) continue;
    if (nearFootprint(x, y, h, SERVICE_RANGE)) out.push(h);
  }
  return out;
}

function applyLaborSight(city: City, w: Walker): void {
  if (
    w.kind !== "laborSeeker" &&
    w.kind !== "prefect" &&
    w.kind !== "engineer" &&
    w.kind !== "priest" &&
    w.kind !== "doctor" &&
    w.kind !== "actor" &&
    w.kind !== "librarian" &&
    w.kind !== "barber" &&
    w.kind !== "bather"
  ) {
    return;
  }
  const home = city.buildings.find((b) => b.id === w.buildingId);
  if (!home) return;
  let add = 0;
  for (const h of city.buildings) {
    if (h.type !== "house" || h.population <= 0) continue;
    if (chebyshev({ x: w.x, y: w.y }, { x: h.x, y: h.y }) <= SERVICE_RANGE) add += h.size * h.size;
  }
  home.laborAccess = Math.min(300, home.laborAccess + add);
}

function applyServices(city: City, w: Walker): void {
  const houses = aroundHouses(city, w.x, w.y);
  if (!houses.length) return;
  const home = city.buildings.find((b) => b.id === w.buildingId);
  for (const h of houses) {
    if (w.kind === "priest" && home) {
      const god = specOf(home.type).god as God | undefined;
      if (god) h.services.religion[god] = SERVICE_LIFE;
    }
    if (w.kind === "doctor") h.services.doctor = SERVICE_LIFE;
    if (w.kind === "surgeon") h.services.hospital = SERVICE_LIFE;
    if (w.kind === "barber") h.services.barber = SERVICE_LIFE;
    if (w.kind === "bather") h.services.bath = SERVICE_LIFE;
    if (w.kind === "schoolchild") {
      h.services.school = SERVICE_LIFE;
      h.services.education = SERVICE_LIFE;
    }
    if (w.kind === "librarian") {
      h.services.library = SERVICE_LIFE;
      h.services.education = SERVICE_LIFE;
    }
    if (w.kind === "scholar") h.services.academy = SERVICE_LIFE;
    if (w.kind === "actor") {
      h.services.entertainment = SERVICE_LIFE;
      h.services.entertainmentPoints = Math.max(h.services.entertainmentPoints, 10);
    }
    if (w.kind === "marketTrader") h.services.market = SERVICE_LIFE;
  }
}

function applyRiskRelief(city: City, w: Walker): void {
  if (w.kind !== "prefect" && w.kind !== "engineer") return;
  for (const b of city.buildings) {
    if (chebyshev({ x: w.x, y: w.y }, { x: b.x, y: b.y }) > SERVICE_RANGE) continue;
    if (w.kind === "prefect") b.fire = 0;
    if (w.kind === "engineer") b.damage = 0;
  }
}

function trySettle(city: City, w: Walker): void {
  const target = city.buildings.find((b) => b.id === w.buildingId);
  if (!target || target.type !== "house") return;
  if (!nearFootprint(w.x, w.y, target, 1)) return;
  const incoming = 4 + (w.id % 3);
  target.population = Math.min(target.capacity || 5, target.population + incoming);
  if (target.population > 0 && target.capacity < 5) target.capacity = 5;
  city.walkers = city.walkers.filter((x) => x.id !== w.id);
}

function tryCart(city: City, w: Walker): void {
  if (w.cargo) {
    const ok = deliverCargo(city, w.x, w.y, w.cargo.kind, w.cargo.amount, (b) => nearFootprint(w.x, w.y, b, 1));
    if (ok) {
      w.cargo = undefined;
      beginReturn(city, w);
    }
    return;
  }
  const home = city.buildings.find((b) => b.id === w.buildingId);
  const want = home ? specOf(home.type).recipe?.in : undefined;
  const loaded = loadFromStore(city, w.x, w.y, (b) => nearFootprint(w.x, w.y, b, 1), want);
  if (loaded) {
    w.cargo = loaded;
    beginReturn(city, w);
  }
}

function tryLoadMarket(city: City, w: Walker): void {
  if (w.cargo) return;
  const loaded = loadFromStore(city, w.x, w.y, (b) => nearFootprint(w.x, w.y, b, 1));
  if (loaded) {
    w.cargo = loaded;
    beginReturn(city, w);
  }
}

function tryLoadGetter(city: City, w: Walker): void {
  if (w.cargo) return;
  const home = city.buildings.find((b) => b.id === w.buildingId);
  const want = home
    ? (Object.keys(home.orders) as import("../types.js").ResourceKind[]).find((k) => home.orders[k] === "getting")
    : undefined;
  const loaded = loadFromStore(city, w.x, w.y, (b) => nearFootprint(w.x, w.y, b, 1), want);
  if (loaded) {
    w.cargo = loaded;
    beginReturn(city, w);
  }
}

function tryFeedHouses(city: City, w: Walker): void {
  const market = city.buildings.find((b) => b.id === w.buildingId);
  if (!market) return;
  for (const h of aroundHouses(city, w.x, w.y)) {
    const foodKind = (Object.keys(market.stocks.foods) as (keyof typeof market.stocks.foods)[]).find(
      (k) => (market.stocks.foods[k] ?? 0) > 0,
    );
    if (foodKind) {
      const have = h.stocks.foods[foodKind] ?? 0;
      if (have < 16) {
        const give = Math.min(8, market.stocks.foods[foodKind] ?? 0);
        if (give > 0) {
          market.stocks.foods[foodKind] = (market.stocks.foods[foodKind] ?? 0) - give;
          h.stocks.foods[foodKind] = have + give;
        }
      }
    }
    for (const g of GOOD_KINDS) {
      if (getStock(market, g) <= 0) continue;
      if (getStock(h, g) >= 16) continue;
      const give = Math.min(8, getStock(market, g));
      takeStock(market, g, give);
      addStock(h, g, give);
    }
    h.services.market = SERVICE_LIFE;
  }
}

function tryTrade(city: City, w: Walker): void {
  if (w.mode === "return") return;
  for (const store of city.buildings) {
    if (store.type !== "warehouse" && store.type !== "granary") continue;
    if (!nearFootprint(w.x, w.y, store, 1)) continue;
    const route = w.kind === "docker" ? "sea" : "land";
    const partner = city.empire.cities.find((c) => c.open && c.kind === route);
    if (!partner) return;
    for (const kind of partner.sells.slice(0, 2)) {
      const price = TRADE_PRICE[kind].buy;
      if (city.treasury < price) break;
      if (addStock(store, kind, LOAD) <= 0) break;
      city.treasury -= price;
    }
    for (const kind of partner.buys) {
      if (getStock(store, kind) < LOAD) continue;
      takeStock(store, kind, LOAD);
      city.treasury += TRADE_PRICE[kind].sell;
    }
    beginReturn(city, w);
    return;
  }
}

function tryDeliverPerformer(city: City, w: Walker): void {
  for (const venue of city.buildings) {
    if (venue.type !== "theater") continue;
    if (!nearFootprint(w.x, w.y, venue, 1)) continue;
    venue.shows = Math.min(2, venue.shows + 1);
    finishWalker(city, w);
    return;
  }
}

export function spawnPatrol(city: City, building: Building, kind: WalkerKind): Walker | null {
  if (building.employees <= 0 && kind !== "immigrant") return null;
  const cap = kind === "schoolchild" ? 4 : 1;
  const out = building.walkerIds.filter((id) => city.walkers.some((w) => w.id === id && w.kind === kind)).length;
  if (out >= cap) return null;
  const start = nearestRoad(city, building.x, building.y, building.size);
  if (!start) return null;
  const w = createWalker(kind, start.x, start.y, building.id);
  w.roamDir = building.roamCycle & 3;
  const target = roamTarget(city, { x: building.x, y: building.y }, w.roamDir);
  building.roamCycle = (building.roamCycle + 1) & 3;
  if (target) {
    const path = findPath(city, start, target, roadsPass);
    if (path) {
      w.path = path;
      w.mode = "destination";
    } else {
      w.mode = "roam";
    }
  } else {
    w.mode = "roam";
  }
  building.walkerIds.push(w.id);
  city.walkers.push(w);
  onEnterTile(city, w);
  return w;
}

export function spawnDestination(
  city: City,
  kind: WalkerKind,
  from: Point,
  to: Point,
  buildingId: number | null,
  pass = roadsPass,
): Walker | null {
  const path = findPath(city, from, to, pass);
  if (!path) return null;
  const w = createWalker(kind, from.x, from.y, buildingId);
  w.path = path;
  w.mode = "destination";
  city.walkers.push(w);
  if (buildingId != null) {
    const b = city.buildings.find((x) => x.id === buildingId);
    b?.walkerIds.push(w.id);
  }
  onEnterTile(city, w);
  return w;
}

export function spawnImmigrant(city: City, house: Building): Walker | null {
  const dest = nearestRoad(city, house.x, house.y, house.size) ?? { x: house.x, y: house.y };
  const start = city.entry;
  const path = findPath(city, start, dest, groundPass) ?? findPath(city, start, dest, roadsPass);
  if (!path) return null;
  const w = createWalker("immigrant", start.x, start.y, house.id);
  w.path = path;
  w.mode = "destination";
  city.walkers.push(w);
  house.walkerIds.push(w.id);
  return w;
}

export { groundPass, SERVICE_LIFE };
