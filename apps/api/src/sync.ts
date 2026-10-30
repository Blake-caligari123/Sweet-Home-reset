import { Hono } from 'hono';
import { SAVE_MAX_BYTES, TOWN_SAVE_SCHEMA } from '@sweet-home-reset/shared';
import { requireUser } from './auth';
import { nowIso, type App } from './env';
import { fail, readJson } from './guard';

// Opt-in sync (BACKEND-PLAN step 4). One cloud save per account, with a version. A save only lands
// on top of the version it started from; otherwise the player chooses which copy to keep, because
// a life-sim save can't be merged safely. The copy it replaces goes to history (10 at most, 30 days).

const HISTORY_MAX = 10;

interface SaveRow { version: number; data_json: string; saved_at: string | null; device_id: string; schema_version: number }

const shape = (r: SaveRow) => ({ version: r.version, blob: r.data_json, savedAt: r.saved_at, deviceId: r.device_id, schemaVersion: r.schema_version });

export const sync = new Hono<App>();
sync.use('*', requireUser);

sync.get('/', async (c) => {
  const row = await c.env.DB.prepare('SELECT version, data_json, saved_at, device_id, schema_version FROM saves WHERE user_id = ?').bind(c.get('userId')).first<SaveRow>();
  return row ? c.json(shape(row)) : fail(c, 404, 'no_save');
});

sync.put('/', async (c) => {
  const read = await readJson<{ baseVersion?: number; blob?: string; deviceId?: string; savedAt?: string; schemaVersion?: number }>(c, SAVE_MAX_BYTES + 4096);
  if ('error' in read) return fail(c, read.error === 'too_big' ? 413 : 400, read.error);
  const { baseVersion = 0, blob = '', deviceId = '', savedAt = null, schemaVersion = 0 } = read.body;
  if (new TextEncoder().encode(blob).length > SAVE_MAX_BYTES) return fail(c, 413, 'too_big');
  try { JSON.parse(blob); } catch { return fail(c, 400, 'bad_json'); }
  if (schemaVersion > TOWN_SAVE_SCHEMA) return fail(c, 422, 'newer_save');
  if (!deviceId) return fail(c, 400, 'no_device');
  const userId = c.get('userId');
  const db = c.env.DB;
  const current = await db.prepare('SELECT version, data_json, saved_at, device_id, schema_version FROM saves WHERE user_id = ?').bind(userId).first<SaveRow>();
  if ((current?.version ?? 0) !== baseVersion) return c.json({ error: 'conflict', server: current && shape(current) }, 409);
  const version = baseVersion + 1;
  await db.batch([
    ...(current ? [db.prepare('INSERT INTO save_history (user_id, data_json, saved_at, device_id, kept_at) VALUES (?, ?, ?, ?, ?)').bind(userId, current.data_json, current.saved_at, current.device_id, nowIso())] : []),
    db.prepare(`INSERT INTO saves (user_id, version, data_json, updated_at, device_id, schema_version, saved_at) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET version = excluded.version, data_json = excluded.data_json, updated_at = excluded.updated_at,
      device_id = excluded.device_id, schema_version = excluded.schema_version, saved_at = excluded.saved_at`).bind(userId, version, blob, nowIso(), deviceId, schemaVersion, savedAt),
    db.prepare(`DELETE FROM save_history WHERE user_id = ? AND id NOT IN (SELECT id FROM save_history WHERE user_id = ? ORDER BY id DESC LIMIT ${HISTORY_MAX})`).bind(userId, userId)
  ]);
  return c.json({ version });
});
