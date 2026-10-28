import type { Area, TownPack } from '../data/area';
import type { Content } from '../data/content';
import { PUTAWAY_SPARKLES, SWING_MS, TUNING } from '../data/tuning';
import { nextFind } from '../bloom/bloom';
import { openCollection } from '../bloom/collection-sheet';
import type { Mining } from '../caves/mining';
import { openLetter } from '../letters/letter-sheet';
import { lettersWaiting } from '../letters/letters';
import { harvest, seedsIn, stageOf, type CropDef } from './crops';
import type { GrumbleLife } from '../grumbles/grumble-life';
import type { Conversations } from '../neighbours/conversations';
import type { Jobs } from '../requests/jobs';
import type { TownState } from '../state';
import { TOOL_NAMES, type Hud } from '../ui/hud';
import { offerClip } from '../ui/reveal';
import type { Settings, View } from '../ui/view';
import { T } from '../world/art/texture';
import { FEET, type NavGrid } from '../world/nav';
import { standTiles } from '../world/pathfind';
import type { World } from '../world/world';
import type { Clock } from './clock';
import { TOOL_FOR, type AreaMess, type MessType, type ToolId } from './mess';
import type { OnboardingGuide } from './onboarding-guide';
import { available, take } from './pickups';
import type { Puff } from './puff';
import type { Target } from './targets';

export interface ActionsHost {
  state: TownState; view: View; content: Content; clock: Clock; settings: Settings;
  puff: Puff; world: World; hud: Hud; jobs: Jobs; talk: Conversations; guide: OnboardingGuide; grumbles: GrumbleLife; mining: Mining;
  /** Whether something in the year-one schedule has arrived (the caves on day 10). */
  arrived(key: string): boolean;
  /** The area Puff is in. */
  here(): { id: string; area: Area; mess: AreaMess; nav: NavGrid };
  /** The tool in Puff's paws. */
  selected(): ToolId;
  /** Swap tools (auto-tool and the watering can do this). */
  select(tool: ToolId): void;
  travel(to: string, x: number, y: number): void;
  sleep(): void;
  /** The Keeper's plans: building on plots. */
  openBuild(): void;
  /** Pip's workbench (better tools) or Puff's kitchen (cooking). */
  openWorkbench(station: 'bench' | 'kitchen'): void;
  /** A placed decor piece: back into the bag. */
  pickUpDecor(x: number, y: number): void;
  openShop(shop: NonNullable<TownPack['shops']>[number]): void;
  refreshHud(): void;
  save(): void;
}

/** The clip offer waits for the restore fanfare and banners. */
const CLIP_OFFER_MS = 1400;

/** Mess that gets scrubbed, so it throws up suds. */
const WET: string[] = ['stain', 'grime', 'mud', 'fog'];

/** Puff using what's in reach: cleaning mess, furniture, soil, snacks, doors and neighbours. */
export class PuffActions {
  constructor(private host: ActionsHost) {}

  act(t: Target) {
    if (t.kind === 'neighbour') { this.host.talk.talkTo(t.id); return; }
    this.host.puff.face(t.x, t.y);
    if (t.kind === 'door') this.useDoor(t.x, t.y);
    else if (t.kind === 'mess') this.startSwing(t);
    else if (t.kind === 'grumble') this.startTidy(t);
    else if (t.kind === 'soil') this.useSoil(t.x, t.y);
    else if (t.kind === 'pickup') this.takePickup(t.id);
    else if (t.kind === 'prop') this.useProp(t);
  }

  pickupsHere() {
    const { state, clock, content } = this.host; const id = this.host.here().id;
    const letters = lettersWaiting(content.pack.letters ?? [], clock.state.day, state.flags).filter((l) => l.area === id).map((l) => ({ id: `letter_${l.id}`, x: l.x, y: l.y, item: l.item ?? 'bottle', letter: l.id }));
    return [...available(this.host.here().area.pack.pickups ?? [], state.picked, clock.state.day), ...letters];
  }

  cropsHere() {
    const id = this.host.here().id;
    const look = (crop: string) => this.cropDef(crop)?.look ?? 'round';
    return this.host.state.crops.filter((c) => c.area === id).map((c) => ({ x: c.x, y: c.y, stage: stageOf(c), watered: c.watered, look: look(c.crop) }));
  }

  useDoor(x: number, y: number) {
    const door = this.host.here().area.doorAt(x, y);
    if (!door) return;
    if (door.closedText && (!door.opensDay || this.host.clock.state.day < door.opensDay)) { this.host.view.say(door.closedText); this.stepOff(x, y); return; }
    this.host.travel(door.to, door.toX, door.toY);
  }

