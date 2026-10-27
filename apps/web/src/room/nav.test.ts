import { describe, expect, it } from 'vitest';
import { backAction } from './nav';

describe('back button', () => {
  it('opens pause in a room and closes it again', () => {
    expect(backAction('room', null)).toBe('pause');
    expect(backAction('room', 'pause')).toBe('resume');
  });

  it('never skips the restored screen and its chore choice', () => {
    expect(backAction('room', 'restored')).toBe('none');
  });

  it('returns home from menus and backgrounds the app from home', () => {
    expect(backAction('shop', null)).toBe('home');
    expect(backAction('settings', null)).toBe('home');
    expect(backAction('chores', null)).toBe('home');
    expect(backAction('home', null)).toBe('minimize');
  });
});
