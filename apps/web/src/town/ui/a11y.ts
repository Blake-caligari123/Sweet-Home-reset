import type { Settings } from './view';

/**
 * The look settings on the page (FRONTEND-PLAN §11): reduced motion, bigger text (UI text scaled
 * up a step) and high contrast (darker text, solid panels, stronger outlines).
 */
export function applyLook(s: Pick<Settings, 'reducedMotion' | 'bigText' | 'highContrast'>, root = document.documentElement) {
  root.classList.toggle('reduce-motion', s.reducedMotion);
  root.classList.toggle('big-text', !!s.bigText);
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
