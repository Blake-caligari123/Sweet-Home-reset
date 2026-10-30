import { describe, expect, it, vi } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Content } from '../data/content';
import { TownState } from '../state';
import type { View } from '../ui/view';
import { CardHunt, cardFound, type CardDef } from './cards';
import type { RecipeDef } from './recipes';

const soup: RecipeDef = { id: 'soup', name: 'Soup', station: 'kitchen', makes: { item: 'soup', qty: 1 }, cost: {}, learn: 'card_soup' };
const card: CardDef = { recipe: 'soup', areas: ['store'], cleans: 3 };

describe('recipe cards under the mess', () => {
  it('turn up after enough cleans in their place, once', () => {
    const finds = { cleans: { store: 2 }, found: [] };
    expect(cardFound([card], [soup], 'store', finds, () => false)).toBeNull();
    finds.cleans.store = 3;
    expect(cardFound([card], [soup], 'lane', finds, () => false)).toBeNull();
    expect(cardFound([card], [soup], 'store', finds, () => false)).toBe(soup);
    expect(cardFound([card], [soup], 'store', finds, (f) => f === 'card_soup')).toBeNull();
  });

  it('teach their recipe in play, with a banner', () => {
    const state = new TownState();
    const view = { banner: vi.fn(), feedback: vi.fn() } as unknown as View;
    const hunt = new CardHunt({ state, content: new Content(pack, () => state.names), view });
    const c = pack.cards![0];
    state.finds.cleans[c.areas[0]] = c.cleans;
    hunt.hear({ type: 'cleared', mess: 'dust', area: c.areas[0] });
    const r = pack.recipes!.find((x) => x.id === c.recipe)!;
    expect(state.has(r.learn!)).toBe(true);
    expect(view.banner).toHaveBeenCalledOnce();
  });

  it('Hollowfern\'s cards each teach a real kitchen recipe for a snack', () => {
    for (const c of pack.cards!) {
      const r = pack.recipes!.find((x) => x.id === c.recipe);
      expect(r?.station, c.recipe).toBe('kitchen');
      expect(r?.learn, c.recipe).toBeTruthy();
      const item = r && 'item' in r.makes ? r.makes.item : '';
      expect(pack.items[item]?.snack, item).toBeGreaterThan(0);
    }
  });
});
