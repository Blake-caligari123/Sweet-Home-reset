import { h } from '../../shared/ui/dom';
import { againButton, starLine, type GameHost } from './games';
import { allLit, dealLamps, lampStars, press } from './lamps';

/** Pip's lamps: tap a lamp to flip it and its neighbours, until every lamp glows. */
export interface LampsLook { title: string; intro: string; on: string; sea?: boolean }
const LAMPS: LampsLook = { title: '💡 Light the lamps', intro: 'Tapping a lamp flips it and the lamps beside it. Light them all!', on: '💡' };

export function openLamps(d: GameHost, round = 0, look: LampsLook = LAMPS) {
  const { view } = d;
  const board = dealLamps(d.day(), round);
  let lit = board.lit; let taps = 0;
  const grid = h('div', { class: 'lamps', role: 'group', 'aria-label': 'Lamps', style: { gridTemplateColumns: `repeat(${board.size}, 1fr)` } });
  const count = h('p', { class: 'friend-name' }, '');
  const status = h('p', { class: 'muted' }, `Can be done in ${board.par} taps`);
  const draw = () => {
    grid.replaceChildren(...lit.map((on, i) => {
      const el = h('button', { class: `lamp${on ? ' on' : ''}`, type: 'button', 'aria-label': `Lamp ${i + 1}, ${on ? 'lit' : 'dark'}` }, on ? look.on : '');
      el.addEventListener('click', () => tap(i));
      return el;
    }));
    count.textContent = `Lit: ${lit.filter(Boolean).length} of ${lit.length} · Taps: ${taps}`;
  };
  const tap = (i: number) => {
    if (allLit(lit)) return;
    const before = lit.filter(Boolean).length;
    lit = press(lit, board.size, i); taps += 1;
    view.feedback(lit.filter(Boolean).length > before ? 'sparkle' : 'fwip', 'light');
    draw();
    if (allLit(lit)) {
      const stars = lampStars(taps, board.par);
      view.feedback('fanfare', 'success');
      grid.classList.add('sorted');
      status.textContent = `${starLine(stars)}  ${d.finished(stars)}`;
      status.after(againButton(view, 'Another board', () => openLamps(d, round + 1, look)));
    }
  };
  draw();
  if (look.sea) grid.classList.add('sea');
  view.sheet(look.title, [h('p', { class: 'muted' }, look.intro), grid, count, status]);
}
