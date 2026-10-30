import { afterEach, describe, expect, it, vi } from 'vitest';
import { call, signIn, stubFetch, testEnv } from './testing/app';
import { stripeSignature } from './billing';

afterEach(() => vi.unstubAllGlobals());

const userIdOf = async (env: ReturnType<typeof testEnv>) => (await env.DB.prepare('SELECT id FROM users').first<{ id: string }>())!.id;
const owned = async (env: ReturnType<typeof testEnv>, token: string) => ((await (await call(env, '/api/me', { token })).json()) as { fullGame: boolean }).fullGame;

async function stripeEvent(env: ReturnType<typeof testEnv>, event: object, secret = 'whsec_test', at = Math.floor(Date.now() / 1000)) {
  const body = JSON.stringify(event);
  return call(env, '/api/stripe/webhook', { method: 'POST', body, headers: { 'stripe-signature': `t=${at},v1=${await stripeSignature(secret, at, body)}` } });
}

describe('web checkout (AT-S8, one unlock)', () => {
  it('asks Stripe for a one-time payment of the unlock price, for this user, coming back to the game', async () => {
    const env = testEnv();
    const token = await signIn(env);
    const stripe = stubFetch(() => Response.json({ url: 'https://checkout.stripe.test/s' }));
    const res = await call(env, '/api/billing/checkout', { method: 'POST', token, json: { item: 'full_game' } });
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.test/s' });
    const sent = new URLSearchParams(String(stripe.mock.calls[0][1]?.body));
    expect(sent.get('mode')).toBe('payment');
    expect(sent.get('line_items[0][price]')).toBe('price_test');
    expect(sent.get('client_reference_id')).toBe(await userIdOf(env));
    expect(sent.get('success_url')).toBe('https://game.test/?unlocked=1');
  });

  it('needs sign-in, and says unavailable without Stripe keys', async () => {
    expect((await call(testEnv(), '/api/billing/checkout', { method: 'POST', json: {} })).status).toBe(401);
    const env = testEnv({ STRIPE_SECRET_KEY: undefined });
    const token = await signIn(env);
    expect((await call(env, '/api/billing/checkout', { method: 'POST', token, json: {} })).status).toBe(503);
  });
});

describe('Stripe webhook (AT-S9)', () => {
  it('unlocks the full game when checkout is paid, once, and a refund takes the unlock back', async () => {
    const env = testEnv();
    const token = await signIn(env);
    const id = await userIdOf(env);
    const paid = { id: 'evt_1', type: 'checkout.session.completed', data: { object: { client_reference_id: id, payment_status: 'paid', customer: 'cus_1', metadata: { item: 'full_game' } } } };
    expect((await stripeEvent(env, paid)).status).toBe(200);
    expect(await owned(env, token)).toBe(true);
    expect((await stripeEvent(env, paid)).status).toBe(200); // replay: no change
    await stripeEvent(env, { id: 'evt_2', type: 'charge.refunded', data: { object: { customer: 'cus_1', refunded: true } } });
    expect(await owned(env, token)).toBe(false);
  });

  it('refuses a bad or stale signature', async () => {
    const env = testEnv();
    const ev = { id: 'evt_x', type: 'checkout.session.completed', data: { object: {} } };
    expect((await stripeEvent(env, ev, 'whsec_wrong')).status).toBe(400);
    expect((await stripeEvent(env, ev, 'whsec_test', Math.floor(Date.now() / 1000) - 600)).status).toBe(400);
  });
});

describe('RevenueCat webhook (AT15, one unlock)', () => {
  const rc = (env: ReturnType<typeof testEnv>, event: object, auth = 'rc-secret') => call(env, '/api/revenuecat/webhook', { method: 'POST', json: { event }, headers: { authorization: auth } });

  it('unlocks on a phone purchase for the signed-in user, so the web knows too; a refund takes it back', async () => {
    const env = testEnv();
    const token = await signIn(env);
    const id = await userIdOf(env);
    expect((await rc(env, { id: 'rc1', type: 'NON_RENEWING_PURCHASE', app_user_id: id, entitlement_ids: ['full_game'], store: 'APP_STORE' })).status).toBe(200);
    expect(await owned(env, token)).toBe(true);
    await rc(env, { id: 'rc2', type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: id, entitlement_ids: ['full_game'] });
    expect(await owned(env, token)).toBe(false);
  });

  it('ignores wrong auth with 401 and changes nothing', async () => {
    const env = testEnv();
    const token = await signIn(env);
    expect((await rc(env, { id: 'rc1', type: 'NON_RENEWING_PURCHASE', app_user_id: await userIdOf(env), entitlement_ids: ['full_game'] }, 'nope')).status).toBe(401);
    expect(await owned(env, token)).toBe(false);
  });
});
