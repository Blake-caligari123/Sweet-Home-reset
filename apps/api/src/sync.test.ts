import { afterEach, describe, expect, it, vi } from 'vitest';
import { SAVE_MAX_BYTES } from '@sweet-home-reset/shared';
import { call, signIn, testEnv } from './testing/app';

afterEach(() => vi.unstubAllGlobals());

const put = (env: ReturnType<typeof testEnv>, token: string, baseVersion: number, deviceId: string, extra: object = {}) =>
  call(env, '/api/save', { method: 'PUT', token, json: { baseVersion, blob: JSON.stringify({ schemaVersion: 3, day: baseVersion + 1 }), deviceId, savedAt: `2026-10-30T10:0${baseVersion}:00+11:00`, schemaVersion: 3, ...extra } });

describe('opt-in sync (AT-S4)', () => {
  it('keeps one cloud save with a version, and hands it back', async () => {
    const env = testEnv();
    const token = await signIn(env);
    expect((await call(env, '/api/save', { token })).status).toBe(404);
    expect(await (await put(env, token, 0, 'phone')).json()).toEqual({ version: 1 });
    const got = await (await call(env, '/api/save', { token })).json() as { version: number; deviceId: string; blob: string };
    expect(got).toMatchObject({ version: 1, deviceId: 'phone' });
    expect(JSON.parse(got.blob).day).toBe(1);
  });

  it('never merges: a save from an older version gets 409 and the cloud copy, so the player can choose', async () => {
    const env = testEnv();
    const token = await signIn(env);
    await put(env, token, 0, 'phone');
    const clash = await put(env, token, 0, 'tablet');
    expect(clash.status).toBe(409);
    expect(await clash.json()).toMatchObject({ error: 'conflict', server: { version: 1, deviceId: 'phone' } });
    // Keeping the tablet's copy: save on top of version 1; the phone's copy stays in history.
    expect((await put(env, token, 1, 'tablet')).status).toBe(200);
    expect(await env.DB.prepare('SELECT device_id FROM save_history').first('device_id')).toBe('phone');
  });

  it('refuses a save that is too big, not JSON, or newer than the server knows', async () => {
    const env = testEnv();
    const token = await signIn(env);
    expect((await put(env, token, 0, 'p', { blob: 'x'.repeat(SAVE_MAX_BYTES + 1) })).status).toBe(413);
    expect((await put(env, token, 0, 'p', { blob: '{nope' })).status).toBe(400);
    expect((await put(env, token, 0, 'p', { schemaVersion: 99 })).status).toBe(422);
  });

  it('keeps at most 10 old copies', async () => {
    const env = testEnv();
    const token = await signIn(env);
    for (let v = 0; v < 13; v += 1) await put(env, token, v, 'phone');
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM save_history').first('n')).toBe(10);
  });

  it('needs sign-in', async () => {
    expect((await call(testEnv(), '/api/save')).status).toBe(401);
  });
});
