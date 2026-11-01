import { Container, Graphics } from 'pixi.js';

// Clean rings (polish: every clean should feel like it landed): a soft circle that swells out
// from a cleared spot and fades, like a ripple on water. Bigger, slower ones mark a spotless place.
// With reduced motion there are none.

interface Ring { g: Graphics; x: number; y: number; age: number; life: number; reach: number; colour: number }

const RING_MS = 380;

export class Rings {
  readonly container = new Container();
  reducedMotion = false;
  private live: Ring[] = [];

  /** A ring from world px (x, y): `reach` px across at its widest. */
  add(x: number, y: number, colour: number, reach = 14, life = RING_MS) {
    if (this.reducedMotion) return;
    const g = new Graphics();
    this.container.addChild(g);
    this.live.push({ g, x, y, age: 0, life, reach, colour });
  }

  update(dt: number) {
    for (let i = this.live.length - 1; i >= 0; i -= 1) {
      const r = this.live[i];
      r.age += dt;
      const t = Math.min(1, r.age / r.life);
      const ease = 1 - (1 - t) * (1 - t);
      r.g.clear().ellipse(r.x, r.y, 3 + r.reach * ease, (3 + r.reach * ease) * 0.6).stroke({ width: 2 * (1 - t) + 0.5, color: r.colour, alpha: 0.85 * (1 - t) });
      if (t >= 1) { r.g.destroy(); this.live.splice(i, 1); }
    }
  }
}
