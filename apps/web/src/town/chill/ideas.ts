// Things to do (Blake, 2 Nov: "more to do during the day when player finishes main story parts
// or doesn't want to get into it and just wants to chill"): a short list of cosy things on offer
// right now, from what Puff has and the time of day. Pure; ideas-sheet.ts shows it.

export interface IdeaFacts {
  night: boolean; telescope: boolean; cartToday: boolean;
  rod: boolean; bait: boolean;
  thirsty: number; ready: number; honey: number;
  gathered: number; axe: boolean;
  /** Friends with a game, and where they are now. */
  games: { name: string; game: string; where: string | null }[];
  goalsLeft: number; happening: string | null; tired: boolean;
  /** Tea: who's coming today, or whether there's a friend to ask (visits/tea.ts). */
  teaGuest?: string | null; canTea?: boolean;
}

/** The ideas, most timely first: what's ready now, then what's always nice. */
export function ideas(f: IdeaFacts): string[] {
  const out: string[] = [];
  if (f.night && f.telescope) out.push('🔭 It\'s dark: tonight\'s stars are up. Look through your telescope.');
  if (f.cartToday && !f.night) out.push('🛒 The Wandering Cart is in the Town Square today, with rare things.');
  if (f.ready) out.push(`🥕 ${f.ready} crop${f.ready === 1 ? ' is' : 's are'} ready to pick.`);
  if (f.thirsty) out.push(`🌱 ${f.thirsty} crop${f.thirsty === 1 ? ' wants' : 's want'} a drink today.`);
  if (f.honey) out.push(`🐝 Your hive has ${f.honey} honey waiting.`);
  if (f.teaGuest) out.push(`☕ ${f.teaGuest} is coming round for tea at 3 pm. Pop home!`);
  if (f.happening) out.push(f.happening);
  if (f.goalsLeft) out.push(`🎯 ${f.goalsLeft} of today's goals to go.`);
  if (f.tired) out.push('🪑 Feeling sleepy? Sit on a bench a while, or have a snack.');
  for (const g of f.games.slice(0, 2)) out.push(`🎲 ${g.game} with ${g.name}${g.where ? ` (at ${g.where})` : ''}.`);
  if (f.canTea && !f.teaGuest) out.push('☕ Ask a friend round for tea tomorrow (two hearts or more).');
  if (f.rod) out.push(f.bait ? '🎣 Go fishing with bait: a rare one might bite.' : '🎣 Cast a line at the river, the beach or the harbour.');
  if (f.gathered < 6 && !f.night) out.push('🌳 Shake the trees and rummage in the bushes for twigs, fruit and flowers.');
  if (f.axe && !f.night) out.push('🪓 Chop a tree in your yard or the woods for logs.');
  if (!f.telescope) out.push('🔭 The Wandering Cart sometimes sells a telescope, for stargazing.');
  out.push('🪑 Or just sit on a bench and watch the clouds go by.');
  return out.slice(0, 9);
}
