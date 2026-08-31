import type { Building, FoodKind, GoodKind, RawKind, ResourceKind, WarehouseOrder } from "../types.js";

export const FOOD_KINDS: FoodKind[] = ["wheat", "vegetables", "fruit", "meat", "fish"];
export const RAW_KINDS: RawKind[] = ["clay", "timber", "olives", "vines", "iron", "marble"];
export const GOOD_KINDS: GoodKind[] = ["pottery", "furniture", "oil", "wine", "wine2"];

export const ALL_RESOURCES: ResourceKind[] = [...FOOD_KINDS, ...RAW_KINDS, ...GOOD_KINDS];

export const RESOURCE_LABEL: Record<ResourceKind, string> = {
  wheat: "wheat",
  vegetables: "vegetables",
  fruit: "fruit",
  meat: "meat",
  fish: "fish",
  clay: "clay",
  timber: "timber",
  olives: "olives",
  vines: "vines",
  iron: "iron",
  marble: "marble",
  pottery: "pottery",
  furniture: "furniture",
  oil: "oil",
  wine: "wine",
  wine2: "imported wine",
};

/** Denarii we pay when buying a load of 100, and denarii we receive when selling. */
export const TRADE_PRICE: Record<ResourceKind, { buy: number; sell: number }> = {
  wheat: { buy: 36, sell: 28 },
  vegetables: { buy: 40, sell: 30 },
  fruit: { buy: 42, sell: 32 },
  meat: { buy: 50, sell: 38 },
  fish: { buy: 44, sell: 34 },
  clay: { buy: 20, sell: 14 },
  timber: { buy: 22, sell: 16 },
  olives: { buy: 35, sell: 26 },
  vines: { buy: 35, sell: 26 },
  iron: { buy: 55, sell: 40 },
  marble: { buy: 70, sell: 50 },
  pottery: { buy: 55, sell: 40 },
  furniture: { buy: 70, sell: 50 },
  oil: { buy: 75, sell: 55 },
  wine: { buy: 100, sell: 80 },
  wine2: { buy: 120, sell: 95 },
};

export const GRANARY_CAP = 3200;
export const WAREHOUSE_CAP = 3200;
export const MARKET_CAP = 800;
export const WORKSHOP_RAW_CAP = 400;
export const LOAD = 100;

export function isFood(kind: ResourceKind): kind is FoodKind {
  return (FOOD_KINDS as ResourceKind[]).includes(kind);
}

export function isRaw(kind: ResourceKind): kind is RawKind {
  return (RAW_KINDS as ResourceKind[]).includes(kind);
}

export function isGood(kind: ResourceKind): kind is GoodKind {
  return (GOOD_KINDS as ResourceKind[]).includes(kind);
}

export function getStock(b: Building, kind: ResourceKind): number {
  if (isFood(kind)) return b.stocks.foods[kind] ?? 0;
  if (isRaw(kind)) return b.stocks.raws[kind] ?? 0;
  return b.stocks.goods[kind] ?? 0;
}

export function setStock(b: Building, kind: ResourceKind, amount: number): void {
  const n = Math.max(0, amount);
  if (isFood(kind)) b.stocks.foods[kind] = n;
  else if (isRaw(kind)) b.stocks.raws[kind] = n;
  else b.stocks.goods[kind] = n;
}

export function totalStock(b: Building): number {
  const sum = (rec: Partial<Record<string, number>>): number =>
    Object.values(rec).reduce((a: number, n) => a + (n ?? 0), 0);
  return sum(b.stocks.foods) + sum(b.stocks.goods) + sum(b.stocks.raws);
}

export function storageCap(type: string): number {
  if (type === "granary" || type === "warehouse") return WAREHOUSE_CAP;
  if (type === "market") return MARKET_CAP;
  if (type.endsWith("Workshop")) return WORKSHOP_RAW_CAP;
  return 10_000;
}

export function spaceLeft(b: Building): number {
  return Math.max(0, storageCap(b.type) - totalStock(b));
}

/** Add as much as capacity allows. Returns the amount actually added. */
export function addStock(b: Building, kind: ResourceKind, amount: number): number {
  if (amount <= 0) return 0;
  const give = Math.min(amount, spaceLeft(b));
  if (give <= 0) return 0;
  setStock(b, kind, getStock(b, kind) + give);
  return give;
}

/** Remove up to `amount`. Returns the amount actually taken. */
export function takeStock(b: Building, kind: ResourceKind, amount: number): number {
  const have = getStock(b, kind);
  const take = Math.min(have, Math.max(0, amount));
  if (take <= 0) return 0;
  setStock(b, kind, have - take);
  return take;
}

export function orderOf(b: Building, kind: ResourceKind): WarehouseOrder {
  return b.orders[kind] ?? "accepting";
}

export function nextOrder(order: WarehouseOrder): WarehouseOrder {
  if (order === "accepting") return "getting";
  if (order === "getting") return "not_accepting";
  return "accepting";
}

export function accepts(b: Building, kind: ResourceKind): boolean {
  if (b.employees <= 0 && (b.type === "granary" || b.type === "warehouse" || b.type === "market")) return false;
  if (b.type === "granary") return isFood(kind) && orderOf(b, kind) !== "not_accepting";
  if (b.type === "warehouse") return orderOf(b, kind) !== "not_accepting";
  if (b.type === "market") return isFood(kind) || isGood(kind);
  return false;
}

export function listedStocks(b: Building): string {
  const parts: string[] = [];
  for (const k of ALL_RESOURCES) {
    const n = getStock(b, k);
    if (n > 0) parts.push(`${RESOURCE_LABEL[k]} ${n}`);
  }
  return parts.join(", ");
}
