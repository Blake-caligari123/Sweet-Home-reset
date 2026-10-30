import { vi } from 'vitest';
import { app } from '../index';
import type { Env } from '../env';
import { testDb } from './d1';

/** A fresh database and every secret set to a test value; outside calls are stubbed per test. */
export function testEnv(extra: Partial<Env> = {}): Env {
  return {
    DB: testDb(), PUBLIC_ORIGIN: 'https://game.test', RESEND_API_KEY: 're_test', EMAIL_FROM: 'puff@game.test',
    STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: 'whsec_test', STRIPE_PRICE_FULL_GAME: 'price_test',
    REVENUECAT_WEBHOOK_AUTH: 'rc-secret', APPLE_CLIENT_IDS: 'com.pixelvortexgames.sweethomereset,com.pixelvortexgames.sweethomereset.web',
    ...extra
  };
}

/** Call the Worker like a browser on the game's site would. */
export function call(env: Env, path: string, init: RequestInit & { json?: unknown; token?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set('content-type', 'application/json');
  if (init.token) headers.set('authorization', `Bearer ${init.token}`);
  const body = init.json !== undefined ? JSON.stringify(init.json) : init.body;
  return app.request(path, { ...init, headers, body }, env);
}

/** Stub outside calls (Resend, Stripe, Apple, RevenueCat); returns the mock to inspect. */
export function stubFetch(answer: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => answer(String(input instanceof Request ? input.url : input), init));
  vi.stubGlobal('fetch', mock);
  return mock;
}

/** Sign someone in through the real magic-link route, returning their session token. */
export async function signIn(env: Env, email = 'kim@example.com') {
  let link = '';
  stubFetch((_url, init) => { link = JSON.parse(String(init?.body)).text.match(/signin=(\w+)/)[1]; return new Response('{}'); });
  await call(env, '/api/auth/start', { method: 'POST', json: { email, ageConfirmed: true } });
  const res = await call(env, '/api/auth/verify', { method: 'POST', json: { token: link } });
  return (await res.json() as { token: string }).token;
}
