import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { P } from '../../shared/art/palette';
import { toTexture } from '../../shared/render/textures';
import { faceFor } from '../grumbles/grumbles';
import { drawGrumble } from './art/grumbles';
import type { SpriteBank } from './sprites';

/** A Grumble to draw: feet at x, y (world px); `pips` filled of `of` while still grumpy. */
export interface GrumbleView { id: string; family: string; x: number; y: number; helper: boolean; pips: number; of: number }

const frames = new Map<string, Texture>();
function grumbleTexture(frame: number, helper: boolean) {
  const key = `${frame}:${helper}`;
  let t = frames.get(key);
  if (!t) { t = toTexture(drawGrumble(frame, helper)); frames.set(key, t); }
  return t;
}

/**
 * Grumbles in the world, sorted in with Puff and the neighbours, each with its pip ring of tidies.
 * With Blake's sheets (`grumble_<family>_grumpy` / `_bright`) a Grumble cheers up face by face as it's
 * tidied, with a gentle bob in code; until they load, the code-drawn puff stands in.
 */
export class GrumbleLayer {
  private shown = new Map<string, { sprite: Sprite; pips: Graphics }>();
  private clock = 0;
  private bank: SpriteBank | null = null;
  reducedMotion = false;

  constructor(private actors: Container) {}

  setSprites(bank: SpriteBank) { this.bank = bank; }

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
      const bob = this.reducedMotion ? 0 : Math.floor((this.clock + v.id.length * 170) / 450) % 2;
      const sheet = `grumble_${v.family}_${v.helper ? 'bright' : 'grumpy'}`;
      const art = this.bank?.frames(sheet);
      if (art && this.bank) {
        s.sprite.texture = art[v.helper ? 0 : faceFor(v.pips, v.of)] ?? art[0];
        s.sprite.scale.set(1 / this.bank.scale(sheet));
      } else { s.sprite.texture = grumbleTexture(bob, v.helper); s.sprite.scale.set(1); }
      const x = Math.round(v.x); const y = Math.round(v.y) - (art ? bob : 0);
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
