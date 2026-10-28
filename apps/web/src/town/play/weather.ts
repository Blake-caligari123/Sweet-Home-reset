import { seeded } from '../../shared/art/pixel-canvas';
import { TUNING } from '../data/tuning';
import { DAYS_PER_SEASON, type Clock } from './clock';

// Weather (VISION §7: it changes play): some days it rains, which waters every outdoor crop and
// sends rain streaks across outdoor places. Fixed per day, the same on every device, and never on
// the first few days or a festival day (the last day of each season).

export type Weather = 'sunny' | 'rainy';

export function weatherFor(day: number): Weather {
  const ofSeason = ((day - 1) % DAYS_PER_SEASON) + 1;
  if (day <= TUNING.weather.dryFirstDays || ofSeason === DAYS_PER_SEASON) return 'sunny';
  const season = Math.floor((day - 1) / DAYS_PER_SEASON) % 4;
  return seeded(day * 7919 + 131)() < TUNING.weather.rainChance[season] ? 'rainy' : 'sunny';
}

/** What the morning brings to say: a new season (a banner), rain. As [how, text id]. */
export function morningNews(clock: Pick<Clock, 'state' | 'season' | 'dayOfSeason' | 'weather'>): ['banner' | 'say', string][] {
  const out: ['banner' | 'say', string][] = [];
  if (clock.dayOfSeason === 1 && clock.state.day > 1) out.push(['banner', `season.${clock.season.toLowerCase()}`]);
  if (clock.weather === 'rainy') out.push(['say', 'weather.rain']);
  return out;
}
