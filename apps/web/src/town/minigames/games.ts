import { h } from '../../shared/ui/dom';
import type { View } from '../ui/view';

/** What a mini-game sheet needs: the view, the day (today's deal), and who to tell when it's done. */
export interface GameHost {
  view: View; day(): number;
  /** An item's name, for labels. */
  itemName(id: string): string;
  /** A finish, with its stars (1 to 3): returns the reward line (Sparkles the first time today). */
  finished(stars: number): string;
}

export const starLine = (n: number) => `${'⭐'.repeat(n)}${'☆'.repeat(3 - n)}`;

/** "Another one": closes this sheet and deals a fresh round. */
export function againButton(view: View, label: string, again: () => void) {
  const b = h('button', { class: 'btn small', type: 'button' }, label);
  b.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); again(); });
  return b;
}
