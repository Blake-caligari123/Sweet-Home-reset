import type { Area } from '../data/area';
import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import type { Clock } from '../play/clock';
import type { PlayEvent } from '../play/events';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { cleared, fade, NO_CHAIN } from './chain';
import { rollFind } from './finds';
import { goalLabel, goalsFor, progressGoals, type GoalState } from './goals';
import { GOLDEN, goldenPickup, goldenSpot } from './golden';
import { addXp, levelReward, xpToNext } from './level';
import { crossed } from './milestones';
import type { RewardHud } from './reward-hud';

/** What the rewards keep in the save. */
export interface RewardState {
  /** Finds collected, by item, for the Finds book. */
  finds: Record<string, number>;
  /** Cleans since the last find (for findPity). */
  sinceFind: number;
  /** Puff's sparkle level and the XP toward the next one. */
  level: number;
  xp: number;
  /** Today's goals and how far along each is. */
  goals: GoalState;
  /** Days with at least one goal done. Only ever goes up. */
  cosyDays: number;
}

export const newRewardState = (): RewardState => ({ finds: {}, sinceFind: 0, level: 1, xp: 0, goals: { day: 0, goals: [], progress: [] }, cosyDays: 0 });

export interface RewardsHost {
  state: TownState;
  view: View;
  content: Content;
  clock: Clock;
  areas: Map<string, Area>;
  hud: RewardHud;
  /** The area Puff is in: its id and name, how tidy it is, and whether there's a home bar to show. */
  here(): { id: string; name: string; progress: number; bar: boolean };
  /** A tile's centre on screen. */
  tileToScreen(x: number, y: number): { x: number; y: number };
  hopPuff(): void;
  /** A burst of sparkles on a tile. */
  sparkle(x: number, y: number, count: number): void;
  refreshHud(): void;
}

/** Puff's title at a level (the last one carries on past the list). */
export function titleOf(content: Content, level: number) {
  for (let l = level; l > 0; l -= 1) { const t = content.line(`title.${l}`); if (t) return t; }
  return 'Dust Bunny';
}

/** How often golden dust glints. */
const TWINKLE_MS = 1200;

/** The rewards overhaul (claude/REWARDS-PLAN.md): turns what Puff does into Sparkles, pips and cheer. */
export class Rewards {
  private chain = NO_CHAIN;
  /** The area and progress last seen, so a pip rings as it's passed. */
  private seen = { area: '', progress: 0 };
  private twinkleMs = 0;

  constructor(private host: RewardsHost) {}

  handle(e: PlayEvent) {
    const xp = TUNING.rewards.xp;
    if (e.type === 'cleared') { this.cleaned(e.x, e.y); this.maybeFind(e.area, e.x, e.y); this.gainXp(xp.clean); }
    if (e.type === 'took' && e.item === GOLDEN) this.caughtGolden(e.x, e.y);
    if (e.type === 'found') this.gainXp(xp.find);
    if (e.type === 'jobDone') this.gainXp(xp.job);
    if (e.type === 'restored') this.gainXp(xp.restore);
    this.countGoals(e);
  }

  /** Today's goals, set up fresh each day (from goalsFromDay). */
  goalsToday(): GoalState | null {
    const r = this.host.state.rewards;
    const day = this.host.clock.state.day;
    if (day < TUNING.rewards.goalsFromDay) return null;
    if (r.goals.day !== day) { const goals = goalsFor(day); r.goals = { day, goals, progress: goals.map(() => 0) }; }
    return r.goals;
  }

  private countGoals(e: PlayEvent) {
    const today = this.goalsToday();
    if (!today) return;
    const { state, view } = this.host;
    const r = state.rewards;
    const wasAny = today.progress.some((p, i) => p >= today.goals[i].target);
    const { state: next, finished } = progressGoals(today, e);
    r.goals = next;
    if (!finished.length) return;
    const R = TUNING.rewards;
    if (!wasAny) r.cosyDays += 1;
    for (const i of finished) { state.sparkles += R.goalSparkles; view.banner(`Goal done: ${goalLabel(next.goals[i])}! +${R.goalSparkles} ✨`); }
    view.feedback('chime', 'light');
    if (next.progress.every((p, i) => p >= next.goals[i].target)) {
      state.sparkles += R.allGoalsBonus;
      view.banner(`All of today's goals! +${R.allGoalsBonus} ✨ · Cosy Days: ${r.cosyDays}`);
      view.feedback('fanfare', 'success');
      this.host.hopPuff();
    }
    this.host.refreshHud();
  }

  private gainXp(gain: number) {
    const { state, view, content } = this.host;
    const r = state.rewards;
    const next = addXp(r, gain);
    r.xp = next.xp; r.level = next.level;
    for (const level of next.ups) {
      const prize = levelReward(level);
      state.sparkles += prize.sparkles;
      if (prize.fluffMax) { state.fluff.max += prize.fluffMax; state.fluff.eat(prize.fluffMax); }
      view.feedback('fanfare', 'success');
      this.host.hopPuff();
      view.banner(`Level ${level}: ${titleOf(content, level)}! +${prize.sparkles} ✨${prize.fluffMax ? ` · +${prize.fluffMax} max Fluff` : ''}`);
    }
  }

