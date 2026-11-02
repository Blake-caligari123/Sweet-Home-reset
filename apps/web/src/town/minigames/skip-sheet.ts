import { h } from '../../shared/ui/dom';
import { againButton, starLine, type GameHost } from './games';
import { markerAt, skipsFor, skipStars, sweetSpot, THROWS } from './skip';

/** Otto's stone skipping: tap Throw! as the marker crosses the sweet spot. Three throws; the best counts. */
export interface SkipLook { title: string; intro: string; button: string; unit: [string, string]; mark: string; again: string }
const STONES: SkipLook = { title: '🪨 Skip stones', intro: 'Tap Throw! when the marker is in the green.', button: 'Throw!', unit: ['skip', 'skips'], mark: '💦', again: 'Skip again' };

export function openSkip(d: GameHost, round = 0, look: SkipLook = STONES) {
  const { view } = d;
  const day = d.day() + round * 7;
  let throwNo = 0; let best = 0; let start = performance.now(); let raf = 0; let pos = 0;
  const sweet = h('div', { class: 'skip-sweet' });
  const marker = h('div', { class: 'skip-marker' });
  const bar = h('div', { class: 'skip-bar', 'aria-hidden': 'true' }, sweet, marker);
  const water = h('p', { class: 'skip-water', 'aria-live': 'polite' }, '〰〰〰〰〰');
  const status = h('p', { class: 'friend-name' }, `Go 1 of ${THROWS}`);
  const btn = h('button', { class: 'btn big primary', type: 'button' }, look.button);
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
    water.textContent = `${look.mark.repeat(skips)}`;
    view.feedback(skips >= 8 ? 'combo' : 'boing', skips >= 8 ? 'success' : 'light');
    throwNo += 1;
    if (throwNo < THROWS) {
      status.textContent = `${skips} ${look.unit[skips === 1 ? 0 : 1]}! Go ${throwNo + 1} of ${THROWS}`;
      btn.disabled = true;
      window.setTimeout(() => { btn.disabled = false; place(); start = performance.now(); raf = requestAnimationFrame(tick); }, 900);
      return;
    }
    const stars = skipStars(best);
    view.feedback('fanfare', 'success');
    btn.remove();
    status.textContent = `Best: ${best} ${look.unit[1]}  ${starLine(stars)}  ${d.finished(stars)}`;
    status.after(againButton(view, look.again, () => openSkip(d, round + 1, look)));
  });
  place();
  view.sheet(look.title, [h('p', { class: 'muted' }, look.intro), bar, water, status, btn], () => cancelAnimationFrame(raf));
  raf = requestAnimationFrame(tick);
}
