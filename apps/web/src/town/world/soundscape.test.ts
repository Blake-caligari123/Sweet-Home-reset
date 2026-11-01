import { describe, expect, it } from 'vitest';
import { soundscapeFor } from './soundscape';

describe('soundscapes', () => {
  it('gives each kind of place its own sound, and changes with the night and the rain', () => {
    expect(soundscapeFor({ id: 'square', kind: 'outdoor' }, 10 * 60, false)).toEqual({ ambience: 'meadow', rain: 'none', mood: 'day' });
    expect(soundscapeFor({ id: 'square', kind: 'outdoor' }, 22 * 60, true)).toEqual({ ambience: 'night', rain: 'out', mood: 'night' });
    expect(soundscapeFor({ id: 'harbour', kind: 'outdoor' }, 22 * 60, false).ambience).toBe('sea'); // the waves go on all night
    expect(soundscapeFor({ id: 'riverside', kind: 'outdoor' }, 9 * 60, false).ambience).toBe('river');
    expect(soundscapeFor({ id: 'glade', kind: 'outdoor' }, 9 * 60, false).ambience).toBe('woods');
    expect(soundscapeFor({ id: 'bakery', kind: 'home' }, 9 * 60, true)).toEqual({ ambience: 'room', rain: 'windows', mood: 'indoor' });
    expect(soundscapeFor({ id: 'cave_2', kind: 'cave' }, 9 * 60, true)).toEqual({ ambience: 'cave', rain: 'none', mood: 'cave' });
  });
});
