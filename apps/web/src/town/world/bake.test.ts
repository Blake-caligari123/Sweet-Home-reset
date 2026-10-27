import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { bakeArea } from './bake';


describe('area baking', () => {
  it('bakes each area once per session, so going back through a door is instant', () => {
    const area = new Area(pack.areas.find((a) => a.id === 'square')!);
    const first = bakeArea(area);
    // The very same canvases come back: nothing is re-drawn (a timing check here was flaky on CI).
    expect(bakeArea(area)).toBe(first);
    expect(first.colour.width).toBe(area.w * 16);
    expect(first.drained.height).toBe(area.h * 16);
  });
});
