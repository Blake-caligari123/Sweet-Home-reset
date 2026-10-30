import { h } from '../../shared/ui/dom';
import { TUNING } from '../data/tuning';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { skillInfo } from './skill-book';
import { levelIn, SKILLS } from './skills';

/** Pause → Skills: each skill's level, how far to the next, and what it does for Puff now. */
export function openSkills(view: View, state: TownState) {
  const table = TUNING.skills.levelXp;
  const rows = SKILLS.map((s) => {
    const info = skillInfo(s);
    const xp = state.skills.xp[s] ?? 0;
    const level = levelIn(state.skills, s);
    const next = table[level];
    const share = next === undefined ? 1 : (xp - table[level - 1]) / (next - table[level - 1]);
    return h('div', { class: 'friend' },
      h('div', { class: 'bag-slot', 'aria-hidden': 'true' }, h('b', { style: { position: 'static', fontSize: '1.2rem' } }, info.icon)),
      h('div', { class: 'friend-body' },
        h('p', { class: 'friend-name' }, `${info.name} · level ${level}`),
        next === undefined ? '' : h('div', { class: 'heart-bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${Math.round(share * 100)}%` } })),
        h('p', { class: 'muted' }, `${next === undefined ? 'Mastered! ' : ''}${level > 1 ? `Now ${info.perk(level)}.` : `Level 2: ${info.perk(2)}.`}`)));
  });
  view.sheet('Skills', [h('div', { class: 'friends' }, ...rows), h('p', { class: 'muted' }, 'Skills grow from doing a bit of everything.')]);
}
