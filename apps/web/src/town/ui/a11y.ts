import type { Settings } from './view';

/** Text sizes offered in Pause (FRONTEND-PLAN §11), as a percent of the normal 16 px. */
const TEXT_SIZES = [100, 125, 150];
type Look = Pick<Settings, 'reducedMotion' | 'bigText' | 'textSize' | 'highContrast'>;

/** The chosen text size; an older save's Bigger text switch reads as 125%. */
export const textSizeOf = (s: Pick<Settings, 'bigText' | 'textSize'>) => s.textSize ?? (s.bigText ? 125 : 100);

/** The next size along, back to 100% after the biggest. */
export const nextTextSize = (size: number) => TEXT_SIZES[(TEXT_SIZES.indexOf(size) + 1) % TEXT_SIZES.length];

/**
 * The look settings on the page (FRONTEND-PLAN §11): reduced motion, text size (the whole UI scales
 * with the root font size) and high contrast (darker text, solid panels, stronger outlines).
 */
export function applyLook(s: Look, root = document.documentElement) {
  const size = textSizeOf(s);
  root.style.fontSize = `${(16 * size) / 100}px`;
  root.classList.toggle('reduce-motion', s.reducedMotion);
  root.classList.toggle('big-text', size > 100);
  root.classList.toggle('high-contrast', !!s.highContrast);
}

// Screen readers (FRONTEND-PLAN §11): the live region speaks requests, hearts and the time in words,
// never the ☀ ☾ ☂ symbols the HUD shows.

/** The HUD clock as words: "Spring 1, 6:00 am, sunny". */
export function clockLabel(day: string, time: string, night: boolean, rainy: boolean) {
  return `${day}, ${time}, ${rainy ? 'rainy' : night ? 'night' : 'sunny'}`;
}

export const sparklesLabel = (n: number) => `${n} Sparkle${n === 1 ? '' : 's'}`;

/** Said each morning the board has new jobs; empty when it has none. */
export const newJobsLine = (n: number) => (n ? `${n} new job${n === 1 ? '' : 's'} on the notice board.` : '');
