// Reading a finger on the world: a tap (walk there, or use what's there), a rub (scrub a stain,
// one pass per stroke) or a drag (carry clutter to where it lives). Screen pixels.
export interface Sample { x: number; y: number; t: number }
export type Gesture =
  | { kind: 'tap'; x: number; y: number }
  | { kind: 'rub'; x: number; y: number; passes: number }
  | { kind: 'drag'; from: { x: number; y: number }; to: { x: number; y: number } };

/** Moves smaller than this are still a tap. */
const TAP_SLOP = 14;
/** A rub covers at least this much ground going back and forth. */
const RUB_MIN_PATH = 50;

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
  if (pathLen >= RUB_MIN_PATH && strokes >= 3 && pathLen > span * 2.5) {
    const x = samples.reduce((s, p) => s + p.x, 0) / samples.length; const y = samples.reduce((s, p) => s + p.y, 0) / samples.length;
    return { kind: 'rub', x, y, passes: strokes };
  }
  if (span <= TAP_SLOP) return { kind: 'tap', x: first.x, y: first.y };
  return { kind: 'drag', from: { x: first.x, y: first.y }, to: { x: last.x, y: last.y } };
}
