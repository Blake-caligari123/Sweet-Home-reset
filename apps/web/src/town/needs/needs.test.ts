import { describe, expect, it, vi } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import type { TownLife } from '../life/town-life';
import { TownState } from '../state';
import { chipIn, metNeeds, type NeedDef } from './needs';
import { TownNeeds } from './town-needs';

const seat: NeedDef = { id: 'seat', name: 'Somewhere to sit', hint: 'A bench', metBy: ['bench', 'bench_cosy'], fund: 30 };

describe('town needs and the town fund (NEXT-PHASE §5.4)', () => {
  it('a need is met once something that meets it is finished', () => {
    expect(metNeeds([seat], { p: { buildingId: 'bench', stage: 1, startedDay: 1, readyDay: 2 } })).toEqual([]);
    expect(metNeeds([seat], { p: { buildingId: 'bench_cosy', stage: 2, startedDay: 1, readyDay: 2 } })).toEqual(['seat']);
  });

  it('everyone chips in each morning, more when happy', () => {
    expect(chipIn(['happy', 'glowing', 'okay', 'low'])).toBe(2 * TUNING.townFund.perHappy + 2 * TUNING.townFund.perOther);
  });

  it('in the morning: the fund grows, and a newly met need is cheered once', () => {
    const state = new TownState();
    const life = { mood: vi.fn(() => 'okay'), remember: vi.fn() } as unknown as TownLife;
    const needs = new TownNeeds({ state, content: new Content(pack, () => state.names), life, arrived: (k) => ['building', 'hazel', 'bea'].includes(k) });
    state.plots.p = { buildingId: 'bench', stage: 2, startedDay: 1, readyDay: 2 };
    const banners = needs.morning();
    expect(banners).toHaveLength(1);
    expect(state.needsMet).toEqual(['seat']);
    expect(state.fund).toBe(2 * TUNING.townFund.perOther + pack.needs!.find((n) => n.id === 'seat')!.fund);
    expect(needs.morning()).toEqual([]);
  });

  it('Hollowfern\'s needs are each met by something the town can build, and some by big projects', () => {
    const ids = new Set(pack.buildings!.map((b) => b.id));
    for (const n of pack.needs!) for (const b of n.metBy) expect(ids.has(b), n.id).toBe(true);
    expect(pack.buildings!.some((b) => b.project)).toBe(true);
  });
});
