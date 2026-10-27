import { describe, expect, it, vi } from 'vitest';
import { createPauseController } from './pause';

describe('pause controller', () => {
  it('opens pause on the first back press', () => {
    const onChange = vi.fn();
    const pause = createPauseController({ onChange, minimize: vi.fn() });
    pause.back();
    expect(pause.paused).toBe(true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('sends the app to the background on a back press while paused, and keeps the pause', () => {
    const minimize = vi.fn();
    const pause = createPauseController({ onChange: vi.fn(), minimize });
    pause.back();
    pause.back();
    expect(minimize).toHaveBeenCalledOnce();
    expect(pause.paused).toBe(true);
  });

  it('resumes and ignores repeat opens', () => {
    const onChange = vi.fn();
    const pause = createPauseController({ onChange, minimize: vi.fn() });
    pause.open();
    pause.open();
    pause.resume();
    pause.resume();
    expect(onChange.mock.calls).toEqual([[true], [false]]);
  });
});
