import { restoreGame } from './restore';
import { describe, expect, it } from 'vitest';
import { Clock } from '../play/clock';
import { Puff } from '../play/puff';
import { TownState } from '../state';
import { TownAreas } from '../world/town-areas';
import { stamp, type TownSave } from './save';
import { hollowfern as pack } from './test-pack';

const save = (over: Partial<TownSave>) => stamp({
  deviceId: 't', day: 4, minutes: 700, fluff: { value: 50, max: 100, boost: 0 }, sparkles: 9, bag: [], tools: { duster: 1 },
  area: 'yard', puff: { x: 12, y: 8, fx: 200, fy: 140, facing: 'left' }, areas: {}, crops: [], flags: [], friends: {}, onboarding: 0,
  chores: { day: '', keys: [], total: 0 }, names: { puff: 'Puff', town: 'Hollowfern' },
  settings: { sound: true, music: true, haptics: true, reducedMotion: false, relaxed: false, autoTool: true }, ...over
});

describe('restoring a game', () => {
  const parts = () => ({ clock: new Clock(), state: new TownState(), places: new TownAreas(pack), puff: new Puff() });

  it('puts Puff back where they were, with the day, progress and tool in hand', () => {
    const g = parts();
    const r = restoreGame(save({ selected: 'rake' }), g);
    expect(r).toEqual({ area: 'yard', selected: 'rake', feet: { x: 200, y: 140 } });
    expect(g.clock.state).toEqual({ day: 4, minutes: 700 });
    expect(g.state.sparkles).toBe(9);
    expect(g.puff.dir).toBe('left');
  });

  it('falls back calmly: an area that is gone, a blocked tile, a bad snapshot', () => {
    const g = parts();
    expect(restoreGame(save({ area: 'nowhere', areas: { yard: 'oops' as never } }), g).area).toBe('burrow');
    // Standing on a tree (blocked): back to the yard's spawn, exact feet dropped.
    const r = restoreGame(save({ puff: { x: 1, y: 1, fx: 24, fy: 24, facing: 'down' } }), g);
    expect(r.feet).toBeUndefined();
    const spawn = pack.areas.find((a) => a.id === 'yard')!.spawn;
    expect([g.puff.x, g.puff.y]).toEqual([spawn.x, spawn.y]);
  });
});
