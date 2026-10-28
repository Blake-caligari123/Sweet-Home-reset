// Bottle letters (VISION §6): from day 10, a bottle washes up by the fountain every few days with
// a letter signed "M.", and Puff can write back. Each reply is friendship with Mabel before Puff
// first meets her (day 43). The first carries the old shore-map leaf the caves will need.

/** A letter: when and where its bottle washes up, its lines, and the replies Puff can send. */
export interface LetterDef {
  id: string; from: string; day: number; area: string; x: number; y: number;
  /** Text ids, one per line. */
  lines: string[];
  /** Each reply sets a flag later lines and scenes can remember. */
  replies: { label: string; flag: string }[];
  /** Story flags the letter brings (the first shore-map leaf). */
  gives?: string[];
}

export const readFlag = (l: LetterDef) => `letter_${l.id}_read`;

/** The bottle waiting to be found: the earliest unread letter whose day has come (one at a time). */
export function lettersWaiting(letters: LetterDef[], day: number, flags: readonly string[]) {
  const next = letters.find((l) => !flags.includes(readFlag(l)));
  return next && day >= next.day ? [next] : [];
}
