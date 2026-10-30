import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { heartsOf, pickLine, timeBand, type Line, type TalkContext } from './talk';


const ctx = (over: Partial<TalkContext> = {}): TalkContext => ({
  minutes: 9 * 60, season: 'spring', weather: 'sunny', hearts: 0, area: 'bakery', flags: [], met: true, talkedToday: false, recent: [], ...over
});
const first = () => 0;

describe('time bands', () => {
  it('splits the day into morning, day, evening and night', () => {
    expect(timeBand(6 * 60)).toBe('morning');
    expect(timeBand(11 * 60)).toBe('day');
    expect(timeBand(17 * 60)).toBe('evening');
    expect(timeBand(22 * 60)).toBe('night');
    expect(timeBand(25 * 60 + 30)).toBe('night');
  });

  it('counts hearts from points, capped at 10', () => {
    expect(heartsOf(0)).toBe(0);
    expect(heartsOf(19)).toBe(1);
    expect(heartsOf(500)).toBe(10);
  });
});

describe('picking a line', () => {
  const lines: Line[] = [
    { id: 'generic' },
    { id: 'morning', time: 'morning' },
    { id: 'spring', season: 'spring' },
    { id: 'rainy', weather: 'rainy' },
    { id: 'hearts', heartsMin: 0, heartsMax: 2 },
    { id: 'flag', flag: 'restored_bakery' },
    { id: 'busy', busy: true },
    { id: 'meet', meet: true }
  ];

  it('says the meeting line the first time', () => {
    expect(pickLine(lines, ctx({ met: false }), first)?.id).toBe('meet');
  });

  it('prefers the most specific line: flag, hearts, weather, season, time, then anything', () => {
    expect(pickLine(lines, ctx({ flags: ['restored_bakery'], weather: 'rainy' }), first)?.id).toBe('flag');
    expect(pickLine(lines, ctx({ weather: 'rainy' }), first)?.id).toBe('hearts');
    expect(pickLine(lines, ctx({ weather: 'rainy', hearts: 5 }), first)?.id).toBe('rainy');
    expect(pickLine(lines, ctx({ hearts: 5 }), first)?.id).toBe('spring');
    expect(pickLine(lines, ctx({ hearts: 5, season: 'summer' }), first)?.id).toBe('morning');
    expect(pickLine(lines, ctx({ hearts: 5, season: 'summer', minutes: 13 * 60 }), first)?.id).toBe('generic');
  });

  it('says a festival line first on a festival day, and never on another day', () => {
    const withFair = [...lines, { id: 'fair', festival: 'spring_fair' }];
    expect(pickLine(withFair, ctx({ festival: 'spring_fair', flags: ['restored_bakery'] }), first)?.id).toBe('fair');
    expect(pickLine(withFair, ctx({ festival: 'summer_picnic', flags: ['restored_bakery'] }), first)?.id).toBe('flag');
    expect(pickLine(withFair, ctx({ flags: ['restored_bakery'] }), first)?.id).toBe('flag');
  });

  it('greets with a visit line first when met somewhere they are only visiting', () => {
    const withVisit = [...lines, { id: 'visit', area: 'yard' }];
    expect(pickLine(withVisit, ctx({ area: 'yard', flags: ['restored_bakery'] }), first)?.id).toBe('visit');
    expect(pickLine(withVisit, ctx({ flags: ['restored_bakery'] }), first)?.id).toBe('flag');
  });

  it('skips lines heard in the last 5 talks, falling to the next tier', () => {
    expect(pickLine(lines, ctx({ recent: ['hearts'] }), first)?.id).toBe('spring');
    expect(pickLine(lines, ctx({ recent: ['hearts', 'spring', 'morning', 'generic'] }), first)?.id).toBe('hearts');
  });

  it('gives a short busy line after the day’s chat', () => {
    expect(pickLine(lines, ctx({ talkedToday: true }), first)?.id).toBe('busy');
  });

  it('says a one-off line only once', () => {
    const once: Line[] = [{ id: 'thanks', flag: 'restored_bakery', once: true }, { id: 'generic' }];
    expect(pickLine(once, ctx({ flags: ['restored_bakery'] }), first)?.id).toBe('thanks');
    expect(pickLine(once, ctx({ flags: ['restored_bakery', 'said_thanks'] }), first)?.id).toBe('generic');
  });
});

describe('living lines (NEXT-PHASE §5.3)', () => {
  const lines: Line[] = [{ id: 'plain' }, { id: 'happy', mood: ['happy', 'glowing'] }, { id: 'tidy', remembers: 'tidied_home' }, { id: 'noise', drama: 'noise' }];

  it('speaks to their mood, what they remember, and what is on their mind', () => {
    expect(pickLine(lines, ctx({ mood: 'happy' }))?.id).toBe('happy');
    expect(pickLine(lines, ctx({ mood: 'okay' }))?.id).toBe('plain');
    expect(pickLine(lines, ctx({ mood: 'happy', dramas: ['noise'] }))?.id).toBe('noise');
    expect(pickLine(lines, ctx({ mood: 'happy', dramas: ['noise'], memories: ['tidied_home'] }))?.id).toBe('tidy');
  });
});

describe('Hollowfern dialogue', () => {
  const strings = pack.strings?.['en-AU'] ?? {};
  // GDD v3 §6.1: no guilt words, no body or appearance talk, no complaints about the player.
  const banned = /\b(fail(ed|ure)?|lost|overdue|lazy|late|dirty|filthy|gross|fat|thin|skinny|chubby|weight|diet|ugly|pretty|disappoint\w*|should have)\b/i;

  it('keeps every line short and kind', () => {
    expect(Object.keys(strings).length).toBeGreaterThan(80);
    for (const [id, text] of Object.entries(strings)) {
      expect(text.length, id).toBeLessThanOrEqual(60);
      expect(text, id).not.toMatch(banned);
    }
  });

  it('keeps signs and carvings to the same 60 characters', () => {
    for (const a of pack.areas) for (const sign of a.signs ?? []) expect(sign.text.length, `${a.id} sign`).toBeLessThanOrEqual(60);
  });

  it('gives every neighbour a full spring of lines, each with text', () => {
    for (const { id } of pack.neighbours!) {
      const lines = pack.dialogue?.[id] ?? [];
      for (const l of lines) expect(strings[l.id], l.id).toBeTruthy();
      const count = (f: (l: Line) => boolean) => lines.filter(f).length;
      expect(count((l) => !!l.meet), `${id} meet`).toBe(1);
      expect(count((l) => !!l.busy), `${id} busy`).toBeGreaterThanOrEqual(2);
      for (const t of ['morning', 'day', 'evening', 'night']) expect(count((l) => l.time === t), `${id} ${t}`).toBeGreaterThanOrEqual(2);
      for (const [lo, hi] of [[0, 2], [3, 5], [6, 8], [9, 10]]) expect(count((l) => l.heartsMin === lo && l.heartsMax === hi), `${id} hearts ${lo}-${hi}`).toBeGreaterThanOrEqual(3);
      expect(count((l) => l.season === 'spring'), `${id} spring`).toBeGreaterThanOrEqual(3);
      expect(count((l) => !!l.weather), `${id} weather`).toBeGreaterThanOrEqual(2);
      // Any moment of the free spring always has something to say.
      for (let h = 0; h <= 10; h += 1) for (const m of [6 * 60, 12 * 60, 18 * 60, 23 * 60]) expect(pickLine(lines, ctx({ hearts: h, minutes: m }), first), `${id} ${h}h ${m}`).not.toBeNull();
    }
  });
});
