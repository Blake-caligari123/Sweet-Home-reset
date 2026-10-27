import type { Application, FederatedPointerEvent } from 'pixi.js';
import type { Sound, SoundId } from '../fx/sound';
import { localDate } from '../game/profile';
import type { HapticKind, NativeBridge } from '../native';
import { makeClip, shareFile } from '../share/clip';
import { clear, h } from '../ui/dom';
import { drawMess, T, type Dir } from './art';
import { Area, type TownPack } from './area';
import { bakeArea } from './bake';
import { Bag } from './bag';
import { Clock, DAY_END, DAY_START, formatTime, LATE_AT } from './clock';
import { Fluff } from './fluff';
import { dialogue, Hud, itemIcon, TOOL_NAMES } from './hud';
import { AreaMess, FULL_COLOUR, TOOL_FOR, type MessType, type ToolId } from './mess';
import { Onboarding, type OnboardEvent } from './onboarding';
import { NavGrid, type Pt } from './nav';
import { standTiles, type Tile } from './pathfind';
import { eraseTown, stamp, writeTown, type TownSave } from './save';
import { cropDays, PUTAWAY_SPARKLES, SWING_MS, TUNING, WALK_SPEED, WALK_SPEED_TIRED } from './tuning';
import type { SpriteBank } from './sprites';
import { World } from './world';


type Target =
  | { kind: 'walk'; x: number; y: number }
  | { kind: 'mess'; x: number; y: number }
  | { kind: 'soil'; x: number; y: number }
  | { kind: 'door'; x: number; y: number }
  | { kind: 'prop'; x: number; y: number; action: string; accepts?: string[]; text?: string };

/** Puff's feet sit this far into their tile (world px), clear of a wall along the tile's bottom edge. */
const FEET = 10;
/** The sprite's bottom edge is drawn this far below the feet point. */
const FEET_TO_BASE = 5;
/** How close (world px) Puff's feet must get to a mess tile or prop to act on it. */
const REACH = 10;

interface Crop { area: string; x: number; y: number; crop: string; days: number; watered: boolean }
type Settings = TownSave['settings'];

const LETTER_CHORES: Record<string, [string, string]> = {
  dust: ['dusted a whole room', 'dust one shelf of yours'],
  stain: ['scrubbed a stain away', 'wipe one counter of yours'],
  weeds: ['raked the weeds', 'water a plant, or pull one weed'],
  clutter: ['put things where they live', 'put 3 things back where they belong'],
  none: ['had a cosy day', 'open a window for some fresh air']
};

export class TownGame {
  private areas = new Map<string, Area>();
  private messes = new Map<string, AreaMess>();
  private areaId = 'burrow';
  private world: World;
  private hud: Hud;
  private clock = new Clock();
  private fluff = new Fluff();
  private bag = new Bag();
  private tools: Record<string, number> = { hands: 1, duster: 1 };
  private selected: ToolId = 'duster';
  private sparkles = 0;
  private crops: Crop[] = [];
  private flags: string[] = [];
  private onboarding = new Onboarding();
  private chores = { day: '', keys: [] as string[], total: 0 };
  /** x, y: the tile under Puff's feet (mess, doors, saves). fx, fy: the feet in world px; path: waypoints in world px. */
  private puff = { x: 3, y: 4, fx: 3 * T + T / 2, fy: 4 * T + FEET, dir: 'down' as Dir, pose: 'idle' as 'walk' | 'idle' | 'swing' | 'sleep' | 'hop', path: [] as Pt[], action: null as Target | null, repeat: 0, swingMs: 0, hopMs: 0 };
  private navs = new Map<string, NavGrid>();
  private modal = 0;
  private fading = false;
  private bubbleMs = 0;
  private autosaveMs = 0;
  private lastClean: string = 'none';
  private sharePromptDay = 0;
  private down: { x: number; y: number; t: number } | null = null;
  private fade: HTMLElement;
  private deviceId: string;

