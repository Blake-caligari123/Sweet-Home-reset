import { TUNING } from '../data/tuning';

// Pinch zoom (NEXT-PHASE §9): the view is a number of tiles across, closer with fewer. The camera
// still picks a whole pixel scale for it, so the pixels stay crisp.

/** A phone held upright shows about this many tiles across its width. */
export const VIEW_TILES = 11;

/** An unfolded phone (iPhone Duo's inner screen) or a small tablet shows at least this many: unfolding opens up more of the town, not bigger tiles. */
const UNFOLDED_TILES = 14;

/**
 * Tiles across a screen's shorter side before any zooming: 11 on a phone, 14 once it's
 * unfolded, and more on a big screen so a tile is about 64 px, not huge.
 */
export const fitTiles = (shortSide: number) => clamp(Math.max(VIEW_TILES, shortSide >= 560 ? UNFOLDED_TILES : 0, Math.round(shortSide / 64)));

const clamp = (n: number) => Math.min(TUNING.zoomTiles[1], Math.max(TUNING.zoomTiles[0], n));

/** Tiles across after a pinch that began at `startTiles` with fingers `startGap` apart, now `gap` apart. */
export const pinchTiles = (startTiles: number, startGap: number, gap: number) => clamp(startTiles * (startGap / Math.max(1, gap)));

/** One tile closer or further per wheel notch (a trackpad pinch arrives as a wheel too). */
export const wheelTiles = (tiles: number, deltaY: number) => clamp(Math.round(tiles) + Math.sign(deltaY));
