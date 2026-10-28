import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { DAYS_PER_SEASON } from './clock';
import { weatherFor } from './weather';

describe('weather', () => {
  it('is the same for the same day, on every device', () => {
    for (let d = 1; d < 60; d += 1) expect(weatherFor(d)).toBe(weatherFor(d));
  });

  it('keeps the first days and every festival day dry', () => {
    for (let d = 1; d <= TUNING.weather.dryFirstDays; d += 1) expect(weatherFor(d), `day ${d}`).toBe('sunny');
    for (let d = DAYS_PER_SEASON; d <= DAYS_PER_SEASON * 8; d += DAYS_PER_SEASON) expect(weatherFor(d), `day ${d}`).toBe('sunny');
  });

  it('rains now and then each season, never every day', () => {
    for (let s = 0; s < 4; s += 1) {
      const days = Array.from({ length: DAYS_PER_SEASON * 4 }, (_, i) => s * DAYS_PER_SEASON + 1 + (i % DAYS_PER_SEASON) + Math.floor(i / DAYS_PER_SEASON) * DAYS_PER_SEASON * 4);
      const rainy = days.filter((d) => weatherFor(d) === 'rainy').length / days.length;
      expect(rainy, `season ${s}`).toBeGreaterThan(0.05);
      expect(rainy, `season ${s}`).toBeLessThan(0.5);
    }
  });
});
