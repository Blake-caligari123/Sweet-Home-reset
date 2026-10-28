import { Container, Sprite, Texture, type Graphics } from 'pixi.js';
import { P } from '../../shared/art/palette';
import { PixelCanvas } from '../../shared/art/pixel-canvas';
import { toTexture } from '../../shared/render/textures';
import { T } from './art/texture';
import type { Area } from '../data/area';

// Gentle life in the world: petals drift outdoors by day, fireflies wander at night, dust motes
// float in homes, rain falls outdoors on rainy days, and lamps glow after dusk. Purely visual, never blocks a tap.
export const AMBIENT_MAX = 22;
export const isNight = (minutes: number) => minutes >= 19 * 60 || minutes < 6 * 60;
const isDusk = (minutes: number) => minutes >= 18 * 60 || minutes < 6 * 60 + 30;

type Mote = 'petal' | 'firefly' | 'dust' | 'rain' | 'leaf' | 'snow';
const RAIN_MAX = 90;
interface Drifter { sprite: Sprite; kind: Mote; x: number; y: number; vx: number; vy: number; phase: number; age: number; life: number }

let shapes: Record<Mote, Texture> | null = null;
function textures() {
  if (shapes) return shapes;
  const petal = new PixelCanvas(2, 2); petal.set(0, 0, P.white); petal.set(1, 0, P.white); petal.set(1, 1, P.white);
  const fly = new PixelCanvas(3, 3); fly.set(1, 0, P.white); fly.set(0, 1, P.white); fly.set(1, 1, P.white); fly.set(2, 1, P.white); fly.set(1, 2, P.white);
  const dust = new PixelCanvas(1, 1); dust.set(0, 0, P.white);
  const rain = new PixelCanvas(1, 6); for (let y = 0; y < 6; y += 1) rain.set(0, y, P.white);
  const flake = new PixelCanvas(2, 2); flake.rect(0, 0, 2, 2, P.white);
  shapes = { petal: toTexture(petal), firefly: toTexture(fly), dust: toTexture(dust), rain: toTexture(rain), leaf: toTexture(petal), snow: toTexture(flake) };
  return shapes;
}

let glowTex: Texture | null = null;
/** A soft round light, drawn once with a radial gradient (lighting, not pixel art). */
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,240,190,0.9)'); grad.addColorStop(0.4, 'rgba(255,225,160,0.35)'); grad.addColorStop(1, 'rgba(255,220,150,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  glowTex = Texture.from(c);
  return glowTex;
}

let vignetteTex: Texture | null = null;
export function vignetteTexture() {
  if (vignetteTex) return vignetteTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 40, 64, 64, 92);
  grad.addColorStop(0, 'rgba(83,66,57,0)'); grad.addColorStop(1, 'rgba(83,66,57,0.55)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  vignetteTex = Texture.from(c);
  return vignetteTex;
}

const LIGHTS: Record<string, [number, number, number]> = { lamppost: [8.5, -2, 44], lamp: [8, 2, 34] };

export class Ambience {
  readonly container = new Container();
  readonly lights = new Container();
  private live: Drifter[] = [];
  private pool: Sprite[] = [];
  private glows: Sprite[] = [];
  private area: Area | null = null;
  private spawnMs = 0;
  private clock = 0;
  minutes = 12 * 60;
  rainy = false;
  season = 'Spring';
  reducedMotion = false;

  constructor() {
    this.container.eventMode = 'none';
    this.lights.eventMode = 'none';
    this.lights.blendMode = 'add';
  }

  load(area: Area) {
    this.area = area;
    for (const d of this.live) this.release(d);
    this.live = [];
    this.lights.removeChildren().forEach((c) => c.destroy());
    this.glows = [];
    for (const p of area.pack.props) {
      const l = LIGHTS[p.type];
      if (!l) continue;
      const s = new Sprite(glowTexture());
      s.anchor.set(0.5);
      s.position.set(p.x * T + l[0], p.y * T + l[1]);
      s.width = s.height = l[2];
      s.alpha = 0;
      this.lights.addChild(s);
      this.glows.push(s);
    }
    // Start with a few already drifting so a new area never looks empty.
    for (let i = 0; i < 8; i += 1) this.spawn(true);
  }

  private kind(): Mote | null {
    if (!this.area) return null;
    if (this.area.pack.kind === 'home') return 'dust';
    if (this.area.pack.kind === 'cave') return null;
    if (this.rainy) return 'rain';
    if (this.season === 'Winter') return 'snow';
    if (isNight(this.minutes)) return 'firefly';
    return this.season === 'Autumn' ? 'leaf' : 'petal';
  }

  private release(d: Drifter) { this.container.removeChild(d.sprite); this.pool.push(d.sprite); }

