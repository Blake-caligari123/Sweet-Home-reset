import { Application, Container, Graphics, Sprite, Texture, type FederatedPointerEvent } from 'pixi.js';
import { P } from '../../shared/art/palette';
import { composeBefore } from '../art/before-after';
import { drawCrumb } from '../art/crumbs';
import { dingeAlpha, dingeLayer, dullen } from '../../shared/art/dull';
import { PixelCanvas } from '../../shared/art/pixel-canvas';
import { drawDustBunny, drawItem } from '../art/props';
import type { Outfit } from '../../shared/art/puff';
import { drawDecor, drawRoom, drawStageOverlay } from '../art/room-art';
import { drawTool, type Tool } from '../art/tools';
import { Combo } from '../game/combo';
import { line, type LineKey } from '../game/lines';
import { ROOM_H, ROOM_W, type DecorDef, type Point, type RoomDef, type StageEffect } from '../game/pack';
import { STAGES, type RoomSession, type SessionEvent } from '../game/session';
import type { FeedbackEvent } from '../feedback';
import { LoopEffects, hintRing, keyboardCursor } from './effects';
import { Particles } from '../../shared/render/particles';
import { fitStage } from './pixel-stage';
import { PuffActor } from './puff-actor';
import { toCanvas, toTexture } from '../../shared/render/textures';

export const BRUSH_RADIUS = 8;
const ITEM_GRAB = 12;
const BUNNY_HIT = 11;
const HINT_AFTER_MS = 6000;
const HELP_AFTER_MS = 20000;
const NAP_AFTER_MS = 32000;
const VACUUM_REACH = 16;
const VACUUM_PULL = 22;
const SCRUB_PER_COMBO = 260;

export interface RoomHooks {
  feedback(event: FeedbackEvent, level?: number): void;
  say(text: string): void;
  progress(): void;
  taskDone(index: number): void;
  stage(stage: number): void;
  helpReady(ready: boolean): void;
  save(): void;
  finished(): void;
  combo(count: number): void;
  tool(tool: Tool | null): void;
}

interface Tween { update(dt: number): boolean }

function tween(ms: number, step: (t: number) => void, done?: () => void): Tween {
  let t = 0;
  return {
    update(dt) {
      t = Math.min(ms, t + dt);
      step(ms === 0 ? 1 : t / ms);
      if (t >= ms) { done?.(); return false; }
      return true;
    }
  };
}

const ease = (t: number) => 1 - (1 - t) * (1 - t);

let bunnyFrames: Texture[] | null = null;
let crumbTextures: Texture[] | null = null;
const toolTextures = new Map<Tool, Texture>();
function toolTexture(tool: Tool) {
  let t = toolTextures.get(tool);
  if (!t) { t = toTexture(drawTool(tool)); toolTextures.set(tool, t); }
  return t;
}
const itemTextures = new Map<string, Texture>();
function itemTexture(kind: string) {
  let t = itemTextures.get(kind);
  if (!t) { t = toTexture(drawItem(kind)); itemTextures.set(kind, t); }
  return t;
}

export class RoomScene {
  readonly root = new Container();
  private backdrop = new Graphics();
  private world = new Container();
  private overlays = new Container();
  private actors = new Container();
  private particles = new Particles();
  private loops = new LoopEffects();
  private dirtSprite = new Sprite();
  private dingeSprite = new Sprite();
  private decorSprite = new Sprite();
  private crumbLayer = new Container();
  private toolSprite = new Sprite();
  private wave = new Graphics();
  private ring = new Sprite();
  private cursor = new Sprite();
  private dirtCanvas!: HTMLCanvasElement;
  private dirtCtx!: CanvasRenderingContext2D;
  private dirtImage!: ImageData;
  private dirtTexture: Texture | null = null;
  private dull!: PixelCanvas;
  private crumbs: { sprite: Sprite; task: number; index: number }[] = [];
  private tool: Tool | null = null;
  private combo = new Combo();
  private shakeMs = 0;
  private napping = false;
  private toolBob = 0;
  private clearedRun = 0;
  private stageSprites = new Map<number, Sprite[]>();
  private bunnies: { sprite: Sprite; task: number; index: number }[] = [];
  private items: { sprite: Sprite; task: number; index: number; home: Point }[] = [];
  private tweens: Tween[] = [];
  private room!: RoomDef;
  private session!: RoomSession;
  private puff!: PuffActor;
  private pointerId: number | null = null;
  private last: Point | null = null;
  private dragging: { task: number; index: number; sprite: Sprite } | null = null;
  private idleMs = 0;
  private wanderMs = 4000;
  private hinting = false;
  private helpShown = false;
  private finale = false;
  private keyboard = { x: 90, y: 260, down: false, visible: false };
  private brush = BRUSH_RADIUS;
  private active = false;
  reducedMotion = false;

