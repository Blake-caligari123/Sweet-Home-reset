import { P } from '../../shared/art/palette';
import { PixelCanvas } from '../../shared/art/pixel-canvas';

// Code-drawn pixel props for the angled top-down rooms. Every prop has a lighter top face,
// a front face one shade darker and a 1 px warm-brown outline. These are the fallback art
// until the processed Grok Imagine sprites land (PIXEL-ART-SPEC.md).

export interface PropOptions {
  x: number;
  y: number;
  w?: number;
  h?: number;
  colour?: string;
  variant?: string;
}

type Draw = (pc: PixelCanvas, o: Required<Pick<PropOptions, 'x' | 'y'>> & PropOptions) => void;

const shadow = (pc: PixelCanvas, x: number, y: number, w: number, h: number) => {
  // Contact shadow drawn by darkening whatever floor is there by one step.
  for (let j = 0; j < h; j += 1) {
    for (let i = 0; i < w; i += 1) {
      const dx = (i - w / 2) / (w / 2); const dy = (j - h / 2) / (h / 2);
      if (dx * dx + dy * dy <= 1 && pc.alpha(x + i, y + j)) {
        const k = ((y + j) * pc.width + (x + i)) * 4;
        pc.data[k] = Math.round(pc.data[k] * 0.88); pc.data[k + 1] = Math.round(pc.data[k + 1] * 0.86); pc.data[k + 2] = Math.round(pc.data[k + 2] * 0.84);
      }
    }
  }
};

