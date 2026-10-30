import type { Context, MiddlewareHandler } from 'hono';
import type { App } from './env';

// Hardening (BACKEND-PLAN step 16): security headers, CORS for the game's own site only, an Origin
// check on browser writes, JSON size limits and rate limits. Errors are always `{ error: "code" }`.

export const fail = (c: Context, status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500 | 503, error: string) => c.json({ error }, status);

/** Headers on every response, and CORS for PUBLIC_ORIGIN (with cookies) and nobody else. */
export const headers: MiddlewareHandler<App> = async (c, next) => {
  const origin = c.req.header('origin');
  const allowed = !!origin && origin === c.env.PUBLIC_ORIGIN;
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? corsHeaders(origin) : {} });
  }
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Cache-Control', c.res.headers.get('Cache-Control') ?? 'no-store');
  if (allowed) for (const [k, v] of Object.entries(corsHeaders(origin))) c.header(k, v);
};

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE', 'Access-Control-Allow-Headers': 'content-type, authorization', Vary: 'Origin'
});

/**
 * A browser write must come from the game's own site. Native apps send a Bearer token and no
 * Origin, and webhooks have their own signatures, so those are let through here.
 */
export const sameOrigin: MiddlewareHandler<App> = async (c, next) => {
  const origin = c.req.header('origin');
  if (c.req.method !== 'GET' && origin && origin !== c.env.PUBLIC_ORIGIN) return fail(c, 403, 'bad_origin');
  await next();
};

/** Read a JSON body no bigger than `max` bytes, or say why not (too big, or not JSON). */
export async function readJson<T>(c: Context, max = 16 * 1024): Promise<{ body: T } | { error: 'too_big' | 'bad_json' }> {
  const text = await c.req.text();
  if (new TextEncoder().encode(text).length > max) return { error: 'too_big' };
  try { return { body: JSON.parse(text) as T }; } catch { return { error: 'bad_json' }; }
}

/** Count one more hit on `key` in a fixed window; false once it's over `max`. */
export async function withinLimit(db: D1Database, key: string, max: number, windowSeconds: number, now = Date.now()) {
  const start = Math.floor(now / 1000 / windowSeconds) * windowSeconds;
  const row = await db.prepare('SELECT window_start, count FROM rate_limits WHERE key = ?').bind(key).first<{ window_start: number; count: number }>();
  const count = row && row.window_start === start ? row.count + 1 : 1;
  await db.prepare('INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = excluded.count')
    .bind(key, start, count).run();
  return count <= max;
}

/** The caller's address, for per-IP limits (Cloudflare sets it). */
export const clientIp = (c: Context) => c.req.header('cf-connecting-ip') ?? 'unknown';
