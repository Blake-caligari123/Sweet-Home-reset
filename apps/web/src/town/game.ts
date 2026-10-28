import type { Application } from 'pixi.js';
import type { Sound } from '../shared/audio/sound';
import type { NativeBridge } from '../shared/native';
import { h } from '../shared/ui/dom';
import { Area, type TownPack } from './data/area';
import { Content } from './data/content';
import { stamp, writeTown, type TownSave } from './data/save';
import { NEIGHBOUR_WALK_SPEED, TUNING, WALK_SPEED, WALK_SPEED_TIRED } from './data/tuning';
import { Conversations } from './neighbours/conversations';
import { Neighbours } from './neighbours/neighbours';
import { installDebugHooks } from './debug';
import { PuffActions } from './play/actions';
import { Clock, DAY_END, DAY_START, formatTime, LATE_AT } from './play/clock';
import { HomeLife } from './play/home-life';
import { morningLetter } from './play/letter';
import { AreaMess, type ToolId } from './play/mess';
import { OnboardingGuide } from './play/onboarding-guide';
import { Puff } from './play/puff';
import { distTo, FEET_TO_BASE, neighbourAt, rectOf, targetAt, type Here, type Target } from './play/targets';
import { isLocked, plusFromUrl } from './plus/plus';
import { Jobs } from './requests/jobs';
import { openShop } from './shops/shop-sheet';
import { isOpen } from './shops/shops';
import { TownState } from './state';
import { openBag } from './ui/bag-sheet';
import { Hud, TOOL_SLOTS } from './ui/hud';
import { openPause } from './ui/pause-menu';
import { PointerInput } from './ui/pointer-input';
import { promptFor } from './ui/prompt';
import { View, type Settings } from './ui/view';
import type { Dir } from './world/art/characters';
import { T } from './world/art/texture';
import { FEET, navFor, REACH, type NavGrid, type Pt } from './world/nav';
import type { Tile } from './world/pathfind';
import { setIconBank, type SpriteBank } from './world/sprites';
import { World } from './world/world';

