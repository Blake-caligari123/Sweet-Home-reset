import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import { ownedAnimals } from '../farm/animals';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { TownAreas } from '../world/town-areas';
import { GAMES } from '../minigames/minigame-buttons';
import { goalDone, goalText, hearGoal, kindOf, pickGoals, pickWeekly, SAME_AS, weekOf, type Goal, type GoalFacts } from './goals';

export interface DailyHost { state: TownState; view: View; content: Content; places: TownAreas; day(): number; refreshHud(): void; save(): void; hop(): void }

/**
 * Today's little goals in play (daily/goals.ts): three picked each morning, a cheer and Sparkles
 * as each is done, a bigger one for all three. Shown in the morning news and the journal.
 */
export class DailyGoalsLife {
  constructor(private h: DailyHost) {}

  facts(): GoalFacts {
    const { state, content, places } = this.h;
    const named = (id: string) => content.pack.areas.some((a) => a.id === id);
    return {
      day: this.h.day(), games: GAMES.some((g) => state.friends[g.who]?.met), compost: state.bag.count('compost') > 0, tools: Object.keys(state.tools).filter((t) => state.tools[t] > 0),
      fish: state.bag.count('fishing_rod') > 0 || state.fishCaught > 0, crops: state.crops.length > 0,
      animals: ownedAnimals(content.pack.animals ?? [], state.flags).length > 0, grumbles: state.grumbles.list.length > 0,
      places: state.visited.filter((a) => a !== 'burrow' && a !== 'yard' && named(a)),
      tidyPlaces: state.visited.filter((a) => named(a) && places.get(a) && places.mess(a).remaining >= 10)
    };
  }

  /** Today's goals, picked fresh on a new day. */
  get goals() {
    const { state } = this.h;
    const day = this.h.day();
    if (state.daily.day !== day) state.daily = { day, goals: pickGoals(this.facts(), state.happening.day === day && state.happening.id ? [SAME_AS[state.happening.id]] : []), bonus: false };
    return state.daily.goals;
  }

  /** This week's bigger goals, picked fresh each week. */
  get weekly() {
    const { state } = this.h;
    const week = weekOf(this.h.day());
    // The first week's goals start on day 3, once the first days' guide is done.
    if (state.weekly.day !== week || (!state.weekly.goals.length && this.h.day() >= 3)) state.weekly = { day: week, goals: pickWeekly(this.facts()), bonus: false };
    return state.weekly.goals;
  }

  hear(e: OnboardEvent) {
    this.hearDaily(e);
    this.hearWeekly(e);
  }

  private hearWeekly(e: OnboardEvent) {
    const { state, view, content } = this.h;
    const r = hearGoal(this.weekly, e);
    if (!moved(r.goals, state.weekly.goals)) return;
    state.weekly.goals = r.goals;
    for (const g of r.done) {
      state.sparkles += TUNING.weeklyGoalSparkles;
      view.feedback('fanfare', 'success');
      view.banner(`📅 ${this.text(g)}: done! +${TUNING.weeklyGoalSparkles} ✨`);
    }
    if (r.done.length && !state.weekly.bonus && r.goals.every(goalDone)) {
      state.weekly.bonus = true;
      const gifts = TUNING.weeklyGifts;
      const gift = gifts[(state.weekly.day - 1) % gifts.length];
      state.bag.add(gift);
      view.feedback('fanfare', 'success');
      view.banner(`🎁 The whole week's goals! A gift: a ${content.itemName(gift).toLowerCase()} for your home.`);
      this.h.hop();
    }
    if (r.done.length) { this.h.refreshHud(); this.h.save(); }
  }

  private hearDaily(e: OnboardEvent) {
    const { state, view, content } = this.h;
    const r = hearGoal(this.goals, e);
    if (!moved(r.goals, state.daily.goals)) return;
    state.daily.goals = r.goals;
    for (const g of r.done) {
      state.sparkles += TUNING.dailyGoalSparkles;
      view.feedback('chime', 'success');
      view.banner(`🎯 ${this.text(g)}: done! +${TUNING.dailyGoalSparkles} ✨`);
    }
    if (r.done.length && !state.daily.bonus && r.goals.every(goalDone)) {
      state.daily.bonus = true;
      state.sparkles += TUNING.dailyBonusSparkles;
      view.feedback('fanfare', 'success');
      view.banner(`🌟 All of today's goals! ${content.named('{puff}')} beams. +${TUNING.dailyBonusSparkles} ✨`);
      this.h.hop();
    }
    if (r.done.length) { this.h.refreshHud(); this.h.save(); }
  }

  private text(g: Goal) { return goalText(g, (id) => this.h.content.named(this.h.places.get(id)?.pack.name ?? id)); }

  /** The morning's lines: the week's three on its first morning (or the first day there are any), then today's three. */
  morning(): string[] {
    const week = this.weekly.length && ((this.h.day() - 1) % 7 === 0 || this.h.day() === 3) ? [`📅 This week: ${this.weekly.map((g) => this.text(g).replace(/ this week$/, '')).join(' · ')}`] : [];
    return [...week, ...(this.goals.length ? [`🎯 Today's goals: ${this.goals.map((g) => this.text(g)).join(' · ')}`] : [])];
  }

  /** Today's goals done, of how many (the HUD chip). */
  progress(): [number, number] { return [this.goals.filter(goalDone).length, this.goals.length]; }

  /** For the journal: each goal ticked or with its count so far. */
  lines(): string[] { return this.goals.map((g) => this.line(g)); }
  weekLines(): string[] { return this.weekly.map((g) => this.line(g).replace(' this week', '')); }

  private line(g: Goal) { return goalDone(g) ? `✅ ${this.text(g)}` : `⬜ ${this.text(g)}${kindOf(g).count > 1 ? ` (${g.have}/${kindOf(g).count})` : ''}`; }
}

/** Did a moment move any goal on? */
const moved = (next: Goal[], was: Goal[]) => next.some((g, i) => g.have !== was[i].have);
