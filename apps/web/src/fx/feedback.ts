import type { HapticKind } from '../native';
import type { SoundId } from './sound';

// One hook for every satisfying cue (FRONTEND-PLAN §5): each game event maps to a sound,
// a haptic and a caption, so the game reads the same with sound off.
export type FeedbackEvent = 'scrub' | 'wipe' | 'taskDone' | 'stage' | 'roomClean' | 'pop' | 'placed' | 'bounce' | 'chore' | 'purchase' | 'tap';

interface Cue { sound: SoundId | null; haptic: HapticKind | null; vibrate: number[] | null; caption: string | null }

export const CUES: Record<FeedbackEvent, Cue> = {
  scrub: { sound: 'scrub', haptic: 'light', vibrate: [8], caption: null },
  wipe: { sound: 'wipe', haptic: 'light', vibrate: [6], caption: null },
  taskDone: { sound: 'sparkle', haptic: 'medium', vibrate: [20], caption: '[sparkle]' },
  stage: { sound: 'chime', haptic: 'medium', vibrate: [20, 50, 20], caption: '[bright chime]' },
  roomClean: { sound: 'fanfare', haptic: 'success', vibrate: [30, 60, 30, 60, 80], caption: '[happy fanfare]' },
  pop: { sound: 'pop', haptic: 'medium', vibrate: [12], caption: '[soft pop]' },
  placed: { sound: 'thunk', haptic: 'light', vibrate: [10], caption: '[thunk]' },
  bounce: { sound: 'boing', haptic: null, vibrate: null, caption: '[boing]' },
  chore: { sound: 'coin', haptic: 'success', vibrate: [15, 40, 15], caption: '[ding]' },
  purchase: { sound: 'coin', haptic: 'light', vibrate: [10], caption: '[ding]' },
  tap: { sound: 'tap', haptic: null, vibrate: null, caption: null }
};

const STROKE_EVENTS = new Set<FeedbackEvent>(['scrub', 'wipe']);
const STROKE_HAPTIC_MS = 60;
const STROKE_SOUND_MS = 70;

export interface FeedbackDeps {
  play(id: SoundId, level: number): void;
  haptic(kind: HapticKind): void;
  vibrate: ((pattern: number[]) => void) | null;
  caption(text: string): void;
  now(): number;
  settings(): { sound: boolean; haptics: boolean };
}

export function createFeedback(deps: FeedbackDeps) {
  let lastHaptic = -Infinity;
  let lastSound = -Infinity;
  return {
    emit(event: FeedbackEvent, level = 0) {
      const cue = CUES[event];
      const now = deps.now();
      const { sound, haptics } = deps.settings();
      const stroke = STROKE_EVENTS.has(event);
      if (sound && cue.sound && (!stroke || now - lastSound >= STROKE_SOUND_MS)) {
        if (stroke) lastSound = now;
        deps.play(cue.sound, level);
      }
      if (haptics && (cue.haptic || cue.vibrate) && (!stroke || now - lastHaptic >= STROKE_HAPTIC_MS)) {
        if (stroke) lastHaptic = now;
        if (deps.vibrate && cue.vibrate) deps.vibrate(cue.vibrate);
        else if (cue.haptic) deps.haptic(cue.haptic);
      }
      if (!sound && cue.caption) deps.caption(cue.caption);
    }
  };
}
