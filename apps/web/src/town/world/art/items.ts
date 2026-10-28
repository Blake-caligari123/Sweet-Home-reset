import { P } from '../../../shared/art/palette';
import { PixelCanvas, seeded } from '../../../shared/art/pixel-canvas';
import { T } from './texture';

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
    case 'crumbs':
      for (let i = 0; i < 9; i += 1) { const cx = 2 + Math.floor(r() * 12); const cy = 3 + Math.floor(r() * 10); pc.rect(cx, cy, 2, 1, P.butterShade); pc.set(cx, cy + 1, P.brownLight); }
      break;
    case 'fog':
      pc.ellipse(8, 8, 6, 5, P.blueLight, 170); pc.ellipse(6, 6, 3, 2, P.white, 190); pc.ellipse(11, 10, 2, 2, P.white, 150);
      break;
    case 'mud':
      pc.ellipse(8, 10, 6, 4, P.brownShade); pc.ellipse(6, 9, 3, 2, P.brown); pc.set(11, 8, P.brownLight); pc.set(4, 12, P.brownShade); pc.set(13, 13, P.brownShade);
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
    case 'biscuit': pc.ellipseBox(ox + 7, oy + 7, 5, 5, P.butterShade, P.outline); for (const [x, y] of [[5, 5], [9, 6], [6, 9], [9, 9]]) pc.set(ox + x, oy + y, P.brownShade); pc.set(ox + 5, oy + 4, P.butterLight); break;
    case 'flowers':
      pc.line(ox + 7, oy + 13, ox + 4, oy + 6, P.sageShade); pc.line(ox + 7, oy + 13, ox + 7, oy + 5, P.sageShade); pc.line(ox + 7, oy + 13, ox + 10, oy + 6, P.sageShade);
      pc.ellipseBox(ox + 4, oy + 4, 2, 2, P.peach, P.outline); pc.ellipseBox(ox + 10, oy + 4, 2, 2, P.butter, P.outline); pc.ellipseBox(ox + 7, oy + 3, 2, 2, P.blue, P.outline); break;
    case 'list': b(3, 2, 8, 10, P.white); for (const y of [4, 6, 8]) pc.hline(ox + 5, oy + y, 4, P.greyShade); pc.set(ox + 10, oy + 3, P.butterShade); break;
    case 'toy': pc.ellipseBox(ox + 7, oy + 8, 4, 4, P.blue, P.outline); pc.ellipseBox(ox + 5, oy + 4, 1, 2, P.blue, P.outline); pc.ellipseBox(ox + 9, oy + 4, 1, 2, P.blue, P.outline); pc.set(ox + 6, oy + 8, P.ink); pc.set(ox + 8, oy + 8, P.ink); pc.hline(ox + 9, oy + 11, 3, P.white); break;
    case 'string': pc.ellipseBox(ox + 7, oy + 7, 5, 5, P.peachLight, P.outline); pc.line(ox + 3, oy + 6, ox + 11, oy + 8, P.peachShade); pc.line(ox + 4, oy + 9, ox + 10, oy + 4, P.peachShade); pc.line(ox + 11, oy + 10, ox + 13, oy + 13, P.peachShade); break;
    case 'toy_boat': b(1, 8, 12, 4, P.peach, 1); pc.vline(ox + 7, oy + 1, 7, P.brownShade); b(8, 2, 4, 5, P.white); break;
    case 'towel': b(2, 3, 10, 9, P.blueLight, 1); pc.hline(ox + 3, oy + 5, 8, P.blue); pc.hline(ox + 3, oy + 9, 8, P.blue); pc.hline(ox + 3, oy + 11, 8, P.white); break;
    case 'shell':
      pc.ellipseBox(ox + 7, oy + 8, 5, 4, P.peachLight, P.outline);
      for (const dx of [-3, 0, 3]) pc.line(ox + 7, oy + 12, ox + 7 + dx, oy + 5, P.peachShade);
      pc.set(ox + 5, oy + 6, P.white); break;
    case 'bag': b(2, 4, 10, 9, P.brownLight, 2); pc.line(ox + 4, oy + 4, ox + 6, oy + 1, P.outline); pc.line(ox + 10, oy + 4, ox + 8, oy + 1, P.outline); pc.hline(ox + 4, oy + 7, 6, P.brown); break;
    case 'copper_sponge': b(1, 2, 12, 10, P.cream, 1); pc.hline(ox + 3, oy + 5, 8, P.greyShade); pc.hline(ox + 3, oy + 8, 6, P.greyShade); pc.ellipseBox(ox + 10, oy + 10, 2, 2, P.peachShade, P.outline); break;
    // Finds (the rewards overhaul).
    case 'button': pc.ellipseBox(ox + 7, oy + 7, 5, 5, P.peach, P.outline); for (const [x, y] of [[5, 5], [8, 5], [5, 8], [8, 8]]) pc.set(ox + x, oy + y, P.peachShade); pc.set(ox + 4, oy + 3, P.white); break;
    case 'ribbon': pc.ellipseBox(ox + 4, oy + 5, 3, 2, P.peach, P.outline); pc.ellipseBox(ox + 10, oy + 5, 3, 2, P.peach, P.outline); pc.line(ox + 6, oy + 7, ox + 3, oy + 12, P.peachShade); pc.line(ox + 8, oy + 7, ox + 11, oy + 12, P.peachShade); pc.ellipseBox(ox + 7, oy + 6, 1, 1, P.peachShade, P.outline); break;
    case 'old_coin': pc.ellipseBox(ox + 7, oy + 7, 5, 5, P.butterShade, P.outline); pc.ellipse(ox + 7, oy + 7, 3, 3, P.butter); pc.vline(ox + 7, oy + 5, 5, P.butterShade); pc.set(ox + 5, oy + 4, P.white); break;
    case 'pebble': pc.ellipseBox(ox + 7, oy + 8, 5, 4, P.blueLight, P.outline); pc.ellipse(ox + 6, oy + 7, 2, 1, P.white); pc.set(ox + 10, oy + 10, P.blue); break;
    case 'river_stone': pc.ellipseBox(ox + 7, oy + 8, 6, 3, P.greyLight, P.outline); pc.hline(ox + 4, oy + 8, 7, P.grey); pc.set(ox + 5, oy + 6, P.white); break;
    case 'acorn': pc.ellipseBox(ox + 7, oy + 9, 4, 4, P.brownLight, P.outline); b(2, 3, 10, 4, P.brownShade, 2); pc.vline(ox + 7, oy + 1, 2, P.outline); pc.set(ox + 5, oy + 9, P.white); break;
    case 'feather': pc.line(ox + 2, oy + 12, ox + 11, oy + 2, P.outline); for (let k = 0; k < 6; k += 1) { pc.line(ox + 4 + k, oy + 10 - k, ox + 2 + k, oy + 7 - k, P.blueLight); pc.line(ox + 4 + k, oy + 10 - k, ox + 7 + k, oy + 11 - k, P.blueLight); } break;
    case 'marble': pc.ellipseBox(ox + 7, oy + 7, 5, 5, P.blueLight, P.outline); pc.line(ox + 4, oy + 9, ox + 10, oy + 5, P.sage); pc.ellipse(ox + 5, oy + 5, 1, 1, P.white); break;
    case 'thimble': b(3, 4, 8, 8, P.greyLight, 2); for (const y of [6, 8, 10]) for (let x = 5; x < 10; x += 2) pc.set(ox + x, oy + y, P.greyShade); pc.hline(ox + 3, oy + 11, 8, P.grey); break;
    case 'tiny_key': pc.ellipseBox(ox + 4, oy + 5, 3, 3, P.butterShade, P.outline); pc.set(ox + 4, oy + 5, P.cream); b(6, 5, 7, 2, P.butterShade); b(10, 7, 2, 3, P.butterShade); break;
    case 'glimmer_drop': pc.ellipseBox(ox + 7, oy + 9, 4, 4, P.blueLight, P.outline); pc.line(ox + 7, oy + 2, ox + 4, oy + 7, P.outline); pc.line(ox + 7, oy + 2, ox + 10, oy + 7, P.outline); pc.ellipse(ox + 7, oy + 8, 2, 3, P.blueLight); pc.set(ox + 6, oy + 7, P.white); pc.set(ox + 11, oy + 2, P.butter); pc.set(ox + 2, oy + 4, P.butter); break;
    case 'golden_dust': pc.ellipseBox(ox + 7, oy + 8, 5, 4, P.butter, P.outline); pc.ellipse(ox + 6, oy + 7, 2, 2, P.butterLight); pc.set(ox + 5, oy + 7, P.ink); pc.set(ox + 9, oy + 7, P.ink); for (const [x, y] of [[1, 2], [12, 1], [13, 9], [0, 10]]) pc.set(ox + x, oy + y, P.butterShade); break;
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
