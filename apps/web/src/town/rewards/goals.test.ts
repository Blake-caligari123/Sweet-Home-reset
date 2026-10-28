import { describe, expect, it } from 'vitest';
import { goalLabel, goalsFor, progressGoals, type GoalState } from './goals';

const fresh = (day: number): GoalState => ({ day, goals: goalsFor(day), progress: [0, 0, 0] });

describe("today's three goals", () => {
  it('picks three different kinds a day, the same on every device', () => {
    for (let day = 2; day < 40; day += 1) {
      const g = goalsFor(day);
      expect(g).toEqual(goalsFor(day));
      expect(g).toHaveLength(3);
      expect(new Set(g.map((x) => x.kind)).size).toBe(3);
    }
    expect(goalsFor(2)).not.toEqual(goalsFor(3));
  });

  it('counts what Puff does and reports each goal once as it finishes', () => {
    let s: GoalState = { day: 5, goals: [{ kind: 'clean', target: 2 }, { kind: 'chat', target: 1 }, { kind: 'find', target: 1 }], progress: [0, 0, 0] };
    let r = progressGoals(s, { type: 'cleared', mess: 'dust', area: 'burrow', x: 0, y: 0 }); s = r.state;
    expect(r.finished).toEqual([]);
    r = progressGoals(s, { type: 'cleared', mess: 'dust', area: 'burrow', x: 1, y: 0 }); s = r.state;
    expect(r.finished).toEqual([0]);
    r = progressGoals(s, { type: 'cleared', mess: 'dust', area: 'burrow', x: 2, y: 0 }); s = r.state;
    expect(r.finished).toEqual([]);
    expect(s.progress[0]).toBe(2);
    expect(progressGoals(s, { type: 'talked', id: 'hazel' }).finished).toEqual([1]);
  });

  it('says each goal kindly and briefly', () => {
    for (let day = 2; day < 30; day += 1) for (const g of fresh(day).goals) expect(goalLabel(g).length).toBeLessThanOrEqual(30);
  });
});
