export const TILE_W = 72;
export const TILE_H = 36;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function worldToScreen(x: number, y: number, cam: Camera, w: number, h: number): { sx: number; sy: number } {
  const isoX = (x - y) * (TILE_W / 2);
  const isoY = (x + y) * (TILE_H / 2);
  return {
    sx: w / 2 + (isoX - cam.x) * cam.zoom,
    sy: Math.min(96, h * 0.12) + (isoY - cam.y) * cam.zoom,
  };
}

export function screenToWorld(sx: number, sy: number, cam: Camera, w: number, h: number): { x: number; y: number } {
  const ix = (sx - w / 2) / cam.zoom + cam.x;
  const iy = (sy - Math.min(96, h * 0.12)) / cam.zoom + cam.y;
  const x = ix / (TILE_W / 2);
  const y = iy / (TILE_H / 2);
  return {
    x: (y + x) / 2,
    y: (y - x) / 2,
  };
}

export function diamond(ctx: CanvasRenderingContext2D, sx: number, sy: number, zoom: number, fill: string, stroke?: string): void {
  const hw = (TILE_W / 2) * zoom;
  const hh = (TILE_H / 2) * zoom;
  ctx.beginPath();
  ctx.moveTo(sx, sy - hh);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1, zoom * 0.7);
    ctx.stroke();
  }
}
