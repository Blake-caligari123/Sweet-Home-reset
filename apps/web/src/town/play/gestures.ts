// Reading a finger on the world: a tap (walk there, or use what's there), a hold (keep scrubbing),
// a rub (scrub a stain, one pass per stroke), a circle (suds, one pass per loop) or a drag (carry
// clutter to where it lives, or sweep along a row of mess). Screen pixels.
export interface Sample { x: number; y: number; t: number }
export type Gesture =
  | { kind: 'tap'; x: number; y: number }
  | { kind: 'rub'; x: number; y: number; passes: number }
  | { kind: 'hold'; x: number; y: number; ms: number }
  | { kind: 'circle'; x: number; y: number; passes: number }
  | { kind: 'drag'; from: { x: number; y: number }; to: { x: number; y: number } };

/** Moves smaller than this are still a tap. */
const TAP_SLOP = 14;
/** A rub covers at least this much ground going back and forth. */
const RUB_MIN_PATH = 50;
/** A still press this long is a hold. */
const HOLD_MS = 450;
/** Turning this far round the middle of the path counts as one loop. */
const LOOP = Math.PI * 2 * 0.9;

export function recognise(samples: Sample[]): Gesture {
  const first = samples[0]; const last = samples[samples.length - 1];
  const span = Math.hypot(last.x - first.x, last.y - first.y);
  let pathLen = 0; let strokes = 1; let dirX = 0; let dirY = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const dx = samples[i].x - samples[i - 1].x; const dy = samples[i].y - samples[i - 1].y;
    pathLen += Math.hypot(dx, dy);
    // A new stroke each time the main direction of travel turns back.
    if (Math.abs(dx) >= Math.abs(dy) && dx) { if (dirX && Math.sign(dx) !== dirX) strokes += 1; dirX = Math.sign(dx); }
    else if (dy) { if (dirY && Math.sign(dy) !== dirY) strokes += 1; dirY = Math.sign(dy); }
  }
  const x = samples.reduce((s, p) => s + p.x, 0) / samples.length; const y = samples.reduce((s, p) => s + p.y, 0) / samples.length;
  const loops = Math.floor(Math.abs(turned(samples, x, y)) / LOOP);
  if (pathLen >= RUB_MIN_PATH && loops >= 1) return { kind: 'circle', x, y, passes: loops };
  if (pathLen >= RUB_MIN_PATH && strokes >= 3 && pathLen > span * 2.5) return { kind: 'rub', x, y, passes: strokes };
  const ms = last.t - first.t;
  if (span <= TAP_SLOP && pathLen <= TAP_SLOP * 2 && ms >= HOLD_MS) return { kind: 'hold', x: first.x, y: first.y, ms };
  if (span <= TAP_SLOP) return { kind: 'tap', x: first.x, y: first.y };
  return { kind: 'drag', from: { x: first.x, y: first.y }, to: { x: last.x, y: last.y } };
}

/** How far (radians, signed) the path turns around a centre point, in small steps only. */
function turned(samples: Sample[], cx: number, cy: number) {
  let total = 0;
  for (let i = 1; i < samples.length; i += 1) {
    let d = Math.atan2(samples[i].y - cy, samples[i].x - cx) - Math.atan2(samples[i - 1].y - cy, samples[i - 1].x - cx);
    if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
    // A loop turns a little each step; a rub's stroke jumps across the middle, so it doesn't count.
    if (Math.abs(d) < Math.PI / 2) total += d;
  }
  return total;
}
