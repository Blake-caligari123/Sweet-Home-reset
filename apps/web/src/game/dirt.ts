import { P, rgb } from '../art/palette';
import { seeded } from '../art/pixel-canvas';
import { ROOM_H, ROOM_W, type Rect, type TaskDef } from './pack';

// Dirt lives on the room's 1x pixel grid (180×390) so the reveal always snaps to whole pixels.
// Each dirty pixel has hit points; a brush stamp takes one off every pixel it covers, so grime
// needs a couple of passes while fog and dust come off in one.

export const HP = { grime: 10, glass: 3, dust: 3 } as const;
const STYLE = { none: 0, grime: 1, speck: 2, glass: 3, dust: 4 } as const;

export interface StampResult { changed: boolean; cleared: number[]; box: Rect | null }

export class DirtMap {
  readonly hp = new Uint8Array(ROOM_W * ROOM_H);
  readonly maxHp = new Uint8Array(ROOM_W * ROOM_H);
  readonly owner = new Int8Array(ROOM_W * ROOM_H).fill(-1);
  readonly style = new Uint8Array(ROOM_W * ROOM_H);
  readonly total: number[];
  readonly remaining: number[];

  constructor(readonly tasks: TaskDef[], seed = 1) {
    this.total = tasks.map(() => 0);
    tasks.forEach((task, index) => {
      if (task.type === 'scrub') this.grime(task.areas, task.coverage, seed * 7919 + task.seed, index);
      else if (task.type === 'wipe') this.film(task.areas, task.surface, index);
    });
    this.remaining = [...this.total];
  }

  private mark(x: number, y: number, task: number, hp: number, style: number) {
    if (x < 0 || y < 0 || x >= ROOM_W || y >= ROOM_H) return;
    const i = y * ROOM_W + x;
    if (this.owner[i] === -1) this.total[task] += 1;
    else if (this.owner[i] !== task) return;
    this.owner[i] = task; this.hp[i] = hp; this.maxHp[i] = hp; this.style[i] = style;
  }

