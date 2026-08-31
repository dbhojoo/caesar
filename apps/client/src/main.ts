import {
  applyCommand,
  BUILD_MENU,
  CATALOG,
  createVillageBorn,
  inspect,
  snapshot,
  specOf,
  tick,
  type BuildCommand,
  type BuildingType,
  type City,
  type Overlay,
} from "@caesar/sim";
import { drawCity } from "./draw.js";
import { screenToWorld, type Camera } from "./iso.js";

const canvas = document.querySelector<HTMLCanvasElement>("#city")!;
const ctx = canvas.getContext("2d")!;

let city: City = createVillageBorn();
let overlay: Overlay = "none";
let speed = 1;
let selected: BuildingType | "clear" | null = "house";
let category = "housing";
let hover: { x: number; y: number } | null = null;
let dragging = false;
let dragStart: { x: number; y: number } | null = null;
let panning = false;
let panLast = { x: 0, y: 0 };
const keys = new Set<string>();

const cam: Camera = { x: 0, y: 720, zoom: 1 };

function resize(): void {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

resize();
addEventListener("resize", resize);

function renderCats(): void {
  const nav = document.querySelector("#cats")!;
  nav.innerHTML = BUILD_MENU.map(
    (c) => `<button data-cat="${c.id}" class="${c.id === category ? "on" : ""}">${c.label}</button>`,
  ).join("");
  renderItems();
}

function renderItems(): void {
  const group = BUILD_MENU.find((c) => c.id === category)!;
  const box = document.querySelector("#items")!;
  box.innerHTML = group.items
    .map((t) => {
      const spec = specOf(t);
      return `<button data-item="${t}" class="${selected === t ? "on" : ""}">${spec.name} · ${spec.cost} Dn</button>`;
    })
    .join("");
}

renderCats();

document.querySelector("#cats")!.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("button");
  if (!btn) return;
  category = btn.dataset.cat ?? category;
  selected = BUILD_MENU.find((c) => c.id === category)?.items[0] ?? null;
  renderCats();
});

document.querySelector("#items")!.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("button");
  if (!btn) return;
  selected = btn.dataset.item as BuildingType;
  renderItems();
  hintFor(selected);
});

document.querySelector("#clear-btn")!.addEventListener("click", () => {
  selected = "clear";
  hint("Clear land — click a tile to remove roads or buildings.");
});

document.querySelector("#speeds")!.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("button");
  if (!btn) return;
  speed = Number(btn.dataset.speed);
  document.querySelectorAll("#speeds button").forEach((b) => b.classList.toggle("on", b === btn));
});

document.querySelector("#overlays")!.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("button");
  if (!btn?.dataset.overlay) return;
  overlay = btn.dataset.overlay as Overlay;
  document.querySelectorAll("#overlays button[data-overlay]").forEach((b) => b.classList.toggle("on", b === btn));
});

function hint(text: string): void {
  document.querySelector("#build-hint")!.textContent = text;
}

function hideInspect(): void {
  document.querySelector("#inspect")!.setAttribute("hidden", "");
}

function hideEmpire(): void {
  document.querySelector("#empire")!.setAttribute("hidden", "");
}

function showInspect(t: { x: number; y: number }): void {
  const info = inspect(city, t.x, t.y);
  const panel = document.querySelector("#inspect")!;
  if (!info) {
    hideInspect();
    return;
  }
  panel.removeAttribute("hidden");
  document.querySelector("#inspect-title")!.textContent = info.title;
  document.querySelector("#inspect-body")!.innerHTML = info.lines.map((l) => `<p>${l}</p>`).join("");
  const actions = document.querySelector("#inspect-actions")!;
  actions.innerHTML = (info.actions ?? [])
    .map((a, i) => `<button type="button" data-action="${i}">${a.label}</button>`)
    .join("");
  actions.querySelectorAll("button").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      const cmd = info.actions![i].command;
      const err = applyCommand(city, cmd);
      if (err) hint(err);
      showInspect(t);
    });
  });
}

function renderEmpire(): void {
  const body = document.querySelector("#empire-body")!;
  body.innerHTML = city.empire.cities
    .map((c) => {
      const goods = `Sells ${c.sells.join(", ")}. Buys ${c.buys.join(", ")}.`;
      const btn = c.open
        ? `<em>Route open</em>`
        : `<button type="button" data-trade="${c.id}">Open · ${c.openCost} Dn</button>`;
      return `<div class="trade-city"><strong>${c.name}</strong> <span>${c.kind}</span><p>${goods}</p>${btn}</div>`;
    })
    .join("");
}

