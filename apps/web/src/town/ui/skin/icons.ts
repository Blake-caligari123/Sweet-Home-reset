import { P } from '../../../shared/art/palette';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';

// Pixel icons for the UI (the satchel skin): every emoji the game's text leads with gets a
// little 12×12 drawing in the world's colours, so the HUD, tracker, banners and lists read as
// part of the game, not a phone's emoji font. iconize.ts swaps them in.

type Draw = (pc: PixelCanvas) => void;
const o = P.ink;

const sparkle: Draw = (pc) => { pc.vline(5, 0, 11, P.butterShade); pc.hline(0, 5, 11, P.butterShade); pc.rect(4, 3, 3, 5, P.butter); pc.rect(3, 4, 5, 3, P.butter); pc.set(5, 5, P.white); pc.set(10, 0, P.butter); pc.set(9, 1, P.butterShade); pc.set(1, 9, P.butter); };
const star: Draw = (pc) => { for (let y = 0; y < 11; y += 1) { const w = y < 4 ? 1 + (y > 1 ? 2 : 0) : y < 6 ? 11 - (y - 4) * 2 : y < 9 ? 5 + (y - 6) : 3; pc.hline(Math.round(5.5 - w / 2), y, w, P.butter); } pc.set(5, 1, P.butterLight); pc.outlineShapes(o); };
const book: Draw = (pc) => { pc.box(1, 2, 5, 8, P.peach, o); pc.box(6, 2, 5, 8, P.peachLight, o); pc.vline(6, 2, 8, o); pc.hline(2, 4, 3, P.cream); pc.hline(7, 4, 3, P.cream); pc.hline(7, 6, 3, P.cream); };
const scroll: Draw = (pc) => { pc.box(2, 1, 8, 10, P.creamShade, o); pc.box(1, 0, 10, 2, P.butter, o); pc.box(1, 10, 10, 2, P.butter, o); pc.hline(3, 4, 6, P.brownLight); pc.hline(3, 6, 5, P.brownLight); pc.hline(3, 8, 6, P.brownLight); };
const target: Draw = (pc) => { pc.ellipseBox(5, 5, 5, 5, P.cream, o); pc.ellipse(5, 5, 3, 3, P.peachShade); pc.ellipse(5, 5, 1, 1, P.cream); pc.set(5, 5, P.peachShade); pc.line(6, 4, 10, 0, P.brownShade); };
const calendar: Draw = (pc) => { pc.box(0, 2, 11, 9, P.cream, o); pc.rect(1, 3, 9, 2, P.peachShade); pc.vline(3, 0, 3, o); pc.vline(7, 0, 3, o); for (let y = 6; y < 10; y += 2) for (let x = 2; x < 10; x += 2) pc.set(x, y, P.brownLight); };
const board: Draw = (pc) => { pc.box(0, 1, 11, 9, P.brown, o); pc.rect(2, 3, 3, 4, P.cream); pc.rect(6, 3, 3, 3, P.butterLight); pc.set(3, 3, P.peachShade); pc.set(7, 3, P.blueShade); pc.vline(2, 10, 2, o); pc.vline(8, 10, 2, o); };
const house: Draw = (pc) => { for (let y = 0; y < 5; y += 1) pc.hline(5 - y, y, 1 + y * 2, P.peachShade); pc.box(1, 5, 9, 6, P.cream, o); pc.rect(4, 7, 3, 4, P.brown); pc.outlineShapes(o); };
const heart: Draw = (pc) => { pc.ellipse(3, 3, 2, 2, P.peachShade); pc.ellipse(7, 3, 2, 2, P.peachShade); for (let y = 4; y < 10; y += 1) pc.hline(1 + (y - 4), y, 9 - (y - 4) * 2, P.peachShade); pc.set(3, 2, P.peachLight); pc.outlineShapes(o); };
const leaf: Draw = (pc) => { pc.ellipse(6, 5, 4, 3, P.sage); pc.line(2, 9, 9, 2, P.sageShade); pc.set(5, 3, P.sageLight); pc.outlineShapes(o); };
const sprout: Draw = (pc) => { pc.vline(5, 4, 6, P.sageShade); pc.ellipse(3, 4, 2, 1, P.sage); pc.ellipse(8, 3, 2, 1, P.sage); pc.box(2, 9, 7, 3, P.brown, o); pc.outlineShapes(o); };
const sun: Draw = (pc) => { pc.ellipse(5, 5, 3, 3, P.butter); pc.set(4, 4, P.butterLight); for (const [x, y] of [[5, 0], [5, 10], [0, 5], [10, 5], [1, 1], [9, 1], [1, 9], [9, 9]]) pc.set(x, y, P.butterShade); pc.ellipseBox(5, 5, 3, 3, P.butter, P.butterShade); };
const moon: Draw = (pc) => { pc.ellipse(5, 5, 4, 4, P.butterLight); pc.ellipse(7, 4, 3, 3, P.white, 0); for (let y = 0; y < 11; y += 1) for (let x = 0; x < 11; x += 1) if ((x - 7) ** 2 + (y - 4) ** 2 <= 9) pc.clear(x, y); pc.outlineShapes(o); };
const fish: Draw = (pc) => { pc.ellipseBox(5, 5, 4, 3, P.blueLight, o); pc.line(9, 5, 11, 2, o); pc.line(9, 5, 11, 8, o); pc.vline(11, 3, 5, P.blueLight); pc.set(3, 4, o); };
const bun: Draw = (pc) => { pc.ellipseBox(5, 6, 5, 4, P.peachLight, o); pc.ellipse(5, 4, 3, 1, P.butterLight); pc.set(3, 6, P.peachShade); pc.set(7, 7, P.peachShade); };
const bug: Draw = (pc) => { pc.ellipseBox(5, 6, 4, 4, P.peachShade, o); pc.vline(5, 3, 7, o); pc.ellipse(5, 2, 2, 1, o); pc.set(3, 6, o); pc.set(7, 7, o); };
const dice: Draw = (pc) => { pc.box(1, 1, 9, 9, P.cream, o); for (const [x, y] of [[3, 3], [7, 3], [5, 5], [3, 7], [7, 7]]) pc.set(x, y, o); };
const broom: Draw = (pc) => { pc.line(9, 0, 4, 6, P.brown); for (let i = 0; i < 5; i += 1) pc.line(4, 6, 1 + i, 11, P.butterShade); pc.outlineShapes(o); };
const bucket: Draw = (pc) => { pc.box(2, 3, 7, 8, P.blue, o); pc.hline(2, 3, 7, P.blueShade); pc.ellipse(5, 3, 3, 1, P.brownShade); pc.line(1, 3, 5, 0, o); pc.line(9, 3, 5, 0, o); };
const log: Draw = (pc) => { pc.box(0, 3, 9, 6, P.brown, o); pc.ellipseBox(9, 6, 2, 3, P.butterLight, o); pc.hline(1, 4, 6, P.brownLight); pc.set(9, 6, P.brownLight); };
const medal: Draw = (pc) => { pc.line(3, 0, 5, 5, P.blueShade); pc.line(8, 0, 6, 5, P.peachShade); pc.ellipseBox(5, 8, 3, 3, P.butter, o); pc.set(5, 8, P.butterLight); };
const cup: Draw = (pc) => { pc.box(2, 0, 7, 6, P.butter, o); pc.box(4, 6, 3, 3, P.butterShade, o); pc.box(2, 9, 7, 2, P.brown, o); pc.set(1, 2, o); pc.set(9, 2, o); pc.set(4, 1, P.butterLight); };
const bee: Draw = (pc) => { pc.ellipse(3, 2, 2, 2, P.blueLight); pc.ellipse(7, 2, 2, 2, P.blueLight); pc.ellipseBox(5, 6, 4, 3, P.butter, o); pc.vline(4, 4, 5, o); pc.vline(7, 4, 5, o); };
const flower: Draw = (pc) => { for (const [x, y] of [[5, 2], [2, 5], [8, 5], [5, 8], [3, 3], [7, 3], [3, 7], [7, 7]]) pc.ellipse(x, y, 1, 1, P.peach); pc.ellipse(5, 5, 1, 1, P.butter); pc.outlineShapes(o); };
const worm: Draw = (pc) => { for (const [x, y] of [[1, 7], [2, 6], [3, 6], [4, 7], [5, 8], [6, 8], [7, 7], [8, 6], [9, 5]]) { pc.set(x, y, P.peach); pc.set(x, y + 1, P.peachShade); } pc.outlineShapes(o); };
const bulb: Draw = (pc) => { pc.ellipseBox(5, 4, 4, 4, P.butter, o); pc.box(3, 8, 5, 3, P.grey, o); pc.set(4, 2, P.white); };
const teapot: Draw = (pc) => { pc.ellipseBox(5, 6, 4, 4, P.blueLight, o); pc.line(9, 5, 11, 3, o); pc.rect(4, 1, 3, 2, P.blueShade); pc.ellipse(0, 6, 1, 2, o); pc.set(4, 4, P.white); };
const books: Draw = (pc) => { pc.box(0, 2, 3, 9, P.peachShade, o); pc.box(3, 1, 3, 10, P.sage, o); pc.box(6, 3, 3, 8, P.blue, o); pc.box(8, 4, 3, 7, P.butter, o); };
const basket: Draw = (pc) => { pc.box(1, 5, 9, 6, P.butterShade, o); pc.hline(2, 7, 7, P.brown); pc.hline(2, 9, 7, P.brown); pc.line(2, 5, 5, 1, o); pc.line(8, 5, 5, 1, o); };
const stone: Draw = (pc) => { pc.ellipseBox(5, 6, 5, 3, P.grey, o); pc.ellipse(4, 5, 2, 1, P.greyLight); };
const tree: Draw = (pc) => { pc.ellipse(5, 4, 4, 4, P.sage); pc.set(4, 2, P.sageLight); pc.rect(4, 8, 3, 3, P.brown); pc.outlineShapes(o); };
const axe: Draw = (pc) => { pc.line(1, 11, 8, 2, P.brown); pc.box(6, 0, 5, 5, P.greyLight, o); pc.set(10, 1, P.white); };
const chair: Draw = (pc) => { pc.box(2, 0, 7, 6, P.brownLight, o); pc.box(1, 6, 9, 2, P.brown, o); pc.vline(2, 8, 3, o); pc.vline(8, 8, 3, o); };
const cog: Draw = (pc) => { pc.ellipseBox(5, 5, 4, 4, P.grey, o); for (const [x, y] of [[5, 0], [5, 10], [0, 5], [10, 5]]) pc.rect(x - 1, y - (y === 10 ? 1 : 0), 2, 2, o); pc.ellipseBox(5, 5, 1, 1, P.cream, o); };
const journal: Draw = (pc) => { pc.box(1, 0, 9, 11, P.peachShade, o); pc.vline(3, 0, 11, o); pc.rect(5, 2, 4, 3, P.cream); pc.set(8, 10, P.butter); };
const flask: Draw = (pc) => { pc.box(4, 0, 3, 4, P.cream, o); for (let y = 4; y < 11; y += 1) pc.hline(5 - (y - 4) / 2 | 0, y, 1 + ((y - 4) | 0), P.sage); pc.outlineShapes(o); };
const pause: Draw = (pc) => { pc.box(2, 1, 3, 9, P.cream, o); pc.box(6, 1, 3, 9, P.cream, o); };
const map: Draw = (pc) => { pc.box(0, 1, 4, 9, P.butterLight, o); pc.box(4, 2, 4, 9, P.sageLight, o); pc.box(7, 1, 4, 9, P.butterLight, o); pc.set(5, 5, P.peachShade); pc.set(6, 6, P.peachShade); };
const magnifier: Draw = (pc) => { pc.ellipseBox(4, 4, 3, 3, P.blueLight, o); pc.set(3, 3, P.white); pc.line(7, 7, 10, 10, P.brown); pc.line(7, 8, 9, 10, o); };
const party: Draw = (pc) => { for (let y = 2; y < 11; y += 1) pc.hline(1, y, Math.max(1, y - 1), P.butter); pc.outlineShapes(o); for (const [x, y, c] of [[8, 1, P.peachShade], [10, 4, P.blueShade], [6, 0, P.sageShade]] as const) pc.set(x, y, c); };
const check: Draw = (pc) => { pc.box(0, 0, 11, 11, P.sageLight, o); pc.line(2, 5, 4, 8, P.sageShade); pc.line(4, 8, 8, 2, P.sageShade); };
const box: Draw = (pc) => { pc.box(0, 0, 11, 11, P.cream, o); };
const face = (mouth: 'smile' | 'grin' | 'sleep'): Draw => (pc) => {
  pc.ellipseBox(5, 6, 5, 4, P.greyLight, o); pc.ellipse(2, 1, 1, 2, P.greyLight); pc.ellipse(8, 1, 1, 2, P.greyLight); pc.set(2, 1, P.peach); pc.set(8, 1, P.peach);
  if (mouth === 'sleep') { pc.hline(3, 5, 2, o); pc.hline(6, 5, 2, o); } else { pc.set(3, 5, o); pc.set(7, 5, o); }
  if (mouth === 'grin') { pc.hline(4, 7, 3, o); pc.set(3, 6, o); pc.set(7, 6, o); } else pc.hline(4, 8, 3, P.peachShade);
};
const zz: Draw = (pc) => { pc.hline(1, 3, 5, P.blueShade); pc.line(5, 3, 1, 7, P.blueShade); pc.hline(1, 7, 5, P.blueShade); pc.hline(7, 6, 3, P.blueShade); pc.line(9, 6, 7, 8, P.blueShade); pc.hline(7, 8, 3, P.blueShade); };

