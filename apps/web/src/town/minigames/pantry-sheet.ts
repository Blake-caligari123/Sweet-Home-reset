import { h } from '../../shared/ui/dom';
import { itemIcon } from '../ui/hud';
import { againButton, starLine, type GameHost } from './games';
import { basket, pantryStars, shelfOf, SHELVES, type Shelf } from './pantry';

const LABELS: Record<Shelf, string> = { fruit: '🍎 Fruit', veg: '🥕 Veg', baking: '🍞 Baking' };

/** Hazel's pantry: each thing from the basket onto its shelf. A run of right ones builds a combo. */
export function openPantry(d: GameHost, round = 0) {
  const { view } = d;
  const items = basket(d.day(), round);
  let at = 0; let slips = 0; let run = 0;
  const shown = h('div', { class: 'pantry-item' });
  const label = h('p', { class: 'muted' }, '');
  const count = h('p', { class: 'friend-name' }, '');
  const status = h('p', { class: 'muted' }, '');
  const filled: Record<Shelf, HTMLElement> = { fruit: h('div', { class: 'pantry-row' }), veg: h('div', { class: 'pantry-row' }), baking: h('div', { class: 'pantry-row' }) };
  const buttons = SHELVES.map((sh) => {
    const b = h('button', { class: 'btn pantry-shelf', type: 'button' }, LABELS[sh], filled[sh]);
    b.addEventListener('click', () => put(sh, b));
    return b;
  });
  const draw = () => {
    shown.replaceChildren(at < items.length ? itemIcon(items[at], 4) : h('span', {}, '🧺'));
    label.textContent = at < items.length ? d.itemName(items[at]) : '';
    count.textContent = at < items.length ? `${at + 1} of ${items.length}` : 'All put away!';
    status.textContent = run >= 3 ? `Combo ×${run}!` : slips ? `Slips: ${slips}` : '';
  };
  const put = (sh: Shelf, b: HTMLElement) => {
    if (at >= items.length) return;
    const item = items[at];
    if (shelfOf(item) !== sh) {
      slips += 1; run = 0;
      view.feedback('pff', null);
      b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
      draw(); return;
    }
    run += 1; at += 1;
    filled[sh].append(itemIcon(item, 1));
    view.feedback(run >= 3 ? 'combo' : 'pop', 'light');
    draw();
    if (at >= items.length) {
      const stars = pantryStars(slips);
      view.feedback('fanfare', 'success');
      status.textContent = `${starLine(stars)}  ${d.finished(stars)}`;
      status.after(againButton(view, 'Another basket', () => openPantry(d, round + 1)));
    }
  };
  draw();
  view.sheet('🧺 Sort the pantry', [h('p', { class: 'muted' }, 'Pop each thing on its shelf.'), shown, label, count, h('div', { class: 'pantry' }, ...buttons), status]);
}
