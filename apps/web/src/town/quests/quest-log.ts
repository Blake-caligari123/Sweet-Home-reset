import type { Content } from '../data/content';
import type { Conversations } from '../neighbours/conversations';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { Button, View } from '../ui/view';
import { advance, currentStep, finished, hearQuest, offerable, start, type QuestDef } from './quests';

export interface QuestHost { state: TownState; content: Content; view: View; talk: Conversations; day(): number; refreshHud(): void; save(): void }

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
      if (q.giver === id && offerable(q, state.quests, day) && state.friendOf(id).met) {
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

  private stepped(q: QuestDef) {
    const { state, view, content } = this.host;
    if (!finished(q, state.quests)) {
      view.feedback('chime', 'light');
      const next = currentStep(q, state.quests, this.host.day());
      view.toast(next ? `📜 ${next.hint}` : `📜 ${q.name}: more tomorrow`);
    } else {
      const { sparkles, item, qty = 1, flag } = q.reward;
      state.sparkles += sparkles;
      if (item) state.bag.add(item, qty);
      state.flag(flag);
      view.feedback('fanfare', 'success');
      view.banner(`📜 Quest done: ${q.name}! +${sparkles} ✨${item ? ` and ${qty > 1 ? `${qty} × ` : 'a '}${content.itemName(item).toLowerCase()}` : ''}`);
    }
    this.host.refreshHud(); this.host.save();
  }
}
