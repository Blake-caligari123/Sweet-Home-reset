import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { View } from '../ui/view';

/** The Finds book: every find in the pack, collected ones with their count, the rest as silhouettes. */
export function openFindsBook(d: { state: TownState; view: View; content: Content }) {
  const { state, view, content } = d;
  const finds = content.pack.finds ?? [];
  const got = state.rewards.finds;
  const grid = h('div', { class: 'bag-grid finds-grid' }, ...finds.map((f) => {
    const n = got[f.item] ?? 0;
    const name = n ? content.itemName(f.item) : 'Not found yet';
    return h('div', { class: `bag-slot find${n ? '' : ' unfound'}`, role: 'img', 'aria-label': n ? `${name}, ${n}` : name, title: name },
      itemIcon(f.item), n > 1 ? h('b', {}, String(n)) : '');
  }));
  const count = finds.filter((f) => got[f.item]).length;
  view.sheet('Finds book', [
    h('p', { class: 'muted' }, `${count} of ${finds.length} found. Cleaning turns up little treasures now and then.`),
    grid
  ]);
}