  /** The level and goals chips. */
  showStatus() {
    const r = this.host.state.rewards;
    const today = this.goalsToday();
    this.host.hud.setStatus({
      level: r.level, xp: r.xp, need: xpToNext(r.level),
      goals: today ? { done: today.progress.filter((p, i) => p >= today.goals[i].target).length, of: today.goals.length } : null
    });
  }

  /** The next unfinished goal, for the tracker when there are no tips or jobs. */
  trackerLine() {
    const today = this.goalsToday();
    const i = today?.goals.findIndex((g, k) => today.progress[k] < g.target) ?? -1;
    return today && i >= 0 ? `☆ ${goalLabel(today.goals[i])} (${today.progress[i]}/${today.goals[i].target})` : null;
  }

  /** Where today's golden dust waits. */
  goldenToday() { const { content, clock, areas } = this.host; return goldenSpot(clock.state.day, content.pack.areas, areas); }

  /** Today's golden dust, if it waits in this area. */
  goldenHere(area: string) { return goldenPickup(this.goldenToday(), area, this.host.clock.state.day); }

  /** For the morning letter: the name of the place today's golden dust waits. */
  goldenHint() { const spot = this.goldenToday(); return spot ? this.host.areas.get(spot.area)!.pack.name : null; }

  /** Each frame while play isn't held: the chain fades unless Puff is busy, and the home bar follows the area. */
  tick(dt: number, puffBusy: boolean) {
    this.chain = fade(this.chain, dt, puffBusy);
    this.host.hud.setChain(this.chain.count);
    const here = this.host.here();
    if (here.id === this.seen.area) for (const pip of crossed(this.seen.progress, here.progress)) this.pip(here.name, pip);
    this.seen = { area: here.id, progress: here.progress };
    this.host.hud.setProgress(here.name, here.progress, here.bar);
    this.twinkle(here.id, dt);
  }

  /** Golden dust glints now and then, so it can be spotted across the room. */
  private twinkle(area: string, dt: number) {
    this.twinkleMs -= dt;
    if (this.twinkleMs > 0) return;
    this.twinkleMs = TWINKLE_MS;
    const { state, clock } = this.host;
    const g = this.goldenHere(area)[0];
    if (g && !(state.picked.day === clock.state.day && state.picked.ids.includes(g.id))) this.host.sparkle(g.x, g.y, 4);
  }

  private cleaned(x: number, y: number) {
    const { state, view, hud } = this.host;
    const r = cleared(this.chain);
    this.chain = r.chain;
    state.sparkles += r.sparkles;
    const at = this.host.tileToScreen(x, y);
    hud.popup(at.x, at.y, `+${r.sparkles} ✨`);
    hud.fly(at.x, at.y, r.sparkles);
    if (r.chain.count > 1) view.chime(Math.min(1, r.chain.count / 12));
    if (r.chain.count % TUNING.rewards.chainHopEvery === 0) this.host.hopPuff();
    this.host.refreshHud();
  }

  private maybeFind(area: string, x: number, y: number) {
    const r = this.host.state.rewards;
    const item = rollFind(this.host.content.pack.finds ?? [], { day: this.host.clock.state.day, area, x, y, sinceFind: r.sinceFind });
    if (item) this.found(item, x, y); else r.sinceFind += 1;
  }

  /** A find: into the bag (if there's room) and the Finds book. */
  private found(item: string, x: number, y: number) {
    const { state, view, content } = this.host;
    const r = state.rewards;
    const first = !r.finds[item];
    r.finds[item] = (r.finds[item] ?? 0) + 1;
    r.sinceFind = 0;
    const roomy = state.bag.add(item);
    this.host.sparkle(x, y, 10);
    view.feedback(first ? 'fanfare' : 'coin', 'medium');
    view.banner(`${first ? 'New find' : 'A find'}: ${content.itemName(item)}!${first ? ' Into the Finds book.' : ''}${roomy ? '' : ' (Bag\'s full.)'}`);
    this.handle({ type: 'found', item });
    this.host.refreshHud();
  }

  private caughtGolden(x: number, y: number) {
    const { state, view, hud } = this.host;
    const sparkles = TUNING.rewards.goldenSparkles;
    state.sparkles += sparkles;
    const at = this.host.tileToScreen(x, y);
    hud.popup(at.x, at.y, `+${sparkles} ✨`);
    hud.fly(at.x, at.y, sparkles);
    this.host.hopPuff();
    view.say('Golden dust! It tickles!');
    const item = rollFind(this.host.content.pack.finds ?? [], { day: this.host.clock.state.day, area: 'golden', x, y, sinceFind: TUNING.rewards.findPity });
    window.setTimeout(() => { if (item) this.found(item, x, y); }, 900);
  }

  private pip(name: string, at: number) {
    const { state, view } = this.host;
    const sparkles = TUNING.rewards.milestoneSparkles;
    state.sparkles += sparkles;
    view.feedback('chime', 'light');
    view.banner(`${name}: ${at === 0.5 ? 'halfway sparkly' : `${Math.round(at * 100)}% tidy`}! +${sparkles} ✨`);
    this.host.refreshHud();
  }
}
