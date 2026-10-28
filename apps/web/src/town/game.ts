import type { Application } from 'pixi.js';
import type { Sound } from '../shared/audio/sound';
import type { NativeBridge } from '../shared/native';
import { h } from '../shared/ui/dom';
import { openBuildBoard } from './build/build-sheet';
import type { TownPack } from './data/area';
import { Content } from './data/content';
import { stamp, writeQuick, writeTown, type TownSave } from './data/save';
import { NEIGHBOUR_WALK_SPEED, TUNING, WALK_SPEED, WALK_SPEED_TIRED } from './data/tuning';
import { GrumbleLife } from './grumbles/grumble-life';
import { Conversations } from './neighbours/conversations';
import { Neighbours } from './neighbours/neighbours';
import { installDebugHooks } from './debug';
import { PuffActions } from './play/actions';
import { Clock, DAY_END, DAY_START, formatTime, LATE_AT } from './play/clock';
import { Carry } from './play/carry';
import { HomeLife } from './play/home-life';
import { morningLetter } from './play/letter';
import type { ToolId } from './play/mess';
import { OnboardingGuide } from './play/onboarding-guide';
import { nudge } from './play/nudges';
import { overnight } from './play/overnight';
import { Puff } from './play/puff';
import { distTo, FEET_TO_BASE, neighbourAt, rectOf, targetAt, type Here, type Target } from './play/targets';
import { Jobs } from './requests/jobs';
import { openShop } from './shops/shop-sheet';
import { isOpen } from './shops/shops';
import { TownState } from './state';
import { openBag } from './ui/bag-sheet';
import { Hud, TOOL_SLOTS } from './ui/hud';
import { bindKeyboard } from './ui/keyboard';
import { openNaming } from './ui/naming-sheet';
import { openPause } from './ui/pause-menu';
import { PointerInput } from './ui/pointer-input';
import { promptFor } from './ui/prompt';
import { View, type Settings } from './ui/view';
import { isUnlocked } from './unlocks';
import { T } from './world/art/texture';
import { FEET, REACH, type Pt } from './world/nav';
import { setIconBank, type SpriteBank } from './world/sprites';
import { GrumbleLayer } from './world/grumble-layer';
import { TownAreas } from './world/town-areas';
import { World } from './world/world';

/** At most this many extra scrubs from one rub. */
const MAX_RUB = 4;

