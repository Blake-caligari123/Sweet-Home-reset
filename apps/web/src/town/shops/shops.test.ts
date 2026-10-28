import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TownState } from '../state';
import { buy, isOpen, sell, stockToday, type ShopDef } from './shops';

const shop: ShopDef = {
  id: 'general', name: 'General Store', opens: 480, closes: 1080, openFromDay: 2,
  stock: [
    { item: 'radish_seeds', price: 20, qty: 3 },
    { item: 'copper_sponge', kind: 'recipe', price: 150, fromDay: 5 },
    { item: 'bag_small', kind: 'bag', slots: 6, price: 300 },
    { item: 'bag_big', kind: 'bag', slots: 6, price: 800, requires: 'bought_general_bag_small' }
  ],
  buys: ['radish']
};
const ctx = (s: TownState, minutes = 600, day = 3) => ({ state: s, minutes, day, items: pack.items });
const rich = () => { const s = new TownState(); s.sparkles = 2000; return s; };

describe('shops', () => {
  it('keep their hours, and open from their first day', () => {
    expect(isOpen(shop, 600, 1)).toBe(false);
    expect(isOpen(shop, 470, 2)).toBe(false);
    expect(isOpen(shop, 480, 2)).toBe(true);
    expect(isOpen(shop, 1080, 2)).toBe(false);
  });

  it('show the Copper recipe from day 5 and the big bag after the small one', () => {
    const s = rich();
    expect(stockToday(shop, 4, s.flags).map((e) => e.item)).toEqual(['radish_seeds', 'bag_small']);
    expect(stockToday(shop, 5, s.flags).map((e) => e.item)).toContain('copper_sponge');
    buy(shop, shop.stock[2], ctx(s));
    expect(stockToday(shop, 5, s.flags).map((e) => e.item)).toEqual(['radish_seeds', 'copper_sponge', 'bag_big']);
  });

  it('stock seeds only in the seasons they grow', () => {
    const seasonal: ShopDef = { ...shop, stock: [{ item: 'radish_seeds', price: 20, seasons: ['Spring'] }, { item: 'tomato_seeds', price: 40, seasons: ['Summer'] }] };
    expect(stockToday(seasonal, 3, []).map((e) => e.item)).toEqual(['radish_seeds']);
    expect(stockToday(seasonal, 15, []).map((e) => e.item)).toEqual(['tomato_seeds']);
    expect(stockToday(seasonal, 43, [])).toEqual([]); // winter: grow under glass from saved seeds
  });

  it('sell at fixed prices: Sparkles go down by exactly the price and the item lands in the bag', () => {
    const s = rich();
    expect(buy(shop, shop.stock[0], ctx(s))).toEqual({ ok: true });
    expect(s.sparkles).toBe(1980);
    expect(s.bag.count('radish_seeds')).toBe(3);
  });

  it('never sell when closed, short of Sparkles, or with a full bag, and take nothing then', () => {
    const s = rich();
    expect(buy(shop, shop.stock[0], ctx(s, 1200))).toEqual({ ok: false, reason: 'closed' });
    s.sparkles = 10;
    expect(buy(shop, shop.stock[0], ctx(s))).toEqual({ ok: false, reason: 'sparkles' });
    s.sparkles = 500;
    s.bag.slots.forEach((_, i) => { s.bag.slots[i] = { id: `junk${i}`, count: 99 }; });
    expect(buy(shop, shop.stock[0], ctx(s))).toEqual({ ok: false, reason: 'bag' });
    expect(s.sparkles).toBe(500);
  });

  it('a bag upgrade grows the bag once; a recipe is learned once', () => {
    const s = rich();
    const before = s.bag.slots.length;
    buy(shop, shop.stock[2], ctx(s));
    expect(s.bag.slots.length).toBe(before + 6);
    expect(buy(shop, shop.stock[2], ctx(s))).toEqual({ ok: false, reason: 'gone' });
    buy(shop, shop.stock[1], ctx(s, 600, 5));
    expect(s.has('recipe_copper_sponge')).toBe(true);
  });

  it('buy back crops for their price', () => {
    const s = new TownState();
    s.bag.add('radish', 2);
    expect(sell(shop, 'radish', ctx(s))).toEqual({ ok: true });
    expect(s.sparkles).toBe(pack.items.radish.sell);
    expect(s.bag.count('radish')).toBe(1);
    expect(sell(shop, 'sock', ctx(s))).toEqual({ ok: false, reason: 'gone' });
  });
});

describe('Hollowfern shops', () => {
  it('has the General Store (open day 2, Copper recipe from day 5) and Bea’s flowers, priced from the pack', () => {
    const shops = pack.shops ?? [];
    const general = shops.find((x) => x.id === 'general')!;
    expect(general.openFromDay).toBe(2);
    expect(general.stock.find((e) => e.kind === 'recipe')?.fromDay).toBe(5);
    expect(shops.find((x) => x.keeper === 'bea')).toBeDefined();
    for (const sh of shops) for (const e of sh.stock) {
      expect(e.price, `${sh.id} ${e.item}`).toBeGreaterThan(0);
      if (!e.kind || e.kind === 'item') expect(pack.items[e.item]?.name, e.item).toBeTruthy();
    }
    for (const sh of shops) for (const id of sh.buys ?? []) expect(pack.items[id]?.sell, id).toBeGreaterThan(0);
  });

  it('puts the General Store counter in its own room off the square', () => {
    const store = pack.areas.find((a) => a.id === 'store')!;
    expect(store.props.some((p) => p.action === 'shop' && p.shop === 'general')).toBe(true);
    const door = pack.areas.find((a) => a.id === 'square')!.doors.find((d) => d.to === 'store')!;
    expect(door.opensDay).toBe(2);
  });
  it('buys back everything that has a sell price, somewhere in town', () => {
    const buys = (pack.shops ?? []).flatMap((sh) => sh.buys ?? []);
    for (const [id, item] of Object.entries(pack.items)) if ((item as { sell?: number }).sell) expect(buys, id).toContain(id);
  });
});
