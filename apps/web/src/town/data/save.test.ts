import { describe, expect, it } from 'vitest';
import { DEFAULT_NAMES } from '../play/names';
import { fromNewerVersion, migrate, MIGRATIONS, newestSlot, pickSave, SCHEMA_VERSION, stamp, type TownSave } from './save';

function fixture(): TownSave {
  return stamp({
    deviceId: 'test', day: 3, minutes: 600, fluff: { value: 60, max: 100, boost: 0 }, sparkles: 120,
    bag: [{ id: 'sock', count: 1 }, null], tools: { duster: 1 }, area: 'burrow', puff: { x: 4, y: 5, facing: 'down' },
    areas: {}, crops: [], flags: ['met_hazel'], friends: { hazel: { points: 3, talkedDay: 2, met: true } }, onboarding: 5, chores: { day: '', keys: [], total: 0 }, names: { puff: 'Dusty', town: 'Mossbrook' },
    settings: { sound: true, music: true, haptics: true, reducedMotion: false, relaxed: false, autoTool: true }
  });
}

describe('town save', () => {
  it('round-trips through JSON', () => {
    const s = fixture();
    expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(s.savedAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/);
  });

  it('upgrades through a migration chain on a schema bump, keeping unknown fields', () => {
    const v1 = { ...fixture(), futureField: 'kept' };
    const migrations = { ...MIGRATIONS, [SCHEMA_VERSION]: (s: Record<string, unknown>) => ({ ...s, pets: ['frog'] }) };
    const v2 = migrate(v1, migrations, SCHEMA_VERSION + 1)!;
    expect(v2.schemaVersion).toBe(SCHEMA_VERSION + 1);
    expect(v2.pets).toEqual(['frog']);
    expect(v2.futureField).toBe('kept');
    expect(v2.day).toBe(3);
  });

  it('refuses a save from the future or with a gap in the chain', () => {
    expect(migrate({ ...fixture(), schemaVersion: 9 })).toBeNull();
    expect(migrate(fixture(), {}, SCHEMA_VERSION + 1)).toBeNull();
  });

  it('loads the newer of the two slots, so a mid-day autosave survives a reload after bedtime', () => {
    // Bedtime wrote both slots on day 3; the autosave later that day wrote only the backup.
    const bedtime = { ...fixture(), savedAt: '2026-10-28T08:00:00+11:00' };
    const midday = { ...fixture(), minutes: 900, sparkles: 300, savedAt: '2026-10-28T08:20:00+11:00' };
    expect(pickSave(bedtime, midday)?.sparkles).toBe(300);
    expect(pickSave(midday, bedtime)?.sparkles).toBe(300);
    // Saves made in different time zones still compare by the real moment.
    const earlier = { ...fixture(), sparkles: 7, savedAt: '2026-10-28T09:10:00+12:00' }; // 21:10 UTC, before the 21:20 UTC autosave
    expect(pickSave(earlier, midday)?.sparkles).toBe(300);
    // The quick copy written as the page closes counts too, when it's the newest.
    const leaving = { ...fixture(), sparkles: 450, savedAt: '2026-10-28T08:25:00+11:00' };
    expect(pickSave(bedtime, midday, leaving)?.sparkles).toBe(450);
    expect(pickSave(bedtime, midday, '{oops')?.sparkles).toBe(300);
    // A tie keeps main.
    expect(pickSave({ ...bedtime, sparkles: 1 }, { ...bedtime, sparkles: 2 })?.sparkles).toBe(1);
  });

  it('falls back to the backup when main is corrupt', () => {
    const backup = fixture();
    expect(pickSave('{oops', backup)?.day).toBe(3);
    expect(pickSave({ schemaVersion: 1, day: 'x' }, backup)?.day).toBe(3);
    expect(pickSave(null, null)).toBeNull();
  });

  it('upgrades a milestone 1 save (schema 1) all the way, with an empty friends list and the usual names', () => {
    const { friends, names, ...rest } = fixture();
    void friends; void names;
    const now = migrate({ ...rest, schemaVersion: 1 })!;
    expect(now.schemaVersion).toBe(SCHEMA_VERSION);
    expect(now.friends).toEqual({});
    expect(now.names).toEqual(DEFAULT_NAMES);
    expect(now.flags).toEqual(['met_hazel']);
  });

  it('gives a schema 2 save the usual names, keeping everything else (and is the same run twice)', () => {
    const { names, ...rest } = fixture();
    void names;
    const v2 = { ...rest, schemaVersion: 2, futureField: 'kept' };
    const now = migrate(v2)!;
    expect(now.schemaVersion).toBe(3);
    expect(now.names).toEqual(DEFAULT_NAMES);
    expect({ ...now, names: undefined, schemaVersion: 2 }).toEqual({ ...v2, names: undefined });
    expect(migrate(now)).toEqual(now);
  });

  it('keeps names already in a save', () => {
    expect(migrate(fixture())!.names).toEqual({ puff: 'Dusty', town: 'Mossbrook' });
  });

  it('spots a save from a newer version of the game, so it is never overwritten', () => {
    expect(fromNewerVersion(fixture(), null, '{oops')).toBe(false);
    expect(fromNewerVersion(fixture(), { ...fixture(), schemaVersion: SCHEMA_VERSION + 1 })).toBe(true);
  });

  it('hands back the raw slot it picked, for the pre-upgrade copy', () => {
    const { names, ...rest } = fixture();
    void names;
    const old = { ...rest, schemaVersion: 2, savedAt: '2099-01-01T09:00:00+11:00' };
    const best = newestSlot([fixture(), old])!;
    expect(best.raw).toBe(old);
    expect(best.save.schemaVersion).toBe(SCHEMA_VERSION);
  });
});
