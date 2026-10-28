import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { View } from '../ui/view';
import { goalLabel } from './goals';
import { xpToNext } from './level';
import { titleOf } from './rewards';

// The rewards' pages: the Finds book and Today.

/** The Finds book: every find in the pack, collected ones with their count, the rest as silhouettes. */
export function openFindsBook(d: { state: TownState; view: View; content: Content }) {
  const { state, view, content } = d;
  const finds = content.pack.finds ?? [];
  const got = state.rewards.finds;
  const grid = h('div', { class: 'bag-grid finds-grid' }, ...finds.map((f) => {
    const n = got[f.item] ?? 0;
    const name = n ? content.itemName(f.item) : 'Not found yet';
    return h('div', { class: `bag-slot find${n ? '' : ' unfound'}`, role: 'img', 'aria-label': n ? `${name}, ${n}` : name, title: name },
      itemIcon(f.item), n > 1 ? h('b', {}, String(n)) : '');
  }));
  const count = finds.filter((f) => got[f.item]).length;
  view.sheet('Finds book', [
    h('p', { class: 'muted' }, `${count} of ${finds.length} found. Cleaning turns up little treasures now and then.`),
    grid
  ]);
}

/** Today: Puff's level and title, today's goals, and the Cosy Days count. */
export function openToday(d: { state: TownState; view: View; content: Content }) {
  const { state, view, content } = d;
  const r = state.rewards;
  const need = xpToNext(r.level);
  const level = h('div', { class: 'note' },
    h('strong', {}, `Level ${r.level}: ${titleOf(content, r.level)}`),
    h('div', { class: 'heart-bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${(r.xp / need) * 100}%` } })),
    h('span', { class: 'muted' }, `${need - r.xp} more sparkle points to level ${r.level + 1}.`));
  const goals = r.goals.goals.map((g, i) => {
    const done = r.goals.progress[i] >= g.target;
    return h('div', { class: `note goal${done ? ' done' : ''}` }, h('strong', {}, `${done ? '★' : '☆'} ${goalLabel(g)}`), h('span', { class: 'muted' }, done ? 'Done!' : `${r.goals.progress[i]} of ${g.target}`));
  });
  view.sheet('Today', [
    level,
    ...(goals.length ? goals : [h('p', { class: 'muted' }, 'Goals start tomorrow. Settle in first!')]),
    h('p', { class: 'muted' }, `Cosy Days: ${r.cosyDays}. Any day with a goal done counts, and it never goes down.`)
  ]);
}
