import { P } from '../../../shared/art/palette';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';

/** An outfit piece, small enough to sit on Puff (placeholder art, code-drawn). */
export function drawOutfit(id: string) {
  const pc = new PixelCanvas(10, 8);
  switch (id) {
    case 'peach_bow': pc.ellipse(3, 4, 1, 1, P.peach); pc.ellipse(6, 4, 1, 1, P.peach); pc.set(4, 4, P.peachShade); pc.set(5, 4, P.peachShade); break;
    case 'keeper_badge': pc.ellipse(5, 3, 2, 2, P.butter); pc.set(5, 3, P.butterShade); pc.vline(4, 5, 2, P.blue); pc.vline(6, 5, 2, P.blue); break;
    case 'leaf_scarf': pc.rect(1, 3, 8, 2, P.sage); pc.hline(1, 3, 8, P.sageLight); pc.rect(6, 5, 2, 2, P.sage); break;
    case 'berry_hat': pc.ellipse(5, 5, 3, 2, P.peachShade); pc.set(4, 4, P.butterLight); pc.set(6, 5, P.butterLight); pc.hline(4, 3, 3, P.sage); break;
    case 'flower_crown': pc.hline(1, 5, 8, P.sageShade); for (const [x, c] of [[2, P.peach], [5, P.butter], [8, P.blueLight]] as const) pc.set(x, 4, c); break;
    case 'star_clip': for (const [x, y] of [[5, 2], [4, 4], [5, 4], [6, 4], [5, 3], [4, 5], [6, 5]]) pc.set(x, y, P.butter); break;
  }
  pc.outlineShapes(P.outline);
  return pc;
}