  constructor(
    private app: Application,
    private ui: HTMLElement,
    private pack: TownPack,
    private native: NativeBridge,
    private sound: Sound,
    public settings: Settings,
    saved: TownSave | null
  ) {
    for (const a of pack.areas) this.areas.set(a.id, new Area(a));
    this.world = new World(app);
    app.stage.addChild(this.world.root);
    this.hud = new Hud(ui, {
      tool: (t) => { this.uiTap(); this.selected = t; this.refreshHud(); },
      bag: () => { this.uiTap(); this.openBag(); },
      pause: () => { this.uiTap(); this.openPause(); },
      tracker: () => this.uiTap()
    });
    this.fade = h('div', { class: 'fade', 'aria-hidden': 'true' });
    ui.append(this.fade);
    this.deviceId = (saved?.deviceId as string) ?? (crypto.randomUUID?.() ?? String(Math.random()).slice(2));
    let feet: Pt | undefined;
    if (saved) feet = this.restore(saved);
    else Object.assign(this.puff, this.area.pack.spawn); // a new game starts at the burrow's spawn tile
    this.world.reducedMotion = settings.reducedMotion;
    this.enterArea(this.areaId, this.puff.x, this.puff.y, false, feet);
    this.bindInput();
    app.ticker.add((t) => this.update(t.deltaMS));
    window.addEventListener('resize', () => { app.resize(); this.world.resize(); });
    this.refreshHud();
    if (!saved) window.setTimeout(() => this.say('Ooh. Grey. Let\'s fix that.'), 600);
    // Test hook for automated playthroughs, only with ?debug in the URL.
    if (new URLSearchParams(location.search).has('debug')) {
      (window as unknown as { __town: unknown }).__town = {
        tileToScreen: (x: number, y: number) => this.world.toScreen((x + 0.5) * T, (y + 0.5) * T),
        debug: () => ({ area: this.areaId, puff: { x: this.puff.x, y: this.puff.y }, fluff: this.fluff.value, sparkles: this.sparkles, bag: this.bag.slots.filter(Boolean), tools: this.tools, step: this.onboarding.current?.id ?? 'done', progress: this.mess.progress, day: this.clock.state.day, minutes: this.clock.state.minutes, crops: this.crops }),
        setMinutes: (m: number) => { this.clock.state.minutes = m; },
        mess: () => { const m = this.mess; const out: { x: number; y: number; type: string; hp: number; item?: string }[] = []; for (let i = 0; i < m.type.length; i += 1) if (m.type[i]) out.push({ x: i % m.w, y: Math.floor(i / m.w), type: m.typeAt(i % m.w, Math.floor(i / m.w)), hp: m.hp[i], item: m.item[i] }); return out; },
        props: () => this.area.pack.props.filter((p) => p.action).map((p) => ({ type: p.type, x: p.x, y: p.y, action: p.action, accepts: p.accepts })),
        doors: () => this.area.pack.doors.filter((d) => !d.closedText),
        tapTile: (x: number, y: number) => this.tap((x + 0.5) * T, (y + 0.5) * T),
        tapPoint: (x: number, y: number) => this.tap(x, y),
        feet: () => ({ x: this.puff.fx, y: this.puff.fy }),
        openAt: (x: number, y: number) => this.nav.openAt(x, y),
        busy: () => this.puff.path.length > 0 || this.puff.swingMs > 0 || this.modal > 0 || this.fading,
        /** Jump to an area in full colour, for screenshots. */
        visit: (id: string, x: number, y: number, colour = true) => { if (colour) this.messFor(id).colour.fill(FULL_COLOUR); this.enterArea(id, x, y, false); },
        puffSprite: () => ({ ...this.world.puffDebug, pose: this.puff.pose, dir: this.puff.dir }),
        /** Where Puff is drawn, in tile units (the tile's own coords when standing at its usual spot). */
        drawn: () => ({ x: this.puff.fx / T - 0.5, y: (this.puff.fy + FEET_TO_BASE + 1) / T - 1 })
      };
    }
  }

  /** Character sprite sheets loaded after start; Puff stays code-drawn until they arrive. */
  setSprites(bank: SpriteBank) { this.world.setSprites(bank); }

  // ---- areas -------------------------------------------------------------------------------

  private messFor(id: string) {
    let m = this.messes.get(id);
    if (!m) {
      const area = this.areas.get(id)!;
      m = new AreaMess(area.w, area.h, area.spots, area.pack.drained);
      this.messes.set(id, m);
    }
    return m;
  }

  private get area() { return this.areas.get(this.areaId)!; }
  /** The fine walking grid for the current area: traced polygons for painted areas, else tiles. */
  private get nav() {
    let g = this.navs.get(this.areaId);
    if (!g) {
      const a = this.area; const n = a.pack.nav;
      g = n ? NavGrid.fromPolygons(a.w * T, a.h * T, n.floor, n.blockers, 1) : NavGrid.fromTiles(a.w, a.h, a.walkable, 1);
      this.navs.set(this.areaId, g);
    }
    return g;
  }
  private get mess() { return this.messFor(this.areaId); }

  private enterArea(id: string, x: number, y: number, announce = true, feet?: Pt) {
    this.areaId = id;
    // Stand at the tile's usual spot (or a saved exact spot), nudged onto open floor if needed.
    const spot = this.nav.nearestOpen(feet && this.nav.openAt(feet.x, feet.y) ? feet : { x: x * T + T / 2, y: y * T + FEET }) ?? { x: x * T + T / 2, y: y * T + FEET };
    Object.assign(this.puff, { fx: spot.x, fy: spot.y, x: Math.floor(spot.x / T), y: Math.floor(spot.y / T), path: [], action: null, pose: 'idle' });
    this.world.load(this.area, this.mess);
    this.world.setCrops(this.cropsHere());
    this.world.setTint(this.clock.state.minutes);
    this.world.follow(spot.x, spot.y - 8, true);
    this.updateHighlight();
    if (announce) { this.hud.announce(this.area.pack.name); this.onboard({ type: 'entered', area: id }); }
  }

  private async travel(to: string, x: number, y: number) {
    if (this.fading) return;
    this.fading = true;
    this.fade.classList.add('on');
    await wait(this.settings.reducedMotion ? 0 : 250);
    this.enterArea(to, x, y);
    this.fade.classList.remove('on');
    this.fading = false;
  }

  // ---- input -------------------------------------------------------------------------------

  private bindInput() {
    const root = this.world.root;
    root.eventMode = 'static';
    root.on('pointerdown', (e: FederatedPointerEvent) => { this.down = { x: e.global.x, y: e.global.y, t: performance.now() }; });
    root.on('pointerup', (e: FederatedPointerEvent) => {
      const d = this.down; this.down = null;
      if (!d || Math.hypot(e.global.x - d.x, e.global.y - d.y) > 14) return;
      this.sound.unlock();
      const p = this.world.toWorld(e.global.x, e.global.y);
      this.tap(p.x, p.y);
    });
    window.addEventListener('keydown', (e) => this.key(e));
  }

