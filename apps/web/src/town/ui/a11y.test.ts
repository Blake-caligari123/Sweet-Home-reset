import { describe, expect, it } from 'vitest';
import { applyLook, clockLabel, newJobsLine, nextTextSize, sparklesLabel, textSizeOf } from './a11y';

describe('look settings', () => {
  it('puts each one on the page as a class, and takes it off again', () => {
    const root = { classList: new Set<string>(), style: { fontSize: '' } } as unknown as HTMLElement;
    const list = root.classList as unknown as Set<string>;
    (root.classList as unknown as { toggle(c: string, on: boolean): void }).toggle = (c, on) => { if (on) list.add(c); else list.delete(c); };
    applyLook({ reducedMotion: true, textSize: 150, highContrast: false }, root);
    expect([...list].sort()).toEqual(['big-text', 'reduce-motion']);
    expect(root.style.fontSize).toBe('24px');
    applyLook({ reducedMotion: false, highContrast: true }, root);
    expect([...list]).toEqual(['high-contrast']);
    expect(root.style.fontSize).toBe('16px');
  });

  it('offers text at 100, 125 and 150%, and reads an older Bigger text switch as 125%', () => {
    expect(textSizeOf({})).toBe(100);
    expect(textSizeOf({ bigText: true })).toBe(125);
    expect(textSizeOf({ bigText: true, textSize: 150 })).toBe(150);
    expect([100, 125, 150].map(nextTextSize)).toEqual([125, 150, 100]);
  });

  it('reads the clock as words: the day, the time and the sky', () => {
    expect(clockLabel('Spring 1', '6:00 am', false, false)).toBe('Spring 1, 6:00 am, sunny');
    expect(clockLabel('Winter 3', '9:30 pm', true, false)).toBe('Winter 3, 9:30 pm, night');
    expect(clockLabel('Summer 2', '1:00 pm', false, true)).toBe('Summer 2, 1:00 pm, rainy');
  });

  it('says how many Sparkles, and how many new jobs went up', () => {
    expect(sparklesLabel(0)).toBe('0 Sparkles');
    expect(sparklesLabel(1)).toBe('1 Sparkle');
    expect(newJobsLine(0)).toBe('');
    expect(newJobsLine(1)).toBe('1 new job on the notice board.');
    expect(newJobsLine(3)).toBe('3 new jobs on the notice board.');
  });
});
