import { describe, expect, it } from 'vitest';
import { inPlace, isSorted, par, shelfFor, sortedShelf, stars, swap } from './shelf';

describe('sort the shelf', () => {
  it('deals a jumbled shelf that grows through the year', () => {
    expect(shelfFor(3)).toHaveLength(8); expect(shelfFor(20)).toHaveLength(9); expect(shelfFor(70)).toHaveLength(16);
    for (let d = 1; d < 90; d += 1) { expect(isSorted(shelfFor(d))).toBe(false); expect(par(shelfFor(d))).toBeGreaterThanOrEqual(3); }
    expect(shelfFor(5)).toEqual(shelfFor(5)); expect(shelfFor(5, 1)).not.toEqual(shelfFor(5));
  });

  it('sorts in exactly par swaps by putting each book home, glowing as they land', () => {
    let books = shelfFor(30);
    const best = par(books); let n = 0;
    while (!isSorted(books)) {
      const i = books.findIndex((_, k) => !inPlace(books, k));
      const target = sortedShelf(books)[i];
      books = swap(books, i, books.indexOf(target)); n += 1;
      expect(inPlace(books, i)).toBe(true);
    }
    expect(n).toBe(best);
    expect(stars(best, best)).toBe(3); expect(stars(best + 1, best)).toBe(2); expect(stars(best * 3, best)).toBe(1);
  });
});
