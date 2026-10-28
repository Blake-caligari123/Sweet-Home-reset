import { TUNING } from '../data/tuning';

/** What the player called Puff and the town. Text says `{puff}` and `{town}` wherever they appear. */
export interface Names { puff: string; town: string }

export const DEFAULT_NAMES: Names = { puff: 'Puff', town: TUNING.townName };

/** Long enough for most names, short enough for a speech bubble. */
export const NAME_MAX = 12;

export function withNames(text: string, n: Names) {
  return text.replaceAll('{puff}', n.puff).replaceAll('{town}', n.town);
}

/** A typed name made safe to show: letters, numbers, spaces, hyphens and apostrophes; the default if nothing's left. */
export function cleanName(raw: string, fallback: string) {
  const name = raw.replace(/[^\p{L}\p{N} '-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX).trim();
  return name ? name[0].toUpperCase() + name.slice(1) : fallback;
}
