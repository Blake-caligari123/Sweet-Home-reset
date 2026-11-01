// Skip stones (a mini-game with Otto): a marker swings along a bar, and the throw is best when
// it lands in the sweet spot. Three throws; the best one counts. Pure rules; skip-sheet.ts draws it.

/** Where the marker is (0 to 1) after `ms`: a smooth swing back and forth, quicker on later throws. */
export function markerAt(ms: number, throwNo: number): number {
  const period = 1400 - throwNo * 150;
  return 0.5 - 0.5 * Math.cos((ms / period) * Math.PI * 2);
}

/** The sweet spot's middle for each throw: somewhere different every time. */
export const sweetSpot = (day: number, throwNo: number) => 0.25 + (((day * 37 + throwNo * 53) % 50) / 100);

/** Skips for a throw: 9 dead centre, fewer further out, at least 1 (every stone skips once). */
export function skipsFor(at: number, sweet: number): number {
  const off = Math.abs(at - sweet);
  return Math.max(1, Math.round(9 - off * 30));
}

export const skipStars = (best: number) => best >= 8 ? 3 : best >= 5 ? 2 : 1;
export const THROWS = 3;
