import { describe, expect, it, vi } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Content } from '../data/content';
import type { Conversations } from '../neighbours/conversations';
import { TownState } from '../state';
import type { View } from '../ui/view';
import { QuestLog } from './quest-log';
import { currentStep, finished, hearQuest, offerable, start, type QuestDef, type QuestLogState } from './quests';

const q: QuestDef = {
  id: 'club', name: 'Club', giver: 'moss', fromDay: 3, offer: 'Help?', intro: 'x',
  steps: [
    { hint: 'Tidy 2', goal: { type: 'cleared', area: 'library', count: 2 } },
    { hint: 'Cook', goal: { type: 'made', station: 'kitchen', count: 1 }, nextDay: true }
  ],
  reward: { sparkles: 10, flag: 'club_done' }
};
const cleared = (area: string) => ({ type: 'cleared', mess: 'dust', area } as const);

describe('quest chains (NEXT-PHASE §5.3)', () => {
  it('is offered from its day, once', () => {
    expect(offerable(q, {}, 2)).toBe(false);
    expect(offerable(q, {}, 3)).toBe(true);
    expect(offerable(q, start(q, {}, 3), 4)).toBe(false);
    // A festival's prep is only offered in the days before it.
    expect(offerable({ ...q, untilDay: 5 }, {}, 6)).toBe(false);
  });

  it('counts only what its step asks for, and moves on when it is met', () => {
    let s = start(q, {}, 3);
    s = hearQuest(q, s, cleared('square'), 3).state;
    expect(s.club.count).toBe(0);
    s = hearQuest(q, s, cleared('library'), 3).state;
    const r = hearQuest(q, s, cleared('library'), 3);
    expect(r.stepDone).toBe(true);
    expect(r.state.club).toEqual({ step: 1, count: 0, day: 3 });
  });

  it('opens a next-day step tomorrow, and finishes', () => {
    let s: QuestLogState = { club: { step: 1, count: 0, day: 3 } };
    expect(currentStep(q, s, 3)).toBeNull();
    expect(hearQuest(q, s, { type: 'made', station: 'kitchen' }, 3).stepDone).toBe(false);
    s = hearQuest(q, s, { type: 'made', station: 'kitchen' }, 4).state;
    expect(finished(q, s)).toBe(true);
  });

  it('runs in play: offered in the giver\'s chat, talked through, rewarded', () => {
    const state = new TownState();
    const view = { banner: vi.fn(), feedback: vi.fn(), toast: vi.fn() } as unknown as View;
    const talk = { says: vi.fn() } as unknown as Conversations;
    let day = 6;
    const log = new QuestLog({ state, content: new Content(pack, () => state.names), view, talk, day: () => day, refreshHud: () => {}, save: () => {} });
    const club = pack.quests![0];
    state.friendOf(club.giver).met = true;
    log.buttonsFor(club.giver).find((b) => b.label.includes(club.offer))!.onClick();
    expect(log.tracker()).toContain(club.steps[0].hint);
    for (let i = 0; i < 6; i++) log.hear(cleared('library'));
    day += 1; log.hear({ type: 'made', station: 'kitchen' });
    day += 1; log.buttonsFor('pip')[0].onClick();
    const sparkles = state.sparkles;
    log.buttonsFor('moss')[0].onClick();
    expect(state.has(club.reward.flag)).toBe(true);
    expect(state.sparkles).toBe(sparkles + club.reward.sparkles);
    expect(log.tracker()).toBeNull();
  });

  it('Hollowfern\'s festival prep is offered in the days just before its festival', () => {
    for (const x of pack.quests!.filter((x) => x.untilDay)) {
      expect(x.untilDay! >= x.fromDay, x.id).toBe(true);
      expect(x.untilDay! % 14, `${x.id} ends before the festival day`).not.toBe(0);
      expect(Math.ceil(x.untilDay! / 14), x.id).toBe(Math.ceil(x.fromDay / 14));
    }
  });
});
