import { describe, expect, it } from 'vitest';
import app from './index';

describe('worker stub', () => {
  it('returns ok from GET /api/health', async () => {
    const response = await app.request('http://localhost/api/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('uses the error shape for an unknown route', async () => {
    const response = await app.request('http://localhost/api/nope');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not_found' });
  });
});
