import type { Application, FederatedPointerEvent } from 'pixi.js';
import type { Sound } from '../shared/audio/sound';
import type { NativeBridge } from '../shared/native';
import { h } from '../shared/ui/dom';
import { Area, type TownPack } from './data/area';
import { Content } from './data/content';
import { stamp, writeTown, type TownSave } from './data/save';
import { cropDays, NEIGHBOUR_WALK_SPEED, PUTAWAY_SPARKLES, SWING_MS, TUNING, WALK_SPEED, WALK_SPEED_TIRED } from './data/tuning';
import { Conversations } from './neighbours/conversations';
import { Neighbours } from './neighbours/neighbours';
import { Bag } from './play/bag';
import { Clock, DAY_END, DAY_START, formatTime, LATE_AT } from './play/clock';
import { Fluff } from './play/fluff';
import { morningLetter } from './play/letter';
import { AreaMess, FULL_COLOUR, TOOL_FOR, type MessType, type ToolId } from './play/mess';
import { Onboarding, type OnboardEvent } from './play/onboarding';
import { Jobs } from './requests/jobs';
import type { RequestState } from './requests/requests';
import { TownState } from './state';
import { openBag } from './ui/bag-sheet';
import { Hud, TOOL_NAMES } from './ui/hud';
import { openPause } from './ui/pause-menu';
import { offerClip } from './ui/reveal';
import { View, type Settings } from './ui/view';
import { T, type Dir } from './world/art';
import { FEET, navFor, REACH, type NavGrid, type Pt } from './world/nav';
import { standTiles, type Tile } from './world/pathfind';
import { setIconBank, type SpriteBank } from './world/sprites';
import { World } from './world/world';

type Target =
  | { kind: 'walk'; x: number; y: number }
  | { kind: 'mess'; x: number; y: number }
  | { kind: 'soil'; x: number; y: number }
  | { kind: 'door'; x: number; y: number }
  | { kind: 'prop'; x: number; y: number; action: string; accepts?: string[]; text?: string }
  | { kind: 'neighbour'; x: number; y: number; id: string };

/** The sprite's bottom edge is drawn this far below the feet point. */
const FEET_TO_BASE = 5;

// The town game (GDD v3): it owns the areas, Puff, input, the day and the save, and hands the rest
// to feature modules: neighbours/conversations (talk, gifts, heart events, Friends), requests/jobs
// (notice board), ui/* (sheets) and play/letter. Saved progress lives in one shared TownState.
export class TownGame {
  private areas = new Map<string, Area>();
  private messes = new Map<string, AreaMess>();
  private navs = new Map<string, NavGrid>();
  private areaId = 'burrow';
  private world: World;
  private hud: Hud;
  private view: View;
  private content: Content;
  private clock = new Clock();
  private state = new TownState();
  private neighbours: Neighbours;
  private talk: Conversations;
  private jobs: Jobs;
  private selected: ToolId = 'duster';
  /** x, y: the tile under Puff's feet (mess, doors, saves). fx, fy: the feet in world px; path: waypoints in world px. */
  private puff = { x: 3, y: 4, fx: 3 * T + T / 2, fy: 4 * T + FEET, dir: 'down' as Dir, pose: 'idle' as 'walk' | 'idle' | 'swing' | 'sleep' | 'hop', path: [] as Pt[], action: null as Target | null, repeat: 0, swingMs: 0, hopMs: 0 };
  private fading = false;
  private autosaveMs = 0;
  private sharePromptDay = 0;
  private down: { x: number; y: number; t: number } | null = null;
  private fade: HTMLElement;
  private deviceId: string;

