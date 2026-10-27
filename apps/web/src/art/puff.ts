import { P } from './palette';
import { PixelCanvas } from './pixel-canvas';

export const PUFF_SIZE = 48;
export type Facing = 'down' | 'up' | 'right';
export type Eyes = 'open' | 'half' | 'closed' | 'happy';
export type Outfit = 'apron' | 'scarf' | 'beanie' | null;

export interface PuffPose {
  facing: Facing;
  /** Whole-pixel vertical offset of the body (negative is up). */
  lift: number;
  eyes: Eyes;
  /** Which foot is raised: -1 none, 0 left, 1 right; 'tuck' pulls both in for a hop. */
  step: -1 | 0 | 1 | 'tuck';
  mouth: 'smile' | 'open' | 'none';
  earFlop: 0 | 1;
}

const BASE: PuffPose = { facing: 'down', lift: 0, eyes: 'open', step: -1, mouth: 'smile', earFlop: 0 };
const FEET_Y = 43;

function body(pc: PixelCanvas, pose: PuffPose) {
  const cy = 30 + pose.lift;
  const side = pose.facing === 'right';
  // Ears first so the body overlaps their base.
  const earXs = side ? [19, 24] : [17, 31];
  earXs.forEach((ex, index) => {
    const flop = pose.earFlop && index === 1 ? 1 : 0;
    pc.ellipse(ex + (index === 0 ? -flop : flop), cy - 15 + flop, 3, 7, P.greyLight);
    if (pose.facing !== 'up') pc.ellipse(ex + (index === 0 ? -flop : flop), cy - 14 + flop, 1, 4, P.peachLight);
  });
  // Fluffy round body: an ellipse with soft bumps around the rim.
  pc.ellipse(24, cy, 14, 12, P.greyLight);
  for (let a = 0; a < 16; a += 1) {
    const t = (a / 16) * Math.PI * 2;
    pc.ellipse(24 + Math.cos(t) * 13, cy + Math.sin(t) * 11, 2, 2, P.greyLight);
  }
  // One shade step on the lower right, one highlight on the upper left (soft top-left light).
  for (let y = cy; y <= cy + 14; y += 1) {
    for (let x = 24; x <= 40; x += 1) {
      const dx = (x - 22) / 15; const dy = (y - cy + 3) / 12;
      if (dx * dx + dy * dy > 0.82 && pc.alpha(x, y) && x + (y - cy) > 32) pc.set(x, y, P.grey);
    }
  }
  // Feet peek out under the fluff; a raised foot lifts 2 px.
  const feet = side ? [20, 28] : [18, 30];
  feet.forEach((fx, index) => {
    const y = pose.step === 'tuck' ? FEET_Y + pose.lift - 2 : FEET_Y - (pose.step === index ? 2 : 0);
    pc.ellipse(fx, y, 3, 2, P.grey);
  });
  pc.rect(15, cy - 8, 3, 1, P.white);
  pc.rect(14, cy - 7, 2, 2, P.white);
  pc.outlineShapes(P.outline);
}

function face(pc: PixelCanvas, pose: PuffPose) {
  if (pose.facing === 'up') {
    pc.ellipse(24, 39 + pose.lift, 3, 2, P.white);
    return;
  }
  const cy = 30 + pose.lift;
  const eyes = pose.facing === 'right' ? [31] : [19, 28];
  eyes.forEach((ex) => {
    if (pose.eyes === 'open') {
      pc.rect(ex, cy - 2, 2, 4, P.ink);
      pc.set(ex, cy - 2, P.white);
    } else if (pose.eyes === 'half') {
      pc.rect(ex, cy, 2, 2, P.ink);
    } else if (pose.eyes === 'closed') {
      pc.hline(ex - 1, cy + 1, 4, P.ink);
    } else {
      pc.set(ex - 1, cy + 1, P.ink); pc.set(ex, cy, P.ink); pc.set(ex + 1, cy, P.ink); pc.set(ex + 2, cy + 1, P.ink);
    }
  });
  const cheeks = pose.facing === 'right' ? [34] : [15, 31];
  cheeks.forEach((cx) => pc.rect(cx, cy + 3, 3, 2, P.peach));
  const mx = pose.facing === 'right' ? 33 : 23;
  if (pose.mouth === 'smile') {
    pc.set(mx, cy + 4, P.ink); pc.set(mx + 1, cy + 5, P.ink); pc.set(mx + 2, cy + 4, P.ink);
  } else if (pose.mouth === 'open') {
    pc.rect(mx, cy + 4, 3, 2, P.ink); pc.set(mx + 1, cy + 5, P.peachShade);
  }
}