const note: Draw = (pc) => { pc.vline(7, 1, 7, o); pc.hline(7, 1, 3, o); pc.ellipse(5, 8, 2, 2, P.blueShade); pc.set(4, 7, P.blueLight); };
const exclaim: Draw = (pc) => { pc.rect(4, 0, 3, 7, P.peachShade); pc.rect(4, 9, 3, 2, P.peachShade); pc.outlineShapes(o); };
const question: Draw = (pc) => { pc.hline(3, 1, 5, P.blueShade); pc.vline(8, 2, 3, P.blueShade); pc.vline(2, 2, 1, P.blueShade); pc.hline(5, 5, 3, P.blueShade); pc.vline(5, 6, 2, P.blueShade); pc.rect(5, 9, 2, 2, P.blueShade); pc.outlineShapes(o); };
const letter: Draw = (pc) => { pc.box(0, 2, 11, 8, P.cream, o); pc.line(1, 3, 5, 6, P.outline); pc.line(9, 3, 5, 6, P.outline); pc.set(5, 5, P.peachShade); pc.set(5, 6, P.peachShade); };
const hand: Draw = (pc) => { pc.ellipse(5, 7, 3, 3, P.peachLight); for (const x of [2, 4, 6, 8]) pc.vline(x, 1 + (x === 2 || x === 8 ? 2 : 0), 5, P.peachLight); pc.outlineShapes(o); };
const teacup: Draw = (pc) => { pc.box(1, 4, 7, 6, P.cream, o); pc.ellipse(9, 6, 1, 2, o); pc.hline(2, 5, 5, P.brownLight); pc.vline(3, 0, 2, P.greyLight); pc.vline(5, 1, 2, P.greyLight); pc.hline(0, 10, 9, o); };
const eyes: Draw = (pc) => { for (const x of [3, 8]) { pc.ellipseBox(x, 5, 2, 3, P.white, o); pc.rect(x, 5, 1, 2, o); } };
const carrot: Draw = (pc) => { for (let y = 3; y < 11; y += 1) pc.hline(5 - Math.max(0, (10 - y) >> 2), y, 1 + Math.max(0, (10 - y) >> 1), P.peachShade); pc.line(5, 3, 3, 0, P.sageShade); pc.line(5, 3, 7, 0, P.sageShade); pc.outlineShapes(o); };
const speech: Draw = (pc) => { pc.box(0, 0, 11, 8, P.white, o); pc.set(2, 8, o); pc.set(2, 9, o); pc.set(3, 8, o); for (const x of [3, 5, 7]) pc.set(x, 4, P.outline); };
const hammer: Draw = (pc) => { pc.line(2, 10, 7, 4, P.brown); pc.box(5, 0, 6, 4, P.grey, o); pc.set(6, 1, P.white); };
const apple: Draw = (pc) => { pc.ellipseBox(5, 6, 4, 4, P.peachShade, o); pc.vline(5, 0, 3, P.brown); pc.ellipse(7, 1, 1, 1, P.sage); pc.set(3, 4, P.peachLight); };
const teddy: Draw = (pc) => { pc.ellipse(2, 2, 1, 1, P.brownLight); pc.ellipse(8, 2, 1, 1, P.brownLight); pc.ellipse(5, 4, 3, 3, P.brownLight); pc.ellipse(5, 9, 3, 2, P.brownLight); pc.outlineShapes(o); pc.set(4, 4, o); pc.set(6, 4, o); pc.set(5, 5, P.brownShade); };
const snow: Draw = (pc) => { pc.vline(5, 0, 11, P.blueShade); pc.hline(0, 5, 11, P.blueShade); pc.line(1, 1, 9, 9, P.blueLight); pc.line(9, 1, 1, 9, P.blueLight); pc.set(5, 5, P.white); };
const hat: Draw = (pc) => { pc.ellipse(5, 8, 5, 2, P.butterShade); pc.ellipse(5, 5, 3, 3, P.butter); pc.hline(2, 7, 7, P.peachShade); pc.outlineShapes(o); };
const drops: Draw = (pc) => { for (const [x, y] of [[3, 3], [8, 6]]) { pc.ellipse(x, y + 2, 2, 2, P.blue); pc.set(x, y - 1, P.blue); pc.set(x, y, P.blue); } pc.outlineShapes(o); };
const clapper: Draw = (pc) => { pc.box(0, 4, 11, 7, P.ink, o); pc.box(0, 1, 11, 3, P.grey, o); for (const x of [2, 6]) pc.line(x, 1, x + 2, 3, o); };
const umbrella: Draw = (pc) => { pc.ellipse(5, 4, 5, 3, P.blue); for (let x = 0; x < 11; x += 1) pc.clear(x, 5); pc.rect(0, 4, 11, 1, P.blue); pc.vline(5, 4, 6, P.brown); pc.set(4, 10, P.brown); pc.outlineShapes(o); };
const wave: Draw = (pc) => { pc.ellipse(4, 7, 4, 3, P.blue); pc.ellipse(8, 5, 3, 3, P.blueLight); pc.set(9, 3, P.white); pc.rect(0, 8, 11, 3, P.blue); pc.outlineShapes(o); };
const anchor: Draw = (pc) => { pc.vline(5, 1, 9, P.grey); pc.hline(3, 3, 5, P.grey); pc.ellipse(5, 1, 1, 1, P.grey); pc.line(1, 7, 5, 10, P.grey); pc.line(9, 7, 5, 10, P.grey); pc.outlineShapes(o); };
const paw: Draw = (pc) => { pc.ellipse(5, 7, 3, 2, P.brownLight); for (const [x, y] of [[2, 3], [5, 2], [8, 3]]) pc.ellipse(x, y, 1, 1, P.brownLight); pc.outlineShapes(o); };
const bowl: Draw = (pc) => { pc.ellipseBox(5, 7, 5, 3, P.cream, o); pc.ellipse(5, 5, 4, 1, P.peachShade); pc.vline(3, 1, 3, P.greyLight); pc.vline(7, 0, 3, P.greyLight); };
const compass: Draw = (pc) => { pc.ellipseBox(5, 5, 5, 5, P.cream, o); pc.vline(5, 1, 4, P.peachShade); pc.vline(5, 6, 4, P.blueShade); pc.set(5, 5, o); };
const pin: Draw = (pc) => { pc.ellipseBox(5, 3, 3, 3, P.peachShade, o); pc.vline(5, 6, 5, o); pc.set(4, 2, P.peachLight); };

