import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { pixelImage } from '../../shared/ui/pixel-image';
import { itemIcon } from '../ui/hud';
import { drawCritter } from '../world/art/critters';
import type { View } from '../ui/view';
import { collectionSets, type CollectionSet } from './sets';
import { CONSTELLATIONS } from '../stars/constellations';

/**
 * The Collection (Pause → Collection, and Moss's table): every surprise find with its little story,
 * whose it is and whether it's been shown to them; the ones still out there as "?" with a hint of where.
 * Then the Critter journal: each critter spotted, and where and when to look for the rest.
 */
export function openCollection(view: View, content: Content, state: TownState) {
  const finds = content.pack.finds ?? [];
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
  const critterRows = critters.map((c) => {
    const have = state.critters.includes(c.id);
    return h('div', { class: 'friend' },
      h('div', { class: 'bag-slot', 'aria-hidden': 'true' }, have ? pixelImage(drawCritter(c.kind, c.colour, 0), 3) : h('b', { style: { position: 'static', fontSize: '1.2rem' } }, '?')),
      h('div', { class: 'friend-body' }, h('p', { class: 'friend-name' }, have ? c.name : 'Not spotted yet'), h('p', { class: 'muted' }, c.hint)));
  });
  // The fish log: every kind caught, and where (and when) to cast for the rest.
  const fishRows = (content.pack.fish ?? []).map((f) => {
    const have = state.fishLog.includes(f.id);
    const when = f.time === 'night' ? ', at night' : f.time === 'day' ? ', by day' : '';
    const seasons = f.seasons?.length ? ` (${f.seasons.join(', ').toLowerCase()})` : '';
    return h('div', { class: 'friend' },
      h('div', { class: 'bag-slot', 'aria-hidden': 'true' }, have ? itemIcon(f.id) : h('b', { style: { position: 'static', fontSize: '1.2rem' } }, '?')),
      h('div', { class: 'friend-body' }, h('p', { class: 'friend-name' }, have ? content.itemName(f.id) : 'Not caught yet'), h('p', { class: 'muted' }, `${places(f.areas)}${when}${seasons}`)));
  });
  // The harvest log: every kind of crop grown and picked, and when it grows.
  const cropRows = (content.pack.crops ?? []).map((c) => {
    const have = state.has(`grown_${c.id}`);
    const where = c.areas?.length ? `, only at ${places(c.areas)}` : '';
    return h('div', { class: 'friend' },
      h('div', { class: 'bag-slot', 'aria-hidden': 'true' }, have ? itemIcon(c.id) : h('b', { style: { position: 'static', fontSize: '1.2rem' } }, '?')),
      h('div', { class: 'friend-body' }, h('p', { class: 'friend-name' }, have ? content.itemName(c.id) : 'Not grown yet'), h('p', { class: 'muted' }, `${(c.seasons ?? ['Spring']).join(', ')}${where}`)));
  });
  // The star book: constellations found through the telescope (stars/), and when to look for the rest.
  const starRows = CONSTELLATIONS.map((c) => {
    const have = state.starsSeen.includes(c.id);
    return h('div', { class: 'friend' },
      h('div', { class: 'bag-slot', 'aria-hidden': 'true' }, h('b', { style: { position: 'static', fontSize: '1.2rem' } }, have ? '⭐' : '?')),
      h('div', { class: 'friend-body' }, h('p', { class: 'friend-name' }, have ? c.name : 'Not found yet'), h('p', { class: 'muted' }, c.seasons ? `Up in ${c.seasons.join(' and ').toLowerCase()}` : 'Up all year')));
  });
  const sets = collectionSets(state, content.pack);
  const head = (id: CollectionSet['id'], icon: string) => {
    const set = sets.find((x) => x.id === id)!;
    const done = set.have >= set.total && set.total > 0;
    return h('div', { class: `set-head${done ? ' done' : ''}` },
      h('h3', {}, `${icon} ${set.name} · ${set.have} of ${set.total}`),
      h('div', { class: 'set-bar', 'aria-hidden': 'true' }, h('i', { style: { width: `${set.total ? (set.have / set.total) * 100 : 0}%` } })),
      done ? h('p', { class: 'set-stamp' }, '✓ Complete!') : '');
  };
  view.sheet('Collection', [
    head('finds', '🔍'), h('div', { class: 'friends' }, ...rows), h('p', { class: 'muted' }, 'Little treasures turn up while you tidy, all over town.'),
    ...(critters.length ? [head('critters', '🐞'), h('div', { class: 'friends' }, ...critterRows), h('p', { class: 'muted' }, 'Tap a critter to spot it. They come and go with the seasons, the time and the weather.')] : []),
    ...(fishRows.length ? [head('fish', '🐟'), h('div', { class: 'friends' }, ...fishRows), h('p', { class: 'muted' }, 'Each fishing spot has its own catch. Some only bite at night.')] : []),
    ...(cropRows.length ? [head('harvest', '🥕'), h('div', { class: 'friends' }, ...cropRows), h('p', { class: 'muted' }, 'Grow each crop and pick it once to fill the log.')] : []),
    h('div', { class: 'set-head' }, h('h3', {}, `🔭 Star book · ${state.starsSeen.length} of ${CONSTELLATIONS.length}`)), h('div', { class: 'friends' }, ...starRows),
    h('p', { class: 'muted' }, 'Look through a telescope after 8 pm. The Wandering Cart sometimes has one.')]);
}
