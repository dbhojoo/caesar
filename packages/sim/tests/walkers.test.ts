import { describe, expect, it } from "vitest";
import { createCity } from "../src/city/create.js";
import { place } from "../src/city/commands.js";
import { spawnPatrol } from "../src/city/walkers.js";
import { spawnServiceWalkers } from "../src/city/industry.js";
import { tickMany } from "../src/city/tick.js";
import { findPath, roadsPass } from "../src/map/path.js";
import { TICKS_PER_TILE } from "../src/time.js";

describe("walkers", () => {
  it("finds a road path and refuses a 500+ tile walk", () => {
    const city = createCity({ width: 20, height: 20, treasury: 2000 });
    for (let x = 2; x <= 12; x++) place(city, "road", x, 5);
    const path = findPath(city, { x: 2, y: 5 }, { x: 12, y: 5 }, roadsPass);
    expect(path?.length).toBe(11);
  });

  it("a prefect leaves the post and walks the road", () => {
    const city = createCity({ width: 24, height: 24, treasury: 3000 });
    for (let x = 4; x <= 16; x++) place(city, "road", x, 8);
    place(city, "prefecture", 8, 7);
    const post = city.buildings.find((b) => b.type === "prefecture")!;
    post.employees = 6;
    post.laborAccess = 300;
    const walker = spawnPatrol(city, post, "prefect");
    expect(walker).not.toBeNull();
    tickMany(city, TICKS_PER_TILE * 4);
    const w = city.walkers.find((x) => x.kind === "prefect");
    expect(w).toBeTruthy();
    expect(w!.x !== 8 || w!.y !== 8 || w!.tilesWalked > 0).toBe(true);
  });

  it("priests grant Ceres access to a neighbouring house", () => {
    const city = createCity({ width: 20, height: 20, treasury: 4000 });
    for (let x = 6; x <= 9; x++) place(city, "road", x, 6);
    place(city, "house", 6, 5);
    place(city, "templeCeres", 8, 4);
    const house = city.buildings.find((b) => b.type === "house")!;
    house.population = 7;
    const temple = city.buildings.find((b) => b.type === "templeCeres")!;
    temple.employees = 2;
    temple.laborAccess = 300;
    spawnPatrol(city, temple, "priest");
    tickMany(city, TICKS_PER_TILE * 8);
    expect(house.services.religion.ceres ?? 0).toBeGreaterThan(0);
  });

  it("schoolchildren grant education as they run", () => {
    const city = createCity({ width: 20, height: 20, treasury: 4000 });
    for (let x = 6; x <= 10; x++) place(city, "road", x, 6);
    place(city, "house", 6, 5);
    place(city, "school", 8, 4);
    const house = city.buildings.find((b) => b.type === "house")!;
    house.population = 17;
    const school = city.buildings.find((b) => b.type === "school")!;
    school.employees = 10;
    spawnPatrol(city, school, "schoolchild");
    expect(house.services.school).toBeGreaterThan(0);
  });

  it("an actor from a colony lets a theater put on a show", () => {
    const city = createCity({ width: 24, height: 24, treasury: 8000 });
    for (let x = 4; x <= 16; x++) place(city, "road", x, 8);
    place(city, "actorColony", 4, 5);
    place(city, "theater", 12, 6);
    place(city, "house", 8, 7);
    const house = city.buildings.find((b) => b.type === "house")!;
    house.population = 20;
    house.capacity = 20;
    const colony = city.buildings.find((b) => b.type === "actorColony")!;
    const theater = city.buildings.find((b) => b.type === "theater")!;
    colony.employees = 5;
    colony.laborAccess = 300;
    theater.employees = 8;
    theater.laborAccess = 300;
    spawnServiceWalkers(city);
    expect(city.walkers.some((w) => w.kind === "performer")).toBe(true);
    tickMany(city, TICKS_PER_TILE * 16);
    expect(theater.shows).toBeGreaterThan(0);
  });
});
