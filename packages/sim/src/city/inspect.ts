import { specOf } from "../data/buildings.js";
import { houseName } from "../data/housing.js";
import { RESOURCE_LABEL, listedStocks, nextOrder, orderOf } from "../data/resources.js";
import { desirabilityAt, desirabilityField } from "../map/desirability.js";
import { tileAt } from "../map/grid.js";
import { computeWater, waterAt } from "../map/water.js";
import type { BuildCommand, City } from "../types.js";
import { buildingAt } from "./helpers.js";
import { houseProblems } from "./housing.js";

export interface InspectAction {
  label: string;
  command: BuildCommand;
}

export interface InspectResult {
  title: string;
  lines: string[];
  x: number;
  y: number;
  actions?: InspectAction[];
}

export function inspect(city: City, x: number, y: number): InspectResult | null {
  const t = tileAt(city, x, y);
  if (!t) return null;
  const water = computeWater(city);
  const des = desirabilityField(city);
  const b = buildingAt(city, x, y);

  if (b) {
    const spec = specOf(b.type);
    if (b.type === "house") {
      return {
        title: houseName(b.houseLevel, b.population > 0),
        x,
        y,
        lines: [
          `${b.population} residents (${b.capacity} capacity)${b.size > 1 ? ` · ${b.size}×${b.size}` : ""}`,
          houseProblems(city, b),
          `Desirability ${desirabilityAt(des, city, b.x, b.y, b.size)}`,
          `Water ${["none", "well", "fountain"][waterAt(water, city, b.x, b.y)] ?? "none"}`,
          listedStocks(b) ? `Stores: ${listedStocks(b)}` : "",
          t.mergeable ? "This plot can merge with neighbouring houses." : "",
        ].filter(Boolean),
      };
    }
    const lines = [
      spec.employees ? `Employees ${b.employees} / ${spec.employees}` : "Needs no workers",
      spec.employees ? `Labor access ${b.laborAccess}` : "",
      spec.immuneRisk ? "Immune to fire and collapse" : `Fire risk ${b.fire} · Damage ${b.damage}`,
    ].filter(Boolean);
    if (spec.produces) lines.push(`Produces ${spec.produces}.`);
    if (spec.recipe) lines.push(`Turns ${spec.recipe.in} into ${spec.recipe.out}.`);
    const stored = listedStocks(b);
    if (b.type === "granary" || b.type === "market" || b.type === "warehouse" || spec.recipe) {
      lines.push(stored ? `Stores: ${stored}` : "Stores are empty");
    }
    if (b.type === "reservoir") lines.push(b.filled ? "The reservoir is full." : "This reservoir is dry.");
    if (b.type === "theater") lines.push(b.shows > 0 ? "A play is showing." : "Needs actors from a colony.");
    if (b.type === "baths") lines.push(water.pipes[y * city.width + x] ? "Pipes supply the baths." : "Needs reservoir pipes.");
    if (b.type === "tradePost") lines.push("Land caravans call here when a land route is open.");
    if (b.type === "dock") lines.push("Sea traders call here when a sea route is open.");

    const actions: InspectAction[] = [];
    if (b.type === "warehouse" || b.type === "granary") {
        const keys =
          b.type === "granary"
            ? (["wheat", "vegetables", "fruit", "meat", "fish"] as const)
            : (["wheat", "clay", "timber", "olives", "vines", "iron", "marble", "pottery", "furniture", "oil", "wine"] as const);
        for (const k of keys) {
        const cur = orderOf(b, k);
        const nxt = nextOrder(cur);
        actions.push({
          label: `${RESOURCE_LABEL[k]}: ${cur.replace("_", " ")} → ${nxt.replace("_", " ")}`,
          command: { type: "setOrder", x, y, resource: k, order: nxt },
        });
      }
    }
    return { title: spec.name, x, y, lines, actions: actions.length ? actions : undefined };
  }

  if (t.road) {
    return {
      title: t.plaza ? "Plaza" : "Paved Road",
      x,
      y,
      lines: t.plaza ? ["A paved plaza. Raises desirability."] : ["Walkers use this street."],
    };
  }
  if (t.aqueduct) return { title: "Aqueduct", x, y, lines: ["Carries water between reservoirs."] };
  if (t.garden) return { title: "Garden", x, y, lines: ["Raises desirability. Walkers may cross."] };
  if (t.terrain === "water") return { title: "Water", x, y, lines: ["A reservoir or dock must touch this shore."] };
  if (t.terrain === "meadow") return { title: "Meadow", x, y, lines: ["Fertile land for farms."] };
  if (t.terrain === "rock") return { title: "Rock", x, y, lines: ["Place an iron mine or marble quarry here."] };
  if (t.terrain === "trees") return { title: "Trees", x, y, lines: ["A timber yard can work this grove."] };
  return {
    title: "Open Ground",
    x,
    y,
    lines: [
      `Water ${["none", "well", "fountain"][waterAt(water, city, x, y)] ?? "none"}`,
      `Desirability ${des[y * city.width + x]}`,
    ],
  };
}
