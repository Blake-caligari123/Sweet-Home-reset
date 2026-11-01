import { h } from '../../shared/ui/dom';
import { itemIcon } from '../ui/hud';
import { againButton, starLine, type GameHost } from './games';
import { allMatched, dealPairs, flipBack, newPairs, pairStars, turn } from './pairs';

/** Bea's garden pairs: turn two cards; matches stay up, misses go back after a peek. */
export function openPairs(d: GameHost, round = 0) {
  const { view } = d;
  let s = newPairs(dealPairs(d.day(), round));
  const pairs = s.cards.length / 2;
  const grid = h('div', { class: 'pairs', role: 'group', 'aria-label': 'Cards' });
  const count = h('p', { class: 'friend-name' }, `Pairs: 0 of ${pairs}`);
  const status = h('p', { class: 'muted' }, 'Misses: 0');
  let waiting = 0;
  const draw = () => {
    grid.replaceChildren(...s.cards.map((c, i) => {
      const up = s.matched[i] || s.up.includes(i);
      const el = h('button', { class: `card${up ? ' up' : ''}${s.matched[i] ? ' matched' : ''}`, type: 'button', 'aria-label': up ? d.itemName(c) : 'Face-down card' },
        up ? itemIcon(c, 3) : h('span', { 'aria-hidden': 'true' }, '🌱'));
      el.addEventListener('click', () => tap(i));
      return el;
    }));
    count.textContent = `Pairs: ${s.matched.filter(Boolean).length / 2} of ${pairs}`;
    status.textContent = `Misses: ${s.misses}`;
  };
  const tap = (i: number) => {
    if (waiting) { window.clearTimeout(waiting); waiting = 0; s = flipBack(s); }
    const r = turn(s, i);
    if (r.result === 'none') return;
    s = r.state;
    view.feedback(r.result === 'match' ? 'sparkle' : r.result === 'miss' ? 'pff' : 'fwip', r.result === 'match' ? 'light' : null);
    if (r.result === 'miss') waiting = window.setTimeout(() => { waiting = 0; s = flipBack(s); draw(); }, 800);
    draw();
    if (allMatched(s)) {
      const stars = pairStars(s.misses, pairs);
      view.feedback('fanfare', 'success');
      grid.classList.add('sorted');
      status.textContent = `${starLine(stars)}  ${d.finished(stars)}`;
      status.after(againButton(view, 'Deal again', () => openPairs(d, round + 1)));
    }
  };
  draw();
  view.sheet('🌱 Garden pairs', [h('p', { class: 'muted' }, 'Turn two cards at a time to find the pairs.'), grid, count, status]);
}
