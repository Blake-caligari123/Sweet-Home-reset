import { describe, expect, it } from 'vitest';
import { migrate, MIGRATIONS, pickSave, SCHEMA_VERSION, stamp, type TownSave } from './save';

function fixture(): TownSave {
  return stamp({
    deviceId: 'test', day: 3, minutes: 600, fluff: { value: 60, max: 100, boost: 0 }, sparkles: 120,
    bag: [{ id: 'sock', count: 1 }, null], tools: { duster: 1 }, area: 'burrow', puff: { x: 4, y: 5, facing: 'down' },
    areas: {}, crops: [], flags: ['met_hazel'], friends: { hazel: { points: 3, talkedDay: 2, met: true } }, onboarding: 5, chores: { day: '', keys: [], total: 0 },
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

  it('falls back to the backup when main is corrupt', () => {
    const backup = fixture();
    expect(pickSave('{oops', backup)?.day).toBe(3);
    expect(pickSave({ schemaVersion: 1, day: 'x' }, backup)?.day).toBe(3);
    expect(pickSave(null, null)).toBeNull();
  });

  it('upgrades a milestone 1 save (schema 1) with an empty friends list', () => {
    const { friends, ...rest } = fixture();
    void friends;
    const v2 = migrate({ ...rest, schemaVersion: 1 })!;
    expect(v2.schemaVersion).toBe(2);
    expect(v2.friends).toEqual({});
    expect(v2.flags).toEqual(['met_hazel']);
  });
});
