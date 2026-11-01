import { describe, expect, it } from 'vitest';
import { HAPPENING_IDS, happeningFor, hearHappening, inSparkleHour, NO_HAPPENING, type HappeningFacts, type HappeningState } from './happenings';

const facts = (day: number, over: Partial<HappeningFacts> = {}): HappeningFacts => ({
  day, shelf: true, tools: ['hands', 'duster', 'rake', 'can'], fish: true, crops: true, animals: false, grumbles: true,
  places: ['yard', 'square', 'lane'], tidyPlaces: ['square'], friends: ['hazel'], otto: true, ...over
});

describe('daily happenings', () => {
  it('has something on most days from day 3, all kinds over a season, never two the same in a row', () => {
    expect(happeningFor(facts(2), false, null)).toBeNull();
    expect(happeningFor(facts(9), true, null)).toBeNull(); // festival days are their own thing
    let prev: string | null = null; const seen = new Set<string>(); let quiet = 0;
    for (let d = 3; d < 60; d += 1) {
      const h = happeningFor(facts(d), false, prev as never);
      if (h) { expect(h).not.toBe(prev); seen.add(h); } else quiet += 1;
      prev = h;
    }
    expect(seen).toEqual(new Set(HAPPENING_IDS));
    expect(quiet).toBeGreaterThan(5); expect(quiet).toBeLessThan(35);
  });

  it('only picks what Puff can join in with', () => {
    for (let d = 3; d < 40; d += 1) expect(['breeze', 'derby']).not.toContain(happeningFor(facts(d, { tools: ['hands'], fish: false }), false, null));
  });

  it('counts toward the goal and finishes once', () => {
    let s: HappeningState = { ...NO_HAPPENING, day: 5, id: 'derby' };
    for (let i = 0; i < 2; i += 1) s = hearHappening(s, { type: 'caught', fish: 'trout' }).state;
    expect(hearHappening(s, { type: 'cleared', mess: 'dust', area: 'yard' }).state).toBe(s);
    const r = hearHappening(s, { type: 'caught', fish: 'perch' });
    expect(r.finished).toBe(true);
    expect(hearHappening(r.state, { type: 'caught', fish: 'perch' }).finished).toBe(false);
    expect(inSparkleHour(16 * 60 + 30)).toBe(true); expect(inSparkleHour(18 * 60)).toBe(false);
  });
});
