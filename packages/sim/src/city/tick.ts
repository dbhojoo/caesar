import { isMonthStart, isSixteenth } from "../time.js";
import type { BuildCommand, City } from "../types.js";
import { applyCommand } from "./commands.js";
import { tickEmpire } from "./empire.js";
import { occupiedHouses, pushMessage } from "./helpers.js";
import { refreshHousing } from "./housing.js";
import { produceAndTrade, spawnServiceWalkers } from "./industry.js";
import { assignLabor, employedCount } from "./labor.js";
import { migrate } from "./migration.js";
import { accrueRisk } from "./risk.js";
import { moveWalkers } from "./walkers.js";

export function tick(city: City, commands: BuildCommand[] = []): string[] {
  const errors: string[] = [];
  for (const cmd of commands) {
    const err = applyCommand(city, cmd);
    if (err) errors.push(err);
  }

  city.tick += 1;
  moveWalkers(city);

  if (isSixteenth(city.tick)) {
    assignLabor(city);
    produceAndTrade(city);
    spawnServiceWalkers(city);
    refreshHousing(city);
    accrueRisk(city);
    migrate(city);
    tickEmpire(city);
  }

  if (isMonthStart(city.tick)) {
    collectTaxes(city);
    payWages(city);
  }

  return errors;
}

export function tickMany(city: City, n: number, commands: BuildCommand[] = []): string[] {
  const errors: string[] = [];
  for (let i = 0; i < n; i++) {
    errors.push(...tick(city, i === 0 ? commands : []));
  }
  return errors;
}

function collectTaxes(city: City): void {
  let take = 0;
  for (const h of occupiedHouses(city)) {
    take += Math.floor((h.population * city.taxRate * (1 + h.houseLevel * 0.15)) / 20);
  }
  city.treasury += take;
}

function payWages(city: City): void {
  const pay = Math.floor((employedCount(city) * city.wage) / 12);
  city.treasury -= pay;
  if (city.treasury < 0) {
    city.treasury = 0;
    pushMessage(city, "The treasury is empty. Rome will not be pleased.");
  }
}
