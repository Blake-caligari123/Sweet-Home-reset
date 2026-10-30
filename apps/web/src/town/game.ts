import type { Application } from 'pixi.js';
import type { Sound } from '../shared/audio/sound';
import type { NativeBridge } from '../shared/native';
import { h } from '../shared/ui/dom';
import { openBuildBoard } from './build/build-sheet';
import { openWorkbench } from './craft/craft-sheet';
import type { TownPack } from './data/area';
import { Content } from './data/content';
import { restoreGame } from './data/restore';
import { stamp, writeQuick, writeTown, type TownSave } from './data/save';
import { NEIGHBOUR_WALK_SPEED, TUNING, WALK_SPEED, WALK_SPEED_TIRED } from './data/tuning';
import { Lanterns } from './festivals/lanterns';
import { TidyDash } from './festivals/tidy-dash';
import { GrumbleLife } from './grumbles/grumble-life';
import { PetLife } from './pets/pet-life';
import { openOutfits } from './outfits/outfit-sheet';
import { newlyEarned } from './outfits/outfits';
import { Conversations } from './neighbours/conversations';
import { Neighbours } from './neighbours/neighbours';
import { installDebugHooks } from './debug';
import type { Account } from './account/account-sheet';
import type { Counts } from './account/counts';
import { openMap } from './travel/map-sheet';
import { stickTarget } from './play/stick';
import { Joystick } from './ui/joystick';
import { TownLife } from './life/town-life';
import { connect } from './connect';
import type { Unlocker } from './unlock/unlock-card';
import { PuffActions } from './play/actions';
import { Clock, LATE_AT } from './play/clock';
import { Carry } from './play/carry';
import { Mining } from './caves/mining';
import { Placing } from './decor/placing';
import { Sweep } from './play/sweep';
import { HomeLife } from './play/home-life';
import { morning, passNight } from './play/night';
import { applyLook } from './ui/a11y';
import type { ToolId } from './play/mess';
import { OnboardingGuide } from './play/onboarding-guide';
import { nudge } from './play/nudges';
import { bloomUp } from './bloom/bloom';
import { lettersWaiting } from './letters/letters';
import { Puff } from './play/puff';
import { distTo, FEET_TO_BASE, neighbourAt, rectOf, targetAt, type Here, type Target } from './play/targets';
import { Jobs } from './requests/jobs';
import { openShop } from './shops/shop-sheet';
import { isOpen } from './shops/shops';
import { TownState } from './state';
import { openBag } from './ui/bag-sheet';
import { Hud, TOOL_SLOTS } from './ui/hud';
import { HudLive } from './ui/hud-live';
import { bindKeyboard } from './ui/keyboard';
import { openNaming } from './ui/naming-sheet';
import { openPause } from './ui/pause-menu';
import { PointerInput } from './ui/pointer-input';
import { View, type Settings } from './ui/view';
import { isUnlocked } from './unlocks';
import { T } from './world/art/texture';
import { FEET, REACH, type Pt } from './world/nav';
import { setIconBank, type SpriteBank } from './world/sprites';
import { GrumbleLayer } from './world/grumble-layer';
import { PetLayer } from './world/pet-layer';
import { OutfitLayer } from './world/outfit-layer';
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
  private life: TownLife;
  private jobs: Jobs;
  private selected: ToolId = 'duster';
  private puff = new Puff();
  private guide: OnboardingGuide;
  private actions: PuffActions;
  private homeLife: HomeLife;
  private grumbles: GrumbleLife;
  private grumbleLayer: GrumbleLayer;
  private pet: PetLife;
  private petLayer: PetLayer;
  private outfitLayer: OutfitLayer;
  private carry: Carry;
  private mining: Mining;
  private dash: TidyDash;
  private lanterns: Lanterns;
  private unlocker: Unlocker;
  private stick: Joystick;
  /** The optional account, in builds with a server (VITE_API_ORIGIN). */
  private account: Account | null;
  private counts: Counts | null;
  private placing: Placing;
  private hudLive: HudLive;
  private sweep: Sweep;
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
    this.places = new TownAreas(pack, () => this.clock.state.day);
    this.content = new Content(pack, () => this.state.names);
    this.neighbours = new Neighbours(pack.neighbours ?? [], pack.areas, (id) => (this.places.has(id) ? this.places.nav(id) : null), NEIGHBOUR_WALK_SPEED, (id) => this.arrived(id), () => this.clock.state.day);
    this.world = new World(app);
    app.stage.addChild(this.world.root);
    this.hud = new Hud(ui, {
      tool: (t) => { this.view.uiTap(); this.selected = t; this.refreshHud(); },
      bag: () => { this.view.uiTap(); this.openBag(); },
      pause: () => { this.view.uiTap(); this.openPause(); },
      map: () => { this.view.uiTap(); if (!this.dash.active) this.openMap(); },
      tracker: () => this.view.uiTap()
    });
    this.view = new View(ui, this.hud, sound, native, settings, () => this.mess.progress, () => this.state.names.puff);
    /** What most parts of the game share. */
    const core = { state: this.state, view: this.view, content: this.content, clock: this.clock, world: this.world, refreshHud: () => this.refreshHud(), save: () => void this.save(false) };
    this.life = new TownLife({ state: this.state, content: this.content, clock: this.clock, neighbours: this.neighbours, tidiness: (a) => (this.places.has(a) ? this.places.mess(a).progress : 0.5) });
    this.talk = new Conversations({
      state: this.state, view: this.view, content: this.content, clock: this.clock, neighbours: this.neighbours, life: this.life,
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
    this.hudLive = new HudLive({ clock: this.clock, hud: this.hud, view: this.view, state: this.state, puff: this.puff, world: this.world, content: this.content, here: () => this.here });
    this.placing = new Placing({ ...core, places: this.places, area: () => this.areaId, refreshArea: () => this.refreshArea() });
    this.mining = new Mining({ ...core, puff: this.puff, settings, area: () => this.areaId, day: () => this.clock.state.day, refreshArea: () => this.refreshArea() });
    this.dash = new TidyDash({ ...core, area: () => this.areaId, areaOf: (id) => this.places.get(id)!, messFor: (id) => this.places.mess(id), syncMess: (i) => this.world.syncMess(i), playStory: (id) => this.talk.playStory(id) });
    this.lanterns = new Lanterns({ ...core, refreshArea: () => this.refreshArea(), playStory: (id) => this.talk.playStory(id) });
    // The unlock's store and the optional account, as this build is set up (connect.ts).
    ({ unlocker: this.unlocker, account: this.account, counts: this.counts } = connect({ state: this.state, view: this.view, settings, native, snapshot: () => this.snapshot(), save: () => this.save(false) }));
    this.carry = new Carry({ puff: this.puff, area: () => this.area, mess: () => this.mess, tap: (x, y) => this.tap(x, y) });
    this.sweep = new Sweep({ puff: this.puff, mess: () => this.mess, scrub: (x, y) => this.scrub({ x, y }, MAX_RUB) });
    this.grumbleLayer = new GrumbleLayer(this.world.actors);
    this.grumbles = new GrumbleLife({
      ...core, places: this.places, layer: this.grumbleLayer, arrived: (k) => this.arrived(k), area: () => this.areaId, puff: () => this.puff.feet,
      targeted: () => { const t = this.puff.swing ?? this.puff.action; return t?.kind === 'grumble' ? t.id : null; }
    });
    this.petLayer = new PetLayer(this.world.actors);
    this.outfitLayer = new OutfitLayer(this.world.actors);
    this.pet = new PetLife({ ...core, layer: this.petLayer, arrived: (k) => this.arrived(k), puff: () => this.puff.feet, day: () => this.clock.state.day });
    this.actions = new PuffActions({
      state: this.state, view: this.view, content: this.content, clock: this.clock, settings,
      puff: this.puff, world: this.world, hud: this.hud, jobs: this.jobs, talk: this.talk, guide: this.guide, life: this.life, grumbles: this.grumbles, mining: this.mining, dash: this.dash, lanterns: this.lanterns, arrived: (k) => this.arrived(k),
      here: () => ({ id: this.areaId, area: this.area, mess: this.mess, nav: this.nav }),
      selected: () => this.selected,
      select: (t) => { this.selected = t; },
      travel: (to, x, y) => void this.travel(to, x, y),
      sleep: () => void this.endDay(false),
      openBuild: () => this.openBuild(),
      pickUpDecor: (x, y) => this.placing.pickUp(x, y),
      openWorkbench: (station) => openWorkbench({ state: this.state, view: this.view, content: this.content, refreshHud: () => this.refreshHud(), save: () => void this.save(false) }, station),
      openShop: (shop) => this.openShop(shop),
      refreshHud: () => this.refreshHud(),
      save: () => void this.save(false)
    });
    this.homeLife = new HomeLife({ world: this.world, view: this.view, sound, content: this.content });
    this.fade = h('div', { class: 'fade', 'aria-hidden': 'true' });
    ui.append(this.fade);
    this.deviceId = (saved?.deviceId as string) ?? (crypto.randomUUID?.() ?? String(Math.random()).slice(2));
    let feet: Pt | undefined;
    if (saved) {
      const r = restoreGame(saved, { clock: this.clock, state: this.state, places: this.places, puff: this.puff });
      this.areaId = r.area; this.selected = r.selected ?? this.selected; feet = r.feet;
      if (this.clock.state.minutes >= LATE_AT) this.hud.setLate(true);
    }
    else Object.assign(this.puff, this.area.pack.spawn); // a new game starts at the burrow's spawn tile
    this.places.rebuild(this.state);
    this.grumbles.newDay(this.clock.state.day);
    this.world.reducedMotion = this.grumbleLayer.reducedMotion = this.petLayer.reducedMotion = settings.reducedMotion;
    if (this.state.requests.day !== this.clock.state.day) this.jobs.post();
    this.enterArea(this.areaId, this.puff.x, this.puff.y, false, feet);
    this.stick = new Joystick(ui);
    if (settings.zoomTiles) this.world.zoomTo(settings.zoomTiles);
    this.bindInput(ui);
    app.ticker.add((t) => this.update(t.deltaMS));
    window.addEventListener('resize', () => { app.resize(); this.world.resize(); });
    this.refreshHud();
    if (!saved) this.openNames(() => window.setTimeout(() => this.view.say('Ooh. Grey. Let\'s fix that.'), 600));
    if (new URLSearchParams(location.search).has('debug')) {
      installDebugHooks({
        world: this.world, puff: this.puff, state: this.state, clock: this.clock, jobs: this.jobs, neighbours: this.neighbours, view: this.view, guide: this.guide,
        areaId: () => this.areaId, area: () => this.area, mess: () => this.mess, nav: () => this.nav, fading: () => this.fading,
        messFor: (id) => this.places.mess(id), enterArea: (id, x, y, announce) => this.enterArea(id, x, y, announce), tap: (x, y) => this.tap(x, y), refreshHud: () => this.refreshHud(), sleep: () => this.endDay(false)
      });
    }
  }

  /** Character sprite sheets loaded after start; Puff stays code-drawn until they arrive. */
  setSprites(bank: SpriteBank) { setIconBank(bank); this.world.setSprites(bank); this.grumbleLayer.setSprites(bank); this.petLayer.setSprites(bank); this.hud.refreshIcons(); }

  // ---- areas -------------------------------------------------------------------------------

  private get area() { return this.places.get(this.areaId)!; }
  private get nav() { return this.places.nav(this.areaId); }
  private get mess() { return this.places.mess(this.areaId); }
  /** How tidy the current area is, 1 once it's restored. */
  private get tidiness() { return this.mess.restored ? 1 : this.mess.progress; }

  private enterArea(id: string, x: number, y: number, announce = true, feet?: Pt) {
    this.areaId = id;
    this.state.visit(id);
    // Stand at the tile's usual spot (or a saved exact spot), nudged onto open floor if needed.
    const spot = this.nav.nearestOpen(feet && this.nav.openAt(feet.x, feet.y) ? feet : { x: x * T + T / 2, y: y * T + FEET }) ?? { x: x * T + T / 2, y: y * T + FEET };
    this.puff.standAt(spot);
    this.world.setSky(this.clock.season, this.clock.weather === 'rainy');
    this.world.load(this.area, this.mess);
    this.homeLife.enter(id, this.area.pack.alive ?? [], this.tidiness);
    this.grumbles.entered();
    this.pet.entered(id);
    this.sweep.stop();
    this.neighbours.place(this.clock.state.minutes);
    this.world.setCrops(this.actions.cropsHere());
    this.world.setPickups(this.actions.pickupsHere());
    this.world.setTint(this.clock.state.minutes);
    this.world.follow(spot.x, spot.y - 8, true);
    this.guide.updateHighlight();
    if (announce) { this.hud.announce(this.content.named(this.area.pack.name)); this.guide.handle({ type: 'entered', area: id }); }
  }

  /** Something in this area changed (a rock broke, a lantern lit): rebuild it and show it again where Puff stands. */
  private refreshArea() { this.places.rebuild(this.state); this.enterArea(this.areaId, this.puff.x, this.puff.y, false, this.puff.feet); }

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
      // Tap-only play: one tap tidies a whole spot, as a hold would.
      tap: (p) => { this.sweep.stop(); if (this.settings.tapOnly) this.scrub(p, MAX_RUB); else this.tap(p.x, p.y); },
      // Each pass of a rub (or loop of a circle) is another scrub; a hold keeps going until it's gone.
      rub: (p, passes) => this.scrub(p, passes - 1),
      circle: (p, passes) => this.scrub(p, passes * 2),
      // With a Copper tool, a hold charges the swing instead.
      hold: (p) => { this.scrub(p, MAX_RUB); if (this.actions.charge(Math.floor(p.x / T), Math.floor(p.y / T))) this.puff.repeat = 0; },
      // Clutter carried home, or a row of mess swept; otherwise walk to where the finger stopped.
      drag: (from, to) => { this.sweep.stop(); if (!this.carry.drag(from, to) && !this.sweep.drag(from, to)) this.tap(to.x, to.y); },
      carryable: (p) => this.carry.clutterAt(Math.floor(p.x / T), Math.floor(p.y / T)) ?? null,
      viewTiles: () => this.world.viewTiles,
      zoom: (tiles) => { this.world.zoomTo(tiles); this.settings.zoomTiles = tiles; }
    });
    this.stick.shown = !!this.settings.joystick;
    bindKeyboard({
      puff: this.puff, nav: () => this.nav, busy: () => this.view.busy, back: () => this.back(), tap: (x, y) => this.tap(x, y),
      selectSlot: (n) => { const t = TOOL_SLOTS[n - 1]; if (this.state.tools[t]) { this.selected = t; this.refreshHud(); } },
      openBag: () => this.openBag()
    });
  }

  /** A tap on mess or a Grumble with extra scrubs queued (from a rub, circle or hold). */
  private scrub(p: Pt, extra: number) {
    this.tap(p.x, p.y);
    const kind = (this.puff.swing ?? this.puff.action)?.kind;
    if (kind === 'mess' || kind === 'grumble') this.puff.repeat = Math.min(MAX_RUB, extra);
  }

  /** Android back / Escape: close the top sheet, else open pause. */
  back() {
    if (this.view.closeTopSheet()) return;
    if (this.placing.active) { this.placing.stop(); this.refreshHud(); return; }
    if (this.view.root.querySelector('.dialogue') || this.fading) return;
    this.openPause();
  }

  /** A tap at a world point: walk there, or walk within reach of what's there and use it. */
  private tap(px: number, py: number) {
    const tile = { x: Math.floor(px / T), y: Math.floor(py / T) };
    if (this.view.busy || this.fading || !this.area.inside(tile.x, tile.y)) return;
    // Placing decor: taps go on the ground (tapping Puff stops).
    if (this.placing.active) { if (Math.hypot(px - this.puff.fx, py - this.puff.fy + 8) < 10) this.placing.stop(); else this.placing.tap(tile); this.refreshHud(); return; }
    if (this.pet.at(px, py)) { this.pet.pat(); return; }
    this.neighbours.releaseAll();
    this.puff.charged = false;
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
    const night = passNight({ state, clock: this.clock, content: this.content, jobs: this.jobs, places: this.places, grumbles: this.grumbles, gate: this.unlocker.gate }, dozed);
    this.hud.setLate(false);
    // Wake up beside the bed: the burrow's spawn tile.
    const bed = this.places.get('burrow')!.pack.spawn;
    this.enterArea('burrow', bed.x, bed.y, false);
    this.puff.dir = 'down';
    await this.save(true);
    void this.account?.sync();
    this.counts?.add('day_started', { day: this.clock.state.day });
    this.fade.classList.remove('on', 'night');
    this.fading = false;
    view.release();
    this.guide.handle({ type: 'slept' });
    this.refreshHud();
    morning({ state, view, clock: this.clock, content: this.content, refreshHud: () => this.refreshHud(), offer: () => void this.unlocker.offer() }, night);
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
        this.places.rebuild(this.state);
        if (plot.area === this.areaId) this.enterArea(this.areaId, this.puff.x, this.puff.y, false, { x: this.puff.fx, y: this.puff.fy });
        this.world.sparkleBurst(plot.x, plot.y, 10);
        this.refreshHud();
        void this.save(false);
      }
    });
  }

  private openBag() {
    openBag({ state: this.state, view: this.view, content: this.content, onboard: (e) => this.guide.handle(e), refreshHud: () => this.refreshHud(), place: (id) => { this.placing.start(id); this.refreshHud(); } });
  }

  private openPause() {
    openPause({
      view: this.view, settings: this.settings, sound: this.sound,
      settingsChanged: () => {
        const s = this.settings;
        this.sound.enabled = s.sound; this.sound.musicOn = s.music;
        if (s.music) this.sound.startMusic(); else this.sound.stopMusic();
        this.world.reducedMotion = this.grumbleLayer.reducedMotion = this.petLayer.reducedMotion = s.reducedMotion;
        applyLook(s);
        this.stick.shown = !!s.joystick;
        void this.save(false);
      },
      openFriends: () => this.talk.openFriends(),
      openNames: () => this.openNames(),
      openOutfits: () => openOutfits(this.view, this.content, this.state, () => void this.save(false)),
      townLine: `🌸 Town Bloom: ${this.content.line(`bloom.${this.state.bloom}`)} · ${this.state.finds.found.length} of ${this.content.pack.finds?.length ?? 0} finds`,
      skipTips: this.state.onboarding.skippable ? () => this.guide.skip() : null,
      restore: this.unlocker.gate ? () => void this.unlocker.restore() : null,
      openAccount: this.account ? () => this.account?.open() : null
    });
  }

  private openMap() {
    openMap({
      view: this.view, visited: this.state.visited, here: () => this.areaId, named: (t) => this.content.named(t),
      areas: () => this.content.pack.areas.map((a) => this.places.get(a.id)?.pack ?? a),
      go: (id, minutes) => { this.clock.pass(minutes); const s = this.places.get(id)!.pack.spawn; void this.travel(id, s.x, s.y); }
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
        if (e === 'tick') { this.world.setSky(this.clock.season, this.clock.weather === 'rainy'); this.world.setTint(this.clock.state.minutes); }
        if (e === 'late') { this.hud.setLate(true); this.view.say(`${this.state.names.puff}'s getting sleepy. Head home to bed.`); }
        if (e === 'doze' && !this.settings.relaxed) void this.endDay(true);
      }
      // The on-screen stick, when held, sets the way a short step at a time (play/stick.ts).
      const pull = this.stick.pull;
      if (pull && p.swingMs <= 0) { const to = stickTarget(p.feet, pull, T * 0.6, (a, b) => this.nav.clear(a, b)); if (to) { p.path = [to]; p.action = null; } p.dir = pull.dir; }
      // The tile under the feet drives onboarding; arriving uses the door or the thing tapped.
      const speed = ((this.state.fluff.tired ? WALK_SPEED_TIRED : WALK_SPEED) * T) / 1000;
      if (p.walk(dt, speed, () => this.guide.handle({ type: 'stood', ground: this.area.groundAt(p.x, p.y), area: this.areaId }))) {
        const a = p.action; p.action = null;
        if (this.area.doorAt(p.x, p.y)) this.actions.useDoor(p.x, p.y);
        else if (a && a.kind !== 'door') this.actions.act(a);
      }
      this.neighbours.update(this.clock.state.minutes, this.areaId, dt);
      this.homeLife.tick(this.areaId, this.tidiness);
      this.carry.tick();
      this.sweep.tick();
      this.dash.update(dt);
      if (p.swingMs > 0) { p.swingMs -= dt; if (p.swingMs <= 0) this.actions.finishSwing(); }
      if (p.hopMs > 0) { p.hopMs -= dt; if (p.hopMs <= 0 && p.pose === 'hop') p.pose = 'idle'; }
      this.autosaveMs += dt;
      if (this.autosaveMs > TUNING.autosaveSeconds * 1000) { this.autosaveMs = 0; void this.save(false); }
    }
    this.world.drawPuff({ x: p.fx, y: p.fy + FEET_TO_BASE, dir: p.dir, pose: p.pose, tool: this.selected }, dt);
    this.outfitLayer.draw(this.state.outfit, p.fx, p.fy + FEET_TO_BASE, this.world.puffHeight, p.dir);
    this.world.drawNeighbours(this.neighbours.visible(this.areaId).map((n) => {
      const d = this.content.neighbour(n.id)!;
      return { id: n.id, species: d.species, colours: d.colours, x: n.fx, y: n.fy + FEET_TO_BASE, dir: n.dir, pose: n.pose };
    }));
    this.grumbles.tick(dt, this.view.busy || this.fading);
    this.pet.tick(dt);
    this.world.follow(p.fx, p.fy - 8);
    this.world.update(dt);
    this.hudLive.tick();
    this.view.tick(dt);
  }

  private refreshHud() {
    const owned = TOOL_SLOTS.filter((t) => this.state.tools[t]);
    if (!owned.includes(this.selected)) this.selected = owned[0];
    this.hud.setTools(owned, this.selected, this.state.tools);
    this.hud.setSparkles(this.state.sparkles);
    this.guide.unstick();
    const step = this.state.onboarding.current;
    const up = bloomUp(this.state, this.places.restoredCount());
    if (up) { this.view.banner(`🌸 Town Bloom: ${this.content.line(`bloom.${up}`)}!`); this.view.feedback('fanfare', 'success'); }
    for (const o of newlyEarned(this.state, this.content.pack.outfits ?? [])) this.view.banner(`👒 New outfit: ${o.name}! (Pause → Outfits)`);
    const [letter] = lettersWaiting(this.content.pack.letters ?? [], this.clock.state.day, this.state.flags);
    const next = this.content.line(nudge(this.state, (k) => this.arrived(k), letter ? letter.hint ?? 'letter.hint' : null) ?? undefined);
    this.hud.setTracker(this.content.named(this.placing.active ? this.content.line('decor.tracker') ?? '' : step ? step.hint : this.jobs.tracker() ?? next ?? 'Explore {town} and tidy what you find.'));
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
}

function wait(ms: number) { return new Promise((r) => window.setTimeout(r, ms)); }
