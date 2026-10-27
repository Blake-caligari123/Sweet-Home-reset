import { P } from '../../shared/art/palette';
import { PixelCanvas } from '../../shared/art/pixel-canvas';

/** Tiny crumbs for the vacuum task: a few shapes in toast and biscuit colours. */
export function drawCrumb(variant: number) {
  const colours = [P.butterShade, P.brownLight, P.peachShade, P.brown];
  const c = colours[variant % colours.length];
  const pc = new PixelCanvas(3, 3);
  if (variant % 3 === 0) { pc.rect(0, 1, 2, 2, c); pc.set(2, 2, P.outline); }
  else if (variant % 3 === 1) { pc.rect(0, 0, 3, 2, c); pc.set(0, 2, P.outline); }
  else { pc.rect(1, 0, 2, 2, c); pc.set(1, 2, P.outline); }
  return pc;
}