  constructor(private app: Application, private hooks: RoomHooks) {
    this.root.addChild(this.backdrop, this.world);
    this.ring.texture = hintRing(); this.ring.anchor.set(0.5); this.ring.visible = false; this.ring.eventMode = 'none';
    this.cursor.texture = keyboardCursor(); this.cursor.anchor.set(0.5); this.cursor.visible = false; this.cursor.eventMode = 'none';
    this.toolSprite.anchor.set(0.15, 0.85); this.toolSprite.visible = false; this.toolSprite.eventMode = 'none';
    this.wave.eventMode = 'none';
    this.crumbLayer.eventMode = 'none';
    this.actors.sortableChildren = true;
    this.root.eventMode = 'static';
    this.root.on('pointerdown', (e) => this.onDown(e));
    this.root.on('globalpointermove', (e) => this.onMove(e));
    this.root.on('pointerup', (e) => this.onUp(e));
    this.root.on('pointerupoutside', (e) => this.onUp(e));
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  get current() { return this.session; }

  enter(room: RoomDef, session: RoomSession, options: { outfit: Outfit; decor: DecorDef[]; brush: number; reducedMotion: boolean }) {
    this.exit();
    this.active = true;
    this.room = room; this.session = session;
    this.reducedMotion = options.reducedMotion;
    this.particles.reducedMotion = options.reducedMotion;
    this.loops.reducedMotion = options.reducedMotion;
    this.brush = options.brush;
    this.finale = false; this.idleMs = 0; this.hinting = false; this.helpShown = false; this.napping = false;
    this.combo = new Combo();
    this.clearedRun = 0;
    this.tool = null; this.toolSprite.visible = false;

    const cleanArt = drawRoom(room);
    const clean = new Sprite(toTexture(cleanArt));
    this.dull = dullen(cleanArt);
    this.dingeSprite.texture = toTexture(dingeLayer(this.dull, session.dirt.owner, room.theme.wallHeight, session.seed));
    this.dingeSprite.alpha = dingeAlpha(session.stage);
    this.decorSprite.texture = toTexture(drawDecor(options.decor));
    this.dirtCanvas = toCanvas(new PixelCanvas(ROOM_W, ROOM_H));
    this.dirtCtx = this.dirtCanvas.getContext('2d')!;
    this.dirtImage = this.dirtCtx.getImageData(0, 0, ROOM_W, ROOM_H);
    session.dirt.paint(this.dirtImage.data, undefined, this.dull.data);
    this.dirtCtx.putImageData(this.dirtImage, 0, 0);
    this.dirtTexture?.destroy(true);
    this.dirtTexture = Texture.from(this.dirtCanvas);
    this.dirtSprite.texture = this.dirtTexture;
    this.dirtSprite.alpha = 1;

    this.overlays.removeChildren();
    this.stageSprites.clear();
    for (const stage of STAGES) {
      const sprites = (room.stageArt[String(stage) as '25'] ?? [])
        .filter((e): e is Exclude<StageEffect, { effect: 'steam' } | { effect: 'twinkle' }> => e.effect === 'swap' || e.effect === 'sunbeam' || e.effect === 'glow')
        .map((effect) => {
          const sprite = new Sprite(toTexture(drawStageOverlay(room, effect)));
          sprite.visible = false;
          this.overlays.addChild(sprite);
          return sprite;
        });
      this.stageSprites.set(stage, sprites);
    }

    this.buildActors(options.outfit);
    this.loops.clear();
    this.particles.clear();
    this.world.removeChildren();
    this.world.addChild(clean, this.overlays, this.decorSprite, this.dingeSprite, this.dirtSprite, this.crumbLayer, this.actors, this.loops.container, this.particles.container, this.wave, this.ring, this.toolSprite, this.cursor);
    for (const stage of STAGES) if (session.stage >= stage) this.showStage(stage, true);

    this.resize();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    if (session.meter() === 0) {
      this.puff.play('sneeze', 1, () => this.say('start'));
      this.particles.burst('puff', this.puff.position.x, this.puff.position.y - 20, 10, [P.greyLight, P.grey], 26, 10);
      this.say('sneeze');
    } else {
      this.say('start');
    }
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.tweens = [];
    this.pointerId = null; this.dragging = null; this.last = null;
    this.hooks.helpReady(false);
  }

  private buildActors(outfit: Outfit) {
    this.actors.removeChildren();
    this.crumbLayer.removeChildren();
    this.bunnies = []; this.items = []; this.crumbs = [];
    bunnyFrames ??= [toTexture(drawDustBunny(0)), toTexture(drawDustBunny(1))];
    crumbTextures ??= [0, 1, 2, 3, 4, 5].map((v) => toTexture(drawCrumb(v)));
    this.room.tasks.forEach((task, t) => {
      if (task.type === 'vacuum') this.session.crumbs[t].forEach((c, i) => {
        if (this.session.vacuumed[t][i]) return;
        const sprite = new Sprite(crumbTextures![i % crumbTextures!.length]);
        sprite.anchor.set(0.5); sprite.position.set(c.x, c.y);
        this.crumbLayer.addChild(sprite);
        this.crumbs.push({ sprite, task: t, index: i });
      });
      if (task.type === 'pop') task.bunnies.forEach((b, i) => {
        if (this.session.popped[t][i]) return;
        const sprite = new Sprite(bunnyFrames![i % 2]);
        sprite.anchor.set(0.5, 0.8); sprite.position.set(b.x, b.y); sprite.zIndex = b.y;
        this.actors.addChild(sprite);
        this.bunnies.push({ sprite, task: t, index: i });
      });
      if (task.type === 'sort') task.items.forEach((item, i) => {
        if (this.session.placed[t][i]) return;
        const sprite = new Sprite(itemTexture(item.kind));
        sprite.anchor.set(0.5); sprite.position.set(item.x, item.y); sprite.zIndex = item.y;
        this.actors.addChild(sprite);
        this.items.push({ sprite, task: t, index: i, home: { x: item.x, y: item.y } });
      });
    });
    this.puff = new PuffActor(this.room.puff, this.room.walk, outfit);
    this.puff.reducedMotion = this.reducedMotion;
    this.actors.addChild(this.puff.sprite);
  }

  setOutfit(outfit: Outfit) { this.puff?.setOutfit(outfit); }
  setDecor(decor: DecorDef[]) { this.decorSprite.texture = toTexture(drawDecor(decor)); }
  setBrush(radius: number) { this.brush = radius; }

  resize() {
    const { width, height } = this.app.screen;
    const fit = fitStage(width, height, this.app.renderer.resolution);
    this.world.scale.set(fit.scale);
    this.world.position.set(fit.x, fit.y);
    this.fit = fit;
    this.paintBackdrop();
    this.root.hitArea = this.app.screen;
  }

  private fit = { k: 1, scale: 1, x: 0, y: 0 };

  /** The screen edges beside the room dull and brighten with it. */
  private paintBackdrop() {
    const { width, height } = this.app.screen;
    const wallBottom = this.fit.y + (this.room?.theme.wallHeight ?? 112) * this.fit.scale;
    const amount = this.room ? this.dingeSprite.alpha : 0;
    const tone = (hex: string) => {
      const c = new PixelCanvas(1, 1); c.set(0, 0, hex);
      const d = dullen(c).data; const [r, g, b] = [c.data[0], c.data[1], c.data[2]];
      return (Math.round(r + (d[0] - r) * amount) << 16) | (Math.round(g + (d[1] - g) * amount) << 8) | Math.round(b + (d[2] - b) * amount);
    };
    this.backdrop.clear()
      .rect(0, 0, width, wallBottom).fill(tone(this.room?.theme.wall ?? P.cream))
      .rect(0, wallBottom, width, height - wallBottom).fill(tone(this.room?.theme.floorA ?? P.cream));
  }

  /** Puff's head position in CSS pixels, for the speech bubble. */
  puffScreenPoint() {
    if (!this.puff) return null;
    const p = this.world.toGlobal({ x: this.puff.position.x, y: this.puff.position.y - 44 });
    return { x: p.x, y: p.y };
  }

  private say(key: LineKey) { this.hooks.say(line(key)); }

  // ---- input -------------------------------------------------------------------------------

  private toRoom(e: { global: Point }) {
    const p = this.world.toLocal(e.global);
    return { x: p.x, y: p.y };
  }

  private onDown(e: FederatedPointerEvent) {
    if (this.pointerId !== null) return;
    this.pointerId = e.pointerId;
    this.keyboard.visible = false; this.cursor.visible = false;
    this.pressAt(this.toRoom(e));
  }

  private onMove(e: FederatedPointerEvent) {
    if (e.pointerId !== this.pointerId) return;
    this.dragTo(this.toRoom(e));
  }

  private onUp(e: FederatedPointerEvent) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.release();
  }

