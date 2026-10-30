import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { nowIso, randomToken, sha256, type App } from './env';
import { clientIp, fail, readJson, withinLimit } from './guard';

// Sign-in (BACKEND-PLAN step 2): optional, 16+, only for sync and the unlock across devices. An
// email gets a one-time link (15 minutes); using it starts a 30-day session, a cookie on the web
// and a Bearer token in the phone apps. Tokens and session ids are only stored hashed.

const COOKIE = 'shr_session';
const SESSION_DAYS = 30;
const LINK_MINUTES = 15;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

/** Start a session for a user: stored hashed, sent as a cookie and returned for native apps. */
export async function startSession(c: Context<App>, userId: string) {
  const id = randomToken();
  await c.env.DB.prepare('INSERT INTO sessions (id_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(id), userId, nowIso(), inMinutes(SESSION_DAYS * 24 * 60)).run();
  setCookie(c, COOKIE, id, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: SESSION_DAYS * 86_400 });
  return id;
}

/** Signed in? The cookie or a Bearer token, for a live session of an account not being deleted. */
export const requireUser: MiddlewareHandler<App> = async (c, next) => {
  const bearer = c.req.header('authorization')?.match(/^Bearer (\w+)$/)?.[1];
  const id = bearer ?? getCookie(c, COOKIE);
  if (!id) return fail(c, 401, 'signed_out');
  const row = await c.env.DB.prepare(`SELECT s.user_id FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id_hash = ? AND s.expires_at > ? AND u.deleted_requested_at IS NULL`).bind(await sha256(id), nowIso()).first<{ user_id: string }>();
  if (!row) return fail(c, 401, 'signed_out');
  c.set('userId', row.user_id);
  await next();
};

/** Find the account for this email, or make one (the age box must be ticked for a new account). */
export async function userForEmail(db: D1Database, email: string, ageConfirmed: boolean) {
  const found = await db.prepare('SELECT id, deleted_requested_at FROM users WHERE email = ?').bind(email).first<{ id: string; deleted_requested_at: string | null }>();
  if (found) return found.deleted_requested_at ? null : found.id;
  if (!ageConfirmed) return null;
  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO users (id, email, created_at, age_confirmed_at) VALUES (?, ?, ?, ?)').bind(id, email, nowIso(), nowIso()).run();
  return id;
}

export const auth = new Hono<App>();

auth.post('/start', async (c) => {
  const read = await readJson<{ email?: string; ageConfirmed?: boolean }>(c);
  if ('error' in read) return fail(c, 400, read.error);
  const email = read.body.email?.trim().toLowerCase() ?? '';
  if (!EMAIL.test(email)) return fail(c, 400, 'bad_email');
  if (!c.env.RESEND_API_KEY || !c.env.EMAIL_FROM || !c.env.PUBLIC_ORIGIN) return fail(c, 503, 'email_unavailable');
  if (!(await withinLimit(c.env.DB, `start:email:${email}`, 5, 3600)) || !(await withinLimit(c.env.DB, `start:ip:${clientIp(c)}`, 20, 3600))) return fail(c, 429, 'slow_down');
  const known = await c.env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first();
  if (!known && read.body.ageConfirmed !== true) return fail(c, 400, 'age_required');
  const token = randomToken();
  await c.env.DB.prepare('INSERT INTO magic_links (token_hash, email, age_confirmed, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), email, read.body.ageConfirmed ? 1 : 0, inMinutes(LINK_MINUTES)).run();
  const link = `${c.env.PUBLIC_ORIGIN}/?signin=${token}`;
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: c.env.EMAIL_FROM, to: email, subject: 'Your Sweet Home Reset sign-in link',
      text: `Tap to sign in (the link works once, for ${LINK_MINUTES} minutes):\n\n${link}\n\nIf you didn't ask for this, you can ignore it.` })
  });
  if (!sent.ok) return fail(c, 503, 'email_unavailable');
  // The same answer whether or not the email already has an account.
  return c.json({ ok: true });
});

auth.post('/verify', async (c) => {
  const read = await readJson<{ token?: string }>(c);
  if ('error' in read || !read.body.token) return fail(c, 400, 'bad_token');
  const hash = await sha256(read.body.token);
  const link = await c.env.DB.prepare('SELECT email, age_confirmed FROM magic_links WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')
    .bind(hash, nowIso()).first<{ email: string; age_confirmed: number }>();
  if (!link) return fail(c, 400, 'bad_token');
  await c.env.DB.prepare('UPDATE magic_links SET used_at = ? WHERE token_hash = ?').bind(nowIso(), hash).run();
  const userId = await userForEmail(c.env.DB, link.email, link.age_confirmed === 1);
  if (!userId) return fail(c, 403, 'account_unavailable');
  return c.json({ token: await startSession(c, userId) });
});

auth.post('/logout', async (c) => {
  const id = c.req.header('authorization')?.match(/^Bearer (\w+)$/)?.[1] ?? getCookie(c, COOKIE);
  if (id) await c.env.DB.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(await sha256(id)).run();
  deleteCookie(c, COOKIE, { path: '/' });
  return c.json({ ok: true });
});
