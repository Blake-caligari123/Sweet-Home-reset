import { P } from '../../art/palette';
import { PixelCanvas, seeded } from '../../art/pixel-canvas';

// Code-drawn placeholder art at the GDD v3 sizes: 16 px tiles, a 24 px Puff in the world.
// Art is parked (CLAUDE.md), so everything here is drawn from palette24 until real sprites land.
export const T = 16;

export type Ground = 'void' | 'wood' | 'rug' | 'tile' | 'wall' | 'grass' | 'path' | 'cobble' | 'soil' | 'water' | 'flowers' | 'fence' | 'hedge' | 'mat';

const BLOCKED: Ground[] = ['void', 'wall', 'water', 'fence', 'hedge'];
export const isBlockedGround = (g: Ground) => BLOCKED.includes(g);

export interface Theme { wall: string; wallAccent: string; floor: string; floorShade: string; rug: string; rugShade: string }

/** The ground around a tile, by offset, so edges can blend into their neighbours. */
export type Around = (dx: number, dy: number) => Ground;

// Deterministic world-space noise so textures flow across tile seams instead of repeating.
export function hash(x: number, y: number, s = 0) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x: number, y: number, size: number, s = 0) {
  const gx = x / size; const gy = y / size;
  const ix = Math.floor(gx); const iy = Math.floor(gy);
  const fx = gx - ix; const fy = gy - iy;
  const sx = fx * fx * (3 - 2 * fx); const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, s); const b = hash(ix + 1, iy, s); const c = hash(ix, iy + 1, s); const d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// 4×4 ordered dither: soft colour patches that stay crisp pixel art.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

/** Fill a tile with a base colour, dithering a darker and lighter tone in by world noise. */
function mottle(pc: PixelCanvas, px: number, py: number, base: string, dark: string, light: string, size: number, s: number, amount = 1) {
  for (let y = py; y < py + T; y += 1) {
    for (let x = px; x < px + T; x += 1) {
      const n = noise(x, y, size, s) * 0.75 + noise(x, y, size / 4, s + 7) * 0.25;
      const d = dither(x, y);
      pc.set(x, y, n < 0.4 && d < (0.4 - n) * 3 * amount ? dark : n > 0.6 && d < (n - 0.6) * 2.4 * amount ? light : base);
    }
  }
}

const GRASSY: Ground[] = ['grass', 'flowers', 'fence'];
const isWallish = (g: Ground) => g === 'wall' || g === 'void';

function tuft(pc: PixelCanvas, x: number, y: number) {
  pc.set(x, y, P.sageShade); pc.set(x, y - 1, P.sageShade);
  pc.set(x + 2, y, P.sageShade); pc.set(x + 2, y - 1, P.sageShade); pc.set(x + 2, y - 2, P.sageShade);
  pc.set(x + 1, y, P.sageShade); pc.set(x + 3, y - 2, P.sageLight); pc.set(x - 1, y - 2, P.sageLight);
}

function drawGrass(pc: PixelCanvas, px: number, py: number, r: () => number) {
  mottle(pc, px, py, P.sage, P.sageShade, P.sageLight, 64, 1, 0.38);
  const tufts = 1 + Math.floor(r() * 3);
  for (let i = 0; i < tufts; i += 1) tuft(pc, px + 2 + Math.floor(r() * 10), py + 4 + Math.floor(r() * 10));
  if (r() < 0.12) { const x = px + 3 + Math.floor(r() * 10); const y = py + 3 + Math.floor(r() * 10); pc.set(x, y, P.white); pc.set(x + 1, y + 1, P.butter); }
  if (r() < 0.06) { const x = px + 3 + Math.floor(r() * 9); const y = py + 3 + Math.floor(r() * 9); pc.rect(x, y, 2, 1, P.greyLight); pc.set(x, y + 1, P.greyShade); pc.set(x + 1, y + 1, P.greyShade); }
}

function flower(pc: PixelCanvas, x: number, y: number, petal: string) {
  pc.set(x, y + 2, P.sageShade); pc.set(x, y + 3, P.sageShade); pc.set(x + 1, y + 3, P.sageShade);
  pc.set(x - 1, y, petal); pc.set(x + 1, y, petal); pc.set(x, y - 1, petal); pc.set(x, y + 1, petal);
  pc.set(x, y, P.butterShade); pc.mix(x - 1, y, P.white, 0.4);
}

/** Grass blades spilling over a path or soil edge, with a soft shadow under the overhang. */
function grassFringe(pc: PixelCanvas, px: number, py: number, around: Around) {
  const sides: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of sides) {
    if (!GRASSY.includes(around(dx, dy))) continue;
    for (let i = 0; i < T; i += 1) {
      const X = dx === 0 ? px + i : dx < 0 ? px : px + T - 1;
      const Y = dy === 0 ? py + i : dy < 0 ? py : py + T - 1;
      const depth = 1 + Math.floor(hash(X, Y, 9) * 2.4);
      for (let k = 0; k <= depth; k += 1) {
        const x = X - dx * k; const y = Y - dy * k;
        pc.set(x, y, k === depth ? P.sageShade : P.sage);
      }
      pc.mul(X - dx * (depth + 1), Y - dy * (depth + 1), 0.9);
    }
  }
}

