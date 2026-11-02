import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { isUnlocked } from '../unlocks';
import { askerOf, caughtUp, chapterNow, done, hear, met, NEW_STORY, needsAsking, openingDue, passed, today, tomorrow, type StoryDef, type StoryFacts, type StoryState } from './path';

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

  it('never moves on by itself: a festival gone by waits for a chat with its host', () => {
    const fair = { ...def.steps[2], host: 'hazel' };
    expect(askerOf(fair, 3)).toBeUndefined(); // on the day, the festival itself is the step
    expect(askerOf(fair, 4)).toBe('hazel');
    expect(askerOf({ ...def.steps[1], until: 2 }, 5)).toBe('hazel'); // a prep quest's asker catches Puff up
    expect(caughtUp(at(2))).toBe(false); expect(caughtUp(at(2, { asked: true }))).toBe(true);
  });

  it('hints at tomorrow\'s step only after today\'s is done', () => {
    expect(tomorrow(def, at(1, { day: 1 }), 1)?.id).toBe('cook');
    expect(tomorrow(def, at(1, { day: 0 }), 1)).toBeNull();
    expect(tomorrow(def, at(2, { day: 1 }), 1)).toBeNull(); // the Fair's two days off
  });

  it('opens a chapter with its scene on the morning its first step comes up, once', () => {
    const withScene: StoryDef = { ...def, chapters: [def.chapters[0], { ...def.chapters[1], scene: 'b_opens' }] };
    expect(openingDue(withScene, at(2, { day: 2 }), 3, () => false)).toBe('b_opens');
    expect(openingDue(withScene, at(2, { day: 2 }), 3, () => true)).toBeNull(); // seen already
    expect(openingDue(withScene, at(1, { day: 1 }), 2, () => false)).toBeNull(); // chapter a has no scene
    expect(openingDue(withScene, at(2, { day: 3 }), 3, () => false)).toBeNull(); // not today
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

  it('has a catch-up chat for every festival day, with someone to have it with (and Winter Lights plays the finale)', () => {
    const text = pack.strings!['en-AU'];
    for (const s of story.steps.filter((x) => x.until !== undefined)) {
      expect(s.host ?? s.who, s.id).toBeTruthy();
      for (const part of ['call', 'ask', 'line']) expect(text[`story.${s.id}.missed.${part}`], `${s.id} ${part}`).toBeTruthy();
    }
    expect(story.steps.find((x) => x.id === 'lights')!.hostScene).toBe('winter_finale');
  });

  it('sends Puff where the asker really is: a place named in a 📖 line is on their daily round', () => {
    const PLACES: [RegExp, string[]][] = [[/bakery/i, ['bakery']], [/library/i, ['library']], [/river|footbridge/i, ['riverside']], [/square/i, ['square']],
      [/flower shop/i, ['bea_shop']], [/workshop|workbench/i, ['pip_workshop']], [/beach|rocks/i, ['beach']], [/harbour|lighthouse/i, ['harbour', 'beach']], [/woods|hill/i, ['woodland']]];
    const text = pack.strings!['en-AU'];
    for (const s of story.steps.filter((x) => x.who)) {
      const call = text[`story.${s.id}.call`];
      const areas = new Set(pack.neighbours!.find((n) => n.id === s.who)!.schedule.map((x) => x.area));
      for (const [word, places] of PLACES) if (word.test(call)) expect(places.some((pl) => areas.has(pl)), `${s.id}: "${call}"`).toBe(true);
    }
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
