// Timing for the 5.6 s before/after clip, kept pure so it can be tested.
export const CLIP_MS = 5600;
const HOLD_BEFORE = 900;
const WIPE = 3000;

export function clipFrame(ms: number) {
  const t = Math.max(0, Math.min(CLIP_MS, ms));
  const wipe = t <= HOLD_BEFORE ? 0 : Math.min(1, (t - HOLD_BEFORE) / WIPE);
  const eased = 1 - (1 - wipe) * (1 - wipe);
  const label = wipe === 0 ? 'before' : wipe >= 1 ? 'after' : 'wipe';
  return { wipe: eased, label, done: t >= CLIP_MS } as const;
}
