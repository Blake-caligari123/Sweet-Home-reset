import { afterEach, describe, expect, it, vi } from 'vitest';
import { Counts } from './counts';

afterEach(() => vi.unstubAllGlobals());

describe('anonymous play counts (GDD A10)', () => {
  it('sends known events in one batch with a random install id, and nothing about the player', async () => {
    const sent = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', sent);
    const counts = new Counts('https://api.test', () => true, () => 'install-7');
    counts.add('day_started', { day: 2 });
    counts.add('unlock_offered');
    await counts.flush();
    expect(sent).toHaveBeenCalledOnce();
    const [url, init] = sent.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.test/api/events');
    expect(JSON.parse(String(init.body))).toEqual({ installId: 'install-7', events: [{ name: 'day_started', props: { day: 2 } }, { name: 'unlock_offered' }] });
    expect(init.credentials).toBe('omit');
  });

  it('sends nothing when the player turned counts off', async () => {
    const sent = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', sent);
    const counts = new Counts('https://api.test', () => false, () => 'install-7');
    counts.add('day_started', { day: 2 });
    await counts.flush();
    expect(sent).not.toHaveBeenCalled();
  });
});
