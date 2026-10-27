import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BANNED_WORDS, LINES } from './lines';
import { validatePack } from './pack';
import { buy, isUnlocked, migrate, newProfile, rewardRoom, roomState, showUp, spendEnergy, tickChore } from './profile';

const pack = validatePack(JSON.parse(readFileSync(new URL('../../public/packs-bundled/starter-home/2/pack.json', import.meta.url), 'utf8')));

describe('profile and economy', () => {
  it('pays fixed chore rewards up to 5 a day, once per chore, then still counts ticks without paying', () => {
    const p = newProfile();
    const results = Array.from({ length: 6 }, (_, i) => tickChore(p, '2026-10-27', `c${i}`)!);
    expect(results.slice(0, 5).every((r) => r.sparkles === 10 && r.energy === 1)).toBe(true);
    expect(results[5]).toEqual({ sparkles: 0, energy: 0, capped: true });
    expect(p.chores.total).toBe(6);
    expect(p.sparkles).toBe(50);
    expect(tickChore(p, '2026-10-28', 'c0')!.capped).toBe(false);
    expect(tickChore(p, '2026-10-28', 'c0')).toBeNull();
  });

  it('never lowers Cosy Days, and throws a party after time away', () => {
    const p = newProfile();
    expect(showUp(p, '2026-10-01')).toEqual({ welcomeBack: false, newDay: true });
    expect(showUp(p, '2026-10-01').newDay).toBe(false);
    expect(showUp(p, '2026-10-11')).toEqual({ welcomeBack: true, newDay: true });
    expect(p.cosyDays).toBe(2);
  });

  it('opens the next room after the one before it, or early through real chores', () => {
    const [kitchen, living] = pack.rooms;
    const p = newProfile();
    expect(isUnlocked(p, kitchen)).toBe(true);
    expect(isUnlocked(p, living)).toBe(false);
    tickChore(p, '2026-10-27', 'a'); tickChore(p, '2026-10-27', 'b');
    expect(isUnlocked(p, living)).toBe(true);
    const q = newProfile();
    rewardRoom(q, kitchen.id);
    expect(isUnlocked(q, living)).toBe(true);
  });

  it('starts a fresh mess after a room is restored', () => {
    const p = newProfile();
    roomState(p, 'kitchen-nook').session = { seed: 1, hp: [], popped: [], placed: [], stage: 50, complete: false };
    expect(rewardRoom(p, 'kitchen-nook')).toBe(25);
    expect(p.rooms['kitchen-nook']).toEqual({ restored: 1, seed: 2 });
  });

  it('sells at fixed prices, once, and never below zero', () => {
    const p = newProfile();
    p.sparkles = 100;
    expect(buy(p, 'plant', 120)).toBe('short');
    expect(buy(p, 'plant', 60)).toBe('bought');
    expect(buy(p, 'plant', 60)).toBe('owned');
    expect(p.sparkles).toBe(40);
    expect(spendEnergy(p, 1)).toBe(false);
    expect(p.energy).toBe(0);
  });

  it('repairs a broken save instead of crashing', () => {
    expect(migrate(null).sparkles).toBe(0);
    const fixed = migrate({ schemaVersion: 1, sparkles: -4, owned: ['plant', 3], outfit: 'crown', settings: { sound: false } });
    expect(fixed.sparkles).toBe(0);
    expect(fixed.owned).toEqual(['plant']);
    expect(fixed.outfit).toBeNull();
    expect(fixed.settings).toMatchObject({ sound: false, haptics: true });
  });

  it('keeps Puff kind: no banned words in any line or pack text', () => {
    const texts = [...Object.values(LINES).flat(), ...pack.rooms.flatMap((r) => [...r.puffLines, ...r.chores.map((c) => c.label), r.blurb])];
    for (const text of texts) for (const word of BANNED_WORDS) expect(text.toLowerCase()).not.toMatch(new RegExp(`\\b${word}\\b`));
    for (const text of Object.values(LINES).flat()) expect(text.split(/\s+/).length).toBeLessThanOrEqual(7);
  });
});
