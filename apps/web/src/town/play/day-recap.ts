import type { OnboardEvent } from './onboarding';

// The day's recap (polish: a proud little moment at bedtime). As night falls, before the hint at
// tomorrow, a line sums up the day: spots tidied, places made spotless, fish caught, critters
// spotted, crops picked, things made, Grumbles befriended and Sparkles earned. Only what happened
// is shown; a quiet day is fine too.

export interface DayTally { tidied: number; fish: number; critters: number; picked: number; made: number; friends: number }

export const emptyTally = (): DayTally => ({ tidied: 0, fish: 0, critters: 0, picked: 0, made: 0, friends: 0 });

/** One more thing done today. */
export function tallyHear(t: DayTally, e: OnboardEvent): DayTally {
  switch (e.type) {
    case 'cleared': return { ...t, tidied: t.tidied + 1 };
    case 'caught': return { ...t, fish: t.fish + 1 };
    case 'spotted': return { ...t, critters: t.critters + 1 };
    case 'picked': return { ...t, picked: t.picked + 1 };
    case 'made': return { ...t, made: t.made + 1 };
    case 'befriended': return { ...t, friends: t.friends + 1 };
    default: return t;
  }
}

/** The recap line, or null after a quiet day. */
export function recapLine(t: DayTally, spotless: number, sparkles: number): string | null {
  const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
  const bits = [
    t.tidied && `🧹 ${n(t.tidied, 'spot')} tidied`, spotless && `✨ ${n(spotless, 'place')} spotless`, t.fish && `🐟 ${n(t.fish, 'fish', 'fish')}`,
    t.critters && `🐞 ${n(t.critters, 'critter')}`, t.picked && `🥕 ${n(t.picked, 'crop')} picked`, t.made && `🔨 ${n(t.made, 'thing')} made`,
    t.friends && `👾 ${n(t.friends, 'Grumble')} befriended`, sparkles > 0 && `+${sparkles} ✨`
  ].filter(Boolean);
  return bits.length ? bits.join(' · ') : null;
}
