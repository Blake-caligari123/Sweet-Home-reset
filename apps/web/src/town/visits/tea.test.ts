import { describe, expect, it } from 'vitest';
import { canInvite, guestVisit, invite, teaTime } from './tea';

describe('tea at Puff\'s', () => {
  it('asks a friend round for tomorrow, one at a time', () => {
    expect(canInvite(null, 5, 1)).toBe(false);
    expect(canInvite(null, 5, 2)).toBe(true);
    const t = invite('hazel', 5);
    expect(t).toEqual({ day: 6, who: 'hazel' });
    expect(canInvite(t, 5, 4)).toBe(false);
    expect(canInvite({ ...t, had: true }, 6, 4)).toBe(true);
    expect(canInvite(t, 7, 4)).toBe(true); // tea day passed by quietly
  });

  it('brings them to the table at three on the day, till half past five', () => {
    const t = invite('bea', 5);
    expect(guestVisit(t, 'bea', 5)).toBeNull();
    expect(guestVisit(t, 'bea', 6)?.stop.area).toBe('burrow');
    expect(guestVisit(t, 'hazel', 6)).toBeNull();
    expect(teaTime(t, 'bea', 6, 15 * 60 + 5)).toBe(true);
    expect(teaTime(t, 'bea', 6, 14 * 60)).toBe(false);
    expect(teaTime({ ...t, had: true }, 'bea', 6, 16 * 60)).toBe(false);
  });
});
