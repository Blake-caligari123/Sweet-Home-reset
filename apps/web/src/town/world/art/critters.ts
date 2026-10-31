import { P } from '../../../shared/art/palette';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';

/** A 12×12 critter, two frames (wings or legs), drawn in code. */
export function drawCritter(kind: string, colour: string | undefined, frame: number) {
  const pc = new PixelCanvas(12, 12);
  const c = colour ?? P.peach;
  switch (kind) {
    case 'beetle': pc.ellipseBox(6, 7, 3, 3, c, P.outline); pc.vline(6, 5, 5, P.outline); pc.set(4, 7, P.ink); pc.set(8, 8, P.ink); pc.rect(5, 3, 3, 2, P.ink); if (frame) { pc.set(2, 9, P.outline); pc.set(10, 9, P.outline); } break;
    case 'bee': pc.ellipseBox(6, 7, 3, 2, P.butter, P.outline); pc.vline(5, 6, 3, P.ink); pc.vline(7, 6, 3, P.ink); pc.ellipse(5, frame ? 3 : 4, 2, 1, P.white); pc.ellipse(8, frame ? 3 : 4, 2, 1, P.white); break;
    case 'butterfly': { const w = frame ? 2 : 4; pc.ellipseBox(6 - w / 2 - 1, 5, w / 2 + 1, 3, c, P.outline); pc.ellipseBox(6 + w / 2 + 1, 5, w / 2 + 1, 3, c, P.outline); pc.vline(6, 3, 6, P.ink); break; }
    case 'snail': pc.ellipseBox(7, 6, 3, 3, P.brownLight, P.outline); pc.set(7, 6, P.brown); pc.hline(2, 9, frame ? 8 : 7, P.greyLight); pc.set(2, 7, P.greyLight); pc.set(2, 8, P.greyLight); break;
    case 'frog': pc.ellipseBox(6, 7, 4, 3, P.sage, P.outline); pc.ellipseBox(4, 4, 1, 1, P.sageLight, P.outline); pc.ellipseBox(8, 4, 1, 1, P.sageLight, P.outline); pc.set(4, 4, P.ink); pc.set(8, 4, P.ink); if (frame) pc.hline(4, 8, 5, P.sageShade); break;
    case 'firefly': pc.ellipse(6, 6, frame ? 3 : 2, frame ? 3 : 2, P.butterLight, frame ? 200 : 150); pc.set(6, 6, P.white); pc.set(5, 5, P.ink); break;
    case 'bird': pc.ellipseBox(6, 7, 3, 3, P.brownLight, P.outline); pc.ellipse(6, 8, 2, 1, c); pc.set(7, 6, P.ink); pc.set(10, 7, P.butterShade); pc.rect(4, frame ? 9 : 10, 1, 2, P.outline); break;
    case 'dragonfly': pc.hline(2, 7, 8, c); pc.set(10, 7, P.ink); pc.hline(2, 8, 2, P.outline); for (const [wx, wy] of [[5, frame ? 4 : 5], [8, frame ? 4 : 5], [5, frame ? 10 : 9], [8, frame ? 10 : 9]]) pc.ellipse(wx, wy, 2, 1, P.blueLight, 200); break;
    case 'kingfisher': pc.ellipseBox(5, 7, 3, 3, P.blue, P.outline); pc.ellipse(5, 8, 2, 1, P.peach); pc.set(4, 5, P.blueLight); pc.set(6, 6, P.ink); pc.hline(8, 6, 3, P.ink); pc.rect(4, frame ? 9 : 10, 1, 2, P.outline); pc.line(2, 7, 1, frame ? 5 : 6, P.blueShade); break;
    case 'duck': pc.ellipseBox(6, 8, 3, 2, P.butter, P.outline); pc.ellipseBox(8, 5, 2, 2, P.butter, P.outline); pc.set(8, 4, P.ink); pc.hline(10, 5, 2, P.peachShade); pc.set(4, frame ? 7 : 8, P.butterShade); break;
  }
  return pc;
}
