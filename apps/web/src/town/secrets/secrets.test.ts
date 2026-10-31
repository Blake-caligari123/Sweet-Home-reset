import { describe, expect, it } from 'vitest';
import { Area } from '../data/area';
import { hollowfern as pack } from '../data/test-pack';
import { T } from '../world/art/texture';
import { FEET, navFor, REACH } from '../world/nav';
import { withSecrets } from './secrets';

describe('secret places', () => {
  const bank = pack.areas.find((a) => a.id === 'far_bank')!;
  const secret = bank.doors.find((d) => d.needsFind)!;

  it('keeps the Far Bank\'s hidden door shut (just hedge) until the boathouse key is found', () => {
    expect(secret.to).toBe('boathouse');
    const shut = new Area(withSecrets(bank, []));
    expect(shut.doorAt(secret.x, secret.y)).toBeUndefined();
    expect(shut.walkable(secret.x, secret.y)).toBe(false);
    const open = new Area(withSecrets(bank, [secret.needsFind!]));
    expect(open.doorAt(secret.x, secret.y)).toBeTruthy();
    expect(open.groundAt(secret.x, secret.y)).toBe('path');
    const nav = navFor(open);
    const spawn = nav.nearestOpen({ x: bank.spawn.x * T + T / 2, y: bank.spawn.y * T + FEET })!;
    expect(nav.findPathNear(spawn, { x0: secret.x * T, y0: secret.y * T, x1: (secret.x + 1) * T, y1: (secret.y + 1) * T }, 0)).toBeTruthy();
  });

  it('hides the key under the Far Bank\'s mess, and the boathouse leads back with its clue', () => {
    expect((pack.finds ?? []).find((f) => f.id === secret.needsFind)?.areas).toEqual(['far_bank']);
    const house = pack.areas.find((a) => a.id === 'boathouse')!;
    expect(house.doors.map((d) => d.to)).toEqual(['far_bank']);
    expect(house.signs?.some((s) => s.text.includes('Thimble'))).toBe(true);
    const nav = navFor(new Area(house));
    const spawn = nav.nearestOpen({ x: house.spawn.x * T + T / 2, y: house.spawn.y * T + FEET })!;
    for (const s of house.signs ?? []) expect(nav.findPathNear(spawn, { x0: s.x * T, y0: s.y * T, x1: (s.x + 1) * T, y1: (s.y + 1) * T }, REACH)).toBeTruthy();
  });
});
