import { P } from '../art/palette';
import { PixelCanvas, seeded } from '../art/pixel-canvas';

// Code-drawn placeholder art at the GDD v3 sizes: 16 px tiles, a 24 px Puff in the world.
// Art is parked (CLAUDE.md), so everything here is drawn from palette24 until real sprites land.
export const T = 16;

export type Ground = 'void' | 'wood' | 'rug' | 'tile' | 'wall' | 'grass' | 'path' | 'cobble' | 'soil' | 'water' | 'flowers' | 'fence' | 'hedge' | 'mat';

const BLOCKED: Ground[] = ['void', 'wall', 'water', 'fence', 'hedge'];
export const isBlockedGround = (g: Ground) => BLOCKED.includes(g);

export interface Theme { wall: string; wallAccent: string; floor: string; floorShade: string; rug: string; rugShade: string }

/** Draw one ground tile at pixel (px, py). `below` is the ground under it, for wall faces. */
export function drawGround(pc: PixelCanvas, g: Ground, px: number, py: number, theme: Theme, below: Ground, seed: number) {
  const r = seeded(seed);
  switch (g) {
    case 'void': pc.rect(px, py, T, T, P.ink); break;
    case 'wood':
      pc.rect(px, py, T, T, theme.floor);
      pc.hline(px, py + 7, T, theme.floorShade); pc.hline(px, py + 15, T, theme.floorShade);
      pc.vline(px + ((seed * 5) % 12) + 2, py, 7, theme.floorShade); pc.vline(px + ((seed * 7) % 12) + 2, py + 8, 7, theme.floorShade);
      if (r() < 0.3) pc.hline(px + 3 + Math.floor(r() * 8), py + 3, 3, theme.floorShade);
      break;
    case 'rug':
      pc.rect(px, py, T, T, theme.rug);
      if ((px / T + py / T) % 2 === 0) { pc.set(px + 7, py + 7, theme.rugShade); pc.set(px + 8, py + 8, theme.rugShade); pc.set(px + 8, py + 7, theme.rugShade); pc.set(px + 7, py + 8, theme.rugShade); }
      break;
    case 'mat': pc.rect(px, py, T, T, theme.floor); pc.box(px + 1, py + 3, 14, 10, P.peach, P.peachShade); break;
    case 'tile':
      pc.rect(px, py, T, T, P.cream);
      pc.hline(px, py + 15, T, P.creamShade); pc.vline(px + 15, py, T, P.creamShade);
      if ((px / T + py / T) % 2) pc.rect(px + 1, py + 1, 14, 14, P.peachLight);
      pc.set(px + 2, py + 2, P.white);
      break;
    case 'wall':
      if (below !== 'wall' && below !== 'void') {
        // Wall face seen from the front: wallpaper, a rail and a skirting board.
        pc.rect(px, py, T, T, theme.wall);
        for (let x = px + 2; x < px + T; x += 6) pc.vline(x, py, 12, theme.wallAccent);
        pc.hline(px, py + 12, T, P.outline); pc.rect(px, py + 13, T, 3, P.cream);
      } else {
        pc.rect(px, py, T, T, P.brownShade);
        pc.rect(px + 1, py + 1, T - 2, T - 2, P.brown);
      }
      break;
    case 'grass':
      pc.rect(px, py, T, T, P.sage);
      for (let i = 0; i < 4; i += 1) { const x = px + Math.floor(r() * 14); const y = py + 2 + Math.floor(r() * 12); pc.set(x, y, P.sageShade); pc.set(x + 1, y - 1, P.sageShade); }
      if (r() < 0.2) pc.set(px + Math.floor(r() * 15), py + Math.floor(r() * 15), P.sageLight);
      break;
    case 'flowers':
      drawGround(pc, 'grass', px, py, theme, below, seed);
      for (let i = 0; i < 3; i += 1) { const x = px + 2 + Math.floor(r() * 11); const y = py + 2 + Math.floor(r() * 11); const c = [P.peach, P.butter, P.blueLight][i]; pc.rect(x, y, 2, 2, c); pc.set(x, y, P.white); }
      break;
    case 'path':
      pc.rect(px, py, T, T, P.butterShade);
      for (let i = 0; i < 3; i += 1) pc.set(px + Math.floor(r() * 15), py + Math.floor(r() * 15), P.brownLight);
      break;
    case 'cobble':
      pc.rect(px, py, T, T, P.greyLight);
      for (let j = 0; j < 2; j += 1) for (let i = 0; i < 2; i += 1) pc.box(px + i * 8 + (j % 2) * 2 - 1, py + j * 8, 8, 8, P.greyLight, P.grey, 1);
      break;
    case 'soil':
      pc.rect(px, py, T, T, P.brown);
      for (let y = py + 3; y < py + T; y += 5) pc.hline(px + 1, y, 14, P.brownShade);
      break;
    case 'water':
      pc.rect(px, py, T, T, P.blue);
      pc.hline(px + 2 + (seed % 5), py + 5, 4, P.blueLight); pc.hline(px + 7 + (seed % 3), py + 11, 4, P.blueLight);
      break;
    case 'fence':
      drawGround(pc, 'grass', px, py, theme, below, seed);
      pc.rect(px, py + 5, T, 2, P.brownLight); pc.rect(px, py + 10, T, 2, P.brownLight);
      pc.box(px + 2, py + 2, 3, 13, P.brownLight, P.outline); pc.box(px + 11, py + 2, 3, 13, P.brownLight, P.outline);
      break;
    case 'hedge':
      pc.rect(px, py, T, T, P.sageShade);
      pc.ellipse(px + 4, py + 5, 4, 4, P.sage); pc.ellipse(px + 11, py + 6, 4, 4, P.sage); pc.ellipse(px + 7, py + 11, 5, 4, P.sage);
      pc.set(px + 4, py + 3, P.sageLight); pc.set(px + 11, py + 4, P.sageLight);
      break;
  }
}

