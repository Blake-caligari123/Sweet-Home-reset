import { Hono } from 'hono';
import { nowIso, type App } from './env';
import { fail, readJson, withinLimit } from './guard';

// First-party, anonymous gameplay counts (GDD A10, BACKEND-PLAN step 15): only the events the
// metrics need, with small number fields, an install id and never a user id, name or email. The
// game sends nothing when analytics is off in Settings. Kept 13 months by the daily clean-up.

/** The A10 metrics: day-1/day-7 return, clip shares, and the unlock offered and bought. */
const KNOWN = new Set(['day_started', 'clip_shared', 'unlock_offered', 'unlock_bought', 'festival_done']);
const BATCH_MAX = 50;
const LOOKS_LIKE_EMAIL = /@/;

interface Event { name?: unknown; props?: Record<string, unknown> }

/** Only known names, and props that are a few plain numbers. */
const tidy = (e: Event) => typeof e.name === 'string' && KNOWN.has(e.name)
  && (!e.props || (Object.keys(e.props).length <= 4 && Object.values(e.props).every((v) => typeof v === 'number' && Number.isFinite(v))));

export const events = new Hono<App>();

events.post('/', async (c) => {
  const read = await readJson<{ installId?: string; events?: Event[] }>(c, 32 * 1024);
  if ('error' in read) return fail(c, read.error === 'too_big' ? 413 : 400, read.error);
  const { installId, events: list } = read.body;
  if (typeof installId !== 'string' || !installId || installId.length > 64 || LOOKS_LIKE_EMAIL.test(installId) || !Array.isArray(list)) return fail(c, 400, 'bad_request');
  if (list.length > BATCH_MAX) return fail(c, 413, 'too_many');
  if (!list.every(tidy)) return fail(c, 400, 'unknown_event');
  if (!(await withinLimit(c.env.DB, `events:${installId}`, 60, 60))) return fail(c, 429, 'slow_down');
  const at = nowIso();
  const db = c.env.DB;
  if (list.length) await db.batch(list.map((e) => db.prepare('INSERT INTO events (install_id, name, props_json, at) VALUES (?, ?, ?, ?)').bind(installId, e.name as string, e.props ? JSON.stringify(e.props) : null, at)));
  return c.json({ ok: true });
});
