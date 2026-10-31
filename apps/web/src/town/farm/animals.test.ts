import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { TownState } from '../state';
import { FEET, navFor, REACH } from '../world/nav';
import { T } from '../world/art/texture';
import { animalFlag, farmMorning, tend, withAnimals, type AnimalDef } from './animals';

const hen: AnimalDef = { id: 'hen', name: 'Hen', gives: 'egg', area: 'yard', x: 15, y: 11 };

describe('farm animals', () => {
  it('settle in the morning after they\'re bought, then give something each day after a day\'s care', () => {
    const s = new TownState(); s.flag(animalFlag('hen'));
    expect(farmMorning(s.farm, [hen], 5)).toEqual([hen]);
    expect(tend(s, hen, 5)).toEqual({ got: null, full: false, tended: true });
    expect(tend(s, hen, 5).tended).toBe(false);
    expect(farmMorning(s.farm, [hen], 6)).toEqual([]);
    expect(tend(s, hen, 6)).toEqual({ got: 'egg', full: false, tended: true });
    expect(s.bag.count('egg')).toBe(1);
  });

  it('just gives nothing the morning after a day without care, and waits when the bag is full', () => {
    const s = new TownState();
    farmMorning(s.farm, [hen], 5); tend(s, hen, 5);
    farmMorning(s.farm, [hen], 6);
    farmMorning(s.farm, [hen], 8); // day 7 skipped: still ready from day 6, nothing more
    while (s.bag.canAdd('pebble')) s.bag.add('pebble');
    expect(tend(s, hen, 8).full).toBe(true);
    expect(s.farm.hen.ready).toBe(true);
  });

  it('stand in the yard only once bought, and every animal can be reached', () => {
    const defs = pack.animals ?? [];
    expect(defs.map((a) => a.gives).sort()).toEqual(['egg', 'milk', 'wool']);
    const yard = pack.areas.find((a) => a.id === 'yard')!;
    expect(withAnimals(yard, defs, [])).toBe(yard);
    const area = new Area(withAnimals(yard, defs, defs.map((a) => animalFlag(a.id))));
    const nav = navFor(area);
    const spawn = nav.nearestOpen({ x: yard.spawn.x * T + T / 2, y: yard.spawn.y * T + FEET })!;
    for (const a of defs) {
      expect(area.pack.props.some((p) => p.type === a.id && p.action === 'animal'), a.id).toBe(true);
      expect(nav.findPathNear(spawn, { x0: a.x * T, y0: a.y * T, x1: (a.x + (a.w ?? 1)) * T, y1: (a.y + 1) * T }, REACH), a.id).toBeTruthy();
    }
    for (const d of yard.doors) expect(nav.findPathNear(spawn, { x0: d.x * T, y0: d.y * T, x1: (d.x + 1) * T, y1: (d.y + 1) * T }, 0), d.to).toBeTruthy();
  });

  it('are sold once each at the General Store, and what they give sells and cooks', () => {
    const general = (pack.shops ?? []).find((s) => s.id === 'general')!;
    for (const a of pack.animals ?? []) {
      expect(general.stock.some((e) => e.kind === 'animal' && e.item === a.id), a.id).toBe(true);
      expect(pack.items[a.gives]?.sell, a.gives).toBeGreaterThan(0);
      expect(pack.strings?.['en-AU']?.[`farm.got.${a.id}`], a.id).toBeTruthy();
    }
    expect((pack.recipes ?? []).some((r) => r.cost.items?.egg && r.cost.items?.milk)).toBe(true);
  });
});
