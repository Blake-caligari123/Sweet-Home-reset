import { animalFlag } from '../farm/animals';
import { seasonOf } from '../play/clock';
import { perkIn } from '../skills/skills';
import type { TownPack } from '../data/area';
import type { TownState } from '../state';

// Shops (GDD v3 Part B "Economy and shop"): fixed prices from the pack, opening hours, nothing
// random for sale, and Sparkles are only ever earned by playing. A shop can also buy back crops.
export interface StockEntry {
  item: string;
  price: number;
  /** item (default): `qty` of it into the bag. bag: `slots` more bag slots. recipe: learned (`recipe_<item>`). animal: moves into the farm (farm/animals.ts). */
  kind?: 'item' | 'bag' | 'recipe' | 'animal';
  qty?: number;
  slots?: number;
  /** On the shelf from this day. */
  fromDay?: number;
  /** Only once this save flag is set (the big bag after the small one). */
  requires?: string;
  /** Only in these seasons (seeds for what grows now). */
  seasons?: string[];
}

export interface ShopDef {
  id: string; name: string;
  /** A neighbour who runs it (Browse button in their chat box); else a shop counter prop. */
  keeper?: string;
  /** Game minutes from midnight. */
  opens: number; closes: number;
  openFromDay?: number;
  stock: StockEntry[];
  /** Items it buys back, at each item's `sell` price. */
  buys?: string[];
  /** A travelling shop (the Wandering Cart): here every `every` days from `from`, its cart at this spot. */
  visits?: { every: number; from: number; area: string; x: number; y: number };
}

/** Whether a travelling shop is in town today (a shop without visits always is). */
export const visitingToday = (shop: ShopDef, day: number) => !shop.visits || (day >= shop.visits.from && (day - shop.visits.from) % shop.visits.every === 0);

/** An area with today's travelling carts set up in it. */
export function withCarts<A extends { id: string; props: unknown[] }>(pack: A, shops: ShopDef[], day: number): A {
  const carts = shops.filter((s) => s.visits?.area === pack.id && visitingToday(s, day)).map((s) => ({ type: 'trader_cart', x: s.visits!.x, y: s.visits!.y, w: 2, action: 'shop', shop: s.id }));
  return carts.length ? { ...pack, props: [...pack.props, ...carts] } : pack;
}

export interface ShopContext { state: TownState; minutes: number; day: number; items: TownPack['items'] }
export type ShopResult = { ok: true } | { ok: false; reason: 'closed' | 'sparkles' | 'bag' | 'gone' };

/** Bag upgrades and recipes are bought once; this flag remembers. */
const boughtFlag = (shop: ShopDef, e: StockEntry) => `bought_${shop.id}_${e.item}`;
const once = (e: StockEntry) => e.kind === 'bag' || e.kind === 'recipe' || e.kind === 'animal';

export function isOpen(shop: ShopDef, minutes: number, day: number) {
  return day >= (shop.openFromDay ?? 1) && visitingToday(shop, day) && minutes >= shop.opens && minutes < shop.closes;
}

/** What's on the shelf today. */
export function stockToday(shop: ShopDef, day: number, flags: string[]) {
  return shop.stock.filter((e) => day >= (e.fromDay ?? 1) && (!e.seasons || e.seasons.includes(seasonOf(day))) && (!e.requires || flags.includes(e.requires)) && !(once(e) && flags.includes(boughtFlag(shop, e))));
}

export function buy(shop: ShopDef, e: StockEntry, c: ShopContext): ShopResult {
  const s = c.state;
  if (!isOpen(shop, c.minutes, c.day)) return { ok: false, reason: 'closed' };
  if (!stockToday(shop, c.day, s.flags).includes(e)) return { ok: false, reason: 'gone' };
  if (s.sparkles < e.price) return { ok: false, reason: 'sparkles' };
  const kind = e.kind ?? 'item';
  if (kind === 'item' && !s.bag.canAdd(e.item, e.qty ?? 1)) return { ok: false, reason: 'bag' };
  s.sparkles -= e.price;
  if (kind === 'item') s.bag.add(e.item, e.qty ?? 1);
  if (kind === 'bag') s.bag.grow(e.slots ?? 0);
  if (kind === 'recipe') s.flag(`recipe_${e.item}`);
  if (kind === 'animal') s.flag(animalFlag(e.item));
  if (once(e)) s.flag(boughtFlag(shop, e));
  return { ok: true };
}

/** Sell one of a crop back to the shop. */
/** What the shop pays for one: the item's price, plus Puff's farming perk. */
export function sellPrice(item: string, c: ShopContext) {
  const base = c.items[item]?.sell;
  return base ? Math.round(base * (1 + perkIn(c.state.skills, 'farming'))) : 0;
}

export function sell(shop: ShopDef, item: string, c: ShopContext): ShopResult {
  const price = sellPrice(item, c);
  if (!isOpen(shop, c.minutes, c.day)) return { ok: false, reason: 'closed' };
  if (!price || !(shop.buys ?? []).includes(item) || !c.state.bag.remove(item)) return { ok: false, reason: 'gone' };
  c.state.sparkles += price;
  return { ok: true };
}
