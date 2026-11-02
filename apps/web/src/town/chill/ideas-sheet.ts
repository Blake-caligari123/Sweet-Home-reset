import { h } from '../../shared/ui/dom';
import type { View } from '../ui/view';

/** 🌿 Things to do: a short, timely list of cosy things on offer right now. */
export function openIdeas(view: View, lines: string[]) {
  view.sheet('🌿 Things to do', [
    h('p', { class: 'muted' }, 'No rush. Here\'s what\'s on, if you fancy it.'),
    h('ul', { class: 'morning-list ideas' }, ...lines.map((l) => h('li', {}, l)))
  ], undefined, 'Lovely');
}
