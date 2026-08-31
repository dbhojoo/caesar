import type { CitySnapshot, ViewBuilding } from "@caesar/sim";
import { diamond, TILE_H, TILE_W, worldToScreen, type Camera } from "./iso.js";

const TERRAIN: Record<string, [string, string]> = {
  grass: ["#6f8f3c", "#5c7a30"],
  meadow: ["#8aa64a", "#6f8a36"],
  water: ["#2f6f93", "#245877"],
  rock: ["#8a7b6a", "#6c5f52"],
  trees: ["#3f6a2c", "#2d4e1f"],
};

const WALKER_COLOR: Record<string, string> = {
  immigrant: "#e8d4b0",
  laborSeeker: "#c4a574",
  prefect: "#c43c2c",
  engineer: "#d8c090",
  priest: "#f0e6c8",
  doctor: "#8ec4c4",
  surgeon: "#5a9a9a",
  barber: "#e8d8a8",
  bather: "#7eb8d8",
  actor: "#d080b0",
  performer: "#c060a0",
  schoolchild: "#f0d898",
  librarian: "#c4b8a0",
  scholar: "#d8c4a0",
  marketTrader: "#d4a04a",
  marketBuyer: "#b8860b",
  cartPusher: "#8a6a3c",
  warehouseGetter: "#6a4a2c",
  caravan: "#c4a060",
  docker: "#3a6a8a",
};

function houseRoof(level: number): string {
  const roofs = ["#8a5a3a", "#9a4a2c", "#b55232", "#c45c3e", "#d46848", "#c47a3a", "#e8dcc8", "#f0e8d0"];
  return roofs[Math.min(roofs.length - 1, Math.floor(level / 2))];
}

function houseWall(level: number): string {
  if (level >= 12) return "#e6d8c4";
  if (level >= 7) return "#d2b48c";
  if (level >= 4) return "#b08968";
  return "#8b6a4a";
}

export function drawCity(
  ctx: CanvasRenderingContext2D,
  snap: CitySnapshot,
  cam: Camera,
  hover: { x: number; y: number } | null,
  ghost: { type: string; x: number; y: number; size: number } | null,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#8fb4c8");
  sky.addColorStop(0.45, "#c8b48a");
  sky.addColorStop(1, "#7a8f4a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const order: { x: number; y: number }[] = [];
  for (let y = 0; y < snap.height; y++) {
    for (let x = 0; x < snap.width; x++) order.push({ x, y });
  }
  order.sort((a, b) => a.x + a.y - (b.x + b.y));

  for (const p of order) {
    const tile = snap.tiles[p.y * snap.width + p.x];
    const { sx, sy } = worldToScreen(p.x, p.y, cam, w, h);
    if (sx < -80 || sy < -80 || sx > w + 80 || sy > h + 80) continue;
    const [a, bcol] = TERRAIN[tile.terrain] ?? TERRAIN.grass;
    const checker = (p.x + p.y) % 2 === 0 ? a : bcol;
    diamond(ctx, sx, sy, cam.zoom, checker, "rgba(40,30,10,0.18)");

    if (tile.terrain === "water") {
      diamond(ctx, sx, sy, cam.zoom, (p.x + p.y + Math.floor(snap.tick / 20)) % 5 === 0 ? "#3d86ad" : checker);
    }

    paintOverlay(ctx, snap, p.x, p.y, sx, sy, cam.zoom);

    if (tile.garden) drawGarden(ctx, sx, sy, cam.zoom);
    if (tile.aqueduct) drawAqueduct(ctx, sx, sy, cam.zoom);
    if (tile.road) drawRoad(ctx, sx, sy, cam.zoom, neighborsRoad(snap, p.x, p.y), tile.plaza);
  }

  const buildings = [...snap.buildings].sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const b of buildings) drawBuilding(ctx, snap, b, cam, w, h);

  for (const walker of snap.walkers) {
    const { sx, sy } = worldToScreen(walker.fx, walker.fy, cam, w, h);
    drawWalker(ctx, sx, sy, cam.zoom, walker.kind);
  }

  if (ghost) {
    const { sx, sy } = worldToScreen(ghost.x, ghost.y, cam, w, h);
    ctx.globalAlpha = 0.45;
    drawBlock(ctx, sx, sy, cam.zoom, ghost.size, "#d4b46a", "#7a3a1c", 10);
    ctx.globalAlpha = 1;
  }

  if (hover) {
    const { sx, sy } = worldToScreen(hover.x, hover.y, cam, w, h);
    diamond(ctx, sx, sy, cam.zoom, "rgba(255,240,180,0.18)", "#fff4c8");
  }
}

