import { describe, expect, it } from 'vitest';
import { TownState } from '../state';
import { hollowfern as pack } from '../data/test-pack';
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
    expect(nudge(s, open(['building', 'grumble_dust', 'pet', 'invite_sorrel', 'footbridge']))).toBe('repair.hint');
    s.plots.plot_footbridge = { buildingId: 'footbridge', stage: 0, startedDay: 12, readyDay: 14 };
    expect(nudge(s, open(['building', 'grumble_dust', 'pet', 'invite_sorrel', 'footbridge']))).toBeNull();
    expect(nudge(s, open(['sea_steps']))).toBe('repair.sea_steps.hint');
    expect(nudge(s, open(['overgrown_path']))).toBe('repair.overgrown_path.hint');
    expect(nudge(s, open(['grumble_dust', 'grumble_cobweb']))).toBe('grumble.cobweb.hint');
    s.flag('grumble_friend_cobweb');
    expect(nudge(s, open(['grumble_dust', 'grumble_cobweb']))).toBeNull();
  });

  it('points to every Grumble family and every later build, so nothing new arrives unannounced', () => {
    for (const f of (pack.grumbleFamilies ?? []).slice(1)) expect(nudge(new TownState(), open([f.unlock])), f.id).toBe(`grumble.${f.id}.hint`);
    expect(nudge(new TownState(), open(['mushroom_logs']))).toBe('build.mushroom_logs.hint');
    expect(nudge(new TownState(), open(['riverbank_beds']))).toBe('build.riverbank_beds.hint');
    expect(nudge(new TownState(), open(['harbour_gate']))).toBe('repair.harbour_gate.hint');
  });
});
