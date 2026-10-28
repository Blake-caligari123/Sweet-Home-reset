import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { AreaMess } from '../play/mess';
import { dashResult, dashSpots, festivalToday, type FestivalDef } from './festivals';

const fair: FestivalDef = { id: 'spring_fair', name: 'Spring Clean Fair', season: 'Spring', area: 'square', seconds: 60, spots: 20, perSpot: 5, mess: ['weeds', 'dust', 'crumbs'], outfit: 'fair_ribbon' };

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
    const spots = dashSpots(area, m, 14, 20, fair.mess);
    expect(spots).toHaveLength(20);
    expect(new Set(spots.map((s) => `${s.x},${s.y}`)).size).toBe(20);
    for (const s of spots) { expect(area.walkable(s.x, s.y)).toBe(true); expect(area.doorAt(s.x, s.y)).toBeFalsy(); }
    expect(dashSpots(area, m, 14, 20, fair.mess)).toEqual(spots);
    expect(new Set(dashSpots(area, m, 42, 20, ['leaves']).map((s) => s.type))).toEqual(new Set(['leaves']));
  });

  it('has a festival for spring, summer and autumn, each with its own mess, ribbon or hat, intro and lines', () => {
    const fests = pack.festivals ?? [];
    expect(fests.map((f) => f.season)).toEqual(['Spring', 'Summer', 'Autumn']);
    const text = pack.strings!['en-AU'];
    for (const f of fests) {
      expect(f.mess.length, f.id).toBeGreaterThan(0);
      expect(pack.outfits!.some((o) => o.id === f.outfit && o.earn.flag === `festival_${f.id}`), f.id).toBe(true);
      expect(text[`festival.${f.id}.intro`], f.id).toBeTruthy();
      for (const n of pack.neighbours!) expect(pack.dialogue![n.id].some((l) => l.festival === f.id), `${n.id} ${f.id}`).toBe(true);
    }
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