  constructor(
    private app: Application,
    ui: HTMLElement,
    pack: TownPack,
    native: NativeBridge,
    private sound: Sound,
    public settings: Settings,
    saved: TownSave | null
  ) {
    for (const a of pack.areas) this.areas.set(a.id, new Area(a));
    this.content = new Content(pack);
    this.neighbours = new Neighbours(pack.neighbours ?? [], pack.areas, (id) => (this.areas.has(id) ? this.navAt(id) : null), NEIGHBOUR_WALK_SPEED);
    this.world = new World(app);
    app.stage.addChild(this.world.root);
    this.hud = new Hud(ui, {
      tool: (t) => { this.view.uiTap(); this.selected = t; this.refreshHud(); },
      bag: () => { this.view.uiTap(); this.openBag(); },
      pause: () => { this.view.uiTap(); this.openPause(); },
      tracker: () => this.view.uiTap()
    });
    this.view = new View(ui, this.hud, sound, native, settings, () => this.mess.progress);
    this.talk = new Conversations({
      state: this.state, view: this.view, content: this.content, clock: this.clock, neighbours: this.neighbours,
      area: () => this.areaId,
      facePuff: (x, y) => { this.faceAlong(x - this.puff.fx, y - this.puff.fy); return this.puff.dir; },
      hopPuff: () => { this.puff.pose = 'hop'; this.puff.hopMs = 900; },
      sparkleAtPuff: (n) => this.world.sparkleBurst(Math.floor(this.puff.fx / T), Math.floor(this.puff.fy / T), n),
      extraButtons: (id) => this.jobs.deliveriesFor(id),
      refreshHud: () => this.refreshHud(),
      save: () => void this.save(false)
    });
    this.jobs = new Jobs({
      state: this.state, view: this.view, content: this.content, clock: this.clock, settings, talk: this.talk, areas: this.areas,
      messFor: (id) => this.messFor(id), area: () => this.areaId, syncMess: (i) => this.world.syncMess(i),
      refreshHud: () => this.refreshHud(), save: () => void this.save(false)
    });
    this.fade = h('div', { class: 'fade', 'aria-hidden': 'true' });
    ui.append(this.fade);
    this.deviceId = (saved?.deviceId as string) ?? (crypto.randomUUID?.() ?? String(Math.random()).slice(2));
    let feet: Pt | undefined;
    if (saved) feet = this.restore(saved);
    else Object.assign(this.puff, this.area.pack.spawn); // a new game starts at the burrow's spawn tile
    this.world.reducedMotion = settings.reducedMotion;
    if (this.state.requests.day !== this.clock.state.day) this.jobs.post();
    this.enterArea(this.areaId, this.puff.x, this.puff.y, false, feet);
    this.bindInput();
    app.ticker.add((t) => this.update(t.deltaMS));
    window.addEventListener('resize', () => { app.resize(); this.world.resize(); });
    this.refreshHud();
    if (!saved) window.setTimeout(() => this.view.say('Ooh. Grey. Let\'s fix that.'), 600);
    if (new URLSearchParams(location.search).has('debug')) this.installDebugHooks();
  }

  /** Character sprite sheets loaded after start; Puff stays code-drawn until they arrive. */
  setSprites(bank: SpriteBank) { setIconBank(bank); this.world.setSprites(bank); this.hud.refreshIcons(); }

