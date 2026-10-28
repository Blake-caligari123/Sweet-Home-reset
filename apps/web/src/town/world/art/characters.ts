import { P } from '../../../shared/art/palette';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';

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

/** A neighbour Puff meets later (Plus, M2 stub): one soft colour, no face. */
export function silhouette(pc: PixelCanvas) {
  for (let y = 0; y < pc.height; y += 1) for (let x = 0; x < pc.width; x += 1) if (pc.alpha(x, y)) pc.set(x, y, P.greyShade, pc.alpha(x, y));
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
