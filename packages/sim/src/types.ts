export type Climate = "central" | "northern" | "desert";

export type Terrain = "grass" | "meadow" | "rock" | "water" | "trees";

export type God = "ceres" | "neptune" | "mercury" | "mars" | "venus";

export type FoodKind = "wheat" | "vegetables" | "fruit" | "meat" | "fish";

export type RawKind = "clay" | "timber" | "olives" | "vines" | "iron" | "marble";

export type GoodKind = "pottery" | "furniture" | "oil" | "wine" | "wine2";

export type ResourceKind = FoodKind | RawKind | GoodKind;

export type WarehouseOrder = "accepting" | "getting" | "not_accepting";

export type Overlay =
  | "none"
  | "water"
  | "desirability"
  | "fire"
  | "damage"
  | "problems";

export type BuildingType =
  | "road"
  | "garden"
  | "plaza"
  | "aqueduct"
  | "house"
  | "well"
  | "fountain"
  | "reservoir"
  | "prefecture"
  | "engineer"
  | "market"
  | "granary"
  | "wheatFarm"
  | "clayPit"
  | "timberYard"
  | "oliveFarm"
  | "vineFarm"
  | "ironMine"
  | "marbleQuarry"
  | "potteryWorkshop"
  | "furnitureWorkshop"
  | "oilWorkshop"
  | "wineWorkshop"
  | "warehouse"
  | "dock"
  | "tradePost"
  | "templeCeres"
  | "templeNeptune"
  | "templeMercury"
  | "templeMars"
  | "templeVenus"
  | "clinic"
  | "hospital"
  | "barber"
  | "baths"
  | "school"
  | "library"
  | "academy"
  | "theater"
  | "actorColony"
  | "statueSmall"
  | "statueMedium"
  | "statueLarge"
  | "governorsHouse"
  | "rubble";

export type WalkerKind =
  | "immigrant"
  | "laborSeeker"
  | "prefect"
  | "engineer"
  | "priest"
  | "doctor"
  | "surgeon"
  | "barber"
  | "bather"
  | "actor"
  | "performer"
  | "schoolchild"
  | "librarian"
  | "scholar"
  | "marketTrader"
  | "marketBuyer"
  | "cartPusher"
  | "warehouseGetter"
  | "caravan"
  | "docker";

export type WalkerMode = "destination" | "roam" | "return";

export interface Point {
  x: number;
  y: number;
}

export interface Tile {
  terrain: Terrain;
  road: boolean;
  aqueduct: boolean;
  garden: boolean;
  plaza: boolean;
  /** C3 map bit: a 2×2 of same-level 1×1 houses merges if any tile is set. */
  mergeable: boolean;
  buildingId: number | null;
}

export interface ServiceAccess {
  religion: Partial<Record<God, number>>;
  entertainment: number;
  entertainmentPoints: number;
  education: number;
  school: number;
  library: number;
  academy: number;
  barber: number;
  bath: number;
  doctor: number;
  hospital: number;
  market: number;
}

export interface Stocks {
  foods: Partial<Record<FoodKind, number>>;
  goods: Partial<Record<GoodKind, number>>;
  raws: Partial<Record<RawKind, number>>;
}

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  size: number;
  employees: number;
  laborAccess: number;
  fire: number;
  damage: number;
  houseLevel: number;
  population: number;
  capacity: number;
  services: ServiceAccess;
  stocks: Stocks;
  production: number;
  walkerIds: number[];
  roamCycle: number;
  filled: boolean;
  shows: number;
  /** Warehouse / granary getting-orders. Missing keys default to accepting. */
  orders: Partial<Record<ResourceKind, WarehouseOrder>>;
}

export interface Walker {
  id: number;
  kind: WalkerKind;
  buildingId: number | null;
  x: number;
  y: number;
  fx: number;
  fy: number;
  path: Point[];
  pathIndex: number;
  progress: number;
  tilesWalked: number;
  mode: WalkerMode;
  roamDir: number;
  cargo?: { kind: ResourceKind; amount: number };
}

export interface Message {
  tick: number;
  text: string;
}

export interface City {
  id: string;
  name: string;
  climate: Climate;
  tick: number;
  seed: number;
  treasury: number;
  taxRate: number;
  wage: number;
  width: number;
  height: number;
  tiles: Tile[];
  buildings: Building[];
  walkers: Walker[];
  entry: Point;
  messages: Message[];
  nextId: number;
  empire: Empire;
}

export interface EmpireCity {
  id: string;
  name: string;
  kind: "land" | "sea";
  open: boolean;
  openCost: number;
  sells: ResourceKind[];
  buys: ResourceKind[];
}

export interface Empire {
  cities: EmpireCity[];
  lastCaravanTick: number;
}

export type BuildCommand =
  | { type: "place"; building: BuildingType; x: number; y: number }
  | { type: "drag"; building: "road" | "aqueduct" | "garden" | "plaza"; from: Point; to: Point }
  | { type: "clear"; x: number; y: number }
  | { type: "setOrder"; x: number; y: number; resource: ResourceKind; order: WarehouseOrder }
  | { type: "openTrade"; cityId: string };

export interface CityStats {
  population: number;
  houses: number;
  workforce: number;
  employed: number;
  unemployment: number;
  treasury: number;
  year: number;
  month: string;
  foodInGranaries: number;
}
