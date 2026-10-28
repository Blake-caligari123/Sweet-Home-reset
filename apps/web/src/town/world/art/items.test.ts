import { describe, expect, it } from 'vitest';
import { PixelCanvas } from '../../../shared/art/pixel-canvas';
import { hollowfern as pack } from '../../data/test-pack';
import { drawItemIcon } from './items';
import { T } from './texture';

const icon = (id: string) => { const pc = new PixelCanvas(T, T); drawItemIcon(pc, id); return Array.from(pc.data).join(); };

describe('item icons', () => {
  it('draws every item in the pack as itself, never the plain fallback box', () => {
    const fallback = icon('no_such_item');
    for (const id of Object.keys(pack.items)) expect(icon(id), id).not.toBe(fallback);
  });
});