document.querySelector("#inspect-close")!.addEventListener("click", hideInspect);
document.querySelector("#empire-close")!.addEventListener("click", hideEmpire);
document.querySelector("#empire-btn")!.addEventListener("click", (e) => {
  e.stopPropagation();
  const panel = document.querySelector("#empire")!;
  if (panel.hasAttribute("hidden")) {
    renderEmpire();
    panel.removeAttribute("hidden");
  } else hideEmpire();
});
document.querySelector("#empire-body")!.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("button");
  if (!btn) return;
  const id = btn.dataset.trade;
  if (!id) return;
  const err = applyCommand(city, { type: "openTrade", cityId: id });
  if (err) hint(err);
  renderEmpire();
});

function hintFor(type: BuildingType): void {
  const spec = CATALOG[type];
  hint(`${spec.name}: ${spec.cost} Dn${spec.employees ? `, ${spec.employees} workers` : ""}.`);
}

function tileFromEvent(ev: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const w = ev.clientX - rect.left;
  const h = ev.clientY - rect.top;
  const p = screenToWorld(w, h, cam, innerWidth, innerHeight);
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 1 || e.button === 2 && e.shiftKey) {
    panning = true;
    panLast = { x: e.clientX, y: e.clientY };
    return;
  }
  if (e.button === 2) {
    const t = tileFromEvent(e);
    showInspect(t);
    return;
  }
  if (e.button === 0) hideInspect();
  if (e.button !== 0 || !selected) return;
  const t = tileFromEvent(e);
  if (selected === "clear") {
    applyCommand(city, { type: "clear", x: t.x, y: t.y });
    return;
  }
  if (selected === "road" || selected === "aqueduct" || selected === "garden" || selected === "plaza") {
    dragging = true;
    dragStart = t;
    return;
  }
  const err = applyCommand(city, { type: "place", building: selected, x: t.x, y: t.y });
  if (err) hint(err);
});

addEventListener("mouseup", (e) => {
  if (dragging && dragStart && selected && selected !== "clear") {
    const t = tileFromEvent(e);
    const cmd: BuildCommand = {
      type: "drag",
      building: selected as "road" | "aqueduct" | "garden" | "plaza",
      from: dragStart,
      to: t,
    };
    const err = applyCommand(city, cmd);
    if (err) hint(err);
  }
  dragging = false;
  dragStart = null;
  panning = false;
});

canvas.addEventListener("mousemove", (e) => {
  hover = tileFromEvent(e);
  if (panning) {
    cam.x -= (e.clientX - panLast.x) / cam.zoom;
    cam.y -= (e.clientY - panLast.y) / cam.zoom;
    panLast = { x: e.clientX, y: e.clientY };
  }
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  cam.zoom = Math.max(0.45, Math.min(2.2, cam.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
}, { passive: false });

addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
  if (e.key === "Escape") {
    hideInspect();
    hideEmpire();
  }
  if (e.key === " ") {
    e.preventDefault();
    speed = speed === 0 ? 1 : 0;
    document.querySelectorAll("#speeds button").forEach((b) => {
      b.classList.toggle("on", Number((b as HTMLButtonElement).dataset.speed) === speed);
    });
  }
  if (e.key === "r") selected = "road";
  if (e.key === "h") {
    selected = "house";
    category = "housing";
    renderCats();
  }
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

function panFromKeys(): void {
  const s = 12 / cam.zoom;
  if (keys.has("w") || keys.has("arrowup")) cam.y -= s;
  if (keys.has("s") || keys.has("arrowdown")) cam.y += s;
  if (keys.has("a") || keys.has("arrowleft")) cam.x -= s;
  if (keys.has("d") || keys.has("arrowright")) cam.x += s;
}

function syncHud(): void {
  const snap = snapshot(city, overlay);
  document.querySelector("#city-name")!.textContent = snap.name;
  document.querySelector("#date")!.textContent = `${snap.stats.month} ${snap.stats.year}`;
  document.querySelector("#pop")!.textContent = String(snap.stats.population);
  document.querySelector("#jobs")!.textContent = `${snap.stats.employed} / ${snap.stats.workforce}`;
  document.querySelector("#dn")!.textContent = `${snap.stats.treasury} Dn`;
  const last = snap.messages[snap.messages.length - 1];
  document.querySelector("#ticker")!.textContent = last?.text ?? "The valley awaits your first streets.";
}

let acc = 0;
let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  acc += dt * speed * 30;
  while (acc >= 1) {
    tick(city);
    acc -= 1;
  }
  panFromKeys();
  const snap = snapshot(city, overlay);
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  const ghost =
    hover && selected && selected !== "clear"
      ? { type: selected, x: hover.x, y: hover.y, size: specOf(selected).size }
      : null;
  drawCity(ctx, snap, cam, hover, ghost);
  syncHud();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
