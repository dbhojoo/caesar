import { describe, expect, it } from "vitest";
import { createCity } from "../src/city/create.js";
import { applyCommand, place } from "../src/city/commands.js";
import { tickEmpire } from "../src/city/empire.js";
import { moveWalkers } from "../src/city/walkers.js";
import { getStock } from "../src/data/resources.js";
import { TICKS_PER_TILE } from "../src/time.js";

describe("empire trade", () => {
  it("opening Capua costs denarii and marks the route open", () => {
    const city = createCity({ width: 20, height: 20, treasury: 1000 });
    const before = city.treasury;
    const err = applyCommand(city, { type: "openTrade", cityId: "capua" });
    expect(err).toBeNull();
    expect(city.empire.cities.find((c) => c.id === "capua")?.open).toBe(true);
    expect(city.treasury).toBe(before - 200);
  });

  it("a staffed trade post sends a caravan that sells pottery", () => {
    const city = createCity({ width: 24, height: 24, treasury: 5000 });
    applyCommand(city, { type: "openTrade", cityId: "capua" });
    for (let x = 4; x <= 16; x++) place(city, "road", x, 10);
    place(city, "tradePost", 6, 8);
    place(city, "warehouse", 12, 7);
    const post = city.buildings.find((b) => b.type === "tradePost")!;
    const warehouse = city.buildings.find((b) => b.type === "warehouse")!;
    post.employees = 8;
    post.laborAccess = 300;
    warehouse.employees = 6;
    warehouse.laborAccess = 300;
    city.tick = 500;
    city.empire.lastCaravanTick = 0;
    tickEmpire(city);
    expect(city.walkers.some((w) => w.kind === "caravan")).toBe(true);
    for (let i = 0; i < TICKS_PER_TILE * 30; i++) moveWalkers(city);
    expect(getStock(warehouse, "pottery") + getStock(warehouse, "clay")).toBeGreaterThan(0);
  });
});
