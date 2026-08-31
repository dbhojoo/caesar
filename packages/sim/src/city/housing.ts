import { FOOD_ORDER, GODS, HOUSING, houseCapacity, houseName } from "../data/housing.js";
import { GOOD_KINDS } from "../data/resources.js";
import { desirabilityAt, desirabilityField } from "../map/desirability.js";
import { footprint, inBounds, tileAt } from "../map/grid.js";
import { computeWater, waterAt } from "../map/water.js";
import type { Building, City } from "../types.js";
import { createBuilding, pushMessage } from "./helpers.js";

const LARGE_INSULA = 10;

export function refreshHousing(city: City): void {
  const water = computeWater(city);
  const des = desirabilityField(city);
  for (const h of [...city.buildings]) {
    if (h.type !== "house") continue;
    if (!city.buildings.includes(h)) continue;
    decayServices(h);
    eatFood(h);
    eatGoods(h);
    considerEvolution(city, h, water, des);
  }
  tryMergeAll(city);
}

function decayServices(h: Building): void {
  const s = h.services;
  s.entertainment = Math.max(0, s.entertainment - 1);
  if (s.entertainment === 0) s.entertainmentPoints = 0;
  s.education = Math.max(0, s.education - 1);
  s.school = Math.max(0, s.school - 1);
  s.library = Math.max(0, s.library - 1);
  s.academy = Math.max(0, s.academy - 1);
  s.barber = Math.max(0, s.barber - 1);
  s.bath = Math.max(0, s.bath - 1);
  s.doctor = Math.max(0, s.doctor - 1);
  s.hospital = Math.max(0, s.hospital - 1);
  s.market = Math.max(0, s.market - 1);
  for (const g of GODS) {
    if (s.religion[g]) s.religion[g] = Math.max(0, (s.religion[g] ?? 0) - 1);
  }
}

function eatFood(h: Building): void {
  if (h.population <= 0) return;
  const spec = HOUSING[h.houseLevel];
  if (spec.foodTypes <= 0) return;
  const kinds = FOOD_ORDER.filter((k) => (h.stocks.foods[k] ?? 0) > 0);
  for (const k of kinds.slice(0, Math.max(1, spec.foodTypes))) {
    h.stocks.foods[k] = Math.max(0, (h.stocks.foods[k] ?? 0) - 1);
  }
}

function eatGoods(h: Building): void {
  if (h.population <= 0) return;
  const spec = HOUSING[h.houseLevel];
  for (const g of spec.goods) {
    if ((h.stocks.goods[g] ?? 0) > 0) h.stocks.goods[g] = (h.stocks.goods[g] ?? 0) - 1;
  }
}

function foodTypesHeld(h: Building): number {
  return FOOD_ORDER.filter((k) => (h.stocks.foods[k] ?? 0) > 0).length;
}

function godsHeld(h: Building): number {
  return GODS.filter((g) => (h.services.religion[g] ?? 0) > 0).length;
}

function educationLevel(h: Building): number {
  const hasSchool = h.services.school > 0;
  const hasLib = h.services.library > 0;
  const hasAcad = h.services.academy > 0;
  if (hasSchool && hasLib && hasAcad) return 3;
  if (hasSchool && hasLib) return 2;
  if (hasSchool || hasLib || h.services.education > 0) return 1;
  return 0;
}

function entertainmentPoints(h: Building): number {
  return h.services.entertainment > 0 ? h.services.entertainmentPoints : 0;
}

export function unmetNeeds(h: Building, waterLevel: number, targetLevel: number): string[] {
  const spec = HOUSING[targetLevel];
  const missing: string[] = [];
  if (waterLevel < spec.water) missing.push(spec.water === 2 ? "fountain water" : "water");
  if (foodTypesHeld(h) < spec.foodTypes) missing.push("food");
  if (godsHeld(h) < spec.gods) missing.push("a temple");
  if (entertainmentPoints(h) < spec.entertainment && spec.entertainment > 0) {
    missing.push(spec.entertainment > 10 ? "more entertainment" : "entertainment");
  }
  if (educationLevel(h) < spec.education) missing.push("education");
  if (spec.bath && h.services.bath <= 0) missing.push("baths");
  if (spec.barber && h.services.barber <= 0) missing.push("a barber");
  if (spec.doctor && h.services.doctor <= 0) missing.push("a doctor");
  if (spec.hospital && h.services.hospital <= 0) missing.push("a hospital");
  for (const g of spec.goods) {
    if ((h.stocks.goods[g] ?? 0) <= 0) missing.push(g);
  }
  return missing;
}