  private spawn(anywhere = false) {
    const kind = this.kind();
    if (!kind || !this.area || this.live.length >= (kind === 'rain' ? RAIN_MAX : AMBIENT_MAX) || this.reducedMotion) return;
    const w = this.area.w * T; const h = this.area.h * T;
    const sprite = this.pool.pop() ?? new Sprite();
    sprite.texture = textures()[kind];
    sprite.anchor.set(0.5);
    sprite.alpha = 0;
    sprite.tint = kind === 'leaf' ? [P.peach, P.peachShade, P.butter, P.butterShade][Math.floor(Math.random() * 4)] : kind === 'snow' ? P.white : kind === 'rain' ? P.blueShade : kind === 'petal' ? [P.white, P.peachLight, P.peach, P.butterLight][Math.floor(Math.random() * 4)] : kind === 'firefly' ? P.butterLight : P.white;
    sprite.blendMode = kind === 'firefly' ? 'add' : 'normal';
    this.container.addChild(sprite);
    const drifts = kind === 'petal' || kind === 'leaf';
    const x = drifts && !anywhere ? -8 + Math.random() * w * 0.6 : Math.random() * w;
    const y = (drifts || kind === 'rain' || kind === 'snow') && !anywhere ? -8 : Math.random() * h;
    const d: Drifter = {
      sprite, kind, x, y, phase: Math.random() * Math.PI * 2, age: anywhere ? Math.random() * 3000 : 0,
      vx: kind === 'rain' ? -8 : kind === 'snow' ? -2 + Math.random() * 4 : drifts ? 8 + Math.random() * 6 : (Math.random() - 0.5) * 4,
      vy: kind === 'rain' ? 150 + Math.random() * 40 : kind === 'snow' ? 10 + Math.random() * 6 : drifts ? 7 + Math.random() * 5 : kind === 'dust' ? -1.5 - Math.random() * 1.5 : (Math.random() - 0.5) * 4,
      life: kind === 'rain' ? (h / 160) * 1000 + 400 : drifts || kind === 'snow' ? 14000 : 6000 + Math.random() * 5000
    };
    this.live.push(d);
  }

  update(dt: number) {
    this.clock += dt;
    const glow = isNight(this.minutes) ? 1 : isDusk(this.minutes) ? 0.55 : 0;
    for (let i = 0; i < this.glows.length; i += 1) {
      const flicker = this.reducedMotion ? 0 : Math.sin(this.clock / 400 + i * 1.7) * 0.06;
      this.glows[i].alpha += ((glow ? glow * (0.75 + flicker) : 0) - this.glows[i].alpha) * Math.min(1, dt / 300);
    }
    if (this.reducedMotion) { if (this.live.length) { for (const d of this.live) this.release(d); this.live = []; } return; }
    this.spawnMs -= dt;
    if (this.spawnMs <= 0) { this.spawn(); this.spawnMs = this.kind() === 'rain' ? 20 : this.kind() === 'snow' ? 260 : this.kind() === 'petal' || this.kind() === 'leaf' ? 650 : 420; }
    const s = dt / 1000;
    const want = this.kind();
    for (let i = this.live.length - 1; i >= 0; i -= 1) {
      const d = this.live[i];
      d.age += dt;
      // Motes of the wrong kind (dusk fell, or day broke) fade out early.
      if (d.age >= d.life || (d.kind !== want && d.age < d.life - 800)) d.age = Math.max(d.age, d.life - 800);
      if (d.age >= d.life) { this.release(d); this.live.splice(i, 1); continue; }
      const petalish = d.kind === 'petal' || d.kind === 'leaf';
      d.phase += s * (petalish ? 2.4 : 1.1);
      const sway = d.kind === 'rain' ? 0 : Math.sin(d.phase);
      d.x += (d.vx + (petalish ? sway * 10 : sway * 3)) * s;
      d.y += (d.vy + (d.kind === 'firefly' ? Math.cos(d.phase * 0.7) * 3 : 0)) * s;
      d.sprite.position.set(Math.round(d.x), Math.round(d.y));
      const fade = Math.min(1, d.age / 700, (d.life - d.age) / 800);
      const base = d.kind === 'rain' ? 0.85 : d.kind === 'dust' ? 0.55 : d.kind === 'firefly' ? 0.6 + 0.4 * Math.max(0, Math.sin(d.phase * 2.3)) : 0.95;
      d.sprite.alpha = Math.max(0, fade * base);
    }
  }
}

/** Expanding ring where the player tapped, in world pixels. */
export function drawTapRing(g: Graphics, x: number, y: number, t: number) {
  const k = Math.min(1, t);
  g.clear();
  g.ellipse(x, y, 3 + k * 6, 1.5 + k * 3).stroke({ width: 1, color: P.white, alpha: 0.95 * (1 - k) });
  if (k < 0.6) g.ellipse(x, y, 1.5, 1).fill({ color: P.white, alpha: 0.9 * (1 - k / 0.6) });
}
