import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import { ownedAnimals } from '../farm/animals';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { TownAreas } from '../world/town-areas';
import { goalDone, goalText, hearGoal, kindOf, pickGoals, SAME_AS, type GoalFacts } from './goals';

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
      day: this.h.day(), shelf: !!state.friends.moss?.met, tools: Object.keys(state.tools).filter((t) => state.tools[t] > 0),
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

  hear(e: OnboardEvent) {
    const { state, view, content } = this.h;
    const r = hearGoal(this.goals, e);
    if (r.goals.every((g, i) => g.have === state.daily.goals[i].have)) return;
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

  private text(g: (typeof this.goals)[number]) { return goalText(g, (id) => this.h.content.named(this.h.places.get(id)?.pack.name ?? id)); }

  /** The morning's line: today's three. */
  morning(): string[] { return !this.goals.length ? [] : [`🎯 Today's goals: ${this.goals.map((g) => this.text(g)).join(' · ')}`]; }

  /** For the journal: each goal ticked or with its count so far. */
  lines(): string[] {
    return this.goals.map((g) => goalDone(g) ? `✅ ${this.text(g)}` : `⬜ ${this.text(g)}${kindOf(g).count > 1 ? ` (${g.have}/${kindOf(g).count})` : ''}`);
  }
}