  private startSwing(t: Target) {
    const { state, view } = this.host;
    const { area, mess } = this.host.here();
    const type = mess.typeAt(t.x, t.y) as Exclude<MessType, 'none'>;
    if (type === 'none' as MessType) return;
    const need = TOOL_FOR[type];
    if (type === 'clutter' && !state.bag.canAdd(mess.item[t.y * area.w + t.x] ?? '')) { view.say('Bag\'s full! Put things away first.'); return; }
    if (this.toolReady(need.tool, need.minTier)) this.swingAt(t, need.tool);
  }

  /** A Grumble: tidied like mess, one go per swing; a helper just gets a hello. */
  private startTidy(t: Extract<Target, { kind: 'grumble' }>) {
    const tool = this.host.grumbles.toolFor(t.id);
    if (!tool) { this.host.grumbles.greet(t.id); return; }
    if (this.toolReady(tool, 1)) this.swingAt(t, tool);
  }

  /** Puff has the tool (in hand, or picked for them) and the Fluff to use it, which is spent. */
  private toolReady(tool: ToolId, minTier: number) {
    const { state, view, settings } = this.host;
    if (!state.tools[tool]) { view.say(`${state.names.puff} needs a ${TOOL_NAMES[tool].toLowerCase()} for that.`); return false; }
    if (state.tools[tool] < minTier) { view.say('That needs a Copper sponge.'); return false; }
    if (settings.autoTool) this.host.select(tool);
    else if (this.host.selected() !== tool) { view.say(`Try the ${TOOL_NAMES[tool].toLowerCase()}.`); return false; }
    if (tool !== 'hands' && !state.fluff.spend(false, settings.relaxed ? 0.5 : 1)) { view.say('Getting fluffy-sleepy... snack time?'); this.host.hud.pulseFluff(); return false; }
    return true;
  }

  private swingAt(t: Target, tool: ToolId) {
    const { puff, view } = this.host;
    puff.swing = t;
    puff.pose = 'swing';
    puff.swingMs = SWING_MS;
    view.feedback(tool === 'hands' ? 'tap' : 'scrub', 'light');
    this.host.refreshHud();
  }

  /** The swing lands: clean a hit off the mess, then go again if more taps are queued. */
  finishSwing() {
    const { puff } = this.host;
    const t = puff.swing; const charged = puff.charged;
    puff.swing = null; puff.charged = false;
    if (!t) { puff.pose = 'idle'; puff.repeat = 0; return; }
    puff.pose = 'idle';
    if (t.kind === 'prop' && t.action === 'mine') { this.host.mining.land(t); return; }
    if (t.kind === 'grumble') {
      if (this.host.grumbles.tidy(t.id) === 'more' && puff.repeat > 0) { puff.repeat -= 1; this.startTidy(t); } else puff.repeat = 0;
      return;
    }
    const near = charged && this.payCharge() ? this.alike(t.x, t.y) : [];
    const result = this.hitTile(t.x, t.y);
    if (!result) { puff.repeat = 0; return; }
    if (near.length) {
      for (const n of near) this.hitTile(n.x, n.y);
      this.host.view.feedback('sparkle', 'success');
      this.host.view.say(this.host.content.line('craft.charged') ?? '');
    }
    this.host.refreshHud();
    if (!result.cleared && puff.repeat > 0) { puff.repeat -= 1; this.startSwing(t); return; }
    puff.repeat = 0;
  }

  /**
   * A hold with a Copper (or better) tool: the next swing on this mess is charged, landing on up to
   * two matching spots beside it too (VISION §7). False if this tile can't be charged.
   */
  charge(x: number, y: number) {
    const { state, puff } = this.host;
    const type = this.host.here().mess.typeAt(x, y);
    const aim = puff.swing ?? puff.action;
    if (type === 'none' || type === 'clutter' || aim?.kind !== 'mess' || aim.x !== x || aim.y !== y) return false;
    puff.charged = (state.tools[TOOL_FOR[type].tool] ?? 0) >= 2;
    return puff.charged;
  }

  /** The charged swing's extra Fluff, if Puff has it (else it's an ordinary swing). */
  private payCharge() {
    const { fluff } = this.host.state;
    const extra = Math.round((fluff.costOf(true) - fluff.costOf(false)) * (this.host.settings.relaxed ? 0.5 : 1));
    if (fluff.value < extra) return false;
    fluff.value -= extra;
    return true;
  }

  /** Up to two spots next to this one with mess the same tool cleans, nearest first. */
  private alike(x: number, y: number) {
    const { mess } = this.host.here();
    const type = mess.typeAt(x, y);
    if (type === 'none' || type === 'clutter') return [];
    const tool = TOOL_FOR[type].tool;
    const around = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
    return around.filter((p) => { const t = mess.typeAt(p.x, p.y); return t !== 'none' && t !== 'clutter' && TOOL_FOR[t].tool === tool; }).slice(0, 2);
  }

