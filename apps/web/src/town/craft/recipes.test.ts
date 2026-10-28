import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TownState } from '../state';
import { canCraft, craft, type RecipeDef } from './recipes';

const sponge: RecipeDef = { id: 'copper_sponge', name: 'Copper sponge', makes: { tool: 'sponge', tier: 2 }, cost: { sparkles: 50, items: { pebble: 4, twig: 2 } }, learn: 'recipe_copper_sponge' };
const ready = () => { const s = new TownState(); s.sparkles = 60; s.tools.sponge = 1; s.bag.add('pebble', 4); s.bag.add('twig', 2); s.flag('recipe_copper_sponge'); return s; };

describe('crafting', () => {
  it('needs the recipe learned, the tool to upgrade, the Sparkles and the materials', () => {
    expect(canCraft(ready(), sponge)).toBe('ok');
    const unknown = ready(); unknown.flags = [];
    expect(canCraft(unknown, sponge)).toBe('unknown');
    const poor = ready(); poor.sparkles = 10;
    expect(canCraft(poor, sponge)).toBe('short');
    const few = ready(); few.bag.remove('pebble');
    expect(canCraft(few, sponge)).toBe('short');
    const noTool = ready(); delete noTool.tools.sponge;
    expect(canCraft(noTool, sponge)).toBe('unknown');
  });

  it('makes the tool better, using up the cost, all or nothing, and only once', () => {
    const s = ready();
    expect(craft(s, sponge)).toBe(true);
    expect(s.tools.sponge).toBe(2);
    expect(s.sparkles).toBe(10);
    expect(s.bag.count('pebble')).toBe(0);
    expect(s.bag.count('twig')).toBe(0);
    expect(canCraft(s, sponge)).toBe('have');
    const poor = ready(); poor.sparkles = 0;
    expect(craft(poor, sponge)).toBe(false);
    expect(poor.bag.count('pebble')).toBe(4);
  });
});

describe('Hollowfern crafting', () => {
  it('has a Copper recipe for the duster, sponge and rake, each learnable at the General Store, from forage Puff can find', () => {
    const recipes = pack.recipes ?? [];
    for (const tool of ['duster', 'sponge', 'rake']) {
      const r = recipes.find((x) => 'tool' in x.makes && x.makes.tool === tool && x.makes.tier === 2);
      expect(r, tool).toBeTruthy();
      const learnable = (pack.shops ?? []).some((sh) => sh.stock.some((e) => e.kind === 'recipe' && `recipe_${e.item}` === r!.learn));
      expect(learnable, `${tool} recipe in a shop`).toBe(true);
      for (const item of Object.keys(r!.cost.items ?? {})) expect(pack.areas.some((a) => (a.pickups ?? []).some((p) => p.item === item)), `${item} can be foraged`).toBe(true);
    }
  });
});