  private pressAt(p: Point) {
    if (!this.active || this.finale || this.session.complete) return;
    if (this.napping) this.wake();
    const item = this.items.find((it) => Math.abs(it.sprite.x - p.x) <= ITEM_GRAB && Math.abs(it.sprite.y - p.y) <= ITEM_GRAB);
    if (item) {
      this.dragging = { task: item.task, index: item.index, sprite: item.sprite };
      item.sprite.zIndex = 10_000;
      item.sprite.position.set(Math.round(p.x), Math.round(p.y));
      this.setTool('hand', p);
      return;
    }
    this.setTool(this.toolFor(p), p);
    this.last = p;
    this.scrubTo(p);
  }

  /** The right tool for whatever is under the finger, picked for the player. */
  private toolFor(p: Point): Tool {
    if (this.crumbs.some((c) => Math.hypot(c.sprite.x - p.x, c.sprite.y - p.y) <= VACUUM_REACH)) return 'vacuum';
    if (this.bunnies.some((b) => Math.hypot(b.sprite.x - p.x, b.sprite.y - 6 - p.y) <= BUNNY_HIT)) return 'hand';
    const owner = this.ownerNear(p);
    const task = owner >= 0 ? this.room.tasks[owner] : null;
    if (task?.type === 'wipe') return task.surface === 'glass' ? 'squeegee' : 'duster';
    return 'sponge';
  }

