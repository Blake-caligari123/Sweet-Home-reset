import { clear, h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { OnboardEvent } from '../play/onboarding';
import { perkIn } from '../skills/skills';
import type { TownState } from '../state';
import { itemIcon } from './hud';
import type { View } from './view';

/** The bag: tap a snack to eat it (Fluff back), decor to place it, anything else to see where it lives. */
export function openBag(d: { state: TownState; view: View; content: Content; onboard(e: OnboardEvent): void; refreshHud(): void; place(id: string): void }) {
  const { state, view, content } = d;
  const grid = h('div', { class: 'bag-grid' });
  const info = h('p', { class: 'muted' }, 'Tap an item to see what it\'s for.');
  const render = () => {
    clear(grid);
    state.bag.slots.forEach((s) => {
      const cell = h('button', { class: 'bag-slot', type: 'button', 'aria-label': s ? `${content.itemName(s.id)}, ${s.count}` : 'Empty slot' }, s ? itemIcon(s.id) : '', s && s.count > 1 ? h('b', {}, String(s.count)) : '');
      if (s) cell.addEventListener('click', () => {
        const item = content.pack.items[s.id];
        if (item?.decor) { view.closeTopSheet(); d.place(s.id); return; }
        if (item?.snack) {
          const fluff = Math.round(item.snack * (1 + perkIn(state.skills, 'cooking')));
          state.bag.remove(s.id); state.fluff.eat(fluff);
          info.textContent = `Yum! +${fluff} Fluff.`; view.feedback('coin', 'light'); render();
          d.onboard({ type: 'ate', item: s.id }); d.refreshHud();
        } else info.textContent = item?.home ? `${item.name}: it lives in the ${item.home}.` : `${item?.name ?? s.id}.`;
      });
      grid.append(cell);
    });
  };
  // One tap tidies the bag: like with like, stacks merged, gaps at the end, each slot popping into place.
  const tidy = h('button', { class: 'btn small', type: 'button' }, '✨ Tidy up');
  tidy.addEventListener('click', () => {
    state.bag.tidy((id) => kindRank(content, id));
    render();
    grid.classList.remove('tidied'); void grid.offsetWidth; grid.classList.add('tidied');
    view.feedback('combo', 'light');
    info.textContent = 'All neat and tidy!';
  });
  render();
  view.sheet('Bag', [grid, tidy, info]);
}

/** Which shelf of the bag a thing goes on: decor, seeds, crops and fruit, cooking, fish, then building bits and treasures. */
function kindRank(content: Content, id: string) {
  const item = content.pack.items[id];
  const pack = content.pack;
  if (item?.decor) return 0;
  if (/_seeds$|_spores$/.test(id)) return 1;
  if ((pack.crops ?? []).some((c) => c.id === id) || ['apple', 'pear', 'plum', 'berries', 'mushroom'].includes(id)) return 2;
  if ((pack.recipes ?? []).some((r) => r.station === 'kitchen' && 'item' in r.makes && r.makes.item === id) || item?.snack) return 3;
  if ((pack.fish ?? []).some((f) => f.id === id)) return 4;
  if (['twig', 'pebble', 'ore_copper', 'ore_silver', 'shard_colour', 'gem_blue'].includes(id)) return 5;
  return 6;
}
