import { TUNING } from '../data/tuning';

// Talking (GDD v3 §6.1): each neighbour has pools of lines tagged by time, season, weather,
// hearts, area and flags. The most specific line that fits wins (flag > hearts > weather > season
// > time > anything), skipping the last 5 heard. The first chat of the day counts toward
// friendship; after that, neighbours give a short "busy" line. Text lives in the string table.
export type TimeBand = 'morning' | 'day' | 'evening' | 'night';

export interface Line {
  id: string;
  time?: TimeBand; season?: string; weather?: string; area?: string;
  /** Only on a festival day. */
  festival?: boolean;
  heartsMin?: number; heartsMax?: number;
  /** Only while this save flag is set. */
  flag?: string;
  /** Said once ever (sets `said_<id>`). */
  once?: boolean;
  /** For a second chat on the same day. */
  busy?: boolean;
  /** The very first hello. */
  meet?: boolean;
}

export interface TalkContext {
  minutes: number; season: string; weather: string; hearts: number; area: string;
  flags: string[]; met: boolean; talkedToday: boolean; recent: string[];
  /** Today is a festival. */
  festival?: boolean;
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
  if (l.festival && !c.festival) return false;
  if (l.flag && !c.flags.includes(l.flag)) return false;
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
  if (l.festival) return 7; // a festival day's hello beats everything
  if (l.area) return 6; // met somewhere they're only visiting: that hello first
  if (l.flag) return 5;
  if (l.heartsMin !== undefined || l.heartsMax !== undefined) return 4;
  if (l.weather) return 3;
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
