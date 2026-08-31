import type { FoodKind, GoodKind, God } from "../types.js";

export interface HousingLevel {
  id: number;
  name: string;
  size: number;
  popPerTile: number;
  /** Used when size > 1 (documented totals). */
  totalPop?: number;
  water: 0 | 1 | 2;
  foodTypes: number;
  gods: number;
  entertainment: number;
  education: 0 | 1 | 2 | 3;
  barber: boolean;
  bath: boolean;
  doctor: boolean;
  hospital: boolean;
  goods: GoodKind[];
  devolveAt: number;
  evolveAt: number;
  taxMultiplier: number;
  prosperity: number;
  patrician: boolean;
}

export const HOUSING: HousingLevel[] = [
  { id: 0, name: "Small Tent", size: 1, popPerTile: 5, water: 0, foodTypes: 0, gods: 0, entertainment: 0, education: 0, barber: false, bath: false, doctor: false, hospital: false, goods: [], devolveAt: -99, evolveAt: -10, taxMultiplier: 1, prosperity: 5, patrician: false },
  { id: 1, name: "Large Tent", size: 1, popPerTile: 7, water: 1, foodTypes: 0, gods: 0, entertainment: 0, education: 0, barber: false, bath: false, doctor: false, hospital: false, goods: [], devolveAt: -12, evolveAt: -5, taxMultiplier: 1, prosperity: 10, patrician: false },
  { id: 2, name: "Small Shack", size: 1, popPerTile: 9, water: 1, foodTypes: 1, gods: 0, entertainment: 0, education: 0, barber: false, bath: false, doctor: false, hospital: false, goods: [], devolveAt: -7, evolveAt: 0, taxMultiplier: 1, prosperity: 15, patrician: false },
  { id: 3, name: "Large Shack", size: 1, popPerTile: 11, water: 1, foodTypes: 1, gods: 1, entertainment: 0, education: 0, barber: false, bath: false, doctor: false, hospital: false, goods: [], devolveAt: -2, evolveAt: 4, taxMultiplier: 1, prosperity: 20, patrician: false },
  { id: 4, name: "Small Hovel", size: 1, popPerTile: 13, water: 2, foodTypes: 1, gods: 1, entertainment: 0, education: 0, barber: false, bath: false, doctor: false, hospital: false, goods: [], devolveAt: 2, evolveAt: 8, taxMultiplier: 2, prosperity: 25, patrician: false },
  { id: 5, name: "Large Hovel", size: 1, popPerTile: 15, water: 2, foodTypes: 1, gods: 1, entertainment: 10, education: 0, barber: false, bath: false, doctor: false, hospital: false, goods: [], devolveAt: 6, evolveAt: 12, taxMultiplier: 2, prosperity: 30, patrician: false },
  { id: 6, name: "Small Casa", size: 1, popPerTile: 17, water: 2, foodTypes: 1, gods: 1, entertainment: 10, education: 1, barber: false, bath: false, doctor: false, hospital: false, goods: [], devolveAt: 10, evolveAt: 16, taxMultiplier: 2, prosperity: 35, patrician: false },
  { id: 7, name: "Large Casa", size: 1, popPerTile: 19, water: 2, foodTypes: 1, gods: 1, entertainment: 10, education: 1, barber: false, bath: true, doctor: false, hospital: false, goods: ["pottery"], devolveAt: 14, evolveAt: 20, taxMultiplier: 2, prosperity: 45, patrician: false },
  { id: 8, name: "Small Insula", size: 1, popPerTile: 19, water: 2, foodTypes: 1, gods: 1, entertainment: 25, education: 1, barber: false, bath: true, doctor: false, hospital: false, goods: ["pottery"], devolveAt: 18, evolveAt: 25, taxMultiplier: 3, prosperity: 50, patrician: false },
  { id: 9, name: "Medium Insula", size: 1, popPerTile: 20, water: 2, foodTypes: 1, gods: 1, entertainment: 25, education: 1, barber: false, bath: true, doctor: true, hospital: false, goods: ["pottery", "furniture"], devolveAt: 22, evolveAt: 32, taxMultiplier: 3, prosperity: 58, patrician: false },
  { id: 10, name: "Large Insula", size: 2, popPerTile: 21, totalPop: 84, water: 2, foodTypes: 1, gods: 1, entertainment: 25, education: 2, barber: true, bath: true, doctor: true, hospital: false, goods: ["pottery", "furniture", "oil"], devolveAt: 29, evolveAt: 40, taxMultiplier: 3, prosperity: 65, patrician: false },
  { id: 11, name: "Grand Insula", size: 2, popPerTile: 21, totalPop: 84, water: 2, foodTypes: 2, gods: 1, entertainment: 35, education: 2, barber: true, bath: true, doctor: true, hospital: false, goods: ["pottery", "furniture", "oil"], devolveAt: 37, evolveAt: 48, taxMultiplier: 4, prosperity: 80, patrician: false },
  { id: 12, name: "Small Villa", size: 2, popPerTile: 10, totalPop: 40, water: 2, foodTypes: 2, gods: 2, entertainment: 35, education: 2, barber: true, bath: true, doctor: true, hospital: false, goods: ["pottery", "furniture", "oil", "wine"], devolveAt: 45, evolveAt: 53, taxMultiplier: 9, prosperity: 150, patrician: true },
  { id: 13, name: "Medium Villa", size: 2, popPerTile: 10.5, totalPop: 42, water: 2, foodTypes: 2, gods: 2, entertainment: 40, education: 2, barber: true, bath: true, doctor: true, hospital: true, goods: ["pottery", "furniture", "oil", "wine"], devolveAt: 50, evolveAt: 58, taxMultiplier: 10, prosperity: 180, patrician: true },
  { id: 14, name: "Large Villa", size: 3, popPerTile: 10, totalPop: 90, water: 2, foodTypes: 2, gods: 2, entertainment: 45, education: 3, barber: true, bath: true, doctor: true, hospital: true, goods: ["pottery", "furniture", "oil", "wine"], devolveAt: 55, evolveAt: 63, taxMultiplier: 11, prosperity: 400, patrician: true },
  { id: 15, name: "Grand Villa", size: 3, popPerTile: 11, totalPop: 100, water: 2, foodTypes: 3, gods: 3, entertainment: 50, education: 3, barber: true, bath: true, doctor: true, hospital: true, goods: ["pottery", "furniture", "oil", "wine"], devolveAt: 60, evolveAt: 68, taxMultiplier: 11, prosperity: 600, patrician: true },
  { id: 16, name: "Small Palace", size: 3, popPerTile: 12, totalPop: 106, water: 2, foodTypes: 3, gods: 3, entertainment: 55, education: 3, barber: true, bath: true, doctor: true, hospital: true, goods: ["pottery", "furniture", "oil", "wine", "wine2"], devolveAt: 65, evolveAt: 74, taxMultiplier: 12, prosperity: 700, patrician: true },
  { id: 17, name: "Medium Palace", size: 3, popPerTile: 12, totalPop: 112, water: 2, foodTypes: 3, gods: 4, entertainment: 60, education: 3, barber: true, bath: true, doctor: true, hospital: true, goods: ["pottery", "furniture", "oil", "wine", "wine2"], devolveAt: 70, evolveAt: 80, taxMultiplier: 12, prosperity: 900, patrician: true },
  { id: 18, name: "Large Palace", size: 4, popPerTile: 12, totalPop: 190, water: 2, foodTypes: 3, gods: 4, entertainment: 70, education: 3, barber: true, bath: true, doctor: true, hospital: true, goods: ["pottery", "furniture", "oil", "wine", "wine2"], devolveAt: 76, evolveAt: 90, taxMultiplier: 15, prosperity: 1500, patrician: true },
  { id: 19, name: "Luxury Palace", size: 4, popPerTile: 12.5, totalPop: 200, water: 2, foodTypes: 3, gods: 4, entertainment: 80, education: 3, barber: true, bath: true, doctor: true, hospital: true, goods: ["pottery", "furniture", "oil", "wine", "wine2"], devolveAt: 85, evolveAt: 100, taxMultiplier: 16, prosperity: 1750, patrician: true },
];

export function houseCapacity(level: number, footprintSize?: number): number {
  const spec = HOUSING[Math.max(0, Math.min(19, level))] ?? HOUSING[0];
  const size = footprintSize ?? spec.size;
  if (spec.totalPop && size >= spec.size && spec.size > 1) return spec.totalPop;
  return Math.round(spec.popPerTile * size * size);
}

export function houseName(level: number, occupied: boolean): string {
  if (!occupied) return "Vacant Lot";
  return HOUSING[level]?.name ?? "Vacant Lot";
}

export const FOOD_ORDER: FoodKind[] = ["wheat", "vegetables", "fruit", "meat", "fish"];

export const GODS: God[] = ["ceres", "neptune", "mercury", "mars", "venus"];
