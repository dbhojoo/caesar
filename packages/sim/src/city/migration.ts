import { houseCapacity } from "../data/housing.js";
import type { City } from "../types.js";
import { houses, pushMessage } from "./helpers.js";
import { spawnImmigrant } from "./walkers.js";

export function migrate(city: City): void {
  const incoming = city.walkers.filter((w) => w.kind === "immigrant").length;
  if (incoming >= 6) return;

  const lots = houses(city)
    .filter((h) => {
      h.capacity = h.capacity || houseCapacity(h.houseLevel || 0);
      if (h.population <= 0) h.capacity = 5;
      return h.population < h.capacity && !h.walkerIds.some((id) => city.walkers.some((w) => w.id === id && w.kind === "immigrant"));
    })
    .slice(0, 3);

  let spawned = 0;
  for (const h of lots) {
    if (spawnImmigrant(city, h)) spawned++;
  }
  if (spawned && city.tick > 0 && city.tick % 816 < 60) {
    pushMessage(city, "Immigrants have arrived from Rome.");
  }
}
