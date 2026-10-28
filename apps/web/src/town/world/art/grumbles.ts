import { P } from '../../../shared/art/palette';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';

/**
 * A Grumble (placeholder until its Grok sheet lands): a fuzzy round puff. Grumpy is grey with
 * droopy eyes; a helper is bright butter with rosy cheeks and happy eyes. Two frames of bob.
 */
export function drawGrumble(frame: number, helper: boolean) {
  const pc = new PixelCanvas(16, 15);
  const cy = 9 + (frame % 2);
  const body = helper ? P.butterLight : P.greyLight; const shade = helper ? P.butter : P.grey;
  pc.ellipse(8, cy, 6, 5, shade);
  pc.ellipse(7, cy - 1, 5, 4, body);
  // Fuzz: a few tufts round the edge.
  for (const [x, y] of [[2, cy - 2], [13, cy - 1], [5, cy - 5], [10, cy - 5], [8, cy - 6]]) pc.set(x, y, body);
  if (helper) {
    pc.set(5, cy - 1, P.ink); pc.set(10, cy - 1, P.ink); pc.set(4, cy - 2, P.ink); pc.set(11, cy - 2, P.ink); // happy arcs
    pc.set(4, cy + 1, P.peach); pc.set(11, cy + 1, P.peach);
    pc.hline(7, cy + 2, 2, P.ink);
  } else {
    pc.hline(4, cy - 1, 2, P.ink); pc.hline(10, cy - 1, 2, P.ink); // droopy lids
    pc.set(8, cy + 2, P.greyShade);
  }
  pc.outlineShapes(P.outline);
  return pc;
}
