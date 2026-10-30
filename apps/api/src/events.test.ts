import { describe, expect, it } from 'vitest';
import { call, testEnv } from './testing/app';

const send = (env: ReturnType<typeof testEnv>, events: unknown[], installId = 'install-1') => call(env, '/api/events', { method: 'POST', json: { installId, events } });

describe('anonymous gameplay counts (AT-S15)', () => {
  it('keeps known events with small number fields, and nothing that could name a person', async () => {
    const env = testEnv();
    expect((await send(env, [{ name: 'day_started', props: { day: 7 } }, { name: 'unlock_offered' }])).status).toBe(200);
    const rows = (await env.DB.prepare('SELECT name, props_json, user_id FROM events ORDER BY id').all()).results;
    expect(rows).toEqual([{ name: 'day_started', props_json: '{"day":7}', user_id: null }, { name: 'unlock_offered', props_json: null, user_id: null }]);
  });

  it('refuses unknown events, text fields, email-like ids and big batches, storing nothing', async () => {
    const env = testEnv();
    expect((await send(env, [{ name: 'tracked_you' }])).status).toBe(400);
    expect((await send(env, [{ name: 'day_started', props: { note: 'hello' } }])).status).toBe(400);
    expect((await send(env, [{ name: 'day_started' }], 'kim@example.com')).status).toBe(400);
    expect((await send(env, Array.from({ length: 51 }, () => ({ name: 'day_started' })))).status).toBe(413);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM events').first('n')).toBe(0);
  });
});