function meets(h: Building, waterLevel: number, level: number): boolean {
  return unmetNeeds(h, waterLevel, level).length === 0;
}

function considerEvolution(
  city: City,
  h: Building,
  water: ReturnType<typeof computeWater>,
  desField: Int16Array,
): void {
  if (h.population <= 0) return;
  const waterLevel = waterAt(water, city, h.x, h.y);
  const des = desirabilityAt(desField, city, h.x, h.y, h.size);
  const cur = HOUSING[h.houseLevel];

  if (des < cur.devolveAt || !meets(h, waterLevel, h.houseLevel)) {
    if (h.houseLevel > 0) {
      const from = h.houseLevel;
      h.houseLevel -= 1;
      if (from >= LARGE_INSULA && h.houseLevel < LARGE_INSULA && h.size >= 2) {
        splitHouse(city, h);
      }
      h.capacity = houseCapacity(h.houseLevel, h.size);
      h.population = Math.min(h.population, h.capacity);
      pushMessage(city, `A ${houseName(from, true)} has devolved.`);
    }
    return;
  }

  const next = HOUSING[h.houseLevel + 1];
  if (!next) return;
  if (next.size > h.size) {
    tryMergeContaining(city, h);
    if (!city.buildings.includes(h) || h.size < next.size) return;
  }
  if (des >= cur.evolveAt && meets(h, waterLevel, h.houseLevel + 1)) {
    h.houseLevel += 1;
    h.capacity = houseCapacity(h.houseLevel, h.size);
    h.population = Math.min(h.capacity, Math.max(h.population, Math.ceil(h.capacity * 0.7)));
    pushMessage(city, `People now live in a ${houseName(h.houseLevel, true)}.`);
  }
}

const SPEECH: Record<string, string> = {
  water: "These people need water.",
  "fountain water": "These people need better water from a fountain.",
  food: "These people need food.",
  "a temple": "These people need a temple.",
  entertainment: "These people want entertainment.",
  "more entertainment": "These people want more entertainment.",
  education: "These people need education.",
  baths: "These people want a bath house.",
  "a barber": "These people want a barber.",
  "a doctor": "These people need a doctor.",
  "a hospital": "These people need a hospital.",
  pottery: "These people need pottery.",
  furniture: "These people need furniture.",
  oil: "These people need oil.",
  wine: "These people need wine.",
  wine2: "These people need imported wine.",
};

export function houseProblems(city: City, h: Building): string {
  if (h.type !== "house") return "";
  if (h.population <= 0) return "This housing is vacant.";
  const water = computeWater(city);
  const waterLevel = waterAt(water, city, h.x, h.y);
  const next = Math.min(19, h.houseLevel + 1);
  const missing = unmetNeeds(h, waterLevel, next);
  if (!missing.length) return "These people are content, for now.";
  return SPEECH[missing[0]] ?? `These people need ${missing[0]}.`;
}

/** Merge 2×2 groups of same-level 1×1 houses when a merge bit (or large-insula force) allows it. */
export function tryMergeAll(city: City): void {
  const seen = new Set<number>();
  for (let y = 0; y < city.height - 1; y++) {
    for (let x = 0; x < city.width - 1; x++) {
      mergeAt(city, x, y, seen);
    }
  }
}

function tryMergeContaining(city: City, h: Building): void {
  if (h.size !== 1) return;
  const id = h.id;
  for (const ox of [h.x - 1, h.x]) {
    for (const oy of [h.y - 1, h.y]) {
      if (ox < 0 || oy < 0) continue;
      mergeAt(city, ox, oy, new Set());
      const latest = city.buildings.find((b) => b.id === id);
      if (latest && latest.size > 1) return;
    }
  }
}

