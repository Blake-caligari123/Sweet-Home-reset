import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { AreaMess } from '../play/mess';
import { dashResult, dashSpots, festivalToday, litFlag, practiceDash, withLanterns, type FestivalDef } from './festivals';
import { TUNING } from '../data/tuning';

const fair: FestivalDef = { id: 'spring_fair', name: 'Spring Clean Fair', season: 'Spring', area: 'square', seconds: 60, spots: 20, perSpot: 5, mess: ['weeds', 'dust', 'crumbs'], outfit: 'fair_ribbon' };

describe('festivals', () => {
  it('fall on the last day of their season, every year', () => {
    expect(festivalToday([fair], 14)?.id).toBe('spring_fair');
    expect(festivalToday([fair], 70)?.id).toBe('spring_fair');
    expect(festivalToday([fair], 13)).toBeNull();
    expect(festivalToday([fair], 28)).toBeNull(); // summer's is its own
  });

  it('offers a practice dash on other days: just for fun, no Sparkles, its size from tuning', () => {
    const p = practiceDash('square');
    expect([p.seconds, p.spots, p.perSpot, p.outfit]).toEqual([TUNING.practiceDash.seconds, TUNING.practiceDash.spots, 0, undefined]);
    expect(dashResult(p, 7).sparkles).toBe(0);
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

  it('sets out Winter Lights lanterns only on its day, lit once Puff lights them', () => {
    const lights: FestivalDef = { ...fair, id: 'winter_lights', season: 'Winter', game: 'lights', lanterns: [{ x: 5, y: 9 }, { x: 24, y: 9 }] };
    const square = pack.areas.find((a) => a.id === 'square')!;
    expect(withLanterns(square, null, [], 56)).toBe(square);
    const out = withLanterns(square, lights, [litFlag(lights, 56, 5, 9)], 56).props.slice(-2);
    expect(out).toEqual([{ type: 'festival_lantern_lit', x: 5, y: 9 }, { type: 'festival_lantern', x: 24, y: 9, action: 'light' }]);
    expect(withLanterns(pack.areas.find((a) => a.id === 'yard')!, lights, [], 56).props).toEqual(pack.areas.find((a) => a.id === 'yard')!.props);
  });

  it('has a festival every season, each with its own game, prize, intro and lines', () => {
    const fests = pack.festivals ?? [];
    expect(fests.map((f) => f.season)).toEqual(['Spring', 'Summer', 'Autumn', 'Winter']);
    const winter = fests[3];
    expect(winter.game).toBe('lights');
    const square = new Area(pack.areas.find((a) => a.id === 'square')!);
    for (const l of winter.lanterns!) expect(square.walkable(l.x, l.y), `${l.x},${l.y}`).toBe(true);
    const text = pack.strings!['en-AU'];
    for (const f of fests) {
      if (f.game !== 'lights') expect(f.mess.length, f.id).toBeGreaterThan(0);
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
    for (const id of ['festival.cheer.all', 'festival.cheer.lots', 'festival.cheer.some', 'festival.practice', `festival.${def.id}.intro`]) expect(text[id], id).toBeTruthy();
  });

  it('ends the first fair with Hazel, Bea and Pip saying thank you, and the first trickle (STORY day 14)', () => {
    const def = pack.festivals!.find((f) => f.id === 'spring_fair')!;
    const scene = pack.heartEvents!.find((e) => e.id === def.scene)!;
    expect(scene.conditions?.flags).toContain(`festival_${def.id}`);
    const speakers = new Set(scene.scene.flatMap((s) => ('speaker' in s ? [s.speaker] : [])));
    for (const who of ['hazel', 'bea', 'pip']) expect(speakers.has(who), who).toBe(true);
    expect(scene.rewards?.flags).toContain('glimmerwell_trickle');
    const text = pack.strings!['en-AU'];
    for (const s of scene.scene) if ('line' in s) expect(text[s.line], s.line).toBeTruthy();
    expect(text[scene.banner!]).toBeTruthy();
  });

  it('closes year one at Winter Lights with all six neighbours and the Our Home sticker (STORY finale)', () => {
    const def = pack.festivals!.find((f) => f.game === 'lights')!;
    const scene = pack.heartEvents!.find((e) => e.id === def.scene)!;
    expect(scene.trigger.type).toBe('story');
    const speakers = new Set(scene.scene.flatMap((s) => ('speaker' in s ? [s.speaker] : [])));
    for (const who of ['hazel', 'bea', 'pip', 'otto', 'moss', 'mabel', 'puff']) expect(speakers.has(who), who).toBe(true);
    const text = pack.strings!['en-AU'];
    expect(scene.scene.some((s) => 'line' in s && /sticker/i.test(text[s.line]))).toBe(true);
    expect(text[scene.banner!]).toMatch(/gathered/);
  });

  it('gathers every neighbour in the square on fair day', () => {
    for (const n of pack.neighbours!) expect(n.visits?.[0], n.id).toMatchObject({ every: 14, on: 0, area: 'square' });
  });
});
