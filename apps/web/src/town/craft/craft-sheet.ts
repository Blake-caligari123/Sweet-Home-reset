import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { View } from '../ui/view';
import { openCooking } from './cook-sheet';
import { stepsFor } from './cook-steps';
import { canCraft, craft, sparkleCost, type RecipeDef } from './recipes';

const STATIONS = {
  bench: { title: 'Pip\'s workbench', note: 'Tools and furniture. Twigs and pebbles turn up outside each morning.', none: 'craft.none' },
  kitchen: { title: 'Kitchen', note: 'Cook what you grow. Dishes are hearty snacks and lovely gifts.', none: 'cook.none' }
};

/** Pip's workbench or Puff's kitchen: each recipe known there, what it needs (and how many Puff has), and Make. */
export function openWorkbench(d: { state: TownState; view: View; content: Content; refreshHud(): void; save(): void; made(station: 'bench' | 'kitchen'): void; tapOnly: boolean }, station: NonNullable<RecipeDef['station']> = 'bench') {
  const { state, view, content } = d;
  const where = STATIONS[station];
  const known = (content.pack.recipes ?? []).filter((r) => (r.station ?? 'bench') === station && canCraft(state, r) !== 'unknown');
  if (!known.length) { view.say(content.line(where.none) ?? ''); return; }
  let close = () => {};
  const rows = known.map((r) => {
    const status = canCraft(state, r);
    const needs = [...(r.cost.sparkles ? [`${sparkleCost(state, r)} ✨`] : []), ...Object.entries(r.cost.items ?? {}).map(([id, n]) => `${content.itemName(id)} ${Math.min(state.bag.count(id), n)}/${n}`)].join(' · ');
    const btn = h('button', { class: 'btn small primary', type: 'button' }, status === 'have' ? 'Made ✓' : status === 'full' ? 'Bag\'s full' : station === 'kitchen' ? 'Cook' : 'Make');
    if (status !== 'ok') btn.setAttribute('disabled', '');
    const make = () => {
      if (!craft(state, r)) return;
      view.feedback('fanfare', 'success');
      view.banner(`${r.name}!`);
      const line = station === 'kitchen' ? content.line('cook.made') : 'tool' in r.makes ? content.line('craft.made')?.replace('{tool}', r.name) : content.line('craft.made_decor')?.replace('{item}', r.name);
      view.say(line ?? '');
      d.made(station); d.refreshHud(); d.save();
    };
    btn.addEventListener('click', () => {
      view.uiTap();
      close();
      // In the kitchen, the dish is cooked by hand first (chop, stir, knead).
      if (station === 'kitchen') openCooking(view, r.name.toLowerCase(), stepsFor(r, d.tapOnly), d.tapOnly, make);
      else make();
    });
    return h('div', { class: 'note' }, h('div', { class: 'shop-row' }, itemIcon('item' in r.makes ? r.makes.item : r.id), h('span', { class: 'shop-name' }, r.name)), h('p', { class: 'muted' }, needs), btn);
  });
  close = view.sheet(where.title, [h('p', { class: 'muted' }, where.note), h('div', { class: 'board' }, ...rows)]);
}
