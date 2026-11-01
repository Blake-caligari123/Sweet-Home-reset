import { cafeButtons, cafeWants } from './cafe/cafe-buttons';
import type { Content } from './data/content';
import { CardHunt } from './craft/cards';
import { Helpers } from './life/helpers';
import type { Conversations } from './neighbours/conversations';
import { tradeButtons } from './neighbours/tokens';
import type { TownLife } from './life/town-life';
import { openNeeds } from './needs/needs-sheet';
import { TownNeeds } from './needs/town-needs';
import { TidyChain } from './play/chain';
import { TidyMeterLife } from './play/tidy-meter-life';
import { spotlessToday } from './play/tidy-meter';
import { emptyTally, recapLine, tallyHear } from './play/day-recap';
import { milestoneFlag, milestoneReached, milestoneSparkles, totalTidied } from './play/milestones';
import { collectionSets, newlyComplete, setFlag } from './bloom/sets';
import { completionParts, completionPct, rankFor } from './bloom/completion';
import { TUNING } from './data/tuning';
import { QuestLog } from './quests/quest-log';
import { StoryPath } from './story/story-path';
import { journalPage } from './journal/journal';
import { openJournal } from './journal/journal-sheet';
import type { Jobs } from './requests/jobs';
import type { OnboardingGuide } from './play/onboarding-guide';
import type { Puff } from './play/puff';
import { PuffMoods } from './skills/puff-mood';
import { SkillBook } from './skills/skill-book';
import { farmMorning, ownedAnimals, tend } from './farm/animals';
import { stallNight } from './stall/stall';
import { openStall } from './stall/stall-sheet';
import { openSkills } from './skills/skills-sheet';
import type { TownState } from './state';
import type { Hud } from './ui/hud';
import type { View } from './ui/view';
import type { TownAreas } from './world/town-areas';
import type { World } from './world/world';

export interface SystemsHost {
  state: TownState; view: View; content: Content; hud: Hud; world: World; puff: Puff; places: TownAreas; life: TownLife; guide: OnboardingGuide; talk: Conversations; jobs: Jobs;
  day(): number; arrived(key: string): boolean; refreshHud(): void; save(): void;
  playScene(id: string): void;
  /** The place Puff is in. */
  areaId(): string;
}

/**
 * The Phase 6 systems that listen to play and speak in the morning: skills, Puff's mood, tidy
 * chains, recipe cards, quests, town needs, neighbours helping and Puff's market stall. They hear what Puff does through the
 * guide; game.ts only asks them for the morning's news, neighbours' trades and opens their sheets.
 */
export class TownSystems {
  readonly moods: PuffMoods;
  private needs: TownNeeds;
  private helpers: Helpers;
  private quests: QuestLog;
  /** Today's doings, for the bedtime recap (play/day-recap.ts). */
  private today = emptyTally();
  private sparklesAtDawn = 0;
  /** The Keeper's Story: today's 📖 step (story/story-path.ts). */
  readonly story: StoryPath;
  /** How tidy the current place is (play/tidy-meter.ts). */
  readonly tidy: TidyMeterLife;

