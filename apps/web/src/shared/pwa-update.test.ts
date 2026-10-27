import { describe, expect, it } from 'vitest';
import { FRESH_MS, reloadNow } from './pwa-update';

describe('swapping to a new deploy', () => {
  it('swaps straight away when the game has just opened or come back to the front', () => {
    expect(reloadNow({ hidden: false, msSinceShown: 2000 })).toBe(true);
  });

  it('waits while someone is playing, and swaps once the game is in the background', () => {
    expect(reloadNow({ hidden: false, msSinceShown: FRESH_MS + 60_000 })).toBe(false);
    expect(reloadNow({ hidden: true, msSinceShown: FRESH_MS + 60_000 })).toBe(true);
  });
});
