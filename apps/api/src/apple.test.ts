import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { sha256 } from './env';
import { call, stubFetch, testEnv } from './testing/app';

afterEach(() => vi.unstubAllGlobals());

const b64url = (data: ArrayBuffer | string) => Buffer.from(typeof data === 'string' ? data : new Uint8Array(data)).toString('base64url');
let keys: CryptoKeyPair;
let jwk: JsonWebKey;
let ecPem: string;

beforeAll(async () => {
  keys = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
  jwk = { ...(await crypto.subtle.exportKey('jwk', keys.publicKey) as JsonWebKey), kid: 'k1', alg: 'RS256', use: 'sig' } as unknown as JsonWebKey;
  const ec = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']) as CryptoKeyPair;
  ecPem = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(new Uint8Array(await crypto.subtle.exportKey('pkcs8', ec.privateKey) as ArrayBuffer)).toString('base64')}\n-----END PRIVATE KEY-----`;
});

/** An identity token as Apple would sign it, with any claim overridden. */
async function appleToken(claims: Record<string, unknown> = {}, signer?: CryptoKey) {
  const head = b64url(JSON.stringify({ alg: 'RS256', kid: 'k1' }));
  const body = b64url(JSON.stringify({ iss: 'https://appleid.apple.com', aud: 'com.pixelvortexgames.sweethomereset', sub: 'apple-001', email: 'kim@privaterelay.appleid.com', email_verified: 'true', exp: Math.floor(Date.now() / 1000) + 600, nonce: await sha256('n0nce'), ...claims }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signer ?? keys.privateKey, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(sig)}`;
}

const appleCalls = () => stubFetch((url) => {
  if (url.endsWith('/auth/keys')) return Response.json({ keys: [jwk] });
  if (url.endsWith('/auth/token')) return Response.json({ refresh_token: 'r-token' });
  return new Response('');
});

const signInWithApple = (env: ReturnType<typeof testEnv>, identityToken: string, extra: object = {}) =>
  call(env, '/api/auth/apple', { method: 'POST', json: { identityToken, nonce: 'n0nce', ageConfirmed: true, ...extra } });

describe('Sign in with Apple (AT16)', () => {
  it('makes the account once; signing in again is the same player', async () => {
    const env = testEnv();
    appleCalls();
    const first = await signInWithApple(env, await appleToken());
    expect(first.status).toBe(200);
    await signInWithApple(env, await appleToken());
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first('n')).toBe(1);
  });

  it('refuses a forged, expired, wrong-audience or wrong-nonce token', async () => {
    const env = testEnv();
    appleCalls();
    const other = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign'])) as CryptoKeyPair;
    for (const token of [
      await appleToken({}, other.privateKey),
      await appleToken({ exp: Math.floor(Date.now() / 1000) - 10 }),
      await appleToken({ aud: 'com.someone.else' }),
      await appleToken({ nonce: await sha256('other') })
    ]) expect((await signInWithApple(env, token)).status).toBe(401);
  });

  it('revokes Apple\'s token when the account is deleted', async () => {
    const env = testEnv({ APPLE_TEAM_ID: 'TEAM', APPLE_KEY_ID: 'KEY', APPLE_PRIVATE_KEY: ecPem });
    const apple = appleCalls();
    const res = await signInWithApple(env, await appleToken(), { authorizationCode: 'code-1' });
    const { token } = await res.json() as { token: string };
    await call(env, '/api/me', { method: 'DELETE', token });
    const revoke = apple.mock.calls.find(([url]) => String(url).endsWith('/auth/revoke'));
    expect(new URLSearchParams(String(revoke?.[1]?.body)).get('token')).toBe('r-token');
  });
});
