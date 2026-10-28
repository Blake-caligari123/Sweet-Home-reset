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
    case 'copper_duster':
      pc.line(ox + 3, oy + 12, ox + 9, oy + 5, P.brownShade); pc.rect(ox + 8, oy + 4, 3, 2, P.peachShade);
      pc.ellipseBox(ox + 10, oy + 3, 3, 2, P.creamShade, P.outline); pc.set(ox + 9, oy + 2, P.white); break;
    case 'copper_rake':
      pc.line(ox + 3, oy + 12, ox + 9, oy + 4, P.brownShade); pc.hline(ox + 6, oy + 3, 7, P.peachShade);
      for (const x of [6, 8, 10, 12]) pc.set(ox + x, oy + 4, P.peachShade); break;
    case 'carrot_seeds': case 'pea_seeds': case 'strawberry_seeds': {
      b(3, 1, 8, 12, P.butterLight, 1);
      const c = item === 'carrot_seeds' ? P.peachShade : item === 'pea_seeds' ? P.sage : P.peach;
      pc.ellipseBox(ox + 7, oy + 6, 2, 2, c, P.outline); pc.vline(ox + 7, oy + 2, 2, P.sage); break;
    }
    case 'carrot': pc.ellipseBox(ox + 7, oy + 8, 2, 5, P.peachShade, P.outline); pc.set(ox + 6, oy + 6, P.peach); pc.line(ox + 7, oy + 3, ox + 5, oy + 0, P.sageShade); pc.line(ox + 7, oy + 3, ox + 9, oy + 0, P.sageShade); break;
    case 'peas': pc.ellipseBox(ox + 7, oy + 7, 5, 2, P.sage, P.outline); for (const x of [4, 7, 10]) pc.ellipse(ox + x, oy + 7, 1, 1, P.sageLight); break;
    case 'strawberry': pc.ellipseBox(ox + 7, oy + 8, 4, 4, P.peachShade, P.outline); for (const [x, y] of [[5, 7], [8, 9], [9, 6]]) pc.set(ox + x, oy + y, P.butterLight); pc.hline(ox + 5, oy + 3, 5, P.sageShade); break;
    case 'twig':
      pc.line(ox + 2, oy + 11, ox + 12, oy + 3, P.brown); pc.line(ox + 3, oy + 11, ox + 12, oy + 4, P.brownShade);
      pc.line(ox + 7, oy + 7, ox + 5, oy + 3, P.brown); pc.ellipseBox(ox + 4, oy + 3, 1, 1, P.sage, P.outline); break;
    case 'pebble': pc.ellipseBox(ox + 7, oy + 8, 5, 4, P.grey, P.outline); pc.ellipse(ox + 6, oy + 7, 2, 1, P.greyLight); pc.set(ox + 5, oy + 6, P.white); break;
    case 'cushion': b(1, 4, 12, 8, P.peach, 3); pc.hline(ox + 3, oy + 7, 8, P.peachShade); pc.ellipseBox(ox + 7, oy + 8, 1, 1, P.peachShade, P.outline); pc.set(ox + 3, oy + 5, P.peachLight); break;
    default: b(3, 3, 8, 8, P.butter, 1);
  }
}

/** A crop in soil: seed, sprout, then ready, drawn by its look (round root, long root, pods, berries). */
export function drawCrop(stage: number, watered: boolean, look = 'round') {
  const pc = new PixelCanvas(T, T);
  if (watered) for (let y = 3; y < T; y += 5) pc.hline(1, y, 14, P.brownShade);
  if (stage === 0) { pc.set(7, 9, P.butterShade); pc.set(9, 8, P.butterShade); return pc; }
  if (stage === 1) { pc.line(8, 12, 8, 8, P.sageShade); pc.ellipse(6, 7, 2, 1, P.sage); pc.ellipse(10, 7, 2, 1, P.sage); return pc; }
  const leaves = () => { pc.line(8, 8, 5, 3, P.sageShade); pc.line(8, 8, 11, 3, P.sageShade); pc.ellipse(5, 3, 2, 1, P.sage); pc.ellipse(11, 3, 2, 1, P.sage); };
  switch (look) {
    case 'long': leaves(); pc.ellipseBox(8, 11, 2, 4, P.peachShade, P.outline); pc.set(7, 9, P.peach); break;
    case 'pod':
      pc.vline(8, 3, 11, P.sageShade);
      for (const [x, y] of [[5, 6], [11, 8], [5, 11]]) { pc.ellipseBox(x, y, 2, 1, P.sage, P.outline); pc.set(x, y, P.sageLight); }
      break;
    case 'berry':
      pc.ellipse(8, 9, 5, 3, P.sage); pc.ellipse(7, 8, 3, 2, P.sageLight);
      for (const [x, y] of [[4, 11], [9, 12], [12, 10]]) { pc.ellipseBox(x, y, 1, 1, P.peachShade, P.outline); pc.set(x, y - 1, P.white); }
      break;
    default: leaves(); pc.ellipseBox(8, 11, 3, 3, P.peach, P.outline);
  }
  return pc;
}
