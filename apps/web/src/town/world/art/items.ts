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
    case 'leaves': // an autumn leaf pile
      for (let i = 0; i < 6; i += 1) { const cx = 3 + Math.floor(r() * 10); const cy = 4 + Math.floor(r() * 9); pc.ellipse(cx, cy, 2, 1, [P.peach, P.peachShade, P.butterShade][i % 3]); pc.set(cx + 2, cy, P.brownShade); }
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
    case 'carrot_seeds': case 'pea_seeds': case 'strawberry_seeds': case 'tomato_seeds': case 'corn_seeds': case 'pumpkin_seeds': {
      b(3, 1, 8, 12, P.butterLight, 1);
      const c = item === 'carrot_seeds' || item === 'tomato_seeds' ? P.peachShade : item === 'pea_seeds' ? P.sage : item === 'corn_seeds' ? P.butter : P.peach;
      pc.ellipseBox(ox + 7, oy + 6, 2, 2, c, P.outline); pc.vline(ox + 7, oy + 2, 2, P.sage); break;
    }
    case 'apple': pc.ellipseBox(ox + 7, oy + 8, 4, 4, P.peachShade, P.outline); pc.set(ox + 5, oy + 6, P.peachLight); pc.vline(ox + 7, oy + 2, 2, P.brownShade); pc.ellipse(ox + 9, oy + 3, 2, 1, P.sage); break;
    case 'bread': b(2, 5, 11, 7, P.butterShade, 3); pc.hline(ox + 4, oy + 6, 7, P.butterLight); for (const x of [5, 8, 11]) pc.set(ox + x, oy + 8, P.brownLight); break;
    case 'berries': for (const [x, y] of [[5, 8], [9, 8], [7, 5], [7, 10]]) pc.ellipseBox(ox + x, oy + y, 2, 2, P.blueShade, P.outline); pc.set(ox + 6, oy + 4, P.white); pc.line(ox + 7, oy + 3, ox + 9, oy + 1, P.sageShade); break;
    case 'honey': b(3, 4, 8, 9, P.butter, 2); b(4, 2, 6, 3, P.brownLight, 1); pc.rect(ox + 5, oy + 7, 4, 3, P.butterShade); pc.set(ox + 4, oy + 6, P.white); break;
    case 'rare_seeds': b(3, 1, 8, 12, P.blueLight, 1); pc.ellipseBox(ox + 7, oy + 6, 2, 2, P.butter, P.outline); pc.set(ox + 7, oy + 6, P.white); pc.vline(ox + 7, oy + 2, 2, P.sage); break;
    case 'button': pc.ellipseBox(ox + 7, oy + 7, 4, 4, P.peach, P.outline); for (const [x, y] of [[6, 6], [8, 6], [6, 8], [8, 8]]) pc.set(ox + x, oy + y, P.peachShade); break;
    case 'silk_thread': b(4, 3, 6, 9, P.brownLight, 1); pc.rect(ox + 5, oy + 5, 4, 5, P.white); pc.line(ox + 9, oy + 7, ox + 12, oy + 11, P.white); break;
    case 'clay': pc.ellipseBox(ox + 7, oy + 8, 5, 4, P.peachShade, P.outline); pc.set(ox + 5, oy + 6, P.peach); break;
    case 'mud': pc.ellipseBox(ox + 7, oy + 9, 5, 3, P.brownShade, P.outline); pc.set(ox + 5, oy + 8, P.brown); break;
    case 'weeds': for (const x of [4, 7, 10]) { pc.line(ox + x, oy + 12, ox + x - 2, oy + 4, P.sageShade); pc.line(ox + x, oy + 12, ox + x + 2, oy + 5, P.sage); } break;
    case 'crumbs': for (const [x, y] of [[4, 8], [7, 6], [10, 9], [6, 10], [9, 4]]) { pc.rect(ox + x, oy + y, 2, 1, P.butterShade); pc.set(ox + x, oy + y + 1, P.brownLight); } break;
    case 'soap': b(2, 5, 10, 6, P.blueLight, 2); pc.hline(ox + 4, oy + 6, 6, P.white); pc.ellipse(ox + 11, oy + 3, 1, 1, P.white); pc.set(ox + 9, oy + 2, P.white); break;
    case 'fibre': for (let i = 0; i < 4; i += 1) pc.line(ox + 3 + i * 2, oy + 12, ox + 6 + i * 2, oy + 2, i % 2 ? P.butterShade : P.butter); break;
    case 'river_stone': pc.ellipseBox(ox + 7, oy + 8, 5, 3, P.greyLight, P.outline); pc.hline(ox + 5, oy + 7, 3, P.white); pc.set(ox + 9, oy + 9, P.blueLight); break;
    case 'mushroom': b(6, 7, 3, 6, P.cream); pc.ellipseBox(ox + 7, oy + 6, 5, 3, P.peachShade, P.outline); for (const [x, y] of [[5, 5], [9, 6]]) pc.set(ox + x, oy + y, P.white); break;
    case 'tea': b(3, 5, 8, 7, P.peach, 2); b(10, 7, 3, 3, P.peach); pc.rect(ox + 4, oy + 5, 6, 1, P.brownShade); pc.line(ox + 6, oy + 3, ox + 7, oy + 1, P.greyLight); break;
    case 'old_map': b(2, 3, 11, 9, P.cream, 1); pc.line(ox + 4, oy + 9, ox + 10, oy + 5, P.brownLight); pc.set(ox + 10, oy + 5, P.peachShade); pc.set(ox + 9, oy + 4, P.peachShade); break;
    case 'lint': for (const [x, y] of [[5, 7], [8, 6], [9, 9], [6, 9]]) pc.ellipse(ox + x, oy + y, 2, 1, P.greyLight); pc.set(ox + 7, oy + 7, P.blueLight); break;
    case 'cobweb': pc.line(ox + 2, oy + 2, ox + 12, oy + 12, P.greyLight); pc.line(ox + 2, oy + 2, ox + 12, oy + 6, P.greyLight); pc.line(ox + 2, oy + 2, ox + 6, oy + 12, P.greyLight); pc.line(ox + 8, oy + 3, ox + 3, oy + 8, P.greyLight); break;
    case 'tomato': pc.ellipseBox(ox + 7, oy + 8, 4, 4, P.peachShade, P.outline); pc.set(ox + 5, oy + 6, P.peachLight); pc.hline(ox + 6, oy + 3, 3, P.sageShade); pc.set(ox + 7, oy + 2, P.sageShade); break;
    case 'corn': pc.ellipseBox(ox + 7, oy + 7, 2, 5, P.butter, P.outline); for (let y = 4; y < 11; y += 2) pc.set(ox + 7, oy + y, P.butterShade); pc.line(ox + 5, oy + 12, ox + 3, oy + 6, P.sage); pc.line(ox + 9, oy + 12, ox + 11, oy + 6, P.sage); break;
    case 'pumpkin': pc.ellipseBox(ox + 7, oy + 8, 5, 4, P.peach, P.outline); pc.vline(ox + 5, oy + 5, 6, P.peachShade); pc.vline(ox + 9, oy + 5, 6, P.peachShade); pc.rect(ox + 7, oy + 2, 1, 2, P.sageShade); break;
    case 'carrot': pc.ellipseBox(ox + 7, oy + 8, 2, 5, P.peachShade, P.outline); pc.set(ox + 6, oy + 6, P.peach); pc.line(ox + 7, oy + 3, ox + 5, oy + 0, P.sageShade); pc.line(ox + 7, oy + 3, ox + 9, oy + 0, P.sageShade); break;
    case 'peas': pc.ellipseBox(ox + 7, oy + 7, 5, 2, P.sage, P.outline); for (const x of [4, 7, 10]) pc.ellipse(ox + x, oy + 7, 1, 1, P.sageLight); break;
    case 'strawberry': pc.ellipseBox(ox + 7, oy + 8, 4, 4, P.peachShade, P.outline); for (const [x, y] of [[5, 7], [8, 9], [9, 6]]) pc.set(ox + x, oy + y, P.butterLight); pc.hline(ox + 5, oy + 3, 5, P.sageShade); break;
    case 'veggie_soup': pc.ellipseBox(ox + 7, oy + 9, 6, 3, P.cream, P.outline); pc.ellipse(ox + 7, oy + 8, 5, 1, P.peachShade); pc.set(ox + 5, oy + 8, P.sage); pc.set(ox + 9, oy + 8, P.peach); for (const x of [5, 8]) pc.vline(ox + x, oy + 2, 3, P.white); break;
    case 'pea_fritters': for (const [x, y] of [[5, 8], [9, 7], [7, 10]]) { pc.ellipseBox(ox + x, oy + y, 3, 2, P.butterShade, P.outline); pc.set(ox + x - 1, oy + y, P.sage); } break;
    case 'lost_button': pc.ellipseBox(ox + 7, oy + 7, 5, 5, P.blue, P.outline); for (const [x, y] of [[5, 5], [9, 5], [5, 9], [9, 9]]) pc.set(ox + x, oy + y, P.blueShade); pc.set(ox + 5, oy + 4, P.white); break;
    case 'thimble': b(4, 4, 6, 8, P.grey, 2); for (let y = 6; y < 11; y += 2) for (let x = 5; x < 10; x += 2) pc.set(ox + x, oy + y, P.greyShade); pc.set(ox + 5, oy + 5, P.white); break;
    case 'glass_marble': pc.ellipseBox(ox + 7, oy + 7, 4, 4, P.blueLight, P.outline); pc.line(ox + 5, oy + 9, ox + 9, oy + 5, P.peach); pc.set(ox + 5, oy + 5, P.white); break;
    case 'old_coin': pc.ellipseBox(ox + 7, oy + 7, 5, 5, P.butterShade, P.outline); pc.ellipse(ox + 7, oy + 7, 3, 3, P.butter); pc.vline(ox + 7, oy + 5, 5, P.butterShade); break;
    case 'tiny_key': pc.ellipseBox(ox + 4, oy + 5, 2, 2, P.butterShade, P.outline); pc.hline(ox + 6, oy + 5, 6, P.butterShade); pc.vline(ox + 11, oy + 5, 3, P.butterShade); pc.vline(ox + 9, oy + 5, 2, P.butterShade); break;
    case 'pressed_flower': b(2, 2, 10, 10, P.cream, 1); pc.ellipseBox(ox + 7, oy + 6, 2, 2, P.peach, P.outline); pc.vline(ox + 7, oy + 8, 3, P.sageShade); break;
    case 'sea_glass': pc.ellipseBox(ox + 7, oy + 8, 4, 3, P.sageLight, P.outline); pc.set(ox + 6, oy + 7, P.white); pc.set(ox + 8, oy + 9, P.sage); break;
    case 'blue_feather': pc.line(ox + 3, oy + 12, ox + 11, oy + 2, P.blueShade); pc.ellipse(ox + 8, oy + 6, 2, 4, P.blue); pc.line(ox + 3, oy + 12, ox + 11, oy + 2, P.blueShade); break;
    case 'flower_pot': b(4, 7, 6, 6, P.peachShade, 1); pc.ellipse(ox + 7, oy + 5, 4, 3, P.sage); pc.set(ox + 5, oy + 3, P.peach); pc.set(ox + 9, oy + 4, P.butter); break;
    case 'lantern': b(4, 3, 6, 8, P.butterLight, 1); pc.rect(ox + 6, oy + 5, 2, 4, P.white); pc.hline(ox + 3, oy + 2, 8, P.ink); pc.hline(ox + 5, oy + 12, 4, P.ink); break;
    case 'fence_post': for (const x of [3, 9]) b(x, 3, 2, 10, P.brownLight); b(1, 5, 12, 2, P.brownLight); b(1, 9, 12, 2, P.brown); break;
    case 'stone_path': for (const [x, y] of [[2, 3], [7, 2], [3, 8], [8, 7]]) { pc.ellipseBox(ox + x + 2, oy + y + 2, 2, 2, P.greyLight, P.outline); } break;
    case 'bottle': b(5, 2, 4, 3, P.brownLight, 1); b(3, 5, 8, 8, P.blueLight, 2); pc.rect(ox + 5, oy + 7, 4, 4, P.cream); pc.hline(ox + 6, oy + 8, 2, P.greyShade); pc.set(ox + 4, oy + 6, P.white); break;
    case 'envelope': b(2, 4, 10, 7, P.cream, 1); pc.line(ox + 3, oy + 5, ox + 7, oy + 8, P.creamShade); pc.line(ox + 11, oy + 5, ox + 7, oy + 8, P.creamShade); pc.ellipseBox(ox + 7, oy + 8, 1, 1, P.peachShade, P.peachShade); break;
    case 'ore_silver': pc.ellipseBox(ox + 7, oy + 8, 5, 4, P.greyShade, P.outline); for (const [x, y] of [[5, 7], [8, 9], [9, 6]]) { pc.set(ox + x, oy + y, P.greyLight); pc.set(ox + x + 1, oy + y, P.white); } break;
    case 'ore_copper': pc.ellipseBox(ox + 7, oy + 8, 5, 4, P.greyShade, P.outline); for (const [x, y] of [[5, 7], [8, 9], [9, 6]]) { pc.set(ox + x, oy + y, P.peachShade); pc.set(ox + x + 1, oy + y, P.peach); } break;
    case 'gem_blue': pc.ellipseBox(ox + 7, oy + 8, 4, 4, P.blue, P.outline); pc.rect(ox + 5, oy + 6, 2, 2, P.blueLight); pc.set(ox + 5, oy + 6, P.white); pc.set(ox + 9, oy + 10, P.blueShade); break;
    case 'shard_colour': pc.line(ox + 4, oy + 12, ox + 7, oy + 2, P.blueLight); pc.ellipseBox(ox + 7, oy + 7, 3, 5, P.blueLight, P.outline); pc.set(ox + 6, oy + 5, P.white); pc.set(ox + 8, oy + 9, P.peach); break;
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
    case 'stalk': // corn: a tall stalk with a golden cob
      pc.vline(8, 1, 13, P.sageShade); pc.line(8, 6, 4, 3, P.sage); pc.line(8, 9, 12, 5, P.sage);
      pc.ellipseBox(10, 9, 1, 3, P.butter, P.outline);
      break;
    case 'pumpkin':
      pc.line(8, 6, 4, 3, P.sageShade); pc.ellipse(4, 3, 2, 1, P.sage);
      pc.ellipseBox(8, 10, 5, 4, P.peach, P.outline); pc.vline(6, 8, 5, P.peachShade); pc.vline(10, 8, 5, P.peachShade); pc.set(8, 6, P.sageShade);
      break;
    default: leaves(); pc.ellipseBox(8, 11, 3, 3, P.peach, P.outline);
  }
  return pc;
}