// The town game (GDD v3): it owns the areas, Puff, input, the day and the save, and hands the rest
// to feature modules: neighbours/conversations (talk, gifts, heart events, Friends), requests/jobs
// (notice board), ui/* (sheets) and play/letter. Saved progress lives in one shared TownState.
export class TownGame {
  private places: TownAreas;
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
  private grumbles: GrumbleLife;
  private grumbleLayer: GrumbleLayer;
  private carry: Carry;
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
    this.places = new TownAreas(pack);
    this.content = new Content(pack, () => this.state.names);
    this.neighbours = new Neighbours(pack.neighbours ?? [], pack.areas, (id) => (this.places.has(id) ? this.places.nav(id) : null), NEIGHBOUR_WALK_SPEED, (id) => this.arrived(id));
    this.world = new World(app);
    app.stage.addChild(this.world.root);
    this.hud = new Hud(ui, {
      tool: (t) => { this.view.uiTap(); this.selected = t; this.refreshHud(); },
      bag: () => { this.view.uiTap(); this.openBag(); },
      pause: () => { this.view.uiTap(); this.openPause(); },
      tracker: () => this.view.uiTap()
    });
    this.view = new View(ui, this.hud, sound, native, settings, () => this.mess.progress, () => this.state.names.puff);
    this.talk = new Conversations({
      state: this.state, view: this.view, content: this.content, clock: this.clock, neighbours: this.neighbours,
      area: () => this.areaId,
      facePuff: (x, y) => { this.puff.faceAlong(x - this.puff.fx, y - this.puff.fy); return this.puff.dir; },
      hopPuff: () => this.puff.hop(),
      sparkleAtPuff: (n) => this.world.sparkleBurst(Math.floor(this.puff.fx / T), Math.floor(this.puff.fy / T), n),
      extraButtons: (id) => [...this.jobs.deliveriesFor(id), ...this.shopButtonsFor(id)],
      onboard: (e) => this.guide.handle(e),
      refreshHud: () => this.refreshHud(),
      save: () => void this.save(false)
    });
    this.jobs = new Jobs({
      state: this.state, view: this.view, content: this.content, clock: this.clock, settings, talk: this.talk, areas: this.places,
      messFor: (id) => this.places.mess(id), area: () => this.areaId, syncMess: (i) => this.world.syncMess(i),
      arrived: (id) => this.arrived(id), onboard: (e) => this.guide.handle(e), refreshHud: () => this.refreshHud(), save: () => void this.save(false)
    });
    this.guide = new OnboardingGuide({
      state: this.state, view: this.view, hud: this.hud, area: () => this.areaId, messFor: (id) => this.places.mess(id),
      highlight: (tiles) => this.world.setHighlight(tiles), refreshHud: () => this.refreshHud()
    });
    this.carry = new Carry({ puff: this.puff, area: () => this.area, mess: () => this.mess, tap: (x, y) => this.tap(x, y) });
    this.grumbleLayer = new GrumbleLayer(this.world.actors);
    this.grumbles = new GrumbleLife({
      state: this.state, view: this.view, content: this.content, world: this.world, places: this.places, layer: this.grumbleLayer,
      arrived: (k) => this.arrived(k), area: () => this.areaId, puff: () => this.puff.feet,
      targeted: () => { const t = this.puff.swing ?? this.puff.action; return t?.kind === 'grumble' ? t.id : null; }, refreshHud: () => this.refreshHud(), save: () => void this.save(false)
    });
    this.actions = new PuffActions({
      state: this.state, view: this.view, content: this.content, clock: this.clock, settings,
      puff: this.puff, world: this.world, hud: this.hud, jobs: this.jobs, talk: this.talk, guide: this.guide, grumbles: this.grumbles,
      here: () => ({ id: this.areaId, area: this.area, mess: this.mess, nav: this.nav }),
      selected: () => this.selected,
      select: (t) => { this.selected = t; },
      travel: (to, x, y) => void this.travel(to, x, y),
      sleep: () => void this.endDay(false),
      openBuild: () => this.openBuild(),
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
    this.places.rebuild(this.state.plots);
    this.grumbles.newDay(this.clock.state.day);
    this.world.reducedMotion = this.grumbleLayer.reducedMotion = settings.reducedMotion;
    if (this.state.requests.day !== this.clock.state.day) this.jobs.post();
    this.enterArea(this.areaId, this.puff.x, this.puff.y, false, feet);
    this.bindInput(ui);
    app.ticker.add((t) => this.update(t.deltaMS));
    window.addEventListener('resize', () => { app.resize(); this.world.resize(); });
    this.refreshHud();
    if (!saved) this.openNames(() => window.setTimeout(() => this.view.say('Ooh. Grey. Let\'s fix that.'), 600));
    if (new URLSearchParams(location.search).has('debug')) {
      installDebugHooks({
        world: this.world, puff: this.puff, state: this.state, clock: this.clock, jobs: this.jobs, neighbours: this.neighbours, view: this.view, guide: this.guide,
        areaId: () => this.areaId, area: () => this.area, mess: () => this.mess, nav: () => this.nav, fading: () => this.fading,
        messFor: (id) => this.places.mess(id), enterArea: (id, x, y, announce) => this.enterArea(id, x, y, announce), tap: (x, y) => this.tap(x, y), refreshHud: () => this.refreshHud()
      });
    }
  }

  /** Character sprite sheets loaded after start; Puff stays code-drawn until they arrive. */
  setSprites(bank: SpriteBank) { setIconBank(bank); this.world.setSprites(bank); this.grumbleLayer.setSprites(bank); this.hud.refreshIcons(); }

  // ---- areas -------------------------------------------------------------------------------

  private get area() { return this.places.get(this.areaId)!; }
  private get nav() { return this.places.nav(this.areaId); }
  private get mess() { return this.places.mess(this.areaId); }
  /** How tidy the current area is, 1 once it's restored. */
  private get tidiness() { return this.mess.restored ? 1 : this.mess.progress; }

  private enterArea(id: string, x: number, y: number, announce = true, feet?: Pt) {
    this.areaId = id;
    // Stand at the tile's usual spot (or a saved exact spot), nudged onto open floor if needed.
    const spot = this.nav.nearestOpen(feet && this.nav.openAt(feet.x, feet.y) ? feet : { x: x * T + T / 2, y: y * T + FEET }) ?? { x: x * T + T / 2, y: y * T + FEET };
    this.puff.standAt(spot);
    this.world.load(this.area, this.mess);
    this.homeLife.enter(id, this.area.pack.alive ?? [], this.tidiness);
    this.grumbles.entered();
    this.neighbours.place(this.clock.state.minutes);
    this.world.setCrops(this.actions.cropsHere());
    this.world.setPickups(this.actions.pickupsHere());
    this.world.setTint(this.clock.state.minutes);
    this.world.follow(spot.x, spot.y - 8, true);
    this.guide.updateHighlight();
    if (announce) { this.hud.announce(this.content.named(this.area.pack.name)); this.guide.handle({ type: 'entered', area: id }); }
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
      drag: (from, to) => this.carry.drag(from, to),
      carryable: (p) => this.carry.clutterAt(Math.floor(p.x / T), Math.floor(p.y / T)) ?? null
    });
    bindKeyboard({
      puff: this.puff, nav: () => this.nav, busy: () => this.view.busy, back: () => this.back(), tap: (x, y) => this.tap(x, y),
      selectSlot: (n) => { const t = TOOL_SLOTS[n - 1]; if (this.state.tools[t]) { this.selected = t; this.refreshHud(); } },
      openBag: () => this.openBag()
    });
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
    const target = neighbourAt(this.neighbours.visible(this.areaId), px, py) ?? this.grumbles.at(px, py) ?? targetAt(this.here, tile.x, tile.y);
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