  private key(e: KeyboardEvent) {
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
    if (e.key === 'Escape') { e.preventDefault(); this.back(); return; }
    if (this.modal) return;
    const moves: Record<string, [number, number, Dir]> = { ArrowUp: [0, -1, 'up'], w: [0, -1, 'up'], ArrowDown: [0, 1, 'down'], s: [0, 1, 'down'], ArrowLeft: [-1, 0, 'left'], a: [-1, 0, 'left'], ArrowRight: [1, 0, 'right'], d: [1, 0, 'right'] };
    const m = moves[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (m) {
      e.preventDefault();
      if (this.puff.path.length || this.puff.swingMs > 0) return;
      const p = this.puff; const to = { x: p.fx + m[0] * T, y: p.fy + m[1] * T };
      p.dir = m[2];
      if (this.nav.clear({ x: p.fx, y: p.fy }, to)) p.path = [to];
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[this.puff.dir];
      this.tap((this.puff.x + d[0] + 0.5) * T, (this.puff.y + d[1] + 0.5) * T);
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= 5) { const t = (['hands', 'duster', 'sponge', 'rake', 'can'] as ToolId[])[n - 1]; if (this.tools[t]) { this.selected = t; this.refreshHud(); } }
    if (e.key.toLowerCase() === 'b') this.openBag();
  }

  /** Android back / Escape: close the top sheet, else open pause. */
  back() {
    const sheets = this.ui.querySelectorAll('[data-sheet]');
    const top = sheets[sheets.length - 1];
    if (top) { (top.querySelector('[data-close]') as HTMLElement | null)?.click(); return; }
    if (this.ui.querySelector('.dialogue') || this.fading) return;
    this.openPause();
  }

  private targetAt(x: number, y: number): Target {
    const area = this.area;
    if (this.mess.typeAt(x, y) !== 'none') return { kind: 'mess', x, y };
    if (area.groundAt(x, y) === 'soil') return { kind: 'soil', x, y };
    if (area.doorAt(x, y)) return { kind: 'door', x, y };
    const prop = area.propAt(x, y);
    if (prop?.action) return { kind: 'prop', x, y, action: prop.action, accepts: prop.accepts, text: area.signAt(prop.x, prop.y)?.text };
    return { kind: 'walk', x, y };
  }

  /** A tap at a world point: walk there, or walk within reach of what's there and use it. */
  private tap(px: number, py: number) {
    const tile = { x: Math.floor(px / T), y: Math.floor(py / T) };
    if (this.modal || this.fading || !this.area.inside(tile.x, tile.y)) return;
    const target = this.targetAt(tile.x, tile.y);
    this.world.showMarker(px, py);
    const p = this.puff; const feet = { x: p.fx, y: p.fy };
    // Tapping the thing Puff is already working on queues another go.
    if (p.swingMs > 0 && p.action && target.kind === p.action.kind && target.x === p.action.x && target.y === p.action.y) {
      p.repeat = Math.min(3, p.repeat + 1);
      return;
    }
    if (target.kind === 'walk') { this.go(this.nav.findPathTo(feet, { x: px, y: py }), null); return; }
    if (target.kind === 'door') { this.go(this.nav.findPathNear(feet, this.rectOf(target), 0), target); return; } // feet inside the door tile
    // Act from wherever is close enough to the target (any tile of a multi-tile prop).
    const r = this.rectOf(target);
    if (!p.path.length && this.distTo(r) <= REACH) { this.act(target); return; }
    const path = this.nav.findPathNear(feet, r, REACH);
    if (!path) { this.say('Hmm, can\'t reach that.'); return; }
    this.go(path, target);
  }

  private go(path: Pt[] | null, action: Target | null) {
    if (!path) return;
    this.puff.path = path; this.puff.action = action;
  }

  /** The world-px rect of a target: its tile, or the whole prop. */
  private rectOf(t: Target) {
    const prop = t.kind === 'prop' ? this.area.propAt(t.x, t.y) : null;
    const x = prop ? prop.x : t.x; const y = prop ? prop.y : t.y;
    return { x0: x * T, y0: y * T, x1: (x + (prop?.w ?? 1)) * T, y1: (y + (prop?.h ?? 1)) * T };
  }

  private distTo(r: { x0: number; y0: number; x1: number; y1: number }) {
    const { fx, fy } = this.puff;
    return Math.hypot(Math.max(r.x0 - fx, 0, fx - r.x1), Math.max(r.y0 - fy, 0, fy - r.y1));
  }

  // ---- actions -----------------------------------------------------------------------------

  /** Turn toward a tile. */
  private face(x: number, y: number) { this.faceAlong((x + 0.5) * T - this.puff.fx, (y + 0.5) * T - this.puff.fy); }

  /** Face along a direction; near diagonals keep the current facing so Puff doesn't flicker. */
  private faceAlong(dx: number, dy: number) {
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
    const h: Dir = dx > 0 ? 'right' : 'left'; const v: Dir = dy > 0 ? 'down' : 'up';
    if (Math.abs(dx) > Math.abs(dy) * 1.2) this.puff.dir = h;
    else if (Math.abs(dy) > Math.abs(dx) * 1.2) this.puff.dir = v;
    else if (this.puff.dir !== h && this.puff.dir !== v) this.puff.dir = h;
  }

  private act(t: Target) {
    this.face(t.x, t.y);
    if (t.kind === 'door') { this.useDoor(t.x, t.y); return; }
    if (t.kind === 'mess') { this.startSwing(t); return; }
    if (t.kind === 'soil') { this.useSoil(t.x, t.y); return; }
    if (t.kind === 'prop') this.useProp(t);
  }

  private startSwing(t: Target) {
    const type = this.mess.typeAt(t.x, t.y) as Exclude<MessType, 'none'>;
    if (type === 'none' as MessType) return;
    const need = TOOL_FOR[type];
    if (!this.tools[need.tool]) { this.say(`Puff needs a ${TOOL_NAMES[need.tool].toLowerCase()} for that.`); return; }
    if (this.tools[need.tool] < need.minTier) { this.say('That needs a Copper sponge.'); return; }
    if (this.settings.autoTool) this.selected = need.tool;
    else if (this.selected !== need.tool) { this.say(`Try the ${TOOL_NAMES[need.tool].toLowerCase()}.`); return; }
    if (type === 'clutter' && !this.bag.canAdd(this.mess.item[t.y * this.area.w + t.x] ?? '')) { this.say('Bag\'s full! Put things away first.'); return; }
    if (need.tool !== 'hands' && !this.fluff.spend(false, this.settings.relaxed ? 0.5 : 1)) { this.say('Getting fluffy-sleepy... snack time?'); this.hud.pulseFluff(); return; }
    this.puff.action = t;
    this.puff.pose = 'swing';
    this.puff.swingMs = SWING_MS;
    this.feedback(need.tool === 'hands' ? 'tap' : 'scrub', 'light');
    this.refreshHud();
  }

  private finishSwing() {
    const t = this.puff.action!;
    const i = t.y * this.area.w + t.x;
    const type = this.mess.typeAt(t.x, t.y);
    const tool = TOOL_FOR[type as Exclude<MessType, 'none'>]?.tool ?? this.selected;
    const wasRestored = this.mess.restored;
    const result = this.mess.hit(t.x, t.y, tool, this.tools[tool] ?? 1);
    this.puff.pose = 'idle';
    if (!result.ok) { this.puff.action = null; return; }
    this.world.syncMess(i);
    this.world.colourChanged(result.changed);
    for (const c of result.changed) this.world.syncMess(c);
    if (type === 'dust' || type === 'cobweb') this.world.dustPuff(t.x, t.y);
    if (result.cleared) {
      this.world.sparkleBurst(t.x, t.y, 8);
      this.feedback('sparkle', 'medium');
      this.lastClean = type;
      if (result.item) { this.bag.add(result.item); this.say(type === 'clutter' ? `Got the ${this.itemName(result.item).toLowerCase()}!` : ''); }
      if (this.flags.indexOf('first_clean') < 0) { this.flags.push('first_clean'); this.say('Look! Colour came back!'); }
      this.onboard({ type: 'cleared', mess: type, area: this.areaId });
    }
    if (!wasRestored && this.mess.restored) this.onRestored();
    this.refreshHud();
    if (!result.cleared && this.puff.repeat > 0) { this.puff.repeat -= 1; this.startSwing(t); return; }
    this.puff.repeat = 0;
    this.puff.action = null;
  }

  private useProp(t: Extract<Target, { kind: 'prop' }>) {
    switch (t.action) {
      case 'putaway': {
        const items = (t.accepts ?? []).flatMap((id) => Array.from({ length: this.bag.count(id) }, () => id));
        if (!items.length) {
          const wanted = (t.accepts ?? []).map((id) => this.itemName(id).toLowerCase()).join(' and ');
          this.say(`A home for the ${wanted}.`); return;
        }
        for (const id of items) { this.bag.remove(id); this.sparkles += PUTAWAY_SPARKLES; this.onboard({ type: 'putaway', item: id }); }
        this.say(items.length === 1 ? 'Back where it lives!' : 'All put away!');
        this.feedback('thunk', 'light');
        this.world.sparkleBurst(t.x, t.y, 6);
        this.refreshHud();
        return;
      }
      case 'sleep':
        this.confirm('Go to bed? Puff saves the day and wakes up refreshed.', 'Sleep', () => void this.endDay(false));
        return;
      case 'sign':
        this.showDialogue(t.text ?? 'A sign.');
        return;
      case 'board':
        this.showDialogue('The notice board is empty for now. Neighbours will post jobs here soon.');
        return;
      case 'mailbox':
        this.showDialogue(this.clock.state.day > 1 ? 'Today\'s letter is on the kitchen table. (Puff already read it.)' : 'No post yet. Maybe tomorrow!');
        return;
    }
  }

  private useSoil(x: number, y: number) {
    const crop = this.crops.find((c) => c.area === this.areaId && c.x === x && c.y === y);
    if (crop) {
      if (crop.days >= cropDays(crop.crop)) {
        if (!this.bag.add(crop.crop)) { this.say('Bag\'s full!'); return; }
        this.crops.splice(this.crops.indexOf(crop), 1);
        this.say('A radish! Crunchy.'); this.feedback('coin', 'medium');
      } else if (!crop.watered) {
        if (!this.tools.can) { this.say('Seeds need water. A can would help.'); return; }
        if (!this.fluff.spend(false, this.settings.relaxed ? 0.5 : 1)) { this.say('Too sleepy to water...'); return; }
        crop.watered = true; this.selected = 'can';
        this.feedback('wipe', 'light');
        this.onboard({ type: 'watered' });
      } else this.say('Growing. No rush.');
    } else if (this.bag.count('radish_seeds') > 0) {
      this.bag.remove('radish_seeds');
      this.crops.push({ area: this.areaId, x, y, crop: 'radish', days: 0, watered: false });
      this.say('Grow big. No rush.'); this.feedback('thunk', 'light');
      this.onboard({ type: 'planted' });
    } else this.say('Seeds would grow here.');
    this.world.setCrops(this.cropsHere());
    this.refreshHud();
  }

  private useDoor(x: number, y: number) {
    const door = this.area.doorAt(x, y);
    if (!door) return;
    if (door.closedText) { this.say(door.closedText); this.stepOff(x, y); return; }
    void this.travel(door.to, door.toX, door.toY);
  }

  /** After bumping a closed door, step back one tile so the next tap isn't swallowed. */
  private stepOff(x: number, y: number) {
    for (const s of standTiles(this.area, { x, y })) if (!this.area.doorAt(s.x, s.y)) { this.go(this.nav.findPathTo({ x: this.puff.fx, y: this.puff.fy }, { x: s.x * T + T / 2, y: s.y * T + FEET }), null); return; }
  }

  private cropsHere() {
    return this.crops.filter((c) => c.area === this.areaId).map((c) => ({ x: c.x, y: c.y, stage: c.days >= cropDays(c.crop) ? 2 : c.days > 0 ? 1 : 0, watered: c.watered }));
  }

  // ---- restore and share -------------------------------------------------------------------

  private onRestored() {
    const reward = this.area.pack.restoreReward ?? 0;
    this.sparkles += reward;
    this.feedback('fanfare', 'success');
    this.puff.pose = 'hop'; this.puff.hopMs = 900;
    for (let n = 0; n < 6; n += 1) this.world.sparkleBurst(this.puff.x - 3 + n, this.puff.y - 2 + (n % 3), 10);
    this.banner(`${this.area.pack.name} restored!${reward ? ` +${reward} ✨` : ''}`);
    this.onboard({ type: 'restored', area: this.areaId });
    if (this.area.pack.kind === 'home') {
      this.flags.push(`restored_${this.areaId}`);
      // Auto-offer the clip at most once a day (A11.5).
      if (this.sharePromptDay !== this.clock.state.day) {
        this.sharePromptDay = this.clock.state.day;
        const first = !this.flags.includes('shared_prompt');
        this.flags.push('shared_prompt');
        window.setTimeout(() => this.offerClip(first), 1400);
      }
    }
    void this.save(false);
  }

  private offerClip(first: boolean) {
    const area = this.area;
    let file: File | null = null;
    this.modal += 1;
    const status = h('p', {}, first ? 'Your first reset! Save or share it?' : `${area.pack.name} is sparkling. Save or share it?`);
    const make = h('button', { class: 'btn primary', type: 'button' }, '🎬 Make my clip');
    const later = h('button', { class: 'btn', type: 'button', 'data-close': '' }, 'Not now');
    const sheet = h('div', { class: 'scrim', 'data-sheet': '' }, h('div', { class: 'panel sheet' }, h('h2', {}, 'Before and after'), status, h('div', { class: 'btn-row', style: { width: '100%' } }, make, later)));
    const close = () => { sheet.remove(); this.modal = Math.max(0, this.modal - 1); };
    later.addEventListener('click', () => { this.uiTap(); close(); });
    make.addEventListener('click', async () => {
      this.uiTap();
      if (file) { await shareFile(file, `I restored ${area.pack.name} in Hollowfern ✨ #SweetHomeReset`); return; }
      make.disabled = true; make.textContent = 'Making your clip…';
      try {
        const { before, after } = this.beforeAfter(area);
        file = await makeClip({ before, after, title: area.pack.name, outfit: null });
        make.textContent = '📤 Share my clip';
      } catch { make.textContent = 'Clip didn\'t work this time'; }
      make.disabled = false;
    });
    this.ui.append(sheet);
  }

  private beforeAfter(area: Area) {
    const { colour, drained } = bakeArea(area);
    const before = drained.clone();
    area.spots.forEach((m, i) => before.draw(drawMess(m.type, i, m.item), m.x * T, m.y * T));
    const after = colour.clone();
    return { before, after };
  }

  // ---- days --------------------------------------------------------------------------------

  private async endDay(dozed: boolean) {
    if (this.fading) return;
    this.modal += 1;
    this.fading = true;
    this.puff.pose = 'sleep';
    if (dozed) this.say('Zzz... just resting my fluff.');
    await wait(dozed ? 1400 : 300);
    this.fade.classList.add('on', 'night');
    await wait(this.settings.reducedMotion ? 200 : 900);
    this.clock.nextDay();
    if (dozed) this.fluff.doze(); else this.fluff.sleep();
    for (const c of this.crops) { if (c.watered) c.days += 1; c.watered = false; }
    this.hud.setLate(false);
    // Wake up beside the bed: the burrow's spawn tile.
    const bed = this.areas.get('burrow')!.pack.spawn;
    this.enterArea('burrow', bed.x, bed.y, false);
    this.puff.dir = 'down';
    await this.save(true);
    this.fade.classList.remove('on', 'night');
    this.fading = false;
    this.modal = Math.max(0, this.modal - 1);
    this.refreshHud();
    this.morningLetter();
  }

  private morningLetter() {
    const [did, chore] = LETTER_CHORES[this.lastClean] ?? LETTER_CHORES.none;
    const today = localDate();
    if (this.chores.day !== today) this.chores = { ...this.chores, day: today, keys: [] };
    const key = `day${this.clock.state.day}`;
    this.modal += 1;
    const text = `Dear friend, yesterday I ${did}. My paws sparkle! Maybe ${chore}? Or just have tea. Both are lovely. ♥ Puff`;
    dialogue(this.ui, text, {
      reducedMotion: this.settings.reducedMotion,
      buttons: [
        { label: 'I did it!', primary: true, onClick: () => {
          this.modal = Math.max(0, this.modal - 1);
          if (this.chores.keys.length >= TUNING.realChoreCapPerDay) { this.say('That\'s loads today. Rest counts too.'); return; }
          this.chores.keys.push(key); this.chores.total += 1;
          this.sparkles += TUNING.realChoreReward.sparkles;
          this.fluff.boost = TUNING.realChoreReward.maxFluffBonus;
          this.fluff.eat(TUNING.realChoreReward.maxFluffBonus);
          this.feedback('coin', 'success');
          this.banner(`Cosy Boost! +${TUNING.realChoreReward.sparkles} ✨ +${TUNING.realChoreReward.maxFluffBonus} Fluff today`);
          this.refreshHud();
        } },
        { label: 'Not today', onClick: () => { this.modal = Math.max(0, this.modal - 1); this.say('Tea it is. Lovely.'); } }
      ]
    });
    this.lastClean = 'none';
  }

  // ---- onboarding --------------------------------------------------------------------------

  private onboard(e: OnboardEvent) {
    const done = this.onboarding.handle(e);
    for (const step of done) {
      for (const t of step.grant ?? []) if (!this.tools[t]) { this.tools[t] = 1; this.banner(`New tool: ${TOOL_NAMES[t]}!`); }
      for (const [id, n] of Object.entries(step.items ?? {})) this.bag.add(id, n);
    }
    if (done.length) {
      const next = this.onboarding.current;
      if (next?.grant) for (const t of next.grant) if (!this.tools[t]) { this.tools[t] = 1; this.banner(`New tool: ${TOOL_NAMES[t]}!`); }
      if (next?.items) for (const [id, n] of Object.entries(next.items)) if (this.bag.count(id) < n) this.bag.add(id, n - this.bag.count(id));
      if (next?.id === 'fluff') { this.hud.pulseFluff(); window.setTimeout(() => this.onboard({ type: 'timer' }), 5000); }
      this.updateHighlight();
      this.refreshHud();
    }
  }

  private updateHighlight() {
    const step = this.onboarding.current;
    if (!step || this.areaId !== 'burrow') { this.world.setHighlight([]); return; }
    const tiles: Tile[] = [];
    const m = this.mess;
    const want = step.id === 'dust' ? 'dust' : step.id === 'stain' ? 'stain' : step.id === 'sock' ? 'clutter' : null;
    if (want) for (let i = 0; i < m.type.length; i += 1) if (m.typeAt(i % m.w, Math.floor(i / m.w)) === want) tiles.push({ x: i % m.w, y: Math.floor(i / m.w) });
    this.world.setHighlight(tiles.slice(0, want === 'dust' ? 4 : 3));
  }

  // ---- loop --------------------------------------------------------------------------------

  private update(dt: number) {
    dt = Math.min(dt, 100);
    const p = this.puff;
    if (!this.modal && !this.fading) {
      for (const e of this.clock.advance(dt)) {
        if (e === 'tick') this.world.setTint(this.clock.state.minutes);
        if (e === 'late') { this.hud.setLate(true); this.say('Getting fluffy-sleepy...'); }
        if (e === 'doze' && !this.settings.relaxed) void this.endDay(true);
      }
      // Walk the waypoints at walking speed; the tile under the feet drives mess, doors and onboarding.
      if (p.path.length) {
        let budget = dt * ((this.fluff.tired ? WALK_SPEED_TIRED : WALK_SPEED) * T / 1000);
        while (budget > 0 && p.path.length) {
          const n = p.path[0]; const dx = n.x - p.fx; const dy = n.y - p.fy; const d = Math.hypot(dx, dy);
          this.faceAlong(dx, dy);
          if (d <= budget) { p.fx = n.x; p.fy = n.y; p.path.shift(); budget -= d; } else { p.fx += (dx / d) * budget; p.fy += (dy / d) * budget; budget = 0; }
          const tx = Math.floor(p.fx / T); const ty = Math.floor(p.fy / T);
          if (tx !== p.x || ty !== p.y) { p.x = tx; p.y = ty; this.onboard({ type: 'stood', ground: this.area.groundAt(tx, ty), area: this.areaId }); }
        }
        if (!p.path.length) {
          p.pose = 'idle';
          const a = p.action; p.action = null;
          if (this.area.doorAt(p.x, p.y)) this.useDoor(p.x, p.y);
          else if (a && a.kind !== 'door') this.act(a);
        } else p.pose = 'walk';
      }
      if (p.swingMs > 0) { p.swingMs -= dt; if (p.swingMs <= 0) this.finishSwing(); }
      if (p.hopMs > 0) { p.hopMs -= dt; if (p.hopMs <= 0 && p.pose === 'hop') p.pose = 'idle'; }
      this.autosaveMs += dt;
      if (this.autosaveMs > TUNING.autosaveSeconds * 1000) { this.autosaveMs = 0; void this.save(false); }
    }
    this.world.drawPuff({ x: p.fx, y: p.fy + FEET_TO_BASE, dir: p.dir, pose: p.pose, tool: this.selected }, dt);
    this.world.follow(p.fx, p.fy - 8);
    this.world.update(dt);
    this.placeBubble(p.fx, p.fy + FEET_TO_BASE);
    this.updateHudLive();
    if (this.bubbleMs > 0) { this.bubbleMs -= dt; if (this.bubbleMs <= 0) this.hud.bubble.classList.remove('show'); }
  }

  private lastPrompt = '';
  private lastClock = '';

  private updateHudLive() {
    const c = this.clock;
    const clockText = `${c.season} ${c.dayOfSeason}|${formatTime(c.shown)}`;
    if (clockText !== this.lastClock) {
      this.lastClock = clockText;
      const night = c.state.minutes >= 19 * 60 || c.state.minutes < DAY_START;
      this.hud.setClock(`${c.season} ${c.dayOfSeason}`, formatTime(c.shown), night);
    }
    this.hud.setFluff(this.fluff.value, this.fluff.cap, this.fluff.tired);
    const prompt = this.promptText();
    if (prompt !== this.lastPrompt) { this.lastPrompt = prompt; this.hud.setPrompt(prompt); }
  }

  /** The context line above the tool bar: what Puff is facing or about to do. */
  private promptText() {
    const p = this.puff;
    const t = p.action ?? (() => {
      const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.dir];
      const target = this.targetAt(p.x + d[0], p.y + d[1]);
      return target.kind === 'walk' ? null : target;
    })();
    if (!t) return '';
    if (t.kind === 'mess') {
      const type = this.mess.typeAt(t.x, t.y);
      const hp = this.mess.hp[t.y * this.area.w + t.x];
      const verb: Record<string, string> = { dust: 'Dust it', stain: 'Sponge the stain', weeds: 'Rake the weeds', clutter: `Pick up the ${this.itemName(this.mess.item[t.y * this.area.w + t.x] ?? '').toLowerCase()}`, grime: 'Scrub the grime', cobweb: 'Dust the cobweb' };
      return `${verb[type] ?? 'Clean it'}${hp > 1 ? ` (${hp} hits)` : ''}`;
    }
    if (t.kind === 'soil') return this.crops.some((c) => c.area === this.areaId && c.x === t.x && c.y === t.y) ? 'Tend the crop' : 'Plant seeds';
    if (t.kind === 'door') return 'Go through';
    if (t.kind === 'prop') return ({ putaway: 'Put things away', sleep: 'Go to bed', sign: 'Read the sign', board: 'Read the notice board', mailbox: 'Check the mail' } as Record<string, string>)[t.action] ?? '';
    return '';
  }