  /** One tidy landing on a mess tile, with its colour, effects and rewards. Null if nothing happened. */
  private hitTile(x: number, y: number) {
    const { state, view, world } = this.host;
    const { id, area, mess } = this.host.here();
    const t = { x, y };
    const i = t.y * area.w + t.x;
    const type = mess.typeAt(t.x, t.y);
    const tool = TOOL_FOR[type as Exclude<MessType, 'none'>]?.tool ?? this.host.selected();
    const wasRestored = mess.restored;
    const result = mess.hit(t.x, t.y, tool, state.tools[tool] ?? 1);
    if (!result.ok) return null;
    world.syncMess(i);
    world.colourChanged(result.changed);
    for (const c of result.changed) world.syncMess(c);
    if (type === 'dust' || type === 'cobweb') world.dustPuff(t.x, t.y);
    if (WET.includes(type)) world.suds(t.x, t.y);
    if (result.cleared) {
      world.sparkleBurst(t.x, t.y, 8);
      view.feedback('sparkle', 'medium');
      state.lastClean = type;
      if (result.item) { state.bag.add(result.item); view.say(type === 'clutter' ? `Got the ${this.host.content.itemName(result.item).toLowerCase()}!` : ''); }
      if (!state.has('first_clean')) { state.flag('first_clean'); view.say('Look! Colour came back!'); }
      this.host.guide.handle({ type: 'cleared', mess: type, area: id });
    }
    if (!wasRestored && mess.restored) this.onRestored();
    if (result.cleared) { this.host.jobs.checkTidy(); this.luckyFind(id, x, y); }
    return result;
  }

  /** Every few cleans in a place, a little treasure turns up for Moss's collection. */
  private luckyFind(area: string, x: number, y: number) {
    const { state, view, content, world } = this.host;
    const found = nextFind(state.finds, area, content.pack.finds ?? [], TUNING.findEveryCleans);
    const def = found && content.pack.finds?.find((f) => f.id === found);
    if (!def) return;
    world.sparkleBurst(x, y, 12);
    view.feedback('chime', 'success');
    view.banner(`A lucky find: ${def.name}!`);
    view.say(content.line(`find.${def.id}`) ?? content.line('find.any') ?? '');
  }

  private useProp(t: Extract<Target, { kind: 'prop' }>) {
    const { state, view, content } = this.host;
    switch (t.action) {
      case 'putaway': {
        const items = (t.accepts ?? []).flatMap((id) => Array.from({ length: state.bag.count(id) }, () => id));
        if (!items.length) {
          const wanted = (t.accepts ?? []).map((id) => content.itemName(id).toLowerCase()).join(' and ');
          view.say(`A home for the ${wanted}.`); return;
        }
        for (const id of items) { state.bag.remove(id); state.sparkles += PUTAWAY_SPARKLES; this.host.guide.handle({ type: 'putaway', item: id }); }
        view.say(items.length === 1 ? 'Back where it lives!' : 'All put away!');
        view.feedback('thunk', 'light');
        this.host.world.sparkleBurst(t.x, t.y, 6);
        this.host.refreshHud();
        return;
      }
      case 'sleep':
        view.confirm(`Go to bed? ${this.host.state.names.puff} saves the day and wakes up refreshed.`, 'Sleep', () => this.host.sleep());
        return;
      case 'sign':
        view.showDialogue(t.text ?? 'A sign.');
        return;
      case 'board':
        this.host.jobs.openBoard();
        return;
      case 'build':
        this.host.openBuild();
        return;
      case 'craft':
        this.host.openWorkbench('bench');
        return;
      case 'cook':
        this.host.openWorkbench('kitchen');
        return;
      case 'decor': {
        const p = this.host.here().area.tapPropAt(t.x, t.y);
        if (p) view.confirm(`Pick up the ${content.itemName(state.decor.find((d) => d.x === p.x && d.y === p.y && d.area === this.host.here().id)?.item ?? '').toLowerCase()}?`, 'Pick up', () => this.host.pickUpDecor(p.x, p.y));
        return;
      }
      case 'mine':
        this.host.mining.start(t);
        return;
      case 'hatch': {
        const prop = this.host.here().area.tapPropAt(t.x, t.y);
        const to = prop?.to && content.pack.areas.find((a) => a.id === prop.to);
        if (!to || !this.host.arrived(to.id)) { view.say(content.line('cave.closed') ?? ''); return; }
        view.say(content.line('cave.enter') ?? '');
        this.host.travel(to.id, to.spawn.x, to.spawn.y);
        return;
      }
      case 'museum':
        openCollection(view, content, state);
        return;
      case 'shop': {
        const shop = content.pack.shops?.find((s) => s.id === t.shop);
        if (shop) this.host.openShop(shop);
        return;
      }
      case 'mailbox':
        view.showDialogue(this.host.clock.state.day > 1 ? `Today's letter is on the kitchen table. (${this.host.state.names.puff} already read it.)` : 'No post yet. Maybe tomorrow!');
        return;
    }
  }

