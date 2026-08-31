# Architecture

The original executable mixed rendering, UI, and simulation in one process, with fixed-size arrays (2000 buildings, walker list, city bytes). A modern backend splits those concerns and keeps the simulation deterministic.

```
├────────────────────────────────────────────┐
│  apps/client  (Vite, Canvas 2D, original art)│
│  isometric city · overlays · governor chrome │
└────────────────────├───────────────────────┘
                      │ commands / snapshots
├────────────────────└───────────────────────┐
│  apps/server  (optional session host)        │
│  tick clock · JSON save · WebSocket clients  │
└────────────────────├───────────────────────┘
                      │
├────────────────────└───────────────────────┐
│  packages/sim                                │
│  map · buildings · walkers · housing · water │
│  labor · industry · migration · overlays     │
└────────────────────────────────────────────┘
```

The client can run `packages/sim` **in-process** (default) so a governor can play without a server. The server runs the same tick function and is the path to multiplayer spectating, persistence, and later headless campaigns.

## Simulation contract

`tick(city)` is a pure-enough state transition: given a `City` and a command queue, it advances one animation tick. Same seed + same commands ⇒ same city. Tests assert housing, water, walkers, and desirability without a renderer.

Julius’s folders (`building`, `figure`, `map`, `city`, `window`) map onto this layout, but the data model is ordinary TypeScript objects rather than packed C structs.

## Time

| Unit | Ticks |
| --- | --- |
| Tile step (speed 6) | 15 |
| Sixteenth of a month (“week”) | 51 |
| Month | 816 |
| Year | 12 × 816 |

Most civic systems run on the sixteenth. Walkers move every tick.

## Map

A square grid. Terrain: grass, meadow (farmland), rock, water, trees. Buildings occupy an axis-aligned footprint. Roads, aqueducts, and gardens are tile flags rather than full buildings when that matches C3 (roads and aqueducts are cheap, draggable, 1×1).

North is −y in grid space, drawn toward the top-right in isometric projection (`sx = (x − y) * tw/2`, `sy = (x + y) * th/2`).

## Walkers

Two families, as in C3/Pharaoh:

- **Destination walkers** — immigrants, cart pushers, market buyers, prefects running to a fire. Shortest path on the allowed tile set.
- **Random walkers** — prefects on patrol, engineers, priests, market traders, labor-seekers. Four-cycle roam toward a road near 8 tiles from the building’s origin, then home. Reliable coverage on a loop of about 46–52 road tiles.

Service is applied when a walker occupies a road tile: houses within 2 tiles receive that service token.

## Pharaoh later

`packages/sim` should grow a `Ruleset` (`caesar3` | `pharaoh`) for walker tables, housing, gods, and floodplain farms. Do not fork the renderer. Akhenaten remains the project that plays original Pharaoh assets; this engine would be an original-art Pharaoh if we go there.
