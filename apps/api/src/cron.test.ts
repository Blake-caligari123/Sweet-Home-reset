import { describe, expect, it } from 'vitest';
import { cleanUp } from './cron';
import { testEnv } from './testing/app';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

describe('the daily clean-up (AT-S14)', () => {
  it('removes deleted accounts after 30 days, old history, old events and spent links', async () => {
    const env = testEnv();
    const db = env.DB;
    await db.prepare("INSERT INTO users (id, email, created_at, deleted_requested_at) VALUES ('gone', 'a@x.test', ?, ?), ('waiting', 'b@x.test', ?, ?), ('here', 'c@x.test', ?, NULL)")
      .bind(daysAgo(90), daysAgo(31), daysAgo(90), daysAgo(29), daysAgo(90)).run();
    await db.prepare("INSERT INTO save_history (user_id, data_json, device_id, kept_at) VALUES ('here', '{}', 'd', ?), ('here', '{}', 'd', ?)").bind(daysAgo(31), daysAgo(2)).run();
    await db.prepare("INSERT INTO events (install_id, name, at) VALUES ('i', 'day_started', ?), ('i', 'day_started', ?)").bind(daysAgo(400), daysAgo(3)).run();
    await db.prepare("INSERT INTO magic_links (token_hash, email, expires_at) VALUES ('t', 'c@x.test', ?)").bind(daysAgo(1)).run();
    await cleanUp(env.DB);
    expect((await db.prepare('SELECT id FROM users ORDER BY id').all()).results.map((r) => r.id)).toEqual(['here', 'waiting']);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM save_history').first('n')).toBe(1);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM events').first('n')).toBe(1);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM magic_links').first('n')).toBe(0);
  });
});
