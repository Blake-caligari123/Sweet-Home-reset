import type { Area, TownPack } from '../data/area';
import type { Content } from '../data/content';
import { cropDays, PUTAWAY_SPARKLES, SWING_MS } from '../data/tuning';
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
  puff: Puff; world: World; hud: Hud; jobs: Jobs; talk: Conversations; guide: OnboardingGuide;
  /** The area Puff is in. */
  here(): { id: string; area: Area; mess: AreaMess; nav: NavGrid };
  /** The tool in Puff's paws. */
  selected(): ToolId;
  /** Swap tools (auto-tool and the watering can do this). */
  select(tool: ToolId): void;
  travel(to: string, x: number, y: number): void;
  sleep(): void;
  openShop(shop: NonNullable<TownPack['shops']>[number]): void;
  refreshHud(): void;
  save(): void;
}

/** Puff using what's in reach: cleaning mess, furniture, soil, snacks, doors and neighbours. */
export class PuffActions {
  /** The last day the reveal clip was offered by itself (at most once a day, A11.5). */
  private sharePromptDay = 0;

  constructor(private host: ActionsHost) {}

  act(t: Target) {
    if (t.kind === 'neighbour') { this.host.talk.talkTo(t.id); return; }
    this.host.puff.face(t.x, t.y);
    if (t.kind === 'door') this.useDoor(t.x, t.y);
    else if (t.kind === 'mess') this.startSwing(t);
    else if (t.kind === 'soil') this.useSoil(t.x, t.y);
    else if (t.kind === 'pickup') this.takePickup(t.id);
    else if (t.kind === 'prop') this.useProp(t);
  }

  pickupsHere() { const { state, clock } = this.host; return available(this.host.here().area.pack.pickups ?? [], state.picked, clock.state.day); }

  cropsHere() {
    const id = this.host.here().id;
    return this.host.state.crops.filter((c) => c.area === id).map((c) => ({ x: c.x, y: c.y, stage: c.days >= cropDays(c.crop) ? 2 : c.days > 0 ? 1 : 0, watered: c.watered }));
  }

  useDoor(x: number, y: number) {
    const door = this.host.here().area.doorAt(x, y);
    if (!door) return;
    if (door.closedText && (!door.opensDay || this.host.clock.state.day < door.opensDay)) { this.host.view.say(door.closedText); this.stepOff(x, y); return; }
    this.host.travel(door.to, door.toX, door.toY);
  }

  private startSwing(t: Target) {
    const { state, view, settings, puff } = this.host;
    const { area, mess } = this.host.here();
    const type = mess.typeAt(t.x, t.y) as Exclude<MessType, 'none'>;
    if (type === 'none' as MessType) return;
    const need = TOOL_FOR[type];
    if (!state.tools[need.tool]) { view.say(`Puff needs a ${TOOL_NAMES[need.tool].toLowerCase()} for that.`); return; }
    if (state.tools[need.tool] < need.minTier) { view.say('That needs a Copper sponge.'); return; }
    if (settings.autoTool) this.host.select(need.tool);
    else if (this.host.selected() !== need.tool) { view.say(`Try the ${TOOL_NAMES[need.tool].toLowerCase()}.`); return; }
    if (type === 'clutter' && !state.bag.canAdd(mess.item[t.y * area.w + t.x] ?? '')) { view.say('Bag\'s full! Put things away first.'); return; }
    if (need.tool !== 'hands' && !state.fluff.spend(false, settings.relaxed ? 0.5 : 1)) { view.say('Getting fluffy-sleepy... snack time?'); this.host.hud.pulseFluff(); return; }
    puff.swing = t;
    puff.pose = 'swing';
    puff.swingMs = SWING_MS;
    view.feedback(need.tool === 'hands' ? 'tap' : 'scrub', 'light');
    this.host.refreshHud();
  }