function neighborsRoad(snap: CitySnapshot, x: number, y: number): boolean[] {
  const road = (xx: number, yy: number) => {
    if (xx < 0 || yy < 0 || xx >= snap.width || yy >= snap.height) return false;
    return snap.tiles[yy * snap.width + xx].road;
  };
  return [road(x, y - 1), road(x + 1, y), road(x, y + 1), road(x - 1, y)];
}

function paintOverlay(
  ctx: CanvasRenderingContext2D,
  snap: CitySnapshot,
  x: number,
  y: number,
  sx: number,
  sy: number,
  zoom: number,
): void {
  const i = y * snap.width + x;
    if (snap.overlay === "water") {
      if (snap.pipes[i]) {
        diamond(ctx, sx, sy, zoom, "rgba(196,188,168,0.45)", "rgba(140,132,116,0.5)");
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(zoom, zoom);
        ctx.strokeStyle = "rgba(120,112,96,0.55)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.stroke();
        ctx.restore();
      }
      if (snap.water[i] === 1) diamond(ctx, sx, sy, zoom, "rgba(70,140,190,0.35)");
      if (snap.water[i] === 2) diamond(ctx, sx, sy, zoom, "rgba(40,110,200,0.45)");
    }
  if (snap.overlay === "desirability") {
    const d = snap.desirability[i] ?? 0;
    if (d > 0) diamond(ctx, sx, sy, zoom, `rgba(80,200,80,${Math.min(0.55, d / 40)})`);
    if (d < 0) diamond(ctx, sx, sy, zoom, `rgba(200,40,40,${Math.min(0.55, -d / 40)})`);
  }
}

