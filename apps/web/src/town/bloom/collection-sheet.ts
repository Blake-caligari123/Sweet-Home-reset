import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { pixelImage } from '../../shared/ui/pixel-image';
import { itemIcon } from '../ui/hud';
import { drawCritter } from '../world/art/critters';
import type { View } from '../ui/view';

/**
 * The Collection (Pause → Collection, and Moss's table): every surprise find with its little story,
 * whose it is and whether it's been shown to them; the ones still out there as "?" with a hint of where.
 * Then the Critter journal: each critter spotted, and where and when to look for the rest.
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
  const critters = content.pack.critters ?? [];
  const seen = critters.filter((c) => state.critters.includes(c.id)).length;
  const critterRows = critters.map((c) => {
    const have = state.critters.includes(c.id);
    return h('div', { class: 'friend' },
      h('div', { class: 'bag-slot', 'aria-hidden': 'true' }, have ? pixelImage(drawCritter(c.kind, c.colour, 0), 3) : h('b', { style: { position: 'static', fontSize: '1.2rem' } }, '?')),
      h('div', { class: 'friend-body' }, h('p', { class: 'friend-name' }, have ? c.name : 'Not spotted yet'), h('p', { class: 'muted' }, c.hint)));
  });
  view.sheet('Collection', [h('p', {}, `${found} of ${finds.length} found`), h('div', { class: 'friends' }, ...rows),
    h('p', { class: 'muted' }, 'Little treasures turn up while you tidy, all over town.'),
    ...(critters.length ? [h('h3', {}, `🐞 Critter journal · ${seen} of ${critters.length}`), h('div', { class: 'friends' }, ...critterRows),
      h('p', { class: 'muted' }, 'Tap a critter to spot it. They come and go with the seasons, the time and the weather.')] : [])]);
}