  private refreshHud() {
    const owned = (['hands', 'duster', 'sponge', 'rake', 'can'] as ToolId[]).filter((t) => this.tools[t]);
    if (!owned.includes(this.selected)) this.selected = owned[0];
    this.hud.setTools(owned, this.selected);
    this.hud.setSparkles(this.sparkles);
    const step = this.onboarding.current;
    this.hud.setTracker(step ? step.hint : `Explore Hollowfern and tidy what you find.`);
  }

  // ---- speech, banners, feedback -----------------------------------------------------------

  say(text: string) {
    if (!text) return;
    this.hud.bubble.textContent = text;
    this.hud.bubble.classList.add('show');
    this.hud.announce(`Puff: ${text}`);
    this.bubbleMs = 2600;
  }

  /** x, y: the bottom-centre of Puff's sprite in world px. */
  private placeBubble(x: number, y: number) {
    // Just above Puff's ears, whatever art Puff is drawn with.
    const s = this.world.toScreen(x, y - this.world.puffHeight - 2);
    this.hud.fadeNear(s.y + 20);
    if (!this.hud.bubble.classList.contains('show')) return;
    const half = Math.min(120, this.hud.bubble.offsetWidth / 2 + 8);
    this.hud.bubble.style.left = `${Math.min(window.innerWidth - half, Math.max(half, s.x))}px`;
    this.hud.bubble.style.top = `${Math.max(120, s.y)}px`;
  }

