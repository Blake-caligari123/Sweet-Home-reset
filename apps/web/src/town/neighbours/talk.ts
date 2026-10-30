import type { Mood } from '../life/mood';
import { TUNING } from '../data/tuning';

// Talking (GDD v3 §6.1): each neighbour has pools of lines tagged by time, season, weather,
// hearts, area, flags, mood, memories, dramas and opinions. The most specific line that fits wins (festival >
// memory > drama > area > flag > hearts > opinion of a friend > mood > weather > the town > season > time > anything), skipping the last 5 heard. The first chat of the day counts toward
// friendship; after that, neighbours give a short "busy" line. Text lives in the string table.
export type TimeBand = 'morning' | 'day' | 'evening' | 'night';

export interface Line {
  id: string;
  time?: TimeBand; season?: string; weather?: string; area?: string;
  /** Only on this festival's day. */
  festival?: string;
  heartsMin?: number; heartsMax?: number;
  /** Only while this save flag is set. */
  flag?: string;
  /** Said once ever (sets `said_<id>`). */
  once?: boolean;
  /** For a second chat on the same day. */
  busy?: boolean;
  /** The very first hello. */
  meet?: boolean;
  /** Only in one of these moods (life/mood.ts). */
  mood?: Mood[];
  /** Only while they remember this (life/memory.ts: 'tidied_home', 'restored_square'…). */
  remembers?: string;
  /** Only while this drama is brewing. */
  drama?: string;
  /** An opinion of another neighbour: only once they're in town (and, with `aboutMood`, feeling one of these). */
  about?: string; aboutMood?: Mood[];
  /** An opinion of the town: only once Town Bloom is at least this level. */
  bloomMin?: number;
}

export interface TalkContext {
  minutes: number; season: string; weather: string; hearts: number; area: string;
  flags: string[]; met: boolean; talkedToday: boolean; recent: string[];
  /** Today's festival, if any. */
  festival?: string;
  /** How they feel, what they remember, and dramas they're in (life/). */
  mood?: Mood; memories?: string[]; dramas?: string[];
  /** How everyone else in town feels (for opinions of each other), and the Town Bloom level. */
  others?: Record<string, Mood>; bloom?: number;
}

/** How many talks back a line stays unheard. */
export const RECENT = 5;

export function timeBand(minutes: number): TimeBand {
  const h = Math.floor(minutes / 60) % 24;
  return h >= 6 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'day' : h >= 17 && h < 22 ? 'evening' : 'night';
}

export function heartsOf(points: number) {
  return Math.min(10, Math.floor(points / TUNING.friendship.pointsPerHeart));
}

function fits(l: Line, c: TalkContext) {
  if (l.festival && l.festival !== c.festival) return false;
  if (l.flag && !c.flags.includes(l.flag)) return false;
  if (l.mood && (!c.mood || !l.mood.includes(c.mood))) return false;
  if (l.remembers && !c.memories?.includes(l.remembers)) return false;
  if (l.drama && !c.dramas?.includes(l.drama)) return false;
  if (l.about && !(c.others?.[l.about] && (!l.aboutMood || l.aboutMood.includes(c.others[l.about])))) return false;
  if (l.bloomMin !== undefined && (c.bloom ?? 1) < l.bloomMin) return false;
  if (l.once && c.flags.includes(`said_${l.id}`)) return false;
  if (l.time && l.time !== timeBand(c.minutes)) return false;
  if (l.season && l.season !== c.season) return false;
  if (l.weather && l.weather !== c.weather) return false;
  if (l.area && l.area !== c.area) return false;
  if (l.heartsMin !== undefined && c.hearts < l.heartsMin) return false;
  if (l.heartsMax !== undefined && c.hearts > l.heartsMax) return false;
  return true;
}

function tier(l: Line) {
  if (l.festival) return 9; // a festival day's hello beats everything
  if (l.remembers) return 8; // then something Puff did
  if (l.drama) return 7; // then what's on their mind
  if (l.area) return 6; // met somewhere they're only visiting: that hello first
  if (l.flag) return 5;
  if (l.heartsMin !== undefined || l.heartsMax !== undefined) return 4;
  if (l.about) return 3.7; // what they think of a friend, then how they feel
  if (l.mood) return 3.5;
  if (l.weather) return 3;
  if (l.bloomMin !== undefined) return 2.5;
  if (l.season) return 2;
  if (l.time) return 1;
  return 0;
}

export function pickLine(lines: Line[], c: TalkContext, rand: () => number = Math.random): Line | null {
  const pool = (want: (l: Line) => boolean) => lines.filter((l) => want(l) && fits(l, c));
  if (!c.met) { const meet = pool((l) => !!l.meet); if (meet.length) return meet[0]; }
  if (c.talkedToday) {
    const busy = pool((l) => !!l.busy);
    const fresh = busy.filter((l) => !c.recent.includes(l.id));
    const from = fresh.length ? fresh : busy;
    if (from.length) return from[Math.floor(rand() * from.length)];
  }
  const all = pool((l) => !l.busy && !l.meet);
  if (!all.length) return null;
  const fresh = all.filter((l) => !c.recent.includes(l.id));
  if (!fresh.length) {
    // Heard them all lately: the one heard longest ago.
    return [...all].sort((a, b) => c.recent.indexOf(a.id) - c.recent.indexOf(b.id))[0];
  }
  const top = Math.max(...fresh.map(tier));
  const best = fresh.filter((l) => tier(l) === top);
  return best[Math.floor(rand() * best.length)];
}
