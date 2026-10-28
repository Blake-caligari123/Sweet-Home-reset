import { P } from '../../../shared/art/palette';
import { PixelCanvas, seeded } from '../../../shared/art/pixel-canvas';
import { drawBuiltProp } from './built-props';
import { T, dither } from './texture';

export interface PropDef { type: string; x: number; y: number; w?: number; h?: number; colour?: string; label?: string; action?: string; accepts?: string[]; walkable?: boolean; doorX?: number; tap?: [number, number, number, number]; shop?: string }

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
    default: drawBuiltProp(pc, p);
  }
}

// ---- mess sprites: each type has its own shape, never colour alone (GDD v3 A11.3) ------------
