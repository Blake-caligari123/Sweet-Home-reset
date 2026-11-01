import { seeded } from '../../shared/art/pixel-canvas';

// Sort the shelf (a mini-game with Moss): a shelf of jumbled books. Tap two to swap them, until
// they run in colour order, shortest to tallest within each colour. Each book glows as it clicks
// into place. Fewer swaps earn more stars; any finish is a good one. Pure rules; shelf-sheet.ts draws it.

export interface Book { colour: number; height: number }

/** Today's shelf: bigger and more colourful as the year goes on, never already sorted. */
export function shelfFor(day: number, round = 0): Book[] {
  const colours = day < 15 ? 2 : day < 40 ? 3 : 4;
  const per = day < 15 ? 4 : 3 + Math.min(1, Math.floor(day / 60));
  const books: Book[] = [];
  for (let c = 0; c < colours; c += 1) for (let hgt = 1; hgt <= per; hgt += 1) books.push({ colour: c, height: hgt });
  const r = seeded(day * 4099 + round * 61 + 7);
  for (let tries = 0; tries < 20; tries += 1) {
    for (let i = books.length - 1; i > 0; i -= 1) { const j = Math.floor(r() * (i + 1)); [books[i], books[j]] = [books[j], books[i]]; }
    if (par(books) >= Math.min(4, books.length - 2)) break;
  }
  return books;
}

const rank = (b: Book) => b.colour * 100 + b.height;

/** The shelf sorted: where each book belongs. */
export const sortedShelf = (books: Book[]) => [...books].sort((a, b) => rank(a) - rank(b));
/** Is book i where it belongs? */
export const inPlace = (books: Book[], i: number) => rank(sortedShelf(books)[i]) === rank(books[i]);
export const isSorted = (books: Book[]) => books.every((b, i) => i === 0 || rank(books[i - 1]) < rank(b));
export function swap(books: Book[], i: number, j: number): Book[] { const out = [...books]; [out[i], out[j]] = [out[j], out[i]]; return out; }

/** The fewest swaps that sort it: books minus cycles. */
export function par(books: Book[]): number {
  const order = sortedShelf(books);
  const want = books.map((b) => order.findIndex((x) => rank(x) === rank(b)));
  const seen = new Array(books.length).fill(false);
  let cycles = 0;
  for (let i = 0; i < books.length; i += 1) {
    if (seen[i]) continue;
    cycles += 1;
    for (let j = i; !seen[j]; j = want[j]) seen[j] = true;
  }
  return books.length - cycles;
}

/** Stars for a finish: the fewest swaps is three, a few more is two, any finish is one. */
export const stars = (swaps: number, best: number) => swaps <= best ? 3 : swaps <= best + Math.ceil(best / 2) ? 2 : 1;
