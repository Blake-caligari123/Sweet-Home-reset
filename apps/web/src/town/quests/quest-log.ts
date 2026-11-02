import type { Content } from '../data/content';
import type { Conversations } from '../neighbours/conversations';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { Button, View } from '../ui/view';
import { advance, currentStep, finished, hearQuest, offerable, start, type QuestDef } from './quests';

export interface QuestHost { state: TownState; content: Content; view: View; talk: Conversations; day(): number; refreshHud(): void; save(): void;
  /** Whether a neighbour is in town yet, and the name of the place they're at right now. */
  arrived(id: string): boolean; where(id: string): string | null }

/** Quests in play: offered and advanced in chat boxes, moved on by what Puff does, rewarded at the end. */
export class QuestLog {
  constructor(private host: QuestHost) {}

  private get quests() { return this.host.content.pack.quests ?? []; }
  private line(id: string) { return this.host.content.line(id) ?? ''; }

  hear(e: OnboardEvent) {
    const { state } = this.host;
    for (const q of this.quests) {
      const r = hearQuest(q, state.quests, e, this.host.day());
      state.quests = r.state;
      if (r.stepDone) this.stepped(q);
    }
  }

  /** Chat-box buttons: a quest to take on, or a talk step with this neighbour. */
  buttonsFor(id: string): Button[] {
    const { state, view } = this.host;
    const day = this.host.day();
    const out: Button[] = [];
    for (const q of this.quests) {
      const def = this.host.content.neighbour(id);
      if (!def) continue;
      if (q.giver === id && offerable(q, state.quests, day, state.flags) && state.friendOf(id).met) {
        out.push({ label: `📜 ${q.offer}`, onClick: () => {
          state.quests = start(q, state.quests, day);
          this.host.talk.says(def, this.line(q.intro), 0, false);
          view.banner(`📜 New quest: ${q.name}`);
          this.host.refreshHud(); this.host.save();
        } });
      }
      const step = currentStep(q, state.quests, day);
      if (step?.goal.type === 'talk' && step.goal.who === id) {
        const { line } = step.goal;
        out.push({ label: `📜 ${step.goal.ask}`, onClick: () => {
          state.quests = advance(q, state.quests, day);
          this.host.talk.says(def, this.line(line), 0, false);
          this.stepped(q);
        } });
      }
    }
    return out;
  }

  /** The tracker line: a quest step Puff can do now, else a quest that carries on tomorrow. */
  tracker() {
    const { state } = this.host;
    const day = this.host.day();
    const going = this.quests.filter((x) => state.quests[x.id] && !finished(x, state.quests));
    const now = going.map((q) => currentStep(q, state.quests, day)).find(Boolean);
    if (now) return `📜 ${now.hint}`;
    return going.length ? `📜 ${going[0].name}: more tomorrow` : null;
  }

  /** Stories waiting to be told today: on offer, from someone who's in town. The newest first. */
  private waiting() {
    const { state } = this.host;
    return this.quests.filter((q) => offerable(q, state.quests, this.host.day(), state.flags) && this.host.arrived(q.giver)).sort((a, b) => b.fromDay - a.fromDay);
  }

  /** The tracker, once the day's story step and any quest under way are done: who has a story waiting, and where they are. */
  invite() {
    const [q] = this.waiting();
    const who = q && this.host.content.neighbour(q.giver);
    if (!q || !who) return null;
    const where = this.host.where(q.giver);
    return `📜 ${who.name} has a story for you${where ? `. Find them at ${where}` : ''}.`;
  }

  /** The morning card: the stories waiting today (two at most). */
  morning(): string[] {
    return this.waiting().slice(0, 2).map((q) => `📜 ${this.host.content.neighbour(q.giver)?.name ?? q.giver} has a story: ${q.name}`);
  }

  /** Quests under way, for the journal: name and the step on (or more tomorrow). */
  going() {
    const { state } = this.host;
    return this.quests.filter((q) => state.quests[q.id] && !finished(q, state.quests))
      .map((q) => ({ name: q.name, hint: currentStep(q, state.quests, this.host.day())?.hint ?? 'More tomorrow' }));
  }

  /** Quests someone Puff has met would offer today, for the journal: where to go to take one on. */
  offered() {
    const { state, content } = this.host;
    return this.quests.filter((q) => offerable(q, state.quests, this.host.day(), state.flags) && state.friendOf(q.giver).met)
      .map((q) => ({ name: q.name, hint: `On offer: ask ${content.neighbour(q.giver)?.name ?? q.giver} (📜 ${q.offer})` }));
  }

  private stepped(q: QuestDef) {
    const { state, view, content } = this.host;
    if (!finished(q, state.quests)) {
      // The tracker shows the next step, with a glow (ui/hud.ts).
      view.feedback('chime', 'light');
    } else {
      const { sparkles, item, qty = 1, tool, flag } = q.reward;
      state.sparkles += sparkles;
      if (item) state.bag.add(item, qty);
      if (tool) state.tools[tool] = Math.max(1, state.tools[tool] ?? 0);
      state.flag(flag);
      view.feedback('fanfare', 'success');
      view.banner(`📜 Quest done: ${q.name}! +${sparkles} ✨${item ? ` and ${qty > 1 ? `${qty} × ` : 'a '}${content.itemName(item).toLowerCase()}` : ''}${tool ? ` and a new tool: the ${tool}!` : ''}`);
    }
    this.host.refreshHud(); this.host.save();
  }
}
