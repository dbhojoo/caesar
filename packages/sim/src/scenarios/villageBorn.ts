import { createCity, paintRect, paintTerrain } from "../city/create.js";
import { place } from "../city/commands.js";
import { pushMessage } from "../city/helpers.js";
import type { City } from "../types.js";

/** Opening lesson of Caesar III: a small central-climate valley with a river and meadows. */
export function createVillageBorn(): City {
  const city = createCity({
    id: "village-born",
    name: "A Village is Born",
    width: 48,
    height: 48,
    climate: "central",
    treasury: 5000,
    seed: 1998,
  });

  city.entry = { x: 24, y: 46 };

  for (let y = 0; y < city.height; y++) {
    for (let x = 0; x < 7; x++) paintTerrain(city, x, y, "water");
    paintTerrain(city, 7, y, y % 3 === 0 ? "grass" : "water");
  }

  paintRect(city, 28, 8, 44, 22, "meadow");
  paintRect(city, 34, 30, 42, 38, "meadow");

  paintRect(city, 17, 4, 21, 9, "trees");
  for (const [x, y] of [
    [40, 40],
    [12, 30],
    [13, 31],
    [36, 4],
  ] as const) {
    paintTerrain(city, x, y, "trees");
  }
  for (const [x, y] of [
    [22, 2],
    [23, 2],
    [24, 3],
    [16, 40],
    [17, 41],
  ] as const) {
    paintTerrain(city, x, y, "rock");
  }

  // A short road from the map entry so the first immigrants can reach a lot.
  for (let y = 40; y <= 46; y++) place(city, "road", 24, y);
  place(city, "house", 25, 40);
  place(city, "well", 26, 39);
  place(city, "prefecture", 23, 40);
  place(city, "engineer", 23, 39);
  for (const b of city.buildings) {
    if (b.type === "prefecture" || b.type === "engineer") b.laborAccess = 200;
  }

  pushMessage(city, "Caesar has granted you this valley. House the people, give them water, then food.");
  pushMessage(city, "Roads from the southern gate let immigrants find vacant lots.");
  pushMessage(city, "Clay, timber, and trade will later bring pottery to the houses.");
  return city;
}
