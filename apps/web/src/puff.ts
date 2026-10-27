import { Container, Graphics } from 'pixi.js';
import { PALETTE } from './palette';

/** Code-drawn stand-in for public/art/puff. Used when the real pose file is missing. */
export function createPuff(): Container {
  const puff = new Container();
  puff.addChild(new Graphics()
    .ellipse(49, 45, 17, 35).fill(PALETTE.lilac)
    .ellipse(91, 45, 17, 35).fill(PALETTE.lilac)
    .ellipse(70, 75, 34, 32).fill(PALETTE.lilac)
    .circle(59, 73, 3.5).fill(PALETTE.ink)
    .circle(81, 73, 3.5).fill(PALETTE.ink)
    .ellipse(70, 83, 7, 4).fill('#9c7f92')
    .circle(43, 78, 5).fill('#efaaa8')
    .circle(97, 78, 5).fill('#efaaa8'));
  return puff;
}
