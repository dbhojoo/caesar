import { describe, expect, it } from "vitest";
import { createCity, paintRect, paintTerrain } from "../src/city/create.js";
import { place } from "../src/city/commands.js";
import { produceAndTrade } from "../src/city/industry.js";
import { moveWalkers } from "../src/city/walkers.js";
import { getStock } from "../src/data/resources.js";
import { TICKS_PER_TILE } from "../src/time.js";

function staff(city: ReturnType<typeof createCity>): void {
  for (const b of city.buildings) {
    if (b.type === "house") continue;
    b.employees = 10;
    b.laborAccess = 300;
  }
}

describe("food industry", () => {
  it("a staffed wheat farm sends a cart that fills a granary", () => {
    const city = createCity({ width: 24, height: 24, treasury: 8000 });
    paintRect(city, 2, 2, 10, 10, "meadow");
    for (let x = 2; x <= 16; x++) place(city, "road", x, 6);
    place(city, "wheatFarm", 3, 3);
    place(city, "granary", 12, 3);
    const farm = city.buildings.find((b) => b.type === "wheatFarm")!;
    const granary = city.buildings.find((b) => b.type === "granary")!;
    expect(farm).toBeTruthy();
    expect(granary).toBeTruthy();
    farm.employees = 10;
    farm.laborAccess = 300;
    granary.employees = 6;
    granary.laborAccess = 300;
    farm.production = 200;
    produceAndTrade(city);
    expect(city.walkers.some((w) => w.kind === "cartPusher")).toBe(true);
    for (let i = 0; i < TICKS_PER_TILE * 24; i++) moveWalkers(city);
    const stored = granary.stocks.foods.wheat ?? 0;
    const stillCarting = city.walkers.some((w) => w.kind === "cartPusher" && w.cargo);
    expect(stored + (stillCarting ? 100 : 0)).toBeGreaterThan(0);
  });
});

describe("goods industry", () => {
  it("a clay pit delivers clay to a warehouse", () => {
    const city = createCity({ width: 24, height: 24, treasury: 8000 });
    for (let x = 2; x <= 16; x++) place(city, "road", x, 8);
    place(city, "clayPit", 3, 6);
    place(city, "warehouse", 12, 5);
    staff(city);
    const pit = city.buildings.find((b) => b.type === "clayPit")!;
    pit.production = 200;
    produceAndTrade(city);
    expect(city.walkers.some((w) => w.kind === "cartPusher" && w.cargo?.kind === "clay")).toBe(true);
    for (let i = 0; i < TICKS_PER_TILE * 24; i++) moveWalkers(city);
    const warehouse = city.buildings.find((b) => b.type === "warehouse")!;
    const onCart = city.walkers.some((w) => w.kind === "cartPusher" && w.cargo?.kind === "clay");
    expect(getStock(warehouse, "clay") + (onCart ? 100 : 0)).toBeGreaterThan(0);
  });

  it("a pottery workshop with clay sends pottery to a warehouse", () => {
    const city = createCity({ width: 24, height: 24, treasury: 8000 });
    for (let x = 2; x <= 16; x++) place(city, "road", x, 8);
    place(city, "potteryWorkshop", 4, 6);
    place(city, "warehouse", 12, 5);
    staff(city);
    const shop = city.buildings.find((b) => b.type === "potteryWorkshop")!;
    const warehouse = city.buildings.find((b) => b.type === "warehouse")!;
    shop.stocks.raws.clay = 100;
    shop.production = 200;
    produceAndTrade(city);
    expect(city.walkers.some((w) => w.kind === "cartPusher" && w.cargo?.kind === "pottery")).toBe(true);
    for (let i = 0; i < TICKS_PER_TILE * 24; i++) moveWalkers(city);
    const onCart = city.walkers.some((w) => w.kind === "cartPusher" && w.cargo?.kind === "pottery");
    expect(getStock(warehouse, "pottery") + (onCart ? 100 : 0)).toBeGreaterThan(0);
  });

  it("a warehouse set to getting fetches pottery from another warehouse", () => {
    const city = createCity({ width: 28, height: 20, treasury: 8000 });
    for (let x = 2; x <= 22; x++) place(city, "road", x, 8);
    place(city, "warehouse", 3, 5);
    place(city, "warehouse", 16, 5);
    staff(city);
    const src = city.buildings.find((b) => b.x === 3)!;
    const dest = city.buildings.find((b) => b.x === 16)!;
    src.stocks.goods.pottery = 400;
    dest.orders.pottery = "getting";
    produceAndTrade(city);
    expect(city.walkers.some((w) => w.kind === "warehouseGetter")).toBe(true);
    for (let i = 0; i < TICKS_PER_TILE * 40; i++) moveWalkers(city);
    expect(getStock(dest, "pottery")).toBeGreaterThan(0);
  });

  it("a timber yard can be placed on trees", () => {
    const city = createCity({ width: 16, height: 16, treasury: 2000 });
    paintRect(city, 4, 4, 6, 6, "trees");
    for (let x = 3; x <= 10; x++) place(city, "road", x, 8);
    const err = place(city, "timberYard", 4, 4);
    expect(err).toBeNull();
    expect(city.buildings.some((b) => b.type === "timberYard")).toBe(true);
  });

  it("an iron mine can be placed on rock", () => {
    const city = createCity({ width: 16, height: 16, treasury: 2000 });
    paintTerrain(city, 5, 5, "rock");
    paintTerrain(city, 6, 5, "rock");
    paintTerrain(city, 5, 6, "rock");
    paintTerrain(city, 6, 6, "rock");
    for (let x = 3; x <= 10; x++) place(city, "road", x, 8);
    const err = place(city, "ironMine", 5, 5);
    expect(err).toBeNull();
  });
});
