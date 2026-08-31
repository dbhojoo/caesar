import { specOf } from "../data/buildings.js";
import { HOUSING } from "../data/housing.js";
import type { City } from "../types.js";
import { occupiedHouses } from "./helpers.js";
import { spawnPatrol } from "./walkers.js";

const ACCESS_STAFF = 20;
const ACCESS_SEEKER = 80;

export function workforce(city: City): number {
  let n = 0;
  for (const h of occupiedHouses(city)) {
    const spec = HOUSING[h.houseLevel];
    if (spec.patrician) continue;
    n += Math.floor(h.population * 0.6);
  }
  return n;
}

export function assignLabor(city: City): void {
  const pool = workforce(city);
  const demand = city.buildings.filter((b) => specOf(b.type).employees > 0);
  for (const b of demand) {
    b.laborAccess = Math.max(0, b.laborAccess - 1);
    if (b.type === "fountain" || b.type === "reservoir") {
      // Water works still need a city workforce, but not a road-seeking citizen.
      if (b.laborAccess < 40) b.laborAccess = Math.min(300, b.laborAccess + 20);
    }
  }

  const priority = (type: string): number => {
    if (type === "fountain" || type === "reservoir") return 0;
    if (type === "prefecture" || type === "engineer") return 1;
    if (type === "wheatFarm" || type === "granary" || type === "market" || type === "warehouse") return 2;
    if (type === "clayPit" || type === "timberYard" || type === "oliveFarm" || type === "vineFarm") return 2;
    if (type.endsWith("Workshop") || type === "dock" || type === "tradePost" || type === "ironMine" || type === "marbleQuarry") return 2;
    if (type.startsWith("temple") || type === "clinic" || type === "barber" || type === "baths") return 3;
    if (type === "school" || type === "library" || type === "theater" || type === "actorColony") return 4;
    return 5;
  };
  demand.sort((a, b) => priority(a.type) - priority(b.type));

  let remaining = pool;
  for (const b of demand) {
    const need = specOf(b.type).employees;
    if (b.laborAccess < ACCESS_STAFF) {
      b.employees = 0;
      continue;
    }
    const give = remaining >= need ? need : remaining;
    b.employees = give;
    remaining -= give;
  }

  for (const b of demand) {
    if (b.laborAccess >= ACCESS_SEEKER) continue;
    if (specOf(b.type).employees <= 0) continue;
    if (b.type === "fountain" || b.type === "reservoir") continue;
    spawnPatrol(city, b, "laborSeeker");
  }
}

export function employedCount(city: City): number {
  return city.buildings.reduce((n, b) => n + b.employees, 0);
}
