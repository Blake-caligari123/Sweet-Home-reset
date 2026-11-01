import { h } from '../../shared/ui/dom';
import { againButton, starLine, type GameHost } from './games';
import { markerAt, skipsFor, skipStars, sweetSpot, THROWS } from './skip';

/** Otto's stone skipping: tap Throw! as the marker crosses the sweet spot. Three throws; the best counts. */
export function openSkip(d: GameHost, round = 0) {
  const { view } = d;
  const day = d.day() + round * 7;
  let throwNo = 0; let best = 0; let start = performance.now(); let raf = 0; let pos = 0;
  const sweet = h('div', { class: 'skip-sweet' });
  const marker = h('div', { class: 'skip-marker' });
  const bar = h('div', { class: 'skip-bar', 'aria-hidden': 'true' }, sweet, marker);
  const water = h('p', { class: 'skip-water', 'aria-live': 'polite' }, '〰〰〰〰〰');
  const status = h('p', { class: 'friend-name' }, `Throw 1 of ${THROWS}`);
  const btn = h('button', { class: 'btn big primary', type: 'button' }, 'Throw!');
  const place = () => { const c = sweetSpot(day, throwNo); Object.assign(sweet.style, { left: `${(c - 0.07) * 100}%`, width: '14%' }); };
  const tick = () => {
    if (!bar.isConnected && throwNo > 0) return;
    pos = markerAt(performance.now() - start, throwNo);
    marker.style.left = `calc(${pos * 100}% - 3px)`;
    raf = requestAnimationFrame(tick);
  };
  btn.addEventListener('click', () => {
    if (throwNo >= THROWS) return;
    cancelAnimationFrame(raf);
    const skips = skipsFor(pos, sweetSpot(day, throwNo));
    best = Math.max(best, skips);
    water.textContent = `${'💦'.repeat(skips)}`;
    view.feedback(skips >= 8 ? 'combo' : 'boing', skips >= 8 ? 'success' : 'light');
    throwNo += 1;
    if (throwNo < THROWS) {
      status.textContent = `${skips} skip${skips === 1 ? '' : 's'}! Throw ${throwNo + 1} of ${THROWS}`;
      btn.disabled = true;
      window.setTimeout(() => { btn.disabled = false; place(); start = performance.now(); raf = requestAnimationFrame(tick); }, 900);
      return;
    }
    const stars = skipStars(best);
    view.feedback('fanfare', 'success');
    btn.remove();
    status.textContent = `Best: ${best} skips  ${starLine(stars)}  ${d.finished(stars)}`;
    status.after(againButton(view, 'Skip again', () => openSkip(d, round + 1)));
  });
  place();
  view.sheet('🪨 Skip stones', [h('p', { class: 'muted' }, 'Tap Throw! when the marker is in the green.'), bar, water, status, btn], () => cancelAnimationFrame(raf));
  raf = requestAnimationFrame(tick);
}
