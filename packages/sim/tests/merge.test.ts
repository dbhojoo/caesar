import { describe, expect, it } from "vitest";
import { createCity } from "../src/city/create.js";
import { place } from "../src/city/commands.js";
import { houseProblems, setMergeable, tryMergeAll } from "../src/city/housing.js";

describe("2×2 house merging", () => {
  it("merges four same-level tents when a merge bit is set", () => {
    const city = createCity({ width: 16, height: 16, treasury: 8000 });
    for (const [x, y] of [
      [4, 4],
      [5, 4],
      [4, 5],
      [5, 5],
    ] as const) {
      setMergeable(city, x, y, true);
      place(city, "house", x, y);
    }
    for (const h of city.buildings.filter((b) => b.type === "house")) {
      h.population = 5;
      h.houseLevel = 0;
      h.capacity = 5;
    }
    tryMergeAll(city);
    const houses = city.buildings.filter((b) => b.type === "house");
    expect(houses).toHaveLength(1);
    expect(houses[0].size).toBe(2);
    expect(houses[0].population).toBe(20);
    expect(houses[0].capacity).toBe(20);
  });

  it("refuses to merge when no tile allows it", () => {
    const city = createCity({ width: 16, height: 16, treasury: 8000 });
    for (const [x, y] of [
      [8, 8],
      [9, 8],
      [8, 9],
      [9, 9],
    ] as const) {
      setMergeable(city, x, y, false);
      place(city, "house", x, y);
    }
    for (const h of city.buildings.filter((b) => b.type === "house")) {
      h.population = 5;
      h.houseLevel = 0;
    }
    tryMergeAll(city);
    expect(city.buildings.filter((b) => b.type === "house")).toHaveLength(4);
  });
});

describe("C3 inspect speech", () => {
  it("calls a vacant lot vacant", () => {
    const city = createCity({ width: 12, height: 12, treasury: 500 });
    place(city, "house", 4, 4);
    const h = city.buildings.find((b) => b.type === "house")!;
    expect(houseProblems(city, h)).toBe("This housing is vacant.");
  });

  it("asks for a temple in the original phrasing", () => {
    const city = createCity({ width: 12, height: 12, treasury: 500 });
    place(city, "house", 4, 4);
    const h = city.buildings.find((b) => b.type === "house")!;
    h.population = 9;
    h.houseLevel = 2;
    h.capacity = 9;
    h.stocks.foods.wheat = 8;
    place(city, "well", 5, 4);
    expect(houseProblems(city, h)).toBe("These people need a temple.");
  });
});