// ---- props: drawn into the baked area canvas at their tile footprint -------------------------

export interface PropDef { type: string; x: number; y: number; w?: number; h?: number; colour?: string; label?: string; action?: string; accepts?: string[]; walkable?: boolean; doorX?: number }

const shadow = (pc: PixelCanvas, x: number, y: number, w: number) => {
  for (let i = 1; i < w - 1; i += 1) { const k = ((y) * pc.width + x + i) * 4; if (pc.inside(x + i, y)) { pc.data[k] = Math.round(pc.data[k] * 0.85); pc.data[k + 1] = Math.round(pc.data[k + 1] * 0.85); pc.data[k + 2] = Math.round(pc.data[k + 2] * 0.85); } }
};

export function drawProp(pc: PixelCanvas, p: PropDef) {
  const x = p.x * T; const y = p.y * T; const w = (p.w ?? 1) * T; const h = (p.h ?? 1) * T;
  const c = p.colour;
  switch (p.type) {
    case 'bed':
      shadow(pc, x, y + h, w);
      pc.box(x + 1, y, w - 2, 6, P.brown, P.outline, 1);
      pc.box(x + 1, y + 4, w - 2, h - 5, P.cream, P.outline, 1);
      pc.box(x + 4, y + 6, w - 8, 7, P.white, P.outlineLight, 2);
      pc.box(x + 1, y + 14, w - 2, h - 15, c ?? P.blue, P.outline, 1);
      for (let i = y + 18; i < y + h - 3; i += 5) pc.hline(x + 3, i, w - 6, P.blueShade);
      break;
    case 'basket':
      pc.box(x + 2, y + 4, 12, 11, P.butterShade, P.outline, 2);
      pc.box(x + 4, y + 5, 8, 3, P.brownShade, P.outline);
      for (let j = y + 9; j < y + 14; j += 2) pc.hline(x + 3, j, 10, P.butter);
      break;
    case 'shelf':
      pc.box(x, y, w, h, P.brown, P.outline);
      for (let sy = y + 3; sy < y + h - 2; sy += 7) {
        pc.rect(x + 1, sy, w - 2, 5, P.brownShade);
        for (let bx = x + 2; bx < x + w - 3; bx += 3) pc.box(bx, sy + 1, 3, 4, [P.peach, P.sage, P.blue, P.butter][(bx + sy) % 4], P.outline);
      }
      break;
    case 'table':
      shadow(pc, x, y + h - 1, w);
      pc.box(x + 1, y + 2, w - 2, h - 5, P.brownLight, P.outline, 1);
      pc.hline(x + 3, y + 4, w - 6, P.creamShade);
      pc.rect(x + 2, y + h - 3, 2, 3, P.brownShade); pc.rect(x + w - 4, y + h - 3, 2, 3, P.brownShade);
      break;
    case 'chair':
      pc.box(x + 3, y + 2, 10, 5, P.brownLight, P.outline, 1);
      pc.box(x + 3, y + 6, 10, 7, c ?? P.peach, P.outline, 1);
      break;
    case 'armchair':
      pc.box(x + 1, y + 1, w - 2, 6, P.sageShade, P.outline, 2);
      pc.box(x + 1, y + 5, w - 2, h - 6, c ?? P.sage, P.outline, 2);
      pc.box(x + 4, y + 7, w - 8, h - 10, P.sageLight, P.outlineLight, 1);
      break;
    case 'counter':
      pc.box(x, y, w, 7, P.creamShade, P.outline);
      pc.hline(x + 1, y + 1, w - 2, P.white);
      pc.box(x, y + 6, w, h - 6, c ?? P.sage, P.outline);
      for (let dx = x + 3; dx < x + w - 6; dx += 16) pc.rect(dx + 5, y + 10, 4, 1, P.brownShade);
      break;
    case 'sink':
      pc.box(x, y, w, 7, P.creamShade, P.outline);
      pc.box(x + 3, y + 1, w - 6, 5, P.blueLight, P.outlineLight, 1);
      pc.box(x + w / 2 - 1, y - 3, 3, 4, P.grey, P.outline);
      pc.box(x, y + 6, w, h - 6, c ?? P.sage, P.outline);
      break;
    case 'oven':
      pc.box(x, y, w, h, P.greyLight, P.outline, 1);
      pc.ellipseBox(x + 4, y + 3, 2, 1, P.grey, P.ink); pc.ellipseBox(x + w - 5, y + 3, 2, 1, P.grey, P.ink);
      pc.box(x + 2, y + 6, w - 4, h - 8, P.ink, P.outline, 1);
      pc.hline(x + 4, y + 8, w - 8, P.greyShade);
      break;
    case 'plant':
      pc.box(x + 4, y + 9, 8, 6, c ?? P.peach, P.outline, 1);
      [[8, 3], [5, 5], [11, 5], [8, 7]].forEach(([lx, ly]) => pc.ellipseBox(x + lx, y + ly, 2, 3, P.sage, P.sageShade));
      break;
    case 'lamp':
      pc.vline(x + 8, y + 6, 8, P.outline); pc.ellipse(x + 8, y + 14, 3, 1, P.brownShade);
      pc.ellipseBox(x + 8, y + 4, 5, 3, P.butter, P.outline);
      break;
    case 'flour':
      pc.box(x + 2, y + 3, 6, 12, P.cream, P.outline, 2); pc.box(x + 8, y + 5, 6, 10, P.cream, P.outline, 2);
      pc.hline(x + 3, y + 8, 4, P.greyLight); pc.hline(x + 9, y + 10, 4, P.greyLight);
      break;
    case 'display':
      pc.box(x, y, w, h, P.brown, P.outline);
      pc.box(x + 2, y + 2, w - 4, h - 6, P.blueLight, P.outlineLight, 1);
      for (let bx = x + 4; bx < x + w - 6; bx += 7) { pc.ellipseBox(bx + 2, y + 6, 2, 2, P.butterShade, P.outline); pc.ellipseBox(bx + 3, y + 10, 2, 1, P.peachShade, P.outline); }
      break;
    case 'crate':
      pc.box(x + 1, y + 3, 14, 12, P.brownLight, P.outline);
      pc.line(x + 2, y + 4, x + 13, y + 13, P.brown); pc.line(x + 13, y + 4, x + 2, y + 13, P.brown);
      break;
    // ---- outdoor ----
    case 'tree':
      pc.ellipse(x + w / 2, y + h - 2, w / 2 - 2, 2, P.sageShade);
      pc.box(x + w / 2 - 2, y + h - 10, 5, 9, P.brown, P.outline);
      pc.ellipseBox(x + w / 2, y + h / 2 - 3, w / 2 - 1, h / 2 - 4, P.sageShade, P.outline);
      pc.ellipse(x + w / 2 - 3, y + h / 2 - 6, w / 2 - 6, h / 2 - 8, P.sage);
      pc.set(x + w / 2 - 5, y + 8, P.sageLight); pc.set(x + w / 2 - 4, y + 7, P.sageLight);
      break;
    case 'bush':
      pc.ellipseBox(x + 8, y + 9, 7, 6, P.sageShade, P.outline); pc.ellipse(x + 6, y + 7, 4, 3, P.sage); pc.set(x + 5, y + 5, P.sageLight); pc.set(x + 11, y + 8, P.peach);
      break;
    case 'mailbox':
      pc.vline(x + 8, y + 8, 7, P.brownShade);
      pc.box(x + 3, y + 2, 10, 7, P.peach, P.outline, 1); pc.rect(x + 12, y + 1, 1, 4, P.peachShade);
      break;
    case 'sign':
      pc.vline(x + 8, y + 8, 7, P.brownShade);
      pc.box(x + 1, y + 2, 14, 8, P.brownLight, P.outline);
      pc.hline(x + 3, y + 5, 10, P.brownShade);
      break;
    case 'board':
      pc.vline(x + 3, y + 10, 5, P.brownShade); pc.vline(x + w - 4, y + 10, 5, P.brownShade);
      pc.box(x, y, w, 12, P.brownLight, P.outline);
      pc.box(x + 3, y + 2, 7, 7, P.cream, P.outlineLight); pc.box(x + 13, y + 3, 6, 6, P.butterLight, P.outlineLight); pc.box(x + 22, y + 2, 7, 6, P.peachLight, P.outlineLight);
      break;
    case 'bench':
      pc.box(x, y + 3, w, 4, P.brownLight, P.outline); pc.box(x, y + 7, w, 4, P.brownLight, P.outline);
      pc.rect(x + 2, y + 11, 2, 4, P.brownShade); pc.rect(x + w - 4, y + 11, 2, 4, P.brownShade);
      break;
    case 'lamppost':
      pc.vline(x + 8, y + 4, 11, P.ink); pc.box(x + 5, y, 7, 6, P.butterLight, P.ink, 1);
      break;
    case 'fountain': {
      pc.ellipseBox(x + w / 2, y + h / 2 + 2, w / 2 - 1, h / 2 - 3, P.greyLight, P.outline);
      pc.ellipse(x + w / 2, y + h / 2 + 2, w / 2 - 5, h / 2 - 7, c ?? P.greyShade);
      pc.box(x + w / 2 - 4, y + 8, 9, 16, P.grey, P.outline, 1);
      pc.ellipseBox(x + w / 2, y + 9, 7, 3, P.greyLight, P.outline);
      break;
    }
    case 'burrow': {
      // A grassy mound with a round door: Puff's burrow from outside.
      pc.ellipseBox(x + w / 2, y + h - 10, w / 2, h - 12, P.sageShade, P.outline);
      pc.ellipse(x + w / 2 - 6, y + h - 16, w / 2 - 10, h - 22, P.sage);
      pc.ellipseBox(x + w / 2, y + h - 6, 9, 9, P.brownShade, P.outline);
      pc.ellipse(x + w / 2, y + h - 6, 6, 6, P.brown);
      pc.set(x + w / 2 + 3, y + h - 6, P.butter);
      pc.box(x + w / 2 + 12, y + h - 22, 6, 6, P.blueLight, P.outline, 1);
      break;
    }
    case 'shopfront': {
      // A building facade: roof, wall, window, sign board. The door is a separate door tile.
      const roof = c ?? P.peach;
      pc.box(x, y, w, 14, roof, P.outline, 2);
      for (let i = x + 3; i < x + w - 3; i += 6) pc.vline(i, y + 2, 10, P.peachShade);
      pc.box(x + 2, y + 13, w - 4, h - 13, P.cream, P.outline);
      pc.box(x + 6, y + 18, 18, 12, P.blueLight, P.outline, 1); pc.vline(x + 15, y + 18, 12, P.outline);
      pc.box(x + w - 24, y + 18, 18, 12, P.blueLight, P.outline, 1); pc.vline(x + w - 15, y + 18, 12, P.outline);
      pc.box(x + w / 2 - 14, y + 4, 28, 7, P.brownLight, P.outline);
      if (p.doorX !== undefined) {
        // The door sits on the facade's bottom edge, above the door tile.
        const dx = p.doorX * T + 1;
        pc.box(dx, y + h - 15, 14, 15, P.brown, P.outline, 2);
        pc.vline(dx + 7, y + h - 13, 13, P.brownShade);
        pc.set(dx + 10, y + h - 7, P.butter);
      }
      break;
    }
  }
}

