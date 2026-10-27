import { describe, expect, it } from 'vitest';
import { CLIP_MS, clipFrame } from './timeline';

describe('share clip timeline', () => {
  it('holds on the mess, wipes to clean, then holds on the result', () => {
    expect(clipFrame(0)).toMatchObject({ wipe: 0, label: 'before' });
    expect(clipFrame(2400).label).toBe('wipe');
    expect(clipFrame(2400).wipe).toBeGreaterThan(0.4);
    expect(clipFrame(4200)).toMatchObject({ wipe: 1, label: 'after' });
    expect(clipFrame(CLIP_MS).done).toBe(true);
  });

  it('only ever moves forward', () => {
    let last = -1;
    for (let ms = 0; ms <= CLIP_MS; ms += 50) { const w = clipFrame(ms).wipe; expect(w).toBeGreaterThanOrEqual(last); last = w; }
    expect(CLIP_MS).toBeGreaterThanOrEqual(5000);
    expect(CLIP_MS).toBeLessThanOrEqual(6000);
  });
});
