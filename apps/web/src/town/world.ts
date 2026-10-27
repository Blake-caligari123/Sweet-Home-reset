import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { P } from '../art/palette';
import { PixelCanvas } from '../art/pixel-canvas';
import { Particles } from '../scenes/particles';
import { toCanvas, toTexture } from '../scenes/textures';
import { drawCrop, drawMess, drawPuff24, drawToolMini, T, type Dir } from './art';
import { Ambience, drawTapRing, vignetteTexture } from './ambience';
import type { Area } from './area';
import { bakeArea } from './bake';
import { FULL_COLOUR, type AreaMess } from './mess';
import { blinkClip, breathScale, CLIP_FPS, puffClip, type SpriteBank } from './sprites';
import { RIPPLE_MS } from './tuning';

// The world layer (FRONTEND-PLAN §3): baked ground, a drained overlay whose per-tile alpha
// follows the colour array, mess sprites, actors sorted by foot y, effects and the time tint.
// The logical view is about 11 tiles wide, scaled by whole device pixels.
export const VIEW_TILES = 11;
const MARKER_MS = 450;
/** Blink sequence over idle: half-closed, closed, half-closed. */
const BLINK_SEQ = [0, 1, 0];
const BLINK_MS = (BLINK_SEQ.length * 1000) / CLIP_FPS.blink;

const messTextures = new Map<string, Texture>();
function messTexture(type: string, variant: number, item?: string) {
  const key = `${type}:${variant % 4}:${item ?? ''}`;
  let t = messTextures.get(key);
  if (!t) { t = toTexture(drawMess(type, variant % 4, item)); messTextures.set(key, t); }
  return t;
}

const puffFrames = new Map<string, Texture>();
function puffTexture(dir: Dir, frame: number, pose: Parameters<typeof drawPuff24>[2]) {
  const key = `${dir}:${frame}:${pose}`;
  let t = puffFrames.get(key);
  if (!t) { t = toTexture(drawPuff24(dir, frame, pose)); puffFrames.set(key, t); }
  return t;
}

const toolMinis = new Map<string, Texture>();
function toolTexture(tool: string) {
  let t = toolMinis.get(tool);
  if (!t) { t = toTexture(drawToolMini(tool)); toolMinis.set(tool, t); }
  return t;
}

const cropTextures = new Map<string, Texture>();
function cropTexture(stage: number, watered: boolean) {
  const key = `${stage}:${watered}`;
  let t = cropTextures.get(key);
  if (!t) { t = toTexture(drawCrop(stage, watered)); cropTextures.set(key, t); }
  return t;
}

export interface PuffView { x: number; y: number; dir: Dir; pose: 'walk' | 'idle' | 'swing' | 'sleep' | 'hop'; tool: string | null }

export class World {
  readonly root = new Container();
  private backdrop = new Graphics();
  private stage = new Container();
  private base = new Sprite();
  private drained = new Sprite();
  private messLayer = new Container();
  private cropLayer = new Container();
  readonly actors = new Container();
  readonly particles = new Particles();
  private tint = new Graphics();
  private marker = new Graphics();
  private highlight = new Graphics();
  private vignette = new Sprite(vignetteTexture());
  readonly ambience = new Ambience();
  private markerAt = { x: 0, y: 0 };
  private sprites: SpriteBank | null = null;
  private blink = { nextMs: 3000, playMs: 0, again: false };
  private puff = new Sprite();
  private puffShadow = new Graphics();
  private toolSprite = new Sprite();
  private messSprites = new Map<number, Sprite>();
  private cropSprites = new Map<number, Sprite>();
  private drainCanvas: HTMLCanvasElement | null = null;
  private drainCtx: CanvasRenderingContext2D | null = null;
  private drainImage: ImageData | null = null;
  private drainedPixels: Uint8ClampedArray | null = null;
  private drainTexture: Texture | null = null;
  private shownColour: Float32Array = new Float32Array(0);
  private area: Area | null = null;
  private mess: AreaMess | null = null;
  private animClock = 0;
  private markerMs = 0;
  private scale = 1;
  private cam = { x: 0, y: 0 };
  reducedMotion = false;

