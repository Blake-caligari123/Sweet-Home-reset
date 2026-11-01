import { h } from '../../shared/ui/dom';
import { againButton, starLine, type GameHost } from './games';
import { inPlace, isSorted, par, shelfFor, stars, swap } from './shelf';

/** Book colours: rose, butter, sage, sky (the shelf runs in this order). */
const COLOURS = ['#e8a0a0', '#f2c879', '#a9cda0', '#9db8e0'];


/** Moss's shelf: tap a book, then another, to swap them. Books glow as they click into place. */
export function openShelf(d: GameHost, round = 0) {
  const { view } = d;
  let books = shelfFor(d.day(), round);
  const best = par(books);
  let swaps = 0; let picked = -1;
  const row = h('div', { class: 'shelf', role: 'group', 'aria-label': 'Bookshelf' });
  const status = h('p', { class: 'muted' }, `Fewest swaps: ${best}`);
  const count = h('p', { class: 'friend-name' }, 'Swaps: 0');
  const draw = () => {
    row.replaceChildren(...books.map((b, i) => {
      const el = h('button', {
        class: `book${inPlace(books, i) ? ' home' : ''}${picked === i ? ' picked' : ''}`, type: 'button',
        'aria-label': `Book ${i + 1}: ${['rose', 'yellow', 'green', 'blue'][b.colour]}, size ${b.height}`,
        style: { height: `${30 + b.height * 12}px`, backgroundColor: COLOURS[b.colour] }
      });
      el.addEventListener('click', () => tap(i));
      return el;
    }));
  };
  const tap = (i: number) => {
    if (isSorted(books)) return;
    if (picked < 0 || picked === i) { picked = picked === i ? -1 : i; view.feedback('tap', null); draw(); return; }
    const wasHome = books.filter((_, k) => inPlace(books, k)).length;
    books = swap(books, picked, i); picked = -1; swaps += 1;
    count.textContent = `Swaps: ${swaps}`;
    const home = books.filter((_, k) => inPlace(books, k)).length;
    view.feedback(home > wasHome ? 'sparkle' : 'fwip', home > wasHome ? 'light' : null);
    draw();
    if (isSorted(books)) done();
  };
  const done = () => {
    const s = stars(swaps, best);
    view.feedback('fanfare', 'success');
    row.classList.add('sorted');
    status.textContent = `${starLine(s)}  ${d.finished(s)}`;
    status.after(againButton(view, 'Another shelf', () => openShelf(d, round + 1)));
  };
  draw();
  view.sheet('📚 Sort the shelf', [h('p', { class: 'muted' }, 'Tap two books to swap them. Colours in order, short to tall.'), row, count, status]);
}
