import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TownState } from '../state';
import type { Scene } from './scene';
import { TOUR } from './tour';

/** A stand-in scene that records where each card sends Puff. */
function stub() {
  const state = new TownState();
  const calls: { method: string; args: unknown[] }[] = [];
  const scene = new Proxy({ state } as unknown as Scene, {
    get: (t, key) => (key === 'state' ? state : (...args: unknown[]) => { calls.push({ method: String(key), args }); return scene; })
  });
  return { scene, calls, state };
}

describe('the feature tour', () => {
  it('has a card for each new feature, each with a few clear steps', () => {
    expect(TOUR.length).toBeGreaterThanOrEqual(15);
    for (const c of TOUR) {
      expect(c.steps.length, c.title).toBeGreaterThan(0);
      expect(c.steps.length, c.title).toBeLessThanOrEqual(3);
    }
  });

  it('sends Puff only to real places and sets real days (or plays a real cutscene)', () => {
    const areas = new Set(pack.areas.map((a) => a.id));
    for (const c of TOUR) {
      const { scene, calls } = stub();
      c.setup(scene);
      const film = calls.find((x) => x.method === 'playScene');
      if (film) { expect((pack.scenes ?? []).some((s) => s.id === film.args[0]), c.title).toBe(true); continue; }
      const go = calls.filter((x) => x.method === 'go');
      expect(go.length, c.title).toBe(1);
      expect(areas.has(go[0].args[0] as string), c.title).toBe(true);
      for (const v of calls.filter((x) => x.method === 'visited')) for (const a of v.args) expect(areas.has(a as string), `${c.title} ${a}`).toBe(true);
      expect(calls.some((x) => x.method === 'day'), c.title).toBe(true);
    }
  });
});