  /** Test hook for automated playthroughs, only with ?debug in the URL. */
  private installDebugHooks() {
    const s = this.state;
    (window as unknown as { __town: unknown }).__town = {
      tileToScreen: (x: number, y: number) => this.world.toScreen((x + 0.5) * T, (y + 0.5) * T),
      debug: () => ({ area: this.areaId, puff: { x: this.puff.x, y: this.puff.y }, fluff: s.fluff.value, sparkles: s.sparkles, bag: s.bag.slots.filter(Boolean), tools: s.tools, step: s.onboarding.current?.id ?? 'done', progress: this.mess.progress, day: this.clock.state.day, minutes: this.clock.state.minutes, crops: s.crops }),
      setMinutes: (m: number) => { this.clock.state.minutes = m; },
      mess: () => { const m = this.mess; const out: { x: number; y: number; type: string; hp: number; item?: string }[] = []; for (let i = 0; i < m.type.length; i += 1) if (m.type[i]) out.push({ x: i % m.w, y: Math.floor(i / m.w), type: m.typeAt(i % m.w, Math.floor(i / m.w)), hp: m.hp[i], item: m.item[i] }); return out; },
      props: () => this.area.pack.props.filter((p) => p.action).map((p) => ({ type: p.type, x: p.x, y: p.y, action: p.action, accepts: p.accepts })),
      doors: () => this.area.pack.doors.filter((d) => !d.closedText),
      tapTile: (x: number, y: number) => this.tap((x + 0.5) * T, (y + 0.5) * T),
      tapPoint: (x: number, y: number) => this.tap(x, y),
      feet: () => ({ x: this.puff.fx, y: this.puff.fy }),
      openAt: (x: number, y: number) => this.nav.openAt(x, y),
      busy: () => this.puff.path.length > 0 || this.puff.swingMs > 0 || this.view.busy || this.fading,
      /** Jump to an area in full colour, for screenshots. */
      visit: (id: string, x: number, y: number, colour = true) => { if (colour) this.messFor(id).colour.fill(FULL_COLOUR); this.enterArea(id, x, y, false); },
      puffSprite: () => ({ ...this.world.puffDebug, pose: this.puff.pose, dir: this.puff.dir }),
      /** Where Puff is drawn, in tile units (the tile's own coords when standing at its usual spot). */
      drawn: () => ({ x: this.puff.fx / T - 0.5, y: (this.puff.fy + FEET_TO_BASE + 1) / T - 1 }),
      neighbours: () => this.neighbours.visible(this.areaId).map((n) => ({ id: n.id, x: Math.floor(n.fx / T), y: Math.floor(n.fy / T), fx: n.fx, fy: n.fy, pose: n.pose, dir: n.dir })),
      tapNeighbour: (id: string) => { const n = this.neighbours.states.get(id); if (n) this.tap(n.fx, n.fy - 6); },
      friends: () => s.friends,
      flags: () => s.flags,
      requests: () => s.requests,
      addItem: (id: string, n = 1) => { s.bag.add(id, n); this.refreshHud(); },
      /** Friendship points straight in, to reach heart events in tests. */
      addPoints: (id: string, n: number) => { s.friendOf(id).points += Math.max(0, n); }
    };
  }

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
  private get nav() { return this.navAt(this.areaId); }
  private navAt(id: string) {
    let g = this.navs.get(id);
    if (!g) { g = navFor(this.areas.get(id)!); this.navs.set(id, g); }
    return g;
  }
  private get mess() { return this.messFor(this.areaId); }

  private enterArea(id: string, x: number, y: number, announce = true, feet?: Pt) {
    this.areaId = id;
    // Stand at the tile's usual spot (or a saved exact spot), nudged onto open floor if needed.
    const spot = this.nav.nearestOpen(feet && this.nav.openAt(feet.x, feet.y) ? feet : { x: x * T + T / 2, y: y * T + FEET }) ?? { x: x * T + T / 2, y: y * T + FEET };
    Object.assign(this.puff, { fx: spot.x, fy: spot.y, x: Math.floor(spot.x / T), y: Math.floor(spot.y / T), path: [], action: null, pose: 'idle' });
    this.world.load(this.area, this.mess);
    this.neighbours.place(this.clock.state.minutes);
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
    if (this.view.busy) return;
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
    if (n >= 1 && n <= 5) { const t = (['hands', 'duster', 'sponge', 'rake', 'can'] as ToolId[])[n - 1]; if (this.state.tools[t]) { this.selected = t; this.refreshHud(); } }
    if (e.key.toLowerCase() === 'b') this.openBag();
  }

  /** Android back / Escape: close the top sheet, else open pause. */
  back() {
    if (this.view.closeTopSheet()) return;
    if (this.view.root.querySelector('.dialogue') || this.fading) return;
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
    if (this.view.busy || this.fading || !this.area.inside(tile.x, tile.y)) return;
    this.neighbours.releaseAll();
    const target = this.neighbourAt(px, py) ?? this.targetAt(tile.x, tile.y);
    if (target.kind === 'neighbour') this.neighbours.hold(target.id);
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
    if (!path) { this.view.say('Hmm, can\'t reach that.'); return; }
    this.go(path, target);
  }

  private go(path: Pt[] | null, action: Target | null) {
    if (!path) return;
    this.puff.path = path; this.puff.action = action;
  }

