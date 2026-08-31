import { resetIds } from "./ids.js";
import { defaultEmpire } from "./data/empire.js";
import { emptyStocks } from "./city/helpers.js";
import type { City } from "./types.js";

export function saveCity(city: City): string {
  const maxId = Math.max(0, ...city.buildings.map((b) => b.id), ...city.walkers.map((w) => w.id));
  city.nextId = maxId + 1;
  return JSON.stringify(city);
}

export function loadCity(json: string): City {
  const city = JSON.parse(json) as City;
  resetIds(city.nextId || 1);
  if (!city.empire) city.empire = defaultEmpire();
  for (const b of city.buildings) {
    if (!b.stocks) b.stocks = emptyStocks();
    if (!b.stocks.raws) b.stocks.raws = {};
    if (!b.stocks.goods) b.stocks.goods = {};
    if (!b.stocks.foods) b.stocks.foods = {};
    if (!b.orders) b.orders = {};
  }
  return city;
}