  private banner(text: string) {
    const el = h('div', { class: 'banner', 'aria-hidden': 'true' }, text);
    this.ui.append(el);
    this.hud.announce(text);
    window.setTimeout(() => el.remove(), 1900);
  }

  private feedback(soundId: SoundId, haptic: HapticKind | null) {
    if (this.settings.sound) this.sound.play(soundId, this.mess.progress);
    if (haptic && this.settings.haptics) {
      if (!this.native.isNative && 'vibrate' in navigator) { try { navigator.vibrate(haptic === 'success' ? [30, 60, 30] : haptic === 'medium' ? [16] : [8]); } catch { /* ignore */ } }
      else void this.native.haptic(haptic);
    }
  }

  private uiTap() { this.sound.unlock(); if (this.settings.sound) this.sound.play('tap'); }

  private itemName(id: string) { return this.pack.items[id]?.name ?? id; }

  // ---- sheets ------------------------------------------------------------------------------

  private showDialogue(text: string) {
    this.modal += 1;
    dialogue(this.ui, text, { reducedMotion: this.settings.reducedMotion, buttons: [{ label: 'OK', primary: true, onClick: () => { this.modal = Math.max(0, this.modal - 1); } }] });
  }

  private confirm(text: string, yes: string, onYes: () => void) {
    this.modal += 1;
    dialogue(this.ui, text, { reducedMotion: this.settings.reducedMotion, buttons: [
      { label: yes, primary: true, onClick: () => { this.modal = Math.max(0, this.modal - 1); onYes(); } },
      { label: 'Not yet', onClick: () => { this.modal = Math.max(0, this.modal - 1); } }
    ] });
  }