  /** A neighbour drawn under this world point (their sprite stands on the feet point). */
  private neighbourAt(px: number, py: number): Target | null {
    for (const n of this.neighbours.visible(this.areaId)) {
      const base = n.fy + FEET_TO_BASE;
      if (Math.abs(px - n.fx) <= 9 && py >= base - 22 && py <= base + 2) return { kind: 'neighbour', id: n.id, x: Math.floor(n.fx / T), y: Math.floor(n.fy / T) };
    }
    return null;
  }

  /** The world-px rect of a target: its tile, the whole prop, or the space a neighbour stands in. */
  private rectOf(t: Target) {
    if (t.kind === 'neighbour') { const n = this.neighbours.states.get(t.id)!; return { x0: n.fx - 6, y0: n.fy - 4, x1: n.fx + 6, y1: n.fy + 2 }; }
    const prop = t.kind === 'prop' ? this.area.propAt(t.x, t.y) : null;
    const x = prop ? prop.x : t.x; const y = prop ? prop.y : t.y;
    return { x0: x * T, y0: y * T, x1: (x + (prop?.w ?? 1)) * T, y1: (y + (prop?.h ?? 1)) * T };
  }

  private distTo(r: { x0: number; y0: number; x1: number; y1: number }) {
    const { fx, fy } = this.puff;
    return Math.hypot(Math.max(r.x0 - fx, 0, fx - r.x1), Math.max(r.y0 - fy, 0, fy - r.y1));
  }

