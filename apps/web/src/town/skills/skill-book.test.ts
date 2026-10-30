import { describe, expect, it, vi } from 'vitest';
import { TUNING } from '../data/tuning';
import { TownState } from '../state';
import type { View } from '../ui/view';
import { SkillBook } from './skill-book';
import { levelIn } from './skills';

const book = () => {
  const state = new TownState();
  const view = { banner: vi.fn(), feedback: vi.fn() } as unknown as View;
  return { state, view, skills: new SkillBook({ state, view, day: () => 3 }) };
};

describe('SkillBook', () => {
  it('earns XP from what Puff does, and cheers a new level', () => {
    const { state, view, skills } = book();
    const needed = Math.ceil(TUNING.skills.levelXp[1] / TUNING.skills.xp);
    for (let i = 0; i < needed; i++) skills.hear({ type: 'picked', crop: 'radish' });
    expect(levelIn(state.skills, 'farming')).toBe(2);
    expect(view.banner).toHaveBeenCalledTimes(1);
  });

  it('a tidying level grows Fluff\'s most for good', () => {
    const { state, skills } = book();
    const max = state.fluff.max;
    state.skills.xp.tidying = TUNING.skills.levelXp[1] - 1;
    skills.hear({ type: 'cleared', mess: 'dust', area: 'burrow' });
    expect(state.fluff.max).toBe(max + TUNING.skills.perks.tidying);
  });

  it('going somewhere counts once per place a day', () => {
    const { state, skills } = book();
    skills.hear({ type: 'entered', area: 'square' });
    skills.hear({ type: 'entered', area: 'square' });
    expect(state.skills.xp.exploring).toBe(TUNING.skills.xp);
    skills.hear({ type: 'entered', area: 'bakery' });
    expect(state.skills.xp.exploring).toBe(2 * TUNING.skills.xp);
  });

  it('ignores moments that belong to no skill, and survives a save', () => {
    const { state, skills } = book();
    skills.hear({ type: 'timer' });
    skills.hear({ type: 'found' });
    const again = new TownState(); again.load(JSON.parse(JSON.stringify(state.toSave())));
    expect(again.skills.xp).toEqual({ exploring: TUNING.skills.xp });
  });
});
