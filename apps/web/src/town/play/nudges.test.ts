import { describe, expect, it } from 'vitest';
import { TownState } from '../state';
import { nudge } from './nudges';

describe('nudges', () => {
  const open = (keys: string[]) => (k: string) => keys.includes(k);

  it('points to the next new thing, one at a time, until it has been tried', () => {
    const s = new TownState();
    expect(nudge(s, open([]))).toBeNull();
    expect(nudge(s, open(['building']), 'letter.hint')).toBe('letter.hint'); // a letter waiting comes first
    expect(nudge(s, open(['building', 'grumble_dust']))).toBe('build.hint');
    s.plots.p1 = { buildingId: 'bench', stage: 0, startedDay: 2, readyDay: 3 };
    expect(nudge(s, open(['building', 'grumble_dust']))).toBe('grumble.hint');
    s.flag('grumble_friend');
    expect(nudge(s, open(['building', 'grumble_dust']))).toBeNull();
    expect(nudge(s, open(['building', 'grumble_dust', 'pet']))).toBe('pet.hint');
    s.pet = { kind: 'cat', name: 'Mochi', day: 4 };
    expect(nudge(s, open(['building', 'grumble_dust', 'pet']))).toBeNull();
    expect(nudge(s, open(['building', 'grumble_dust', 'pet', 'invite_sorrel']))).toBe('invite.hint');
    s.plots.c1 = { buildingId: 'cottage_sorrel', stage: 0, startedDay: 8, readyDay: 10 };
    expect(nudge(s, open(['building', 'grumble_dust', 'pet', 'invite_sorrel']))).toBeNull();
  });
});