/** At most this many extra scrubs from one rub. */
const MAX_RUB = 4;

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
  private puff = new Puff();
  private guide: OnboardingGuide;
  private actions: PuffActions;
  private homeLife: HomeLife;
  /** Clutter being carried home by a drag: its tile, and where it goes once Puff has it. */
  private carrying: { from: Tile; to: Pt } | null = null;
  /** M2 stub: test builds have Plus; `?plus=0` shows the free game. */
  private plus = plusFromUrl(location.search);
  private fading = false;
  private autosaveMs = 0;
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
      facePuff: (x, y) => { this.puff.faceAlong(x - this.puff.fx, y - this.puff.fy); return this.puff.dir; },
      hopPuff: () => this.puff.hop(),
      sparkleAtPuff: (n) => this.world.sparkleBurst(Math.floor(this.puff.fx / T), Math.floor(this.puff.fy / T), n),
      extraButtons: (id) => [...this.jobs.deliveriesFor(id), ...this.shopButtonsFor(id)],
      locked: (id) => this.locked(id),
      onboard: (e) => this.guide.handle(e),
      refreshHud: () => this.refreshHud(),
      save: () => void this.save(false)
    });
    this.jobs = new Jobs({
      state: this.state, view: this.view, content: this.content, clock: this.clock, settings, talk: this.talk, areas: this.areas,
      messFor: (id) => this.messFor(id), area: () => this.areaId, syncMess: (i) => this.world.syncMess(i),
      locked: (id) => this.locked(id), onboard: (e) => this.guide.handle(e), refreshHud: () => this.refreshHud(), save: () => void this.save(false)
    });
    this.guide = new OnboardingGuide({
      state: this.state, view: this.view, hud: this.hud, area: () => this.areaId, messFor: (id) => this.messFor(id),
      highlight: (tiles) => this.world.setHighlight(tiles), refreshHud: () => this.refreshHud()
    });
    this.actions = new PuffActions({
      state: this.state, view: this.view, content: this.content, clock: this.clock, settings,
      puff: this.puff, world: this.world, hud: this.hud, jobs: this.jobs, talk: this.talk, guide: this.guide,
      here: () => ({ id: this.areaId, area: this.area, mess: this.mess, nav: this.nav }),
      selected: () => this.selected,
      select: (t) => { this.selected = t; },
      travel: (to, x, y) => void this.travel(to, x, y),
      sleep: () => void this.endDay(false),
      openShop: (shop) => this.openShop(shop),
      refreshHud: () => this.refreshHud(),
      save: () => void this.save(false)
    });
    this.homeLife = new HomeLife({ world: this.world, view: this.view, sound, content: this.content });
    this.fade = h('div', { class: 'fade', 'aria-hidden': 'true' });
    ui.append(this.fade);
    this.deviceId = (saved?.deviceId as string) ?? (crypto.randomUUID?.() ?? String(Math.random()).slice(2));
    let feet: Pt | undefined;
    if (saved) feet = this.restore(saved);
    else Object.assign(this.puff, this.area.pack.spawn); // a new game starts at the burrow's spawn tile
    this.world.reducedMotion = settings.reducedMotion;
    if (this.state.requests.day !== this.clock.state.day) this.jobs.post();
    this.enterArea(this.areaId, this.puff.x, this.puff.y, false, feet);
    this.bindInput(ui);
    app.ticker.add((t) => this.update(t.deltaMS));
    window.addEventListener('resize', () => { app.resize(); this.world.resize(); });
    this.refreshHud();
    if (!saved) window.setTimeout(() => this.view.say('Ooh. Grey. Let\'s fix that.'), 600);
    if (new URLSearchParams(location.search).has('debug')) {
      installDebugHooks({
        world: this.world, puff: this.puff, state: this.state, clock: this.clock, jobs: this.jobs, neighbours: this.neighbours, view: this.view, guide: this.guide,
        areaId: () => this.areaId, area: () => this.area, mess: () => this.mess, nav: () => this.nav, fading: () => this.fading,
        messFor: (id) => this.messFor(id), enterArea: (id, x, y, announce) => this.enterArea(id, x, y, announce), tap: (x, y) => this.tap(x, y), refreshHud: () => this.refreshHud()
      });
    }
  }

  /** Character sprite sheets loaded after start; Puff stays code-drawn until they arrive. */
  setSprites(bank: SpriteBank) { setIconBank(bank); this.world.setSprites(bank); this.hud.refreshIcons(); }

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
  /** How tidy the current area is, 1 once it's restored. */
  private get tidiness() { return this.mess.restored ? 1 : this.mess.progress; }

  private enterArea(id: string, x: number, y: number, announce = true, feet?: Pt) {
    this.areaId = id;
    // Stand at the tile's usual spot (or a saved exact spot), nudged onto open floor if needed.
    const spot = this.nav.nearestOpen(feet && this.nav.openAt(feet.x, feet.y) ? feet : { x: x * T + T / 2, y: y * T + FEET }) ?? { x: x * T + T / 2, y: y * T + FEET };
    this.puff.standAt(spot);
    this.world.load(this.area, this.mess);
    this.homeLife.enter(id, this.area.pack.alive ?? [], this.tidiness);
    this.neighbours.place(this.clock.state.minutes);
    this.world.setCrops(this.actions.cropsHere());
    this.world.setPickups(this.actions.pickupsHere());
    this.world.setTint(this.clock.state.minutes);
    this.world.follow(spot.x, spot.y - 8, true);
    this.guide.updateHighlight();
    if (announce) { this.hud.announce(this.area.pack.name); this.guide.handle({ type: 'entered', area: id }); }
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

  private bindInput(ui: HTMLElement) {
    new PointerInput(this.world.root, ui, {
      toWorld: (x, y) => this.world.toWorld(x, y),
      unlock: () => this.sound.unlock(),
      tap: (p) => this.tap(p.x, p.y),
      // Each pass of a rub is another scrub, so a stain comes up in one go.
      rub: (p, passes) => { this.tap(p.x, p.y); if (this.puff.action?.kind === 'mess' || this.puff.swing) this.puff.repeat = Math.min(MAX_RUB, passes - 1); },
      drag: (from, to) => this.carry(from, to),
      carryable: (p) => this.clutterAt(Math.floor(p.x / T), Math.floor(p.y / T)) ?? null
    });
    window.addEventListener('keydown', (e) => this.key(e));
  }

  private clutterAt(x: number, y: number) { return this.mess.typeAt(x, y) === 'clutter' ? this.mess.item[y * this.area.w + x] : undefined; }

  /** A drag: clutter dropped on where it lives is picked up, then carried there; anything else walks to the drop. */
  private carry(from: Pt, to: Pt) {
    const tile = { x: Math.floor(from.x / T), y: Math.floor(from.y / T) };
    const item = this.clutterAt(tile.x, tile.y);
    const home = item ? this.area.tapPropAt(Math.floor(to.x / T), Math.floor(to.y / T)) : null;
    if (!item || !home?.accepts?.includes(item)) { this.tap(to.x, to.y); return; }
    this.carrying = { from: tile, to: { x: (home.x + 0.5) * T, y: (home.y + 0.5) * T } };
    this.tap(from.x, from.y);
  }

  /** Once Puff has picked up the carried clutter, off it goes to where it lives (or the carry is dropped). */
  private carryOn() {
    const c = this.carrying; const p = this.puff;
    if (!c || p.path.length || p.swingMs > 0) return;
    this.carrying = null;
    if (!this.clutterAt(c.from.x, c.from.y)) this.tap(c.to.x, c.to.y);
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
      const f = this.puff.facing;
      this.tap((f.x + 0.5) * T, (f.y + 0.5) * T);
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= 5) { const t = TOOL_SLOTS[n - 1]; if (this.state.tools[t]) { this.selected = t; this.refreshHud(); } }
    if (e.key.toLowerCase() === 'b') this.openBag();
  }

  /** Android back / Escape: close the top sheet, else open pause. */
  back() {
    if (this.view.closeTopSheet()) return;
    if (this.view.root.querySelector('.dialogue') || this.fading) return;
    this.openPause();
  }

  /** A tap at a world point: walk there, or walk within reach of what's there and use it. */
  private tap(px: number, py: number) {
    const tile = { x: Math.floor(px / T), y: Math.floor(py / T) };
    if (this.view.busy || this.fading || !this.area.inside(tile.x, tile.y)) return;
    this.neighbours.releaseAll();
    const target = neighbourAt(this.neighbours.visible(this.areaId), px, py) ?? targetAt(this.here, tile.x, tile.y);
    if (target.kind === 'neighbour') this.neighbours.hold(target.id);
    this.world.showMarker(px, py);
    const p = this.puff; const feet = p.feet;
    // Tapping the thing Puff is already working on queues another go.
    if (p.swingMs > 0 && p.swing && target.kind === p.swing.kind && target.x === p.swing.x && target.y === p.swing.y) {
      p.repeat = Math.min(3, p.repeat + 1);
      return;
    }
    if (target.kind === 'walk') { this.go(this.nav.findPathTo(feet, { x: px, y: py }), null); return; }
    if (target.kind === 'door') { this.go(this.nav.findPathNear(feet, this.rectOf(target), 0), target); return; } // feet inside the door tile
    // Act from wherever is close enough to the target (any tile of a multi-tile prop).
    const r = this.rectOf(target);
    if (!p.path.length && distTo(r, feet) <= REACH) { this.actions.act(target); return; }
    const path = this.nav.findPathNear(feet, r, REACH);
    if (!path) { this.view.say('Hmm, can\'t reach that.'); return; }
    this.go(path, target);
  }

  private go(path: Pt[] | null, action: Target | null) {
    if (!path) return;
    this.puff.path = path; this.puff.action = action;
  }

  private locked(id: string) { return isLocked(this.content.neighbour(id), this.plus); }

  private rectOf(t: Target) { return rectOf(t, this.area, t.kind === 'neighbour' ? this.neighbours.states.get(t.id) : undefined); }

  /** What's around Puff in the current area, for working out taps and prompts. */
  private get here(): Here { return { area: this.area, mess: this.mess, pickups: this.actions.pickupsHere(), bag: this.state.bag }; }

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
    this.guide.handle({ type: 'slept' });
    this.refreshHud();
    morningLetter({ state, view, clock: this.clock, refreshHud: () => this.refreshHud() });
  }

  // ---- sheets ------------------------------------------------------------------------------

  private openShop(shop: NonNullable<TownPack['shops']>[number]) {
    openShop({ state: this.state, view: this.view, content: this.content, clock: this.clock, refreshHud: () => this.refreshHud(), save: () => void this.save(false) }, shop);
  }

  /** "Browse" in a shopkeeper's chat box while their shop is open. */
  private shopButtonsFor(id: string) {
    return (this.content.pack.shops ?? []).filter((s) => s.keeper === id && isOpen(s, this.clock.state.minutes, this.clock.state.day))
      .map((s) => ({ label: `Browse ${s.name.replace(/^.*'s /, '')}`, onClick: () => this.openShop(s) }));
  }

  private openBag() { openBag({ state: this.state, view: this.view, content: this.content, onboard: (e) => this.guide.handle(e), refreshHud: () => this.refreshHud() }); }

  private openPause() {
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
      skipTips: this.state.onboarding.skippable ? () => this.guide.skip() : null
    });
  }

  // ---- loop --------------------------------------------------------------------------------

  private update(dt: number) {
    dt = Math.min(dt, 100);
    const p = this.puff;
    if (!this.view.busy && !this.fading) {
      for (const e of this.clock.advance(dt)) {
        if (e === 'tick') this.world.setTint(this.clock.state.minutes);
        if (e === 'late') { this.hud.setLate(true); this.view.say('Puff\'s getting sleepy. Head home to bed.'); }
        if (e === 'doze' && !this.settings.relaxed) void this.endDay(true);
      }
      // Walk the waypoints at walking speed; the tile under the feet drives mess, doors and onboarding.
      if (p.path.length) {
        let budget = dt * ((this.state.fluff.tired ? WALK_SPEED_TIRED : WALK_SPEED) * T / 1000);
        while (budget > 0 && p.path.length) {
          const n = p.path[0]; const dx = n.x - p.fx; const dy = n.y - p.fy; const d = Math.hypot(dx, dy);
          p.faceAlong(dx, dy);
          if (d <= budget) { p.fx = n.x; p.fy = n.y; p.path.shift(); budget -= d; } else { p.fx += (dx / d) * budget; p.fy += (dy / d) * budget; budget = 0; }
          const tx = Math.floor(p.fx / T); const ty = Math.floor(p.fy / T);
          if (tx !== p.x || ty !== p.y) { p.x = tx; p.y = ty; this.guide.handle({ type: 'stood', ground: this.area.groundAt(tx, ty), area: this.areaId }); }
        }
        if (!p.path.length) {
          p.pose = 'idle';
          const a = p.action; p.action = null;
          if (this.area.doorAt(p.x, p.y)) this.actions.useDoor(p.x, p.y);
          else if (a && a.kind !== 'door') this.actions.act(a);
        } else p.pose = 'walk';
      }
      this.neighbours.update(this.clock.state.minutes, this.areaId, dt);
      this.homeLife.tick(this.areaId, this.tidiness);
      this.carryOn();
      if (p.swingMs > 0) { p.swingMs -= dt; if (p.swingMs <= 0) this.actions.finishSwing(); }
      if (p.hopMs > 0) { p.hopMs -= dt; if (p.hopMs <= 0 && p.pose === 'hop') p.pose = 'idle'; }
      this.autosaveMs += dt;
      if (this.autosaveMs > TUNING.autosaveSeconds * 1000) { this.autosaveMs = 0; void this.save(false); }
    }
    this.world.drawPuff({ x: p.fx, y: p.fy + FEET_TO_BASE, dir: p.dir, pose: p.pose, tool: this.selected }, dt);
    this.world.drawNeighbours(this.neighbours.visible(this.areaId).map((n) => {
      const d = this.content.neighbour(n.id)!;
      return { id: n.id, species: d.species, colours: d.colours, x: n.fx, y: n.fy + FEET_TO_BASE, dir: n.dir, pose: n.pose, locked: this.locked(n.id) };
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
    const here = this.here;
    const ahead = targetAt(here, p.facing.x, p.facing.y);
    return promptFor(p.action ?? p.swing ?? (ahead.kind === 'walk' ? null : ahead), here, this.state.crops, this.content);
  }

  private refreshHud() {
    const owned = TOOL_SLOTS.filter((t) => this.state.tools[t]);
    if (!owned.includes(this.selected)) this.selected = owned[0];
    this.hud.setTools(owned, this.selected);
    this.hud.setSparkles(this.state.sparkles);
    this.guide.unstick();
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
    const areas: TownSave['areas'] = {};
    for (const [id, m] of this.messes) areas[id] = m.snapshot();
    return stamp({
      ...this.state.toSave(),
      deviceId: this.deviceId, day: this.clock.state.day, minutes: this.clock.state.minutes,
      area: this.areaId, puff: { x: this.puff.x, y: this.puff.y, fx: this.puff.fx, fy: this.puff.fy, facing: this.puff.dir },
      areas, settings: this.settings, selected: this.selected
    });
  }

  async save(bedtime: boolean) { await writeTown(this.snapshot(), bedtime); }

  /** Load a save; returns Puff's exact saved feet position when there is one. */
  private restore(save: TownSave): Pt | undefined {
    this.clock.state = { day: save.day, minutes: Math.min(DAY_END, Math.max(DAY_START, save.minutes)) };
    this.state.load(save);
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