export const PROPS: Record<string, Draw> = {
  window(pc, { x, y, w = 52, h = 44, variant = 'closed', colour = P.peach }) {
    pc.box(x - 2, y - 2, w + 4, h + 4, P.cream, P.outline);
    pc.box(x, y, w, h, P.blueLight, P.outline);
    // Sky, a soft cloud and the far rooftops.
    pc.rect(x + 1, y + 1, w - 2, h - 2, P.blueLight);
    pc.ellipse(x + 12, y + 10, 5, 2, P.white);
    pc.ellipse(x + 16, y + 9, 4, 2, P.white);
    pc.ellipse(x + w - 12, y + 16, 3, 1, P.white);
    pc.set(x + w - 20, y + 8, P.ink); pc.set(x + w - 19, y + 7, P.ink); pc.set(x + w - 18, y + 8, P.ink);
    pc.rect(x + 1, y + h - 9, w - 2, 8, P.sageLight);
    pc.rect(x + w - 18, y + h - 15, 10, 14, P.peachLight);
    pc.rect(x + w - 18, y + h - 15, 10, 1, P.outlineLight);
    pc.vline(x + Math.floor(w / 2), y, h, P.cream);
    pc.hline(x, y + Math.floor(h / 2), w, P.cream);
    pc.box(x - 5, y + h + 1, w + 10, 5, P.creamShade, P.outline);
    pc.hline(x - 4, y + h + 2, w + 8, P.white);
    // Curtain rail and curtains.
    pc.hline(x - 7, y - 5, w + 14, P.brownShade);
    pc.hline(x - 7, y - 4, w + 14, P.brown);
    const half = Math.floor(w / 2) + 3;
    const cw = variant === 'closed' ? half : 9;
    for (const side of [0, 1]) {
      const cx = side === 0 ? x - 5 : x + w + 5 - cw;
      pc.box(cx, y - 4, cw, h + 8, colour, P.outline);
      for (let f = cx + 3; f < cx + cw - 1; f += 4) pc.vline(f, y - 3, h + 6, P.peachShade);
      if (variant !== 'closed') pc.box(cx - 1, y + Math.floor(h / 2), cw + 2, 3, P.butterShade, P.outline);
    }
  },

  wallShelf(pc, { x, y, w = 50 }) {
    pc.box(x, y, w, 4, P.brownLight, P.outline);
    pc.rect(x + 3, y + 4, 2, 4, P.brownShade); pc.rect(x + w - 5, y + 4, 2, 4, P.brownShade);
    const jars = [P.sage, P.peach, P.butter, P.blue];
    for (let i = 0, jx = x + 3; jx < x + w - 8; i += 1, jx += 11) {
      const jh = 9 + (i % 2) * 3;
      pc.box(jx, y - jh, 8, jh + 1, jars[i % jars.length], P.outline, 1);
      pc.box(jx + 1, y - jh - 2, 6, 3, P.brownLight, P.outline);
      pc.vline(jx + 2, y - jh + 2, jh - 4, P.white);
    }
  },

  wallArt(pc, { x, y, w = 24, h = 18, colour = P.sage }) {
    pc.box(x, y, w, h, P.brownLight, P.outline);
    pc.box(x + 2, y + 2, w - 4, h - 4, P.cream, P.outlineLight);
    pc.ellipse(x + w - 8, y + 6, 2, 2, P.butterShade);
    for (let i = 3; i < w - 3; i += 1) {
      const top = y + h - 5 - Math.round(Math.abs(Math.sin(i / 3)) * 4);
      pc.vline(x + i, top, y + h - 3 - top, colour);
    }
  },

  clock(pc, { x, y }) {
    pc.ellipseBox(x, y, 7, 7, P.cream, P.outline);
    pc.vline(x, y - 4, 5, P.ink); pc.hline(x, y, 4, P.ink);
  },

  counter(pc, { x, y, w = 180, h = 50, colour = P.sage }) {
    const top = 20;
    pc.box(x, y, w, top, P.creamShade, P.outline);
    pc.hline(x + 1, y + 1, w - 2, P.white);
    for (let i = 3; i < w - 3; i += 7) pc.set(x + i, y + 5 + ((i * 7) % (top - 8)), P.grey);
    pc.box(x, y + top - 1, w, h - top, colour, P.outline);
    const doors = Math.max(1, Math.round(w / 30));
    const dw = Math.floor(w / doors);
    for (let d = 0; d < doors; d += 1) {
      const dx = x + d * dw;
      pc.box(dx + 3, y + top + 3, dw - 5, h - top - 9, colour, P.outlineLight);
      pc.rect(dx + Math.floor(dw / 2) - 2, y + top + 6, 4, 2, P.brownShade);
    }
    pc.rect(x + 1, y + h - 4, w - 2, 3, P.sageShade);
    pc.hline(x, y + h - 1, w, P.outline);
  },

  sink(pc, { x, y, w = 34, h = 14 }) {
    pc.box(x, y, w, h, P.greyLight, P.outline, 1);
    pc.box(x + 3, y + 3, w - 6, h - 5, P.blueLight, P.outlineLight, 1);
    pc.rect(x + 4, y + h - 5, w - 8, 2, P.blue);
    pc.box(x + Math.floor(w / 2) - 2, y - 5, 4, 7, P.grey, P.outline);
    pc.box(x + Math.floor(w / 2) - 5, y - 6, 10, 3, P.grey, P.outline);
  },

  stove(pc, { x, y, w = 36, h = 16 }) {
    pc.box(x, y, w, h, P.greyLight, P.outline, 1);
    for (const bx of [x + 9, x + w - 10]) {
      pc.ellipseBox(bx, y + Math.floor(h / 2), 5, 4, P.grey, P.ink);
      pc.ellipse(bx, y + Math.floor(h / 2), 2, 1, P.greyShade);
    }
  },

  floorTable(pc, { x, y, w = 64, h = 34, colour = P.brownLight }) {
    shadow(pc, x - 2, y + h - 6, w + 4, 14);
    const cx = x + w / 2; const cy = y + h / 2;
    for (const lx of [x + 8, x + w - 10]) pc.box(lx, y + h - 6, 3, 12, P.brownShade, P.outline);
    pc.ellipse(cx, cy + 3, w / 2, h / 2, P.outline);
    pc.ellipse(cx, cy + 2, w / 2 - 1, h / 2 - 1, P.brown);
    pc.ellipse(cx, cy, w / 2, h / 2, P.outline);
    pc.ellipse(cx, cy, w / 2 - 1, h / 2 - 1, colour);
    pc.ellipse(cx - 8, cy - 4, w / 2 - 14, h / 2 - 9, P.creamShade);
  },

  chair(pc, { x, y, colour = P.peach }) {
    shadow(pc, x - 1, y + 12, 18, 8);
    pc.box(x + 2, y + 12, 3, 6, P.brownShade, P.outline); pc.box(x + 11, y + 12, 3, 6, P.brownShade, P.outline);
    pc.box(x, y, 16, 6, P.brownLight, P.outline, 1);
    pc.box(x, y + 5, 16, 9, colour, P.outline, 1);
    pc.hline(x + 2, y + 7, 12, P.peachLight);
  },

  rug(pc, { x, y, w = 90, h = 60, colour = P.peach }) {
    pc.box(x, y, w, h, colour, P.outline, 2);
    pc.box(x + 4, y + 4, w - 8, h - 8, colour, P.peachShade, 1);
    pc.box(x + 8, y + 8, w - 16, h - 16, P.peachLight, P.peachShade, 1);
    const cx = x + Math.floor(w / 2); const cy = y + Math.floor(h / 2);
    for (let d = 0; d < Math.min(w, h) / 2 - 12; d += 1) {
      pc.set(cx - d, cy - (Math.min(w, h) / 2 - 12 - d), colour); pc.set(cx + d, cy - (Math.min(w, h) / 2 - 12 - d), colour);
      pc.set(cx - d, cy + (Math.min(w, h) / 2 - 12 - d), colour); pc.set(cx + d, cy + (Math.min(w, h) / 2 - 12 - d), colour);
    }
    for (let i = x + 14; i < x + w - 14; i += 10) { pc.set(i, y + 11, colour); pc.set(i, y + h - 12, colour); }
    for (let i = x + 4; i < x + w - 3; i += 4) { pc.vline(i, y - 2, 2, P.outlineLight); pc.vline(i, y + h, 2, P.outlineLight); }
  },

  sofa(pc, { x, y, w = 96, colour = P.sage }) {
    shadow(pc, x - 2, y + 40, w + 4, 10);
    pc.box(x, y, w, 16, P.sageShade, P.outline, 2);
    pc.hline(x + 3, y + 2, w - 6, colour);
    pc.box(x, y + 12, 12, 32, colour, P.outline, 1); pc.box(x + w - 12, y + 12, 12, 32, colour, P.outline, 1);
    const seats = 2; const sw = Math.floor((w - 24) / seats);
    for (let s = 0; s < seats; s += 1) {
      pc.box(x + 12 + s * sw, y + 14, sw, 20, colour, P.outline, 1);
      pc.hline(x + 14 + s * sw, y + 16, sw - 4, P.sageLight);
    }
    pc.box(x + 2, y + 33, w - 4, 11, P.sageShade, P.outline);
    for (let i = x + 6; i < x + w - 6; i += 4) pc.set(i, y + 38, P.sage);
    // A folded throw over one arm.
    pc.box(x + w - 16, y + 12, 14, 22, P.peach, P.outline, 1);
    for (let j = y + 15; j < y + 32; j += 3) pc.hline(x + w - 14, j, 10, P.peachShade);
  },

  coffeeTable(pc, { x, y, w = 44, h = 22 }) {
    shadow(pc, x - 2, y + h - 2, w + 4, 8);
    pc.box(x, y, w, h - 5, P.brownLight, P.outline, 1);
    pc.hline(x + 2, y + 2, w - 4, P.creamShade);
    pc.box(x, y + h - 6, w, 6, P.brown, P.outline);
  },

  bookshelf(pc, { x, y, w = 40, h = 70 }) {
    pc.box(x, y, w, 6, P.brownLight, P.outline);
    pc.box(x, y + 5, w, h - 5, P.brown, P.outline);
    const books = [P.peach, P.sage, P.blue, P.butter, P.peachShade, P.blueShade, P.sageShade];
    let n = 0;
    for (let sy = y + 8; sy < y + h - 12; sy += 18) {
      pc.rect(x + 2, sy, w - 4, 14, P.brownShade);
      for (let bx = x + 3; bx < x + w - 5; bx += 4) {
        const bh = 9 + ((n * 7) % 5);
        pc.box(bx, sy + 14 - bh, 4, bh, books[n % books.length], P.outline);
        n += 1;
      }
      pc.hline(x + 1, sy + 14, w - 2, P.brownLight);
    }
    pc.box(x + w - 12, y - 6, 8, 7, P.peach, P.outline, 1);
    pc.ellipseBox(x + w - 8, y - 9, 4, 3, P.sage, P.sageShade);
  },

  bed(pc, { x, y, w = 76, h = 108, colour = P.blue }) {
    shadow(pc, x - 3, y + h - 6, w + 6, 12);
    pc.box(x - 2, y - 18, w + 4, 22, P.brown, P.outline, 2);
    pc.hline(x + 1, y - 15, w - 2, P.brownLight);
    pc.box(x, y, w, h, P.cream, P.outline, 1);
    const pw = Math.floor(w / 2) - 6;
    pc.box(x + 4, y + 4, pw, 16, P.white, P.outlineLight, 2); pc.box(x + w - 4 - pw, y + 4, pw, 16, P.white, P.outlineLight, 2);
    pc.box(x, y + 26, w, h - 26, colour, P.outline, 1);
    pc.box(x + 1, y + 26, w - 2, 8, P.blueLight, P.outlineLight);
    for (let qy = y + 36; qy < y + h - 8; qy += 12) {
      for (let qx = x + 2; qx < x + w - 2; qx += 12) {
        pc.rect(qx, qy, 1, 12, P.blueShade); pc.hline(qx, qy, 12, P.blueShade);
        if (((qx + qy) / 12) % 2 === 0) { pc.set(qx + 6, qy + 6, P.blueLight); pc.set(qx + 5, qy + 6, P.blueLight); pc.set(qx + 6, qy + 5, P.blueLight); pc.set(qx + 7, qy + 6, P.blueLight); pc.set(qx + 6, qy + 7, P.blueLight); }
      }
    }
    pc.box(x, y + h - 6, w, 6, P.blueShade, P.outline);
  },

  nightstand(pc, { x, y }) {
    shadow(pc, x - 1, y + 20, 22, 6);
    pc.box(x, y, 20, 10, P.brownLight, P.outline);
    pc.box(x, y + 9, 20, 13, P.brown, P.outline);
    pc.rect(x + 8, y + 14, 4, 2, P.brownShade);
  },

  tableLamp(pc, { x, y }) {
    pc.box(x + 3, y + 6, 4, 6, P.cream, P.outline);
    pc.box(x, y, 10, 8, P.butter, P.outline, 1);
    pc.hline(x + 1, y + 1, 8, P.butterLight);
  },

  floorLamp(pc, { x, y }) {
    pc.ellipse(x + 7, y + 34, 6, 2, P.brownShade);
    pc.vline(x + 7, y + 10, 24, P.outline);
    pc.ellipseBox(x + 7, y + 6, 8, 6, P.butter, P.outline);
    pc.ellipse(x + 5, y + 4, 4, 2, P.butterLight);
  },

  plant(pc, { x, y, colour = P.peach }) {
    shadow(pc, x, y + 18, 18, 6);
    pc.box(x + 2, y + 10, 14, 12, colour, P.outline, 1);
    pc.hline(x + 3, y + 12, 12, P.peachShade);
    const leaves: [number, number][] = [[9, 2], [4, 5], [14, 5], [7, 8], [12, 8], [9, -2]];
    leaves.forEach(([lx, ly]) => pc.ellipseBox(x + lx, y + ly, 3, 4, P.sage, P.sageShade));
    pc.vline(x + 9, y + 1, 9, P.sageShade);
  },

  mirror(pc, { x, y, w = 22, h = 50 }) {
    shadow(pc, x - 2, y + h - 4, w + 4, 8);
    pc.box(x, y, w, h, P.butter, P.outline, 3);
    pc.box(x + 3, y + 3, w - 6, h - 6, P.blueLight, P.outlineLight, 2);
    pc.line(x + 6, y + 10, x + 12, y + 4, P.white); pc.line(x + 6, y + 16, x + 15, y + 7, P.white);
  },

  laundryBasket(pc, { x, y, w = 26, h = 20 }) {
    shadow(pc, x - 1, y + h - 4, w + 2, 8);
    pc.box(x, y, w, h, P.butterShade, P.outline, 2);
    pc.box(x + 3, y + 2, w - 6, 6, P.brownShade, P.outline, 1);
    for (let j = y + 10; j < y + h - 1; j += 3) pc.hline(x + 1, j, w - 2, P.butter);
  },

  toyBox(pc, { x, y, w = 28, h = 20 }) {
    shadow(pc, x - 1, y + h - 4, w + 2, 8);
    pc.box(x, y, w, 7, P.sageShade, P.outline);
    pc.rect(x + 2, y + 2, w - 4, 4, P.ink);
    pc.box(x, y + 6, w, h - 6, P.sage, P.outline);
    pc.ellipseBox(x + Math.floor(w / 2), y + 12, 3, 3, P.butter, P.outline);
  },

  fruitBowl(pc, { x, y }) {
    pc.box(x, y + 3, 18, 6, P.blue, P.outline, 2);
    pc.hline(x + 2, y + 4, 14, P.blueLight);
  },

  mug(pc, { x, y, colour = P.peach }) {
    pc.box(x, y, 6, 6, colour, P.outline);
    pc.rect(x + 1, y + 1, 4, 1, P.brownShade);
    pc.vline(x + 6, y + 2, 2, P.outline);
  },

  potRack(pc, { x, y }) {
    pc.hline(x, y, 40, P.outline);
    [[4, P.peachShade], [16, P.grey], [28, P.blueShade]].forEach(([dx, c]) => {
      pc.vline(x + (dx as number) + 3, y, 3, P.outline);
      pc.box(x + (dx as number), y + 3, 8, 8, c as string, P.outline, 1);
    });
  },

  tv(pc, { x, y, w = 44 }) {
    pc.box(x, y, w, 24, P.ink, P.outline, 1);
    pc.box(x + 2, y + 2, w - 4, 20, P.blueShade, P.ink);
    pc.line(x + 5, y + 5, x + 10, y + 4, P.blueLight);
    pc.box(x + Math.floor(w / 2) - 6, y + 24, 12, 3, P.brownShade, P.outline);
  },

  fairyLights(pc, { x, y, w = 160 }) {
    const colours = [P.butterShade, P.peach, P.sage, P.blue];
    for (let i = 0; i < w; i += 1) {
      const sag = Math.round(Math.sin((i / w) * Math.PI * 3) ** 2 * 5);
      pc.set(x + i, y + sag, P.outline);
      if (i % 10 === 5) { pc.rect(x + i - 1, y + sag + 1, 3, 3, colours[(i / 10 | 0) % 4]); pc.set(x + i, y + sag + 1, P.white); }
    }
  },

  cushion(pc, { x, y, colour = P.butter }) {
    pc.box(x, y, 18, 14, colour, P.outline, 2);
    pc.hline(x + 3, y + 3, 12, P.white);
    pc.set(x + 9, y + 7, P.butterShade);
  },

  dresser(pc, { x, y, w = 40, h = 34 }) {
    pc.box(x, y, w, 7, P.brownLight, P.outline);
    pc.box(x, y + 6, w, h - 6, P.peach, P.outline);
    for (let d = y + 9; d < y + h - 4; d += 8) {
      pc.box(x + 3, d, w - 6, 7, P.peach, P.peachShade);
      pc.rect(x + Math.floor(w / 2) - 2, d + 3, 4, 1, P.brownShade);
    }
  }
};

