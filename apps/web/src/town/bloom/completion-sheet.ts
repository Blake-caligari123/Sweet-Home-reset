import { h } from '../../shared/ui/dom';
import type { TownPack } from '../data/area';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { completionParts, completionPct } from './completion';

/** Pause → 🏆: how complete the town is, one bar per part, each with a tick once it's full. */
export function openCompletion(view: View, state: TownState, pack: TownPack, town: string) {
  const parts = completionParts(state, pack);
  const pct = completionPct(parts);
  const rows = parts.map((p) => {
    const done = p.have >= p.total;
    return h('div', { class: `set-head${done ? ' done' : ''}` },
      h('p', { class: 'friend-name' }, `${p.icon} ${p.label} · ${p.have} of ${p.total}${done ? ' ✓' : ''}`),
      h('div', { class: 'set-bar', 'aria-hidden': 'true' }, h('i', { style: { width: `${(p.have / p.total) * 100}%` } })));
  });
  view.sheet(`🏆 ${town}: ${pct}%`, [
    h('div', { class: 'set-bar big', role: 'meter', 'aria-label': `${pct}% complete`, 'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('i', { style: { width: `${pct}%` } })),
    ...rows,
    h('p', { class: 'muted' }, 'Every part counts the same. Nothing here ever goes down.')
  ]);
}
