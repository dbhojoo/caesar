import { LOAD, TRADE_PRICE, addStock, getStock, takeStock } from "../data/resources.js";
import { nearestRoad, groundPass, roadsPass } from "../map/path.js";
import type { Building, City, EmpireCity, ResourceKind } from "../types.js";
import { pushMessage } from "./helpers.js";
import { spawnDestination } from "./walkers.js";
import { nearestAcceptingStore } from "./warehouse.js";

const CARAVAN_GAP = 408;

export function tickEmpire(city: City): void {
  if (city.tick - city.empire.lastCaravanTick < CARAVAN_GAP) return;
  const landOpen = city.empire.cities.some((c) => c.open && c.kind === "land");
  const seaOpen = city.empire.cities.some((c) => c.open && c.kind === "sea");
  const tradePost = city.buildings.find((b) => b.type === "tradePost" && b.employees > 0);
  const dock = city.buildings.find((b) => b.type === "dock" && b.employees > 0);

  let spawned = false;
  if (landOpen && tradePost) spawned = spawnTrader(city, tradePost, "caravan", pickCity(city, "land")) || spawned;
  if (seaOpen && dock) spawned = spawnTrader(city, dock, "docker", pickCity(city, "sea")) || spawned;
  if (spawned) city.empire.lastCaravanTick = city.tick;
}

export function openTrade(city: City, cityId: string): string | null {
  const partner = city.empire.cities.find((c) => c.id === cityId);
  if (!partner) return "No such city trades with you.";
  if (partner.open) return "That route is already open.";
  if (city.treasury < partner.openCost) return "The treasury cannot afford that.";
  city.treasury -= partner.openCost;
  partner.open = true;
  pushMessage(city, `Trade with ${partner.name} is now open.`);
  return null;
}

function pickCity(city: City, kind: "land" | "sea"): EmpireCity | null {
  const open = city.empire.cities.filter((c) => c.open && c.kind === kind);
  if (!open.length) return null;
  return open[city.tick % open.length];
}

function spawnTrader(
  city: City,
  hub: Building,
  kind: "caravan" | "docker",
  partner: EmpireCity | null,
): boolean {
  if (!partner) return false;
  if (city.walkers.some((w) => w.kind === kind && w.buildingId === hub.id)) return false;
  const dest = nearestAcceptingStore(city, hub.x, hub.y, partner.sells[0] ?? "wheat") ?? hub;
  const from = kind === "caravan" ? city.entry : nearestRoad(city, hub.x, hub.y, hub.size);
  const to = nearestRoad(city, dest.x, dest.y, dest.size);
  if (!from || !to) return false;
  const w = spawnDestination(city, kind, from, to, hub.id, kind === "caravan" ? groundPass : roadsPass);
  if (!w) return false;
  w.cargo = { kind: partner.sells[0] ?? "pottery", amount: LOAD };
  return true;
}

export function tradeAtStore(city: City, store: Building, partner: EmpireCity | undefined): void {
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
}

export function partnerForWalker(city: City, kind: string): EmpireCity | undefined {
  const route = kind === "docker" ? "sea" : "land";
  return city.empire.cities.filter((c) => c.open && c.kind === route)[0];
}

export function tradeGoodsList(city: EmpireCity): string {
  const sold = city.sells.join(", ") || "nothing";
  const bought = city.buys.join(", ") || "nothing";
  return `Sells ${sold}. Buys ${bought}.`;
}

export type { ResourceKind };
