import { Sprite, type Container, type Texture } from 'pixi.js';
import { toTexture } from '../../shared/render/textures';
import type { Dir } from './art/characters';
import { drawOutfit } from './art/outfits';

/** Where a piece sits on Puff: up from the feet as a share of Puff's height, and across (facing right). */
const ON_PUFF: Record<string, { up: number; across: number; front?: boolean }> = {
  peach_bow: { up: 0.8, across: 4 }, star_clip: { up: 0.8, across: 4 },
  berry_hat: { up: 0.84, across: 0 }, flower_crown: { up: 0.8, across: 0 },
  leaf_scarf: { up: 0.39, across: 0 }, keeper_badge: { up: 0.28, across: 3, front: true }
};

const textures = new Map<string, Texture>();
function outfitTexture(id: string) {
  let t = textures.get(id);
  if (!t) { t = toTexture(drawOutfit(id)); textures.set(id, t); }
  return t;
}

/** The outfit Puff is wearing, drawn on top of Puff and following them about. */
export class OutfitLayer {
  private sprite = new Sprite();

  constructor(actors: Container) {
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.visible = false;
    actors.addChild(this.sprite);
  }

  /** x, y: Puff's feet (bottom-centre of the sprite) in world px; `height`: Puff's drawn height. */
  draw(id: string | null, x: number, y: number, height: number, dir: Dir) {
    const at = id ? ON_PUFF[id] : undefined;
    // Seen from behind, things on Puff's front are hidden.
    this.sprite.visible = !!at && !(at.front && dir === 'up');
    if (!id || !at) return;
    this.sprite.texture = outfitTexture(id);
    const side = dir === 'left' ? -1 : 1;
    this.sprite.position.set(Math.round(x + at.across * side), Math.round(y - height * at.up));
    this.sprite.scale.x = side;
    this.sprite.zIndex = y + 2;
  }
}