  private grime(areas: Rect[], coverage: number, seed: number, task: number) {
    const rand = seeded(seed);
    const inArea = (x: number, y: number) => areas.some((a) => x >= a.x && y >= a.y && x < a.x + a.w && y < a.y + a.h);
    const areaPixels = areas.reduce((sum, a) => sum + a.w * a.h, 0);
    let guard = 0;
    while (this.total[task] < areaPixels * coverage && guard < 4000) {
      guard += 1;
      const a = areas[Math.floor(rand() * areas.length)];
      const cx = a.x + rand() * a.w; const cy = a.y + rand() * a.h;
      const r = 3 + rand() * 6; const ry = r * (0.55 + rand() * 0.3);
      for (let y = Math.floor(cy - ry); y <= cy + ry; y += 1) {
        for (let x = Math.floor(cx - r); x <= cx + r; x += 1) {
          const dx = (x - cx) / r; const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1 && inArea(x, y)) this.mark(x, y, task, HP.grime, rand() < 0.06 ? STYLE.speck : STYLE.grime);
        }
      }
    }
  }

  private film(areas: Rect[], surface: 'glass' | 'dust', task: number) {
    for (const a of areas) {
      for (let y = a.y; y < a.y + a.h; y += 1) for (let x = a.x; x < a.x + a.w; x += 1) {
        this.mark(x, y, task, HP[surface], surface === 'glass' ? STYLE.glass : STYLE.dust);
      }
    }
  }

  /** Hard-edged round brush on the pixel grid. */
  stamp(cx: number, cy: number, radius: number, result: StampResult = { changed: false, cleared: this.tasks.map(() => 0), box: null }) {
    const r = Math.max(1, radius);
    const x0 = Math.max(0, Math.floor(cx - r)); const x1 = Math.min(ROOM_W - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)); const y1 = Math.min(ROOM_H - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const dx = x + 0.5 - cx; const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy > r * r) continue;
        const i = y * ROOM_W + x;
        if (this.hp[i] === 0) continue;
        this.hp[i] -= 1;
        result.changed = true;
        if (this.hp[i] === 0) { result.cleared[this.owner[i]] += 1; this.remaining[this.owner[i]] -= 1; }
        growBox(result, x, y);
      }
    }
    return result;
  }

  /** Stamp along a segment with spacing 0.35 × radius so fast strokes leave no gaps. */
  stroke(x0: number, y0: number, x1: number, y1: number, radius: number) {
    const result: StampResult = { changed: false, cleared: this.tasks.map(() => 0), box: null };
    const distance = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius * 0.35)));
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      this.stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, result);
    }
    return result;
  }

  /** Remove every remaining pixel of a task (Help Puff, the 90% patch rule and the 95% finish). */
  clearTask(task: number) {
    const result: StampResult = { changed: false, cleared: this.tasks.map(() => 0), box: null };
    for (let i = 0; i < this.hp.length; i += 1) {
      if (this.owner[i] !== task || this.hp[i] === 0) continue;
      this.hp[i] = 0; result.changed = true; result.cleared[task] += 1;
      growBox(result, i % ROOM_W, Math.floor(i / ROOM_W));
    }
    this.remaining[task] = 0;
    return result;
  }

  progress(task: number) {
    const total = this.total[task];
    return total === 0 ? 1 : (total - this.remaining[task]) / total;
  }

  /** The dirty pixel nearest the centre of the biggest remaining patch, for Puff's hint. */
  hintPoint(task: number) {
    let sx = 0; let sy = 0; let n = 0;
    for (let i = 0; i < this.hp.length; i += 1) if (this.owner[i] === task && this.hp[i] > 0) { sx += i % ROOM_W; sy += Math.floor(i / ROOM_W); n += 1; }
    return n ? { x: sx / n, y: sy / n } : null;
  }

  /** Write the visible dirt into an RGBA buffer (180×390) for the given box. */
  paint(target: Uint8ClampedArray, box: Rect = { x: 0, y: 0, w: ROOM_W, h: ROOM_H }) {
    for (let y = box.y; y < box.y + box.h; y += 1) {
      for (let x = box.x; x < box.x + box.w; x += 1) {
        const i = y * ROOM_W + x; const k = i * 4;
        const hp = this.hp[i];
        if (hp === 0) { target[k + 3] = 0; continue; }
        const heavy = hp * 2 > this.maxHp[i];
        const [colour, alpha] = dirtColour(this.style[i], heavy);
        const [r, g, b] = rgb(colour);
        target[k] = r; target[k + 1] = g; target[k + 2] = b; target[k + 3] = alpha;
      }
    }
  }

  snapshot() { return this.hp.slice(); }

  restore(hp: Uint8Array) {
    if (hp.length !== this.hp.length) return;
    this.remaining.fill(0);
    for (let i = 0; i < hp.length; i += 1) {
      if (this.owner[i] === -1) continue;
      this.hp[i] = Math.min(hp[i], this.maxHp[i]);
      if (this.hp[i] > 0) this.remaining[this.owner[i]] += 1;
    }
  }
}

function growBox(result: StampResult, x: number, y: number) {
  const b = result.box;
  if (!b) { result.box = { x, y, w: 1, h: 1 }; return; }
  const x1 = Math.max(b.x + b.w, x + 1); const y1 = Math.max(b.y + b.h, y + 1);
  b.x = Math.min(b.x, x); b.y = Math.min(b.y, y); b.w = x1 - b.x; b.h = y1 - b.y;
}

// Mess is never gross: soft grey smudges, crumbs, fog and dust (GAME-DESIGN §7).
function dirtColour(style: number, heavy: boolean): [string, number] {
  switch (style) {
    case STYLE.speck: return [heavy ? P.outlineLight : P.greyShade, 255];
    case STYLE.glass: return [P.white, heavy ? 200 : 120];
    case STYLE.dust: return [P.greyLight, heavy ? 190 : 120];
    default: return [heavy ? P.greyShade : P.grey, heavy ? 215 : 150];
  }
}
