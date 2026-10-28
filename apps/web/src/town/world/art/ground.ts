import { P } from '../../../shared/art/palette';
import { seeded, type PixelCanvas } from '../../../shared/art/pixel-canvas';
import { T, hash, noise, mottle, flower, dither } from './texture';

export type Ground = 'void' | 'wood' | 'rug' | 'tile' | 'wall' | 'grass' | 'path' | 'cobble' | 'soil' | 'water' | 'flowers' | 'fence' | 'hedge' | 'mat' | 'stone' | 'rock' | 'sand';

const BLOCKED: Ground[] = ['void', 'wall', 'water', 'fence', 'hedge', 'rock'];
export const isBlockedGround = (g: Ground) => BLOCKED.includes(g);

export interface Theme { wall: string; wallAccent: string; floor: string; floorShade: string; rug: string; rugShade: string }

/** The ground around a tile, by offset, so edges can blend into their neighbours. */
export type Around = (dx: number, dy: number) => Ground;

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
    case 'sand': // the beach: warm sand, a ripple or two, now and then a tiny shell
      mottle(pc, px, py, P.butterLight, P.butter, P.cream, 64, 1, 0.3);
      if (r() < 0.3) pc.hline(px + 3 + Math.floor(r() * 6), py + 4 + Math.floor(r() * 8), 4, P.butterShade);
      if (r() < 0.08) { const x = px + 4 + Math.floor(r() * 8); const y = py + 4 + Math.floor(r() * 8); pc.set(x, y, P.peachLight); pc.set(x + 1, y, P.white); }
      break;
    case 'rock': {
      // A cave wall: dark rough rock, lit where it meets the floor below, with the odd crack.
      mottle(pc, px, py, theme.floorShade, P.ink, theme.floor, 64, 1, 0.35);
      if (around(0, 1) !== 'rock' && around(0, 1) !== 'void') {
        for (let x = px; x < px + T; x += 1) { pc.set(x, py + T - 3, theme.wall); pc.set(x, py + T - 2, theme.wallAccent); pc.set(x, py + T - 1, P.outline); }
      }
      if (r() < 0.25) { const x = px + 3 + Math.floor(r() * 10); pc.line(x, py + 2, x + 2, py + 7, P.ink); }
      break;
    }
    case 'stone':
      // A cave floor: cool mottled stone, a few pebbles, now and then a glint of colour.
      mottle(pc, px, py, theme.floor, theme.floorShade, P.greyShade, 64, 1, 0.3);
      if (r() < 0.3) { const x = px + 2 + Math.floor(r() * 11); const y = py + 2 + Math.floor(r() * 11); pc.set(x, y, P.greyLight); pc.set(x + 1, y, P.grey); }
      if (r() < 0.08) { const x = px + 3 + Math.floor(r() * 9); const y = py + 3 + Math.floor(r() * 9); pc.set(x, y, [P.peach, P.butter, P.blueLight][Math.floor(r() * 3)]); }
      break;
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
