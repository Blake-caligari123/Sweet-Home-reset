import { TUNING } from '../data/tuning';

// Pinch zoom (NEXT-PHASE §9): the view is a number of tiles across, closer with fewer. The camera
// still picks a whole pixel scale for it, so the pixels stay crisp.

const clamp = (n: number) => Math.min(TUNING.zoomTiles[1], Math.max(TUNING.zoomTiles[0], n));

/** Tiles across after a pinch that began at `startTiles` with fingers `startGap` apart, now `gap` apart. */
export const pinchTiles = (startTiles: number, startGap: number, gap: number) => clamp(startTiles * (startGap / Math.max(1, gap)));

/** One tile closer or further per wheel notch (a trackpad pinch arrives as a wheel too). */
export const wheelTiles = (tiles: number, deltaY: number) => clamp(Math.round(tiles) + Math.sign(deltaY));
