import { Hono } from 'hono';
import { startSession } from './auth';
import { nowIso, sha256, type App, type Env } from './env';
import { fail, readJson } from './guard';

// Sign in with Apple (BACKEND-PLAN §8, AT16). The app sends Apple's identity token; we check it
// against Apple's published keys (issuer, audience = our bundle or Services ID, expiry, hashed
// nonce), then find the player by Apple id, or by verified email, or make a new 16+ account. With
// Apple keys set we also keep a refresh token, so deleting the account can revoke it (Apple requires that).

const APPLE = 'https://appleid.apple.com';

const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));
const b64url = (bytes: Uint8Array | string) => btoa(typeof bytes === 'string' ? bytes : String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

interface Claims { iss: string; aud: string; sub: string; exp: number; nonce?: string; email?: string; email_verified?: string | boolean }

/** The token's claims if Apple signed it for us and it's still valid; otherwise null. */
async function verifyIdentity(env: Env, token: string, nonce: string): Promise<Claims | null> {
  const [head, body, sig] = token.split('.');
  if (!head || !body || !sig) return null;
  try {
    const { kid } = JSON.parse(new TextDecoder().decode(fromB64url(head))) as { kid: string };
    const { keys } = await (await fetch(`${APPLE}/auth/keys`)).json() as { keys: (JsonWebKey & { kid: string })[] };
    const jwk = keys.find((k) => k.kid === kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromB64url(sig), new TextEncoder().encode(`${head}.${body}`)))) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Claims;
    const audiences = (env.APPLE_CLIENT_IDS ?? '').split(',').map((s) => s.trim());
    if (claims.iss !== APPLE || !audiences.includes(claims.aud) || claims.exp * 1000 < Date.now() || claims.nonce !== await sha256(nonce)) return null;
    return claims;
  } catch { return null; }
}

/** The ES256 client secret Apple wants for its token and revoke endpoints. */
async function clientSecret(env: Env, clientId: string) {
  const pem = (env.APPLE_PRIVATE_KEY ?? '').replace(/-----[^-]+-----|\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0)), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: 'ES256', kid: env.APPLE_KEY_ID }))}.${b64url(JSON.stringify({ iss: env.APPLE_TEAM_ID, iat: now, exp: now + 300, aud: APPLE, sub: clientId }))}`;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${b64url(new Uint8Array(sig))}`;
}

const appleKeys = (env: Env) => !!(env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY);

/** On account deletion: tell Apple to forget its link to us (a no-op without a stored token). */
export async function revokeApple(env: Env, userId: string) {
  const row = await env.DB.prepare('SELECT apple_refresh_token, apple_client_id FROM users WHERE id = ?').bind(userId).first<{ apple_refresh_token: string | null; apple_client_id: string | null }>();
  if (!row?.apple_refresh_token || !row.apple_client_id || !appleKeys(env)) return;
  await fetch(`${APPLE}/auth/revoke`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: row.apple_client_id, client_secret: await clientSecret(env, row.apple_client_id), token: row.apple_refresh_token, token_type_hint: 'refresh_token' }) });
}

/** The player for these claims: by Apple id, then by verified email, else a new account (16+ ticked). */
async function playerFor(db: D1Database, claims: Claims, ageConfirmed: boolean) {
  const bySub = await db.prepare('SELECT id, deleted_requested_at FROM users WHERE apple_sub = ?').bind(claims.sub).first<{ id: string; deleted_requested_at: string | null }>();
  if (bySub) return bySub.deleted_requested_at ? null : bySub.id;
  const verified = claims.email && String(claims.email_verified) === 'true';
  if (verified) {
    const byEmail = await db.prepare('SELECT id FROM users WHERE email = ? AND deleted_requested_at IS NULL').bind(claims.email!.toLowerCase()).first<{ id: string }>();
    if (byEmail) { await db.prepare('UPDATE users SET apple_sub = ? WHERE id = ?').bind(claims.sub, byEmail.id).run(); return byEmail.id; }
  }
  if (!ageConfirmed) return null;
  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO users (id, email, apple_sub, created_at, age_confirmed_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, verified ? claims.email!.toLowerCase() : null, claims.sub, nowIso(), nowIso()).run();
  return id;
}

export const apple = new Hono<App>();

apple.post('/', async (c) => {
  const read = await readJson<{ identityToken?: string; nonce?: string; ageConfirmed?: boolean; authorizationCode?: string }>(c);
  if ('error' in read || !read.body.identityToken || !read.body.nonce) return fail(c, 400, 'bad_request');
  const claims = await verifyIdentity(c.env, read.body.identityToken, read.body.nonce);
  if (!claims) return fail(c, 401, 'bad_token');
  const userId = await playerFor(c.env.DB, claims, read.body.ageConfirmed === true);
  if (!userId) return fail(c, 403, 'age_required');
  if (read.body.authorizationCode && appleKeys(c.env)) {
    const res = await fetch(`${APPLE}/auth/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: claims.aud, client_secret: await clientSecret(c.env, claims.aud), code: read.body.authorizationCode, grant_type: 'authorization_code' }) });
    const refresh = res.ok ? (await res.json() as { refresh_token?: string }).refresh_token : undefined;
    if (refresh) await c.env.DB.prepare('UPDATE users SET apple_refresh_token = ?, apple_client_id = ? WHERE id = ?').bind(refresh, claims.aud, userId).run();
  }
  return c.json({ token: await startSession(c, userId) });
});
