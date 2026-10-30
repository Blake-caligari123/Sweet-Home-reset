import type { Finds } from '../bloom/bloom';
import type { Content } from '../data/content';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { RecipeDef } from './recipes';

// Recipe cards hidden under mess (NEXT-PHASE §5.1: hidden things under mess; §5.7: recipes from
// cards found while tidying). Each waits in a place until enough of its mess is cleared there,
// then turns up and teaches its recipe for good.

/** A card: the recipe it teaches, where it hides, and how many cleans there turn it up. */
export interface CardDef { recipe: string; areas: string[]; cleans: number }

/** The card that turns up after a clean in `area`, if any (one at a time, never one already learned). */
export function cardFound(cards: CardDef[], recipes: RecipeDef[], area: string, finds: Finds, has: (flag: string) => boolean) {
  const cleans = finds.cleans[area] ?? 0;
  return cards.map((c) => ({ c, r: recipes.find((r) => r.id === c.recipe) }))
    .find(({ c, r }) => r?.learn && !has(r.learn) && c.areas.includes(area) && cleans >= c.cleans)?.r ?? null;
}

/** Hears each cleared spot (through the guide) and turns up a card when one is due. */
export class CardHunt {
  constructor(private host: { state: TownState; content: Content; view: View }) {}

  hear(e: OnboardEvent) {
    if (e.type !== 'cleared') return;
    const { state, content, view } = this.host;
    const r = cardFound(content.pack.cards ?? [], content.pack.recipes ?? [], e.area, state.finds, (f) => state.has(f));
    if (!r?.learn) return;
    state.flag(r.learn);
    view.feedback('chime', 'success');
    view.banner(`📜 A recipe card under the mess: ${r.name}! Cook it in the kitchen.`);
  }
}
