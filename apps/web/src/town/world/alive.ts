import { Container, Sprite, Texture } from 'pixi.js';
import { P } from '../../shared/art/palette';
import { PixelCanvas } from '../../shared/art/pixel-canvas';
import { toTexture } from '../../shared/render/textures';
import type { AliveEffect, AliveStage } from '../play/alive';
import { drawItemIcon } from './art/items';
import { T } from './art/texture';
import { glowTexture } from './ambience';

// Draws a home coming alive (claude/ALIVE-PLAN.md): lamp glows, a sunbeam with dancing motes,
// a sleepy cat, decor. Stages already reached show at once; a new one fades in.
interface Shown { effect: AliveEffect; sprite: Sprite; target: number; motes?: Sprite[] }

const FADE_MS = 700;

/** How much daylight there is (0..1) at a time of day: full 7:00–17:00, easing in and out. */
export function daylight(minutes: number) {
  const h = (minutes / 60) % 24;
  return Math.max(0, Math.min(1, h - 6, (19 - h) / 2));
}
const MOTES = 7;

/** A slanting shaft of window light, wide at the floor (lighting, so a soft gradient). */
function sunbeamTexture(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255,244,200,0.55)'); grad.addColorStop(1, 'rgba(255,236,180,0)');
  g.fillStyle = grad;
  g.beginPath(); g.moveTo(w * 0.15, 0); g.lineTo(w * 0.55, 0); g.lineTo(w, h); g.lineTo(w * 0.35, h); g.closePath(); g.fill();
  return Texture.from(c);
}

/** A cat curled up asleep, two frames of tail. */
function catTexture(frame: number) {
  const pc = new PixelCanvas(16, 11);
  pc.ellipse(8, 7, 6, 3, P.peach);
  pc.ellipse(4, 5, 3, 3, P.peach);
  pc.set(2, 2, P.peach); pc.set(3, 2, P.peach); pc.set(5, 2, P.peach); pc.set(6, 2, P.peach);
  pc.hline(3, 5, 2, P.ink);
  for (const x of [7, 10]) pc.vline(x, 5, 3, P.peachShade);
  const tail = frame ? [[13, 7], [14, 6], [15, 5]] : [[13, 8], [14, 8], [15, 7]];
  for (const [x, y] of tail) pc.set(x, y, P.peachShade);
  pc.outlineShapes(P.outline);
  return toTexture(pc);
}

export class AliveLayer {
  /** Drawn on the floor, under Puff and the neighbours. */
  readonly under = new Container();
  /** Added light (lamp glows, sunbeams). */
  readonly lights = new Container();
  private shown: Shown[] = [];
  private cat: Texture[] | null = null;
  private clock = 0;
  reducedMotion = false;

  constructor() {
    this.under.eventMode = 'none';
    this.lights.eventMode = 'none';
    this.lights.blendMode = 'add';
  }

  /** A new area: show the stages it has already reached, no fanfare. */
  load(stages: AliveStage[], reached: number) {
    for (const s of this.shown) s.sprite.destroy();
    this.shown = [];
    this.under.removeChildren(); this.lights.removeChildren();
    stages.slice(0, reached).forEach((st) => this.add(st, true));
  }

  /** A stage just reached: its effects fade in. */
  add(stage: AliveStage, now = false) {
    for (const effect of stage.effects) {
      const sprite = this.spriteFor(effect);
      if (!sprite) continue;
      sprite.alpha = now ? 1 : 0;
      const motes = effect.type === 'sunbeam' && !this.reducedMotion ? this.motes(effect) : undefined;
      this.shown.push({ effect, sprite, target: 1, motes });
    }
  }

  private spriteFor(e: AliveEffect): Sprite | null {
    switch (e.type) {
      case 'glow': {
        const s = new Sprite(glowTexture()); s.anchor.set(0.5); s.position.set(e.x * T, e.y * T); s.width = s.height = e.size;
        this.lights.addChild(s); return s;
      }
      case 'sunbeam': {
        const s = new Sprite(sunbeamTexture(e.w * T, e.h * T)); s.position.set(e.x * T, e.y * T);
        this.lights.addChild(s); return s;
      }
      case 'cat': {
        this.cat ??= [catTexture(0), catTexture(1)];
        const s = new Sprite(this.cat[0]); s.anchor.set(0.5, 1); s.position.set(e.x * T, e.y * T);
        this.under.addChild(s); return s;
      }
      case 'decor': {
        const pc = new PixelCanvas(14, 14); drawItemIcon(pc, e.item);
        const s = new Sprite(toTexture(pc)); s.anchor.set(0.5); s.position.set(e.x * T, e.y * T);
        this.under.addChild(s); return s;
      }
      default: return null;
    }
  }

  private motes(e: Extract<AliveEffect, { type: 'sunbeam' }>) {
    const dot = new PixelCanvas(1, 1); dot.set(0, 0, P.white);
    const tex = toTexture(dot);
    return Array.from({ length: MOTES }, (_, i) => {
      const m = new Sprite(tex); m.tint = P.butterLight; m.alpha = 0;
      m.position.set((e.x + e.w * (0.3 + 0.5 * ((i * 37) % 10) / 10)) * T, (e.y + e.h * ((i * 53) % 10) / 10) * T);
      this.lights.addChild(m); return m;
    });
  }

  /** `day`: how much daylight there is (0..1), for the sunbeam. */
  update(dt: number, day: number) {
    this.clock += dt;
    for (const s of this.shown) {
      const want = s.effect.type === 'sunbeam' ? s.target * day : s.target;
      s.sprite.alpha += (want - s.sprite.alpha) * Math.min(1, dt / FADE_MS);
      if (s.effect.type === 'glow' && !this.reducedMotion) s.sprite.alpha *= 0.94 + Math.sin(this.clock / 380) * 0.06;
      if (s.effect.type === 'cat' && this.cat) s.sprite.texture = this.cat[Math.floor(this.clock / 900) % 2];
      s.motes?.forEach((m, i) => {
        const t = this.clock / 1000 + i * 1.3;
        m.y -= dt * 0.004; if (m.y < s.sprite.y) m.y = s.sprite.y + s.sprite.height;
        m.x += Math.sin(t) * dt * 0.003;
        m.alpha = s.sprite.alpha * (0.5 + 0.5 * Math.sin(t * 1.7));
      });
    }
  }
}
