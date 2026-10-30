import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TownState } from '../state';
import { TUNING } from '../data/tuning';
import { canCraft, craft, sparkleCost, type RecipeDef } from './recipes';

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

  it('goes up one tier at a time: Silver needs Copper first', () => {
    const silver: RecipeDef = { ...sponge, id: 'silver_sponge', makes: { tool: 'sponge', tier: 3 }, learn: 'recipe_copper_sponge' };
    const s = ready();
    expect(canCraft(s, silver)).toBe('unknown');
    s.tools.sponge = 2;
    expect(canCraft(s, silver)).toBe('ok');
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

describe('Hollowfern Silver tools', () => {
  it('has a Silver recipe for the duster, sponge and rake, made from cave silver, each learnable somewhere', () => {
    const recipes = pack.recipes ?? [];
    const learnable = (flag: string) => (pack.shops ?? []).some((sh) => sh.stock.some((e) => e.kind === 'recipe' && `recipe_${e.item}` === flag))
      || (pack.heartEvents ?? []).some((e) => e.rewards?.flags?.includes(flag));
    for (const tool of ['duster', 'sponge', 'rake']) {
      const r = recipes.find((x) => 'tool' in x.makes && x.makes.tool === tool && x.makes.tier === 3)!;
      expect(r, tool).toBeTruthy();
      expect(r.cost.items?.ore_silver, tool).toBeGreaterThan(0);
      expect(learnable(r.learn!), `${tool} silver recipe`).toBe(true);
    }
  });
});

describe('cooking', () => {
  const soup: RecipeDef = { id: 'veggie_soup', name: 'Veggie soup', station: 'kitchen', makes: { item: 'veggie_soup', qty: 1 }, cost: { items: { radish: 1, carrot: 1 } } };
  it('turns ingredients into a dish, any number of times, if the bag has room', () => {
    const s = new TownState(); s.bag.add('radish', 2); s.bag.add('carrot', 2);
    expect(canCraft(s, soup)).toBe('ok');
    expect(craft(s, soup)).toBe(true);
    expect(s.bag.count('veggie_soup')).toBe(1);
    expect(craft(s, soup)).toBe(true);
    expect(s.bag.count('veggie_soup')).toBe(2);
    expect(canCraft(s, soup)).toBe('short');
  });

  it('has kitchen recipes from what the farm grows, each dish a snack', () => {
    const kitchen = (pack.recipes ?? []).filter((r) => r.station === 'kitchen');
    expect(kitchen.length).toBeGreaterThanOrEqual(3);
    for (const r of kitchen) {
      expect('item' in r.makes && pack.items[r.makes.item]?.snack, r.id).toBeTruthy();
      for (const id of Object.keys(r.cost.items ?? {})) expect((pack.crops ?? []).some((c) => c.id === id) || pack.items[id], id).toBeTruthy();
    }
  });

  it('costs fewer Sparkles as Puff\'s crafting grows', () => {
    const s = ready(); s.skills.xp.crafting = TUNING.skills.levelXp[2]; // level 3
    expect(sparkleCost(s, sponge)).toBe(Math.round(50 * (1 - 2 * TUNING.skills.perks.crafting)));
    craft(s, sponge);
    expect(s.sparkles).toBe(60 - sparkleCost(s, sponge));
  });
});
