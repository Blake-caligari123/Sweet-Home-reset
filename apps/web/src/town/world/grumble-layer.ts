import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { P } from '../../shared/art/palette';
import { toTexture } from '../../shared/render/textures';
import { drawGrumble } from './art/grumbles';

/** A Grumble to draw: feet at x, y (world px); `pips` filled of `of` while still grumpy. */
export interface GrumbleView { id: string; x: number; y: number; helper: boolean; pips: number; of: number }

const frames = new Map<string, Texture>();
function grumbleTexture(frame: number, helper: boolean) {
  const key = `${frame}:${helper}`;
  let t = frames.get(key);
  if (!t) { t = toTexture(drawGrumble(frame, helper)); frames.set(key, t); }
  return t;
}

/** Grumbles in the world, sorted in with Puff and the neighbours, each with its pip ring of tidies. */
export class GrumbleLayer {
  private shown = new Map<string, { sprite: Sprite; pips: Graphics }>();
  private clock = 0;
  reducedMotion = false;

  constructor(private actors: Container) {}

  draw(views: GrumbleView[], dt: number) {
    this.clock += dt;
    const seen = new Set<string>();
    for (const v of views) {
      seen.add(v.id);
      let s = this.shown.get(v.id);
      if (!s) {
        s = { sprite: new Sprite(), pips: new Graphics() };
        s.sprite.anchor.set(0.5, 1);
        this.actors.addChild(s.sprite, s.pips);
        this.shown.set(v.id, s);
      }
      const frame = this.reducedMotion ? 0 : Math.floor((this.clock + v.id.length * 170) / 450) % 2;
      s.sprite.texture = grumbleTexture(frame, v.helper);
      const x = Math.round(v.x); const y = Math.round(v.y);
      s.sprite.position.set(x, y); s.sprite.zIndex = y;
      s.pips.clear();
      if (!v.helper && v.pips > 0) {
        for (let i = 0; i < v.of; i += 1) s.pips.circle(x - (v.of - 1) * 2.5 + i * 5, y - 17, 1.6).fill(i < v.pips ? P.butter : P.white).stroke({ color: P.outline, width: 0.6 });
      }
      s.pips.zIndex = y + 1;
    }
    for (const [id, s] of this.shown) if (!seen.has(id)) { s.sprite.destroy(); s.pips.destroy(); this.shown.delete(id); }
  }
}