/** Draw one ground tile at pixel (px, py), blending edges with the ground around it. */
export function drawGround(pc: PixelCanvas, g: Ground, px: number, py: number, theme: Theme, around: Around, seed: number) {
  const r = seeded(seed);
  switch (g) {
    case 'void': pc.rect(px, py, T, T, P.ink); break;
    case 'wood':
      // Staggered planks four pixels deep, each a slightly different tone, with a lit top edge.
      for (let y = py; y < py + T; y += 1) {
        const row = Math.floor(y / 4); const ly = y & 3;
        const off = Math.floor(hash(row, 3, 2) * 32);
        for (let x = px; x < px + T; x += 1) {
          const lx = (x + off) % 32; const plank = Math.floor((x + off) / 32);
          pc.set(x, y, ly === 3 || lx === 0 ? theme.floorShade : theme.floor);
          if (ly !== 3 && lx !== 0) {
            pc.mul(x, y, 0.95 + hash(plank, row, 4) * 0.09);
            if (ly === 0) pc.mix(x, y, P.white, 0.14);
            else if (hash(x, y, 5) < 0.05) pc.mix(x, y, theme.floorShade, 0.6);
          }
        }
      }
      break;
    case 'rug': {
      pc.rect(px, py, T, T, theme.rug);
      for (let y = py; y < py + T; y += 1) for (let x = px; x < px + T; x += 1) {
        const a = (x + y) & 7; const b = (x - y) & 7;
        if (a === 0 || b === 0) pc.set(x, y, theme.rugShade);
        if (a === 4 && b === 4) pc.set(x, y, P.cream);
      }
      // A cream border band where the rug ends, with a woven edge.
      const edges: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of edges) {
        if (around(dx, dy) === 'rug') continue;
        for (let i = 0; i < T; i += 1) for (let k = 0; k < 3; k += 1) {
          const x = dx === 0 ? px + i : dx < 0 ? px + k : px + T - 1 - k;
          const y = dy === 0 ? py + i : dy < 0 ? py + k : py + T - 1 - k;
          pc.set(x, y, k === 0 ? theme.rugShade : k === 1 ? ((dx === 0 ? x : y) % 2 ? P.cream : P.creamShade) : theme.rug);
        }
      }
      break;
    }
    case 'mat':
      drawGround(pc, 'wood', px, py, theme, around, seed);
      pc.box(px + 1, py + 2, 14, 12, P.peach, P.peachShade, 1);
      for (let x = px + 3; x < px + 13; x += 3) pc.vline(x, py + 4, 8, P.peachLight);
      break;
    case 'tile':
      for (let y = py; y < py + T; y += 1) for (let x = px; x < px + T; x += 1) {
        const lx = x & 7; const ly = y & 7; const odd = ((x >> 3) + (y >> 3)) & 1;
        pc.set(x, y, lx === 7 || ly === 7 ? P.creamShade : odd ? P.peachLight : P.cream);
        if ((lx === 0 || ly === 0) && lx !== 7 && ly !== 7) pc.mix(x, y, P.white, 0.6);
      }
      pc.set(px + 2, py + 2, P.white); pc.set(px + 10, py + 10, P.white);
      break;
    case 'wall':
      if (!isWallish(around(0, 1))) drawWallFace(pc, px, py, theme, around, seed);
      else {
        // Wall tops read as one continuous slab: outline only where the wall ends.
        for (let y = py; y < py + T; y += 1) for (let x = px; x < px + T; x += 1) pc.set(x, y, dither(x, y) < 0.12 && noise(x, y, 20, 3) < 0.45 ? P.brownShade : P.brown);
        if (around(0, -1) !== 'wall') { pc.hline(px, py, T, P.outline); pc.hline(px, py + 1, T, P.brownLight); }
        if (around(-1, 0) !== 'wall') { pc.vline(px, py, T, P.outline); pc.vline(px + 1, py + 1, T - 1, P.brownLight); }
        if (around(1, 0) !== 'wall') pc.vline(px + T - 1, py, T, P.outline);
        if (around(0, 1) !== 'wall') pc.hline(px, py + T - 1, T, P.outline);
      }
      break;
    case 'grass': drawGrass(pc, px, py, r); break;
    case 'flowers': {
      drawGrass(pc, px, py, r);
      const colours = [P.peach, P.butterLight, P.blueLight, P.white, P.peachShade];
      const n = 3 + Math.floor(r() * 2);
      for (let i = 0; i < n; i += 1) flower(pc, px + 2 + Math.floor(r() * 11), py + 2 + Math.floor(r() * 9), colours[Math.floor(r() * colours.length)]);
      break;
    }
    case 'path':
      mottle(pc, px, py, P.butter, P.butterShade, P.butterLight, 24, 4, 0.5);
      for (let i = 0; i < 3; i += 1) {
        if (r() < 0.5) continue;
        const x = px + 2 + Math.floor(r() * 11); const y = py + 2 + Math.floor(r() * 11);
        pc.rect(x, y, 2, 1, P.brownLight); pc.set(x, y - 1, P.butterLight); pc.set(x + 1, y + 1, P.butterShade);
      }
      grassFringe(pc, px, py, around);
      break;
    case 'cobble':
      // Rounded stones in staggered courses; each stone has a lit top-left and a shaded bottom-right.
      for (let y = py; y < py + T; y += 1) {
        const row = Math.floor(y / 8); const ly = y % 8;
        const off = (row % 2) * 5 + Math.floor(hash(row, 0, 6) * 3);
        for (let x = px; x < px + T; x += 1) {
          const col = Math.floor((x + off) / 10); const lx = (x + off) % 10;
          const corner = (lx === 1 || lx === 9) && (ly === 1 || ly === 7);
          if (lx === 0 || ly === 0 || corner) { pc.set(x, y, P.grey); continue; }
          const h = hash(col, row, 7);
          pc.set(x, y, h < 0.7 ? P.greyLight : P.creamShade);
          if (h > 0.92) pc.mix(x, y, P.blueLight, 0.5);
          if (lx === 1 || ly === 1) pc.mix(x, y, P.white, 0.4);
          else if (lx === 9 || ly === 7) pc.mul(x, y, 0.92);
        }
      }
      grassFringe(pc, px, py, around);
      break;
    case 'soil':
      for (let y = py; y < py + T; y += 1) for (let x = px; x < px + T; x += 1) {
        const ly = y & 3;
        pc.set(x, y, ly === 3 ? P.brownShade : ly === 0 && hash(x, y, 8) < 0.5 ? P.brownLight : P.brown);
      }
      for (let i = 0; i < 3; i += 1) { const x = px + 1 + Math.floor(r() * 13); const y = py + 1 + Math.floor(r() * 3) * 4; pc.set(x, y, P.brownLight); pc.set(x + 1, y + 1, P.brownShade); }
      grassFringe(pc, px, py, around);
      break;
    case 'water':
      for (let y = py; y < py + T; y += 1) for (let x = px; x < px + T; x += 1) {
        const n = noise(x, y * 2, 10, 11);
        pc.set(x, y, n > 0.68 && dither(x, y) < 0.5 ? P.blueLight : n < 0.3 && dither(x, y) < 0.4 ? P.blueShade : P.blue);
      }
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0]] as [number, number][]) {
        if (around(dx, dy) === 'water') continue;
        for (let i = 0; i < T; i += 1) {
          const x = dx === 0 ? px + i : dx < 0 ? px : px + T - 1;
          const y = dy === 0 ? py + i : py;
          pc.set(x, y, P.blueShade); pc.set(x - dx, y - dy, P.blueShade);
          if (hash(x, y, 12) < 0.3) pc.set(x - dx * 2, y - dy * 2, P.white);
        }
      }
      break;
    case 'fence': {
      drawGrass(pc, px, py, r);
      const h = around(-1, 0) === 'fence' || around(1, 0) === 'fence';
      const left = around(-1, 0) === 'fence'; const right = around(1, 0) === 'fence';
      const up = around(0, -1) === 'fence'; const down = around(0, 1) === 'fence';
      // Rails first, then the post on top.
      for (const ry of [py + 5, py + 9]) {
        if (left) { pc.box(px - 1, ry, 9, 3, P.brownLight, P.outline); pc.hline(px, ry + 3, 8, P.sageShade); }
        if (right) { pc.box(px + 7, ry, 10, 3, P.brownLight, P.outline); pc.hline(px + 8, ry + 3, 8, P.sageShade); }
      }
      if (up) pc.box(px + 6, py - 1, 4, 9, P.brownLight, P.outline);
      if (down) pc.box(px + 6, py + 7, 4, 10, P.brownLight, P.outline);
      for (const ry of [py + 5, py + 9]) { if (left) pc.hline(px, ry + 1, 7, P.butterLight); if (right) pc.hline(px + 8, ry + 1, 8, P.butterLight); }
      pc.shadowEllipse(px + 8, py + 14, 4, 1, 0.8);
      pc.box(px + 5, py + 2, 6, 13, P.brownLight, P.outline, 1);
      pc.vline(px + 6, py + 3, 10, P.butterLight); pc.vline(px + 9, py + 3, 11, P.brown);
      pc.hline(px + 6, py + 3, 3, P.cream);
      if (!h && !up && !down) pc.vline(px + 7, py + 4, 9, P.brown);
      break;
    }
    case 'hedge': {
      const topOpen = around(0, -1) !== 'hedge' && around(0, -1) !== 'void';
      const frontOpen = around(0, 1) !== 'hedge' && around(0, 1) !== 'void';
      if (topOpen) drawGrass(pc, px, py, r);
      const top = topOpen ? py + 3 : py;
      for (let y = top; y < py + T; y += 1) for (let x = px; x < px + T; x += 1) pc.set(x, y, P.sageShade);
      // Leafy clumps: dark hollow, mid leaves, a lit top-left.
      for (let i = 0; i < 6; i += 1) {
        const cx = px + 2 + Math.floor(hash(px + i, py, 13) * 12); const cy = top + 2 + Math.floor(hash(px, py + i, 14) * (py + T - top - 5));
        pc.ellipse(cx, cy, 3, 2, P.sage);
        pc.set(cx - 1, cy - 1, P.sageLight); pc.set(cx - 2, cy, P.sageLight);
      }
      if (topOpen) for (let x = px; x < px + T; x += 1) {
        const bump = Math.round(Math.sin((x / 5) * Math.PI) * 1.5);
        for (let y = py; y < top - bump; y += 1) pc.set(x, y, pc.hex(x, y) === P.sageShade.toUpperCase() ? P.sage : pc.hex(x, y));
        pc.set(x, top - bump, P.outline); pc.set(x, top - bump + 1, P.sageLight);
      }
      if (frontOpen) {
        for (let y = py + 11; y < py + T - 1; y += 1) for (let x = px; x < px + T; x += 1) pc.mul(x, y, 0.82);
        for (let x = px; x < px + T; x += 1) { const b = (x & 3) === 1 ? 0 : 1; pc.set(x, py + T - 1 - b, P.outline); if (b) pc.mul(x, py + T - 1, 0.85); }
      }
      break;
    }
  }
}

