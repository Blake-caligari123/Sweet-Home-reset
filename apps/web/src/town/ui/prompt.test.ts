import { describe, expect, it } from 'vitest';
import { Area } from '../data/area';
import { Content } from '../data/content';
import { hollowfern as pack } from '../data/test-pack';
import { Bag } from '../play/bag';
import { AreaMess } from '../play/mess';
import { promptFor } from './prompt';

const burrow = new Area(pack.areas.find((a) => a.id === 'burrow')!);
const content = new Content(pack);
const here = { area: burrow, mess: new AreaMess(burrow.w, burrow.h, [{ type: 'clutter', x: 9, y: 8, item: 'sock' }, { type: 'dust', x: 10, y: 8 }], false), pickups: burrow.pack.pickups ?? [], bag: new Bag() };

describe('the prompt line', () => {
  it('says what Puff is about to do', () => {
    expect(promptFor(null, here, [], content)).toBe('');
    expect(promptFor({ kind: 'mess', x: 9, y: 8 }, here, [], content)).toBe('Pick up the sock');
    expect(promptFor({ kind: 'mess', x: 10, y: 8 }, here, [], content)).toMatch(/^Dust it/);
    expect(promptFor({ kind: 'door', x: 13, y: 14 }, here, [], content)).toBe('Go through');
    expect(promptFor({ kind: 'pickup', x: 20, y: 5, id: 'burrow_biscuit' }, here, [], content)).toBe(`Take the ${content.itemName('biscuit').toLowerCase()}`);
    expect(promptFor({ kind: 'neighbour', x: 0, y: 0, id: 'hazel' }, here, [], content)).toBe('Say hello to Hazel');
    expect(promptFor({ kind: 'prop', x: 3, y: 5, action: 'sleep' }, here, [], content)).toBe('Go to bed');
  });

  it('knows planted soil from bare soil', () => {
    const crop = { area: 'burrow', x: 2, y: 2, crop: 'radish', days: 0, watered: false };
    expect(promptFor({ kind: 'soil', x: 2, y: 2 }, here, [crop], content)).toBe('Tend the crop');
    expect(promptFor({ kind: 'soil', x: 3, y: 2 }, here, [crop], content)).toBe('Plant seeds');
  });
});
