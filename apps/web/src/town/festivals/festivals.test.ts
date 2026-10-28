import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { AreaMess } from '../play/mess';
import { dashResult, dashSpots, festivalToday, type FestivalDef } from './festivals';

const fair: FestivalDef = { id: 'spring_fair', name: 'Spring Clean Fair', season: 'Spring', area: 'square', seconds: 60, spots: 20, perSpot: 5, outfit: 'fair_ribbon' };

describe('festivals', () => {
  it('fall on the last day of their season, every year', () => {
    expect(festivalToday([fair], 14)?.id).toBe('spring_fair');
    expect(festivalToday([fair], 70)?.id).toBe('spring_fair');
    expect(festivalToday([fair], 13)).toBeNull();
    expect(festivalToday([fair], 28)).toBeNull(); // summer's is its own
  });

  it('scores the tidy dash kindly: Sparkles for every spot, and a cheer for any score', () => {
    expect(dashResult(fair, 20)).toEqual({ sparkles: 100, cheer: 'festival.cheer.all' });
    expect(dashResult(fair, 12)).toEqual({ sparkles: 60, cheer: 'festival.cheer.lots' });
    expect(dashResult(fair, 0)).toEqual({ sparkles: 0, cheer: 'festival.cheer.some' });
  });

  it('puts the dash mess on open, empty tiles away from doors, the same for the same day', () => {
    const area = new Area(pack.areas.find((a) => a.id === 'square')!);
    const m = new AreaMess(area.w, area.h, [], false);
    const spots = dashSpots(area, m, 14, 20);
    expect(spots).toHaveLength(20);
    expect(new Set(spots.map((s) => `${s.x},${s.y}`)).size).toBe(20);
    for (const s of spots) { expect(area.walkable(s.x, s.y)).toBe(true); expect(area.doorAt(s.x, s.y)).toBeFalsy(); }
    expect(dashSpots(area, m, 14, 20)).toEqual(spots);
  });

  it('has the Spring Clean Fair in the square, with its stall, a ribbon to earn and every line', () => {
    const def = pack.festivals!.find((f) => f.id === 'spring_fair')!;
    expect(def.area).toBe('square');
    expect(pack.areas.find((a) => a.id === 'square')!.props.some((p) => p.action === 'festival')).toBe(true);
    expect(pack.outfits!.find((o) => o.id === def.outfit)?.earn.flag).toBe(`festival_${def.id}`);
    const text = pack.strings!['en-AU'];
    for (const id of ['festival.cheer.all', 'festival.cheer.lots', 'festival.cheer.some', 'festival.closed', `festival.${def.id}.intro`]) expect(text[id], id).toBeTruthy();
  });

  it('gathers every neighbour in the square on fair day', () => {
    for (const n of pack.neighbours!) expect(n.visits?.[0], n.id).toMatchObject({ every: 14, on: 0, area: 'square' });
  });
});