  constructor(private host: SystemsHost) {
    const { state, view, content, places, life } = host;
    const arrived = (k: string) => host.arrived(k);
    this.moods = new PuffMoods({ state, view, hud: host.hud, day: () => host.day(), burrowTidy: () => places.mess('burrow').progress });
    this.needs = new TownNeeds({ state, content, life, arrived });
    this.helpers = new Helpers({ state, content, places, arrived });
    const skills = new SkillBook({ state, view, day: () => host.day() });
    const chain = new TidyChain({ state, view, world: host.world, feet: () => host.puff.feet, refreshHud: () => host.refreshHud() });
    const cards = new CardHunt({ state, content, view });
    this.quests = new QuestLog({ state, content, view, talk: host.talk, day: () => host.day(), refreshHud: () => host.refreshHud(), save: () => host.save() });
    this.story = new StoryPath({ state, content, view, talk: host.talk, day: () => host.day(), refreshHud: () => host.refreshHud(), save: () => host.save(), playScene: (id) => host.playScene(id) });
    this.tidy = new TidyMeterLife({
      state, view, hud: host.hud, world: host.world, content, day: () => host.day(), feet: () => host.puff.feet, refreshHud: () => host.refreshHud(),
      restored: () => content.pack.areas.filter((a) => state.has(`restored_${a.id}`) && ((a.mess?.length ?? 0) > 0 || a.restoreReward)).map((a) => a.id), hop: () => host.puff.hop(), left: (id) => places.mess(id).remaining,
      area: () => { const id = host.areaId(); return { id, name: places.get(id)?.pack.name ?? id, mess: places.mess(id) }; }
    });
    // Milestones wait a moment, so the clean is counted first (bloom/finds).
    this.sparklesAtDawn = state.sparkles;
    host.guide.listen((e) => { this.today = tallyHear(this.today, e); this.tidy.hear(e); if (e.type === 'found' || e.type === 'spotted' || e.type === 'caught' || e.type === 'picked') this.setsDone(); if (e.type === 'cleared') queueMicrotask(() => this.milestone()); skills.hear(e); this.moods.hear(e); chain.hear(e); cards.hear(e); this.quests.hear(e); host.jobs.hear(e); this.story.hear(e); });
  }

  /** The journal's tally: places spotless today, and each Collection set. */
  private tally() {
    const { state, content } = this.host;
    const icons = { finds: '🔍', critters: '🐞', fish: '🐟', harvest: '🥕' } as const;
    const spotless = spotlessToday(state, this.host.day());
    return [...(spotless ? [`✨ ${spotless} spotless today`] : []), ...collectionSets(state, content.pack).map((s) => `${icons[s.id]} ${s.have}/${s.total}`)].join(' · ');
  }

  /** A tidying milestone (50, 100, 250… spots in all): a cheer and Sparkles, once each. */
  private milestone() {
    const { state, view } = this.host;
    const m = milestoneReached(totalTidied(state), (f) => state.has(f));
    if (!m) return;
    for (const lower of TUNING.tidyMilestones.filter((x) => x <= m)) state.flag(milestoneFlag(lower)); // passed together, cheered once
    const gift = milestoneSparkles(m);
    state.sparkles += gift;
    view.feedback('fanfare', 'success');
    view.banner(`🧹 ${m.toLocaleString('en-AU')} spots tidied! +${gift} ✨`);
    this.host.refreshHud();
  }

  /** At bedtime: the day summed up, or null after a quiet one. */
  recap() { return recapLine(this.today, spotlessToday(this.host.state, this.host.day()), Math.max(0, this.host.state.sparkles - this.sparklesAtDawn)); }

  /** A new morning: a fresh tally. */
  newDay() { this.today = emptyTally(); this.sparklesAtDawn = this.host.state.sparkles; }

  /** The whole town at 100%: the biggest cheer there is, once. */
  checkComplete() {
    const { state, content, view } = this.host;
    const pct = completionPct(completionParts(state, content.pack));
    // A new Keeper rank (bloom/completion.ts): a cheer each time the title grows, once each.
    const rank = rankFor(pct);
    if (rank.index > 0 && !state.has(`rank_${rank.index}`)) {
      for (let i = 1; i <= rank.index; i += 1) state.flag(`rank_${i}`);
      view.feedback('fanfare', 'success');
      view.banner(`🎖 ${state.names.puff} is now a ${content.named(rank.title)}!`);
      this.host.save();
    }
    if (state.has('town_complete') || pct < 100) return;
    state.flag('town_complete');
    state.sparkles += TUNING.townCompleteSparkles;
    view.feedback('fanfare', 'success');
    view.banner(`🏆 ${content.named('{town}')} is 100% complete! You did everything. +${TUNING.townCompleteSparkles} ✨`);
    this.host.save();
  }

  /** A Collection set just finished (every treasure, critter or fish): a big cheer, once. */
  private setsDone() {
    const { state, content, view } = this.host;
    for (const s of newlyComplete(collectionSets(state, content.pack), (f) => state.has(f))) {
      state.flag(setFlag(s.id));
      state.sparkles += TUNING.setCompleteSparkles;
      view.feedback('fanfare', 'success');
      view.banner(`📖 ${s.name} complete! All ${s.total}! +${TUNING.setCompleteSparkles} ✨`);
      this.host.puff.hop();
      this.host.refreshHud(); this.host.save();
    }
  }