/** A wall seen from the front: crown, wallpaper, a rail, wainscot panels and a skirting board. */
function drawWallFace(pc: PixelCanvas, px: number, py: number, theme: Theme, around: Around, seed: number) {
  pc.rect(px, py, T, T, theme.wall);
  for (let y = py + 2; y < py + 9; y += 1) for (let x = px; x < px + T; x += 1) {
    if (x % 4 === 0) pc.set(x, y, theme.wallAccent);
    else if (x % 4 === 2 && (y + Math.floor(x / 4)) % 3 === 0) pc.set(x, y, P.cream);
  }
  pc.hline(px, py, T, P.outline); pc.hline(px, py + 1, T, P.brownLight);
  pc.hline(px, py + 9, T, P.brownLight); pc.hline(px, py + 10, T, P.outline);
  pc.rect(px, py + 11, T, 2, theme.floor);
  for (let x = px; x < px + T; x += 1) { pc.mix(x, py + 11, P.white, 0.2); if (x % 8 === 0) pc.vline(x, py + 11, 2, theme.floorShade); }
  pc.hline(px, py + 13, T, P.outline); pc.rect(px, py + 14, T, 2, P.cream); pc.hline(px, py + 15, T, P.creamShade);
  // An occasional window between two runs of wall.
  const faceL = around(-1, 0) === 'wall' && !isWallish(around(-1, 1));
  const faceR = around(1, 0) === 'wall' && !isWallish(around(1, 1));
  if (faceL && faceR && hash(seed, 1, 15) < 0.22) {
    pc.box(px + 3, py + 1, 10, 8, P.cream, P.outline);
    pc.rect(px + 4, py + 2, 8, 6, P.blueLight);
    pc.vline(px + 8, py + 2, 6, P.cream); pc.hline(px + 4, py + 4, 8, P.cream);
    pc.set(px + 5, py + 2, P.white); pc.set(px + 6, py + 3, P.white); pc.set(px + 9, py + 5, P.white);
    pc.rect(px + 4, py + 6, 4, 2, P.blue); pc.rect(px + 9, py + 6, 3, 2, P.blue);
    pc.hline(px + 2, py + 9, 12, P.brownLight);
  }
}

/** Soft occlusion where floor meets walls, hedges and building faces (after all ground is drawn). */
export function occlude(pc: PixelCanvas, px: number, py: number, here: Ground, around: Around) {
  if (isBlockedGround(here) || here === 'void') return;
  const tall = (g: Ground) => g === 'wall' || g === 'hedge';
  if (tall(around(0, -1))) for (let k = 0; k < 4; k += 1) for (let x = px; x < px + T; x += 1) pc.mul(x, py + k, [0.74, 0.84, 0.92, 0.97][k]);
  if (around(-1, 0) === 'wall') for (let k = 0; k < 3; k += 1) for (let y = py; y < py + T; y += 1) pc.mul(px + k, y, [0.8, 0.9, 0.96][k]);
  if (around(1, 0) === 'wall') for (let k = 0; k < 2; k += 1) for (let y = py; y < py + T; y += 1) pc.mul(px + T - 1 - k, y, [0.86, 0.94][k]);
}

// ---- props: drawn into the baked area canvas at their tile footprint -------------------------

export interface PropDef { type: string; x: number; y: number; w?: number; h?: number; colour?: string; label?: string; action?: string; accepts?: string[]; walkable?: boolean; doorX?: number }

/** Ground shadow under a prop's footprint, drawn before any prop so props never shade each other. */
export function propShadow(pc: PixelCanvas, p: PropDef) {
  const x = p.x * T; const y = p.y * T; const w = (p.w ?? 1) * T; const h = (p.h ?? 1) * T;
  const strip = (k: number[]) => k.forEach((m, i) => { for (let dx = 0; dx < w; dx += 1) pc.mul(x + dx, y + h + i, m); });
  switch (p.type) {
    case 'tree': pc.shadowEllipse(x + w / 2 + 3, y + h - 3, w / 2 + 3, 5, 0.7); break;
    case 'burrow': pc.shadowEllipse(x + w / 2 + 4, y + h - 4, w / 2 + 1, 6, 0.74); break;
    case 'fountain': pc.shadowEllipse(x + w / 2 + 2, y + h / 2 + 4, w / 2, h / 2 - 2, 0.78); break;
    case 'bush': pc.shadowEllipse(x + 9, y + 14, 7, 2, 0.72); break;
    case 'shopfront': case 'shelf': case 'counter': case 'sink': case 'oven': case 'display': strip([0.72, 0.84, 0.93]); break;
    case 'lamppost': case 'sign': case 'mailbox': pc.shadowEllipse(x + 10, y + 14, 5, 1.5, 0.74); break;
    case 'lamp': case 'plant': case 'basket': case 'flour': case 'crate': pc.shadowEllipse(x + 9, y + 14, 6, 2, 0.76); break;
    default: pc.shadowEllipse(x + w / 2 + 1, y + h - 1, w / 2 - 1, 2.5, 0.74);
  }
}

/** Draw a shape on a scratch canvas, outline its silhouette, then stamp it into the area. */
function cutout(pc: PixelCanvas, x: number, y: number, w: number, h: number, paint: (c: PixelCanvas) => void) {
  const c = new PixelCanvas(w, h);
  paint(c);
  c.outlineShapes(P.outline);
  pc.draw(c, x, y);
}

