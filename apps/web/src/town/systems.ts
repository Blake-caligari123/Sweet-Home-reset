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
  /** The Keeper's Story: today's 📖 step (story/story-path.ts). */
  readonly story: StoryPath;

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
    this.story = new StoryPath({ state, content, view, talk: host.talk, day: () => host.day(), refreshHud: () => host.refreshHud(), save: () => host.save() });
    host.guide.listen((e) => { skills.hear(e); this.moods.hear(e); chain.hear(e); cards.hear(e); this.quests.hear(e); host.jobs.hear(e); this.story.hear(e); });
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
      also: [jobs.tracker(), this.quests.tracker(), wants ? `☕ the café wants ${wants}` : null], tryNew, quests: this.quests.going()
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
