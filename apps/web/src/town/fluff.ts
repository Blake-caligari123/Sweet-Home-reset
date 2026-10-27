import { TUNING } from './tuning';

/** Fluff is Puff's stamina (GDD v3 A8). Walking and talking are free; tools cost Fluff. */
export class Fluff {
  constructor(public value = TUNING.fluffStart, public max = TUNING.fluffStart, public boost = 0) {}

  get cap() { return this.max + this.boost; }
  get tired() { return this.value < TUNING.fluffLowThreshold; }

  costOf(charged = false) {
    const base = charged ? TUNING.fluffCharged[0] : TUNING.fluffToolUse;
    return base + (this.tired ? 1 : 0);
  }

  canUse(charged = false) { return this.value >= this.costOf(charged) && this.value > 0; }

  spend(charged = false, multiplier = 1) {
    if (!this.canUse(charged)) return false;
    this.value = Math.max(0, this.value - Math.max(1, Math.round(this.costOf(charged) * multiplier)));
    return true;
  }

  eat(amount: number) { this.value = Math.min(this.cap, this.value + amount); }
  sleep() { this.boost = 0; this.value = this.max; }
  doze() { this.boost = 0; this.value = Math.round(this.max * TUNING.dozeWakeFluffFraction); }
}
