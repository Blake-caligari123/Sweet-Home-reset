import type { Content } from '../data/content';
import type { TownState } from '../state';
import type { View } from '../ui/view';

// Neighbour tokens (NEXT-PHASE §5.8, Blake: all the currencies, including neighbour tokens). Each
// job done for a neighbour earns one of their thank-you notes (💌); they trade them, in their own
// chat box, for something special they have. Fixed prices, nothing random.

/** Something a neighbour gives in return for their thank-you notes. */
export interface ThanksDef { item: string; qty: number; tokens: number }

export const tokensOf = (state: TownState, id: string) => state.tokens[id] ?? 0;
export function earnToken(state: TownState, id: string) { state.tokens[id] = tokensOf(state, id) + 1; }

/** Trade: all or nothing (enough notes and room in the bag). */
export function trade(state: TownState, id: string, t: ThanksDef) {
  if (tokensOf(state, id) < t.tokens || !state.bag.canAdd(t.item, t.qty)) return false;
  state.tokens[id] = tokensOf(state, id) - t.tokens;
  state.bag.add(t.item, t.qty);
  return true;
}

/** The chat-box buttons for what this neighbour offers, once Puff has any of their notes. */
export function tradeButtons(d: { state: TownState; content: Content; view: View; done(): void }, id: string) {
  const { state, content, view } = d;
  const have = tokensOf(state, id);
  if (!have) return [];
  return (content.neighbour(id)?.thanks ?? []).filter((t) => have >= t.tokens).map((t) => ({
    label: `${t.tokens} 💌 for ${t.qty > 1 ? `${t.qty} × ` : ''}${content.itemName(t.item).toLowerCase()}`,
    onClick: () => {
      if (!trade(state, id, t)) { view.say('Bag\'s full!'); return; }
      view.feedback('coin', 'success');
      view.banner(`💌 Traded for ${content.itemName(t.item).toLowerCase()}! ${tokensOf(state, id)} 💌 left with ${content.neighbour(id)?.name ?? ''}.`);
      d.done();
    }
  }));
}
