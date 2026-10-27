import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Area, validateTownPack } from './area';
import { bakeArea } from './bake';

const pack = validateTownPack(JSON.parse(readFileSync(new URL('../../public/packs-bundled/hollowfern/1/pack.json', import.meta.url), 'utf8')));

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
