import { seeded } from '../../shared/art/pixel-canvas';
import { h } from '../../shared/ui/dom';
import type { View } from '../ui/view';
import { linesShown, tapStar, type Constellation } from './constellations';

const SVG = 'http://www.w3.org/2000/svg';

/** Through the telescope: tonight's bright stars among faint ones; tap them all and the shape joins up. */
export function openStars(view: View, c: Constellation, day: number, done: () => string) {
  let found: number[] = [];
  const sky = h('div', { class: 'star-sky', role: 'group', 'aria-label': 'The night sky' });
  const lines = document.createElementNS(SVG, 'svg');
  lines.setAttribute('viewBox', '0 0 20 14'); lines.setAttribute('class', 'star-lines'); lines.setAttribute('aria-hidden', 'true');
  sky.append(lines);
  // Faint stars all about, the same for this night.
  const r = seeded(day * 271 + 9);
  for (let i = 0; i < 28; i += 1) sky.append(h('i', { class: 'star-faint', style: { left: `${r() * 100}%`, top: `${r() * 100}%` } }));
  const status = h('p', { class: 'muted' }, `Find the ${c.stars.length} bright stars.`);
  const title = h('p', { class: 'star-name', 'aria-live': 'polite' }, '');
  const draw = () => {
    lines.replaceChildren(...linesShown(c, found).map(([a, b]) => {
      const l = document.createElementNS(SVG, 'line');
      l.setAttribute('x1', String(c.stars[a][0] + 0.5)); l.setAttribute('y1', String(c.stars[a][1] + 0.5));
      l.setAttribute('x2', String(c.stars[b][0] + 0.5)); l.setAttribute('y2', String(c.stars[b][1] + 0.5));
      return l;
    }));
  };
  c.stars.forEach(([x, y], i) => {
    const s = h('button', { class: 'star', type: 'button', 'aria-label': `Bright star ${i + 1}`, style: { left: `${((x + 0.5) / 20) * 100}%`, top: `${((y + 0.5) / 14) * 100}%` } });
    s.addEventListener('click', () => {
      if (found.includes(i)) return;
      const t = tapStar(found, i, c);
      found = t.found;
      s.classList.add('found');
      view.feedback('sparkle', 'light');
      draw();
      status.textContent = t.done ? '' : `${c.stars.length - found.length} to go...`;
      if (t.done) {
        sky.classList.add('done');
        view.feedback('chime', 'success');
        title.textContent = `✨ ${c.name} ✨`;
        status.textContent = done();
      }
    });
    sky.append(s);
  });
  view.sheet('🔭 Stargazing', [h('p', { class: 'muted' }, 'One shape is up tonight. Tap its bright stars.'), sky, title, status]);
}
