import { describe, expect, it } from 'vitest';
import { Clock, DAY_END, DAY_START, formatTime, realMsPerGameMinute } from './clock';
import { TUNING } from './tuning';

describe('clock', () => {
  it('runs a full 6:00 to 2:00 day in dayRealMinutes of real time', () => {
    const c = new Clock();
    const events: string[] = [];
    for (let ms = 0; ms < TUNING.dayRealMinutes * 60_000; ms += 100) events.push(...c.advance(100));
    expect(c.state.minutes).toBe(DAY_END);
    expect(events).toContain('late');
    expect(events.filter((e) => e === 'doze')).toHaveLength(1);
    expect(realMsPerGameMinute(10) * (DAY_END - DAY_START)).toBe(600_000);
  });

  it('steps the shown time by 10 game minutes and names the season', () => {
    const c = new Clock({ day: 15, minutes: 6 * 60 + 17 });
    expect(c.shown).toBe(6 * 60 + 10);
    expect(c.season).toBe('Summer');
    expect(c.dayOfSeason).toBe(1);
    c.nextDay();
    expect(c.state).toEqual({ day: 16, minutes: DAY_START });
  });

  it('formats times for the HUD', () => {
    expect(formatTime(6 * 60)).toBe('6:00 am');
    expect(formatTime(13 * 60 + 30)).toBe('1:30 pm');
    expect(formatTime(25 * 60)).toBe('1:00 am');
  });
});