  constructor(private app: Application) {
    this.root.addChild(this.backdrop, this.stage);
    this.actors.sortableChildren = true;
    this.puff.anchor.set(0.5, 1);
    this.toolSprite.anchor.set(0.5);
    for (const c of [this.base, this.drained, this.messLayer, this.cropLayer, this.actors, this.particles.container, this.tint, this.marker, this.highlight, this.vignette]) c.eventMode = 'none';
    this.stage.addChild(this.base, this.drained, this.cropLayer, this.messLayer, this.highlight, this.marker, this.actors, this.particles.container, this.ambience.container, this.tint, this.ambience.lights);
    this.root.addChild(this.vignette);
    this.puffShadow.ellipse(0, 0, 7, 2.5).fill({ color: P.ink, alpha: 0.28 });
    this.actors.addChild(this.puffShadow, this.puff, this.toolSprite);
  }

  /** Show an area: bake it, build the drained overlay from the colour array, place mess. */
  load(area: Area, mess: AreaMess) {
    this.area = area; this.mess = mess;
    const { colour, drained } = bakeArea(area);
    this.base.texture?.destroy(true);
    this.base.texture = toTexture(colour);
    this.drainedPixels = drained.data;
    this.drainCanvas = toCanvas(new PixelCanvas(colour.width, colour.height));
    this.drainCtx = this.drainCanvas.getContext('2d')!;
    this.drainImage = this.drainCtx.getImageData(0, 0, colour.width, colour.height);
    this.shownColour = Float32Array.from(mess.colour);
    for (let i = 0; i < mess.colour.length; i += 1) this.paintDrainTile(i, mess.colour[i]);
    this.drainCtx.putImageData(this.drainImage, 0, 0);
    this.drainTexture?.destroy(true);
    this.drainTexture = Texture.from(this.drainCanvas);
    this.drained.texture = this.drainTexture;
    this.syncDrainedVisible();
    this.messLayer.removeChildren().forEach((c) => c.destroy());
    this.messSprites.clear();
    for (let i = 0; i < mess.type.length; i += 1) this.syncMess(i);
    this.cropLayer.removeChildren().forEach((c) => c.destroy());
    this.cropSprites.clear();
    this.particles.clear();
    this.ambience.load(area);
    this.resize();
  }

  private paintDrainTile(i: number, level: number) {
    if (!this.area || !this.drainImage || !this.drainedPixels) return;
    const tx = (i % this.area.w) * T; const ty = Math.floor(i / this.area.w) * T;
    const w = this.area.w * T;
    const alpha = Math.round(255 * Math.max(0, Math.min(1, (FULL_COLOUR - level) / FULL_COLOUR)));
    const d = this.drainImage.data; const s = this.drainedPixels;
    for (let y = ty; y < ty + T; y += 1) {
      for (let x = tx; x < tx + T; x += 1) {
        const k = (y * w + x) * 4;
        d[k] = s[k]; d[k + 1] = s[k + 1]; d[k + 2] = s[k + 2]; d[k + 3] = s[k + 3] ? alpha : 0;
      }
    }
  }

  /** Bring one tile's mess sprite in line with the mess arrays. */
  syncMess(i: number) {
    if (!this.mess || !this.area) return;
    const type = this.mess.type[i];
    const existing = this.messSprites.get(i);
    if (!type) {
      if (existing) { existing.destroy(); this.messSprites.delete(i); }
      return;
    }
    const name = ['none', 'dust', 'stain', 'grime', 'cobweb', 'crumbs', 'fog', 'clutter', 'weeds', 'mud'][type];
    const tex = messTexture(name, i, this.mess.item[i]);
    if (existing) { existing.texture = tex; return; }
    const sprite = new Sprite(tex);
    sprite.position.set((i % this.area.w) * T, Math.floor(i / this.area.w) * T);
    this.messLayer.addChild(sprite);
    this.messSprites.set(i, sprite);
  }

  /** Colour changed on these tiles: animate the drained overlay toward the new levels. */
  colourChanged(tiles: number[]) {
    if (this.reducedMotion || !this.drainCtx) { for (const i of tiles) this.shownColour[i] = this.mess!.colour[i]; this.redrawTiles(tiles); }
  }

  private redrawTiles(tiles: number[]) {
    if (!this.drainCtx || !this.drainImage || !this.area) return;
    for (const i of tiles) this.paintDrainTile(i, this.shownColour[i]);
    this.drainCtx.putImageData(this.drainImage, 0, 0);
    this.drainTexture?.source.update();
    this.syncDrainedVisible();
  }

  /** A fully coloured area needs no grey overlay: skip drawing that full-screen layer. */
  private syncDrainedVisible() {
    this.drained.visible = this.shownColour.some((v) => v < FULL_COLOUR);
  }

