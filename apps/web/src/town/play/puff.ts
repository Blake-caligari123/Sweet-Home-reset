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
