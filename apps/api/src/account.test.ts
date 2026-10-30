import { afterEach, describe, expect, it, vi } from 'vitest';
import { call, signIn, testEnv } from './testing/app';

afterEach(() => vi.unstubAllGlobals());

describe('the account (AT-S7, AT-S14)', () => {
  it('says who is signed in and whether the full game is owned', async () => {
    const env = testEnv();
    const token = await signIn(env);
    expect(await (await call(env, '/api/me', { token })).json()).toEqual({ id: expect.any(String), email: 'kim@example.com', fullGame: false, appleLinked: false });
    expect((await call(env, '/api/me')).status).toBe(401);
  });

  it('exports everything kept about the player', async () => {
    const env = testEnv();
    const token = await signIn(env);
    await call(env, '/api/save', { method: 'PUT', token, json: { baseVersion: 0, blob: '{"schemaVersion":3}', deviceId: 'd1', savedAt: '2026-10-30T10:00:00+11:00', schemaVersion: 3 } });
    const data = await (await call(env, '/api/me/export', { token })).json() as Record<string, unknown>;
    expect(Object.keys(data).sort()).toEqual(['account', 'save', 'saveHistory']);
    expect(JSON.stringify(data)).not.toMatch(/apple_refresh_token|id_hash/);
  });

  it('deletes: sign-in stops, the save goes at once, and the account itself after 30 days', async () => {
    const env = testEnv();
    const token = await signIn(env);
    await call(env, '/api/save', { method: 'PUT', token, json: { baseVersion: 0, blob: '{"schemaVersion":3}', deviceId: 'd1', savedAt: 'x', schemaVersion: 3 } });
    const res = await call(env, '/api/me', { method: 'DELETE', token });
    expect(res.status).toBe(200);
    expect((await res.json() as { storeNote: string }).storeNote).toMatch(/App Store|Google Play/);
    expect((await call(env, '/api/me', { token })).status).toBe(401);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM saves').first('n')).toBe(0);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first('n')).toBe(1);
  });

  it('has a public page that says how to delete an account (Google Play needs one)', async () => {
    const res = await call(testEnv(), '/delete-account');
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    expect(await res.text()).toMatch(/Delete account/);
  });
});
