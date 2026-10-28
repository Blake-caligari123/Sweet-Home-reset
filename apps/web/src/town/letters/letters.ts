// Bottle letters (VISION §6): from day 10, a bottle washes up by the fountain every few days with
// a letter signed "M.", and Puff can write back. Each reply is friendship with Mabel before Puff
// first meets her (day 43). The first carries the old shore-map leaf the caves will need.
// Newcomers write too (VISION §6): Sorrel's envelope on day 8 asks for a home in town.

/** A letter: when and where its bottle washes up, its lines, and the replies Puff can send. */
export interface LetterDef {
  id: string; from: string; day: number; area: string; x: number; y: number;
  /** Text ids, one per line. */
  lines: string[];
  /** Each reply sets a flag later lines and scenes can remember. */
  replies: { label: string; flag: string }[];
  /** Story flags the letter brings (the first shore-map leaf). */
  gives?: string[];
  /** How it looks when it isn't a bottle (an envelope), with its own sheet title, tracker hint and sent line (text ids). */
  item?: string; title?: string; hint?: string; sent?: string;
}

export const readFlag = (l: LetterDef) => `letter_${l.id}_read`;

/** The letters waiting to be found: each writer's earliest unread letter whose day has come (one at a time each). */
export function lettersWaiting(letters: LetterDef[], day: number, flags: readonly string[]) {
  const writers = [...new Set(letters.map((l) => l.from))];
  return writers.flatMap((w) => {
    const next = letters.find((l) => l.from === w && !flags.includes(readFlag(l)));
    return next && day >= next.day ? [next] : [];
  });
}
