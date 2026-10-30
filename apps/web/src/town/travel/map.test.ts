import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TUNING } from '../data/tuning';
import { hopsBetween, travelPlaces } from './map';

describe('town map travel (NEXT-PHASE §9)', () => {
  it('counts the doors between two places along the shortest way', () => {
    expect(hopsBetween(pack.areas, 'burrow', 'burrow')).toBe(0);
    expect(hopsBetween(pack.areas, 'burrow', 'yard')).toBe(1);
    expect(hopsBetween(pack.areas, 'burrow', 'square')).toBe(2);
    expect(hopsBetween(pack.areas, 'square', 'burrow')).toBe(2);
  });

  it('offers only places Puff has been, grouped, with the trip time from here', () => {
    const places = travelPlaces(pack.areas, ['burrow', 'yard', 'square', 'bakery', 'cave_1'], 'burrow');
    expect(places.map((p) => p.id)).toEqual(['yard', 'square', 'burrow', 'bakery', 'cave_1']);
    expect(places.map((p) => p.group)).toEqual(['Outdoors', 'Outdoors', 'Homes', 'Homes', 'Caves']);
    const square = places.find((p) => p.id === 'square')!;
    expect(square.minutes).toBe(2 * TUNING.mapTravelMinutesPerHop);
    expect(places.find((p) => p.id === 'burrow')!.here).toBe(true);
  });

  it('can reach every place from the burrow once the repairs are built (their doors open new places)', () => {
    const built = pack.areas.map((a) => {
      const repairs = (pack.plots ?? []).filter((p) => p.area === a.id).flatMap((p) => p.allow.flatMap((id) => pack.buildings?.find((b) => b.id === id)?.doors ?? []));
      return { ...a, doors: [...a.doors, ...repairs] };
    });
    for (const a of pack.areas) expect(hopsBetween(built, 'burrow', a.id), a.id).not.toBeNull();
  });
});
