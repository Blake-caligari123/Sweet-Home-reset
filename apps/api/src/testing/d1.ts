import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

// A stand-in for Cloudflare D1 in tests: the real migrations on an in-memory SQLite, behind the
// part of the D1 API the Worker uses (prepare/bind/first/all/run, batch). No keys, no network.
const MIGRATIONS = new URL('../../migrations/', import.meta.url);

export function testDb(): D1Database {
  const db = new DatabaseSync(':memory:');
  for (const f of readdirSync(MIGRATIONS).filter((n) => n.endsWith('.sql')).sort()) db.exec(readFileSync(new URL(f, MIGRATIONS), 'utf8'));
  const statement = (sql: string, args: SQLInputValue[] = []) => ({
    bind: (...a: unknown[]) => statement(sql, a.map((v) => (v === undefined ? null : v)) as SQLInputValue[]),
    first: async (column?: string) => {
      const row = db.prepare(sql).get(...args) as Record<string, unknown> | undefined;
      return row ? (column ? row[column] : { ...row }) : null;
    },
    all: async () => ({ results: (db.prepare(sql).all(...args) as Record<string, unknown>[]).map((r) => ({ ...r })), success: true, meta: {} }),
    run: async () => { const r = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; }
  });
  return {
    prepare: (sql: string) => statement(sql),
    async batch(list: { run(): Promise<unknown> }[]) {
      db.exec('BEGIN');
      try { const out = []; for (const s of list) out.push(await s.run()); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    exec: async (sql: string) => { db.exec(sql); return { count: 0, duration: 0 }; }
  } as unknown as D1Database;
}
