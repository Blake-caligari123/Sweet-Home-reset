import type { Pt } from '../world/nav';

/** Where a Grumble is ambling to, or how long it rests first (not saved: it just picks again). */
export interface Drift { to: Pt | null; waitMs: number }

export interface DriftOptions {
  /** World px per ms. */
  speed: number;
  /** Whether the straight line between two points is open floor. */
  clear(a: Pt, b: Pt): boolean;
  /** A nearby open spot to amble to, or null. */
  pick(from: Pt): Pt | null;
  puff: Pt;
  rng(): number;
}

/** Closer than this to Puff and a Grumble shuffles off. */
const SHY_PX = 24;

/** A slow amble: rest, pick a spot, wander there. A Grumble moves away from Puff, never toward. */
export function drift(g: { fx: number; fy: number }, d: Drift, dt: number, o: DriftOptions) {
  const at = { x: g.fx, y: g.fy };
  const dx = at.x - o.puff.x; const dy = at.y - o.puff.y; const near = Math.hypot(dx, dy);
  if (near < SHY_PX && near > 0) {
    const away = { x: at.x + (dx / near) * SHY_PX, y: at.y + (dy / near) * SHY_PX };
    if (o.clear(at, away)) { d.to = away; d.waitMs = 0; }
  }
  if (d.waitMs > 0) { d.waitMs -= dt; return; }
  d.to ??= o.pick(at);
  if (!d.to || !o.clear(at, d.to)) { d.to = null; d.waitMs = 1000; return; }
  const tx = d.to.x - at.x; const ty = d.to.y - at.y; const left = Math.hypot(tx, ty); const step = o.speed * dt;
  if (left <= step) { g.fx = d.to.x; g.fy = d.to.y; d.to = null; d.waitMs = 1500 + o.rng() * 2500; return; }
  g.fx += (tx / left) * step; g.fy += (ty / left) * step;
}