  /** After the night: today's story step, town needs met, who helped tidy, what the stall sold, and new farm animals. */
  morningNews() { return [...this.story.morning(), ...this.needs.morning(), ...this.helpers.morning(), ...this.stallNews(), ...this.farmNews()]; }

  private farmNews() {
    const { state, content } = this.host;
    return farmMorning(state.farm, ownedAnimals(content.pack.animals ?? [], state.flags), this.host.day()).map((a) => `🐾 The ${a.name.toLowerCase()} has moved into the yard!`);
  }

  /** Tapping a farm animal: what it gives, if ready, then a pat and some feed. */
  tendAnimal(id: string) {
    const { state, content, view } = this.host;
    const a = content.pack.animals?.find((x) => x.id === id);
    if (!a) return;
    const r = tend(state, a, this.host.day());
    const what = content.itemName(a.gives).toLowerCase();
    const key = r.got ? `farm.got.${a.id}` : r.full ? 'farm.full' : r.tended ? 'farm.fed' : 'farm.again';
    view.say((content.line(key) ?? '').replace('{animal}', a.name.toLowerCase()).replace('{item}', what));
    view.feedback(r.got ? 'coin' : 'pop', 'light');
    if (r.tended) this.host.guide.handle({ type: 'tended', animal: a.id });
    this.host.refreshHud(); this.host.save();
  }

  private stallNews() {
    const { state, content } = this.host;
    const r = stallNight(state.stall, (id) => content.pack.items[id]?.sell ?? 0, state.bloom);
    if (!r.sold) return [];
    state.sparkles += r.sparkles;
    return [`🧺 Your stall sold ${r.sold} thing${r.sold === 1 ? '' : 's'} overnight: +${r.sparkles} ✨`];
  }

  openStall() { const { state, view, content } = this.host; openStall({ state, view, content, changed: () => { this.host.refreshHud(); this.host.save(); } }); }

  /** This neighbour's chat-box buttons from these systems: the story step, quests, café orders, and trades for their thank-you notes. */
  buttonsFor(id: string) {
    const { state, content, view } = this.host;
    const changed = () => { this.host.refreshHud(); this.host.save(); };
    return [...this.story.buttonsFor(id), ...this.quests.buttonsFor(id), ...cafeButtons({ state, content, view, day: () => this.host.day(), changed }, id), ...tradeButtons({ state, content, view, done: () => this.host.refreshHud() }, id)];
  }

  /** The tracker line for a quest under way, if any. */
  questHint() { return this.quests.tracker(); }

  /** The 📔 journal: `tryNew` is the tracker's newest-thing nudge; `memories` the cutscenes to watch again. */
  openJournal(tryNew: string | null, memories: { label: string; play(): void }[]) {
    const { state, content, view, jobs } = this.host;
    const wants = cafeWants({ state, content, view, day: () => this.host.day(), changed: () => {} });
    const page = journalPage({
      def: content.pack.story ?? { chapters: [], steps: [] }, story: state.story, day: this.host.day(),
      line: (id) => content.named(content.line(id) ?? ''), today: this.story.tracker(),
      also: [jobs.tracker(), this.quests.tracker(), wants ? `☕ the café wants ${wants}` : null], tryNew, quests: [...this.quests.going(), ...this.quests.offered()], tally: this.tally()
    });
    openJournal(view, page, memories);
  }

  openSkills() { openSkills(this.host.view, this.host.state, this.moods.line()); }
  openNeeds() {
    const { state, content, view } = this.host;
    const wants = cafeWants({ state, content, view, day: () => this.host.day(), changed: () => {} });
    const keeper = content.pack.cafe && content.neighbour(content.pack.cafe.keeper)?.name;
    openNeeds(view, state, this.needs.known(), wants && keeper ? `☕ The café wants ${wants} today. Cook them, then hand them to ${keeper}.` : null);
  }
}
