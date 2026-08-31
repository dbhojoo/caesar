import { calendarFromTick } from "../time.js";
import type { City, CityStats } from "../types.js";
import { houses, occupiedHouses } from "./helpers.js";
import { employedCount, workforce } from "./labor.js";

export function cityStats(city: City): CityStats {
  const population = occupiedHouses(city).reduce((n, h) => n + h.population, 0);
  const work = workforce(city);
  const jobs = employedCount(city);
  const foodInGranaries = city.buildings
    .filter((b) => b.type === "granary")
    .reduce((n, g) => n + Object.values(g.stocks.foods).reduce((a, b) => a + (b ?? 0), 0), 0);
  const cal = calendarFromTick(city.tick);
  return {
    population,
    houses: houses(city).length,
    workforce: work,
    employed: jobs,
    unemployment: work === 0 ? 0 : Math.max(0, Math.round(((work - jobs) / work) * 100)),
    treasury: city.treasury,
    year: cal.year,
    month: cal.name,
    foodInGranaries,
  };
}