  private setTool(tool: Tool, p: Point) {
    this.tool = tool;
    this.toolSprite.texture = toolTexture(tool);
    this.toolSprite.visible = tool !== 'hand';
    this.toolSprite.position.set(Math.round(p.x), Math.round(p.y));
    this.hooks.tool(tool);
  }

  private dragTo(p: Point) {
    if (this.dragging) { this.dragging.sprite.position.set(Math.round(p.x), Math.round(p.y)); return; }
    if (this.last) {
      // Switch tools as the brush crosses onto a different surface.
      const next = this.toolFor(p);
      if (next !== this.tool && next !== 'hand') this.setTool(next, p);
      this.toolSprite.position.set(Math.round(p.x), Math.round(p.y - (this.toolBob % 2)));
      this.scrubTo(p);
    }
  }

  private release() {
    if (this.dragging) {
      const { task, index, sprite } = this.dragging;
      this.dragging = null;
      this.handle(this.session.drop(task, index, sprite.x, sprite.y));
    }
    this.last = null;
    this.tool = null;
    this.toolSprite.visible = false;
    this.hooks.tool(null);
  }

  private scrubTo(p: Point) {
    const from = this.last ?? p;
    this.last = p;
    // Any dust bunny under the brush pops, so taps and swipes both work.
    for (const b of [...this.bunnies]) {
      if (Math.hypot(b.sprite.x - p.x, b.sprite.y - 6 - p.y) <= BUNNY_HIT) this.handle(this.session.pop(b.task, b.index));
    }
    if (this.tool === 'vacuum') this.vacuumAt(p);
    const owner = this.ownerNear(p);
    const result = this.session.scrub(from.x, from.y, p.x, p.y, this.brush);
    if (result.changed && result.box) {
      if (!this.finale) {
        this.session.dirt.paint(this.dirtImage.data, result.box, this.dull.data);
        this.dirtCtx.putImageData(this.dirtImage, 0, 0, result.box.x, result.box.y, result.box.w, result.box.h);
        this.dirtTexture!.source.update();
      }
      const surface = owner >= 0 ? this.room.tasks[owner] : null;
      const glass = surface?.type === 'wipe' && surface.surface === 'glass';
      const dust = surface?.type === 'wipe' && surface.surface === 'dust';
      this.hooks.feedback(glass ? 'wipe' : 'scrub', this.session.meter() / 100);
      this.toolBob += 1;
      if (glass) this.particles.burst('dot', p.x, p.y, 2, [P.white, P.blueLight], 18, 60);
      else if (dust) this.particles.burst('puff', p.x, p.y, 1, [P.greyLight, P.white], 16, -10);
      else this.particles.trail(p.x, p.y, this.brush);
      // Every chunk of freshly cleaned surface counts as one combo step.
      this.clearedRun += result.cleared.reduce((a, b) => a + b, 0);
      while (this.clearedRun >= SCRUB_PER_COMBO) { this.clearedRun -= SCRUB_PER_COMBO; this.comboHit(); }
      this.noteProgress();
      this.puffFollow(p);
      this.hooks.progress();
    }
    this.handle(result.events);
  }

