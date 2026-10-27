import { Container, Sprite, type Texture } from 'pixi.js';
import { P } from '../art/palette';
import { PixelCanvas } from '../art/pixel-canvas';
import { toTexture } from './textures';

export const MAX_PARTICLES = 400;
type Kind = 'dot' | 'suds' | 'sparkle' | 'puff';

interface Particle { sprite: Sprite; x: number; y: number; vx: number; vy: number; g: number; life: number; age: number }

let shapes: Record<Kind, Texture> | null = null;
function textures() {
  if (shapes) return shapes;
  const dot = new PixelCanvas(1, 1); dot.set(0, 0, P.white);
  const suds = new PixelCanvas(3, 3); suds.rect(0, 1, 3, 1, P.white); suds.rect(1, 0, 1, 3, P.white);
  const sparkle = new PixelCanvas(5, 5); sparkle.rect(2, 0, 1, 5, P.white); sparkle.rect(0, 2, 5, 1, P.white); sparkle.set(2, 2, P.white);
  const puff = new PixelCanvas(4, 4); puff.rect(1, 0, 2, 4, P.white); puff.rect(0, 1, 4, 2, P.white);
  shapes = { dot: toTexture(dot), suds: toTexture(suds), sparkle: toTexture(sparkle), puff: toTexture(puff) };
  return shapes;
}

/** Pooled pixel particles, capped at 400 live, snapped to whole room pixels. */
export class Particles {
  readonly container = new Container();
  private live: Particle[] = [];
  private pool: Sprite[] = [];
  reducedMotion = false;

  constructor() { this.container.eventMode = 'none'; }

  burst(kind: Kind, x: number, y: number, count: number, colours: string[], speed = 30, gravity = 40) {
    const n = Math.max(this.reducedMotion ? Math.min(count, 3) : count, 1) * (this.reducedMotion ? 0.25 : 1);
    for (let i = 0; i < Math.ceil(n); i += 1) {
      if (this.live.length >= MAX_PARTICLES) return;
      const sprite = this.pool.pop() ?? new Sprite();
      sprite.texture = textures()[kind];
      sprite.anchor.set(0.5);
      sprite.tint = colours[i % colours.length];
      sprite.alpha = 1;
      this.container.addChild(sprite);
      const angle = Math.random() * Math.PI * 2;
      const v = this.reducedMotion ? 0 : speed * (0.4 + Math.random() * 0.8);
      this.live.push({ sprite, x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v - v * 0.4, g: this.reducedMotion ? 0 : gravity, life: 450 + Math.random() * 500, age: 0 });
    }
  }

  get count() { return this.live.length; }

  update(dtMs: number) {
    const dt = dtMs / 1000;
    for (let i = this.live.length - 1; i >= 0; i -= 1) {
      const p = this.live[i];
      p.age += dtMs;
      if (p.age >= p.life) {
        this.container.removeChild(p.sprite); this.pool.push(p.sprite);
        this.live.splice(i, 1); continue;
      }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.sprite.position.set(Math.round(p.x), Math.round(p.y));
      // Stepped fade keeps the hard pixel look.
      p.sprite.alpha = p.age > p.life * 0.7 ? 0.5 : 1;
    }
  }

  clear() {
    for (const p of this.live) { this.container.removeChild(p.sprite); this.pool.push(p.sprite); }
    this.live = [];
  }
}
