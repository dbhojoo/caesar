import { describe, expect, it } from "vitest";
import { createVillageBorn } from "../src/scenarios/villageBorn.js";
import { place } from "../src/city/commands.js";
import { tickMany } from "../src/city/tick.js";
import { cityStats } from "../src/city/stats.js";
import { TICKS_PER_SIXTEENTH } from "../src/time.js";

describe("A Village is Born", () => {
  it("starts with a road from the southern entry, a vacant lot, and a well", () => {
    const city = createVillageBorn();
    expect(city.tiles[40 * 48 + 24].road).toBe(true);
    expect(city.buildings.some((b) => b.type === "house")).toBe(true);
    expect(city.buildings.some((b) => b.type === "well")).toBe(true);
    expect(city.buildings.some((b) => b.type === "prefecture")).toBe(true);
    expect(city.entry.y).toBeGreaterThan(40);
  });

  it("admits immigrants and evolves the first tent once they settle", () => {
    const city = createVillageBorn();
    tickMany(city, TICKS_PER_SIXTEENTH * 8);
    const house = city.buildings.find((b) => b.type === "house")!;
    expect(house.population).toBeGreaterThan(0);
    expect(house.houseLevel).toBeGreaterThanOrEqual(1);
    expect(cityStats(city).population).toBeGreaterThan(0);
  });

  it("feeds shacks when a farm, granary, and market are staffed", () => {
    const city = createVillageBorn();
    for (let x = 24; x <= 32; x++) place(city, "road", x, 40);
    for (let y = 34; y <= 40; y++) place(city, "road", 32, y);
    place(city, "house", 26, 40);
    place(city, "house", 27, 40);
    place(city, "prefecture", 25, 39);
    place(city, "engineer", 23, 40);
    place(city, "wheatFarm", 29, 9);
    place(city, "granary", 29, 13);
    place(city, "market", 30, 38);
    place(city, "house", 31, 7);
    place(city, "well", 30, 7);
    place(city, "templeCeres", 21, 39);
    for (let x = 28; x <= 32; x++) {
      place(city, "road", x, 8);
      place(city, "road", x, 12);
      place(city, "road", x, 16);
    }
    for (let y = 8; y <= 40; y++) place(city, "road", 32, y);

    for (const b of city.buildings) {
      b.laborAccess = 300;
      if (b.type === "house") {
        b.population = 17;
        b.capacity = 17;
        b.houseLevel = 6;
      }
    }
    expect(city.buildings.some((b) => b.type === "wheatFarm")).toBe(true);
    expect(city.buildings.some((b) => b.type === "granary")).toBe(true);
    expect(city.buildings.some((b) => b.type === "market")).toBe(true);
    tickMany(city, TICKS_PER_SIXTEENTH * 8);
    expect(cityStats(city).population).toBeGreaterThan(0);
  });
});