  private sheet(title: string, body: Node[]) {
    this.modal += 1;
    const closeBtn = h('button', { class: 'btn', type: 'button', 'data-close': '' }, 'Close');
    const el = h('div', { class: 'scrim center', 'data-sheet': '', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'panel sheet' }, h('h2', {}, title), ...body, closeBtn));
    const close = () => { el.remove(); this.modal = Math.max(0, this.modal - 1); };
    closeBtn.addEventListener('click', () => { this.uiTap(); close(); });
    this.ui.append(el);
    window.setTimeout(() => closeBtn.focus(), 30);
    return close;
  }

  private openBag() {
    const grid = h('div', { class: 'bag-grid' });
    const info = h('p', { class: 'muted' }, 'Tap an item to see what it\'s for.');
    const render = () => {
      clear(grid);
      this.bag.slots.forEach((s) => {
        const cell = h('button', { class: 'bag-slot', type: 'button', 'aria-label': s ? `${this.itemName(s.id)}, ${s.count}` : 'Empty slot' }, s ? itemIcon(s.id) : '', s && s.count > 1 ? h('b', {}, String(s.count)) : '');
        if (s) cell.addEventListener('click', () => {
          const item = this.pack.items[s.id];
          if (item?.snack) {
            this.bag.remove(s.id); this.fluff.eat(item.snack);
            info.textContent = `Yum! +${item.snack} Fluff.`; this.feedback('coin', 'light'); render(); this.refreshHud();
          } else info.textContent = item?.home ? `${item.name}: it lives in the ${item.home}.` : `${item?.name ?? s.id}.`;
        });
        grid.append(cell);
      });
    };
    render();
    this.sheet('Bag', [grid, info]);
  }

  private openPause() {
    if (this.ui.querySelector('[data-sheet]')) return;
    const s = this.settings;
    const toggle = (key: keyof Settings, label: string) => {
      const b = h('button', { class: 'switch', role: 'switch', type: 'button', 'aria-checked': String(s[key]), 'aria-label': label });
      b.addEventListener('click', () => {
        (s as Record<string, boolean>)[key] = !s[key];
        b.setAttribute('aria-checked', String(s[key]));
        this.sound.enabled = s.sound; this.sound.musicOn = s.music;
        if (s.music) this.sound.startMusic(); else this.sound.stopMusic();
        this.world.reducedMotion = s.reducedMotion;
        void this.save(false);
      });
      return h('div', { class: 'row' }, h('span', { class: 'label' }, label), b);
    };
    const body: Node[] = [
      h('div', { class: 'list' },
        toggle('sound', 'Sound'), toggle('music', 'Music'), toggle('haptics', 'Haptics'),
        toggle('reducedMotion', 'Reduce motion'), toggle('relaxed', 'Relaxed mode (half Fluff costs, no dozing off)'), toggle('autoTool', 'Pick the right tool for me'))
    ];
    if (this.onboarding.skippable) {
      const skip = h('button', { class: 'btn small', type: 'button' }, 'Skip the tips');
      skip.addEventListener('click', () => {
        for (const step of this.onboarding.skip()) {
          for (const t of step.grant ?? []) this.tools[t] = 1;
          for (const [id, n] of Object.entries(step.items ?? {})) this.bag.add(id, n);
        }
        this.updateHighlight(); this.refreshHud(); skip.remove();
      });
      body.push(skip);
    }
    const restart = h('button', { class: 'btn small', type: 'button' }, 'Start over on this device');
    restart.addEventListener('click', async () => { if (!window.confirm('Start a new game? This clears the town save on this device.')) return; await eraseTown(); location.reload(); });
    body.push(h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, `Milestone 1 test build · ${TUNING.townName}`), restart);
    this.sheet('Paused', body);
  }

  // ---- save --------------------------------------------------------------------------------

  private snapshot(): TownSave {
    const areas: TownSave['areas'] = {};
    for (const [id, m] of this.messes) areas[id] = m.snapshot();
    return stamp({
      deviceId: this.deviceId, day: this.clock.state.day, minutes: this.clock.state.minutes,
      fluff: { value: this.fluff.value, max: this.fluff.max, boost: this.fluff.boost }, sparkles: this.sparkles,
      bag: this.bag.slots, tools: this.tools, area: this.areaId, puff: { x: this.puff.x, y: this.puff.y, fx: this.puff.fx, fy: this.puff.fy, facing: this.puff.dir },
      areas, crops: this.crops, flags: this.flags, onboarding: this.onboarding.step, chores: this.chores, settings: this.settings,
      selected: this.selected, lastClean: this.lastClean
    });
  }

  async save(bedtime: boolean) { await writeTown(this.snapshot(), bedtime); }

  /** Load a save; returns Puff's exact saved feet position when there is one. */
  private restore(s: TownSave): Pt | undefined {
    this.clock.state = { day: s.day, minutes: Math.min(DAY_END, Math.max(DAY_START, s.minutes)) };
    this.fluff = new Fluff(s.fluff.value, s.fluff.max, s.fluff.boost);
    this.sparkles = s.sparkles;
    this.bag = new Bag(s.bag.length ? s.bag : undefined);
    this.tools = { hands: 1, ...s.tools };
    this.crops = s.crops ?? [];
    this.flags = s.flags ?? [];
    this.onboarding = new Onboarding(s.onboarding ?? 0, 0);
    this.chores = s.chores ?? this.chores;
    this.lastClean = typeof s.lastClean === 'string' ? s.lastClean : 'none';
    if (typeof s.selected === 'string') this.selected = s.selected as ToolId;
    for (const [id, snap] of Object.entries(s.areas ?? {})) {
      if (!this.areas.has(id)) continue;
      const m = this.messFor(id);
      try { m.load(snap); } catch { /* a bad area snapshot just starts that area fresh */ }
    }
    const area = this.areas.get(s.area) ? s.area : 'burrow';
    this.areaId = area;
    const a = this.areas.get(area)!;
    const ok = a.walkable(s.puff.x, s.puff.y);
    this.puff.x = ok ? s.puff.x : a.pack.spawn.x; this.puff.y = ok ? s.puff.y : a.pack.spawn.y;
    this.puff.dir = s.puff.facing ?? 'down';
    if (this.clock.state.minutes >= LATE_AT) this.hud?.setLate(true);
    return ok && typeof s.puff.fx === 'number' && typeof s.puff.fy === 'number' ? { x: s.puff.fx, y: s.puff.fy } : undefined;
  }
}

function wait(ms: number) { return new Promise((r) => window.setTimeout(r, ms)); }

