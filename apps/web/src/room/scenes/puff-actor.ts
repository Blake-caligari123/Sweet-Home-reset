import { Sprite, type Texture } from 'pixi.js';
import { buildPuffSheet, PUFF_SIZE, type Outfit } from '../../shared/art/puff';
import type { Point, Rect } from '../game/pack';
import { subTextures, toTexture } from '../../shared/render/textures';

type Clip = 'idle' | 'blink' | 'hop' | 'walk_down' | 'walk_up' | 'walk_right' | 'sneeze' | 'sleepy' | 'spin';
const FPS: Record<Clip, number> = { idle: 5, blink: 14, hop: 14, walk_down: 10, walk_up: 10, walk_right: 10, sneeze: 9, sleepy: 2, spin: 8 };
const SPEED = 46; // room px per second
const FOOT = 45 / PUFF_SIZE;

const sheets = new Map<string, Record<Clip, Texture[]>>();
function clipsFor(outfit: Outfit) {
  const key = outfit ?? 'none';
  let clips = sheets.get(key);
  if (!clips) {
    const { sheet, frames } = buildPuffSheet(outfit);
    const texture = toTexture(sheet);
    clips = Object.fromEntries(Object.entries(frames).map(([name, list]) => [name, subTextures(texture, list, PUFF_SIZE)])) as Record<Clip, Texture[]>;
    sheets.set(key, clips);
  }
  return clips;
}

/** Puff as a frame-based pixel sprite with a small state machine (PUFF-ANIMATION-TASKS.md). */
export class PuffActor {
  readonly sprite: Sprite;
  private clips: Record<Clip, Texture[]>;
  private clip: Clip = 'idle';
  private frame = 0;
  private clock = 0;
  private x: number;
  private y: number;
  private target: Point | null = null;
  private oneShot: { clip: Clip; repeats: number; flip: boolean; done?: () => void } | null = null;
  private nextBlink = 3000;
  private blinking = 0;
  private flipped = false;
  reducedMotion = false;

  constructor(start: Point, private area: Rect, outfit: Outfit) {
    this.clips = clipsFor(outfit);
    this.sprite = new Sprite(this.clips.idle[0]);
    this.sprite.anchor.set(0.5, FOOT);
    this.sprite.eventMode = 'none';
    this.x = start.x; this.y = start.y;
    this.place();
  }

  setOutfit(outfit: Outfit) { this.clips = clipsFor(outfit); this.show(); }

  get position() { return { x: this.x, y: this.y }; }
  get busy() { return this.oneShot !== null; }

  walkTo(p: Point) {
    const a = this.area;
    this.target = { x: Math.min(a.x + a.w, Math.max(a.x, p.x)), y: Math.min(a.y + a.h, Math.max(a.y, p.y)) };
  }

  /** Play a clip once (or a few times), then return to idle. */
  play(clip: Clip, repeats = 1, done?: () => void) {
    if (this.reducedMotion && clip !== 'blink') repeats = 1;
    this.oneShot = { clip, repeats, flip: false, done };
    this.target = null;
    this.setClip(clip);
  }

  dance(done?: () => void) {
    this.play('hop', this.reducedMotion ? 1 : 4, done);
    if (this.oneShot) this.oneShot.flip = !this.reducedMotion;
  }

  private setClip(clip: Clip) {
    if (this.clip !== clip) { this.clip = clip; this.frame = 0; this.clock = 0; }
    this.show();
  }

  private show() {
    const list = this.blinking > 0 && this.clip === 'idle' ? this.clips.blink : this.clips[this.clip];
    this.sprite.texture = list[Math.min(this.frame, list.length - 1)];
  }

  private place() {
    this.sprite.position.set(Math.round(this.x), Math.round(this.y));
    this.sprite.scale.x = this.flipped ? -1 : 1;
    this.sprite.zIndex = Math.round(this.y);
  }

  update(dtMs: number) {
    if (!this.oneShot && this.target) {
      const dx = this.target.x - this.x; const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const step = (SPEED * dtMs) / 1000;
      if (dist <= step) { this.x = this.target.x; this.y = this.target.y; this.target = null; this.setClip('idle'); }
      else {
        this.x += (dx / dist) * step; this.y += (dy / dist) * step;
        if (Math.abs(dx) > Math.abs(dy)) { this.flipped = dx < 0; this.setClip('walk_right'); }
        else { this.flipped = false; this.setClip(dy < 0 ? 'walk_up' : 'walk_down'); }
      }
    }

    this.clock += dtMs;
    const frameMs = 1000 / FPS[this.clip];
    while (this.clock >= frameMs) {
      this.clock -= frameMs;
      if (this.clip === 'idle' && this.reducedMotion) { this.frame = 0; continue; }
      this.frame += 1;
      const length = this.clips[this.clip].length;
      if (this.frame >= length) {
        if (this.oneShot && this.oneShot.clip === this.clip) {
          this.oneShot.repeats -= 1;
          if (this.oneShot.flip) this.flipped = !this.flipped;
          if (this.oneShot.repeats <= 0) {
            const done = this.oneShot.done;
            this.oneShot = null; this.flipped = false;
            this.setClip('idle');
            done?.();
            continue;
          }
        }
        this.frame = 0;
      }
    }

    // Random blinks over idle, sometimes a double blink.
    if (this.clip === 'idle') {
      this.nextBlink -= dtMs;
      if (this.blinking > 0) this.blinking -= dtMs;
      if (this.nextBlink <= 0) { this.blinking = Math.random() < 0.15 ? 360 : 140; this.nextBlink = 2500 + Math.random() * 3500; }
    }
    this.show();
    this.place();
  }
}