// ---- mess sprites: each type has its own shape, never colour alone (GDD v3 A11.3) ------------

export function drawMess(type: string, variant: number, item?: string) {
  const pc = new PixelCanvas(T, T);
  const r = seeded(variant * 97 + type.length);
  switch (type) {
    case 'dust':
      for (let i = 0; i < 4; i += 1) { const cx = 3 + Math.floor(r() * 10); const cy = 4 + Math.floor(r() * 8); pc.ellipse(cx, cy, 2, 2, P.greyLight); pc.set(cx - 1, cy - 1, P.white); }
      pc.outlineShapes(P.grey);
      break;
    case 'stain':
      pc.ellipse(8, 9, 6, 4, P.brownLight);
      pc.ellipse(6, 8, 3, 2, P.brown);
      pc.set(12, 5, P.brownLight); pc.set(3, 13, P.brownLight);
      break;
    case 'grime':
      for (let i = 1; i < 15; i += 3) { pc.line(i, 1, Math.min(15, i + 6), 7, P.greyShade); pc.line(i, 8, Math.min(15, i + 6), 14, P.greyShade); }
      break;
    case 'weeds':
      for (let i = 0; i < 3; i += 1) {
        const bx = 3 + i * 4 + Math.floor(r() * 2);
        pc.line(bx, 14, bx - 2, 6, P.sageShade); pc.line(bx, 14, bx + 1, 5, P.sageShade); pc.line(bx, 14, bx + 3, 8, P.sageShade);
        pc.set(bx + 1, 5, P.butterShade);
      }
      break;
    case 'cobweb':
      pc.line(0, 0, 14, 14, P.greyLight); pc.line(0, 0, 15, 6, P.greyLight); pc.line(0, 0, 6, 15, P.greyLight);
      for (let k = 4; k < 15; k += 5) { pc.line(k, 0, 0, k, P.greyLight); }
      break;
    case 'clutter':
      drawItemIcon(pc, item ?? 'sock', 1, 1);
      break;
  }
  return pc;
}

