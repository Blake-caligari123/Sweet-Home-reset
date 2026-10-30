import { P } from '../../../shared/art/palette';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';

/**
 * The three pets, side on and facing right (mirrored for left), two frames of trot. Placeholders
 * until their sprite sheets land: a peach cat, a cream pup with brown ears, a brown hedgehoglet.
 */
export function drawPet(kind: string, frame: number) {
  const pc = new PixelCanvas(16, 13);
  const up = frame % 2;
  const legs = (c: string) => { for (const x of up ? [4, 10] : [5, 11]) pc.vline(x, 10, 2, c); };
  switch (kind) {
    case 'cat':
      legs(P.peachShade);
      pc.ellipse(7, 8 - up, 5, 3, P.peach);
      pc.ellipse(12, 5 - up, 3, 3, P.peach);
      pc.set(10, 2 - up, P.peach); pc.set(14, 2 - up, P.peach);
      pc.line(2, 7 - up, 0, 3 - up, P.peachShade);
      pc.set(13, 5 - up, P.ink); pc.set(15, 6 - up, P.peachShade);
      break;
    case 'pup':
      legs(P.creamShade);
      pc.ellipse(7, 8 - up, 5, 3, P.cream);
      pc.ellipse(12, 5 - up, 3, 3, P.cream);
      pc.rect(10, 3 - up, 2, 4, P.brown);
      pc.set(1, 6 - up, P.cream); pc.set(0, 5 - up, P.cream);
      pc.set(13, 5 - up, P.ink); pc.set(15, 6 - up, P.ink);
      break;
    default: // hedgehoglet
      legs(P.brownShade);
      pc.ellipse(7, 8 - up, 6, 4, P.brownShade);
      for (const [x, y] of [[3, 4], [6, 3], [9, 3], [2, 6], [5, 5], [8, 5]]) pc.set(x, y - up, P.brown);
      pc.ellipse(12, 8 - up, 3, 2, P.cream);
      pc.set(13, 7 - up, P.ink); pc.set(15, 8 - up, P.ink);
  }
  pc.outlineShapes(P.outline);
  return pc;
}
