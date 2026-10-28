import type { Dir } from '../world/art/characters';
import { T } from '../world/art/texture';
import { FEET, type Pt } from '../world/nav';
import type { Target } from './targets';

export type PuffPose = 'walk' | 'idle' | 'swing' | 'sleep' | 'hop';

/** One step in each facing, in tiles. */
const STEP: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

/**
 * Puff in the world. x, y: the tile under the feet (mess, doors, saves). fx, fy: the feet in world px;
 * path: waypoints in world px. action: what to do on arriving; swing: the mess being cleaned right now
 * (kept apart so a new tap mid-swing can't lose it).
 */
export class Puff {
  x = 3; y = 4;
  fx = 3 * T + T / 2; fy = 4 * T + FEET;
  dir: Dir = 'down';
  pose: PuffPose = 'idle';
  path: Pt[] = [];
  action: Target | null = null;
  swing: Target | null = null;
  repeat = 0;
  swingMs = 0;
  hopMs = 0;

  get feet(): Pt { return { x: this.fx, y: this.fy }; }
  /** The tile Puff is facing. */
  get facing() { const [dx, dy] = STEP[this.dir]; return { x: this.x + dx, y: this.y + dy }; }

  /** Stand at a feet point with nothing on the go. */
  standAt(spot: Pt) {
    Object.assign(this, { fx: spot.x, fy: spot.y, x: Math.floor(spot.x / T), y: Math.floor(spot.y / T), path: [], action: null, swing: null, swingMs: 0, repeat: 0, pose: 'idle' });
  }

  hop() { this.pose = 'hop'; this.hopMs = 900; }

  /**
   * Walk the waypoints for `dt` ms at `speed` world px per ms. `stepped` runs on each new tile under
   * the feet. True on the frame Puff arrives.
   */
  walk(dt: number, speed: number, stepped: () => void) {
    if (!this.path.length) return false;
    let budget = dt * speed;
    while (budget > 0 && this.path.length) {
      const n = this.path[0]; const dx = n.x - this.fx; const dy = n.y - this.fy; const d = Math.hypot(dx, dy);
      this.faceAlong(dx, dy);
      if (d <= budget) { this.fx = n.x; this.fy = n.y; this.path.shift(); budget -= d; } else { this.fx += (dx / d) * budget; this.fy += (dy / d) * budget; budget = 0; }
      const tx = Math.floor(this.fx / T); const ty = Math.floor(this.fy / T);
      if (tx !== this.x || ty !== this.y) { this.x = tx; this.y = ty; stepped(); }
    }
    this.pose = this.path.length ? 'walk' : 'idle';
    return !this.path.length;
  }

  /** Turn toward a tile. */
  face(x: number, y: number) { this.faceAlong((x + 0.5) * T - this.fx, (y + 0.5) * T - this.fy); }

  /** Face along a direction; near diagonals keep the current facing so Puff doesn't flicker. */
  faceAlong(dx: number, dy: number) {
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
    const h: Dir = dx > 0 ? 'right' : 'left'; const v: Dir = dy > 0 ? 'down' : 'up';
    if (Math.abs(dx) > Math.abs(dy) * 1.2) this.dir = h;
    else if (Math.abs(dy) > Math.abs(dx) * 1.2) this.dir = v;
    else if (this.dir !== h && this.dir !== v) this.dir = h;
  }
}
