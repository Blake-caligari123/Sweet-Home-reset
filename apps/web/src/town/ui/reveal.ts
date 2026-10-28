import { makeClip, shareFile } from '../../shared/share/clip';
import { h } from '../../shared/ui/dom';
import type { Area } from '../data/area';
import { bakeArea } from '../world/bake';
import { drawMess } from '../world/art/items';
import { T } from '../world/art/texture';
import type { View } from './view';

/** After a home is restored: offer a before-and-after clip, made on the device (GDD v3 A2, A11.5). */
export function offerClip(view: View, area: Area, first: boolean) {
  let file: File | null = null;
  view.hold();
  const status = h('p', {}, first ? 'Your first reset! Save or share it?' : `${area.pack.name} is sparkling. Save or share it?`);
  const make = h('button', { class: 'btn primary', type: 'button' }, '🎬 Make my clip');
  const later = h('button', { class: 'btn', type: 'button', 'data-close': '' }, 'Not now');
  const sheet = h('div', { class: 'scrim', 'data-sheet': '' }, h('div', { class: 'panel sheet' }, h('h2', {}, 'Before and after'), status, h('div', { class: 'btn-row', style: { width: '100%' } }, make, later)));
  const close = () => { sheet.remove(); view.release(); };
  later.addEventListener('click', () => { view.uiTap(); close(); });
  make.addEventListener('click', async () => {
    view.uiTap();
    if (file) { await shareFile(file, `I restored ${area.pack.name} in Hollowfern ✨ #SweetHomeReset`); return; }
    make.disabled = true; make.textContent = 'Making your clip…';
    try {
      const { before, after } = beforeAfter(area);
      file = await makeClip({ before, after, title: area.pack.name, outfit: null });
      make.textContent = '📤 Share my clip';
    } catch { make.textContent = 'Clip didn\'t work this time'; }
    make.disabled = false;
  });
  view.root.append(sheet);
}

/** The area as it started (grey, every mess spot) and as it is now. */
function beforeAfter(area: Area) {
  const { colour, drained } = bakeArea(area);
  const before = drained.clone();
  area.spots.forEach((m, i) => before.draw(drawMess(m.type, i, m.item), m.x * T, m.y * T));
  return { before, after: colour.clone() };
}
