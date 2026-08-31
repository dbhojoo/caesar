# Caesar

A from-first-principles reimplementation of **Caesar III** city logic, with a modern TypeScript simulation backend and an isometric client that aims for the look and feel of the 1998 Impressions classic.

This is **not** a Julius/Augustus fork. Those projects reproduce the original binary’s logic and require the original Caesar III data files. Caesar implements the documented systems independently, uses original art, and keeps its own save format.

Pharaoh is treated as a future ruleset in the same engine family, not as this milestone’s playable game.

## What works in this slice

The playable loop is the opening of *A Village is Born*:

- Isometric city view, C3-inspired chrome, speed controls, overlays
- Roads, vacant lots, wells, fountains, reservoirs, aqueducts
- Prefectures, engineer posts, gardens, markets, wheat farms, granaries
- Temples to Ceres, Neptune, Mercury, Mars, and Venus
- Immigrants walking in from the map entry
- Housing evolution through tent → shack using water, food, and religion
- Random walkers (service / labor) and destination walkers (immigrants, carts, market buyers)
- Fire and collapse risk, suppressed by prefects and engineers
- Treasury, population, and calendar (816 ticks per month)

## Play

The isometric client is a static Vite app. It runs the simulation in the browser (no server required). After merge, Vercel should build with the root `vercel.json` (`npm run build -w @caesar/client`, output `apps/client/dist`).

Until Origin can be linked as a Vercel git provider, production deploys are created from the GitHub mirror [dbhojoo/caesar](https://github.com/dbhojoo/caesar). Do not set Vercel’s root directory to `apps/client` — the client aliases `@caesar/sim` into `packages/sim`.

## Run it locally

```bash
npm install
npm test
npm run dev
```

The client serves on `http://localhost:5173` and runs the simulation locally. An optional authoritative session server:

```bash
npm run dev:server
```

## Repository layout

```
apps/client     isometric renderer and governor UI
apps/server     session host, tick loop, JSON saves
packages/sim    deterministic city engine (the game)
packages/protocol  shared commands and snapshots
docs/           research, mechanics, architecture, questions
```

## Legal line

Original Caesar III / Pharaoh art, music, maps, and Sierra/Activision data files are not included and must not be committed here. Mechanics in `packages/sim` are reconstructed from public documentation (see `docs/RESEARCH.md`).

## Clarifying questions

See `docs/QUESTIONS.md`. The current defaults are: Caesar III first, original art, own saves, documented logic rather than original bugs, Pharaoh later as a ruleset.
