import { TUNING } from '../data/tuning';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { Hud } from '../ui/hud';
import type { View } from '../ui/view';

// Puff's own moods (NEXT-PHASE §5.2), with small effects: a happy Puff tidies a little quicker, a
// curious one spots more finds, a sleepy one says so. They come from a snack, a chat, a cosy burrow
// and new places. Puff is never sad, and never because of the player: the plainest mood is content.

export type PuffMood = 'sleepy' | 'happy' | 'curious' | 'content';

/** Today's little things that make Puff's mood (saved, so a reload keeps it). */
export interface PuffDay { day: number; ate: boolean; places: string[] }

const MOOD_INFO: Record<PuffMood, { icon: string; word: string; does: string }> = {
  happy: { icon: '😊', word: 'happy', does: 'tidies a little quicker' },
  curious: { icon: '🔍', word: 'curious', does: 'spots finds more often' },
  sleepy: { icon: '💤', word: 'sleepy', does: 'a snack or bed would help' },
  content: { icon: '🙂', word: 'content', does: 'a snack, a chat and a cosy burrow make a happy day' }
};

/** Note a moment for today's mood (a snack, a new place); a new day starts fresh. */
export function notePuffDay(d: PuffDay, e: OnboardEvent, day: number): PuffDay {
  const today = d.day === day ? d : { day, ate: false, places: [] };
  if (e.type === 'ate') return { ...today, ate: true };
  if (e.type === 'entered' && !today.places.includes(e.area)) return { ...today, places: [...today.places, e.area] };
  return today;
}

export interface MoodInputs { tired: boolean; ate: boolean; chatted: boolean; burrowTidy: number; places: number }

/** Sleepy first (Fluff says so), then happy (two of a snack, a chat, a cosy burrow), then curious (new places), else content. */
export function puffMoodOf(i: MoodInputs): PuffMood {
  const t = TUNING.puffMood;
  if (i.tired) return 'sleepy';
  if (Number(i.ate) + Number(i.chatted) + Number(i.burrowTidy >= t.cosyBurrow) >= 2) return 'happy';
  if (i.places >= t.curiousPlaces) return 'curious';
  return 'content';
}

/** Puff's mood right now, from the save and how tidy the burrow is. */
export function puffMood(state: TownState, day: number, burrowTidy: number): PuffMood {
  const d = state.puffDay.day === day ? state.puffDay : { ate: false, places: [] };
  return puffMoodOf({
    tired: state.fluff.tired, ate: d.ate, burrowTidy, places: d.places.length,
    chatted: Object.values(state.friends).some((f) => f.talkedDay === day)
  });
}

export interface PuffMoodsHost { state: TownState; view: View; hud: Hud; day(): number; burrowTidy(): number }

/** Puff's mood in play: notes today's moments, shows the face in the HUD, and says how Puff feels when it's tapped. */
export class PuffMoods {
  constructor(private host: PuffMoodsHost) {}

  hear(e: OnboardEvent) { this.host.state.puffDay = notePuffDay(this.host.state.puffDay, e, this.host.day()); }

  now() { return puffMood(this.host.state, this.host.day(), this.host.burrowTidy()); }

  show() {
    const info = MOOD_INFO[this.now()];
    this.host.hud.setMood(info.icon, `${this.host.state.names.puff} feels ${info.word}`);
  }

  /** "Puff feels happy: tidies a little quicker." */
  line() {
    const info = MOOD_INFO[this.now()];
    return `${info.icon} ${this.host.state.names.puff} feels ${info.word}: ${info.does}.`;
  }

  say() { this.host.view.say(this.line()); }
}