  /**
   * Whether something in the year-one schedule (a neighbour, a place) has arrived yet. A neighbour
   * Puff has already met stays (older test saves met everyone early): nothing is ever taken away.
   */
  private arrived(key: string) { return isUnlocked(key, { day: this.clock.state.day, flags: this.state.flags }) || !!this.state.friends[key]?.met; }

  private rectOf(t: Target) { return rectOf(t, this.area, t.kind === 'neighbour' ? this.neighbours.states.get(t.id) : t.kind === 'grumble' ? this.grumbles.find(t.id) : undefined); }

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
    const built = overnight(state, this.content.pack.buildings ?? [], this.clock.state.day - 1, dozed);
    this.places.rebuild(this.state.plots);
    this.grumbles.newDay(this.clock.state.day);
    this.hud.setLate(false);
    // Wake up beside the bed: the burrow's spawn tile.
    const bed = this.places.get('burrow')!.pack.spawn;
    this.enterArea('burrow', bed.x, bed.y, false);
    this.puff.dir = 'down';
    await this.save(true);
    this.fade.classList.remove('on', 'night');
    this.fading = false;
    view.release();
    this.guide.handle({ type: 'slept' });
    this.refreshHud();
    morningLetter({ state, view, clock: this.clock, refreshHud: () => this.refreshHud() });
    for (const name of built) view.banner((this.content.line('build.done') ?? '').replace('{building}', name.toLowerCase()));
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

  private openBuild() {
    openBuildBoard({
      state: this.state, view: this.view, content: this.content, clock: this.clock, arrived: (k) => this.arrived(k),
      started: (plot) => {
        this.places.rebuild(this.state.plots);
        if (plot.area === this.areaId) this.enterArea(this.areaId, this.puff.x, this.puff.y, false, { x: this.puff.fx, y: this.puff.fy });
        this.world.sparkleBurst(plot.x, plot.y, 10);
        this.refreshHud();
        void this.save(false);
      }
    });
  }

  private openBag() { openBag({ state: this.state, view: this.view, content: this.content, onboard: (e) => this.guide.handle(e), refreshHud: () => this.refreshHud() }); }

  private openPause() {
    openPause({
      view: this.view, settings: this.settings, sound: this.sound,
      settingsChanged: () => {
        const s = this.settings;
        this.sound.enabled = s.sound; this.sound.musicOn = s.music;
        if (s.music) this.sound.startMusic(); else this.sound.stopMusic();
        this.world.reducedMotion = this.grumbleLayer.reducedMotion = s.reducedMotion;
        document.documentElement.classList.toggle('reduce-motion', s.reducedMotion);
        void this.save(false);
      },
      openFriends: () => this.talk.openFriends(),
      openNames: () => this.openNames(),
      skipTips: this.state.onboarding.skippable ? () => this.guide.skip() : null
    });
  }

