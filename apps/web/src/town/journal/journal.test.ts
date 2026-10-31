import { describe, expect, it } from 'vitest';
import { NEW_STORY, type StoryDef } from '../story/path';
import { journalPage, type JournalInput } from './journal';

const def: StoryDef = {
  chapters: [{ id: 'pro', name: 'The grey town' }, { id: 'spring', name: 'One spot at a time' }],
  steps: [
    { id: 'a', day: 1, chapter: 'pro', goal: { type: 'onboarded' } },
    { id: 'b', day: 4, chapter: 'spring', goal: { type: 'pet' } },
    { id: 'c', day: 5, chapter: 'spring', who: 'otto', goal: { type: 'fish', count: 1 } }
  ]
};
const input = (over: Partial<JournalInput>): JournalInput => ({ def, story: NEW_STORY, day: 1, line: (id) => `<${id}>`, today: null, also: [], tryNew: null, quests: [], ...over });

describe('the Keeper\'s journal', () => {
  it('shows today\'s step, up to two other ideas, and the chapter so far', () => {
    const p = journalPage(input({ story: { ...NEW_STORY, step: 2, day: 4 }, day: 5, today: '📖 Otto has something for you.', also: [null, 'a job', undefined, 'the café', 'a quest'] }));
    expect(p).toMatchObject({ chapter: 'One spot at a time', done: 1, total: 2, today: '📖 Otto has something for you.', also: ['a job', 'the café'] });
    expect(p.diary).toEqual(['<story.b.diary>']);
    expect(p.past).toEqual(['The grey town']);
  });

  it('says when the story carries on, and when the year\'s is told', () => {
    expect(journalPage(input({ story: { ...NEW_STORY, step: 1, day: 1 }, day: 1 })).today).toBe('That\'s today\'s story. More tomorrow!');
    expect(journalPage(input({ story: { ...NEW_STORY, step: 1, day: 1 }, day: 2 })).today).toBe('The story carries on on day 4.');
    expect(journalPage(input({ story: { ...NEW_STORY, step: 3, day: 9 }, day: 9 })).today).toMatch(/story is told/);
  });
});
