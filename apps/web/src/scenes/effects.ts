import { Container, Sprite, type Texture } from 'pixi.js';
import { P } from '../art/palette';
import { PixelCanvas } from '../art/pixel-canvas';
import type { Point } from '../game/pack';
import { toTexture } from './textures';

let steamFrames: Texture[] | null = null;
function steam() {
  if (steamFrames) return steamFrames;
  steamFrames = [0, 1, 2, 3].map((f) => {
    const pc = new PixelCanvas(9, 14);
    for (let w = 0; w < 2; w += 1) {
      for (let y = 0; y < 14; y += 1) {
        const phase = (y + f * 3 + w * 5) % 12;
        if (phase > 7) continue;
        const x = 2 + w * 4 + Math.round(Math.sin((y + f * 2 + w * 3) / 2.2));
        pc.set(x, 13 - y, P.white, y > 9 ? 140 : 220);
      }
    }
    return toTexture(pc);
  });
  return steamFrames;
}

let twinkleFrames: Texture[] | null = null;
function twinkle() {
  if (twinkleFrames) return twinkleFrames;
  const small = new PixelCanvas(7, 7); small.set(3, 2, P.white); small.set(3, 4, P.white); small.set(2, 3, P.white); small.set(4, 3, P.white); small.set(3, 3, P.butterLight);
  const big = new PixelCanvas(7, 7); big.rect(3, 0, 1, 7, P.white); big.rect(0, 3, 7, 1, P.white); big.rect(2, 2, 3, 3, P.butterLight); big.set(3, 3, P.white);
  twinkleFrames = [toTexture(small), toTexture(big)];
  return twinkleFrames;
}

/** Small looping pixel animations: steam from a mug, twinkles on a restored room. */
export class LoopEffects {
  readonly container = new Container();
  private items: { sprite: Sprite; frames: Texture[]; ms: number; clock: number; frame: number; offset: number }[] = [];
  reducedMotion = false;

  constructor() { this.container.eventMode = 'none'; }

  addSteam(x: number, y: number) {
    const frames = steam();
    const sprite = new Sprite(frames[0]);
    sprite.anchor.set(0.5, 1); sprite.position.set(x, y);
    this.container.addChild(sprite);
    this.items.push({ sprite, frames, ms: 220, clock: 0, frame: 0, offset: 0 });
  }

  addTwinkles(points: Point[]) {
    const frames = twinkle();
    points.forEach((p, i) => {
      const sprite = new Sprite(frames[0]);
      sprite.anchor.set(0.5); sprite.position.set(p.x, p.y);
      this.container.addChild(sprite);
      this.items.push({ sprite, frames: [frames[0], frames[1], frames[0], frames[0]], ms: 260, clock: 0, frame: i % 4, offset: i * 90 });
    });
  }

  update(dtMs: number) {
    for (const it of this.items) {
      if (this.reducedMotion) { it.sprite.texture = it.frames[0]; continue; }
      it.clock += dtMs;
      if (it.clock >= it.ms + it.offset) { it.clock = 0; it.offset = 0; it.frame = (it.frame + 1) % it.frames.length; it.sprite.texture = it.frames[it.frame]; }
    }
  }

  clear() {
    this.container.removeChildren();
    this.items = [];
  }
}

/** A blinking pixel ring that points at the next spot to clean. */
export function hintRing() {
  const pc = new PixelCanvas(21, 21);
  for (let a = 0; a < 48; a += 1) {
    const t = (a / 48) * Math.PI * 2;
    pc.set(10 + Math.round(Math.cos(t) * 9), 10 + Math.round(Math.sin(t) * 9), a % 6 < 3 ? P.white : P.butterShade);
  }
  return toTexture(pc);
}

export function keyboardCursor() {
  const pc = new PixelCanvas(11, 11);
  for (let a = 0; a < 32; a += 1) {
    const t = (a / 32) * Math.PI * 2;
    pc.set(5 + Math.round(Math.cos(t) * 5), 5 + Math.round(Math.sin(t) * 5), P.ink);
  }
  pc.set(5, 5, P.ink);
  return toTexture(pc);
}