function drawRoad(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  zoom: number,
  n: boolean[],
  plaza = false,
): void {
  diamond(ctx, sx, sy, zoom, plaza ? "#d8c49a" : "#c4b492", plaza ? "#b08a48" : "#8a7a5c");
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(zoom, zoom);
  ctx.strokeStyle = "#9a8b6e";
  ctx.lineWidth = 1;
  if (n[0] || n[2]) {
    ctx.beginPath();
    ctx.moveTo(0, -TILE_H / 2 + 4);
    ctx.lineTo(0, TILE_H / 2 - 4);
    ctx.stroke();
  }
  if (n[1] || n[3]) {
    ctx.beginPath();
    ctx.moveTo(-TILE_W / 2 + 8, 0);
    ctx.lineTo(TILE_W / 2 - 8, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGarden(ctx: CanvasRenderingContext2D, sx: number, sy: number, zoom: number): void {
  diamond(ctx, sx, sy, zoom, "#4f7a32", "#2f4e1c");
  ctx.fillStyle = "#6a9a3c";
  ctx.beginPath();
  ctx.arc(sx, sy - 4 * zoom, 5 * zoom, 0, Math.PI * 2);
  ctx.fill();
}

function drawAqueduct(ctx: CanvasRenderingContext2D, sx: number, sy: number, zoom: number): void {
  drawBlock(ctx, sx, sy, zoom, 1, "#d8c8b0", "#8a7a68", 16);
  ctx.fillStyle = "#3a7ca5";
  ctx.fillRect(sx - 8 * zoom, sy - 22 * zoom, 16 * zoom, 4 * zoom);
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  snap: CitySnapshot,
  b: ViewBuilding,
  cam: Camera,
  w: number,
  h: number,
): void {
  const { sx, sy } = worldToScreen(b.x + (b.size - 1) * 0.5, b.y + (b.size - 1) * 0.5, cam, w, h);
  const z = cam.zoom;
  if (snap.overlay === "fire" && b.fire > 10) {
    diamond(ctx, sx, sy, z, `rgba(255,40,0,${Math.min(0.7, b.fire / 120)})`);
  }
  if (snap.overlay === "damage" && b.damage > 10) {
    diamond(ctx, sx, sy, z, `rgba(80,80,80,${Math.min(0.6, b.damage / 120)})`);
  }

  switch (b.type) {
    case "house":
      drawHouse(ctx, sx, sy, z, b);
      break;
    case "well":
      drawWell(ctx, sx, sy, z);
      break;
    case "fountain":
      drawFountain(ctx, sx, sy, z, b.employees > 0);
      break;
    case "reservoir":
      drawBlock(ctx, sx, sy, z, 3, "#6a5a4a", "#3c3228", 22);
      if (b.filled) {
        ctx.fillStyle = "#2f6f93";
        ctx.beginPath();
        ctx.ellipse(sx, sy - 18 * z, 22 * z, 10 * z, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case "prefecture":
      drawBlock(ctx, sx, sy, z, 1, "#8a3030", "#5a1818", 16);
      break;
    case "engineer":
      drawBlock(ctx, sx, sy, z, 1, "#c4b070", "#6a5a30", 16);
      break;
    case "market":
      drawBlock(ctx, sx, sy, z, 2, "#c47a3a", "#7a3a14", 14);
      ctx.fillStyle = "#d4a04a";
      ctx.beginPath();
      ctx.moveTo(sx - 20 * z, sy - 18 * z);
      ctx.lineTo(sx, sy - 30 * z);
      ctx.lineTo(sx + 20 * z, sy - 18 * z);
      ctx.fill();
      break;
    case "granary":
      drawBlock(ctx, sx, sy, z, 3, "#b08958", "#6a4e2c", 28);
      break;
    case "wheatFarm":
    case "oliveFarm":
    case "vineFarm":
      drawFarm(ctx, sx, sy, z, b.type);
      break;
    case "clayPit":
      drawBlock(ctx, sx, sy, z, 2, "#8a5a3a", "#4a2a18", 8);
      break;
    case "timberYard":
      drawBlock(ctx, sx, sy, z, 2, "#6a4a28", "#3c2814", 10);
      break;
    case "ironMine":
    case "marbleQuarry":
      drawBlock(ctx, sx, sy, z, 2, "#6a6058", "#3c3834", 12);
      break;
    case "potteryWorkshop":
      drawBlock(ctx, sx, sy, z, 2, "#b55232", "#6b1d16", 14);
      break;
    case "furnitureWorkshop":
      drawBlock(ctx, sx, sy, z, 2, "#8a6238", "#4a3018", 14);
      break;
    case "oilWorkshop":
      drawBlock(ctx, sx, sy, z, 2, "#8a9a3c", "#4a5a18", 14);
      break;
    case "wineWorkshop":
      drawBlock(ctx, sx, sy, z, 2, "#6a2040", "#3c1020", 14);
      break;
    case "warehouse":
      drawBlock(ctx, sx, sy, z, 3, "#a08050", "#5a4020", 22);
      ctx.fillStyle = "#d4b46a";
      ctx.fillRect(sx - 16 * z, sy - 36 * z, 32 * z, 6 * z);
      break;
    case "dock":
      drawBlock(ctx, sx, sy, z, 3, "#8a6a40", "#4a3820", 8);
      ctx.fillStyle = "#2f6f93";
      ctx.fillRect(sx - 20 * z, sy - 4 * z, 40 * z, 8 * z);
      break;
    case "tradePost":
      drawBlock(ctx, sx, sy, z, 2, "#c4a060", "#6a4820", 10);
      ctx.fillStyle = "#6b1d16";
      ctx.beginPath();
      ctx.moveTo(sx - 18 * z, sy - 14 * z);
      ctx.lineTo(sx, sy - 28 * z);
      ctx.lineTo(sx + 18 * z, sy - 14 * z);
      ctx.fill();
      break;
    case "theater":
      drawBlock(ctx, sx, sy, z, 2, "#d8c8b0", "#8a7060", 12);
      break;
    case "actorColony":
      drawBlock(ctx, sx, sy, z, 3, "#c090a0", "#6a4050", 16);
      break;
    case "clinic":
      drawBlock(ctx, sx, sy, z, 1, "#80b0b0", "#406060", 14);
      break;
    case "hospital":
      drawBlock(ctx, sx, sy, z, 3, "#90c0c0", "#406868", 20);
      break;
    case "barber":
      drawBlock(ctx, sx, sy, z, 1, "#e8d8a8", "#8a7040", 12);
      break;
    case "baths":
      drawBlock(ctx, sx, sy, z, 2, "#c8d8e8", "#5a7a8a", 12);
      ctx.fillStyle = "#4a90b8";
      ctx.beginPath();
      ctx.ellipse(sx, sy - 10 * z, 10 * z, 5 * z, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "school":
      drawBlock(ctx, sx, sy, z, 2, "#d8c090", "#8a6a30", 14);
      break;
    case "library":
      drawBlock(ctx, sx, sy, z, 2, "#c4b8a0", "#6a5a40", 16);
      break;
    case "academy":
      drawBlock(ctx, sx, sy, z, 3, "#efe6d4", "#8a7a60", 20);
      break;
    case "statueSmall":
    case "statueMedium":
    case "statueLarge":
      drawStatue(ctx, sx, sy, z, b.size);
      break;
    case "governorsHouse":
      drawBlock(ctx, sx, sy, z, 3, "#e8dcc8", "#b08a48", 24);
      break;
    case "rubble":
      diamond(ctx, sx, sy, z, "#6a5344", "#3c2c22");
      break;
    default:
      if (b.type.startsWith("temple")) drawTemple(ctx, sx, sy, z, b.type);
      else drawBlock(ctx, sx, sy, z, b.size, "#c4b49a", "#6a5a48", 14);
  }
}

function drawHouse(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number, b: ViewBuilding): void {
  if (b.population <= 0) {
    diamond(ctx, sx, sy, z, "#c4b080", "#6a5a38");
    ctx.fillStyle = "#6b1d16";
    ctx.font = `${11 * z}px Cinzel, serif`;
    ctx.textAlign = "center";
    ctx.fillText("⌂", sx, sy + 4 * z);
    return;
  }
  const h = 10 + b.houseLevel * 1.6;
  drawBlock(ctx, sx, sy, z, b.size, houseWall(b.houseLevel), houseRoof(b.houseLevel), h);
}

function drawStatue(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number, size: number): void {
  ctx.fillStyle = "#d8d0c4";
  ctx.fillRect(sx - 4 * z * size, sy - 18 * z * size, 8 * z * size, 18 * z * size);
  ctx.fillStyle = "#efe6d4";
  ctx.beginPath();
  ctx.arc(sx, sy - 22 * z * size, 5 * z * size, 0, Math.PI * 2);
  ctx.fill();
}

function drawWell(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number): void {
  ctx.fillStyle = "#8a8070";
  ctx.beginPath();
  ctx.ellipse(sx, sy, 10 * z, 6 * z, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2f4a5a";
  ctx.beginPath();
  ctx.ellipse(sx, sy, 6 * z, 3 * z, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFountain(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number, on: boolean): void {
  drawBlock(ctx, sx, sy, z, 1, "#d8d0c4", "#8a8074", 8);
  ctx.fillStyle = on ? "#7ec8e8" : "#6a7068";
  ctx.beginPath();
  ctx.arc(sx, sy - 14 * z, 4 * z, 0, Math.PI * 2);
  ctx.fill();
}

function drawFarm(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number, type = "wheatFarm"): void {
  const field = type === "oliveFarm" ? "#5a7a30" : type === "vineFarm" ? "#5a3a58" : "#7a9a3c";
  const row = type === "oliveFarm" ? "#c4c070" : type === "vineFarm" ? "#8a3060" : "#c4b04a";
  drawBlock(ctx, sx, sy, z, 3, field, "#4a6a20", 6);
  ctx.strokeStyle = row;
  ctx.lineWidth = 1 * z;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(sx - 24 * z, sy + i * 5 * z);
    ctx.lineTo(sx + 24 * z, sy + i * 5 * z - 8 * z);
    ctx.stroke();
  }
}

function drawTemple(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number, type: string): void {
  const accent: Record<string, string> = {
    templeCeres: "#7a9a3c",
    templeNeptune: "#3a7ca5",
    templeMercury: "#c4a04a",
    templeMars: "#a03020",
    templeVenus: "#d080a0",
  };
  drawBlock(ctx, sx, sy, z, 2, "#efe6d4", "#c4b49a", 18);
  ctx.fillStyle = accent[type] ?? "#d4b46a";
  ctx.fillRect(sx - 6 * z, sy - 34 * z, 12 * z, 8 * z);
  ctx.fillStyle = "#f4eee0";
  for (const ox of [-12, -4, 4, 12]) {
    ctx.fillRect(sx + ox * z, sy - 26 * z, 3 * z, 16 * z);
  }
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  z: number,
  size: number,
  wall: string,
  roof: string,
  height: number,
): void {
  const hw = (TILE_W / 2) * z * (0.55 + size * 0.22);
  const hh = (TILE_H / 2) * z * (0.55 + size * 0.22);
  const rise = height * z;
  ctx.fillStyle = shade(wall, -20);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx + hw, sy - rise);
  ctx.lineTo(sx, sy - rise);
  ctx.fill();
  ctx.fillStyle = shade(wall, 15);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx - hw, sy);
  ctx.lineTo(sx - hw, sy - rise);
  ctx.lineTo(sx, sy - rise);
  ctx.fill();
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(sx, sy - rise - hh);
  ctx.lineTo(sx + hw, sy - rise);
  ctx.lineTo(sx, sy - rise + hh * 0.2);
  ctx.lineTo(sx - hw, sy - rise);
  ctx.closePath();
  ctx.fill();
}

function drawWalker(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number, kind: string): void {
  ctx.fillStyle = "#2a1b10";
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2 * z, 4 * z, 2 * z, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WALKER_COLOR[kind] ?? "#e8d4b0";
  ctx.fillRect(sx - 2.2 * z, sy - 9 * z, 4.4 * z, 8 * z);
  ctx.fillStyle = "#f2e2c4";
  ctx.beginPath();
  ctx.arc(sx, sy - 11 * z, 2.2 * z, 0, Math.PI * 2);
  ctx.fill();
  if (kind === "prefect") {
    ctx.fillStyle = "#c43c2c";
    ctx.fillRect(sx - 2 * z, sy - 15 * z, 4 * z, 2 * z);
  }
  if (kind === "cartPusher" || kind === "warehouseGetter") {
    ctx.fillStyle = "#8a6a3c";
    ctx.fillRect(sx + 4 * z, sy - 6 * z, 7 * z, 5 * z);
  }
  if (kind === "caravan") {
    ctx.fillStyle = "#c4a060";
    ctx.beginPath();
    ctx.ellipse(sx + 6 * z, sy - 2 * z, 7 * z, 4 * z, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}