  /** The swing lands: clean a hit off the mess, then go again if more taps are queued. */
  finishSwing() {
    const { state, view, puff, world } = this.host;
    const { id, area, mess } = this.host.here();
    const t = puff.swing;
    puff.swing = null;
    if (!t) { puff.pose = 'idle'; puff.repeat = 0; return; }
    const i = t.y * area.w + t.x;
    const type = mess.typeAt(t.x, t.y);
    const tool = TOOL_FOR[type as Exclude<MessType, 'none'>]?.tool ?? this.host.selected();
    const wasRestored = mess.restored;
    const result = mess.hit(t.x, t.y, tool, state.tools[tool] ?? 1);
    puff.pose = 'idle';
    if (!result.ok) { puff.repeat = 0; return; }
    world.syncMess(i);
    world.colourChanged(result.changed);
    for (const c of result.changed) world.syncMess(c);
    if (type === 'dust' || type === 'cobweb') world.dustPuff(t.x, t.y);
    if (result.cleared) {
      world.sparkleBurst(t.x, t.y, 8);
      view.feedback('sparkle', 'medium');
      state.lastClean = type;
      if (result.item) { state.bag.add(result.item); view.say(type === 'clutter' ? `Got the ${this.host.content.itemName(result.item).toLowerCase()}!` : ''); }
      if (!state.has('first_clean')) { state.flag('first_clean'); view.say('Look! Colour came back!'); }
      this.host.guide.handle({ type: 'cleared', mess: type, area: id });
    }
    if (!wasRestored && mess.restored) this.onRestored();
    if (result.cleared) this.host.jobs.checkTidy();
    this.host.refreshHud();
    if (!result.cleared && puff.repeat > 0) { puff.repeat -= 1; this.startSwing(t); return; }
    puff.repeat = 0;
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
        view.confirm('Go to bed? Puff saves the day and wakes up refreshed.', 'Sleep', () => this.host.sleep());
        return;
      case 'sign':
        view.showDialogue(t.text ?? 'A sign.');
        return;
      case 'board':
        this.host.jobs.openBoard();
        return;
      case 'shop': {
        const shop = content.pack.shops?.find((s) => s.id === t.shop);
        if (shop) this.host.openShop(shop);
        return;
      }
      case 'mailbox':
        view.showDialogue(this.host.clock.state.day > 1 ? 'Today\'s letter is on the kitchen table. (Puff already read it.)' : 'No post yet. Maybe tomorrow!');
        return;
    }
  }

  private useSoil(x: number, y: number) {
    const { state, view, settings } = this.host;
    const id = this.host.here().id;
    const crop = state.crops.find((c) => c.area === id && c.x === x && c.y === y);
    if (crop) {
      if (crop.days >= cropDays(crop.crop)) {
        if (!state.bag.add(crop.crop)) { view.say('Bag\'s full!'); return; }
        state.crops.splice(state.crops.indexOf(crop), 1);
        view.say('A radish! Crunchy.'); view.feedback('coin', 'medium');
      } else if (!crop.watered) {
        if (!state.tools.can) { view.say('Seeds need water. A can would help.'); return; }
        if (!state.fluff.spend(false, settings.relaxed ? 0.5 : 1)) { view.say('Too sleepy to water...'); return; }
        crop.watered = true; this.host.select('can');
        view.feedback('wipe', 'light');
        this.host.guide.handle({ type: 'watered' });
      } else view.say('Growing. No rush.');
    } else if (state.bag.count('radish_seeds') > 0) {
      state.bag.remove('radish_seeds');
      state.crops.push({ area: id, x, y, crop: 'radish', days: 0, watered: false });
      view.say('Grow big. No rush.'); view.feedback('thunk', 'light');
      this.host.guide.handle({ type: 'planted' });
    } else view.say('Seeds would grow here.');
    this.host.world.setCrops(this.cropsHere());
    this.host.refreshHud();
  }

  private takePickup(id: string) {
    const { state, view, content, clock } = this.host;
    const p = this.pickupsHere().find((x) => x.id === id);
    if (!p) return;
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
    const { state, view, puff, clock } = this.host;
    const { id, area } = this.host.here();
    const reward = area.pack.restoreReward ?? 0;
    state.sparkles += reward;
    view.feedback('fanfare', 'success');
    puff.hop();
    for (let n = 0; n < 6; n += 1) this.host.world.sparkleBurst(puff.x - 3 + n, puff.y - 2 + (n % 3), 10);
    view.banner(`${area.pack.name} restored!${reward ? ` +${reward} ✨` : ''}`);
    this.host.guide.handle({ type: 'restored', area: id });
    if (area.pack.kind === 'home') {
      state.flag(`restored_${id}`);
      if (this.sharePromptDay !== clock.state.day) {
        this.sharePromptDay = clock.state.day;
        const first = !state.has('shared_prompt');
        state.flag('shared_prompt');
        window.setTimeout(() => offerClip(view, area, first), 1400);
      }
    }
    this.host.save();
  }
}
