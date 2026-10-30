import type { Dir } from '../world/art/characters';

// The on-screen stick (NEXT-PHASE §9, Blake: tap or joystick, the player picks). The stick's pull
// is a direction and a strength; each frame Puff heads a short way along it, sliding along a wall
// when straight on is blocked.

type Pt = { x: number; y: number };

/** How far from the centre a finger must move before Puff walks, as a share of the rim. */
const DEAD_ZONE = 0.2;

/** The pull from a finger `dx, dy` from the stick's centre: up to 1 at the rim, null inside the dead zone. */
export function stickPull(dx: number, dy: number, radius: number): (Pt & { dir: Dir }) | null {
  const d = Math.hypot(dx, dy);
  if (d < radius * DEAD_ZONE) return null;
  const k = Math.min(1, d / radius) / d;
  const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  return { x: dx * k, y: dy * k, dir };
}

/** Where to head from the feet along a pull, `step` px ahead; along one axis if a wall is in the way. */
export function stickTarget(feet: Pt, pull: Pt, step: number, clear: (from: Pt, to: Pt) => boolean): Pt | null {
  const len = Math.hypot(pull.x, pull.y) || 1;
  const tries = [{ x: pull.x / len, y: pull.y / len }, { x: Math.sign(pull.x), y: 0 }, { x: 0, y: Math.sign(pull.y) }];
  for (const t of tries) {
    if (!t.x && !t.y) continue;
    const to = { x: feet.x + t.x * step, y: feet.y + t.y * step };
    if (clear(feet, to)) return to;
  }
  return null;
}
