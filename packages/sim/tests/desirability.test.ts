import { describe, expect, it } from "vitest";
import { createCity } from "../src/city/create.js";
import { place } from "../src/city/commands.js";
import { desirabilityAt, desirabilityField } from "../src/map/desirability.js";

describe("desirability", () => {
  it("gardens raise nearby tiles and fade with range", () => {
    const city = createCity({ width: 16, height: 16, treasury: 1000 });
    place(city, "garden", 8, 8);
    const field = desirabilityField(city);
    const near = field[8 * 16 + 9];
    const far = field[8 * 16 + 13];
    expect(near).toBeGreaterThan(0);
    expect(near).toBeGreaterThan(far);
  });

  it("reservoirs are a blight on neighbouring housing", () => {
    const city = createCity({ width: 20, height: 20, treasury: 4000 });
    place(city, "house", 10, 6);
    place(city, "reservoir", 10, 8);
    const field = desirabilityField(city);
    const house = city.buildings.find((b) => b.type === "house")!;
    expect(desirabilityAt(field, city, house.x, house.y, 1)).toBeLessThan(0);
  });
});
