import { TUNING } from '../data/tuning';

// A day runs 6:00 to 2:00 (GDD v3 A8). Game minutes are counted from midnight, so 2:00 is 1560.
export const DAY_START = 6 * 60;
export const DAY_END = 26 * 60;
export const LATE_AT = 25 * 60;
export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;
export const DAYS_PER_SEASON = 14;

export function realMsPerGameMinute(dayRealMinutes = TUNING.dayRealMinutes) {
  return (dayRealMinutes * 60_000) / (DAY_END - DAY_START);
}

export interface ClockState { day: number; minutes: number }
export type ClockEvent = 'tick' | 'late' | 'doze';

export class Clock {
  private carry = 0;
  speed = 1;
  constructor(public state: ClockState = { day: 1, minutes: DAY_START }) {}

  get season() { return SEASONS[Math.floor((this.state.day - 1) / DAYS_PER_SEASON) % 4]; }
  get dayOfSeason() { return ((this.state.day - 1) % DAYS_PER_SEASON) + 1; }
  /** Time shown in 10-minute steps, as the HUD does. */
  get shown() { return Math.floor(this.state.minutes / TUNING.gameMinutesPerTick) * TUNING.gameMinutesPerTick; }

  advance(realMs: number): ClockEvent[] {
    const events: ClockEvent[] = [];
    if (this.state.minutes >= DAY_END) return events;
    this.carry += (realMs * this.speed) / realMsPerGameMinute(this.state.day === 1 ? TUNING.firstDayRealMinutes : TUNING.dayRealMinutes);
    const whole = Math.floor(this.carry);
    if (!whole) return events;
    this.carry -= whole;
    const before = this.shown;
    const was = this.state.minutes;
    this.state.minutes = Math.min(DAY_END, this.state.minutes + whole);
    if (this.shown !== before) events.push('tick');
    if (was < LATE_AT && this.state.minutes >= LATE_AT) events.push('late');
    if (this.state.minutes >= DAY_END) events.push('doze');
    return events;
  }

  nextDay() { this.state = { day: this.state.day + 1, minutes: DAY_START }; this.carry = 0; }
}

export function formatTime(minutes: number) {
  const m = minutes % (24 * 60);
  const h24 = Math.floor(m / 60); const mm = String(m % 60).padStart(2, '0');
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${mm} ${h24 < 12 ? 'am' : 'pm'}`;
}