  private cropDef(id: string) { return this.host.content.pack.crops?.find((c) => c.id === id); }

  private useSoil(x: number, y: number) {
    const { state, view, content } = this.host;
    const id = this.host.here().id;
    const crop = state.crops.find((c) => c.area === id && c.x === x && c.y === y);
    const def = crop && this.cropDef(crop.crop);
    if (crop && !def) return; // a crop this version doesn't know: left as it is
    if (crop && def) {
      if (stageOf(crop) === 2) {
        if (!state.bag.canAdd(crop.crop)) { view.say('Bag\'s full!'); return; }
        state.bag.add(crop.crop);
        if (harvest(crop, def) === 'picked') state.crops.splice(state.crops.indexOf(crop), 1);
        state.flag(`grown_${def.id}`);
        view.say(content.line(`crop.${def.id}.harvest`) ?? ''); view.feedback('coin', 'medium');
      } else if (!crop.watered) {
        if (!state.tools.can) { view.say('Seeds need water. A can would help.'); return; }
        crop.watered = true; this.host.select('can');
        view.feedback('wipe', 'light');
        this.host.guide.handle({ type: 'watered' });
      } else view.say('Growing. No rush.');
    } else {
      const kinds = seedsIn(state.bag, content.pack.crops ?? []);
      if (!kinds.length) view.say('Seeds would grow here.');
      else if (kinds.length === 1) this.plant(x, y, kinds[0]);
      else view.ask(content.line('crop.which') ?? '', [...kinds.map((k) => ({ label: content.itemName(k.seed), onClick: () => this.plant(x, y, k) })), { label: 'Not now', onClick: () => {} }]);
      return;
    }
    this.host.world.setCrops(this.cropsHere());
    this.host.refreshHud();
  }

  private plant(x: number, y: number, def: CropDef) {
    const { state, view } = this.host;
    if (!state.bag.remove(def.seed)) return;
    state.crops.push({ area: this.host.here().id, x, y, crop: def.id, days: 0, watered: false });
    view.say('Grow big. No rush.'); view.feedback('thunk', 'light');
    this.host.guide.handle({ type: 'planted' });
    this.host.world.setCrops(this.cropsHere());
    this.host.refreshHud();
  }

  private takePickup(id: string) {
    const { state, view, content, clock } = this.host;
    const p = this.pickupsHere().find((x) => x.id === id);
    if (!p) return;
    const letter = p.letter && content.pack.letters?.find((l) => l.id === p.letter);
    if (letter) { openLetter(view, content, state, letter, () => { this.host.world.setPickups(this.pickupsHere()); this.host.refreshHud(); this.host.save(); }); return; }
    if (!state.bag.add(p.item)) { view.say('Bag\'s full! Put things away first.'); return; }
    state.picked = take(state.picked, id, clock.state.day);
    const name = content.itemName(p.item).toLowerCase();
    const snack = !!content.pack.items[p.item]?.snack;
    view.say(`${/^[aeiou]/.test(name) ? 'An' : 'A'} ${name}! ${snack ? 'Snack for later.' : 'Into the bag it goes.'}`);
    view.feedback('coin', 'light');
    this.host.world.setPickups(this.pickupsHere());
    this.host.refreshHud();
  }

  /** After bumping a closed door, step back one tile so the next tap isn't swallowed. */
  private stepOff(x: number, y: number) {
    const { area, nav } = this.host.here();
    const puff = this.host.puff;
    for (const s of standTiles(area, { x, y })) {
      if (area.doorAt(s.x, s.y)) continue;
      const path = nav.findPathTo(puff.feet, { x: s.x * T + T / 2, y: s.y * T + FEET });
      if (path) { puff.path = path; puff.action = null; }
      return;
    }
  }

  private onRestored() {
    const { state, view, puff } = this.host;
    const { id, area } = this.host.here();
    const reward = area.pack.restoreReward ?? 0;
    state.sparkles += reward;
    view.feedback('fanfare', 'success');
    puff.hop();
    for (let n = 0; n < 6; n += 1) this.host.world.sparkleBurst(puff.x - 3 + n, puff.y - 2 + (n % 3), 10);
    view.banner(`${this.host.content.named(area.pack.name)} restored!${reward ? ` +${reward} ✨` : ''}`);
    this.host.guide.handle({ type: 'restored', area: id });
    if (area.pack.kind === 'home') state.flag(`restored_${id}`);
    // Every area restores once, so each gets its before-and-after clip offer: homes, the yard, the square.
    const first = !state.has('shared_prompt');
    state.flag('shared_prompt');
    window.setTimeout(() => offerClip(view, area, first, state.names), CLIP_OFFER_MS);
    this.host.save();
  }
}
