import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { View } from '../ui/view';

/**
 * The Collection (Pause → Collection, and Moss's table): every surprise find with its little story,
 * whose it is and whether it's been shown to them; the ones still out there as "?" with a hint of where.
 */
export function openCollection(view: View, content: Content, state: TownState) {
  const finds = content.pack.finds ?? [];
  const found = finds.filter((f) => state.finds.found.includes(f.id)).length;
  const places = (ids: string[]) => ids.map((id) => content.named(content.pack.areas.find((a) => a.id === id)?.name ?? id)).join(' or ');
  const rows = finds.map((f) => {
    const have = state.finds.found.includes(f.id);
    const owner = f.owner ? content.neighbour(f.owner)?.name : undefined;
    const status = !have ? `Somewhere in ${places(f.areas)}` : !owner ? 'A mystery. Whose was it?'
      : (state.finds.shown ?? []).includes(f.id) ? `Shown to ${owner} ✓` : `Belongs to ${owner}. Show them!`;
    return h('div', { class: 'friend' },
      h('div', { class: 'bag-slot', 'aria-hidden': 'true' }, have ? itemIcon(f.id) : h('b', { style: { position: 'static', fontSize: '1.2rem' } }, '?')),
      h('div', { class: 'friend-body' },
        h('p', { class: 'friend-name' }, have ? f.name : 'Still to find'),
        have ? h('p', {}, content.line(`find.${f.id}.about`) ?? '') : '',
        h('p', { class: 'muted' }, status)));
  });
  view.sheet('Collection', [h('p', {}, `${found} of ${finds.length} found`), h('div', { class: 'friends' }, ...rows),
    h('p', { class: 'muted' }, 'Little treasures turn up while you tidy, all over town.')]);
}