function outfit(pc: PixelCanvas, pose: PuffPose, item: Outfit) {
  if (!item) return;
  const cy = 30 + pose.lift;
  if (item === 'apron' && pose.facing !== 'up') {
    const x = pose.facing === 'right' ? 25 : 18;
    pc.box(x + 1, cy + 8, 10, 6, P.peach, P.peachShade, 1);
    pc.hline(x + 3, cy + 10, 6, P.peachShade);
    pc.set(x + 1, cy + 7, P.peachShade); pc.set(x + 10, cy + 7, P.peachShade);
  } else if (item === 'scarf') {
    for (let x = 12; x <= 36; x += 1) {
      if (pc.alpha(x, cy + 4)) { pc.set(x, cy + 4, P.sageShade); pc.set(x, cy + 5, P.sage); pc.set(x, cy + 6, P.sageShade); }
    }
    const tail = pose.facing === 'up' ? 28 : 31;
    pc.box(tail, cy + 6, 4, 7, P.sage, P.sageShade);
  } else if (item === 'beanie') {
    pc.box(14, cy - 13, 21, 7, P.blue, P.blueShade, 2);
    pc.hline(15, cy - 8, 19, P.blueShade);
    pc.ellipseBox(24, cy - 15, 3, 2, P.cream, P.blueShade);
  }
}

export function drawPuff(pose: Partial<PuffPose> = {}, item: Outfit = null) {
  const full = { ...BASE, ...pose };
  const pc = new PixelCanvas(PUFF_SIZE, PUFF_SIZE);
  body(pc, full);
  face(pc, full);
  outfit(pc, full, item);
  return pc;
}

/** Frame clips per PUFF-ANIMATION-TASKS.md: idle 4, blink 2, hop 6, walk 6 per direction. */
export const PUFF_CLIPS: Record<string, Partial<PuffPose>[]> = {
  idle: [{ lift: 0 }, { lift: 0 }, { lift: 1 }, { lift: 1 }],
  blink: [{ eyes: 'half' }, { eyes: 'closed' }],
  hop: [
    { lift: 1, eyes: 'happy' },
    { lift: -3, eyes: 'happy', step: 'tuck', mouth: 'open' },
    { lift: -6, eyes: 'happy', step: 'tuck', mouth: 'open', earFlop: 1 },
    { lift: -7, eyes: 'happy', step: 'tuck', mouth: 'open', earFlop: 1 },
    { lift: -4, eyes: 'happy', step: 'tuck' },
    { lift: 0, eyes: 'happy' }
  ],
  walk_down: [0, 1, 0, 0, 1, 0].map((lift, i) => ({ lift: -lift, step: (i < 3 ? 0 : 1) as 0 | 1 })),
  walk_up: [0, 1, 0, 0, 1, 0].map((lift, i) => ({ facing: 'up' as const, lift: -lift, step: (i < 3 ? 0 : 1) as 0 | 1, mouth: 'none' as const })),
  walk_right: [0, 1, 0, 0, 1, 0].map((lift, i) => ({ facing: 'right' as const, lift: -lift, step: (i < 3 ? 0 : 1) as 0 | 1 })),
  sneeze: [{ eyes: 'half' }, { eyes: 'closed', lift: -1 }, { eyes: 'closed', lift: -2, mouth: 'open' }, { eyes: 'closed', lift: 1, mouth: 'open' }, { eyes: 'open' }],
  sleepy: [{ eyes: 'closed', mouth: 'none' }, { eyes: 'closed', mouth: 'none', lift: 1 }],
  spin: ([{}, { facing: 'right' }, { facing: 'up', mouth: 'none' }, { facing: 'right' }] as Partial<PuffPose>[]).map((p) => ({ ...p, eyes: 'happy' as const }))
};

/** Every clip frame for one outfit, laid out in a single sheet (one row per clip). */
export function buildPuffSheet(item: Outfit) {
  const names = Object.keys(PUFF_CLIPS);
  const cols = Math.max(...names.map((n) => PUFF_CLIPS[n].length));
  const sheet = new PixelCanvas(cols * PUFF_SIZE, names.length * PUFF_SIZE);
  const frames: Record<string, { x: number; y: number }[]> = {};
  names.forEach((name, row) => {
    frames[name] = PUFF_CLIPS[name].map((pose, col) => {
      sheet.draw(drawPuff(pose, item), col * PUFF_SIZE, row * PUFF_SIZE);
      return { x: col * PUFF_SIZE, y: row * PUFF_SIZE };
    });
  });
  return { sheet, frames };
}
