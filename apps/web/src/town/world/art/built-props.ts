import { P } from '../../../shared/art/palette';
import { PixelCanvas, seeded } from '../../../shared/art/pixel-canvas';
import type { PropDef } from './props';
import { T } from './texture';

/**
 * What the town builds and places (code-drawn): the Keeper's plans board, scaffolding and frames,
 * the buildings and their upgrades, the greenhouse, a newcomer's cottage, the footbridge and sea steps (broken,
 * then mended), the lighthouse, and decor (flower pots, lanterns, fences).
 */
export function drawBuiltProp(pc: PixelCanvas, p: PropDef) {
  const x = p.x * T; const y = p.y * T; const w = (p.w ?? 1) * T; const h = (p.h ?? 1) * T;
  switch (p.type) {
    case 'plans': // the Keeper's board: building plans on blue paper, the Keeper's badge pinned on
      pc.rect(x + 3, y + 9, 2, 6, P.brownShade); pc.rect(x + w - 5, y + 9, 2, 6, P.brownShade);
      pc.box(x + 1, y - 2, w - 2, 13, P.brownLight, P.outline);
      pc.box(x + 3, y, w - 10, 9, P.blueLight, P.outlineLight);
      pc.hline(x + 5, y + 2, w - 15, P.white); pc.rect(x + 5, y + 4, 5, 3, P.blue); pc.hline(x + 12, y + 5, 6, P.white);
      pc.ellipse(x + w - 5, y + 3, 2, 2, P.butter); pc.set(x + w - 5, y + 3, P.butterShade);
      pc.vline(x + w - 6, y + 5, 3, P.peachShade); pc.vline(x + w - 4, y + 5, 3, P.peachShade);
      break;
    case 'scaffold': // something being built: poles, planks and a sack of sand
      for (const px of [x + 1, x + w - 3]) pc.rect(px, y - 5, 2, h + 4, P.brownShade);
      pc.box(x, y - 3, w, 3, P.brownLight, P.outline); pc.box(x, y + h - 7, w, 3, P.brownLight, P.outline);
      pc.line(x + 3, y + h - 4, x + w - 4, y - 1, P.brown);
      pc.box(x + w / 2 - 3, y + h - 5, 6, 5, P.creamShade, P.outline, 1);
      break;
    case 'frame': // the frame up: a top rail on posts
      for (const px of [x + 1, x + w - 3]) pc.rect(px, y - 4, 2, h + 3, P.brown);
      pc.box(x, y - 5, w, 3, P.brownLight, P.outline); pc.hline(x + 2, y + h - 3, w - 4, P.brownShade);
      break;
    case 'cottage': { // a newcomer's home: cream walls, a peach roof, a round green door and a chimney
      pc.box(x + 2, y + 14, w - 4, h - 14, P.cream, P.outline);
      pc.rect(x + w - 16, y - 2, 6, 10, P.peachShade); pc.box(x + w - 17, y - 4, 8, 3, P.peach, P.outline);
      for (let i = 0; i < 16; i += 1) pc.hline(x + w / 2 - 4 - i * 2, y + i, 8 + i * 4, i % 4 === 3 ? P.peachShade : P.peach);
      pc.hline(x - 1, y + 15, w + 2, P.outline);
      pc.box(x + w / 2 - 6, y + h - 16, 12, 16, P.sageShade, P.outline); pc.ellipse(x + w / 2, y + h - 16, 6, 3, P.sageShade);
      pc.set(x + w / 2 + 3, y + h - 8, P.butter);
      for (const wx of [x + 8, x + w - 20]) { pc.box(wx, y + 20, 12, 10, P.butterLight, P.outline); pc.vline(wx + 6, y + 20, 10, P.brownLight); pc.hline(wx, y + 25, 12, P.brownLight); pc.rect(wx, y + 30, 12, 3, P.sage); pc.set(wx + 3, y + 30, P.peach); pc.set(wx + 9, y + 31, P.butter); }
      break;
    }
    case 'festival_lantern': case 'festival_lantern_lit': { // a lantern on a post, dark until Puff lights it
      const lit = p.type === 'festival_lantern_lit';
      pc.rect(x + 7, y + 2, 2, 13, P.brownShade);
      pc.box(x + 4, y - 7, 8, 9, lit ? P.butterLight : P.greyShade, P.outline);
      pc.rect(x + 6, y - 5, 4, 5, lit ? P.white : P.grey);
      pc.hline(x + 3, y - 8, 10, P.ink);
      break;
    }
    case 'fair_stall': // a little booth with a striped awning and a ribbon pinned up
      pc.rect(x + 2, y + 2, 2, h + 2, P.brownShade); pc.rect(x + w - 4, y + 2, 2, h + 2, P.brownShade);
      pc.box(x + 1, y + 8, w - 2, 8, P.brownLight, P.outline);
      for (let i = 0; i < w; i += 4) pc.rect(x + i, y - 4, 4, 6, (i / 4) % 2 ? P.white : P.blueLight);
      pc.hline(x, y + 2, w, P.outline); pc.hline(x, y - 5, w, P.outline);
      pc.ellipse(x + w / 2, y + 11, 2, 2, P.blue); pc.set(x + w / 2, y + 11, P.white);
      break;
    case 'market_stall': // Puff's own stall: a peach-and-cream awning over crates of produce
      pc.rect(x + 2, y + 2, 2, h + 2, P.brownShade); pc.rect(x + w - 4, y + 2, 2, h + 2, P.brownShade);
      pc.box(x + 1, y + 8, w - 2, 8, P.brownLight, P.outline);
      for (let i = 0; i < w; i += 4) pc.rect(x + i, y - 4, 4, 6, (i / 4) % 2 ? P.cream : P.peach);
      pc.hline(x, y + 2, w, P.outline); pc.hline(x, y - 5, w, P.outline);
      for (const [cx, c] of [[x + 6, P.peachShade], [x + 12, P.sage], [x + 18, P.butter], [x + 24, P.peach]] as const) if (cx < x + w - 3) { pc.ellipse(cx, y + 7, 2, 2, c); pc.set(cx - 1, y + 6, P.white); }
      break;
    case 'brambles': // a thorny tangle across the path
      for (let i = 0; i < 9; i += 1) { const bx = x + 2 + ((i * 7) % (w - 4)); pc.line(bx, y + 14, bx + 4 - (i % 3) * 3, y + 2, P.brownShade); pc.ellipse(bx + 1, y + 6 + (i % 3) * 2, 2, 1, P.sageShade); }
      for (const [bx, by] of [[x + 6, y + 5], [x + 20, y + 9], [x + 13, y + 3]]) pc.set(bx, by, P.peachShade);
      break;
    case 'stepping_stones': // the path cleared: flat stones set in the earth
      for (const [sx, sy] of [[3, 5], [12, 9], [20, 4], [27, 10]]) if (sx < w) { pc.ellipseBox(x + sx, y + sy, 3, 2, P.greyLight, P.outline); pc.set(x + sx - 1, y + sy - 1, P.white); }
      break;
    case 'steps_broken': // stone steps lost under brambles
      for (let i = 0; i < 3; i += 1) pc.box(x + 2 + i * 4, y + 3 + i * 3, w - 4 - i * 8, 4, P.greyLight, P.outline);
      for (const [bx, by] of [[x + 4, y + 4], [x + 14, y + 6], [x + 22, y + 3], [x + 9, y + 10]]) { pc.ellipse(bx, by, 3, 2, P.sageShade); pc.set(bx + 1, by - 1, P.peachShade); }
      break;
    case 'sea_steps': // mended: three clean stone steps down toward the sea
      for (let i = 0; i < 3; i += 1) { pc.box(x + 2 + i * 3, y + 2 + i * 4, w - 4 - i * 6, 5, i % 2 ? P.greyLight : P.cream, P.outline); pc.hline(x + 3 + i * 3, y + 3 + i * 4, w - 6 - i * 6, P.white); }
      break;
    case 'lighthouse': { // Mabel's lighthouse by the sea: a striped tower, a lamp room on top
      const cx = x + w / 2;
      for (let i = 0; i < h - 12; i += 1) { const half = 7 - Math.floor(i / 12); pc.hline(cx - half, y + 12 + i, half * 2, Math.floor(i / 8) % 2 ? P.peach : P.cream); }
      pc.vline(cx - 7, y + 12, h - 12, P.outline); pc.vline(cx + 6, y + 12, h - 12, P.outline);
      pc.box(cx - 6, y + 2, 12, 10, P.butterLight, P.outline); pc.rect(cx - 3, y + 4, 6, 6, P.white);
      pc.hline(cx - 8, y + 1, 16, P.peachShade); pc.hline(cx - 5, y - 1, 10, P.peachShade); pc.set(cx, y - 3, P.ink);
      pc.box(cx - 3, y + h - 9, 6, 9, P.blueShade, P.outline);
      break;
    }
    case 'bridge_broken': // two snapped planks and a leaning post over the water
      pc.box(x + 2, y + 2, 12, 4, P.brownLight, P.outline); pc.line(x + 14, y + 3, x + 19, y + 9, P.brown);
      pc.box(x + w - 10, y + 6, 8, 3, P.brownLight, P.outline);
      pc.line(x + 1, y + 1, x + 4, y + 13, P.brownShade); pc.line(x + w - 2, y + 1, x + w - 5, y + 12, P.brownShade);
      break;
    case 'footbridge': // mended: rails down both sides of the new planks, a post every tile
      for (const rx of [x, x + w - 2]) {
        pc.rect(rx, y, 2, h, P.brownLight); pc.vline(rx + (rx === x ? 0 : 1), y, h, P.outline);
        for (let py = y; py < y + h; py += T) pc.box(rx - 1, py, 4, 4, P.brown, P.outline);
      }
      break;
    case 'greenhouse': {
      // Glass panes on a wooden frame, a peaked roof, plants showing through.
      pc.box(x, y + 6, w, h - 6, P.blueLight, P.outline);
      for (let i = 0; i < w; i += 8) pc.vline(x + i, y + 6, h - 6, P.brownLight);
      pc.hline(x, y + 6 + Math.floor((h - 6) / 2), w, P.brownLight);
      for (let i = 0; i < 8; i += 1) pc.hline(x + 8 - i * 1, y + i, w - 16 + i * 2, i % 3 ? P.blueLight : P.white);
      pc.line(x, y + 7, x + w / 2, y - 1, P.brown); pc.line(x + w - 1, y + 7, x + w / 2, y - 1, P.brown);
      for (const px of [6, 14, 22, 30, 38]) if (px < w - 2) { pc.ellipse(x + px, y + h - 7, 3, 2, P.sage); pc.set(x + px, y + h - 9, P.peach); }
      pc.box(x + w / 2 - 4, y + h - 10, 8, 10, P.brownLight, P.outline);
      pc.mix(x + 3, y + 9, P.white, 0.7); pc.mix(x + 4, y + 10, P.white, 0.7);
      break;
    }
    case 'bench_cosy':
      pc.rect(x + 3, y + 10, 2, 5, P.outline); pc.rect(x + w - 5, y + 10, 2, 5, P.outline);
      pc.box(x, y + 1, w, 4, P.brownLight, P.outline); pc.box(x, y + 6, w, 5, P.brownLight, P.outline);
      pc.box(x + 3, y + 3, 9, 5, P.peach, P.outline, 2); pc.box(x + w - 12, y + 3, 9, 5, P.blueLight, P.outline, 2);
      pc.hline(x + 1, y + 9, w - 2, P.brown);
      break;
    case 'flower_bed_big': {
      pc.box(x, y + 4, w, 11, P.brownShade, P.outline, 1);
      const blooms = [P.peach, P.butter, P.blueLight, P.peachLight, P.white];
      for (let i = 2; i < w - 2; i += 2) for (const dy of [2, 6]) { pc.vline(x + i, y + dy + 3, 3, P.sageShade); pc.set(x + i, y + dy + 2, blooms[(i + dy) % blooms.length]); }
      break;
    }
    case 'lamppost_twin':
      pc.box(x + 5, y + 12, 7, 3, P.ink, P.outline); pc.rect(x + 7, y - 2, 3, 15, P.ink);
      pc.hline(x + 1, y - 2, 15, P.ink);
      for (const lx of [x, x + 11]) { pc.box(lx, y - 9, 6, 7, P.butterLight, P.ink, 1); pc.rect(lx + 2, y - 7, 2, 3, P.white); }
      break;
    case 'ladder': // the way back up to the fountain
      for (const lx of [x + 3, x + 11]) pc.rect(lx, y - 10, 2, h + 10, P.brownLight);
      for (let ly = y - 8; ly < y + h; ly += 4) pc.hline(x + 3, ly, 10, P.brown);
      pc.vline(x + 3, y - 10, h + 10, P.outline); pc.vline(x + 12, y - 10, h + 10, P.outline);
      break;
    case 'ladder_down': // a hole in the cave floor, the ladder's top poking out
      pc.ellipse(x + 8, y + 9, 7, 5, P.ink); pc.ellipse(x + 8, y + 8, 6, 3, P.outline);
      for (const lx of [x + 4, x + 11]) pc.rect(lx, y + 1, 2, 9, P.brownLight);
      pc.hline(x + 4, y + 3, 9, P.brown); pc.hline(x + 4, y + 7, 9, P.brown);
      break;
    case 'carving': // a smooth slab of cave wall with old letters cut into it
      pc.box(x + 1, y + 1, 14, 13, P.greyLight, P.outline);
      for (const ly of [y + 4, y + 7, y + 10]) for (let lx = x + 3; lx < x + 13; lx += 3) pc.hline(lx, ly, 2, P.greyShade);
      pc.set(x + 3, y + 2, P.white);
      break;
    case 'rock_small': case 'rock_medium': case 'rock_large': {
      // A cave rock with veins of the town's lost colour; bigger rocks show more.
      const r = p.type === 'rock_small' ? 4 : p.type === 'rock_medium' ? 6 : 7;
      pc.ellipseBox(x + 8, y + 15 - r, r + 1, r, P.greyShade, P.outline);
      pc.ellipse(x + 7, y + 14 - r, r - 1, r - 2, P.grey); pc.ellipse(x + 6, y + 13 - r, 2, 1, P.greyLight);
      const vein = p.type === 'rock_small' ? P.blueLight : P.peachShade;
      pc.line(x + 8 - r + 2, y + 14 - r, x + 8 + r - 2, y + 15 - r + 2, vein);
      if (p.type === 'rock_large') pc.set(x + 9, y + 9, P.butter);
      break;
    }
    case 'flower_pot':
      pc.box(x + 4, y + 8, 8, 7, P.peachShade, P.outline, 1); pc.hline(x + 4, y + 9, 8, P.peach);
      pc.ellipse(x + 8, y + 6, 4, 3, P.sage); pc.ellipse(x + 7, y + 5, 2, 2, P.sageLight);
      for (const [fx, fy, c] of [[6, 4, P.peach], [10, 5, P.butter], [8, 2, P.blueLight]] as const) { pc.set(x + fx, y + fy, c); pc.set(x + fx + 1, y + fy, c); }
      break;
    case 'lantern':
      pc.rect(x + 7, y + 6, 2, 9, P.ink); pc.box(x + 4, y + 13, 8, 2, P.ink, P.outline);
      pc.box(x + 4, y - 2, 8, 9, P.butterLight, P.ink, 1); pc.rect(x + 6, y, 4, 5, P.white); pc.box(x + 3, y - 4, 10, 2, P.ink, P.outline);
      break;
    case 'fence_post':
      for (const px of [x + 2, x + 12]) pc.box(px, y + 3, 3, 12, P.brownLight, P.outline);
      pc.box(x + 1, y + 6, 15, 3, P.brownLight, P.outline); pc.box(x + 1, y + 11, 15, 2, P.brown, P.outline);
      break;
    case 'flower_bed': {
      pc.box(x, y + 6, w, 9, P.brownShade, P.outline, 1);
      pc.rect(x + 2, y + 8, w - 4, 5, P.brown);
      const r = seeded(p.x * 31 + p.y);
      const blooms = [P.peach, P.butter, P.blueLight, P.peachLight];
      for (let i = 2; i < w - 2; i += 3) {
        const fy = y + 4 + Math.floor(r() * 4);
        pc.vline(x + i + 1, fy + 2, 4, P.sageShade);
        pc.ellipse(x + i + 1, fy + 1, 1, 1, blooms[Math.floor(r() * blooms.length)]); pc.set(x + i + 1, fy + 1, P.white);
      }
      break;
    }
  }
}