  /** Crumbs near the nozzle zip in and disappear. */
  private vacuumAt(p: Point) {
    for (const c of [...this.crumbs]) {
      const d = Math.hypot(c.sprite.x - p.x, c.sprite.y - p.y);
      if (d > VACUUM_PULL) continue;
      this.crumbs.splice(this.crumbs.indexOf(c), 1);
      const from = { x: c.sprite.x, y: c.sprite.y };
      this.tweens.push(tween(this.reducedMotion ? 0 : 120, (t) => {
        c.sprite.position.set(Math.round(from.x + (p.x - from.x) * t), Math.round(from.y + (p.y - from.y) * t));
      }, () => c.sprite.destroy()));
      this.handle(this.session.vacuum(c.task, c.index));
    }
  }

  private comboHit() {
    const milestone = this.combo.hit(performance.now());
    if (milestone) {
      this.hooks.combo(milestone);
      if (!this.puff.busy) this.puff.play('hop', 1);
    }
  }

  get comboBonus() { return this.combo.bonus; }

  private ownerNear(p: Point) {
    const x = Math.round(p.x); const y = Math.round(p.y);
    if (x < 0 || y < 0 || x >= ROOM_W || y >= ROOM_H) return -1;
    return this.session.dirt.owner[y * ROOM_W + x];
  }

  private puffFollow(p: Point) {
    if (this.puff.busy) return;
    const side = p.x < ROOM_W / 2 ? 30 : -30;
    this.puff.walkTo({ x: p.x + side, y: Math.max(p.y + 18, this.room.walk.y) });
  }

