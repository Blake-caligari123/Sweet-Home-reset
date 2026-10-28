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
