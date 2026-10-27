import { clear, h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { itemIcon } from './hud';
import type { View } from './view';

/** The bag: tap a snack to eat it (Fluff back), anything else to see where it lives. */
export function openBag(d: { state: TownState; view: View; content: Content; refreshHud(): void }) {
  const { state, view, content } = d;
  const grid = h('div', { class: 'bag-grid' });
  const info = h('p', { class: 'muted' }, 'Tap an item to see what it\'s for.');
  const render = () => {
    clear(grid);
    state.bag.slots.forEach((s) => {
      const cell = h('button', { class: 'bag-slot', type: 'button', 'aria-label': s ? `${content.itemName(s.id)}, ${s.count}` : 'Empty slot' }, s ? itemIcon(s.id) : '', s && s.count > 1 ? h('b', {}, String(s.count)) : '');
      if (s) cell.addEventListener('click', () => {
        const item = content.pack.items[s.id];
        if (item?.snack) {
          state.bag.remove(s.id); state.fluff.eat(item.snack);
          info.textContent = `Yum! +${item.snack} Fluff.`; view.feedback('coin', 'light'); render(); d.refreshHud();
        } else info.textContent = item?.home ? `${item.name}: it lives in the ${item.home}.` : `${item?.name ?? s.id}.`;
      });
      grid.append(cell);
    });
  };
  render();
  view.sheet('Bag', [grid, info]);
}
