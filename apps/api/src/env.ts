// What the Worker is given (BACKEND-PLAN §1). Values live in Worker secrets, never in code or chat.
// Anything missing fails closed for its own feature only: no Resend, no email sign-in; no Stripe,
// no web checkout. The game never waits on any of it.
export interface Env {
  DB: D1Database;
  /** The site the browser game is served from (cookies, CORS and the Origin check). */
  PUBLIC_ORIGIN?: string;
  RESEND_API_KEY?: string; EMAIL_FROM?: string;
  STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string; STRIPE_PRICE_FULL_GAME?: string;
  REVENUECAT_WEBHOOK_AUTH?: string;
  /** Sign in with Apple: the accepted audiences (bundle ID and web Services ID), comma-separated. */
  APPLE_CLIENT_IDS?: string;
  APPLE_TEAM_ID?: string; APPLE_KEY_ID?: string; APPLE_PRIVATE_KEY?: string;
}

/** Hono's context variables: the signed-in user's id, once `requireUser` has run. */
export interface Vars { userId: string }

export type App = { Bindings: Env; Variables: Vars };

export const nowIso = () => new Date().toISOString();

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** SHA-256 as hex: tokens and session ids are only ever stored hashed. */
export async function sha256(text: string) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))); }

/** 32 random bytes as hex, for magic-link tokens and session ids. */
export function randomToken() { return hex(crypto.getRandomValues(new Uint8Array(32)).buffer); }

/** Equal strings in time that doesn't depend on where they differ (webhook auth, signatures). */
export function sameText(a: string, b: string) {
  const x = new TextEncoder().encode(a); const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
