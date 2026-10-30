// How a neighbour feels today (NEXT-PHASE §5.3: fully alive). It comes from their own day, never
// from blame: a tidy home, a chat with Puff, a gift they like, a friend nearby, their kind of
// weather; a messy home or a falling-out pulls it down. A chat with Puff always helps.

export type Mood = 'low' | 'okay' | 'happy' | 'glowing';

export interface MoodFacts {
  /** 0 (grey and messy) to 1 (restored). */
  homeTidy: number;
  talkedToday: boolean;
  gift: 'loved' | 'liked' | null;
  friendNear: boolean;
  likesWeather: boolean;
  /** In the middle of a falling-out. */
  drama: boolean;
}

export function moodOf(f: MoodFacts): Mood {
  const score = (f.homeTidy - 0.5) * 2 + (f.talkedToday ? 1 : 0) + (f.gift === 'loved' ? 2 : f.gift === 'liked' ? 1 : 0)
    + (f.friendNear ? 1 : 0) + (f.likesWeather ? 0.5 : 0) - (f.drama ? 1.5 : 0);
  return score >= 3.5 ? 'glowing' : score >= 1.5 ? 'happy' : score > -1 ? 'okay' : 'low';
}
