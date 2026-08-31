import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import {
  createVillageBorn,
  inspect,
  loadCity,
  saveCity,
  snapshot,
  tick,
  type BuildCommand,
  type City,
  type Overlay,
} from "@caesar/sim";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT ?? 8787);
const SAVE = resolve(dirname(fileURLToPath(import.meta.url)), "../../../data/saves/autosave.json");

mkdirSync(dirname(SAVE), { recursive: true });

let city: City = existsSync(SAVE) ? loadCity(readFileSync(SAVE, "utf8")) : createVillageBorn();
let overlay: Overlay = "none";
let speed = 1;
let acc = 0;

const http = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, city: city.name, tick: city.tick }));
    return;
  }
  if (req.url === "/snapshot") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(snapshot(city, overlay)));
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

const wss = new WebSocketServer({ server: http });
const clients = new Set<WebSocket>();

function broadcast(): void {
  const payload = JSON.stringify({ type: "snapshot", snapshot: snapshot(city, overlay) });
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
}

function persist(): void {
  writeFileSync(SAVE, saveCity(city));
}

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "snapshot", snapshot: snapshot(city, overlay) }));
  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(String(raw)) as {
        type: string;
        command?: BuildCommand;
        x?: number;
        y?: number;
        overlay?: Overlay;
        speed?: number;
      };
      if (msg.type === "command" && msg.command) {
        const errors = tick(city, [msg.command]);
        if (errors[0]) ws.send(JSON.stringify({ type: "error", text: errors[0] }));
        broadcast();
      } else if (msg.type === "inspect" && msg.x != null && msg.y != null) {
        const info = inspect(city, msg.x, msg.y);
        if (info) ws.send(JSON.stringify({ type: "inspect", ...info }));
      } else if (msg.type === "overlay" && msg.overlay) {
        overlay = msg.overlay;
        broadcast();
      } else if (msg.type === "speed" && msg.speed != null) {
        speed = msg.speed;
      } else if (msg.type === "reset") {
        city = createVillageBorn();
        persist();
        broadcast();
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: "error", text: String(err) }));
    }
  });
  ws.on("close", () => clients.delete(ws));
});

setInterval(() => {
  acc += speed;
  while (acc >= 1) {
    tick(city);
    acc -= 1;
  }
}, 1000 / 30);

setInterval(() => {
  persist();
  broadcast();
}, 500);

http.listen(PORT, () => {
  console.log(`Caesar session host on http://localhost:${PORT}`);
});
