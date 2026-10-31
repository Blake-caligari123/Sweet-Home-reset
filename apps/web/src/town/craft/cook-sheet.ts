import { h } from '../../shared/ui/dom';
import type { View } from '../ui/view';
import { turnBetween, type CookStep } from './cook-steps';

const WORDS = {
  chop: { icon: '🔪', say: 'Chop! Tap the board quickly.', tap: 'Tap to chop' },
  stir: { icon: '🥄', say: 'Stir! Draw circles on the pot.', tap: 'Tap to stir' },
  knead: { icon: '🫓', say: 'Knead! Press and hold the dough.', tap: 'Tap to knead' }
} as const;

/** The cooking steps for one dish, one after another; `done` runs after the last. Closing cancels (nothing spent). */
export function openCooking(view: View, name: string, steps: CookStep[], tapOnly: boolean, done: () => void) {
  let i = 0; let got = 0;
  const title = h('p', { class: 'friend-name' }, '');
  const pad = h('div', { class: 'cook-pad', role: 'button', tabindex: '0', 'aria-label': '' }, '');
  const bar = h('span', { style: { width: '0%' } });
  let close = () => {};
  const show = () => {
    const w = WORDS[steps[i].gesture];
    title.textContent = `Step ${i + 1} of ${steps.length}: ${tapOnly ? w.tap : w.say}`;
    pad.textContent = w.icon; pad.setAttribute('aria-label', tapOnly ? w.tap : w.say);
    bar.style.width = `${Math.min(100, (got / steps[i].need) * 100)}%`;
  };
  const add = (n: number) => {
    if (i >= steps.length) return; // already cooked: a last stir or hold still arriving
    got += n; bar.style.width = `${Math.min(100, (got / steps[i].need) * 100)}%`;
    if (got < steps[i].need) return;
    view.feedback('chime', 'light');
    i += 1; got = 0;
    if (i >= steps.length) { close(); done(); return; }
    show();
  };
  // Chop: each tap. Stir: turns around the pad's centre. Knead: time held. Tap-only: any tap.
  let last: { x: number; y: number } | null = null; let heldFrom = 0; let holdTimer = 0;
  pad.addEventListener('pointerdown', (e) => {
    const g = steps[i]?.gesture;
    if (!g) return;
    if (tapOnly || g === 'chop') { view.feedback('tap', 'light'); add(1); return; }
    pad.setPointerCapture(e.pointerId);
    last = { x: e.clientX, y: e.clientY };
    if (g === 'knead') {
      heldFrom = performance.now();
      const tick = () => { if (!heldFrom) return; const now = performance.now(); add(now - heldFrom); heldFrom = now; if (heldFrom) holdTimer = window.setTimeout(tick, 100); };
      holdTimer = window.setTimeout(tick, 100);
    }
  });
  pad.addEventListener('pointermove', (e) => {
    if (!last || steps[i]?.gesture !== 'stir') return;
    const r = pad.getBoundingClientRect();
    const turn = turnBetween(r.left + r.width / 2, r.top + r.height / 2, last, { x: e.clientX, y: e.clientY });
    last = { x: e.clientX, y: e.clientY };
    add(Math.abs(turn));
  });
  const stop = () => { last = null; heldFrom = 0; window.clearTimeout(holdTimer); };
  pad.addEventListener('pointerup', stop); pad.addEventListener('pointercancel', stop);
  pad.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && steps[i]) { e.preventDefault(); add(steps[i].need); } });
  show();
  close = view.sheet(`Cooking ${name}`, [title, pad, h('div', { class: 'heart-bar', style: { width: '100%' }, 'aria-hidden': 'true' }, bar),
    h('p', { class: 'muted' }, 'Close to stop: nothing is used until it\'s cooked.')]);
}
