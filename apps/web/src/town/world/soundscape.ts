import type { AmbienceKind } from '../../shared/audio/ambience';
import type { MusicMood } from '../../shared/audio/sound';

// What a place sounds like (polish): its ambience and the music's mood, from the kind of place,
// where it is, the time and the weather. Pure; game.ts hands it to the sound engine.

const WATER = new Set(['riverside', 'far_bank']);
const SEA = new Set(['beach', 'harbour']);
const TREES = new Set(['woodland', 'glade', 'orchard_hill']);

export interface Soundscape { ambience: AmbienceKind; rain: 'none' | 'out' | 'windows'; mood: MusicMood }

/** Night runs from 8 pm to 6 am. */
const isNight = (minutes: number) => minutes >= 20 * 60 || minutes < 6 * 60;

export function soundscapeFor(area: { id: string; kind: string }, minutes: number, rainy: boolean): Soundscape {
  if (area.kind === 'cave') return { ambience: 'cave', rain: 'none', mood: 'cave' };
  if (area.kind !== 'outdoor') return { ambience: 'room', rain: rainy ? 'windows' : 'none', mood: isNight(minutes) ? 'night' : 'indoor' };
  const night = isNight(minutes);
  // Water and waves carry on through the night; meadows and woods hand over to crickets.
  const ambience: AmbienceKind = SEA.has(area.id) ? 'sea' : WATER.has(area.id) ? 'river' : night ? 'night' : TREES.has(area.id) ? 'woods' : 'meadow';
  return { ambience, rain: rainy ? 'out' : 'none', mood: night ? 'night' : 'day' };
}
