import { describe, expect, it } from 'vitest';
import { goalDone, goalText, hearGoal, kindOf, pickGoals, type GoalFacts } from './goals';

const early: GoalFacts = { day: 2, games: false, tools: ['hands', 'duster'], fish: false, crops: false, animals: false, grumbles: false, places: ['burrow', 'yard'], tidyPlaces: ['yard'] };
const later: GoalFacts = { day: 20, games: true, tools: ['hands', 'duster', 'sponge', 'rake', 'can'], fish: true, crops: true, animals: true, grumbles: true, places: ['burrow', 'yard', 'square', 'lane', 'riverside'], tidyPlaces: ['yard', 'square', 'lane'] };

describe('today\'s little goals', () => {
  it('picks three different kinds, only things Puff can do yet, the same for the same day', () => {
    const g = pickGoals(later);
    expect(g).toHaveLength(3);
    expect(new Set(g.map((x) => kindOf(x).family)).size).toBe(3);
    expect(pickGoals(later)).toEqual(g);
    expect(pickGoals({ ...early, day: 1 })).toEqual([]);
    for (let d = 2; d < 30; d += 1) expect(pickGoals({ ...later, day: d }, ['fish']).map((x) => x.kind)).not.toContain('fish');
    for (const x of pickGoals(early)) expect(['tidy', 'dust', 'job']).toContain(x.kind);
    // Over a fortnight the goals change a lot: never the same three every day.
    const sets = new Set(Array.from({ length: 14 }, (_, i) => pickGoals({ ...later, day: 20 + i }).map((x) => x.kind).sort().join()));
    expect(sets.size).toBeGreaterThan(6);
  });

  it('counts the right moments, and says when each is done', () => {
    let goals = [{ kind: 'fish', have: 0 }, { kind: 'visit', place: 'lane', have: 0 }];
    let r = hearGoal(goals, { type: 'caught', fish: 'minnow' }); goals = r.goals; expect(r.done).toEqual([]);
    r = hearGoal(goals, { type: 'entered', area: 'square' }); goals = r.goals; expect(r.done).toEqual([]);
    r = hearGoal(goals, { type: 'entered', area: 'lane' }); goals = r.goals; expect(r.done.map((x) => x.kind)).toEqual(['visit']);
    r = hearGoal(goals, { type: 'caught', fish: 'trout' }); expect(r.done.map((x) => x.kind)).toEqual(['fish']);
    expect(goalDone(r.goals[0])).toBe(true);
    expect(goalText({ kind: 'visit', place: 'lane', have: 0 }, () => 'Neighbour Lane')).toBe('Pay a visit to Neighbour Lane');
  });
});

describe('this week\'s goals', () => {
  it('picks three bigger ones a week, from different families, the same all week', async () => {
    const { pickWeekly, weekOf } = await import('./goals');
    expect(weekOf(1)).toBe(1); expect(weekOf(7)).toBe(1); expect(weekOf(8)).toBe(2);
    expect(pickWeekly({ ...later, day: 2 })).toEqual([]);
    const w = pickWeekly({ ...later, day: 22 });
    expect(w).toHaveLength(3);
    expect(w.every((g) => g.kind.startsWith('w_'))).toBe(true);
    expect(new Set(w.map((g) => kindOf(g).family)).size).toBe(3);
    expect(pickWeekly({ ...later, day: 28 })).toEqual(w);
    for (let d = 2; d < 40; d += 1) for (const g of pickGoals({ ...later, day: d })) expect(g.kind.startsWith('w_')).toBe(false);
  });
});
