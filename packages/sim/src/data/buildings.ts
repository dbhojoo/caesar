import type { BuildingType, God, GoodKind, RawKind, ResourceKind, WalkerKind } from "../types.js";

export interface BuildingSpec {
  type: BuildingType;
  name: string;
  size: number;
  cost: number;
  employees: number;
  roadAccess: boolean;
  /** Desirability at range 1 from the footprint edge. */
  des: number;
  /** Tiles the current desirability value holds. */
  step: number;
  /** Added each step (usually opposite sign of des). */
  sizeStep: number;
  range: number;
  immuneRisk: boolean;
  category: "water" | "health" | "religion" | "education" | "entertainment" | "government" | "engineering" | "industry" | "housing" | "beauty" | "infra";
  walker?: WalkerKind;
  god?: God;
  needsMeadow?: boolean;
  needsWaterEdge?: boolean;
  needsPipes?: boolean;
  needsTrees?: boolean;
  needsRock?: boolean;
  produces?: ResourceKind;
  recipe?: { in: RawKind; out: GoodKind };
}

export const CATALOG: Record<BuildingType, BuildingSpec> = {
  road: { type: "road", name: "Road", size: 1, cost: 4, employees: 0, roadAccess: false, des: 0, step: 0, sizeStep: 0, range: 0, immuneRisk: true, category: "infra" },
  garden: { type: "garden", name: "Garden", size: 1, cost: 12, employees: 0, roadAccess: false, des: 3, step: 1, sizeStep: -1, range: 4, immuneRisk: true, category: "beauty" },
  plaza: { type: "plaza", name: "Plaza", size: 1, cost: 15, employees: 0, roadAccess: false, des: 4, step: 1, sizeStep: -1, range: 3, immuneRisk: true, category: "beauty" },
  aqueduct: { type: "aqueduct", name: "Aqueduct", size: 1, cost: 8, employees: 0, roadAccess: false, des: -2, step: 1, sizeStep: 1, range: 2, immuneRisk: true, category: "water" },
  house: { type: "house", name: "Housing", size: 1, cost: 10, employees: 0, roadAccess: true, des: 0, step: 1, sizeStep: 0, range: 2, immuneRisk: false, category: "housing" },
  well: { type: "well", name: "Well", size: 1, cost: 5, employees: 0, roadAccess: false, des: -1, step: 1, sizeStep: 1, range: 2, immuneRisk: true, category: "water" },
  fountain: { type: "fountain", name: "Fountain", size: 1, cost: 15, employees: 4, roadAccess: false, des: 0, step: 0, sizeStep: 0, range: 0, immuneRisk: true, category: "water", needsPipes: true },
  reservoir: { type: "reservoir", name: "Reservoir", size: 3, cost: 80, employees: 10, roadAccess: false, des: -6, step: 1, sizeStep: 1, range: 6, immuneRisk: true, category: "water", needsWaterEdge: true },
  prefecture: { type: "prefecture", name: "Prefecture", size: 1, cost: 30, employees: 6, roadAccess: true, des: -2, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "engineering", walker: "prefect" },
  engineer: { type: "engineer", name: "Engineer's Post", size: 1, cost: 30, employees: 5, roadAccess: true, des: 0, step: 0, sizeStep: 0, range: 0, immuneRisk: false, category: "engineering", walker: "engineer" },
  market: { type: "market", name: "Market", size: 2, cost: 40, employees: 5, roadAccess: true, des: -2, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", walker: "marketTrader" },
  granary: { type: "granary", name: "Granary", size: 3, cost: 100, employees: 6, roadAccess: true, des: -4, step: 1, sizeStep: 1, range: 4, immuneRisk: false, category: "industry" },
  wheatFarm: { type: "wheatFarm", name: "Wheat Farm", size: 3, cost: 40, employees: 10, roadAccess: true, des: -2, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", needsMeadow: true, produces: "wheat" },
  clayPit: { type: "clayPit", name: "Clay Pit", size: 2, cost: 40, employees: 10, roadAccess: true, des: -3, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", produces: "clay" },
  timberYard: { type: "timberYard", name: "Timber Yard", size: 2, cost: 40, employees: 10, roadAccess: true, des: -3, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", needsTrees: true, produces: "timber" },
  oliveFarm: { type: "oliveFarm", name: "Olive Farm", size: 3, cost: 40, employees: 10, roadAccess: true, des: -2, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", needsMeadow: true, produces: "olives" },
  vineFarm: { type: "vineFarm", name: "Vine Farm", size: 3, cost: 40, employees: 10, roadAccess: true, des: -2, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", needsMeadow: true, produces: "vines" },
  ironMine: { type: "ironMine", name: "Iron Mine", size: 2, cost: 50, employees: 10, roadAccess: true, des: -4, step: 1, sizeStep: 1, range: 4, immuneRisk: false, category: "industry", needsRock: true, produces: "iron" },
  marbleQuarry: { type: "marbleQuarry", name: "Marble Quarry", size: 2, cost: 50, employees: 10, roadAccess: true, des: -4, step: 1, sizeStep: 1, range: 4, immuneRisk: false, category: "industry", needsRock: true, produces: "marble" },
  potteryWorkshop: { type: "potteryWorkshop", name: "Pottery Workshop", size: 2, cost: 40, employees: 10, roadAccess: true, des: -4, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", recipe: { in: "clay", out: "pottery" } },
  furnitureWorkshop: { type: "furnitureWorkshop", name: "Furniture Workshop", size: 2, cost: 40, employees: 10, roadAccess: true, des: -4, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", recipe: { in: "timber", out: "furniture" } },
  oilWorkshop: { type: "oilWorkshop", name: "Oil Workshop", size: 2, cost: 40, employees: 10, roadAccess: true, des: -4, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", recipe: { in: "olives", out: "oil" } },
  wineWorkshop: { type: "wineWorkshop", name: "Wine Workshop", size: 2, cost: 40, employees: 10, roadAccess: true, des: -4, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry", recipe: { in: "vines", out: "wine" } },
  warehouse: { type: "warehouse", name: "Warehouse", size: 3, cost: 70, employees: 6, roadAccess: true, des: -5, step: 1, sizeStep: 1, range: 4, immuneRisk: false, category: "industry" },
  dock: { type: "dock", name: "Dock", size: 3, cost: 100, employees: 12, roadAccess: true, des: -6, step: 1, sizeStep: 1, range: 4, immuneRisk: false, category: "industry", needsWaterEdge: true },
  tradePost: { type: "tradePost", name: "Trade Post", size: 2, cost: 80, employees: 8, roadAccess: true, des: -3, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "industry" },
  templeCeres: { type: "templeCeres", name: "Temple of Ceres", size: 2, cost: 50, employees: 2, roadAccess: true, des: 4, step: 1, sizeStep: -1, range: 4, immuneRisk: false, category: "religion", walker: "priest", god: "ceres" },
  templeNeptune: { type: "templeNeptune", name: "Temple of Neptune", size: 2, cost: 50, employees: 2, roadAccess: true, des: 4, step: 1, sizeStep: -1, range: 4, immuneRisk: false, category: "religion", walker: "priest", god: "neptune" },
  templeMercury: { type: "templeMercury", name: "Temple of Mercury", size: 2, cost: 50, employees: 2, roadAccess: true, des: 4, step: 1, sizeStep: -1, range: 4, immuneRisk: false, category: "religion", walker: "priest", god: "mercury" },
  templeMars: { type: "templeMars", name: "Temple of Mars", size: 2, cost: 50, employees: 2, roadAccess: true, des: 4, step: 1, sizeStep: -1, range: 4, immuneRisk: false, category: "religion", walker: "priest", god: "mars" },
  templeVenus: { type: "templeVenus", name: "Temple of Venus", size: 2, cost: 50, employees: 2, roadAccess: true, des: 4, step: 1, sizeStep: -1, range: 4, immuneRisk: false, category: "religion", walker: "priest", god: "venus" },
  clinic: { type: "clinic", name: "Doctor's Clinic", size: 1, cost: 30, employees: 5, roadAccess: true, des: 2, step: 1, sizeStep: -1, range: 3, immuneRisk: false, category: "health", walker: "doctor" },
  hospital: { type: "hospital", name: "Hospital", size: 3, cost: 300, employees: 30, roadAccess: true, des: -2, step: 1, sizeStep: 1, range: 3, immuneRisk: false, category: "health", walker: "surgeon" },
  barber: { type: "barber", name: "Barber", size: 1, cost: 25, employees: 2, roadAccess: true, des: 2, step: 1, sizeStep: -1, range: 3, immuneRisk: false, category: "health", walker: "barber" },
  baths: { type: "baths", name: "Baths", size: 2, cost: 50, employees: 10, roadAccess: true, des: 4, step: 1, sizeStep: -1, range: 3, immuneRisk: false, category: "health", walker: "bather", needsPipes: true },
  school: { type: "school", name: "School", size: 2, cost: 50, employees: 10, roadAccess: true, des: -2, step: 1, sizeStep: 1, range: 2, immuneRisk: false, category: "education", walker: "schoolchild" },
  library: { type: "library", name: "Library", size: 2, cost: 75, employees: 20, roadAccess: true, des: 4, step: 1, sizeStep: -1, range: 3, immuneRisk: false, category: "education", walker: "librarian" },
  academy: { type: "academy", name: "Academy", size: 3, cost: 100, employees: 30, roadAccess: true, des: 4, step: 1, sizeStep: -1, range: 3, immuneRisk: false, category: "education", walker: "scholar" },
  theater: { type: "theater", name: "Theater", size: 2, cost: 50, employees: 8, roadAccess: true, des: 2, step: 1, sizeStep: -1, range: 3, immuneRisk: false, category: "entertainment", walker: "actor" },
  actorColony: { type: "actorColony", name: "Actor Colony", size: 3, cost: 50, employees: 5, roadAccess: true, des: 2, step: 1, sizeStep: -1, range: 3, immuneRisk: false, category: "entertainment" },
  statueSmall: { type: "statueSmall", name: "Small Statue", size: 1, cost: 12, employees: 0, roadAccess: false, des: 3, step: 1, sizeStep: -1, range: 3, immuneRisk: true, category: "beauty" },
  statueMedium: { type: "statueMedium", name: "Medium Statue", size: 2, cost: 80, employees: 0, roadAccess: false, des: 6, step: 1, sizeStep: -1, range: 4, immuneRisk: true, category: "beauty" },
  statueLarge: { type: "statueLarge", name: "Large Statue", size: 3, cost: 150, employees: 0, roadAccess: false, des: 8, step: 1, sizeStep: -1, range: 5, immuneRisk: true, category: "beauty" },
  governorsHouse: { type: "governorsHouse", name: "Governor's House", size: 3, cost: 150, employees: 0, roadAccess: true, des: 12, step: 1, sizeStep: -2, range: 6, immuneRisk: false, category: "government" },
  rubble: { type: "rubble", name: "Rubble", size: 1, cost: 0, employees: 0, roadAccess: false, des: -4, step: 1, sizeStep: 1, range: 3, immuneRisk: true, category: "infra" },
};

export const BUILD_MENU: { id: string; label: string; items: BuildingType[] }[] = [
  { id: "housing", label: "Housing", items: ["house"] },
  { id: "roads", label: "Roads", items: ["road", "plaza"] },
  { id: "water", label: "Water", items: ["well", "fountain", "reservoir", "aqueduct"] },
  { id: "health", label: "Health", items: ["clinic", "barber", "baths", "hospital"] },
  { id: "religion", label: "Religion", items: ["templeCeres", "templeNeptune", "templeMercury", "templeMars", "templeVenus"] },
  { id: "education", label: "Education", items: ["school", "library", "academy"] },
  { id: "entertainment", label: "Entertainment", items: ["theater", "actorColony"] },
  { id: "engineering", label: "Engineering", items: ["prefecture", "engineer", "garden", "statueSmall", "statueMedium", "statueLarge"] },
  { id: "government", label: "Government", items: ["governorsHouse"] },
  { id: "farms", label: "Farms", items: ["wheatFarm", "oliveFarm", "vineFarm"] },
  { id: "industry", label: "Industry", items: ["clayPit", "timberYard", "ironMine", "marbleQuarry", "potteryWorkshop", "furnitureWorkshop", "oilWorkshop", "wineWorkshop", "granary", "warehouse", "market", "tradePost", "dock"] },
];

export function specOf(type: BuildingType): BuildingSpec {
  return CATALOG[type];
}
