// Combos only add a little bonus and a Puff cheer; they never time out a task (GAME-DESIGN §3).
export const COMBO_WINDOW_MS = 1200;
export const COMBO_STEP = 5;
export const COMBO_BONUS_CAP = 10;

export class Combo {
  count = 0;
  bonus = 0;
  private last = -Infinity;

  /** Register one satisfying action. Returns a milestone (5, 10, 15...) when one is reached. */
  hit(now: number): number | null {
    this.count = now - this.last <= COMBO_WINDOW_MS ? this.count + 1 : 1;
    this.last = now;
    if (this.count % COMBO_STEP !== 0) return null;
    if (this.bonus < COMBO_BONUS_CAP) this.bonus += 1;
    return this.count;
  }
}
