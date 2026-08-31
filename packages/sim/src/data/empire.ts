import type { Empire } from "../types.js";

export function defaultEmpire(): Empire {
  return {
    lastCaravanTick: 0,
    cities: [
      {
        id: "capua",
        name: "Capua",
        kind: "land",
        open: false,
        openCost: 200,
        sells: ["pottery", "clay"],
        buys: ["wheat"],
      },
      {
        id: "tarentum",
        name: "Tarentum",
        kind: "sea",
        open: false,
        openCost: 400,
        sells: ["furniture", "timber"],
        buys: ["oil"],
      },
      {
        id: "syracusae",
        name: "Syracusae",
        kind: "sea",
        open: false,
        openCost: 500,
        sells: ["wine", "oil", "olives"],
        buys: ["pottery"],
      },
    ],
  };
}
