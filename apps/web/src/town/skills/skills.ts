import { TUNING } from '../data/tuning';
import type { OnboardEvent } from '../play/onboarding';

// Puff's skills (NEXT-PHASE §5.2, Blake: skill levels with perks). Doing things earns XP in the
// skill they belong to; the same thing over and over in one day earns less, so skills grow from
// variety, never from grinding (NEXT-PHASE §6). Each level above 1 grows that skill's perk.

export const SKILLS = ['tidying', 'farming', 'cooking', 'crafting', 'exploring'] as const;
export type Skill = (typeof SKILLS)[number];

/** XP per skill, and today's count of each kind of action (for the variety rule). */
export interface SkillLog { xp: Partial<Record<Skill, number>>; day: number; counts: Record<string, number> }

/** Which skill a moment in play belongs to, if any. */
export function skillFor(e: OnboardEvent): Skill | null {
  switch (e.type) {
    case 'cleared': case 'restored': case 'putaway': return 'tidying';
    case 'picked': case 'planted': case 'watered': case 'tended': return 'farming';
    case 'made': return e.station === 'kitchen' ? 'cooking' : 'crafting';
    case 'found': case 'entered': case 'spotted': case 'caught': return 'exploring';
    default: return null;
  }
}

/** XP for one action of `kind` today: full for the first few of that kind, then a small share. */
export function gainXp(log: SkillLog, skill: Skill, kind: string, day: number) {
  const counts = log.day === day ? log.counts : {};
  const n = counts[kind] ?? 0;
  const { xp, fullXpPerDay, tiredXpShare } = TUNING.skills;
  const gained = n < fullXpPerDay ? xp : Math.max(1, Math.round(xp * tiredXpShare));
  return { gained, log: { xp: { ...log.xp, [skill]: (log.xp[skill] ?? 0) + gained }, day, counts: { ...counts, [kind]: n + 1 } } };
}

/** The level for this much XP (1 to 10). */
export function levelOf(xp: number) {
  return TUNING.skills.levelXp.filter((t) => xp >= t).length || 1;
}

/** A skill's perk at a level: none at 1, then a little more each level (tuning.skills.perks). */
export const perk = (skill: Skill, level: number) => TUNING.skills.perks[skill] * (level - 1);

/** A skill's level and perk from the saved log (shops, the kitchen and the bench read this). */
export const levelIn = (log: SkillLog, skill: Skill) => levelOf(log.xp[skill] ?? 0);
export const perkIn = (log: SkillLog, skill: Skill) => perk(skill, levelIn(log, skill));
