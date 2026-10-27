import { describe, expect, it, vi } from 'vitest';
import { CUES, createFeedback, type FeedbackDeps } from './feedback';

function deps(over: Partial<FeedbackDeps> = {}) {
  let t = 0;
  const d = {
    play: vi.fn(), haptic: vi.fn(), vibrate: null, caption: vi.fn(),
    now: () => t, settings: () => ({ sound: true, haptics: true }), ...over
  } as FeedbackDeps & { play: ReturnType<typeof vi.fn>; haptic: ReturnType<typeof vi.fn>; caption: ReturnType<typeof vi.fn> };
  return { d, tick: (ms: number) => { t += ms; } };
}

describe('feedback', () => {
  it('maps every event to at least one cue a player can notice', () => {
    for (const cue of Object.values(CUES)) expect(cue.sound || cue.haptic || cue.caption).toBeTruthy();
  });

  it('throttles stroke haptics to one per 60 ms', () => {
    const { d, tick } = deps();
    const fb = createFeedback(d);
    for (let i = 0; i < 10; i += 1) { fb.emit('scrub'); tick(10); }
    expect(d.haptic).toHaveBeenCalledTimes(2);
  });

  it('uses navigator.vibrate patterns when that is all there is, and never both', () => {
    const vibrate = vi.fn();
    const { d } = deps({ vibrate });
    createFeedback(d).emit('stage');
    expect(vibrate).toHaveBeenCalledWith([20, 50, 20]);
    expect(d.haptic).not.toHaveBeenCalled();
  });

  it('goes silent and still shows captions when sound is off', () => {
    const { d } = deps({ settings: () => ({ sound: false, haptics: false }) });
    const fb = createFeedback(d);
    fb.emit('roomClean'); fb.emit('pop');
    expect(d.play).not.toHaveBeenCalled();
    expect(d.haptic).not.toHaveBeenCalled();
    expect(d.caption).toHaveBeenCalledWith('[happy fanfare]');
  });
});