  // ---- Puff's actions ----------------------------------------------------------------------

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
    if (t.kind === 'neighbour') { this.talk.talkTo(t.id); return; }
    this.face(t.x, t.y);
    if (t.kind === 'door') { this.useDoor(t.x, t.y); return; }
    if (t.kind === 'mess') { this.startSwing(t); return; }
    if (t.kind === 'soil') { this.useSoil(t.x, t.y); return; }
    if (t.kind === 'prop') this.useProp(t);
  }

  private startSwing(t: Target) {
    const { state, view } = this;
    const type = this.mess.typeAt(t.x, t.y) as Exclude<MessType, 'none'>;
    if (type === 'none' as MessType) return;
    const need = TOOL_FOR[type];
    if (!state.tools[need.tool]) { view.say(`Puff needs a ${TOOL_NAMES[need.tool].toLowerCase()} for that.`); return; }
    if (state.tools[need.tool] < need.minTier) { view.say('That needs a Copper sponge.'); return; }
    if (this.settings.autoTool) this.selected = need.tool;
    else if (this.selected !== need.tool) { view.say(`Try the ${TOOL_NAMES[need.tool].toLowerCase()}.`); return; }
    if (type === 'clutter' && !state.bag.canAdd(this.mess.item[t.y * this.area.w + t.x] ?? '')) { view.say('Bag\'s full! Put things away first.'); return; }
    if (need.tool !== 'hands' && !state.fluff.spend(false, this.settings.relaxed ? 0.5 : 1)) { view.say('Getting fluffy-sleepy... snack time?'); this.hud.pulseFluff(); return; }
    this.puff.action = t;
    this.puff.pose = 'swing';
    this.puff.swingMs = SWING_MS;
    view.feedback(need.tool === 'hands' ? 'tap' : 'scrub', 'light');
    this.refreshHud();
  }

  private finishSwing() {
    const { state, view } = this;
    const t = this.puff.action!;
    const i = t.y * this.area.w + t.x;
    const type = this.mess.typeAt(t.x, t.y);
    const tool = TOOL_FOR[type as Exclude<MessType, 'none'>]?.tool ?? this.selected;
    const wasRestored = this.mess.restored;
    const result = this.mess.hit(t.x, t.y, tool, state.tools[tool] ?? 1);
    this.puff.pose = 'idle';
    if (!result.ok) { this.puff.action = null; return; }
    this.world.syncMess(i);
    this.world.colourChanged(result.changed);
    for (const c of result.changed) this.world.syncMess(c);
    if (type === 'dust' || type === 'cobweb') this.world.dustPuff(t.x, t.y);
    if (result.cleared) {
      this.world.sparkleBurst(t.x, t.y, 8);
      view.feedback('sparkle', 'medium');
      state.lastClean = type;
      if (result.item) { state.bag.add(result.item); view.say(type === 'clutter' ? `Got the ${this.content.itemName(result.item).toLowerCase()}!` : ''); }
      if (!state.has('first_clean')) { state.flag('first_clean'); view.say('Look! Colour came back!'); }
      this.onboard({ type: 'cleared', mess: type, area: this.areaId });
    }
    if (!wasRestored && this.mess.restored) this.onRestored();
    if (result.cleared) this.jobs.checkTidy();
    this.refreshHud();
    if (!result.cleared && this.puff.repeat > 0) { this.puff.repeat -= 1; this.startSwing(t); return; }
    this.puff.repeat = 0;
    this.puff.action = null;
  }

  private useProp(t: Extract<Target, { kind: 'prop' }>) {
    const { state, view } = this;
    switch (t.action) {
      case 'putaway': {
        const items = (t.accepts ?? []).flatMap((id) => Array.from({ length: state.bag.count(id) }, () => id));
        if (!items.length) {
          const wanted = (t.accepts ?? []).map((id) => this.content.itemName(id).toLowerCase()).join(' and ');
          view.say(`A home for the ${wanted}.`); return;
        }
        for (const id of items) { state.bag.remove(id); state.sparkles += PUTAWAY_SPARKLES; this.onboard({ type: 'putaway', item: id }); }
        view.say(items.length === 1 ? 'Back where it lives!' : 'All put away!');
        view.feedback('thunk', 'light');
        this.world.sparkleBurst(t.x, t.y, 6);
        this.refreshHud();
        return;
      }
      case 'sleep':
        view.confirm('Go to bed? Puff saves the day and wakes up refreshed.', 'Sleep', () => void this.endDay(false));
        return;
      case 'sign':
        view.showDialogue(t.text ?? 'A sign.');
        return;
      case 'board':
        this.jobs.openBoard();
        return;
      case 'mailbox':
        view.showDialogue(this.clock.state.day > 1 ? 'Today\'s letter is on the kitchen table. (Puff already read it.)' : 'No post yet. Maybe tomorrow!');
        return;
    }
  }

  private useSoil(x: number, y: number) {
    const { state, view } = this;
    const crop = state.crops.find((c) => c.area === this.areaId && c.x === x && c.y === y);
    if (crop) {
      if (crop.days >= cropDays(crop.crop)) {
        if (!state.bag.add(crop.crop)) { view.say('Bag\'s full!'); return; }
        state.crops.splice(state.crops.indexOf(crop), 1);
        view.say('A radish! Crunchy.'); view.feedback('coin', 'medium');
      } else if (!crop.watered) {
        if (!state.tools.can) { view.say('Seeds need water. A can would help.'); return; }
        if (!state.fluff.spend(false, this.settings.relaxed ? 0.5 : 1)) { view.say('Too sleepy to water...'); return; }
        crop.watered = true; this.selected = 'can';
        view.feedback('wipe', 'light');
        this.onboard({ type: 'watered' });
      } else view.say('Growing. No rush.');
    } else if (state.bag.count('radish_seeds') > 0) {
      state.bag.remove('radish_seeds');
      state.crops.push({ area: this.areaId, x, y, crop: 'radish', days: 0, watered: false });
      view.say('Grow big. No rush.'); view.feedback('thunk', 'light');
      this.onboard({ type: 'planted' });
    } else view.say('Seeds would grow here.');
    this.world.setCrops(this.cropsHere());
    this.refreshHud();
  }

  private useDoor(x: number, y: number) {
    const door = this.area.doorAt(x, y);
    if (!door) return;
    if (door.closedText) { this.view.say(door.closedText); this.stepOff(x, y); return; }
    void this.travel(door.to, door.toX, door.toY);
  }

  /** After bumping a closed door, step back one tile so the next tap isn't swallowed. */
  private stepOff(x: number, y: number) {
    for (const s of standTiles(this.area, { x, y })) if (!this.area.doorAt(s.x, s.y)) { this.go(this.nav.findPathTo({ x: this.puff.fx, y: this.puff.fy }, { x: s.x * T + T / 2, y: s.y * T + FEET }), null); return; }
  }

  private cropsHere() {
    return this.state.crops.filter((c) => c.area === this.areaId).map((c) => ({ x: c.x, y: c.y, stage: c.days >= cropDays(c.crop) ? 2 : c.days > 0 ? 1 : 0, watered: c.watered }));
  }

  private onRestored() {
    const { state, view } = this;
    const reward = this.area.pack.restoreReward ?? 0;
    state.sparkles += reward;
    view.feedback('fanfare', 'success');
    this.puff.pose = 'hop'; this.puff.hopMs = 900;
    for (let n = 0; n < 6; n += 1) this.world.sparkleBurst(this.puff.x - 3 + n, this.puff.y - 2 + (n % 3), 10);
    view.banner(`${this.area.pack.name} restored!${reward ? ` +${reward} ✨` : ''}`);
    this.onboard({ type: 'restored', area: this.areaId });
    if (this.area.pack.kind === 'home') {
      state.flag(`restored_${this.areaId}`);
      // Auto-offer the clip at most once a day (A11.5).
      if (this.sharePromptDay !== this.clock.state.day) {
        this.sharePromptDay = this.clock.state.day;
        const first = !state.has('shared_prompt');
        state.flag('shared_prompt');
        const area = this.area;
        window.setTimeout(() => offerClip(view, area, first), 1400);
      }
    }
    void this.save(false);
  }

  // ---- days --------------------------------------------------------------------------------

  private async endDay(dozed: boolean) {
    if (this.fading) return;
    const { state, view } = this;
    view.hold();
    this.fading = true;
    this.puff.pose = 'sleep';
    if (dozed) view.say('Zzz... just resting my fluff.');
    await wait(dozed ? 1400 : 300);
    this.fade.classList.add('on', 'night');
    await wait(this.settings.reducedMotion ? 200 : 900);
    this.clock.nextDay();
    this.jobs.post();
    if (dozed) state.fluff.doze(); else state.fluff.sleep();
    for (const c of state.crops) { if (c.watered) c.days += 1; c.watered = false; }
    this.hud.setLate(false);
    // Wake up beside the bed: the burrow's spawn tile.
    const bed = this.areas.get('burrow')!.pack.spawn;
    this.enterArea('burrow', bed.x, bed.y, false);
    this.puff.dir = 'down';
    await this.save(true);
    this.fade.classList.remove('on', 'night');
    this.fading = false;
    view.release();
    this.refreshHud();
    morningLetter({ state, view, clock: this.clock, refreshHud: () => this.refreshHud() });
  }

  // ---- onboarding --------------------------------------------------------------------------

  private onboard(e: OnboardEvent) {
    const { state } = this;
    const done = state.onboarding.handle(e);
    for (const step of done) {
      for (const t of step.grant ?? []) this.grantTool(t);
      for (const [id, n] of Object.entries(step.items ?? {})) state.bag.add(id, n);
    }
    if (done.length) {
      const next = state.onboarding.current;
      if (next?.grant) for (const t of next.grant) this.grantTool(t);
      if (next?.items) for (const [id, n] of Object.entries(next.items)) if (state.bag.count(id) < n) state.bag.add(id, n - state.bag.count(id));
      if (next?.id === 'fluff') { this.hud.pulseFluff(); window.setTimeout(() => this.onboard({ type: 'timer' }), 5000); }
      this.updateHighlight();
      this.refreshHud();
    }
  }

  private grantTool(t: ToolId) {
    if (this.state.tools[t]) return;
    this.state.tools[t] = 1;
    this.view.banner(`New tool: ${TOOL_NAMES[t]}!`);
  }

  private updateHighlight() {
    const step = this.state.onboarding.current;
    if (!step || this.areaId !== 'burrow') { this.world.setHighlight([]); return; }
    const tiles: Tile[] = [];
    const m = this.mess;
    const want = step.id === 'dust' ? 'dust' : step.id === 'stain' ? 'stain' : step.id === 'sock' ? 'clutter' : null;
    if (want) for (let i = 0; i < m.type.length; i += 1) if (m.typeAt(i % m.w, Math.floor(i / m.w)) === want) tiles.push({ x: i % m.w, y: Math.floor(i / m.w) });
    this.world.setHighlight(tiles.slice(0, want === 'dust' ? 4 : 3));
  }

  // ---- sheets ------------------------------------------------------------------------------

  private openBag() { openBag({ state: this.state, view: this.view, content: this.content, refreshHud: () => this.refreshHud() }); }

  private openPause() {
    const { state } = this;
    openPause({
      view: this.view, settings: this.settings, sound: this.sound,
      settingsChanged: () => {
        const s = this.settings;
        this.sound.enabled = s.sound; this.sound.musicOn = s.music;
        if (s.music) this.sound.startMusic(); else this.sound.stopMusic();
        this.world.reducedMotion = s.reducedMotion;
        void this.save(false);
      },
      openFriends: () => this.talk.openFriends(),
      skipTips: state.onboarding.skippable ? () => {
        for (const step of state.onboarding.skip()) {
          for (const t of step.grant ?? []) state.tools[t] = 1;
          for (const [id, n] of Object.entries(step.items ?? {})) state.bag.add(id, n);
        }
        this.updateHighlight(); this.refreshHud();
      } : null
    });
  }

  // ---- loop --------------------------------------------------------------------------------

  private update(dt: number) {
    dt = Math.min(dt, 100);
    const p = this.puff;
    if (!this.view.busy && !this.fading) {
      for (const e of this.clock.advance(dt)) {
        if (e === 'tick') this.world.setTint(this.clock.state.minutes);
        if (e === 'late') { this.hud.setLate(true); this.view.say('Getting fluffy-sleepy...'); }
        if (e === 'doze' && !this.settings.relaxed) void this.endDay(true);
      }
      // Walk the waypoints at walking speed; the tile under the feet drives mess, doors and onboarding.
      if (p.path.length) {
        let budget = dt * ((this.state.fluff.tired ? WALK_SPEED_TIRED : WALK_SPEED) * T / 1000);
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
      this.neighbours.update(this.clock.state.minutes, this.areaId, dt);
      if (p.swingMs > 0) { p.swingMs -= dt; if (p.swingMs <= 0) this.finishSwing(); }
      if (p.hopMs > 0) { p.hopMs -= dt; if (p.hopMs <= 0 && p.pose === 'hop') p.pose = 'idle'; }
      this.autosaveMs += dt;
      if (this.autosaveMs > TUNING.autosaveSeconds * 1000) { this.autosaveMs = 0; void this.save(false); }
    }
    this.world.drawPuff({ x: p.fx, y: p.fy + FEET_TO_BASE, dir: p.dir, pose: p.pose, tool: this.selected }, dt);
    this.world.drawNeighbours(this.neighbours.visible(this.areaId).map((n) => {
      const d = this.content.neighbour(n.id)!;
      return { id: n.id, species: d.species, colours: d.colours, x: n.fx, y: n.fy + FEET_TO_BASE, dir: n.dir, pose: n.pose };
    }));
    this.world.follow(p.fx, p.fy - 8);
    this.world.update(dt);
    this.placeBubble(p.fx, p.fy + FEET_TO_BASE);
    this.updateHudLive();
    this.view.tick(dt);
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
    this.hud.setFluff(this.state.fluff.value, this.state.fluff.cap, this.state.fluff.tired);
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
      const verb: Record<string, string> = { dust: 'Dust it', stain: 'Sponge the stain', weeds: 'Rake the weeds', clutter: `Pick up the ${this.content.itemName(this.mess.item[t.y * this.area.w + t.x] ?? '').toLowerCase()}`, grime: 'Scrub the grime', cobweb: 'Dust the cobweb' };
      return `${verb[type] ?? 'Clean it'}${hp > 1 ? ` (${hp} hits)` : ''}`;
    }
    if (t.kind === 'soil') return this.state.crops.some((c) => c.area === this.areaId && c.x === t.x && c.y === t.y) ? 'Tend the crop' : 'Plant seeds';
    if (t.kind === 'door') return 'Go through';
    if (t.kind === 'neighbour') return `Say hello to ${this.content.neighbour(t.id)?.name ?? 'them'}`;
    if (t.kind === 'prop') return ({ putaway: 'Put things away', sleep: 'Go to bed', sign: 'Read the sign', board: 'Read the notice board', mailbox: 'Check the mail' } as Record<string, string>)[t.action] ?? '';
    return '';
  }

  private refreshHud() {
    const owned = (['hands', 'duster', 'sponge', 'rake', 'can'] as ToolId[]).filter((t) => this.state.tools[t]);
    if (!owned.includes(this.selected)) this.selected = owned[0];
    this.hud.setTools(owned, this.selected);
    this.hud.setSparkles(this.state.sparkles);
    const step = this.state.onboarding.current;
    this.hud.setTracker(step ? step.hint : this.jobs.tracker() ?? 'Explore Hollowfern and tidy what you find.');
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

  // ---- save --------------------------------------------------------------------------------

  private snapshot(): TownSave {
    const s = this.state;
    const areas: TownSave['areas'] = {};
    for (const [id, m] of this.messes) areas[id] = m.snapshot();
    return stamp({
      deviceId: this.deviceId, day: this.clock.state.day, minutes: this.clock.state.minutes,
      fluff: { value: s.fluff.value, max: s.fluff.max, boost: s.fluff.boost }, sparkles: s.sparkles,
      bag: s.bag.slots, tools: s.tools, area: this.areaId, puff: { x: this.puff.x, y: this.puff.y, fx: this.puff.fx, fy: this.puff.fy, facing: this.puff.dir },
      areas, crops: s.crops, flags: s.flags, friends: s.friends, onboarding: s.onboarding.step, chores: s.chores, requests: s.requests, settings: this.settings,
      selected: this.selected, lastClean: s.lastClean
    });
  }

  async save(bedtime: boolean) { await writeTown(this.snapshot(), bedtime); }

  /** Load a save; returns Puff's exact saved feet position when there is one. */
  private restore(save: TownSave): Pt | undefined {
    const s = this.state;
    this.clock.state = { day: save.day, minutes: Math.min(DAY_END, Math.max(DAY_START, save.minutes)) };
    s.fluff = new Fluff(save.fluff.value, save.fluff.max, save.fluff.boost);
    s.sparkles = save.sparkles;
    s.bag = new Bag(save.bag.length ? save.bag : undefined);
    s.tools = { hands: 1, ...save.tools };
    s.crops = save.crops ?? [];
    s.flags = save.flags ?? [];
    s.friends = save.friends ?? {};
    s.onboarding = new Onboarding(save.onboarding ?? 0, 0);
    s.chores = save.chores ?? s.chores;
    if (save.requests && typeof save.requests === 'object') s.requests = save.requests as RequestState;
    s.lastClean = typeof save.lastClean === 'string' ? save.lastClean : 'none';
    if (typeof save.selected === 'string') this.selected = save.selected as ToolId;
    for (const [id, snap] of Object.entries(save.areas ?? {})) {
      if (!this.areas.has(id)) continue;
      const m = this.messFor(id);
      try { m.load(snap); } catch { /* a bad area snapshot just starts that area fresh */ }
    }
    const area = this.areas.get(save.area) ? save.area : 'burrow';
    this.areaId = area;
    const a = this.areas.get(area)!;
    const ok = a.walkable(save.puff.x, save.puff.y);
    this.puff.x = ok ? save.puff.x : a.pack.spawn.x; this.puff.y = ok ? save.puff.y : a.pack.spawn.y;
    this.puff.dir = save.puff.facing ?? 'down';
    if (this.clock.state.minutes >= LATE_AT) this.hud?.setLate(true);
    return ok && typeof save.puff.fx === 'number' && typeof save.puff.fy === 'number' ? { x: save.puff.fx, y: save.puff.fy } : undefined;
  }
}

function wait(ms: number) { return new Promise((r) => window.setTimeout(r, ms)); }
