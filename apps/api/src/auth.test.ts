import { afterEach, describe, expect, it, vi } from 'vitest';
import { call, signIn, stubFetch, testEnv } from './testing/app';

afterEach(() => vi.unstubAllGlobals());

describe('magic-link sign-in (AT-S2)', () => {
  it('needs the 16+ box for a new account, and sends one link', async () => {
    const env = testEnv();
    const mail = stubFetch(() => new Response('{}'));
    expect((await call(env, '/api/auth/start', { method: 'POST', json: { email: 'kim@example.com' } })).status).toBe(400);
    expect((await call(env, '/api/auth/start', { method: 'POST', json: { email: 'Kim@Example.com ', ageConfirmed: true } })).status).toBe(200);
    expect(mail).toHaveBeenCalledOnce();
    expect(JSON.parse(String(mail.mock.calls[0][1]?.body)).to).toBe('kim@example.com');
  });

  it('turns a link into a session once; a used or made-up token gets nothing', async () => {
    const env = testEnv();
    let token = '';
    stubFetch((_u, init) => { token = JSON.parse(String(init?.body)).text.match(/signin=(\w+)/)[1]; return new Response('{}'); });
    await call(env, '/api/auth/start', { method: 'POST', json: { email: 'kim@example.com', ageConfirmed: true } });
    const first = await call(env, '/api/auth/verify', { method: 'POST', json: { token } });
    expect(first.status).toBe(200);
    expect(first.headers.get('set-cookie')).toMatch(/shr_session=\w+;.*HttpOnly.*Secure.*SameSite=Lax/i);
    expect((await call(env, '/api/auth/verify', { method: 'POST', json: { token } })).status).toBe(400);
    expect((await call(env, '/api/auth/verify', { method: 'POST', json: { token: 'abc' } })).status).toBe(400);
  });

  it('slows down after 5 links an hour for one email', async () => {
    const env = testEnv();
    stubFetch(() => new Response('{}'));
    const codes = [];
    for (let i = 0; i < 6; i += 1) codes.push((await call(env, '/api/auth/start', { method: 'POST', json: { email: 'kim@example.com', ageConfirmed: true } })).status);
    expect(codes).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it('says email sign-in is unavailable when Resend is not set up (and the game is unaffected)', async () => {
    const env = testEnv({ RESEND_API_KEY: undefined });
    const res = await call(env, '/api/auth/start', { method: 'POST', json: { email: 'kim@example.com', ageConfirmed: true } });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'email_unavailable' });
  });

  it('signs out: the token stops working', async () => {
    const env = testEnv();
    const token = await signIn(env);
    expect((await call(env, '/api/me', { token })).status).toBe(200);
    await call(env, '/api/auth/logout', { method: 'POST', token });
    expect((await call(env, '/api/me', { token })).status).toBe(401);
  });
});

describe('hardening (AT-S16)', () => {
  it('refuses a write from another site, and answers CORS only for the game', async () => {
    const env = testEnv();
    const res = await call(env, '/api/auth/logout', { method: 'POST', headers: { origin: 'https://evil.test' } });
    expect(res.status).toBe(403);
    expect((await call(env, '/api/health', { method: 'OPTIONS', headers: { origin: 'https://evil.test' } })).status).toBe(403);
    const ok = await call(env, '/api/health', { headers: { origin: 'https://game.test' } });
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://game.test');
    expect(ok.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('gives every error as { error: "code" }', async () => {
    const res = await call(testEnv(), '/api/nothing-here');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});
