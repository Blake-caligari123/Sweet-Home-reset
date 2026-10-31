import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { isUnlocked } from '../unlocks';
import { chapterNow, done, hear, met, NEW_STORY, needsAsking, passed, today, tomorrow, type StoryDef, type StoryFacts, type StoryState } from './path';

const def: StoryDef = {
  chapters: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
  steps: [
    { id: 'fish', day: 1, chapter: 'a', who: 'otto', goal: { type: 'fish', count: 1 } },
    { id: 'cook', day: 2, chapter: 'a', who: 'hazel', goal: { type: 'made', station: 'kitchen', count: 1 } },
    { id: 'fair', day: 3, until: 3, chapter: 'b', goal: { type: 'flag', flag: 'fair' } }
  ]
};
const facts = (over: Partial<StoryFacts> = {}): StoryFacts => ({
  has: () => false, built: () => false, visited: () => false, questStarted: () => false,
  pet: false, fish: 0, critters: 0, cafe: false, onboarded: false, ...over
});
const at = (step: number, extra: Partial<StoryState> = {}): StoryState => ({ ...NEW_STORY, step, ...extra });

describe('the Keeper\'s Story', () => {
  it('has one step a day: the next waits for its day, and for tomorrow once one is done', () => {
    expect(today(def, NEW_STORY, 1)?.id).toBe('fish');
    expect(today(def, at(1, { day: 1 }), 1)).toBeNull(); // done today: more tomorrow
    expect(today(def, at(1, { day: 1 }), 2)?.id).toBe('cook');
    expect(today(def, at(2, { day: 1 }), 2)).toBeNull(); // the Fair isn't till day 3
    expect(today(def, at(3), 9)).toBeNull(); // the end
  });

  it('ticks off from what is already true, but counts doing things only once asked', () => {
    const [fish, cook] = def.steps;
    expect(met(fish, NEW_STORY, facts({ fish: 2 }))).toBe(true);
    expect(needsAsking(fish, NEW_STORY)).toBe(true);
    expect(hear(cook, at(1), { type: 'made', station: 'kitchen' }).count).toBe(0);
    const asked = hear(cook, at(1, { asked: true }), { type: 'made', station: 'kitchen' });
    expect(met(cook, asked, facts())).toBe(true);
    expect(hear(cook, at(1, { asked: true }), { type: 'made', station: 'bench' }).count).toBe(0);
  });

  it('doesn\'t use up the day for a step done before anyone asked, and lets a festival day pass quietly', () => {
    expect(done(at(0, { day: 0 }), 4, true)).toEqual({ step: 1, asked: false, count: 0, day: 0 });
    expect(done(at(0, { day: 0 }), 4, false).day).toBe(4);
    expect(passed(def.steps[2], 3)).toBe(false); expect(passed(def.steps[2], 4)).toBe(true);
    expect(passed(def.steps[0], 99)).toBe(false);
  });

  it('hints at tomorrow\'s step only after today\'s is done', () => {
    expect(tomorrow(def, at(1, { day: 1 }), 1)?.id).toBe('cook');
    expect(tomorrow(def, at(1, { day: 0 }), 1)).toBeNull();
    expect(tomorrow(def, at(2, { day: 1 }), 1)).toBeNull(); // the Fair's two days off
  });

  it('knows the chapter so far', () => {
    expect(chapterNow(def, at(1))).toMatchObject({ chapter: { id: 'a' }, done: ['fish'], total: 2 });
    expect(chapterNow(def, at(3)).chapter.id).toBe('b');
  });
});

describe('Hollowfern\'s year', () => {
  const story = pack.story!;

  it('runs from day 1 to Winter Lights in order, a step on most days, with every chapter ending at its festival', () => {
    const days = story.steps.map((s) => s.day);
    expect(days).toEqual([...days].sort((a, b) => a - b));
    expect(days[0]).toBe(1); expect(story.steps.at(-1)!.goal).toEqual({ type: 'flag', flag: 'festival_winter_lights' });
    expect(story.steps.length).toBeGreaterThanOrEqual(36);
    for (const c of story.chapters.slice(1)) expect(story.steps.filter((s) => s.chapter === c.id).at(-1)!.until, c.id).toBeDefined();
  });

  it('only asks for what has arrived by its day, and takes Puff into each quest when it opens', () => {
    for (const s of story.steps) {
      if (s.who && !['hazel', 'bea', 'pip', 'otto', 'moss'].includes(s.who)) expect(isUnlocked(s.who, { day: s.day, flags: [`home_${s.who}`] }), s.id).toBe(true);
      if (s.goal.type !== 'quest') continue;
      const id = s.goal.id;
      const q = pack.quests!.find((x) => x.id === id)!;
      expect(q.giver, s.id).toBe(s.who);
      expect(q.fromDay, s.id).toBeLessThanOrEqual(s.day);
      // A quest that can only be taken on until a day (a festival's prep) lets the story move on after it.
      if (q.untilDay) expect(s.until, s.id).toBe(q.untilDay);
    }
    // Juniper's letter and the old song come earlier now, so autumn has a story.
    expect(pack.letters!.find((l) => l.id === 'juniper_1')!.day).toBe(31);
    expect(isUnlocked('invite_juniper', { day: 31, flags: ['invite_juniper'] })).toBe(true);
  });
});