/** Draggable clutter for sort tasks: 14×14 cutouts with an outline. */
export const ITEM_SIZE = 14;
const ITEM_ART: Record<string, (pc: PixelCanvas) => void> = {
  mug(pc) { pc.box(3, 4, 8, 8, P.peach, P.outline, 1); pc.rect(4, 5, 6, 1, P.brownShade); pc.box(10, 6, 3, 4, P.peach, P.outline); },
  plate(pc) { pc.ellipseBox(7, 7, 6, 4, P.white, P.outline); pc.ellipse(7, 7, 3, 2, P.blueLight); },
  apple(pc) { pc.ellipseBox(7, 8, 5, 5, P.peach, P.outline); pc.set(5, 6, P.white); pc.vline(7, 1, 3, P.brownShade); pc.ellipse(9, 2, 2, 1, P.sage); },
  bread(pc) { pc.box(2, 4, 11, 8, P.butterShade, P.outline, 2); pc.hline(4, 6, 7, P.butter); },
  sock(pc) { pc.box(4, 1, 5, 8, P.blue, P.outline); pc.box(4, 7, 9, 5, P.blue, P.outline, 1); pc.hline(5, 3, 3, P.white); },
  shirt(pc) { pc.box(3, 3, 8, 10, P.sage, P.outline); pc.box(0, 3, 4, 5, P.sage, P.outline); pc.box(10, 3, 4, 5, P.sage, P.outline); pc.hline(5, 3, 4, P.sageShade); },
  book(pc) { pc.box(2, 2, 10, 11, P.blue, P.outline); pc.vline(4, 3, 9, P.blueShade); pc.hline(6, 5, 4, P.white); },
  teddy(pc) { pc.ellipseBox(4, 3, 2, 2, P.brownLight, P.outline); pc.ellipseBox(10, 3, 2, 2, P.brownLight, P.outline); pc.ellipseBox(7, 7, 5, 5, P.brownLight, P.outline); pc.set(5, 6, P.ink); pc.set(9, 6, P.ink); pc.rect(6, 8, 3, 2, P.cream); },
  blocks(pc) { pc.box(1, 6, 7, 7, P.butter, P.outline); pc.box(6, 1, 7, 7, P.peach, P.outline); pc.set(9, 4, P.white); }
};

export function drawItem(kind: string) {
  const pc = new PixelCanvas(ITEM_SIZE, ITEM_SIZE);
  (ITEM_ART[kind] ?? ITEM_ART.blocks)(pc);
  return pc;
}

/** Shy dust-bunny cousins for the pop task, two wiggle frames. */
export function drawDustBunny(frame: 0 | 1) {
  const pc = new PixelCanvas(14, 14);
  const lift = frame;
  pc.ellipse(5, 3 - lift, 1, 3, P.greyShade); pc.ellipse(9, 3 - lift, 1, 3, P.greyShade);
  pc.ellipse(7, 8, 5, 4, P.greyShade);
  for (let a = 0; a < 10; a += 1) { const t = (a / 10) * Math.PI * 2; pc.set(7 + Math.round(Math.cos(t) * 6), 8 + Math.round(Math.sin(t) * 5), P.greyShade); }
  pc.outlineShapes(P.outline);
  pc.set(5, 8, P.ink); pc.set(9, 8, P.ink); pc.set(4, 10, P.peach); pc.set(10, 10, P.peach);
  return pc;
}
