import { seeded } from '../../shared/art/pixel-canvas';
import type { AreaPack } from '../data/area';

// The cosy outdoors (Blake, 2 Nov: "good side activities like more farming, cutting down trees
// etc more cosy things to do"): every tree can be shaken and every bush foraged once a day, for
// twigs, acorns and whatever the season brings; benches are for sitting a while; and in the wild
// places a little axe fells a tree for logs, leaving a stump that grows back as a sapling, then
// a tree. Pure rules here; nature-life.ts runs them.

/** What tapping each kind of prop does outdoors. */
const ACTIONS: Record<string, string> = { tree: 'tree', fruit_tree: 'tree', bush: 'bush', bench: 'sit' };

/** Gathered today (by prop), and when each tree was felled. */
export interface NatureState { day: number; gathered: string[]; felled: Record<string, number> }
export const NEW_NATURE: NatureState = { day: 0, gathered: [], felled: {} };

/** A prop's key: its place and top-left tile. */
export const natureKey = (area: string, x: number, y: number) => `${area}:${x},${y}`;

/** A new day: everything can be gathered again. */
export const freshDay = (s: NatureState, day: number): NatureState => (s.day === day ? s : { ...s, day, gathered: [] });

type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

/** What a shake or a rummage gives: always something, a little more some days. Fruit trees and bushes follow the seasons. */
export function gatherYield(type: string, season: string, day: number, key: string): Record<string, number> {
  const r = seeded(day * 613 + [...key].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) % 100000);
  const extra = r() < 0.4 ? 1 : 0;
  const s = season as Season;
  if (type === 'fruit_tree') return ({ Spring: { flowers: 1 }, Summer: { pear: 1 + extra }, Autumn: { apple: 1 + extra }, Winter: { twig: 1 + extra } } as const)[s];
  if (type === 'bush') return ({ Spring: { flowers: 1 + extra }, Summer: { berries: 1 + extra }, Autumn: { mushroom: 1 }, Winter: { twig: 1 } } as const)[s];
  return s === 'Autumn' || r() < 0.3 ? { twig: 1 + extra, acorn: 1 } : { twig: 1 + extra };
}

/** How a felled tree is coming along: a stump, then a sapling, then a tree again. */
export function regrowth(felledOn: number | undefined, day: number, o: { stumpDays: number; regrowDays: number }): 'tree' | 'stump' | 'sapling' {
  if (felledOn === undefined) return 'tree';
  const age = day - felledOn;
  return age < o.stumpDays ? 'stump' : age < o.regrowDays ? 'sapling' : 'tree';
}

/** Each morning: trees grown back are trees again. */
export function regrow(s: NatureState, day: number, o: { stumpDays: number; regrowDays: number }): NatureState {
  const felled = Object.fromEntries(Object.entries(s.felled).filter(([, d]) => regrowth(d, day, o) !== 'tree'));
  return { ...s, felled };
}

/** An outdoor place with its trees, bushes and benches ready to use, and felled trees shown as stumps or saplings. */
export function withNature(pack: AreaPack, s: NatureState, day: number, o: { stumpDays: number; regrowDays: number }): AreaPack {
  if (pack.kind !== 'outdoor') return pack;
  let changed = false;
  const props = pack.props.map((p) => {
    const growth = p.type === 'tree' ? regrowth(s.felled[natureKey(pack.id, p.x, p.y)], day, o) : 'tree';
    if (growth !== 'tree') { changed = true; return { ...p, type: growth, action: growth }; }
    const action = ACTIONS[p.type];
    if (!action || p.action) return p;
    changed = true;
    return { ...p, action };
  });
  return changed ? { ...pack, props } : pack;
}
