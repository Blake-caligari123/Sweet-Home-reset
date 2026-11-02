import { P } from '../../../shared/art/palette';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';

// The Keeper's satchel (UI redesign, 2 Nov: Blake, "it looks very ai generated"): every panel,
// button and tag is a little made thing drawn in the world's own 24 colours: parchment with
// stitching and brass pins, wooden plaques, paper tags, a ribbon, a wooden shelf of slots.
// Each is a small pixel picture used as a 9-slice CSS border-image (skin.css), so the UI is
// pixel art at the same scale as the town instead of rounded web boxes.

export interface Frame { name: string; pc: PixelCanvas; slice: [number, number, number, number] }

const W = (w: number, h: number) => new PixelCanvas(w, h);

/** Parchment: an ink edge, a soft inner edge, a running stitch, and brass pins in the corners. */
function paper(): Frame {
  const pc = W(18, 18);
  pc.rect(1, 1, 16, 16, P.cream);
  pc.rect(0, 1, 1, 16, P.ink); pc.rect(17, 1, 1, 16, P.ink); pc.rect(1, 0, 16, 1, P.ink); pc.rect(1, 17, 16, 1, P.ink);
  pc.rect(1, 1, 16, 1, P.white); pc.rect(1, 16, 16, 1, P.creamShade); pc.rect(16, 1, 1, 16, P.creamShade);
  // Running stitch, three pixels in from the edge.
  for (let i = 4; i < 14; i += 3) { pc.set(i, 3, P.brownLight); pc.set(i + 1, 3, P.brownLight); pc.set(i, 14, P.brownLight); pc.set(i + 1, 14, P.brownLight); pc.set(3, i, P.brownLight); pc.set(3, i + 1, P.brownLight); pc.set(14, i, P.brownLight); pc.set(14, i + 1, P.brownLight); }
  for (const [x, y] of [[2, 2], [14, 2], [2, 14], [14, 14]]) { pc.rect(x, y, 2, 2, P.butterShade); pc.set(x, y, P.butterLight); pc.set(x + 1, y + 1, P.brownShade); }
  return { name: 'paper', pc, slice: [6, 6, 6, 6] };
}

/** A wooden plaque: grain in the frame, a raised face, a deeper bottom edge for the press. */
function plank(face: string, faceLight: string, down = false): PixelCanvas {
  const pc = W(14, 16);
  const top = down ? 2 : 0;
  pc.rect(1, top, 12, 16 - top, P.ink); pc.rect(0, top + 1, 14, 14 - top, P.ink);
  pc.rect(1, top + 1, 12, 13 - top - (down ? 0 : 2), P.brown);
  if (!down) pc.rect(1, 13, 12, 2, P.brownShade);
  // Grain on the frame.
  pc.hline(2, top + 1, 9, P.brownLight); pc.set(4, top + 2, P.brownShade); pc.set(10, top + 2, P.brownShade);
  pc.rect(3, top + 3, 8, 8 - (down ? 0 : 0), face);
  pc.hline(3, top + 3, 8, faceLight);
  pc.set(1, top + 1, P.brownShade); pc.set(12, top + 1, P.brownShade);
  return pc;
}

/** A paper tag for the HUD's little readouts, with its string hole on the left. */
function tag(): Frame {
  const pc = W(14, 12);
  pc.rect(1, 1, 12, 10, P.cream);
  pc.hline(2, 0, 11, P.ink); pc.hline(2, 11, 11, P.ink); pc.vline(13, 1, 10, P.ink); pc.vline(0, 2, 8, P.ink); pc.set(1, 1, P.ink); pc.set(1, 10, P.ink);
  pc.hline(2, 1, 10, P.white); pc.hline(2, 10, 11, P.creamShade);
  pc.rect(3, 5, 2, 2, P.outline); pc.set(3, 5, P.ink);
  return { name: 'tag', pc, slice: [4, 4, 4, 6] };
}

/** A ribbon with notched tails, for banners and the place name. */
function ribbon(): Frame {
  const pc = W(24, 14);
  pc.rect(4, 1, 16, 12, P.butter);
  pc.hline(4, 0, 16, P.ink); pc.hline(4, 13, 16, P.ink); pc.hline(5, 1, 14, P.butterLight); pc.hline(5, 11, 14, P.butterShade); pc.hline(5, 12, 14, P.butterShade);
  for (const [x0, dir] of [[0, 1], [23, -1]] as const) {
    for (let y = 1; y < 13; y += 1) {
      const notch = Math.abs(y - 6.5) < 3 ? Math.round(3 - Math.abs(y - 6.5)) : 0;
      for (let i = notch; i < 4; i += 1) pc.set(x0 + dir * i, y, P.peach);
      pc.set(x0 + dir * notch, y, P.ink);
    }
    pc.hline(Math.min(x0, x0 + dir * 3), 0, 4, P.ink); pc.hline(Math.min(x0, x0 + dir * 3), 13, 4, P.ink);
  }
  return { name: 'ribbon', pc, slice: [5, 8, 5, 8] };
}