function mergeAt(city: City, x: number, y: number, seen: Set<number>): boolean {
  const group: Building[] = [];
  for (const p of footprint(x, y, 2)) {
    const t = tileAt(city, p.x, p.y);
    if (!t || t.buildingId == null) return false;
    const b = city.buildings.find((bb) => bb.id === t.buildingId);
    if (!b || b.type !== "house" || b.size !== 1 || b.population <= 0) return false;
    if (seen.has(b.id)) return false;
    group.push(b);
  }
  if (group.length !== 4) return false;
  const unique = [...new Set(group)];
  if (unique.length !== 4) return false;
  const level = unique[0].houseLevel;
  if (unique.some((h) => h.houseLevel !== level)) return false;
  const force = level >= LARGE_INSULA;
  const can = force || footprint(x, y, 2).some((p) => tileAt(city, p.x, p.y)?.mergeable);
  if (!can) return false;

  const keep = unique.find((h) => h.x === x && h.y === y) ?? unique[0];
  keep.x = x;
  keep.y = y;
  keep.size = 2;
  keep.population = unique.reduce((n, h) => n + h.population, 0);
  keep.capacity = houseCapacity(keep.houseLevel, 2);
  keep.population = Math.min(keep.capacity, keep.population);
  for (const other of unique) {
    if (other === keep) continue;
    mergeStocks(keep, other);
    mergeServices(keep, other);
    city.walkers = city.walkers.filter((w) => w.buildingId !== other.id);
    city.buildings = city.buildings.filter((b) => b.id !== other.id);
  }
  for (const p of footprint(x, y, 2)) {
    const t = tileAt(city, p.x, p.y);
    if (t) t.buildingId = keep.id;
  }
  for (const h of unique) seen.add(h.id);
  pushMessage(city, `Houses have merged into a larger ${houseName(keep.houseLevel, true)}.`);
  return true;
}

function splitHouse(city: City, h: Building): void {
  const pop = h.population;
  const share = Math.floor(pop / 4);
  const extra = pop - share * 4;
  const cells = footprint(h.x, h.y, h.size);
  h.size = 1;
  h.population = share + extra;
  h.capacity = houseCapacity(h.houseLevel, 1);
  for (let i = 1; i < cells.length; i++) {
    const p = cells[i];
    const n = createBuilding("house", p.x, p.y);
    n.houseLevel = h.houseLevel;
    n.population = share;
    n.capacity = houseCapacity(h.houseLevel, 1);
    n.services = { ...h.services, religion: { ...h.services.religion } };
    n.stocks = { foods: { ...h.stocks.foods }, goods: { ...h.stocks.goods }, raws: { ...h.stocks.raws } };
    city.buildings.push(n);
    const t = tileAt(city, p.x, p.y);
    if (t) t.buildingId = n.id;
  }
  const origin = tileAt(city, h.x, h.y);
  if (origin) origin.buildingId = h.id;
}

function mergeStocks(keep: Building, other: Building): void {
  for (const k of FOOD_ORDER) {
    keep.stocks.foods[k] = (keep.stocks.foods[k] ?? 0) + (other.stocks.foods[k] ?? 0);
  }
  for (const g of GOOD_KINDS) {
    keep.stocks.goods[g] = (keep.stocks.goods[g] ?? 0) + (other.stocks.goods[g] ?? 0);
  }
}

function mergeServices(keep: Building, other: Building): void {
  const a = keep.services;
  const b = other.services;
  a.entertainment = Math.max(a.entertainment, b.entertainment);
  a.entertainmentPoints = Math.max(a.entertainmentPoints, b.entertainmentPoints);
  a.education = Math.max(a.education, b.education);
  a.school = Math.max(a.school, b.school);
  a.library = Math.max(a.library, b.library);
  a.academy = Math.max(a.academy, b.academy);
  a.barber = Math.max(a.barber, b.barber);
  a.bath = Math.max(a.bath, b.bath);
  a.doctor = Math.max(a.doctor, b.doctor);
  a.hospital = Math.max(a.hospital, b.hospital);
  a.market = Math.max(a.market, b.market);
  for (const g of GODS) {
    a.religion[g] = Math.max(a.religion[g] ?? 0, b.religion[g] ?? 0);
  }
}

export function setMergeable(city: City, x: number, y: number, value: boolean): void {
  if (!inBounds(city, x, y)) return;
  city.tiles[y * city.width + x].mergeable = value;
}