  private onKeyDown(e: KeyboardEvent) {
    if (!this.active || (e.target instanceof HTMLElement && e.target.closest('button, input, dialog'))) return;
    const k = this.keyboard;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-6, 0], a: [-6, 0], ArrowRight: [6, 0], d: [6, 0], ArrowUp: [0, -6], w: [0, -6], ArrowDown: [0, 6], s: [0, 6] };
    const move = moves[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (move) {
      e.preventDefault();
      k.visible = true;
      k.x = Math.min(ROOM_W - 2, Math.max(2, k.x + move[0]));
      k.y = Math.min(ROOM_H - 2, Math.max(2, k.y + move[1]));
      this.cursor.visible = true;
      this.cursor.position.set(k.x, k.y);
      if (k.down) this.dragTo({ x: k.x, y: k.y });
    } else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      k.visible = true; this.cursor.visible = true; this.cursor.position.set(k.x, k.y);
      if (!k.down) { k.down = true; this.pressAt({ x: k.x, y: k.y }); }
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    if ((e.key === ' ' || e.key === 'Enter') && this.keyboard.down) { this.keyboard.down = false; this.release(); }
  }

  // ---- events ------------------------------------------------------------------------------

  private noteProgress() {
    this.idleMs = 0;
    if (this.hinting) { this.hinting = false; this.ring.visible = false; }
    if (this.helpShown) { this.helpShown = false; this.hooks.helpReady(false); }
  }

  private handle(events: SessionEvent[]) {
    if (!events.length) return;
    let changed = false;
    for (const event of events) {
      switch (event.type) {
        case 'pop': {
          const b = this.bunnies.find((x) => x.task === event.task && x.index === event.bunny);
          if (b) {
            this.bunnies.splice(this.bunnies.indexOf(b), 1);
            const { x, y } = b.sprite;
            b.sprite.destroy();
            if (!this.finale) {
              this.particles.burst('puff', x, y - 5, 10, [P.greyLight, P.grey, P.white], 34, 20);
              this.hooks.feedback('pop');
              this.comboHit();
              if (Math.random() < 0.35) this.say('pop');
            }
          }
          changed = true;
          break;
        }
        case 'crumb': {
          const c = this.crumbs.find((x) => x.task === event.task && x.index === event.crumb);
          if (c) { this.crumbs.splice(this.crumbs.indexOf(c), 1); c.sprite.destroy(); }
          if (!this.finale) { this.hooks.feedback('crumb'); this.comboHit(); }
          changed = true;
          break;
        }
        case 'placed': {
          const it = this.items.find((x) => x.task === event.task && x.index === event.item);
          if (it) {
            this.items.splice(this.items.indexOf(it), 1);
            const task = this.room.tasks[event.task];
            const bin = task.type === 'sort' ? task.bins.find((b) => b.id === event.bin)! : null;
            const from = { x: it.sprite.x, y: it.sprite.y };
            const to = bin ? { x: bin.x + bin.w / 2, y: bin.y + bin.h / 2 } : from;
            this.tweens.push(tween(this.reducedMotion ? 0 : 260, (t) => {
              const e = ease(t);
              it.sprite.position.set(Math.round(from.x + (to.x - from.x) * e), Math.round(from.y + (to.y - from.y) * e - Math.sin(t * Math.PI) * 12));
            }, () => {
              it.sprite.destroy();
              this.particles.burst('sparkle', to.x, to.y, 6, [P.white, P.butterLight], 26, 0);
            }));
            if (!this.finale) { this.hooks.feedback('placed'); this.comboHit(); }
          }
          changed = true;
          break;
        }
        case 'bounce': {
          const it = this.items.find((x) => x.task === event.task && x.index === event.item);
          if (it) {
            const from = { x: it.sprite.x, y: it.sprite.y };
            it.sprite.zIndex = it.home.y;
            this.tweens.push(tween(this.reducedMotion ? 0 : 300, (t) => {
              const e = ease(t);
              it.sprite.position.set(Math.round(from.x + (it.home.x - from.x) * e), Math.round(from.y + (it.home.y - from.y) * e - Math.sin(t * Math.PI) * 8));
            }));
          }
          this.hooks.feedback('bounce');
          if (event.wrongBin) this.say('bounce');
          break;
        }
        case 'taskDone': {
          if (!this.finale && !this.session.complete) {
            const c = this.taskCentre(event.task);
            this.particles.burst('sparkle', c.x, c.y, 25, [P.white, P.butterLight, P.butterShade], 50, 10);
            this.hooks.feedback('taskDone');
            if (!this.puff.busy) this.puff.play('hop', 1);
            this.say('taskDone');
          }
          this.hooks.taskDone(event.task);
          changed = true;
          break;
        }
        case 'stage': {
          this.showStage(event.stage, false);
          if (event.stage < 100) {
            this.hooks.feedback('stage', this.session.meter() / 100);
            this.particles.burst('sparkle', ROOM_W / 2, 200, 40, [P.white, P.butterLight, P.peachLight], 70, 20);
            this.say(`stage${event.stage}` as LineKey);
            this.puff.play('hop', 2);
            this.stageWave();
          }
          this.hooks.stage(event.stage);
          break;
        }
        case 'roomClean':
          this.runFinale();
          break;
      }
    }
    if (changed) this.noteProgress();
    // A finished patch clears its last specks in one go, so repaint the whole dirt layer.
    if (!this.finale && events.some((e) => e.type === 'taskDone')) this.repaintDirt();
    if (events.some((e) => e.type === 'stage')) this.liftDinge();
    this.hooks.progress();
    this.hooks.save();
  }

  /** The whole room brightens a step at each stage. */
  private liftDinge() {
    const from = this.dingeSprite.alpha;
    const to = dingeAlpha(this.session.stage);
    if (this.reducedMotion) { this.dingeSprite.alpha = to; this.paintBackdrop(); return; }
    this.tweens.push(tween(700, (t) => { this.dingeSprite.alpha = from + (to - from) * (Math.floor(t * 5) / 5); this.paintBackdrop(); }));
  }

  /** A ring of light rolls out from the room's middle, with a tiny shake. */
  private stageWave() {
    if (this.reducedMotion) return;
    this.shakeMs = 220;
    this.tweens.push(tween(650, (t) => {
      const r = Math.round(10 + t * 220);
      this.wave.clear();
      if (t < 1) this.wave.circle(ROOM_W / 2, 220, r).stroke({ width: 3, color: P.white, alpha: 0.7 * (1 - Math.floor(t * 4) / 4) });
    }, () => this.wave.clear()));
  }

  private repaintDirt() {
    this.session.dirt.paint(this.dirtImage.data, undefined, this.dull.data);
    this.dirtCtx.putImageData(this.dirtImage, 0, 0);
    this.dirtTexture!.source.update();
  }

  private taskCentre(index: number): Point {
    const task = this.room.tasks[index];
    if (task.type === 'scrub' || task.type === 'wipe') { const a = task.areas[0]; return { x: a.x + a.w / 2, y: a.y + a.h / 2 }; }
    if (task.type === 'pop') return task.bunnies[0];
    if (task.type === 'vacuum') { const a = task.areas[0]; return { x: a.x + a.w / 2, y: a.y + a.h / 2 }; }
    return { x: task.bins[0].x + task.bins[0].w / 2, y: task.bins[0].y + task.bins[0].h / 2 };
  }

  private showStage(stage: number, instant: boolean) {
    for (const sprite of this.stageSprites.get(stage) ?? []) {
      sprite.visible = true;
      if (instant || this.reducedMotion) { sprite.alpha = 1; continue; }
      sprite.alpha = 0;
      this.tweens.push(tween(600, (t) => { sprite.alpha = Math.floor(t * 4) / 4; }));
    }
    for (const effect of this.room.stageArt[String(stage) as '25'] ?? []) {
      if (effect.effect === 'steam') this.loops.addSteam(effect.x, effect.y);
      if (effect.effect === 'twinkle') this.loops.addTwinkles(effect.points);
    }
  }

  /** Help Puff: Puff finishes the next task, with no penalty. */
  help() {
    const task = this.session.nextTask();
    if (task < 0 || this.finale) return;
    const c = this.taskCentre(task);
    this.puff.walkTo({ x: c.x, y: Math.max(c.y + 16, this.room.walk.y) });
    this.say('help');
    this.handle(this.session.help(task));
  }

  // ---- the finish --------------------------------------------------------------------------

  private runFinale() {
    this.finale = true;
    this.ring.visible = false;
    this.hooks.helpReady(false);
    this.hooks.feedback('roomClean');
    this.say('roomClean');
    // The last bit of dirt sparkles away in a slow sweep.
    const sweepMs = this.reducedMotion ? 0 : 800;
    let lastColumn = -1;
    this.tweens.push(tween(sweepMs, (t) => {
      this.dirtSprite.alpha = this.reducedMotion ? 0 : Math.max(0, 1 - Math.floor(t * 5) / 5);
      const column = Math.floor(t * 8);
      if (column !== lastColumn && !this.reducedMotion) {
        lastColumn = column;
        for (let y = 130; y < 380; y += 50) this.particles.burst('sparkle', column * 22 + 10, y, 2, [P.white, P.butterLight], 20, 0);
      }
    }, () => {
      this.repaintDirt();
      this.dirtSprite.alpha = 1;
      this.puff.walkTo({ x: ROOM_W / 2, y: Math.min(this.room.walk.y + this.room.walk.h, 330) });
      this.beforeAfter(() => this.puff.dance(() => this.hooks.finished()));
    }));
  }

  /** The 3 s before/after wipe (a crossfade with reduced motion). */
  private beforeAfter(done: () => void) {
    const sprite = new Sprite(toTexture(composeBefore(this.room, this.session.seed)));
    const mask = new Graphics();
    const divider = new Graphics().rect(-1, 0, 2, ROOM_H).fill(P.cream).rect(-2, 0, 1, ROOM_H).fill(P.outline).rect(1, 0, 1, ROOM_H).fill(P.outline);
    this.world.addChild(sprite, mask, divider);
    if (this.reducedMotion) {
      divider.visible = false; mask.visible = false;
      this.tweens.push(tween(1200, (t) => { sprite.alpha = 1 - Math.floor(t * 4) / 4; }, () => { sprite.destroy(); mask.destroy(); divider.destroy(); done(); }));
      return;
    }
    sprite.mask = mask;
    this.tweens.push(tween(600, () => { mask.clear().rect(0, 0, ROOM_W, ROOM_H).fill(P.white); divider.x = 0; }, () => {
      this.tweens.push(tween(3000, (t) => {
        const x = Math.round(ease(t) * ROOM_W);
        mask.clear().rect(x, 0, Math.max(0, ROOM_W - x), ROOM_H).fill(P.white);
        divider.x = x;
        if (Math.random() < 0.5) this.particles.burst('sparkle', x, 120 + Math.random() * 250, 1, [P.white, P.butterLight], 10, 0);
      }, () => { sprite.destroy(); mask.destroy(); divider.destroy(); done(); }));
    }));
  }

  // ---- frame -------------------------------------------------------------------------------

  update(dtMs: number) {
    if (!this.active) return;
    dtMs = Math.min(dtMs, 100);
    // Tweens may start new tweens when they finish, so collect those separately.
    const running = this.tweens;
    this.tweens = [];
    this.tweens = running.filter((t) => t.update(dtMs)).concat(this.tweens);
    this.puff.update(dtMs);
    this.particles.update(dtMs);
    this.loops.update(dtMs);
    if (this.shakeMs > 0) {
      // A one-pixel shake on stage-ups (never with reduced motion).
      this.shakeMs -= dtMs;
      const on = this.shakeMs > 0;
      this.world.pivot.set(on ? (Math.random() < 0.5 ? -1 : 1) : 0, on ? (Math.random() < 0.5 ? -1 : 1) : 0);
    }
    for (const b of this.bunnies) {
      // Shy wiggle, two frames, out of step with each other.
      const frame = Math.floor((performance.now() + b.index * 170) / 380) % 2;
      b.sprite.texture = bunnyFrames![this.reducedMotion ? 0 : frame];
    }

    if (this.finale || this.session.complete || this.last || this.dragging) return;
    this.idleMs += dtMs;
    if (this.idleMs > HINT_AFTER_MS && !this.hinting) {
      const target = this.hintTarget();
      if (target) {
        this.hinting = true;
        this.ring.position.set(Math.round(target.x), Math.round(target.y));
        this.puff.walkTo({ x: target.x + (target.x < ROOM_W / 2 ? 26 : -26), y: Math.max(target.y + 16, this.room.walk.y) });
        this.say('idle');
      }
    }
    if (this.hinting) this.ring.visible = Math.floor(this.idleMs / 450) % 2 === 0;
    if (this.idleMs > HELP_AFTER_MS && !this.helpShown) { this.helpShown = true; this.hooks.helpReady(true); }
    if (this.idleMs > NAP_AFTER_MS && !this.napping) {
      // Puff curls up for a nap in the quiet: never a sulk, just cosy.
      this.napping = true;
      this.puff.play('sleepy', 999);
      this.say('nap');
    }
    if (this.napping) {
      if (Math.random() < dtMs / 900) this.particles.burst('dot', this.puff.position.x + 10, this.puff.position.y - 40, 1, [P.white], 6, -20);
      return;
    }
    this.wanderMs -= dtMs;
    if (this.wanderMs <= 0 && !this.hinting && !this.puff.busy) {
      this.wanderMs = 5000 + Math.random() * 4000;
      const a = this.room.walk;
      this.puff.walkTo({ x: a.x + 20 + Math.random() * (a.w - 40), y: a.y + 10 + Math.random() * (a.h - 20) });
    }
  }

  private wake() {
    this.napping = false;
    this.puff.play('hop', 1);
    this.say('start');
  }

  private hintTarget(): Point | null {
    const index = this.session.nextTask();
    if (index < 0) return null;
    const task = this.room.tasks[index];
    if (task.type === 'scrub' || task.type === 'wipe') return this.session.dirt.hintPoint(index);
    if (task.type === 'pop') return this.bunnies.find((b) => b.task === index)?.sprite.position ?? null;
    if (task.type === 'vacuum') return this.crumbs.find((c) => c.task === index)?.sprite.position ?? null;
    return this.items.find((it) => it.task === index)?.sprite.position ?? null;
  }
}
