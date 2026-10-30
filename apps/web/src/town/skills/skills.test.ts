import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { gainXp, levelOf, perk, skillFor, type SkillLog } from './skills';

describe('Puff\'s skills (NEXT-PHASE §5.2)', () => {
  it('turns each kind of thing Puff does into its skill', () => {
    expect(skillFor({ type: 'cleared', mess: 'dust', area: 'burrow' })).toBe('tidying');
    expect(skillFor({ type: 'picked', crop: 'radish' })).toBe('farming');
    expect(skillFor({ type: 'made', station: 'kitchen' })).toBe('cooking');
    expect(skillFor({ type: 'made', station: 'bench' })).toBe('crafting');
    expect(skillFor({ type: 'found' })).toBe('exploring');
    expect(skillFor({ type: 'timer' })).toBeNull();
  });

  it('levels up through the tuning thresholds, up to 10', () => {
    const t = TUNING.skills.levelXp;
    expect(levelOf(0)).toBe(1);
    expect(levelOf(t[1])).toBe(2);
    expect(levelOf(t[1] - 1)).toBe(1);
    expect(levelOf(1e9)).toBe(10);
  });

  it('never rewards grinding: the same thing over and over in a day earns less', () => {
    let log: SkillLog = { xp: {}, day: 3, counts: {} };
    let full = 0;
    for (let i = 0; i < TUNING.skills.fullXpPerDay; i += 1) { const r = gainXp(log, 'tidying', 'cleared', 3); log = r.log; full += r.gained; }
    const tired = gainXp(log, 'tidying', 'cleared', 3);
    expect(full).toBe(TUNING.skills.fullXpPerDay * TUNING.skills.xp);
    expect(tired.gained).toBeLessThan(TUNING.skills.xp);
    // Something different, or a new day, is full again.
    expect(gainXp(tired.log, 'farming', 'picked', 3).gained).toBe(TUNING.skills.xp);
    expect(gainXp(tired.log, 'tidying', 'cleared', 4).gained).toBe(TUNING.skills.xp);
  });

  it('gives each skill a perk that grows with its level, and none at level 1', () => {
    expect(perk('tidying', 1)).toBe(0);
    expect(perk('tidying', 3)).toBe(2 * TUNING.skills.perks.tidying);
    expect(perk('farming', 5)).toBeCloseTo(4 * TUNING.skills.perks.farming);
  });
});
