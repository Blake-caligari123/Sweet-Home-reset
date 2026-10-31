import { h } from '../../shared/ui/dom';
import type { View } from '../ui/view';
import type { TownState } from '../state';
import type { NeedDef } from './needs';

/** Pause → Town: today's café line (if any), what the town needs (met ✓, or a hint how), and the town fund. */
export function openNeeds(view: View, state: TownState, needs: NeedDef[], cafe: string | null = null) {
  const rows = needs.map((n) => {
    const met = state.needsMet.includes(n.id);
    return h('div', { class: 'note' }, h('p', { class: 'friend-name' }, `${met ? '✓ ' : ''}${n.name}`), h('p', { class: 'muted' }, met ? 'Done! The town loves it.' : n.hint));
  });
  view.sheet('Town needs', [
    ...(cafe ? [h('p', { class: 'note' }, cafe)] : []),
    h('p', {}, `Town fund: ${state.fund} ✨`),
    h('p', { class: 'muted' }, 'Everyone chips in each morning, more when they\'re happy. The fund helps pay for big projects.'),
    h('div', { class: 'board' }, ...rows)
  ]);
}
