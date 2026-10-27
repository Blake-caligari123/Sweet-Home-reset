// Tester readout (?fps in the URL): frames per second and the worst stall in the last second, so
// people seeing freezes can tell us what their phone does.
export class FrameStats {
  private times: number[] = [];
  private worstMs = 0;

  push(dtMs: number) {
    this.times.push(dtMs);
    this.worstMs = Math.max(this.worstMs, dtMs);
  }

  /** Summary since the last call, then start a new window. */
  take() {
    const total = this.times.reduce((s, t) => s + t, 0);
    const out = { fps: total > 0 ? Math.round((this.times.length * 1000) / total) : 0, worstMs: Math.round(this.worstMs), stalls: this.times.filter((t) => t > 100).length };
    this.times = []; this.worstMs = 0;
    return out;
  }
}
