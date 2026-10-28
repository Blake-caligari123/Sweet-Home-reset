import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { View } from '../ui/view';
import { canCraft, craft } from './recipes';

/** Pip's workbench: each recipe learned, what it needs (and how many Puff has), and Make. */
export function openWorkbench(d: { state: TownState; view: View; content: Content; refreshHud(): void; save(): void }) {
  const { state, view, content } = d;
  const known = (content.pack.recipes ?? []).filter((r) => canCraft(state, r) !== 'unknown');
  if (!known.length) { view.say(content.line('craft.none') ?? ''); return; }
  let close = () => {};
  const rows = known.map((r) => {
    const status = canCraft(state, r);
    const needs = [`${r.cost.sparkles ?? 0} ✨`, ...Object.entries(r.cost.items ?? {}).map(([id, n]) => `${content.itemName(id)} ${Math.min(state.bag.count(id), n)}/${n}`)].join(' · ');
    const btn = h('button', { class: 'btn small primary', type: 'button' }, status === 'have' ? 'Made ✓' : 'Make');
    if (status !== 'ok') btn.setAttribute('disabled', '');
    btn.addEventListener('click', () => {
      view.uiTap();
      if (!craft(state, r)) return;
      close();
      view.feedback('fanfare', 'success');
      view.banner(`${r.name}!`);
      view.say((content.line('craft.made') ?? '').replace('{tool}', r.name));
      d.refreshHud(); d.save();
    });
    return h('div', { class: 'note' }, h('div', { class: 'shop-row' }, itemIcon(r.id), h('span', { class: 'shop-name' }, r.name)), h('p', { class: 'muted' }, needs), btn);
  });
  close = view.sheet('Pip\'s workbench', [h('p', { class: 'muted' }, 'Twigs and pebbles turn up outside each morning.'), h('div', { class: 'board' }, ...rows)]);
}
