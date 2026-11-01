// Ambience (polish: every place sounds like itself): a soft bed of filtered noise for each kind of
// place, with little sounds now and then on top (birds, crickets, gulls, drips, a fish plopping),
// and rain over it all when it rains. Synthesised like everything else: no audio files.

export type AmbienceKind = 'none' | 'meadow' | 'night' | 'river' | 'sea' | 'cave' | 'woods' | 'room';

interface Bed { type: BiquadFilterType; freq: number; q: number; gain: number; swell?: [number, number] }

/** Each place's bed: a filter over noise, and an optional slow swell (waves, water). */
const BEDS: Record<AmbienceKind, Bed | null> = {
  none: null,
  meadow: { type: 'highpass', freq: 3800, q: 0.5, gain: 0.006 },
  night: { type: 'lowpass', freq: 400, q: 0.5, gain: 0.006 },
  river: { type: 'bandpass', freq: 650, q: 0.6, gain: 0.035, swell: [0.35, 0.4] },
  sea: { type: 'lowpass', freq: 520, q: 0.4, gain: 0.07, swell: [0.11, 0.8] },
  cave: { type: 'lowpass', freq: 170, q: 1, gain: 0.05 },
  woods: { type: 'highpass', freq: 2200, q: 0.4, gain: 0.012, swell: [0.07, 0.6] },
  room: { type: 'lowpass', freq: 260, q: 0.5, gain: 0.008 }
};

/** How likely a little sound is on each quarter-second tick, by place. */
const EVENTS: Partial<Record<AmbienceKind, [string, number][]>> = {
  meadow: [['chirp', 0.05]], woods: [['chirp', 0.06], ['tap', 0.008]], night: [['cricket', 0.12]],
  river: [['plop', 0.012], ['chirp', 0.02]], sea: [['gull', 0.018]], cave: [['drip', 0.035]]
};

export class Ambience {
  private out: GainNode;
  private noise: AudioBuffer;
  private bed: { src: AudioBufferSourceNode; gain: GainNode; lfo?: OscillatorNode } | null = null;
  private rain: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private timer = 0;
  private kind: AmbienceKind = 'none';
  private raining = '';

  constructor(private ctx: AudioContext, destination: AudioNode) {
    this.out = ctx.createGain(); this.out.gain.value = 1; this.out.connect(destination);
    // Two seconds of noise, so the loop never sounds like a loop.
    const length = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  /** Where Puff is, and whether it's raining there (outdoors) or on the windows (indoors). Calling it again with the same is free. */
  set(kind: AmbienceKind, rain: 'none' | 'out' | 'windows') {
    if (kind !== this.kind) {
      this.kind = kind;
      this.fadeOut(this.bed); this.bed = null;
      const bed = BEDS[kind];
      if (bed) this.bed = this.loop(bed.type, bed.freq, bed.q, bed.gain, bed.swell);
      window.clearInterval(this.timer);
      if (EVENTS[kind]) this.timer = window.setInterval(() => this.events(), 250);
    }
    if (rain !== this.raining) {
      this.raining = rain;
      this.fadeOut(this.rain); this.rain = null;
      if (rain !== 'none') this.rain = this.loop(rain === 'out' ? 'highpass' : 'lowpass', rain === 'out' ? 1400 : 900, 0.5, rain === 'out' ? 0.045 : 0.02);
    }
  }

  /** Quiet (sound off). */
  stop() { this.set('none', 'none'); }

  private loop(type: BiquadFilterType, freq: number, q: number, gain: number, swell?: [number, number]) {
    const { ctx } = this;
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    g.gain.setTargetAtTime(gain, ctx.currentTime, 0.8);
    src.connect(filter).connect(g).connect(this.out);
    let lfo: OscillatorNode | undefined;
    if (swell) {
      // A slow swell: the volume rises and falls like waves or a breeze.
      lfo = ctx.createOscillator(); lfo.frequency.value = swell[0];
      const depth = ctx.createGain(); depth.gain.value = gain * swell[1];
      lfo.connect(depth).connect(g.gain); lfo.start();
    }
    src.start(0, Math.random() * 1.5);
    return { src, gain: g, lfo };
  }

  private fadeOut(layer: { src: AudioBufferSourceNode; gain: GainNode; lfo?: OscillatorNode } | null) {
    if (!layer) return;
    const t = this.ctx.currentTime;
    layer.gain.gain.cancelScheduledValues(t); layer.gain.gain.setTargetAtTime(0.0001, t, 0.4);
    layer.src.stop(t + 2); layer.lfo?.stop(t + 2);
  }

  private events() {
    for (const [what, chance] of EVENTS[this.kind] ?? []) if (Math.random() < chance) this.play(what);
  }

  private play(what: string) {
    const { ctx } = this; const t = ctx.currentTime;
    const tone = (f: number, at: number, dur: number, type: OscillatorType, gain: number, to?: number) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t + at); if (to) o.frequency.exponentialRampToValueAtTime(to, t + at + dur);
      g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(gain, t + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(g).connect(this.out); o.start(t + at); o.stop(t + at + dur + 0.02);
    };
    const pitch = 0.9 + Math.random() * 0.25;
    switch (what) {
      case 'chirp': for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i += 1) tone(2600 * pitch, i * 0.11, 0.07, 'sine', 0.012, 3400 * pitch); break;
      case 'cricket': for (let i = 0; i < 3; i += 1) tone(4300, i * 0.06, 0.03, 'square', 0.004); break;
      case 'gull': tone(1100 * pitch, 0, 0.25, 'sine', 0.012, 800 * pitch); tone(1000 * pitch, 0.3, 0.3, 'sine', 0.01, 700 * pitch); break;
      case 'drip': tone(1500 * pitch, 0, 0.08, 'sine', 0.02, 750); tone(900, 0.12, 0.2, 'sine', 0.006, 600); break;
      case 'plop': tone(500 * pitch, 0, 0.12, 'sine', 0.018, 180); break;
      case 'tap': for (let i = 0; i < 4; i += 1) tone(900, i * 0.07, 0.03, 'triangle', 0.008); break;
    }
  }
}