/** An inventory slot set into the shelf: shadowed inside top-left, lit bottom-right. */
function slot(on: boolean): Frame {
  const pc = W(12, 12);
  pc.rect(0, 0, 12, 12, P.ink);
  pc.rect(1, 1, 10, 10, on ? P.butter : P.creamShade);
  pc.hline(1, 1, 10, on ? P.butterShade : P.brownLight); pc.vline(1, 1, 10, on ? P.butterShade : P.brownLight);
  pc.hline(1, 10, 10, on ? P.butterLight : P.cream); pc.vline(10, 1, 10, on ? P.butterLight : P.cream);
  if (on) for (const [x, y] of [[0, 0], [11, 0], [0, 11], [11, 11]]) pc.set(x, y, P.white);
  return { name: on ? 'slot-on' : 'slot', pc, slice: [3, 3, 3, 3] };
}

/** The wooden shelf the tools sit on. */
function shelf(): Frame {
  const pc = W(16, 16);
  pc.rect(0, 0, 16, 16, P.ink);
  pc.rect(1, 1, 14, 14, P.brown);
  pc.hline(1, 1, 14, P.brownLight); pc.rect(1, 13, 14, 2, P.brownShade);
  for (const [x, y, w] of [[3, 4, 5], [9, 7, 4], [2, 10, 6]]) pc.hline(x, y, w, P.brownShade);
  for (const [x, y] of [[2, 2], [13, 2]]) { pc.set(x, y, P.butterShade); }
  return { name: 'shelf', pc, slice: [5, 5, 5, 5] };
}

/** Every frame the skin uses. */
export function frames(): Frame[] {
  return [
    paper(), tag(), ribbon(), slot(false), slot(true), shelf(),
    { name: 'wood', pc: plank(P.butterLight, P.white), slice: [5, 5, 7, 5] },
    { name: 'wood-down', pc: plank(P.butterLight, P.cream, true), slice: [7, 5, 5, 5] },
    { name: 'moss', pc: plank(P.sage, P.sageLight), slice: [5, 5, 7, 5] },
    { name: 'moss-down', pc: plank(P.sage, P.sageLight, true), slice: [7, 5, 5, 5] }
  ];
}

/** A tiny tile of parchment grain for panel backgrounds. */
function grain(): PixelCanvas {
  const pc = W(8, 8);
  pc.rect(0, 0, 8, 8, P.cream);
  for (const [x, y] of [[1, 2], [5, 1], [3, 5], [6, 6], [0, 7]]) pc.set(x, y, P.creamShade);
  pc.set(4, 3, P.butterLight);
  return pc;
}

/** The title screen's wallpaper: butter with little sprigs, a cottage pattern. */
function wallpaper(): PixelCanvas {
  const pc = W(24, 24);
  pc.rect(0, 0, 24, 24, P.butterLight);
  for (const [x, y] of [[5, 5], [17, 17]]) { pc.vline(x, y - 2, 4, P.sageShade); pc.set(x - 1, y - 1, P.sage); pc.set(x + 1, y - 2, P.sage); pc.set(x, y - 3, P.peach); }
  for (const [x, y] of [[17, 5], [5, 17]]) { pc.set(x, y, P.butterShade); pc.set(x + 1, y, P.butterShade); pc.set(x, y + 1, P.butterShade); }
  return pc;
}

/** Turn a pixel picture into a data URL (in the browser). */
export function dataUrl(pc: PixelCanvas): string {
  const c = document.createElement('canvas'); c.width = pc.width; c.height = pc.height;
  c.getContext('2d')!.putImageData(new ImageData(pc.data, pc.width, pc.height), 0, 0);
  return c.toDataURL();
}

/** Put every frame on :root as a CSS variable (--frame-paper, --slice-paper, ...). */
export function installFrames(root = document.documentElement) {
  for (const f of frames()) {
    root.style.setProperty(`--frame-${f.name}`, `url("${dataUrl(f.pc)}")`);
    root.style.setProperty(`--slice-${f.name}`, f.slice.join(' '));
  }
  root.style.setProperty('--grain', `url("${dataUrl(grain())}")`);
  root.style.setProperty('--wallpaper', `url("${dataUrl(wallpaper())}")`);
}