  setCrops(crops: { x: number; y: number; stage: number; watered: boolean }[]) {
    if (!this.area) return;
    const seen = new Set<number>();
    for (const c of crops) {
      const i = c.y * this.area.w + c.x; seen.add(i);
      let s = this.cropSprites.get(i);
      if (!s) { s = new Sprite(); s.position.set(c.x * T, c.y * T); this.cropLayer.addChild(s); this.cropSprites.set(i, s); }
      s.texture = cropTexture(c.stage, c.watered);
    }
    for (const [i, s] of this.cropSprites) if (!seen.has(i)) { s.destroy(); this.cropSprites.delete(i); }
  }

  /** Glow on tiles the onboarding points at. */
  setHighlight(tiles: { x: number; y: number }[]) {
    this.highlight.clear();
    for (const t of tiles) this.highlight.rect(t.x * T, t.y * T, T, T).stroke({ width: 1, color: P.white, alpha: 0.9 });
  }

  showMarker(x: number, y: number) {
    this.markerMs = MARKER_MS;
    this.markerAt = { x: x * T + T / 2, y: y * T + T - 4 };
    drawTapRing(this.marker, this.markerAt.x, this.markerAt.y, 0);
  }

  /** Time-of-day tint over the world only (never the HUD). */
  setTint(minutes: number) {
    this.ambience.minutes = minutes;
    const h = minutes / 60;
    const [colour, alpha] = h < 8 ? [P.butter, 0.14] : h < 16 ? [P.white, 0] : h < 19 ? [P.peach, 0.16] : h < 21 ? [P.peachShade, 0.22] : [P.blueShade, 0.34];
    this.tint.clear();
    if (this.area && alpha > 0) this.tint.rect(0, 0, this.area.w * T, this.area.h * T).fill({ color: colour, alpha });
  }

  sparkleBurst(x: number, y: number, count = 14) {
    this.particles.burst('sparkle', x * T + T / 2, y * T + T / 2, count, [P.white, P.butterLight, P.butter], 40, 10);
  }

  dustPuff(x: number, y: number) {
    this.particles.burst('puff', x * T + T / 2, y * T + T / 2, 6, [P.greyLight, P.white], 24, -10);
  }

  resize() {
    const { width, height } = this.app.screen;
    const dpr = this.app.renderer.resolution;
    const k = Math.max(1, Math.floor((width * dpr) / (VIEW_TILES * T)));
    this.scale = k / dpr;
    this.stage.scale.set(this.scale);
    this.backdrop.clear().rect(0, 0, width, height).fill(this.area?.pack.edge ?? P.ink);
    this.root.hitArea = this.app.screen;
    this.vignette.width = width; this.vignette.height = height;
    this.follow(this.cam.x, this.cam.y, true);
  }

  /** Centre the camera on a world pixel point, clamped to the map; small maps sit centred. */
  follow(px: number, py: number, snap = false) {
    if (!this.area) return;
    const { width, height } = this.app.screen;
    const viewW = width / this.scale; const viewH = height / this.scale;
    const mapW = this.area.w * T; const mapH = this.area.h * T;
    const targetX = mapW <= viewW ? (mapW - viewW) / 2 : Math.max(0, Math.min(mapW - viewW, px - viewW / 2));
    const targetY = mapH <= viewH ? (mapH - viewH) / 2 : Math.max(0, Math.min(mapH - viewH, py - viewH / 2));
    this.cam.x = snap ? targetX : this.cam.x + (targetX - this.cam.x) * 0.2;
    this.cam.y = snap ? targetY : this.cam.y + (targetY - this.cam.y) * 0.2;
    const dpr = this.app.renderer.resolution;
    this.stage.position.set(Math.round(-this.cam.x * this.scale * dpr) / dpr, Math.round(-this.cam.y * this.scale * dpr) / dpr);
  }

  /** Screen point → tile. */
  tileAt(sx: number, sy: number) {
    const p = this.stage.toLocal({ x: sx, y: sy });
    return { x: Math.floor(p.x / T), y: Math.floor(p.y / T) };
  }

  /** World pixel → screen point, for the speech bubble. */
  toScreen(px: number, py: number) { return this.stage.toGlobal({ x: px, y: py }); }

  /** Puff's current draw scale and texture, for the ?debug test hook. */
  get puffDebug() { return { sx: this.puff.scale.x, sy: this.puff.scale.y, frame: this.puff.texture.frame.x }; }

  /** How tall Puff is drawn right now, in world pixels (for placing the speech bubble). */
  get puffHeight() { return Math.abs(this.puff.height); }

