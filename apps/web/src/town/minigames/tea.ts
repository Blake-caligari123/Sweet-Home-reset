// Pour the tea (a mini-game with Mabel): hold to pour, let go when the tea reaches the line.
// Three cups, each pouring a little quicker, with the line somewhere new. Pure rules; tea-sheet.ts draws it.

export const CUPS = 3;

/** How full the cup is (0 to 1, past 1 spills) after pouring for `ms`. */
export const levelAfter = (ms: number, cup: number) => ms / (1700 - cup * 250);

/** The line for each cup: between a little over half and nearly full. */
export const lineFor = (day: number, cup: number) => 0.55 + (((day * 29 + cup * 41) % 35) / 100);

/** How close: right on (within 4%), nearly (within 10%), or a bit off (or spilled). */
export function judge(level: number, line: number): 'perfect' | 'close' | 'off' {
  if (level > 1) return 'off';
  const off = Math.abs(level - line);
  return off <= 0.04 ? 'perfect' : off <= 0.1 ? 'close' : 'off';
}

/** Stars from the three cups: perfect counts 2, close 1. */
export function teaStars(results: ('perfect' | 'close' | 'off')[]): number {
  const score = results.reduce((n, r) => n + (r === 'perfect' ? 2 : r === 'close' ? 1 : 0), 0);
  return score >= 5 ? 3 : score >= 3 ? 2 : 1;
}
