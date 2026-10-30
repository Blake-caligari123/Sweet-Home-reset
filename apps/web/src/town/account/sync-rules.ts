import { DAYS_PER_SEASON, seasonOf } from '../play/clock';

// What sync does with the cloud copy (BACKEND-PLAN step 4). A life-sim save can't be merged
// safely, so it's either this device's save going up, or the player choosing between the two.

/** `send` this device's save, or `ask` which one to keep (the cloud moved on, or was never matched here). */
export function syncStep(lastMatched: number | undefined, cloud: { version: number } | null): 'send' | 'ask' {
  if (!cloud) return 'send';
  return cloud.version === lastMatched ? 'send' : 'ask';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A save in a line: "Summer 3 · 30 Oct, 7:05 pm", in the time where it was saved. */
export function saveLine(s: { day: number; savedAt: string }) {
  const [, , mo, d, h, mi] = s.savedAt.match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+)/)?.map(Number) ?? [];
  const when = mo ? `${d} ${MONTHS[mo - 1]}, ${((h + 11) % 12) + 1}:${String(mi).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}` : '';
  return `${seasonOf(s.day)} ${((s.day - 1) % DAYS_PER_SEASON) + 1}${when ? ` · ${when}` : ''}`;
}
