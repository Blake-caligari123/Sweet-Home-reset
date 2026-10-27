// Every sound is synthesised with WebAudio, so there are no audio files to license or download.
export type SoundId = 'scrub' | 'wipe' | 'pop' | 'chime' | 'fanfare' | 'pff' | 'thunk' | 'boing' | 'tap' | 'coin' | 'sparkle';

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  enabled = true;

  /** Browsers only allow audio after a user gesture; call this from the first tap. */
  unlock() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    const length = this.ctx.sampleRate * 0.5;
    this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number, endFreq?: number) {
    const ctx = this.ctx!; const t = ctx.currentTime + start;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master!);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  private hiss(start: number, dur: number, freq: number, q: number, gain: number) {
    const ctx = this.ctx!; const t = ctx.currentTime + start;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.master!);
    src.start(t, Math.random() * 0.3); src.stop(t + dur + 0.02);
  }

  /** `level` 0..1 raises pitch one semitone per 10% clean. */
  play(id: SoundId, level = 0) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const lift = Math.pow(2, Math.floor(level * 10) / 12);
    switch (id) {
      case 'scrub': this.hiss(0, 0.07, 1800 * lift, 1.2, 0.18); break;
      case 'wipe': this.tone(1300 * lift, 0, 0.06, 'sine', 0.05, 1900 * lift); break;
      case 'pop': this.tone(700, 0, 0.09, 'sine', 0.22, 180); this.hiss(0, 0.04, 3000, 0.8, 0.08); break;
      case 'pff': this.hiss(0, 0.16, 900, 0.6, 0.2); break;
      case 'thunk': this.tone(220, 0, 0.1, 'triangle', 0.25, 110); break;
      case 'boing': this.tone(300, 0, 0.18, 'sine', 0.15, 520); break;
      case 'tap': this.tone(880, 0, 0.05, 'sine', 0.06); break;
      case 'coin': this.tone(1320, 0, 0.08, 'square', 0.04); this.tone(1760, 0.07, 0.12, 'square', 0.04); break;
      case 'sparkle': [0, 0.05, 0.1].forEach((s, i) => this.tone(2093 * Math.pow(2, i / 6), s, 0.12, 'sine', 0.05)); break;
      case 'chime': [523, 659, 784].forEach((f, i) => this.tone(f * lift, i * 0.08, 0.5, 'triangle', 0.14)); break;
      case 'fanfare': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.1, 0.6, 'triangle', 0.15)); this.play('sparkle'); break;
    }
  }
}