/** Emoji (as the game's text writes them) to their pixel icon. */
export const ICONS: Record<string, Draw> = {
  '✨': sparkle, '🌟': star, '⭐': star, '📖': book, '📜': scroll, '🎯': target, '📅': calendar, '📋': board, '🏡': house,
  '♥': heart, '❤': heart, '🍃': leaf, '🌱': sprout, '☀': sun, '🌙': moon, '🎣': fish, '🐟': fish, '🧁': bun, '🐞': bug,
  '🎲': dice, '🧹': broom, '🪣': bucket, '🪵': log, '🎖': medal, '🏆': cup, '🐝': bee, '🌼': flower, '🌸': flower, '🪱': worm,
  '💡': bulb, '🫖': teapot, '📚': books, '🧺': basket, '🪨': stone, '🌳': tree, '🪓': axe, '🪑': chair, '⚙': cog, '📔': journal,
  '🧪': flask, '🗺': map, '🔎': magnifier, '🔍': magnifier, '🎉': party, '✅': check, '⬜': box, '🙂': face('smile'), '😊': face('grin'),
  '💤': zz, '😴': face('sleep'), '❚❚': pause,
  '♪': note, '❗': exclaim, '❓': question, '💌': letter, '📤': letter, '👋': hand, '☕': teacup, '👀': eyes, '🥕': carrot, '💬': speech,
  '🔨': hammer, '🍎': apple, '🧸': teddy, '❄': snow, '👒': hat, '💦': drops, '🎬': clapper, '☂': umbrella, '🌊': wave, '⚓': anchor,
  '🐾': paw, '🍲': bowl, '🧭': compass, '📍': pin, '🥱': face('sleep'), '😄': face('grin'), '🤝': heart, '💛': heart, '☾': moon,
  '🏘': house, '🌿': leaf, '🍞': bun
};

/** An icon's pixels (12 × 12), drawn once. */
const drawn = new Map<string, PixelCanvas>();
export function iconPixels(emoji: string): PixelCanvas | null {
  const draw = ICONS[emoji];
  if (!draw) return null;
  let pc = drawn.get(emoji);
  if (!pc) { pc = new PixelCanvas(12, 12); draw(pc); drawn.set(emoji, pc); }
  return pc;
}
