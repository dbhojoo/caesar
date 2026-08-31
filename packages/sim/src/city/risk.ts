import { specOf } from "../data/buildings.js";
import type { City } from "../types.js";
import { createBuilding, pushMessage } from "./helpers.js";
import { footprint, tileAt } from "../map/grid.js";

export function accrueRisk(city: City): void {
  const fireMul = city.climate === "desert" ? 2 : city.climate === "northern" ? 0 : 1;
  for (const b of city.buildings) {
    const spec = specOf(b.type);
    if (spec.immuneRisk) continue;
    // ~16 months to 100 in central climate; desert is twice as fast; northern has no fire.
    b.fire = Math.min(120, b.fire + 0.25 * fireMul);
    b.damage = Math.min(120, b.damage + 0.2);
    if (b.fire >= 100) {
      burn(city, b);
    } else if (b.damage >= 100) {
      collapse(city, b);
    }
  }
}

function burn(city: City, b: { id: number; x: number; y: number; size: number; type: string }): void {
  pushMessage(city, "A fire has broken out!");
  wreck(city, b.id, b.x, b.y, b.size);
}

function collapse(city: City, b: { id: number; x: number; y: number; size: number }): void {
  pushMessage(city, "A building has collapsed from neglect.");
  wreck(city, b.id, b.x, b.y, b.size);
}

function wreck(city: City, id: number, x: number, y: number, size: number): void {
  city.walkers = city.walkers.filter((w) => w.buildingId !== id);
  city.buildings = city.buildings.filter((b) => b.id !== id);
  for (const p of footprint(x, y, size)) {
    const t = tileAt(city, p.x, p.y);
    if (t) t.buildingId = null;
  }
  const rubble = createBuilding("rubble", x, y);
  rubble.size = 1;
  city.buildings.push(rubble);
  const t = tileAt(city, x, y);
  if (t) t.buildingId = rubble.id;
}
