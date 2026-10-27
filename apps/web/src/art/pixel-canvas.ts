import { rgb } from './palette';

/** A tiny RGBA bitmap for drawing hard-edged pixel art without a DOM. */
export class PixelCanvas {
  readonly data: Uint8ClampedArray<ArrayBuffer>;

  constructor(readonly width: number, readonly height: number) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  set(x: number, y: number, colour: string, alpha = 255) {
    x = Math.round(x); y = Math.round(y);
    if (!this.inside(x, y)) return;
    const [r, g, b] = rgb(colour);
    const i = (y * this.width + x) * 4;
    this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = alpha;
  }

  alpha(x: number, y: number) {
    if (!this.inside(x, y)) return 0;
    return this.data[(y * this.width + x) * 4 + 3];
  }

  hex(x: number, y: number) {
    const i = (y * this.width + x) * 4;
    return '#' + [0, 1, 2].map((k) => this.data[i + k].toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  clear(x: number, y: number) {
    if (this.inside(x, y)) this.data[(y * this.width + x) * 4 + 3] = 0;
  }

  rect(x: number, y: number, w: number, h: number, colour: string, alpha = 255) {
    for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) this.set(x + i, y + j, colour, alpha);
  }

  hline(x: number, y: number, w: number, colour: string) { this.rect(x, y, w, 1, colour); }
  vline(x: number, y: number, h: number, colour: string) { this.rect(x, y, 1, h, colour); }

  /** Filled rectangle with a 1 px border and optionally clipped corners (r = 1 or 2). */
  box(x: number, y: number, w: number, h: number, fill: string, outline?: string, r = 0) {
    for (let j = 0; j < h; j += 1) {
      for (let i = 0; i < w; i += 1) {
        const cx = Math.min(i, w - 1 - i);
        const cy = Math.min(j, h - 1 - j);
        if (r > 0 && cx + cy < r) continue;
        const edge = outline && (i === 0 || j === 0 || i === w - 1 || j === h - 1 || (r > 0 && cx + cy === r));
        this.set(x + i, y + j, edge ? outline! : fill);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, colour: string, alpha = 255) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const dx = (x - cx) / (rx + 0.5);
        const dy = (y - cy) / (ry + 0.5);
        if (dx * dx + dy * dy <= 1) this.set(x, y, colour, alpha);
      }
    }
  }

  /** Filled ellipse with a 1 px outline. */
  ellipseBox(cx: number, cy: number, rx: number, ry: number, fill: string, outline: string) {
    this.ellipse(cx, cy, rx, ry, outline);
    this.ellipse(cx, cy, rx - 1, ry - 1, fill);
  }

  line(x0: number, y0: number, x1: number, y1: number, colour: string) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0); const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1; const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, colour);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  /** Copy opaque pixels of another canvas onto this one. */
  draw(src: PixelCanvas, x: number, y: number, flipX = false) {
    for (let j = 0; j < src.height; j += 1) {
      for (let i = 0; i < src.width; i += 1) {
        const si = (j * src.width + (flipX ? src.width - 1 - i : i)) * 4;
        const a = src.data[si + 3];
        if (a === 0) continue;
        const tx = x + i; const ty = y + j;
        if (!this.inside(tx, ty)) continue;
        const di = (ty * this.width + tx) * 4;
        this.data[di] = src.data[si]; this.data[di + 1] = src.data[si + 1];
        this.data[di + 2] = src.data[si + 2]; this.data[di + 3] = a;
      }
    }
  }

  /** Add a 1 px outline around every opaque shape (cutout rule from the pixel-art spec). */
  outlineShapes(colour: string) {
    const marks: number[] = [];
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.alpha(x, y) !== 0) continue;
        if (this.alpha(x - 1, y) || this.alpha(x + 1, y) || this.alpha(x, y - 1) || this.alpha(x, y + 1)) marks.push(x, y);
      }
    }
    for (let k = 0; k < marks.length; k += 2) this.set(marks[k], marks[k + 1], colour);
  }

  clone() {
    const copy = new PixelCanvas(this.width, this.height);
    copy.data.set(this.data);
    return copy;
  }
}

/** Small deterministic random generator so rooms and messes are repeatable from a seed. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