/** 14×14 item icons used for clutter on the floor and in the bag. */
export function drawItemIcon(pc: PixelCanvas, item: string, ox = 0, oy = 0) {
  const b = (x: number, y: number, w: number, h: number, f: string, r = 0) => pc.box(ox + x, oy + y, w, h, f, P.outline, r);
  switch (item) {
    case 'sock': b(4, 1, 5, 8, P.blue); b(4, 7, 9, 5, P.blue, 1); pc.hline(ox + 5, oy + 3, 3, P.white); break;
    case 'book': b(2, 2, 10, 11, P.peach); pc.vline(ox + 4, oy + 3, 9, P.peachShade); pc.hline(ox + 6, oy + 5, 4, P.white); break;
    case 'cup': b(3, 4, 8, 8, P.sage, 1); pc.rect(ox + 4, oy + 5, 6, 1, P.brownShade); b(10, 6, 3, 4, P.sage); break;
    case 'pin': b(1, 5, 12, 4, P.brownLight, 1); b(0, 6, 2, 2, P.brown); b(12, 6, 2, 2, P.brown); break;
    case 'tray': b(1, 4, 12, 7, P.greyLight, 1); pc.ellipseBox(ox + 5, oy + 7, 2, 1, P.butterShade, P.outline); pc.ellipseBox(ox + 9, oy + 7, 2, 1, P.peachShade, P.outline); break;
    case 'radish_seeds': b(3, 1, 8, 12, P.butterLight, 1); pc.ellipseBox(ox + 7, oy + 6, 2, 2, P.peach, P.outline); pc.vline(ox + 7, oy + 2, 2, P.sage); break;
    case 'radish': pc.ellipseBox(ox + 7, oy + 9, 4, 4, P.peach, P.outline); pc.set(ox + 6, oy + 8, P.white); pc.line(ox + 7, oy + 5, ox + 4, oy + 1, P.sageShade); pc.line(ox + 7, oy + 5, ox + 10, oy + 1, P.sageShade); break;
    case 'tart': pc.ellipseBox(ox + 7, oy + 8, 6, 4, P.butterShade, P.outline); pc.ellipse(ox + 7, oy + 7, 4, 2, P.peach); pc.set(ox + 5, oy + 6, P.white); break;
    default: b(3, 3, 8, 8, P.butter, 1);
  }
}

