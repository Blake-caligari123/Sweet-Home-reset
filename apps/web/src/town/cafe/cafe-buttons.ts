import { canCraft } from '../craft/recipes';
import type { Content } from '../data/content';
import { earnToken } from '../neighbours/tokens';
import type { TownState } from '../state';
import type { Button, View } from '../ui/view';
import { cafePrice, stillWanted, supply } from './cafe';

export interface CafeHost { state: TownState; content: Content; view: View; day(): number; changed(): void }

/** The dishes Puff can cook now (known kitchen recipes that make something). */
export function knownDishes(state: TownState, content: Content) {
  return (content.pack.recipes ?? []).filter((r) => r.station === 'kitchen' && 'item' in r.makes && canCraft(state, r) !== 'unknown')
    .map((r) => ('item' in r.makes ? r.makes.item : ''));
}

/** In the café keeper's chat: a button for each of today's orders Puff has in the bag. */
export function cafeButtons(h: CafeHost, id: string): Button[] {
  const { state, content, view } = h;
  const cafe = content.pack.cafe;
  if (!cafe || cafe.keeper !== id || h.day() < cafe.fromDay) return [];
  const day = h.day();
  return stillWanted(state.cafe, day, knownDishes(state, content)).filter((d) => state.bag.count(d) > 0).map((dish) => {
    const price = cafePrice(content.pack.items[dish]?.sell ?? 0);
    return { label: `☕ Café order: ${content.itemName(dish).toLowerCase()} (+${price} ✨)`, onClick: () => {
      if (!state.bag.remove(dish)) return;
      state.cafe = supply(state.cafe, day, dish);
      state.sparkles += price;
      earnToken(state, id);
      view.feedback('coin', 'success');
      view.banner(`☕ Served at the café! +${price} ✨ +1 💌`);
      h.changed();
    } };
  });
}

/** What the café wants today, for the keeper's hello (null before it opens or with nothing to cook). */
export function cafeWants(h: CafeHost) {
  const { state, content } = h;
  const cafe = content.pack.cafe;
  if (!cafe || h.day() < cafe.fromDay) return null;
  const wants = stillWanted(state.cafe, h.day(), knownDishes(state, content));
  return wants.length ? wants.map((d) => content.itemName(d).toLowerCase()).join(' and ') : null;
}
