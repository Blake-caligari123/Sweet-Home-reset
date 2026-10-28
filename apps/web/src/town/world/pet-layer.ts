import { Graphics, Sprite, type Container, type Texture } from 'pixi.js';
import { P } from '../../shared/art/palette';
import { toTexture } from '../../shared/render/textures';
import { drawPet } from './art/pets';
import type { SpriteBank } from './sprites';

/** The pet to draw: feet at x, y (world px). */
export interface PetView { kind: string; x: number; y: number; left: boolean; moving: boolean }

const frames = new Map<string, Texture>();
function petTexture(kind: string, frame: number) {
  const key = `${kind}:${frame}`;
  let t = frames.get(key);
  if (!t) { t = toTexture(drawPet(kind, frame)); frames.set(key, t); }
  return t;
}

/**
 * Puff's pet in the world, sorted in with everyone else: trots while moving, still otherwise. Uses
 * Blake's sheets (`pet_<kind>_walk`, `pet_<kind>_idle`, facing right) once they load.
 */
export class PetLayer {
  private sprite = new Sprite();
  private shadow = new Graphics().ellipse(0, 0, 6, 2).fill({ color: P.ink, alpha: 0.25 });
  private clock = 0;
  private bank: SpriteBank | null = null;
  reducedMotion = false;

  constructor(actors: Container) {
    this.sprite.anchor.set(0.5, 1);
    this.sprite.visible = this.shadow.visible = false;
    actors.addChild(this.shadow, this.sprite);
  }

  setSprites(bank: SpriteBank) { this.bank = bank; }

  draw(v: PetView | null, dt: number) {
    this.sprite.visible = this.shadow.visible = !!v;
    if (!v) return;
    this.clock += dt;
    const sheet = `pet_${v.kind}_${v.moving ? 'walk' : 'idle'}`;
    const art = this.bank?.frames(sheet);
    const still = this.reducedMotion || (!v.moving && !art);
    const tick = Math.floor(this.clock / (v.moving ? 140 : 400));
    const k = art && this.bank ? 1 / this.bank.scale(sheet) : 1;
    this.sprite.texture = art ? art[still ? 0 : tick % art.length] : petTexture(v.kind, still ? 0 : tick % 2);
    this.sprite.scale.set(v.left ? -k : k, k);
    const x = Math.round(v.x); const y = Math.round(v.y);
    this.sprite.position.set(x, y); this.sprite.zIndex = y;
    this.shadow.position.set(x, y - 1); this.shadow.zIndex = y - 1;
  }
}
