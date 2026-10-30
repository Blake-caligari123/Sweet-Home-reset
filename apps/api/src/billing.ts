import { Hono, type Context } from 'hono';
import { requireUser } from './auth';
import { nowIso, sameText, type App } from './env';
import { fail, readJson } from './guard';

// The one unlock (VISION §10, BACKEND-PLAN §4 and steps 8–10, adapted from a subscription). The web
// pays once through Stripe Checkout; phones pay through their store and RevenueCat tells us. Either
// way `users.full_game` follows the latest event, so buying on one platform unlocks every platform
// the player signs in on. Each event is processed once (`billing_events`).

const ITEM = 'full_game';
const TOLERANCE_SECONDS = 300;

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Stripe's v1 signature: HMAC-SHA256 of "timestamp.body" with the webhook secret. */
export async function stripeSignature(secret: string, at: number, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${at}.${body}`)));
}

/** Set (or take back) the unlock; `via` is where it was bought. */
async function setUnlock(db: D1Database, userId: string, owned: boolean, via: string | null) {
  await db.prepare('UPDATE users SET full_game = ?, full_game_via = ?, full_game_at = ? WHERE id = ?')
    .bind(owned ? 1 : 0, owned ? via : null, owned ? nowIso() : null, userId).run();
}

/** True the first time an event id is seen; a replay is a no-op. */
async function firstTime(db: D1Database, id: string, source: string, type: string) {
  const r = await db.prepare('INSERT OR IGNORE INTO billing_events (event_id, source, type, processed_at) VALUES (?, ?, ?, ?)').bind(id, source, type, nowIso()).run();
  return r.meta.changes > 0;
}

export const billing = new Hono<App>();

billing.post('/billing/checkout', requireUser, async (c) => {
  const { STRIPE_SECRET_KEY: key, STRIPE_PRICE_FULL_GAME: price, PUBLIC_ORIGIN: origin } = c.env;
  if (!key || !price || !origin) return fail(c, 503, 'billing_unavailable');
  const userId = c.get('userId');
  if (await c.env.DB.prepare('SELECT full_game FROM users WHERE id = ?').bind(userId).first('full_game')) return fail(c, 409, 'already_owned');
  const form = new URLSearchParams({
    mode: 'payment', 'line_items[0][price]': price, 'line_items[0][quantity]': '1', client_reference_id: userId,
    'metadata[item]': ITEM, success_url: `${origin}/?unlocked=1`, cancel_url: `${origin}/`
  });
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' }, body: form });
  if (!res.ok) return fail(c, 503, 'billing_unavailable');
  return c.json({ url: (await res.json() as { url: string }).url });
});

billing.post('/stripe/webhook', async (c) => {
  const secret = c.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return fail(c, 503, 'billing_unavailable');
  const body = await c.req.text();
  if (!(await stripeSigned(c, secret, body))) return fail(c, 400, 'bad_signature');
  const event = JSON.parse(body) as { id: string; type: string; data: { object: Record<string, unknown> } };
  const o = event.data.object;
  const db = c.env.DB;
  if (!(await firstTime(db, event.id, 'stripe', event.type))) return c.json({ ok: true });
  if (event.type === 'checkout.session.completed' && o.payment_status === 'paid' && (o.metadata as { item?: string })?.item === ITEM && typeof o.client_reference_id === 'string') {
    await setUnlock(db, o.client_reference_id, true, 'web');
    if (typeof o.customer === 'string') await db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').bind(o.customer, o.client_reference_id).run();
  }
  if (event.type === 'charge.refunded' && o.refunded === true && typeof o.customer === 'string') {
    const user = await db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').bind(o.customer).first<{ id: string }>();
    if (user) await setUnlock(db, user.id, false, null);
  }
  return c.json({ ok: true });
});

/** Any v1 in the header matches, and the timestamp is within five minutes. */
async function stripeSigned(c: Context<App>, secret: string, body: string) {
  const parts = (c.req.header('stripe-signature') ?? '').split(',').map((p) => p.split('='));
  const at = Number(parts.find(([k]) => k === 't')?.[1]);
  if (!at || Math.abs(Date.now() / 1000 - at) > TOLERANCE_SECONDS) return false;
  const expected = await stripeSignature(secret, at, body);
  return parts.some(([k, v]) => k === 'v1' && !!v && sameText(v, expected));
}

billing.post('/revenuecat/webhook', async (c) => {
  const auth = c.env.REVENUECAT_WEBHOOK_AUTH;
  if (!auth) return fail(c, 503, 'billing_unavailable');
  if (!sameText(c.req.header('authorization') ?? '', auth)) return fail(c, 401, 'bad_auth');
  const read = await readJson<{ event?: { id: string; type: string; app_user_id: string; entitlement_ids?: string[]; cancel_reason?: string; store?: string } }>(c, 64 * 1024);
  if ('error' in read || !read.body.event) return fail(c, 400, 'bad_json');
  const e = read.body.event;
  const db = c.env.DB;
  if (!(e.entitlement_ids ?? []).includes(ITEM) || !(await firstTime(db, e.id, 'revenuecat', e.type))) return c.json({ ok: true });
  // The app user id is our user id once the player has signed in; anonymous buyers keep theirs in the store.
  const known = await db.prepare('SELECT id FROM users WHERE id = ?').bind(e.app_user_id).first();
  if (!known) return c.json({ ok: true });
  if (['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'UNCANCELLATION'].includes(e.type)) await setUnlock(db, e.app_user_id, true, e.store === 'PLAY_STORE' ? 'android' : 'ios');
  // A refund arrives as a cancellation through customer support.
  if (e.type === 'EXPIRATION' || (e.type === 'CANCELLATION' && e.cancel_reason === 'CUSTOMER_SUPPORT')) await setUnlock(db, e.app_user_id, false, null);
  return c.json({ ok: true });
});
