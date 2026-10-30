import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { TownState } from '../state';
import { notePuffDay, puffMood, puffMoodOf, type MoodInputs } from './puff-mood';

const calm: MoodInputs = { tired: false, ate: false, chatted: false, burrowTidy: 0, places: 0 };

describe('Puff\'s moods (NEXT-PHASE §5.2)', () => {
  it('is content by default, and never anything sadder', () => {
    expect(puffMoodOf(calm)).toBe('content');
  });

  it('is happy with two of a snack, a chat and a cosy burrow', () => {
    expect(puffMoodOf({ ...calm, ate: true })).toBe('content');
    expect(puffMoodOf({ ...calm, ate: true, chatted: true })).toBe('happy');
    expect(puffMoodOf({ ...calm, chatted: true, burrowTidy: TUNING.puffMood.cosyBurrow })).toBe('happy');
  });

  it('is curious after new places, and sleepy before anything else when Fluff is low', () => {
    expect(puffMoodOf({ ...calm, places: TUNING.puffMood.curiousPlaces })).toBe('curious');
    expect(puffMoodOf({ ...calm, ate: true, chatted: true, tired: true })).toBe('sleepy');
  });

  it('notes today\'s snack and places, and starts fresh each day', () => {
    let d = notePuffDay({ day: 0, ate: false, places: [] }, { type: 'ate', item: 'biscuit' }, 2);
    d = notePuffDay(d, { type: 'entered', area: 'square' }, 2);
    d = notePuffDay(d, { type: 'entered', area: 'square' }, 2);
    expect(d).toEqual({ day: 2, ate: true, places: ['square'] });
    expect(notePuffDay(d, { type: 'timer' }, 3)).toEqual({ day: 3, ate: false, places: [] });
  });

  it('reads yesterday\'s notes as nothing today', () => {
    const s = new TownState();
    s.puffDay = { day: 2, ate: true, places: [] };
    s.friendOf('hazel').talkedDay = 2;
    expect(puffMood(s, 2, 0)).toBe('happy');
    expect(puffMood(s, 3, 0)).toBe('content');
  });
});
