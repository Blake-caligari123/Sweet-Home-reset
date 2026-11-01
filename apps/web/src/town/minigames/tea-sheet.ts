import { h } from '../../shared/ui/dom';
import { againButton, starLine, type GameHost } from './games';
import { CUPS, judge, levelAfter, lineFor, teaStars } from './tea';

const SAY = { perfect: 'Just right!', close: 'Nearly!', off: 'Oops, a bit off.' } as const;

/** Mabel's tea: hold Pour, let go at the line. Three cups. */
export function openTea(d: GameHost, round = 0) {
  const { view } = d;
  const day = d.day() + round * 11;
  let cup = 0; let started = 0; let raf = 0; let level = 0; let pouring = false;
  const results: ('perfect' | 'close' | 'off')[] = [];
  const tea = h('div', { class: 'tea-fill' });
  const line = h('div', { class: 'tea-line' });
  const glass = h('div', { class: 'tea-cup', 'aria-hidden': 'true' }, tea, line);
  const status = h('p', { class: 'friend-name' }, `Cup 1 of ${CUPS}`);
  const btn = h('button', { class: 'btn big primary tea-pour', type: 'button' }, 'Hold to pour');
  const place = () => { line.style.bottom = `${lineFor(day, cup) * 100}%`; tea.style.height = '0%'; level = 0; };
  const tick = () => {
    if (!pouring) return;
    level = levelAfter(performance.now() - started, cup);
    tea.style.height = `${Math.min(1, level) * 100}%`;
    if (level > 1.05) { stop(); return; }
    raf = requestAnimationFrame(tick);
  };
  const start = (e: Event) => {
    e.preventDefault();
    if (pouring || cup >= CUPS || btn.disabled) return;
    pouring = true; started = performance.now();
    view.feedback('fwip', null);
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (!pouring) return;
    pouring = false; cancelAnimationFrame(raf);
    const r = judge(level, lineFor(day, cup));
    results.push(r);
    glass.classList.toggle('spilt', level > 1);
    view.feedback(r === 'perfect' ? 'combo' : r === 'close' ? 'pop' : 'pff', r === 'perfect' ? 'success' : null);
    cup += 1;
    if (cup < CUPS) {
      status.textContent = `${SAY[r]} Cup ${cup + 1} of ${CUPS}`;
      btn.disabled = true;
      window.setTimeout(() => { btn.disabled = false; glass.classList.remove('spilt'); place(); }, 900);
      return;
    }
    const stars = teaStars(results);
    view.feedback('fanfare', 'success');
    btn.remove();
    status.textContent = `${SAY[r]} ${starLine(stars)}  ${d.finished(stars)}`;
    status.after(againButton(view, 'Another pot', () => openTea(d, round + 1)));
  };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointerleave', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
  btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
  place();
  view.sheet('🫖 Pour the tea', [h('p', { class: 'muted' }, 'Hold to pour. Let go when the tea reaches the line.'), glass, status, btn], () => { pouring = false; cancelAnimationFrame(raf); });
}
