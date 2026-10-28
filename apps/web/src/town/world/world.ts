import { Application, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { P } from '../../shared/art/palette';
import { Particles } from '../../shared/render/particles';
import { toTexture } from '../../shared/render/textures';
import { PixelCanvas } from '../../shared/art/pixel-canvas';
import { drawNeighbour24, drawPuff24, drawToolMini, type Dir } from './art/characters';
import { drawCrop, drawItemIcon, drawMess } from './art/items';
import { T } from './art/texture';
import { AliveLayer, daylight } from './alive';
import { Ambience, drawTapRing, vignetteTexture } from './ambience';
import type { Area } from '../data/area';
import { bakeArea } from './bake';
import { paintedArea } from './backgrounds';
import { FULL_COLOUR, type AreaMess } from '../play/mess';
import { blinkClip, breathScale, CLIP_FPS, messSprite, neighbourClip, puffClip, type SpriteBank } from './sprites';
import { RIPPLE_MS } from '../data/tuning';

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

const npcFrames = new Map<string, Texture>();
function npcTexture(v: NeighbourView, frame: number) {
  const key = `${v.species}:${v.colours.fur}:${v.dir}:${frame}:${v.pose}`;
  let t = npcFrames.get(key);
  if (!t) { t = toTexture(drawNeighbour24(v.species, v.colours, v.dir, frame, v.pose)); npcFrames.set(key, t); }
  return t;
}

const itemTextures = new Map<string, Texture>();
function itemTexture(item: string) {
  let t = itemTextures.get(item);
  if (!t) { const pc = new PixelCanvas(14, 14); drawItemIcon(pc, item); t = toTexture(pc); itemTextures.set(item, t); }
  return t;
}

const toolMinis = new Map<string, Texture>();
function toolTexture(tool: string) {
  let t = toolMinis.get(tool);
  if (!t) { t = toTexture(drawToolMini(tool)); toolMinis.set(tool, t); }
  return t;
}

const cropTextures = new Map<string, Texture>();
function cropTexture(stage: number, watered: boolean, look: string) {
  const key = `${stage}:${watered}:${look}`;
  let t = cropTextures.get(key);
  if (!t) { t = toTexture(drawCrop(stage, watered, look)); cropTextures.set(key, t); }
  return t;
}

/** x, y: the bottom-centre of Puff's sprite in world px. */
export interface PuffView { x: number; y: number; dir: Dir; pose: 'walk' | 'idle' | 'swing' | 'sleep' | 'hop'; tool: string | null }

/** A neighbour to draw: x, y is the bottom-centre of their sprite in world px. */
export interface NeighbourView { id: string; species: string; colours: { fur: string; belly: string; accent: string }; x: number; y: number; dir: Dir; pose: 'walk' | 'idle' | 'sleep' }

export class World {
  readonly root = new Container();
  private backdrop = new Graphics();
  private stage = new Container();
  private base = new Sprite();
  /** The grey overlay: one sprite per tile cut from the area's grey twin, alpha = how grey it still is. */
  private drained = new Container();
  private drainSprites: Sprite[] = [];
  private owned: Texture[] = [];
  private messLayer = new Container();
  private cropLayer = new Container();
  private pickupLayer = new Container();
  readonly actors = new Container();
  readonly particles = new Particles();
  private tint = new Graphics();
  private marker = new Graphics();
  private highlight = new Graphics();
  private vignette = new Sprite(vignetteTexture());
  readonly ambience = new Ambience();
  /** A home coming alive: lamps, sunlight, a cat (claude/ALIVE-PLAN.md). */
  readonly alive = new AliveLayer();
  private markerAt = { x: 0, y: 0 };
  private sprites: SpriteBank | null = null;
  private blink = { nextMs: 3000, playMs: 0, again: false };
  private puff = new Sprite();
  private puffShadow = new Graphics();
  private toolSprite = new Sprite();
  private npcs = new Map<string, { sprite: Sprite; shadow: Graphics }>();
  private messSprites = new Map<number, Sprite>();
  private cropSprites = new Map<number, Sprite>();
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
    this.stage.addChild(this.base, this.drained, this.cropLayer, this.messLayer, this.pickupLayer, this.alive.under, this.highlight, this.marker, this.actors, this.particles.container, this.ambience.container, this.tint, this.ambience.lights, this.alive.lights);
    this.root.addChild(this.vignette);
    this.puffShadow.ellipse(0, 0, 7, 2.5).fill({ color: P.ink, alpha: 0.28 });
    this.actors.addChild(this.puffShadow, this.puff, this.toolSprite);
  }

  /** Show an area: its painting (or baked tiles), the grey overlay from the colour array, mess. */
  load(area: Area, mess: AreaMess) {
    this.area = area; this.mess = mess;
    // Textures this world made for the last area go; shared painted ones stay cached.
    for (const t of this.owned) t.destroy(true);
    this.owned = [];
    const painted = paintedArea(area.pack.id);
    let colourTex: Texture; let drainTex: Texture; let k = 1;
    if (painted) {
      colourTex = painted.colour; drainTex = painted.drained; k = painted.scale;
    } else {
      const { colour, drained } = bakeArea(area);
      colourTex = toTexture(colour); drainTex = toTexture(drained);
      this.owned.push(colourTex, drainTex);
    }
    this.base.texture = colourTex;
    this.base.scale.set(1 / k);
    // Each tile sprite owns its frame texture (the source is shared with the painting, so it stays).
    this.drained.removeChildren().forEach((c) => c.destroy({ texture: true, textureSource: false }));
    this.drainSprites = [];
    for (let i = 0; i < area.w * area.h; i += 1) {
      const x = i % area.w; const y = Math.floor(i / area.w);
      const tile = new Texture({ source: drainTex.source, frame: new Rectangle(x * T * k, y * T * k, T * k, T * k) });
      const sprite = new Sprite(tile);
      sprite.position.set(x * T, y * T); sprite.scale.set(1 / k);
      this.drained.addChild(sprite); this.drainSprites.push(sprite);
    }
    this.shownColour = Float32Array.from(mess.colour);
    for (let i = 0; i < mess.colour.length; i += 1) this.paintDrainTile(i, mess.colour[i]);
    this.syncDrainedVisible();
    this.messLayer.removeChildren().forEach((c) => c.destroy());
    this.messSprites.clear();
    for (let i = 0; i < mess.type.length; i += 1) this.syncMess(i);
    this.cropLayer.removeChildren().forEach((c) => c.destroy());
    this.pickupLayer.removeChildren().forEach((c) => c.destroy());
    this.cropSprites.clear();
    this.particles.clear();
    this.ambience.load(area);
    this.resize();
  }

  private paintDrainTile(i: number, level: number) {
    const sprite = this.drainSprites[i];
    if (!sprite) return;
    sprite.alpha = Math.max(0, Math.min(1, (FULL_COLOUR - level) / FULL_COLOUR));
    sprite.visible = sprite.alpha > 0;
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
    // Blake's art when its sheet has loaded (drawn at world size), else the code-drawn placeholder.
    const bank = this.sprites;
    const art = bank && messSprite(name, i, this.mess.item[i], bank.has, (n) => bank.frames(n)!.length);
    const tex = art ? bank!.frames(art.name)![art.frame] : messTexture(name, i, this.mess.item[i]);
    const k = art ? 1 / bank!.scale(art.name) : 1;
    const sprite = existing ?? new Sprite(tex);
    sprite.texture = tex; sprite.scale.set(k);
    if (existing) return;
    sprite.position.set((i % this.area.w) * T, Math.floor(i / this.area.w) * T);
    this.messLayer.addChild(sprite);
    this.messSprites.set(i, sprite);
  }

  /** Colour changed on these tiles: animate the drained overlay toward the new levels. */
  colourChanged(tiles: number[]) {
    if (this.reducedMotion) { for (const i of tiles) this.shownColour[i] = this.mess!.colour[i]; this.redrawTiles(tiles); }
  }

  private redrawTiles(tiles: number[]) {
    for (const i of tiles) this.paintDrainTile(i, this.shownColour[i]);
    this.syncDrainedVisible();
  }

  /** A fully coloured area needs no grey overlay: skip drawing that full-screen layer. */
  private syncDrainedVisible() {
    this.drained.visible = this.shownColour.some((v) => v < FULL_COLOUR);
  }

  /** Things Puff can take here (a snack on the counter), drawn with the item's art or icon. */
  setPickups(list: { x: number; y: number; item: string; drawDy?: number }[]) {
    this.pickupLayer.removeChildren().forEach((c) => c.destroy());
    for (const p of list) {
      const art = this.sprites?.has(`item_${p.item}`);
      const sprite = new Sprite(art ? this.sprites!.frames(`item_${p.item}`)![0] : itemTexture(p.item));
      sprite.anchor.set(0.5);
      sprite.scale.set(art ? 12 / sprite.texture.width : 1);
      sprite.position.set((p.x + 0.5) * T, (p.y + 0.5 + (p.drawDy ?? 0)) * T);
      sprite.eventMode = 'none';
      this.pickupLayer.addChild(sprite);
    }
  }

  setCrops(crops: { x: number; y: number; stage: number; watered: boolean; look: string }[]) {
    if (!this.area) return;
    const seen = new Set<number>();
    for (const c of crops) {
      const i = c.y * this.area.w + c.x; seen.add(i);
      let s = this.cropSprites.get(i);
      if (!s) { s = new Sprite(); s.position.set(c.x * T, c.y * T); this.cropLayer.addChild(s); this.cropSprites.set(i, s); }
      s.texture = cropTexture(c.stage, c.watered, c.look);
    }
    for (const [i, s] of this.cropSprites) if (!seen.has(i)) { s.destroy(); this.cropSprites.delete(i); }
  }

  /** Glow on tiles the onboarding points at. */
  setHighlight(tiles: { x: number; y: number }[]) {
    this.highlight.clear();
    for (const t of tiles) this.highlight.rect(t.x * T, t.y * T, T, T).stroke({ width: 1, color: P.white, alpha: 0.9 });
  }

  /** Tap ring at a world point. */
  showMarker(x: number, y: number) {
    this.markerMs = MARKER_MS;
    this.markerAt = { x, y };
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

  /** Soap bubbles off a scrubbed spot. */
  suds(x: number, y: number) {
    this.particles.burst('suds', x * T + T / 2, y * T + T / 2, 7, [P.white, P.blueLight], 22, -16);
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
  /** Screen point → world px. */
  toWorld(sx: number, sy: number) {
    const p = this.stage.toLocal({ x: sx, y: sy });
    return { x: p.x, y: p.y };
  }

  /** World pixel → screen point, for the speech bubble. */
  toScreen(px: number, py: number) { return this.stage.toGlobal({ x: px, y: py }); }

  /** Puff's current draw scale and texture, for the ?debug test hook. */
  get puffDebug() { return { sx: this.puff.scale.x, sy: this.puff.scale.y, frame: this.puff.texture.frame.x }; }

  /** How tall Puff is drawn right now, in world pixels (for placing the speech bubble). */
  get puffHeight() { return Math.abs(this.puff.height); }

  /** Character sprite sheets as they arrive; until then Puff is code-drawn. */
  setSprites(bank: SpriteBank) {
    this.sprites = bank;
    if (this.mess) for (let i = 0; i < this.mess.type.length; i += 1) this.syncMess(i);
  }

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
    const px = Math.round(v.x); const py = Math.round(v.y);
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

  /** The neighbours Puff can see this frame; anyone not listed is taken off the stage. */
  drawNeighbours(views: NeighbourView[]) {
    const seen = new Set<string>();
    for (const v of views) {
      seen.add(v.id);
      let n = this.npcs.get(v.id);
      if (!n) {
        const sprite = new Sprite(); sprite.anchor.set(0.5, 1);
        const shadow = new Graphics().ellipse(0, 0, 7, 2.5).fill({ color: P.ink, alpha: 0.28 });
        this.actors.addChild(shadow, sprite);
        n = { sprite, shadow }; this.npcs.set(v.id, n);
      }
      const clip = this.sprites ? neighbourClip(v.id, v.dir, v.pose, this.sprites.has) : null;
      const still = this.reducedMotion && v.pose !== 'walk';
      if (clip && this.sprites) {
        const frames = this.sprites.frames(clip.name)!;
        const i = clip.hold ?? (still ? 0 : Math.floor((this.animClock / 1000) * CLIP_FPS[v.pose === 'walk' ? 'walk' : 'idle']) % frames.length);
        n.sprite.texture = frames[i];
        const k = 1 / this.sprites.scale(clip.name);
        const [bx, by] = v.pose !== 'walk' && !this.reducedMotion ? breathScale(this.animClock + v.id.length * 300) : [1, 1];
        n.sprite.scale.set((clip.mirror ? -k : k) * bx, k * by);
      } else {
        const fps = v.pose === 'walk' ? 8 : 3;
        const count = v.pose === 'walk' ? 6 : v.pose === 'sleep' ? 1 : 4;
        n.sprite.texture = npcTexture(v, still ? 0 : Math.floor((this.animClock / 1000) * fps) % count);
        n.sprite.scale.set(1, 1);
      }
      const px = Math.round(v.x); const py = Math.round(v.y);
      n.sprite.position.set(px, py); n.sprite.zIndex = py;
      n.shadow.position.set(px, py - 1); n.shadow.zIndex = py - 1;
    }
    for (const [id, n] of this.npcs) if (!seen.has(id)) { n.sprite.destroy(); n.shadow.destroy(); this.npcs.delete(id); }
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
    this.alive.reducedMotion = this.reducedMotion;
    this.alive.update(dt, daylight(this.ambience.minutes));
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
