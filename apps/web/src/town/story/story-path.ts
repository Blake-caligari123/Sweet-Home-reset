import type { Content } from '../data/content';
import type { Conversations } from '../neighbours/conversations';
import type { NeighbourDef } from '../neighbours/neighbours';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { Button, View } from '../ui/view';
import { afterDue } from './scenes';
import { askerOf, caughtUp, done, hear, met, needsAsking, openingDue, passed, seenFlag, today, tomorrow, type StoryDef, type StoryFacts, type StoryStep } from './path';

export interface StoryHost { state: TownState; content: Content; view: View; talk: Conversations; day(): number; refreshHud(): void; save(): void;
  /** Play a cutscene (story/scene-player.ts). */
  playScene(id: string): void }

/**
 * The Keeper's Story in play (story/path.ts): the 📖 tracker line, the neighbour's chat-box
 * button that asks, the step ticking off from what Puff does, and the hint at tomorrow at bedtime.
 */
export class StoryPath {
  private checking = false;

  constructor(private host: StoryHost) {}

  private get def(): StoryDef { return this.host.content.pack.story ?? { chapters: [], steps: [] }; }
  private text(step: StoryStep, part: string) { return this.host.content.named(this.host.content.line(`story.${step.id}.${part}`) ?? ''); }

  private facts(): StoryFacts {
    const { state } = this.host;
    return {
      has: (f) => state.has(f), visited: (a) => state.visited.includes(a),
      built: (b) => Object.values(state.plots).some((p) => p.buildingId === b),
      pet: !!state.pet, fish: state.fishCaught, critters: state.critters.length,
      cafe: state.cafe.done.length > 0, onboarded: state.onboarding.done, questStarted: (id) => !!state.quests[id]
    };
  }

  /** The step on now. */
  get step() { return today(this.def, this.host.state.story, this.host.day()); }

  hear(e: OnboardEvent) {
    const step = this.step;
    if (step) this.host.state.story = hear(step, this.host.state.story, e);
    this.check();
  }

  /** Tick off whatever's done (or a festival day gone by), as many as are ready. */
  check() {
    if (this.checking) return;
    this.checking = true;
    const { state } = this.host;
    let step = this.step;
    let last: StoryStep | null = null;
    const from = state.story.step;
    while (step) {
      const gone = passed(step, this.host.day());
      if (gone ? !caughtUp(state.story) : !met(step, state.story, this.facts())) break;
      // Already done before anyone asked, or a festival caught up on: on to the next without using up the day.
      state.story = done(state.story, this.host.day(), gone || needsAsking(step, state.story));
      last = step;
      step = this.step;
    }
    // A save that's ahead of the story catches up at once, with one banner, not a pile of them.
    if (last) this.celebrate(last); else if (state.story.step !== from) this.host.save();
    this.checking = false;
  }

  private celebrate(step: StoryStep) {
    const { view } = this.host;
    view.feedback('chime', 'success');
    view.banner(`📖 ${this.text(step, 'diary')}`);
    this.host.refreshHud(); this.host.save();
    if (step.scene) this.host.playScene(step.scene);
  }

  /** In the morning, before the news: a new chapter's opening scene, or a newcomer arriving, once each. */
  sceneDue() {
    const { state, content } = this.host;
    const seen = (id: string) => state.has(seenFlag(id));
    return openingDue(this.def, state.story, this.host.day(), seen) ?? afterDue(content.pack.scenes ?? [], (f) => state.has(f), seen);
  }

  /** Someone's waiting to ask (a quest step is open until the quest is taken on, then it's done). */
  private calling(step: StoryStep) { return needsAsking(step, this.host.state.story) || step.goal.type === 'quest'; }

  /** A festival day gone by, still to catch up on with its host. */
  private missed(step: StoryStep) { return passed(step, this.host.day()) && !caughtUp(this.host.state.story); }

  /** The tracker: who to see, or what to do, for today's step. */
  tracker(): string | null {
    const step = this.step;
    if (!step) return null;
    if (this.missed(step)) return `📖 ${this.text(step, 'missed.call')}`;
    if (this.calling(step)) return `📖 ${this.text(step, 'call')}`;
    return `📖 ${this.text(step, 'hint')}`;
  }

  /** The asker's chat-box button (quest steps are asked by the quest's own button). */
  buttonsFor(id: string): Button[] {
    const step = this.step;
    const { state, content, view } = this.host;
    const def = content.neighbour(id);
    if (step && def && this.missed(step)) return askerOf(step, this.host.day()) === id ? [this.catchUp(step, def)] : [];
    if (!step || step.who !== id || !def || !needsAsking(step, state.story)) return [];
    return [{ label: `📖 ${this.text(step, 'ask')}`, onClick: () => {
      state.story = { ...state.story, asked: true };
      for (const [item, qty] of Object.entries(step.gift ?? {})) state.bag.add(item, qty);
      for (const f of step.teach ?? []) state.flag(f);
      this.host.talk.says(def, this.text(step, 'line'), 0, false);
      view.feedback('chime', 'light');
      this.check();
      this.host.refreshHud(); this.host.save();
    } }];
  }

  /** "How was the Fair?": the host tells Puff all about the day gone by, and the story carries on (with the year's finale, for Winter Lights). */
  private catchUp(step: StoryStep, def: NeighbourDef): Button {
    const { state, view } = this.host;
    return { label: `📖 ${this.text(step, 'missed.ask')}`, onClick: () => {
      state.story = { ...state.story, asked: true };
      for (const [item, qty] of Object.entries(step.gift ?? {})) state.bag.add(item, qty);
      this.host.talk.says(def, this.text(step, 'missed.line'), 0, false);
      view.feedback('chime', 'light');
      this.check();
      if (step.hostScene) this.host.talk.playStory(step.hostScene);
      this.host.refreshHud(); this.host.save();
    } };
  }

  /** In the morning: today's story step. */
  morning(): string[] { const t = this.tracker(); return t ? [t] : []; }

  /** At bedtime, after today's step: a hint at tomorrow's. */
  tease(): string | null {
    const next = tomorrow(this.def, this.host.state.story, this.host.day());
    return next ? this.text(next, 'tease') || null : null;
  }
}
