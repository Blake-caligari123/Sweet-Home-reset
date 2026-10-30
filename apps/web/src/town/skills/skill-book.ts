import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { OnboardEvent } from '../play/onboarding';
import { TUNING } from '../data/tuning';
import { gainXp, levelIn, perk, skillFor, type Skill } from './skills';

export interface SkillBookHost { state: TownState; view: View; day(): number }

/** What each skill's perk does (given its size, from perk()), for the level-up banner and the Skills sheet. */
const INFO: Record<Skill, { icon: string; name: string; says: (n: number) => string }> = {
  tidying: { icon: '🧹', name: 'Tidying', says: (n) => `the Fluff bar holds ${n} more` },
  farming: { icon: '🌱', name: 'Farming', says: (n) => `crops sell for ${pct(n)} more` },
  cooking: { icon: '🍲', name: 'Cooking', says: (n) => `snacks give ${pct(n)} more Fluff` },
  crafting: { icon: '🔨', name: 'Crafting', says: (n) => `making costs ${pct(n)} fewer Sparkles` },
  exploring: { icon: '🧭', name: 'Exploring', says: (n) => `walks ${pct(n)} quicker` }
};
export const skillInfo = (s: Skill) => ({ ...INFO[s], perk: (level: number) => INFO[s].says(perk(s, level)) });
const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Puff's skills in play: hears what Puff does (through the guide), adds XP, and cheers each new level.
 * Tidying levels grow Fluff's most for good; the other perks are read where they apply (perkIn).
 */
export class SkillBook {
  constructor(private host: SkillBookHost) {}

  hear(e: OnboardEvent) {
    const skill = skillFor(e);
    if (!skill) return;
    const { state, view } = this.host;
    const day = this.host.day();
    // Going somewhere counts once per place a day: exploring grows from new ground, not doorways.
    const kind = e.type === 'entered' ? `entered_${e.area}` : e.type;
    if (e.type === 'entered' && state.skills.day === day && state.skills.counts[kind]) return;
    const before = levelIn(state.skills, skill);
    state.skills = gainXp(state.skills, skill, kind, day).log;
    const after = levelIn(state.skills, skill);
    if (after === before) return;
    if (skill === 'tidying') { state.fluff.max += TUNING.skills.perks.tidying; state.fluff.value += TUNING.skills.perks.tidying; }
    const info = skillInfo(skill);
    view.banner(`${info.icon} ${info.name} level ${after}! Now ${info.perk(after)}.`);
    view.feedback('fanfare', 'success');
  }
}