  /** Name Puff and the town; `then` runs once the sheet closes. */
  private openNames(then?: () => void) {
    openNaming(this.view, this.state.names, (names) => { this.state.names = names; this.refreshHud(); void this.save(false); then?.(); });
  }

  // ---- loop --------------------------------------------------------------------------------

  private update(dt: number) {
    dt = Math.min(dt, 100);
    const p = this.puff;
    if (!this.view.busy && !this.fading) {
      for (const e of this.clock.advance(dt)) {
        if (e === 'tick') this.world.setTint(this.clock.state.minutes);
        if (e === 'late') { this.hud.setLate(true); this.view.say(`${this.state.names.puff}'s getting sleepy. Head home to bed.`); }
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
      this.carry.tick();
      if (p.swingMs > 0) { p.swingMs -= dt; if (p.swingMs <= 0) this.actions.finishSwing(); }
      if (p.hopMs > 0) { p.hopMs -= dt; if (p.hopMs <= 0 && p.pose === 'hop') p.pose = 'idle'; }
      this.autosaveMs += dt;
      if (this.autosaveMs > TUNING.autosaveSeconds * 1000) { this.autosaveMs = 0; void this.save(false); }
    }
    this.world.drawPuff({ x: p.fx, y: p.fy + FEET_TO_BASE, dir: p.dir, pose: p.pose, tool: this.selected }, dt);
    this.world.drawNeighbours(this.neighbours.visible(this.areaId).map((n) => {
      const d = this.content.neighbour(n.id)!;
      return { id: n.id, species: d.species, colours: d.colours, x: n.fx, y: n.fy + FEET_TO_BASE, dir: n.dir, pose: n.pose };
    }));
    this.grumbles.tick(dt, this.view.busy || this.fading);
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
    if (this.hud.setFluff(this.state.fluff.value, this.state.fluff.cap, this.state.fluff.tired)) this.view.say('Feeling sleepy... a snack would help.');
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
    const next = this.content.line(nudge(this.state, (k) => this.arrived(k)) ?? undefined);
    this.hud.setTracker(this.content.named(step ? step.hint : this.jobs.tracker() ?? next ?? 'Explore {town} and tidy what you find.'));
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
    const areas = this.places.snapshot();
    return stamp({
      ...this.state.toSave(),
      deviceId: this.deviceId, day: this.clock.state.day, minutes: this.clock.state.minutes,
      area: this.areaId, puff: { x: this.puff.x, y: this.puff.y, fx: this.puff.fx, fy: this.puff.fy, facing: this.puff.dir },
      areas, settings: this.settings, selected: this.selected
    });
  }

  async save(bedtime: boolean) { await writeTown(this.snapshot(), bedtime); }

  /** Leaving the page: a quick copy that can't be cut off, as well as the usual save. */
  saveNow() { const s = this.snapshot(); writeQuick(s); void writeTown(s, false); }

  /** Load a save; returns Puff's exact saved feet position when there is one. */
  private restore(save: TownSave): Pt | undefined {
    this.clock.state = { day: save.day, minutes: Math.min(DAY_END, Math.max(DAY_START, save.minutes)) };
    this.state.load(save);
    if (typeof save.selected === 'string') this.selected = save.selected as ToolId;
    for (const [id, snap] of Object.entries(save.areas ?? {})) {
      if (!this.places.has(id)) continue;
      const m = this.places.mess(id);
      try { m.load(snap); } catch { /* a bad area snapshot just starts that area fresh */ }
    }
    const area = this.places.get(save.area) ? save.area : 'burrow';
    this.areaId = area;
    const a = this.places.get(area)!;
    const ok = a.walkable(save.puff.x, save.puff.y);
    this.puff.x = ok ? save.puff.x : a.pack.spawn.x; this.puff.y = ok ? save.puff.y : a.pack.spawn.y;
    this.puff.dir = save.puff.facing ?? 'down';
    if (this.clock.state.minutes >= LATE_AT) this.hud?.setLate(true);
    return ok && typeof save.puff.fx === 'number' && typeof save.puff.fy === 'number' ? { x: save.puff.fx, y: save.puff.fy } : undefined;
  }
}

function wait(ms: number) { return new Promise((r) => window.setTimeout(r, ms)); }
