import { describe, expect, it } from "vitest";
import { createCity, paintTerrain } from "../src/city/create.js";
import { place } from "../src/city/commands.js";
import { computeWater, waterAt } from "../src/map/water.js";

describe("water network", () => {
  it("wells cover a 5x5 (range 2)", () => {
    const city = createCity({ width: 20, height: 20, treasury: 1000 });
    place(city, "well", 10, 10);
    const maps = computeWater(city);
    expect(waterAt(maps, city, 10, 10)).toBe(1);
    expect(waterAt(maps, city, 12, 12)).toBe(1);
    expect(waterAt(maps, city, 13, 10)).toBe(0);
  });

  it("a staffed reservoir on the river fills and pipes reach a fountain", () => {
    const city = createCity({ width: 24, height: 24, treasury: 5000 });
    for (let y = 0; y < 24; y++) paintTerrain(city, 0, y, "water");
    place(city, "reservoir", 1, 8);
    const res = city.buildings.find((b) => b.type === "reservoir")!;
    res.employees = 10;
    const maps = computeWater(city);
    expect(maps.reservoirFilled.has(res.id)).toBe(true);
    expect(maps.pipes[10 * 24 + 8]).toBe(1);

    place(city, "fountain", 8, 10);
    const fountain = city.buildings.find((b) => b.type === "fountain")!;
    fountain.employees = 4;
    const maps2 = computeWater(city);
    expect(waterAt(maps2, city, 8, 10)).toBe(2);
    expect(waterAt(maps2, city, 12, 10)).toBe(2);
  });

  it("aqueducts carry water to an inland reservoir", () => {
    const city = createCity({ width: 24, height: 24, treasury: 8000 });
    for (let y = 0; y < 24; y++) paintTerrain(city, 0, y, "water");
    place(city, "reservoir", 1, 6);
    const source = city.buildings.find((b) => b.type === "reservoir")!;
    source.employees = 10;
    for (let x = 4; x <= 12; x++) place(city, "aqueduct", x, 7);
    place(city, "reservoir", 13, 6);
    const inland = city.buildings.filter((b) => b.type === "reservoir")[1];
    inland.employees = 10;
    const maps = computeWater(city);
    expect(maps.reservoirFilled.has(source.id)).toBe(true);
    expect(maps.reservoirFilled.has(inland.id)).toBe(true);
  });
});
