// Every sound is synthesised with WebAudio, so there are no audio files to license or download.
import { Ambience, type AmbienceKind } from './ambience';

export const SOUND_IDS = ['scrub', 'wipe', 'pop', 'chime', 'fanfare', 'pff', 'thunk', 'boing', 'tap', 'coin', 'sparkle', 'fwip', 'combo',
  // Cutscene sounds (town/story/): footsteps, a yawn, a snore, Thimble's four-note hum, a cave drip, the grey's whoosh, wind, a waking blip, a magic shimmer.
  'step', 'yawn', 'snore', 'hum', 'drip', 'whoosh', 'wind', 'wake', 'shimmer'] as const;
export type SoundId = (typeof SOUND_IDS)[number];

/** The music's mood: how muffled, how quick, how much melody, how loud. */
export type MusicMood = 'day' | 'indoor' | 'night' | 'cave';
const MOODS: Record<MusicMood, { cutoff: number; tempo: number; melody: number; gain: number }> = {
  day: { cutoff: 1500, tempo: 72, melody: 1, gain: 0.16 },
  indoor: { cutoff: 1000, tempo: 70, melody: 0.8, gain: 0.13 },
  night: { cutoff: 760, tempo: 58, melody: 0.45, gain: 0.11 },
  cave: { cutoff: 560, tempo: 54, melody: 0.3, gain: 0.1 }
};