/** Leafy canopy: dark body, lit clumps toward the top-left and a few bright flecks. */
function foliage(c: PixelCanvas, blobs: [number, number, number, number][], seed: number, blossom?: string) {
  for (const [bx, by, rx, ry] of blobs) c.ellipse(bx, by, rx, ry, P.sageShade);
  for (const [bx, by, rx, ry] of blobs) c.ellipse(bx - 1, by - 2, Math.max(1, rx - 2), Math.max(1, ry - 2), P.sage);
  for (const [bx, by, rx, ry] of blobs) { c.ellipse(bx - 2, by - 3, Math.max(1, rx / 3), Math.max(1, ry / 3), P.sageLight); }
  const r = seeded(seed);
  for (let i = 0; i < 14; i += 1) {
    const [bx, by, rx, ry] = blobs[Math.floor(r() * blobs.length)];
    const fx = Math.round(bx + (r() - 0.5) * rx * 1.4); const fy = Math.round(by + (r() - 0.5) * ry * 1.4);
    if (!c.alpha(fx, fy)) continue;
    c.set(fx, fy, r() < 0.5 ? P.sageShade : P.sageLight);
    if (blossom && r() < 0.35) { c.set(fx, fy, blossom); c.set(fx + 1, fy, P.white); }
  }
}

