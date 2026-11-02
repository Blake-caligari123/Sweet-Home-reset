import type { Stop } from '../neighbours/neighbours';

// Tea at Puff's (a chill side activity, 2 Nov): a friend of 2 hearts or more can be asked round
// for tea tomorrow. They come to the burrow's kitchen table at three and stay till half past five.
// Having tea together is a warm chat, friendship and a few Sparkles. One invite at a time; a
// missed tea is just a quiet afternoon, nothing lost.

export interface Tea { day: number; who: string; had?: boolean }

/** Where a guest sits, and when they come and go (game minutes). */
const TEA_SEAT: Stop = { at: 15 * 60, area: 'burrow', x: 15, y: 11, dir: 'up' };
const TEA_UNTIL = 17 * 60 + 30;
const TEA_HEARTS = 2;

/** Can Puff ask this friend round now? (Two hearts, and no tea already on.) */
export const canInvite = (tea: Tea | null, day: number, hearts: number) => hearts >= TEA_HEARTS && !(tea && tea.day >= day && !tea.had);

/** The invite: tea tomorrow. */
export const invite = (who: string, day: number): Tea => ({ day: day + 1, who });

/** Today's guest's visit, if this is them and today's the day. */
export const guestVisit = (tea: Tea | null, who: string, day: number) => (tea && tea.day === day && tea.who === who ? { stop: TEA_SEAT, until: TEA_UNTIL } : null);

/** At the table now: today's guest, during tea time, tea not yet had. */
export const teaTime = (tea: Tea | null, who: string, day: number, minutes: number) => !!tea && tea.day === day && tea.who === who && !tea.had && minutes >= TEA_SEAT.at && minutes < TEA_UNTIL;
