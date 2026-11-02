import { h } from '../../shared/ui/dom';
import { itemIcon } from '../ui/hud';
import { againButton, starLine, type GameHost } from './games';
import { basket, PANTRY_SET, pantryStars, shelfIn, type SortSet } from './pantry';

/** Hazel's pantry: each thing from the basket onto its shelf. A run of right ones builds a combo. */
export function openPantry(d: GameHost, round = 0, set: SortSet = PANTRY_SET) {
  const { view } = d;
  const items = basket(d.day(), round, set);
  let at = 0; let slips = 0; let run = 0;
  const shown = h('div', { class: 'pantry-item' });
  const label = h('p', { class: 'muted' }, '');
  const count = h('p', { class: 'friend-name' }, '');
  const status = h('p', { class: 'muted' }, '');
  const filled: Record<string, HTMLElement> = Object.fromEntries(set.shelves.map((s) => [s.id, h('div', { class: 'pantry-row' })]));
  const buttons = set.shelves.map(({ id: sh, label }) => {
    const b = h('button', { class: 'btn pantry-shelf', type: 'button' }, label, filled[sh]);
    b.addEventListener('click', () => put(sh, b));
    return b;
  });
  const draw = () => {
    shown.replaceChildren(at < items.length ? itemIcon(items[at], 4) : h('span', {}, '🧺'));
    label.textContent = at < items.length ? d.itemName(items[at]) : '';
    count.textContent = at < items.length ? `${at + 1} of ${items.length}` : 'All put away!';
    status.textContent = run >= 3 ? `Combo ×${run}!` : slips ? `Slips: ${slips}` : '';
  };
  const put = (sh: string, b: HTMLElement) => {
    if (at >= items.length) return;
    const item = items[at];
    if (shelfIn(set, item) !== sh) {
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
      status.after(againButton(view, set.again, () => openPantry(d, round + 1, set)));
    }
  };
  draw();
  view.sheet(set.title, [h('p', { class: 'muted' }, set.intro), shown, label, count, h('div', { class: 'pantry', style: { gridTemplateColumns: `repeat(${set.shelves.length}, 1fr)` } }, ...buttons), status]);
}