export function drawCrop(stage: number, watered: boolean) {
  const pc = new PixelCanvas(T, T);
  if (watered) for (let y = 3; y < T; y += 5) pc.hline(1, y, 14, P.brownShade);
  if (stage === 0) { pc.set(7, 9, P.butterShade); pc.set(9, 8, P.butterShade); }
  else if (stage === 1) { pc.line(8, 12, 8, 8, P.sageShade); pc.ellipse(6, 7, 2, 1, P.sage); pc.ellipse(10, 7, 2, 1, P.sage); }
  else { pc.ellipseBox(8, 11, 3, 3, P.peach, P.outline); pc.line(8, 8, 5, 3, P.sageShade); pc.line(8, 8, 11, 3, P.sageShade); pc.ellipse(5, 3, 2, 1, P.sage); pc.ellipse(11, 3, 2, 1, P.sage); }
  return pc;
}

// ---- Puff at 24 px (simplified face per A11.3) ------------------------------------------------

export const PUFF_PX = 24;
export type Dir = 'down' | 'up' | 'right' | 'left';

export function drawPuff24(dir: Dir, frame: number, pose: 'walk' | 'idle' | 'swing' | 'sleep' | 'hop' = 'idle') {
  const pc = new PixelCanvas(PUFF_PX, PUFF_PX);
  const side = dir === 'right' || dir === 'left';
  const bob = pose === 'walk' ? [0, -1, 0, 0, -1, 0][frame % 6] : pose === 'idle' ? [0, 0, 1, 1][frame % 4] : pose === 'hop' ? [0, -2, -4, -4, -2, 0][frame % 6] : 0;
  const cy = 15 + bob;
  const ears = side ? [9, 12] : [8, 15];
  ears.forEach((ex, i) => { pc.ellipse(ex + (pose === 'swing' && i === 1 ? 1 : 0), cy - 8, 1, 4, P.greyLight); if (dir !== 'up') pc.set(ex, cy - 8, P.peachLight); });
  pc.ellipse(12, cy, 8, 6, P.greyLight);
  for (let a = 0; a < 10; a += 1) { const t = (a / 10) * Math.PI * 2; pc.set(12 + Math.round(Math.cos(t) * 8), cy + Math.round(Math.sin(t) * 6), P.greyLight); }
  // feet
  const step = pose === 'walk' ? (frame % 6 < 3 ? 0 : 1) : -1;
  [[8, 0], [16, 1]].forEach(([fx, k]) => pc.ellipse(fx, 21 - (step === k ? 1 : 0) + Math.min(0, bob), 2, 1, P.grey));
  // shade
  for (let y = cy + 1; y <= cy + 6; y += 1) for (let x = 13; x <= 20; x += 1) if (pc.alpha(x, y) && (x - 12) + (y - cy) > 7) pc.set(x, y, P.grey);
  pc.set(7, cy - 3, P.white); pc.set(8, cy - 4, P.white);
  pc.outlineShapes(P.outline);
  if (pose === 'sleep') { pc.hline(8, cy, 2, P.ink); pc.hline(14, cy, 2, P.ink); }
  else if (dir === 'down') { pc.rect(9, cy - 1, 1, 2, P.ink); pc.rect(15, cy - 1, 1, 2, P.ink); pc.set(7, cy + 2, P.peach); pc.set(17, cy + 2, P.peach); pc.set(12, cy + 2, P.ink); }
  else if (side) { pc.rect(16, cy - 1, 1, 2, P.ink); pc.set(18, cy + 2, P.peach); }
  else { pc.ellipse(12, cy + 5, 1, 1, P.white); }
  if (dir === 'left') {
    const flipped = new PixelCanvas(PUFF_PX, PUFF_PX);
    flipped.draw(pc, 0, 0, true);
    return flipped;
  }
  return pc;
}

/** The tool Puff swings, 10 px, drawn in front of Puff in the facing direction. */
export function drawToolMini(tool: string) {
  const pc = new PixelCanvas(10, 10);
  switch (tool) {
    case 'duster': pc.vline(7, 4, 6, P.brown); [P.peach, P.butter, P.sage].forEach((c, i) => pc.ellipse(2 + i * 2, 3, 2, 2, c)); break;
    case 'sponge': pc.box(1, 3, 8, 6, P.butter, P.outline, 1); pc.rect(2, 3, 6, 2, P.sageShade); break;
    case 'rake': pc.vline(5, 3, 7, P.brown); pc.hline(1, 2, 9, P.greyShade); for (let i = 1; i < 10; i += 2) pc.set(i, 3, P.greyShade); break;
    case 'can': pc.box(1, 3, 6, 6, P.blue, P.outline, 1); pc.line(7, 4, 9, 2, P.blueShade); break;
    case 'hands': break;
  }
  return pc;
}
