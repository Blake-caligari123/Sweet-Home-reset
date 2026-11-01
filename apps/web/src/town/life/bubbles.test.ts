import { describe, expect, it } from 'vitest';
import { idleBubble } from './bubbles';

describe('neighbour bubbles', () => {
  it('shows sleep, a happy hum, their own thing, or what they do in that place', () => {
    expect(idleBubble({ id: 'hazel', area: 'bakery', pose: 'sleep', mood: 'happy' }, 0.9)).toBe('💤');
    expect(idleBubble({ id: 'hazel', area: 'bakery', pose: 'idle', mood: 'happy' }, 0.1)).toBe('♪');
    expect(idleBubble({ id: 'juniper', area: 'woodland', pose: 'idle', mood: 'calm' }, 0.3)).toBe('🎻');
    expect(['🍞', '🥧', '☕']).toContain(idleBubble({ id: 'hazel', area: 'bakery', pose: 'idle', mood: 'calm' }, 0.8));
    expect(idleBubble({ id: 'nobody', area: 'nowhere', pose: 'idle', mood: 'calm' }, 0.9)).toBe('💬');
  });
});
