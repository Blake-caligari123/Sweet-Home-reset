import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { View } from '../ui/view';

/** Moss's collection table: every surprise find, with the ones still out there as a "?". */
export function openCollection(view: View, content: Content, state: TownState) {
  const finds = content.pack.finds ?? [];
  const found = finds.filter((f) => state.finds.found.includes(f.id)).length;
  const grid = h('div', { class: 'bag-grid' }, ...finds.map((f) => {
    const have = state.finds.found.includes(f.id);
    return h('div', { class: 'bag-slot', title: have ? f.name : 'Still to find', 'aria-label': have ? f.name : 'Still to find' }, have ? itemIcon(f.id) : h('b', { style: { position: 'static', fontSize: '1.2rem' } }, '?'));
  }));
  view.sheet('Moss\'s collection', [h('p', {}, `${found} of ${finds.length} found`), grid, h('p', { class: 'muted' }, 'Little treasures turn up while you tidy, all over town.')]);
}