  /** Character sprite sheets as they arrive; until then Puff is code-drawn. */
  setSprites(bank: SpriteBank) { this.sprites = bank; }

  drawPuff(v: PuffView, dt: number) {
    this.animClock += dt;
    const clip = this.sprites ? puffClip(v.dir, v.pose, this.sprites.has, v.tool) : null;
    let lift = 0;
    if (clip && this.sprites) {
      const frames = this.sprites.frames(clip.name)!;
      const still = this.reducedMotion && v.pose === 'idle';
      const i = clip.hold ?? (still ? 0 : Math.floor((this.animClock / 1000) * CLIP_FPS[v.pose]) % frames.length);
      this.puff.texture = (v.pose === 'idle' && this.blinkFrame(v.dir, dt)) || frames[i];
      const k = 1 / this.sprites.scale(clip.name);
      const [bx, by] = v.pose === 'idle' && !this.reducedMotion ? breathScale(this.animClock) : [1, 1];
      this.puff.scale.set((clip.mirror ? -k : k) * bx, k * by);
      if (clip.lift && !this.reducedMotion) lift = clip.lift[i % clip.lift.length];
    } else {
      const fps = v.pose === 'walk' ? 10 : v.pose === 'swing' || v.pose === 'hop' ? 14 : 4;
      const frames = v.pose === 'idle' ? 4 : v.pose === 'sleep' ? 1 : 6;
      const frame = this.reducedMotion && v.pose === 'idle' ? 0 : Math.floor((this.animClock / 1000) * fps) % frames;
      this.puff.texture = puffTexture(v.dir, frame, v.pose === 'swing' ? 'idle' : v.pose);
      this.puff.scale.set(1, 1);
    }
    const px = Math.round(v.x * T + T / 2); const py = Math.round(v.y * T + T - 1);
    this.puff.position.set(px, py - lift);
    this.puff.zIndex = py;
    this.puffShadow.position.set(px, py - 1);
    this.puffShadow.zIndex = py - 1;
    if (v.pose === 'swing' && v.tool && v.tool !== 'hands' && !clip?.withTool) {
      const off = { down: [0, 4], up: [0, -14], right: [10, -6], left: [-10, -6] }[v.dir];
      const wiggle = Math.floor(this.animClock / 70) % 2 ? 1 : -1;
      this.toolSprite.texture = toolTexture(v.tool);
      this.toolSprite.visible = true;
      this.toolSprite.position.set(px + off[0] + wiggle, py + off[1] - 4);
      this.toolSprite.zIndex = py + (v.dir === 'up' ? -1 : 1);
    } else this.toolSprite.visible = false;
  }

  /** Blinks over idle every 2.5–6 s, sometimes twice; they still play with reduced motion. */
  private blinkFrame(dir: Dir, dt: number): Texture | null {
    const clip = this.sprites && blinkClip(dir, this.sprites.has);
    if (!clip || !this.sprites) return null;
    const b = this.blink;
    if (b.playMs <= 0) {
      b.nextMs -= dt;
      if (b.nextMs > 0) return null;
      b.nextMs = 2500 + Math.random() * 3500; b.playMs = BLINK_MS; b.again = Math.random() < 0.15;
    }
    b.playMs -= dt;
    const step = Math.min(BLINK_SEQ.length - 1, Math.floor(((BLINK_MS - Math.max(0, b.playMs)) / BLINK_MS) * BLINK_SEQ.length));
    if (b.playMs <= 0 && b.again) { b.again = false; b.playMs = BLINK_MS; }
    return this.sprites.frames(clip.name)![BLINK_SEQ[step]] ?? null;
  }

  update(dt: number) {
    this.particles.update(dt);
    this.ambience.reducedMotion = this.reducedMotion;
    this.ambience.update(dt);
    if (this.markerMs > 0) {
      this.markerMs -= dt;
      if (this.markerMs <= 0) this.marker.clear();
      else drawTapRing(this.marker, this.markerAt.x, this.markerAt.y, 1 - this.markerMs / MARKER_MS);
    }
    // Colour ripple: step the shown levels toward the real ones over RIPPLE_MS.
    if (!this.mess || this.reducedMotion) return;
    const step = (FULL_COLOUR * dt) / RIPPLE_MS;
    const changed: number[] = [];
    for (let i = 0; i < this.shownColour.length; i += 1) {
      const target = this.mess.colour[i];
      if (this.shownColour[i] < target) { this.shownColour[i] = Math.min(target, this.shownColour[i] + step); changed.push(i); }
    }
    if (changed.length) this.redrawTiles(changed);
  }
}
