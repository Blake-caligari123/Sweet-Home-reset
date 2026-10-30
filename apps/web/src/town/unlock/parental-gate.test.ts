import { describe, expect, it } from 'vitest';
import { parentAnswerOk, parentQuestion } from './parental-gate';

describe('parental gate', () => {
  it('asks a times-table question in words, so it takes reading and sums', () => {
    let seed = 0;
    const q = parentQuestion(() => (seed = (seed + 0.37) % 1));
    expect(q.text).toMatch(/^Ask a grown-up: what is [a-z]+ times [a-z]+\?$/);
    expect(q.answer).toBeGreaterThanOrEqual(36);
    expect(q.answer).toBeLessThanOrEqual(81);
  });

  it('accepts only the right number, with spaces forgiven', () => {
    expect(parentAnswerOk(' 42 ', 42)).toBe(true);
    expect(parentAnswerOk('41', 42)).toBe(false);
    expect(parentAnswerOk('forty-two', 42)).toBe(false);
    expect(parentAnswerOk('', 42)).toBe(false);
  });
});