export function drawProp(pc: PixelCanvas, p: PropDef) {
  const x = p.x * T; const y = p.y * T; const w = (p.w ?? 1) * T; const h = (p.h ?? 1) * T;
  const c = p.colour;
  const lit = (x0: number, y0: number, len: number, a = 0.45) => { for (let i = 0; i < len; i += 1) pc.mix(x0 + i, y0, P.white, a); };
  switch (p.type) {
    case 'bed': {
      const q = c ?? P.blue;
      pc.box(x + 1, y, w - 2, 9, P.brown, P.outline, 2);
      lit(x + 4, y + 2, w - 8); pc.hline(x + 3, y + 6, w - 6, P.brownShade);
      pc.box(x + 2, y + 6, w - 4, h - 9, P.cream, P.outline, 1);
      pc.box(x + 5, y + 8, w - 10, 8, P.white, P.outlineLight, 2);
      pc.hline(x + 7, y + 14, w - 14, P.creamShade); pc.set(x + 8, y + 10, P.creamShade);
      pc.box(x + 2, y + 17, w - 4, h - 21, q, P.outline, 1);
      for (let qy = y + 22; qy < y + h - 5; qy += 1) for (let qx = x + 3; qx < x + w - 3; qx += 1) {
        const lx = qx - x - 3; const ly = qy - y - 22;
        if (lx % 7 === 6 || ly % 7 === 6) pc.mul(qx, qy, 0.86);
        else if ((Math.floor(lx / 7) + Math.floor(ly / 7)) % 2) pc.mix(qx, qy, P.white, 0.28);
      }
      pc.rect(x + 3, y + 18, w - 6, 3, P.white); pc.hline(x + 3, y + 21, w - 6, P.creamShade);
      pc.vline(x + w - 4, y + 18, h - 23, P.blueShade);
      pc.box(x + 1, y + h - 5, w - 2, 5, P.brown, P.outline, 1); lit(x + 3, y + h - 4, w - 6, 0.3);
      break;
    }
    case 'basket':
      pc.box(x + 2, y + 5, 12, 10, P.butterShade, P.outline, 2);
      for (let j = y + 7; j < y + 14; j += 1) for (let i = x + 3; i < x + 13; i += 1) if ((i + j * 2) % 4 === 0) pc.set(i, j, P.brownLight);
      pc.box(x + 3, y + 3, 10, 4, P.butter, P.outline, 1); lit(x + 5, y + 4, 6);
      pc.rect(x + 5, y + 5, 6, 2, P.blueLight); pc.set(x + 6, y + 5, P.white);
      break;
    case 'shelf': {
      pc.box(x, y - 4, w, h + 4, P.brown, P.outline);
      lit(x + 1, y - 3, w - 2, 0.35);
      for (let sy = y - 1; sy < y + h - 2; sy += 8) {
        pc.rect(x + 2, sy, w - 4, 6, P.brownShade);
        const r = seeded(x + sy);
        for (let bx = x + 2; bx < x + w - 3;) {
          const bw = 2 + Math.floor(r() * 2); const bh = 3 + Math.floor(r() * 3);
          const col = [P.peach, P.sage, P.blue, P.butter, P.peachShade, P.blueLight][Math.floor(r() * 6)];
          if (r() < 0.15) { pc.ellipseBox(bx + 2, sy + 4, 2, 1, P.cream, P.outline); bx += 5; continue; }
          pc.box(bx, sy + 6 - bh, bw, bh, col, P.outline); pc.mix(bx, sy + 6 - bh, P.white, 0.5);
          bx += bw;
        }
        pc.hline(x + 1, sy + 6, w - 2, P.brownLight);
      }
      break;
    }
    case 'table':
      pc.rect(x + 2, y + h - 4, 2, 4, P.brownShade); pc.rect(x + w - 4, y + h - 4, 2, 4, P.brownShade);
      pc.box(x + 1, y + 1, w - 2, h - 5, P.brownLight, P.outline, 1);
      pc.rect(x + 2, y + h - 6, w - 4, 2, P.brown);
      lit(x + 3, y + 2, w - 6, 0.4);
      for (let gx = x + 6; gx < x + w - 4; gx += 9) pc.hline(gx, y + 5 + (gx % 3), 3, P.brown);
      pc.ellipse(x + w / 2, y + 6, 4, 2, P.cream); pc.ellipse(x + w / 2, y + 6, 2, 1, P.white);
      break;
    case 'chair': {
      const seat = c ?? P.peach;
      pc.rect(x + 4, y + 12, 2, 3, P.brownShade); pc.rect(x + 10, y + 12, 2, 3, P.brownShade);
      pc.box(x + 3, y + 1, 10, 6, P.brownLight, P.outline, 1); pc.vline(x + 6, y + 2, 4, P.brown); pc.vline(x + 9, y + 2, 4, P.brown);
      pc.box(x + 3, y + 6, 10, 7, seat, P.outline, 1); lit(x + 5, y + 7, 6, 0.4);
      pc.hline(x + 4, y + 11, 8, P.brownShade);
      break;
    }
    case 'armchair': {
      const body = c ?? P.sage;
      pc.box(x + 1, y, w - 2, 8, P.sageShade, P.outline, 2); lit(x + 4, y + 1, w - 8, 0.3);
      pc.box(x + 3, y + 6, w - 6, h - 8, P.sageLight, P.outlineLight, 1);
      pc.box(x, y + 5, 4, h - 6, body, P.outline, 1); pc.box(x + w - 4, y + 5, 4, h - 6, body, P.outline, 1);
      pc.mix(x + 1, y + 6, P.white, 0.5); pc.mix(x + w - 3, y + 6, P.white, 0.5);
      pc.hline(x + 4, y + h - 3, w - 8, P.sageShade);
      break;
    }
    case 'counter': {
      const front = c ?? P.sage;
      pc.box(x, y + 6, w, h - 6, front, P.outline);
      for (let dx = x; dx < x + w - 1; dx += 16) {
        pc.box(dx + 1, y + 8, 14, h - 10, front, P.outlineLight, 1);
        pc.rect(dx + 6, y + 10, 4, 1, P.brownShade); pc.mix(dx + 6, y + 9, P.white, 0.5);
      }
      pc.box(x, y, w, 7, P.creamShade, P.outline); lit(x + 1, y + 1, w - 2, 0.7);
      pc.ellipseBox(x + w - 9, y + 3, 3, 1, P.blueLight, P.outlineLight);
      break;
    }
    case 'sink':
      pc.box(x, y + 6, w, h - 6, c ?? P.sage, P.outline);
      pc.box(x + 2, y + 8, w / 2 - 3, h - 10, c ?? P.sage, P.outlineLight, 1); pc.box(x + w / 2 + 1, y + 8, w / 2 - 3, h - 10, c ?? P.sage, P.outlineLight, 1);
      pc.box(x, y, w, 7, P.creamShade, P.outline); lit(x + 1, y + 1, w - 2, 0.7);
      pc.box(x + 4, y + 1, w - 8, 5, P.blueLight, P.outlineLight, 1); pc.hline(x + 6, y + 2, 4, P.white);
      pc.box(x + w / 2 - 1, y - 3, 3, 5, P.greyLight, P.outline); pc.set(x + w / 2, y - 2, P.white);
      break;
    case 'oven':
      pc.box(x, y - 2, w, h + 2, P.greyLight, P.outline, 1);
      lit(x + 2, y - 1, w - 4, 0.6);
      [[6, 2], [w - 7, 2]].forEach(([bx, by]) => { pc.ellipseBox(x + bx, y + by, 3, 2, P.greyShade, P.ink); pc.set(x + bx, y + by, P.peach); });
      pc.box(x + 3, y + 7, w - 6, h - 11, P.outline, P.ink, 1);
      pc.rect(x + 5, y + 10, w - 10, h - 17, P.peachShade); pc.rect(x + 6, y + 11, w - 12, 2, P.butter);
      pc.hline(x + 5, y + 8, w - 10, P.greyShade); pc.mix(x + 6, y + 10, P.white, 0.5);
      pc.rect(x + 4, y + h - 3, w - 8, 1, P.greyShade);
      break;
    case 'plant': {
      const pot = c ?? P.peach;
      pc.box(x + 4, y + 9, 8, 6, pot, P.outline, 1); pc.box(x + 3, y + 8, 10, 3, pot, P.outline); lit(x + 4, y + 9, 3, 0.5);
      cutout(pc, x, y - 4, 16, 14, (k) => {
        [[8, 5, 2, 4], [4, 7, 3, 2], [12, 7, 3, 2], [6, 3, 2, 3], [10, 3, 2, 3]].forEach(([lx, ly, rx, ry]) => k.ellipse(lx, ly, rx, ry, P.sageShade));
        [[8, 4], [4, 6], [12, 6], [6, 2], [10, 2]].forEach(([lx, ly]) => { k.set(lx, ly, P.sage); k.set(lx - 1, ly, P.sageLight); });
      });
      break;
    }
    case 'lamp':
      pc.ellipse(x + 8, y + 14, 3, 1, P.brownShade); pc.vline(x + 8, y + 6, 8, P.outline); pc.vline(x + 7, y + 6, 8, P.brownLight);
      cutout(pc, x + 1, y - 2, 14, 10, (k) => {
        for (let j = 0; j < 7; j += 1) k.hline(4 - Math.floor(j / 2), 1 + j, 6 + Math.floor(j / 2) * 2, P.butter);
        k.hline(1, 7, 12, P.butterShade); k.vline(5, 2, 4, P.butterLight); k.vline(6, 2, 3, P.white);
      });
      break;
    case 'flour':
      pc.box(x + 2, y + 3, 7, 12, P.cream, P.outline, 2); pc.box(x + 8, y + 5, 6, 10, P.creamShade, P.outline, 2);
      pc.hline(x + 3, y + 5, 3, P.greyLight); pc.rect(x + 4, y + 8, 3, 3, P.blueLight); pc.rect(x + 10, y + 9, 2, 2, P.peach);
      pc.vline(x + 3, y + 6, 6, P.white);
      break;
    case 'display':
      pc.box(x, y - 2, w, h + 2, P.brown, P.outline); lit(x + 1, y - 1, w - 2, 0.3);
      pc.box(x + 2, y, w - 4, h - 5, P.blueLight, P.outlineLight, 1);
      for (let bx = x + 4; bx < x + w - 6; bx += 7) {
        pc.ellipseBox(bx + 2, y + 5, 3, 2, P.butterShade, P.outline); pc.set(bx + 1, y + 4, P.butterLight);
        pc.ellipseBox(bx + 4, y + 9, 2, 1, P.peach, P.outline); pc.set(bx + 4, y + 9, P.white);
      }
      pc.line(x + 4, y + 1, x + 8, y + 5, P.white); pc.line(x + 5, y + 1, x + 9, y + 5, P.white);
      pc.rect(x + 1, y + h - 4, w - 2, 3, P.brownShade);
      break;
    case 'crate':
      pc.box(x + 1, y + 2, 14, 13, P.brownLight, P.outline);
      pc.hline(x + 2, y + 6, 12, P.brown); pc.hline(x + 2, y + 10, 12, P.brown);
      pc.line(x + 2, y + 13, x + 13, y + 3, P.brown);
      lit(x + 2, y + 3, 12, 0.35); pc.vline(x + 13, y + 3, 11, P.brownShade);
      pc.ellipse(x + 6, y + 1, 2, 1, P.sage); pc.ellipse(x + 10, y + 1, 2, 1, P.peach);
      break;
    // ---- outdoor ----
    case 'tree':
      cutout(pc, x - 5, y - 14, w + 10, h + 14, (k) => {
        const cx = (w + 10) / 2;
        k.rect(cx - 3, h - 4, 6, 16, P.brown); k.vline(cx + 2, h - 4, 15, P.brownShade); k.vline(cx - 2, h - 2, 12, P.brownLight);
        k.rect(cx - 5, h + 10, 3, 2, P.brown); k.rect(cx + 3, h + 10, 3, 2, P.brownShade);
        foliage(k, [[cx, 14, 13, 10], [cx - 9, 20, 8, 7], [cx + 9, 20, 8, 7], [cx, 24, 11, 6], [cx - 6, 8, 7, 6], [cx + 6, 8, 7, 6]], x * 7 + y, P.peachLight);
      });
      break;
    case 'bush':
      cutout(pc, x - 2, y - 3, 20, 19, (k) => {
        foliage(k, [[10, 10, 7, 5], [5, 11, 4, 4], [15, 11, 4, 4], [10, 6, 5, 4]], x + y * 3);
        k.set(6, 9, P.peach); k.set(13, 12, P.peach); k.set(11, 7, P.peachShade);
      });
      break;
    case 'mailbox':
      pc.rect(x + 7, y + 8, 2, 7, P.brownShade); pc.set(x + 7, y + 8, P.brownLight);
      pc.box(x + 3, y + 2, 10, 7, P.peach, P.outline, 1); pc.box(x + 2, y + 6, 12, 3, P.peachShade, P.outline);
      lit(x + 5, y + 3, 6, 0.5); pc.rect(x + 12, y, 1, 5, P.outline); pc.rect(x + 13, y, 2, 2, P.butter);
      break;
    case 'sign':
      pc.rect(x + 7, y + 8, 2, 7, P.brownShade);
      pc.box(x + 1, y + 2, 14, 8, P.brownLight, P.outline, 1);
      lit(x + 2, y + 3, 12, 0.4); pc.hline(x + 4, y + 5, 8, P.brownShade); pc.hline(x + 4, y + 7, 5, P.brownShade);
      pc.hline(x + 2, y + 8, 12, P.brown);
      break;
    case 'board':
      pc.rect(x + 3, y + 9, 2, 6, P.brownShade); pc.rect(x + w - 5, y + 9, 2, 6, P.brownShade);
      pc.box(x, y - 3, w, 4, P.brown, P.outline, 1);
      pc.box(x + 1, y, w - 2, 11, P.brownLight, P.outline);
      pc.box(x + 3, y + 2, 7, 7, P.cream, P.outlineLight); pc.hline(x + 4, y + 4, 4, P.greyLight); pc.hline(x + 4, y + 6, 3, P.greyLight);
      pc.box(x + 12, y + 3, 7, 6, P.butterLight, P.outlineLight); pc.box(x + 21, y + 2, 8, 6, P.peachLight, P.outlineLight);
      pc.set(x + 6, y + 2, P.peachShade); pc.set(x + 15, y + 3, P.blueShade); pc.set(x + 25, y + 2, P.sageShade);
      break;
    case 'bench':
      pc.rect(x + 3, y + 10, 2, 5, P.outline); pc.rect(x + w - 5, y + 10, 2, 5, P.outline);
      pc.box(x, y + 1, w, 4, P.brownLight, P.outline); lit(x + 1, y + 2, w - 2, 0.35);
      pc.box(x, y + 6, w, 5, P.brownLight, P.outline); lit(x + 1, y + 7, w - 2, 0.35);
      pc.hline(x + 1, y + 9, w - 2, P.brown);
      break;
    case 'lamppost':
      pc.box(x + 5, y + 12, 7, 3, P.ink, P.outline); pc.rect(x + 7, y + 3, 3, 10, P.ink); pc.vline(x + 7, y + 4, 8, P.outline);
      pc.box(x + 4, y - 6, 9, 9, P.butterLight, P.ink, 1); pc.rect(x + 6, y - 4, 2, 5, P.white); pc.vline(x + 9, y - 4, 5, P.butter);
      pc.box(x + 3, y - 8, 11, 3, P.ink, P.outline, 1); pc.set(x + 8, y - 9, P.ink);
      break;
    case 'fountain': {
      cutout(pc, x, y - 6, w, h + 6, (k) => {
        const cx = w / 2; const cy = h / 2 + 10; const rx = w / 2 - 2; const ry = h / 2 - 8;
        const water = c ?? P.greyShade;
        // Stone rim: a front face for thickness, a lit top band with block seams, then the basin.
        k.ellipse(cx, cy + 3, rx, ry, P.grey);
        k.ellipse(cx, cy, rx, ry, P.greyLight);
        for (let a = 0; a < 14; a += 1) {
          const t = (a / 14) * Math.PI * 2;
          k.line(Math.round(cx + Math.cos(t) * (rx - 4)), Math.round(cy + Math.sin(t) * (ry - 4)), Math.round(cx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry), P.grey);
        }
        for (let yy = 0; yy < cy; yy += 1) for (let xx = 0; xx < w; xx += 1) if (k.hex(xx, yy) === P.greyLight.toUpperCase()) k.mix(xx, yy, P.white, 0.35);
        k.ellipse(cx, cy, rx - 4, ry - 4, water);
        // The rim's shadow falls into the top of the basin.
        for (let yy = cy - ry; yy < cy + ry; yy += 1) for (let xx = 0; xx < w; xx += 1) {
          if (k.hex(xx, yy) !== water.toUpperCase()) continue;
          const dy = (yy - cy) / (ry - 4); const dx = (xx - cx) / (rx - 4);
          if (dy < 0 && dx * dx + (dy * 1.25) ** 2 > 0.75) k.mul(xx, yy, 0.86);
        }
        if (c) { k.hline(cx - 14, cy + 4, 5, P.blueLight); k.hline(cx + 6, cy + 7, 4, P.white); k.hline(cx + 9, cy - 2, 3, P.blueLight); }
        else { k.set(cx - 12, cy + 4, P.brownLight); k.set(cx - 11, cy + 4, P.peachShade); k.set(cx + 10, cy + 6, P.brownLight); k.set(cx + 11, cy + 5, P.sageShade); k.line(cx + 4, cy + 9, cx + 9, cy + 7, P.grey); }
        // Pedestal and the upper bowl.
        k.rect(cx - 4, 16, 9, cy - 14, P.greyLight); k.vline(cx - 3, 17, cy - 16, P.white); k.rect(cx + 2, 16, 3, cy - 14, P.grey);
        k.ellipse(cx, cy + 2, 6, 2, P.grey);
        k.ellipse(cx, 16, 13, 5, P.grey);
        k.ellipse(cx, 14, 13, 4, P.greyLight); k.hline(cx - 9, 12, 12, P.white);
        k.ellipse(cx, 14, 10, 2, c ? P.blueLight : P.greyShade);
        k.rect(cx - 1, 5, 3, 8, P.greyLight); k.vline(cx + 1, 5, 8, P.grey);
        k.ellipse(cx, 4, 3, 3, P.greyLight); k.set(cx - 1, 3, P.white); k.set(cx + 1, 5, P.grey);
      });
      break;
    }
    case 'burrow': {
      const doorCx = p.doorX !== undefined ? p.doorX * T + 8 - x : w / 2;
      cutout(pc, x - 2, y - 8, w + 4, h + 8, (k) => {
        const W = w + 4; const H = h + 8; const ox = 2; const oy = 8;
        k.ellipse(W / 2, H - 6, W / 2 - 1, H - 10, P.sageShade);
        k.ellipse(W / 2 - 5, H - 11, W / 2 - 9, H - 18, P.sage);
        for (let yy = 0; yy < H; yy += 1) for (let xx = 0; xx < W; xx += 1) {
          const dx = (xx - (W / 2 - 16)) / 20; const dy = (yy - (H - 26)) / 12;
          const d = dx * dx + dy * dy;
          if (d < 1 && k.alpha(xx, yy) && dither(xx, yy) < (1 - d) * 0.7) k.set(xx, yy, P.sageLight);
        }
        const r = seeded(x + y);
        for (let i = 0; i < 26; i += 1) {
          const tx = Math.floor(r() * W); const ty = Math.floor(r() * H);
          if (!k.alpha(tx, ty) || !k.alpha(tx, ty - 3)) continue;
          k.set(tx, ty, P.sageShade); k.set(tx + 1, ty - 1, P.sageShade); k.set(tx + 2, ty, P.sageShade);
          if (r() < 0.3) { k.set(tx + 1, ty - 2, [P.peach, P.white, P.butter][i % 3]); }
        }
        // Little chimney pipe and a round window.
        k.rect(W - 26, 6, 6, 9, P.greyLight); k.vline(W - 21, 6, 9, P.grey); k.rect(W - 27, 4, 8, 3, P.grey);
        k.ellipse(ox + 16, oy + 34, 6, 6, P.cream); k.ellipse(ox + 16, oy + 34, 4, 4, P.blueLight);
        k.hline(ox + 12, oy + 34, 9, P.cream); k.vline(ox + 16, oy + 30, 9, P.cream); k.set(ox + 14, oy + 32, P.white);
        k.rect(ox + 11, oy + 40, 11, 3, P.peach); k.set(ox + 13, oy + 39, P.white); k.set(ox + 17, oy + 39, P.butter); k.set(ox + 20, oy + 39, P.peachShade);
        // Round door with a frame, planks and a brass knob.
        const dx = ox + doorCx; const dy = H - 8;
        k.ellipse(dx, dy, 11, 11, P.brownShade);
        k.ellipse(dx, dy, 9, 9, P.brown);
        for (let px = dx - 6; px <= dx + 6; px += 4) k.vline(px, dy - 8, 17, P.brownShade);
        k.ellipse(dx - 3, dy - 5, 2, 1, P.brownLight);
        k.set(dx + 5, dy, P.butter); k.set(dx + 5, dy - 1, P.butterLight);
        for (let yy = H - 1; yy < H; yy += 1) for (let xx = 0; xx < W; xx += 1) k.clear(xx, yy);
      });
      break;
    }
    case 'shopfront': {
      const roof = c ?? P.peach;
      const shade = roof === P.blue ? P.blueShade : roof === P.sage ? P.sageShade : P.peachShade;
      // Wall with timber posts.
      pc.box(x + 2, y + 13, w - 4, h - 13, P.cream, P.outline);
      for (let i = y + 14; i < y + h; i += 1) for (let j = x + 3; j < x + w - 3; j += 1) if ((i + Math.floor(j / 3)) % 7 === 0) pc.set(j, i, P.creamShade);
      pc.rect(x + 3, y + 14, 3, h - 14, P.brownLight); pc.rect(x + w - 6, y + 14, 3, h - 14, P.brownLight);
      // Shingled roof: rows of scallops, a lit ridge and a dark eave.
      pc.box(x - 1, y - 6, w + 2, 21, roof, P.outline, 2);
      for (let ry = y - 3; ry < y + 13; ry += 4) for (let rx = x + ((ry - y) & 4 ? 3 : 0); rx < x + w; rx += 6) { pc.hline(rx, ry + 3, 5, shade); pc.set(rx, ry + 2, shade); pc.set(rx + 4, ry + 2, shade); }
      lit(x + 1, y - 5, w - 2, 0.55);
      pc.rect(x - 1, y + 13, w + 2, 2, shade); pc.hline(x - 1, y + 15, w + 2, P.outline);
      // Windows with frames, panes, a glint and flower boxes.
      for (const wx of [x + 7, x + w - 26]) {
        pc.box(wx, y + 19, 19, 13, P.cream, P.outline);
        pc.rect(wx + 2, y + 21, 15, 9, P.blueLight); pc.vline(wx + 9, y + 21, 9, P.cream); pc.hline(wx + 2, y + 25, 15, P.cream);
        pc.line(wx + 3, y + 29, wx + 7, y + 22, P.white); pc.rect(wx + 11, y + 27, 5, 3, P.blue);
        pc.box(wx - 1, y + 32, 21, 4, P.brownLight, P.outline);
        for (let fx = wx + 1; fx < wx + 19; fx += 3) { pc.set(fx, y + 31, P.sageShade); pc.set(fx + 1, y + 30, [P.peach, P.white, P.butter][fx % 3]); }
      }
      // Sign board on the roof.
      pc.box(x + w / 2 - 15, y + 1, 30, 9, P.brownLight, P.outline, 1);
      lit(x + w / 2 - 13, y + 2, 26, 0.4); pc.hline(x + w / 2 - 10, y + 5, 20, P.brown);
      if (p.doorX !== undefined) {
        // The door sits on the facade's bottom edge, above the door tile, under a striped awning.
        const dx = p.doorX * T;
        pc.box(dx + 1, y + h - 17, 14, 17, P.brown, P.outline, 2);
        pc.box(dx + 3, y + h - 14, 10, 6, P.blueLight, P.outline); pc.set(dx + 4, y + h - 13, P.white);
        pc.vline(dx + 8, y + h - 8, 7, P.brownShade);
        pc.set(dx + 11, y + h - 6, P.butter);
        for (let ax = dx - 3; ax < dx + 19; ax += 1) for (let ay = y + h - 22; ay < y + h - 18; ay += 1) pc.set(ax, ay, Math.floor((ax - dx + 3) / 3) % 2 ? P.cream : roof);
        for (let ax = dx - 3; ax < dx + 19; ax += 2) pc.set(ax, y + h - 18, Math.floor((ax - dx + 3) / 3) % 2 ? P.cream : roof);
        pc.hline(dx - 3, y + h - 23, 22, P.outline);
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
  // A breath in idle: a touch wider when lower.
  const rx = 8 + (pose === 'idle' && bob ? 0.4 : 0); const ry = 6;
  // Ears, swept back a little when seen from the side, with a pink inner stripe.
  const ears = side ? [[9, -1], [12, 0]] : [[8, 0], [16, 0]];
  ears.forEach(([ex, tilt], i) => {
    const wiggle = pose === 'swing' && i === 1 ? 1 : 0;
    const top = cy - 12 + Math.abs(wiggle);
    for (let y = top; y < cy - 4; y += 1) {
      const k = (y - top) / 8; const x = Math.round(ex + tilt * (1 - k) + wiggle * (1 - k));
      pc.set(x - 1, y, P.greyLight); pc.set(x, y, P.greyLight); if (y > top) pc.set(x + 1, y, P.greyLight);
      if (dir !== 'up' && y > top + 1 && y < cy - 5) pc.set(x, y, P.peachLight);
    }
    pc.set(Math.round(ex + tilt + wiggle) - 1, top, P.white);
  });
  // Round fluffy body with tufts around the rim.
  pc.ellipse(12, cy, rx, ry, P.greyLight);
  for (let a = 0; a < 18; a += 1) {
    const t = (a / 18) * Math.PI * 2 + 0.17;
    if (a % 2) continue;
    pc.set(12 + Math.round(Math.cos(t) * (rx + 1)), cy + Math.round(Math.sin(t) * (ry + 1)), P.greyLight);
  }
  if (dir === 'up') { pc.ellipse(12, cy + 3, 2, 1, P.white); pc.hline(11, cy + 5, 3, P.grey); }
  // Light from the top-left: soft white fur up top, a warm grey underside.
  for (let y = cy - ry - 1; y <= cy + ry + 1; y += 1) for (let x = 2; x < 22; x += 1) {
    if (pc.hex(x, y) !== P.greyLight.toUpperCase()) continue;
    const nx = (x - 12) / (rx + 1); const ny = (y - cy) / (ry + 1);
    const l = -nx * 0.55 - ny * 0.85;
    if (l > 0.62) pc.set(x, y, P.white);
    else if (l < -0.5) pc.set(x, y, P.grey);
    else if (l < -0.3 && (x + y) % 2) pc.set(x, y, P.grey);
  }
  // Feet, stepping in turn.
  const step = pose === 'walk' ? (frame % 6 < 3 ? 0 : 1) : -1;
  [[8, 0], [16, 1]].forEach(([fx, k]) => pc.ellipse(fx, 21 - (step === k ? 1 : 0) + Math.min(0, bob), 2, 1, P.grey));
  pc.outlineShapes(P.outline);
  const eye = (x: number, y: number) => { pc.rect(x, y, 2, 2, P.ink); pc.set(x, y, P.white); };
  if (pose === 'sleep') {
    pc.hline(8, cy, 2, P.ink); pc.set(7, cy - 1, P.ink); pc.hline(14, cy, 2, P.ink); pc.set(16, cy - 1, P.ink);
    pc.rect(6, cy + 2, 2, 1, P.peach); pc.rect(16, cy + 2, 2, 1, P.peach);
  } else if (dir === 'down') {
    eye(8, cy - 1); eye(14, cy - 1);
    pc.rect(6, cy + 2, 2, 1, P.peach); pc.rect(16, cy + 2, 2, 1, P.peach);
    pc.set(11, cy + 2, P.outline); pc.set(12, cy + 3, P.outline); pc.set(13, cy + 2, P.outline);
  } else if (side) {
    eye(16, cy - 1);
    pc.rect(17, cy + 2, 2, 1, P.peach);
    pc.set(20, cy + 1, P.peachShade);
  }
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

/** Placeholder neighbours (M2) until their sprite sheets land: Puff's round build in their own colours, with each species' look. */
export function drawNeighbour24(species: string, c: { fur: string; belly: string; accent: string }, dir: Dir, frame: number, pose: 'walk' | 'idle' | 'sleep' = 'idle') {
  const pc = new PixelCanvas(PUFF_PX, PUFF_PX);
  const side = dir === 'right' || dir === 'left';
  const front = dir === 'down';
  const bob = pose === 'walk' ? [0, -1, 0, 0, -1, 0][frame % 6] : pose === 'idle' ? [0, 0, 1, 1][frame % 4] : 0;
  const cy = 14 + bob;
  // Behind the body: ears, wings, tufts.
  if (species === 'mouse') for (const ex of side ? [9] : [6, 18]) { pc.ellipse(ex, cy - 6, 3, 3, c.fur); if (!(dir === 'up')) pc.ellipse(ex, cy - 6, 2, 2, c.accent); }
  if (species === 'bee') {
    for (const wx of side ? [8] : [7, 17]) pc.ellipse(wx, cy - 6, 3, 2, P.blueLight);
    for (const ax of side ? [13] : [10, 14]) { pc.vline(ax, cy - 10, 4, c.accent); pc.set(ax, cy - 11, c.accent); }
  }
  if (species === 'owl') for (const ex of side ? [10] : [7, 17]) { pc.set(ex, cy - 8, c.fur); pc.rect(ex - 1, cy - 7, 3, 2, c.fur); }
  if (species === 'otter' || species === 'hedgehog') for (const ex of side ? [11] : [8, 16]) pc.ellipse(ex, cy - 5, 2, 2, c.fur);
  pc.ellipse(12, cy, species === 'mole' ? 8 : 7, 6, c.fur);
  if (species === 'hedgehog') {
    // Spines round the top and back, darker than the face.
    for (let a = 0; a < 13; a += 1) {
      const t = Math.PI * (1.05 + (a / 12) * (side ? 1.0 : 0.9)) + (side ? -0.35 : 0);
      pc.line(12 + Math.round(Math.cos(t) * 5), cy + Math.round(Math.sin(t) * 4), 12 + Math.round(Math.cos(t) * 9), cy + Math.round(Math.sin(t) * 8), c.fur);
    }
    for (let y = cy - 9; y <= cy + 6; y += 1) for (let x = 2; x < 22; x += 1) if (((x + y) % 3 === 0 || dir === 'up') && pc.hex(x, y) === c.fur.toUpperCase() && Math.hypot(x - 12, (y - cy) * 1.2) > (dir === 'up' ? 0 : 5)) pc.mul(x, y, 0.82);
  }
  if (species === 'bee') for (const y of [cy - 1, cy + 2]) for (let x = 5; x < 20; x += 1) if (pc.hex(x, y) === c.fur.toUpperCase()) pc.set(x, y, c.accent);
  if (front || side) {
    // The face and tummy in the lighter colour (an owl's face disc, an apron for the baker).
    const bx = side ? 15 : 12;
    pc.ellipse(bx, cy + 1, side ? 3 : 4, 3, c.belly);
    if (species === 'hedgehog' && front) { pc.rect(9, cy + 2, 7, 4, c.accent); pc.hline(10, cy + 1, 5, c.accent); }
  }
  if (species === 'otter' || species === 'mouse') { if (dir !== 'down') pc.line(side ? 5 : 12, cy + 4, side ? 2 : 12, cy + (side ? 1 : 7), c.fur); }
  // Light from the top-left.
  for (let y = cy - 7; y <= cy + 7; y += 1) for (let x = 3; x < 21; x += 1) {
    if (!pc.alpha(x, y)) continue;
    const l = -((x - 12) / 8) * 0.55 - ((y - cy) / 7) * 0.85;
    if (l > 0.7) pc.mul(x, y, 1.06); else if (l < -0.55) pc.mul(x, y, 0.9);
  }
  const step = pose === 'walk' ? (frame % 6 < 3 ? 0 : 1) : -1;
  [[8, 0], [16, 1]].forEach(([fx, k]) => pc.ellipse(fx, 20 - (step === k ? 1 : 0) + Math.min(0, bob), 2, 1, P.brownShade));
  pc.outlineShapes(P.outline);
  const eye = (x: number, y: number) => { pc.rect(x, y, 2, 2, P.ink); pc.set(x, y, P.white); };
  const small = species === 'mole';
  if (pose === 'sleep' && (front || side)) {
    if (front) { pc.hline(8, cy - 1, 2, P.ink); pc.hline(14, cy - 1, 2, P.ink); } else pc.hline(16, cy - 1, 2, P.ink);
  } else if (front) {
    if (small) { pc.set(9, cy - 1, P.ink); pc.set(15, cy - 1, P.ink); } else { eye(8, cy - 2); eye(14, cy - 2); }
    pc.rect(6, cy + 1, 2, 1, P.peach); pc.rect(16, cy + 1, 2, 1, P.peach);
    if (species === 'owl') { pc.set(12, cy, P.butterShade); pc.set(12, cy + 1, P.butterShade); }
    else if (species === 'mole' || species === 'hedgehog' || species === 'mouse') pc.rect(11, cy, 2, 1, P.peachShade);
    else { pc.set(11, cy + 1, P.outline); pc.set(12, cy + 2, P.outline); pc.set(13, cy + 1, P.outline); }
  } else if (side) {
    if (small) pc.set(17, cy - 1, P.ink); else eye(16, cy - 2);
    pc.rect(17, cy + 1, 2, 1, P.peach);
    pc.set(20, cy, species === 'owl' ? P.butterShade : P.peachShade);
  }
  if (pose === 'sleep') { pc.set(19, cy - 9, P.blue); pc.set(20, cy - 10, P.blue); pc.set(21, cy - 10, P.blue); }
  if (dir === 'left') {
    const flipped = new PixelCanvas(PUFF_PX, PUFF_PX);
    flipped.draw(pc, 0, 0, true);
    return flipped;
  }
  return pc;
}
