import { describe, expect, it } from "vitest";
import { createCity } from "../src/city/create.js";
import { place } from "../src/city/commands.js";
import { refreshHousing, unmetNeeds } from "../src/city/housing.js";
import { emptyServices } from "../src/city/helpers.js";
import { houseCapacity } from "../src/data/housing.js";
import type { Building } from "../src/types.js";

function seededHouse(level: number, extras: Partial<Building> = {}): Building {
  return {
    id: 99,
    type: "house",
    x: 5,
    y: 5,
    size: 1,
    employees: 0,
    laborAccess: 300,
    fire: 0,
    damage: 0,
    houseLevel: level,
    population: houseCapacity(level),
    capacity: houseCapacity(level),
    services: emptyServices(),
        stocks: { foods: {}, goods: {}, raws: {} },
        production: 0,
        walkerIds: [],
        roamCycle: 0,
        filled: false,
        shows: 0,
        orders: {},
    ...extras,
  };
}

describe("housing requirements", () => {
  it("small tents need nothing", () => {
    const h = seededHouse(0);
    expect(unmetNeeds(h, 0, 0)).toEqual([]);
  });

  it("large tents need well or fountain water", () => {
    const h = seededHouse(1);
    expect(unmetNeeds(h, 0, 1)).toContain("water");
    expect(unmetNeeds(h, 1, 1)).toEqual([]);
    expect(unmetNeeds(h, 2, 1)).toEqual([]);
  });

  it("small shacks need a food type", () => {
    const h = seededHouse(2);
    h.stocks.foods.wheat = 4;
    expect(unmetNeeds(h, 1, 2)).toEqual([]);
    h.stocks.foods.wheat = 0;
    expect(unmetNeeds(h, 1, 2)).toContain("food");
  });

  it("large shacks need a god", () => {
    const h = seededHouse(3);
    h.stocks.foods.wheat = 4;
    expect(unmetNeeds(h, 1, 3)).toContain("a temple");
    h.services.religion.ceres = 20;
    expect(unmetNeeds(h, 1, 3)).toEqual([]);
  });

  it("small hovels need fountain water", () => {
    const h = seededHouse(4);
    h.stocks.foods.wheat = 4;
    h.services.religion.ceres = 20;
    expect(unmetNeeds(h, 1, 4)).toContain("fountain water");
    expect(unmetNeeds(h, 2, 4)).toEqual([]);
  });
});

describe("housing evolution on the map", () => {
  it("evolves a tent to a large tent when a well covers it", () => {
    const city = createCity({ width: 16, height: 16, treasury: 5000 });
    for (let x = 3; x <= 8; x++) place(city, "road", x, 6);
    place(city, "house", 5, 5);
    place(city, "well", 6, 5);
    const house = city.buildings.find((b) => b.type === "house")!;
    house.population = 5;
    house.capacity = 5;
    house.houseLevel = 0;
    refreshHousing(city);
    expect(house.houseLevel).toBe(1);
    expect(house.capacity).toBe(7);
  });

  it("devolves when desirability is terrible", () => {
    const city = createCity({ width: 16, height: 16, treasury: 8000 });
    place(city, "house", 8, 8);
    const house = city.buildings.find((b) => b.type === "house")!;
    house.population = 11;
    house.houseLevel = 3;
    house.capacity = 11;
    house.stocks.foods.wheat = 8;
    house.services.religion.ceres = 40;
    place(city, "reservoir", 5, 7);
    place(city, "reservoir", 9, 5);
    refreshHousing(city);
    expect(house.houseLevel).toBeLessThan(3);
  });
});
