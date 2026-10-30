import { Hono } from 'hono';
import { revokeApple } from './apple';
import { requireUser } from './auth';
import { nowIso, type App } from './env';

// The account (BACKEND-PLAN steps 7 and 14): who is signed in and whether the full game is owned,
// everything we keep about them as one download, and deletion. Deleting removes sessions, saves and
// history at once, revokes Apple's link, and the daily job removes the rest after 30 days.

/** Store purchases are refunded and managed by Apple or Google, not by deleting an account. */
const STORE_NOTE = 'If you bought the full game on the App Store or Google Play, that purchase stays with your store account.';

export const account = new Hono<App>();
account.use('*', requireUser);

account.get('/', async (c) => {
  const id = c.get('userId');
  const u = await c.env.DB.prepare('SELECT email, full_game, apple_sub FROM users WHERE id = ?').bind(id).first<{ email: string | null; full_game: number; apple_sub: string | null }>();
  // `id` is what the phone apps give RevenueCat, so a store purchase reaches this account.
  return c.json({ id, email: u?.email ?? null, fullGame: u?.full_game === 1, appleLinked: !!u?.apple_sub });
});

account.get('/export', async (c) => {
  const db = c.env.DB; const id = c.get('userId');
  const accountRow = await db.prepare('SELECT id, email, created_at, age_confirmed_at, full_game, full_game_via, full_game_at, apple_sub IS NOT NULL AS apple_linked FROM users WHERE id = ?').bind(id).first();
  const save = await db.prepare('SELECT version, data_json, saved_at, device_id, schema_version FROM saves WHERE user_id = ?').bind(id).first();
  const saveHistory = (await db.prepare('SELECT data_json, saved_at, device_id, kept_at FROM save_history WHERE user_id = ? ORDER BY id').bind(id).all()).results;
  c.header('content-disposition', 'attachment; filename="sweet-home-reset-data.json"');
  return c.json({ account: accountRow, save, saveHistory });
});

account.delete('/', async (c) => {
  const db = c.env.DB; const id = c.get('userId');
  await revokeApple(c.env, id);
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    db.prepare('DELETE FROM saves WHERE user_id = ?').bind(id),
    db.prepare('DELETE FROM save_history WHERE user_id = ?').bind(id),
    db.prepare('UPDATE events SET user_id = NULL WHERE user_id = ?').bind(id),
    db.prepare('UPDATE users SET deleted_requested_at = ?, apple_refresh_token = NULL WHERE id = ?').bind(nowIso(), id)
  ]);
  return c.json({ ok: true, storeNote: STORE_NOTE });
});

/** The public page Google Play asks for: how to delete an account, in plain words. */
export const DELETE_PAGE = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Delete account · Sweet Home Reset</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem;color:#3b2a22;background:#fff8ec}</style></head>
<body><h1>Delete account</h1><p>Sweet Home Reset by PixelVortex Games. Accounts are optional; the game plays fully without one.</p>
<p>To delete your account: open the game, tap Pause, then Account, then <b>Delete account</b>. Your sessions, cloud save and save history are deleted straight away, and the account itself within 30 days.</p>
<p>Can't open the game? Email us from the address on your account and we'll delete it for you.</p>
<p>${STORE_NOTE}</p></body></html>`;
