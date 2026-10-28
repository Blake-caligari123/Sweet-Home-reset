import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { passed, reached, type AliveStage } from './alive';

const stages: AliveStage[] = [{ at: 0.25, effects: [] }, { at: 0.5, effects: [] }, { at: 0.75, effects: [] }, { at: 1, effects: [] }];

describe('a home coming alive', () => {
  it('counts the stages a room has reached', () => {
    expect(reached(stages, 0)).toBe(0);
    expect(reached(stages, 0.5)).toBe(2);
    expect(reached(stages, 1)).toBe(4);
  });

  it('reports each stage once, as progress passes it', () => {
    expect(passed(stages, 0.2, 0.3)).toEqual([0]);
    expect(passed(stages, 0.3, 0.4)).toEqual([]);
    expect(passed(stages, 0.45, 0.8)).toEqual([1, 2]);
  });

  it('gives the burrow four stages in order, each with a line from Puff', () => {
    const burrow = pack.areas.find((a) => a.id === 'burrow')!;
    const alive = burrow.alive!;
    expect(alive.map((s) => s.at)).toEqual([0.25, 0.5, 0.75, 1]);
    for (const s of alive) expect(s.say?.length, String(s.at)).toBeGreaterThan(0);
  });
});