/** C major pentatonic, two octaves up from C5: the notes a cleared spot climbs as a place gets tidy. */
const PENTATONIC = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5, 1568, 1760];

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private on = true;
  private ambience: Ambience | null = null;
  private place: [AmbienceKind, 'none' | 'out' | 'windows'] = ['none', 'none'];

  /** Sound effects and ambience on or off (the music has its own switch). */
  get enabled() { return this.on; }
  set enabled(v: boolean) { this.on = v; this.applyPlace(); }

  /** Where Puff is, for the ambience (shared/audio/ambience.ts). Free to call often. */
  setPlace(kind: AmbienceKind, rain: 'none' | 'out' | 'windows') { this.place = [kind, rain]; this.applyPlace(); }

  private applyPlace() {
    if (!this.ctx || !this.master) return;
    if (!this.ambience) this.ambience = new Ambience(this.ctx, this.master);
    if (this.on) this.ambience.set(...this.place); else this.ambience.stop();
  }

  private mood = MOODS.day;

  /** The music's mood for the place and time (indoors muffled, night slow and sparse); summer's a touch brighter. */
  setMood(name: MusicMood, season = 'Spring') {
    const next = MOODS[name];
    const cutoff = next.cutoff + (season === 'Summer' ? 350 : season === 'Winter' ? -150 : 0);
    if (this.mood === next && this.musicFilter?.frequency.value === cutoff) return;
    this.mood = next;
    if (!this.ctx || !this.musicFilter || !this.musicGain) return;
    this.musicFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 1.2);
    if (this.musicTimer) this.musicGain.gain.setTargetAtTime(next.gain, this.ctx.currentTime, 1.2);
  }

  /** Browsers only allow audio after a user gesture; call this from the first tap. */
  unlock() {
    if (this.ctx) { void this.ctx.resume(); this.startMusic(); return; }
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
    this.startMusic();
    this.applyPlace();
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

  // ---- music: a calm lo-fi loop, written live so there is no audio file -------------------

  private musicGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicTimer = 0;
  private nextBeat = 0;
  private beat = 0;
  musicOn = true;
  /** Extra layers for a room coming alive: 1 adds a music-box melody, 2 soft bells too. 0 is the plain loop. */
  bloom = 0;

  /** Start (or resume) the background loop. Safe to call repeatedly. */
  startMusic() {
    if (!this.ctx || !this.musicOn || this.musicTimer) return;
    if (!this.musicGain) {
      this.musicGain = this.ctx.createGain();
      const filter = this.musicFilter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = this.mood.cutoff;
      this.musicGain.connect(filter).connect(this.ctx.destination);
    }
    this.musicGain.gain.setTargetAtTime(this.mood.gain, this.ctx.currentTime, 0.8);
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.schedule(), 120);
  }

  stopMusic() {
    if (this.musicTimer) { window.clearInterval(this.musicTimer); this.musicTimer = 0; }
    if (this.ctx && this.musicGain) this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  private note(freq: number, at: number, dur: number, type: OscillatorType, gain: number, attack = 0.01) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(this.musicGain!);
    osc.start(at); osc.stop(at + dur + 0.05);
  }

  private schedule() {
    const ctx = this.ctx!;
    const eighth = 60 / this.mood.tempo / 2;
    // Fmaj7 · Em7 · Dm7 · Cmaj7, one bar each.
    const chords = [[174.6, 220, 261.6, 329.6], [164.8, 196, 246.9, 293.7], [146.8, 174.6, 220, 261.6], [130.8, 164.8, 196, 246.9]];
    const scale = [523.3, 587.3, 659.3, 784, 880, 1046.5];
    while (this.nextBeat < ctx.currentTime + 0.5) {
      const t = this.nextBeat;
      const step = this.beat % 8;
      const chord = chords[Math.floor(this.beat / 8) % chords.length];
      if (step === 0) chord.forEach((f) => this.note(f, t, eighth * 8.2, 'triangle', 0.05, 0.4));
      if (step === 0 || step === 4) this.note(chord[0] / 2, t, eighth * 3, 'sine', 0.09, 0.02);
      if (step % 2 === 1) this.hissAt(t, 0.04, 6000, 0.012);
      if (Math.random() < (step % 2 ? 0.18 : 0.32) * this.mood.melody) this.note(scale[Math.floor(Math.random() * scale.length)], t, 0.6, 'sine', 0.035);
      if (this.bloom >= 1 && step % 2 === 0) this.note(chord[(step / 2 + 1) % 4] * 2, t, 0.5, 'triangle', 0.022);
      if (this.bloom >= 2 && step === 0) this.note(chord[3] * 4, t, 2.2, 'sine', 0.018, 0.02);
      this.nextBeat += eighth;
      this.beat += 1;
    }
  }

  private hissAt(at: number, dur: number, freq: number, gain: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(filter).connect(g).connect(this.musicGain!);
    src.start(at, Math.random() * 0.3); src.stop(at + dur + 0.02);
  }

  private bloomBefore: number | null = null;

  /** A cutscene's music: warm (every layer), soft (the plain loop) or off (a real silence); null hands it back to play. */
  sceneMusic(m: 'warm' | 'soft' | 'off' | null) {
    if (m === null) {
      if (this.bloomBefore !== null) { this.bloom = this.bloomBefore; this.bloomBefore = null; }
      this.startMusic(); return;
    }
    if (this.bloomBefore === null) this.bloomBefore = this.bloom;
    if (m === 'off') { this.stopMusic(); return; }
    this.bloom = m === 'warm' ? 2 : 0;
    this.startMusic();
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
      case 'fwip': this.hiss(0, 0.06, 2600 * lift, 2, 0.1); this.tone(500, 0, 0.06, 'sine', 0.05, 1400); break;
      case 'combo': [784, 988, 1175].forEach((f, i) => this.tone(f, i * 0.06, 0.18, 'square', 0.035)); break;
      case 'coin': this.tone(1320, 0, 0.08, 'square', 0.04); this.tone(1760, 0.07, 0.12, 'square', 0.04); break;
      case 'sparkle': {
        // A spot cleared: a note climbing a pentatonic scale as the place gets tidier (never a sour
        // note, whatever the order), with the old shimmer on top. Finishing a room plays a little tune.
        const note = PENTATONIC[Math.min(PENTATONIC.length - 1, Math.floor(level * PENTATONIC.length))];
        this.tone(note, 0, 0.16, 'triangle', 0.07);
        [0, 0.05, 0.1].forEach((s, i) => this.tone(2093 * Math.pow(2, i / 6), s + 0.02, 0.12, 'sine', 0.035));
        break;
      }
      case 'chime': [523, 659, 784].forEach((f, i) => this.tone(f * lift, i * 0.08, 0.5, 'triangle', 0.14)); break;
      case 'fanfare': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.1, 0.6, 'triangle', 0.15)); this.play('sparkle'); break;
      case 'step': this.hiss(0, 0.05, 520, 1.1, 0.05); break;
      case 'yawn': this.tone(540, 0, 0.75, 'sine', 0.07, 250); break;
      case 'snore': this.tone(150, 0, 0.7, 'sine', 0.045, 110); break;
      // The town's old song: three notes, then a fourth (Juniper finds it in autumn).
      case 'hum': [392, 440, 523, 659].forEach((f, i) => this.tone(f, i * 0.38 + (i === 3 ? 0.2 : 0), 0.42, 'triangle', 0.07)); break;
      case 'drip': this.tone(1400, 0, 0.08, 'sine', 0.07, 700); this.tone(880, 0.1, 0.18, 'sine', 0.025, 620); break;
      case 'whoosh': this.hiss(0, 1.5, 420, 0.5, 0.11); this.tone(320, 0, 1.5, 'sine', 0.05, 70); break;
      case 'wind': this.hiss(0, 2.6, 700, 0.4, 0.06); break;
      case 'wake': this.tone(660, 0, 0.14, 'square', 0.045, 1320); break;
      case 'shimmer': [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, i * 0.07, 0.35, 'triangle', 0.045)); break;
    }
  }
}
