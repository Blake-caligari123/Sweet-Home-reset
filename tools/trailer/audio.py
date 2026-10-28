"""Chiptune score + SFX for the Sweet Home Reset alpha trailer (all synthesized, original).

python3 audio.py music h|v out.wav       -> music bed only (for the TikTok sound too)
python3 audio.py mix h|v out.wav sfx1.json:offset ...  -> music + sfx
"""
import json, sys, wave
import numpy as np

SR = 44100
BPM = 140
B = 60 / BPM
rng = np.random.default_rng(3)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.004, d=0.08, s=0.6, r=0.05, hold=None):
    t = np.arange(n) / SR
    hold = (n / SR - r) if hold is None else hold
    e = np.where(t < a, t / max(a, 1e-6), 1.0)
    dec = s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6))
    e = np.where(t >= a, dec, e)
    rel = np.clip((t - hold) / max(r, 1e-6), 0, 1)
    return e * (1 - rel)


def square(f, n, duty=0.5, vib=0.0, slide=None):
    t = np.arange(n) / SR
    ff = np.full(n, f, dtype=float) if slide is None else np.geomspace(f, slide, n)
    if vib:
        ff = ff * (1 + vib * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.15 - 1, 0, 1))
    ph = np.cumsum(ff) / SR
    return np.where((ph % 1) < duty, 1.0, -1.0)


def tri(f, n, slide=None):
    ff = np.full(n, f, dtype=float) if slide is None else np.geomspace(f, slide, n)
    ph = np.cumsum(ff) / SR
    return 2 * np.abs(2 * (ph % 1) - 1) - 1


def noise(n):
    return rng.uniform(-1, 1, n)


def lp(x, cut):
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):  # small buffers only
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def lp_fast(x, cut):
    # one-pole lowpass via lfilter-like vectorised trick (scipy-free): use FFT brick + gentle slope
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cut) ** 4)
    return np.fft.irfft(X, len(x))


def hp_fast(x, cut):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (f / cut) ** 2 / np.sqrt(1 + (f / cut) ** 4)
    return np.fft.irfft(X, len(x))


class Bus:
    def __init__(self, seconds):
        self.n = int(seconds * SR) + SR
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)

    def add(self, t, sig, g=1.0, pan=0.5):
        i = int(round(t * SR))
        if i < 0:
            sig = sig[-i:]
            i = 0
        j = min(self.n, i + len(sig))
        if j <= i:
            return
        self.L[i:j] += sig[: j - i] * g * np.sqrt(1 - pan)
        self.R[i:j] += sig[: j - i] * g * np.sqrt(pan)


# ---- instruments
def lead(m, dur, duty=0.25, g=1.0):
    n = int(dur * SR)
    return square(hz(m), n, duty, vib=0.012) * env(n, d=0.12, s=0.55, r=0.04) * 0.16 * g


def arp_note(m, dur):
    n = int(dur * SR)
    return square(hz(m), n, 0.125) * env(n, d=0.05, s=0.0, r=0.01) * 0.07


def bass(m, dur):
    n = int(dur * SR)
    return tri(hz(m), n) * env(n, d=0.2, s=0.7, r=0.03) * 0.32


def kick():
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    return tri(1, n, None) * 0 + np.sin(2 * np.pi * np.cumsum(55 + 180 * np.exp(-t * 40)) / SR) * np.exp(-t * 22) * 0.55


def snare(g=1.0):
    n = int(0.14 * SR)
    t = np.arange(n) / SR
    s = noise(n) * np.exp(-t * 28) * 0.28 + square(200, n) * np.exp(-t * 50) * 0.08
    return s * g


def hat(g=1.0):
    n = int(0.04 * SR)
    t = np.arange(n) / SR
    return hp_fast(noise(n), 6000) * np.exp(-t * 120) * 0.12 * g


def bell(m, dur=1.2, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.0 * f * t) * np.exp(-t * 7) + 0.15 * tri(f * 3, n) * np.exp(-t * 12)
    return s * np.exp(-t * 3.2) * np.minimum(1, t * 600) * 0.12 * g


# ---- score
C, G, Am, F = [60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]
PROG = [C, G, Am, F]
MEL = [  # 8ths per bar, None = rest
    [76, 79, 84, 79, 81, 79, 76, 72],
    [74, 76, 79, 76, 74, 72, 74, None],
    [76, 79, 84, 86, 88, 86, 84, 81],
    [79, None, 76, None, 72, 74, 76, None],
]
MEL2 = [
    [84, None, 83, 84, 86, 84, 79, None],
    [83, None, 81, 83, 84, 83, 79, None],
    [81, 84, 88, 84, 86, 84, 81, 79],
    [77, 79, 81, 84, 83, None, 79, None],
]


def bar_chord(bar):
    return PROG[bar % 4]


def play_full(bus, t0, beats, lead_on=True, drums=True, arps=True, variant=0, g=1.0):
    bars = int(np.ceil(beats / 4))
    for b in range(bars):
        tb = t0 + b * 4 * B
        ch = bar_chord(b)
        root = ch[0] - 24
        for k in range(8):
            t = tb + k * B / 2
            if (t - t0) >= beats * B - 1e-6:
                break
            bus.add(t, bass(root + (12 if k % 2 else 0), B / 2 * 0.9), g)
            if drums:
                if k in (0, 4, 5):
                    bus.add(t, kick(), g)
                if k in (2, 6):
                    bus.add(t, snare(), g, 0.55)
                bus.add(t, hat(1.0 if k % 2 else 0.6), g, 0.65)
            if arps:
                for q in range(2):
                    tq = t + q * B / 4
                    bus.add(tq, arp_note(ch[(k * 2 + q) % 3] + 24, B / 4), g, 0.3 if q else 0.7)
            if lead_on:
                mel = (MEL2 if (variant + b // 4) % 2 else MEL)[b % 4]
                m = mel[k]
                if m is not None:
                    # sustain until next note
                    L = 1
                    while k + L < 8 and mel[k + L] is None:
                        L += 1
                    bus.add(t, lead(m, B / 2 * L * 0.95), g, 0.5)


def play_beat_only(bus, t0, beats, g=1.0):
    play_full(bus, t0, beats, lead_on=False, arps=False, g=g)


def play_intro(bus, t0, beats, g=1.0):
    # music-box twinkles over C Am F G, quarter notes
    seq = [C, Am, F, G]
    for k in range(int(beats * 2)):
        t = t0 + k * B / 2
        ch = seq[(k // 8) % 4]
        m = [ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[1] + 24][k % 4]
        bus.add(t, bell(m, 1.4, 0.8 * g), 1.0, 0.35 if k % 2 else 0.65)
        if k % 8 == 0:
            bus.add(t, bell(ch[0] + 12, 2.5, 0.9 * g))


def play_lullaby(bus, t0, beats, g=1.0):
    # half-time: bells + soft triangle melody (quarter notes of MEL)
    flat = [m for bar in MEL for m in bar]
    for k in range(int(beats)):
        t = t0 + k * B
        ch = bar_chord(k // 4)
        if k % 2 == 0:
            bus.add(t, bell(ch[0] + 12, 2.0, 0.8 * g))
        m = flat[(k * 2) % len(flat)]
        if m is not None:
            n = int(B * 0.95 * SR)
            bus.add(t, tri(hz(m), n) * env(n, d=0.3, s=0.5, r=0.08) * 0.16 * g)
        bus.add(t + B / 2, bell(ch[(k + 1) % 3] + 24, 1.0, 0.45 * g), 1.0, 0.7)


def play_build(bus, t0, beats, g=1.0):
    # snare roll that speeds up + rising square + noise sweep
    total = beats * B
    t = 0.0
    while t < total - 0.02:
        k = t / total
        step = B / 2 if k < 0.35 else B / 4 if k < 0.7 else B / 8
        bus.add(t0 + t, snare(0.5 + 0.8 * k), g, 0.5)
        t += step
    n = int(total * SR)
    tt = np.arange(n) / SR
    rise = square(hz(60), n, 0.25, slide=hz(84)) * (tt / total) ** 1.5 * 0.08
    sweep = hp_fast(noise(n), 2000) * (tt / total) ** 2 * 0.12
    bus.add(t0, rise + sweep, g)
    play_full(bus, t0, beats, lead_on=False, drums=False, arps=True, g=0.6 * g)
    for b in range(int(beats)):
        bus.add(t0 + b * B, kick(), g)


def play_logo(bus, t0, beats, g=1.0):
    play_full(bus, t0, max(0, beats - 2), variant=1, g=g)
    # final chord: big arp up + sustained lead chord
    tf = t0 + (beats - 2) * B
    notes = [60, 64, 67, 72, 76, 79, 84]
    for i, m in enumerate(notes):
        bus.add(tf + i * 0.035, arp_note(m + 12, 0.25) * 2.0, g)
    for m in [72, 76, 79, 84]:
        n = int(1.6 * SR)
        bus.add(tf, square(hz(m), n, 0.25, vib=0.01) * env(n, d=0.4, s=0.5, r=0.6, hold=0.8) * 0.07 * g)
    bus.add(tf, kick() * 1.2, g)
    bus.add(tf, bell(48, 2.5, 1.2 * g))


# section maps: (shot, beats, style)
MAP = {
    'h': [('open', 9, 'intro'), ('sneeze', 3, 'stopsoft'), ('bubble', 4, 'quiet'), ('duster', 4, 'beat'), ('rhythm', 6, 'beat'),
          ('items', 4, 'full0'), ('crumble', 4, 'build'), ('drop', 6, 'full1'), ('yard', 4, 'full0'), ('square', 2, 'full0'),
          ('bakery', 4, 'full0'), ('beforeafter', 4, 'full1'), ('fountain', 4, 'full1'), ('neighbours', 6, 'full0'),
          ('night', 8, 'lullaby'), ('logo', 6, 'logo'), ('stinger', 5, 'silence')],
    'v': [('sneeze', 3, 'stab'), ('bubble', 3, 'quiet'), ('rhythm', 6, 'beat'), ('crumble', 3, 'build'), ('drop', 5, 'full1'),
          ('yard', 2, 'full0'), ('bakery', 3, 'full0'), ('beforeafter', 4, 'full1'), ('fountain', 3, 'full1'),
          ('logo', 4, 'logo'), ('stinger', 3, 'silence')],
}


def score(fmt):
    secs = sum(b for _, b, _ in MAP[fmt]) * B
    bus = Bus(secs)
    t = 0.0
    # a continuous "full" section counter so the melody keeps moving through the montage
    fullpos = 0
    for shot, beats, style in MAP[fmt]:
        if style == 'intro':
            play_intro(bus, t, beats)
        elif style == 'quiet':
            for k in range(int(beats)):
                bus.add(t + k * B, bell(72 + [0, 4, 7, 4][k % 4], 0.8, 0.35))
        elif style == 'stab':
            bus.add(t, kick() * 1.3)
            for m in [60, 64, 67, 72]:
                bus.add(t, arp_note(m + 12, 0.3) * 2.5)
        elif style == 'beat':
            play_beat_only(bus, t, beats)
        elif style.startswith('full'):
            play_full(bus, t, beats, variant=int(style[-1]))
            if style == 'full1':
                bus.add(t, kick() * 1.3)
        elif style == 'build':
            play_build(bus, t, beats)
        elif style == 'lullaby':
            play_lullaby(bus, t, beats)
        elif style == 'logo':
            play_logo(bus, t, beats)
        t += beats * B
    return bus, secs


# ---- SFX
def sfx(name, o):
    p = o.get('pitch', 1.0)
    g = o.get('gain', 1.0)
    if name == 'notif':
        out = np.zeros(int(0.5 * SR))
        for i, m in enumerate([88, 95]):
            n = int(0.22 * SR); t = np.arange(n) / SR
            s = (np.sin(2 * np.pi * hz(m) * t) + 0.3 * np.sin(2 * np.pi * hz(m + 12) * t)) * np.exp(-t * 14) * 0.35
            k = int(i * 0.11 * SR); out[k:k + n] += s
        return out * g, 0
    if name == 'doorbell':
        out = np.zeros(int(1.6 * SR))
        for i, m in enumerate([76, 72]):
            n = int(1.0 * SR); t = np.arange(n) / SR
            s = (np.sin(2 * np.pi * hz(m) * t) + 0.4 * np.sin(2 * np.pi * hz(m) * 2.76 * t) * np.exp(-t * 5)) * np.exp(-t * 3) * 0.4
            k = int(i * 0.45 * SR); out[k:k + n] += s
        return out * g, 0
    if name == 'swish':
        n = int(0.32 * SR); t = np.arange(n) / SR
        e = np.sin(np.pi * t / 0.32) ** 1.5
        s = hp_fast(lp_fast(noise(n), 7000), 1500) * e * 0.3
        return s * g, 0.05
    if name == 'pop':
        n = int(0.12 * SR); t = np.arange(n) / SR
        s = square(hz(84) * p, n, 0.5, slide=hz(96) * p) * np.exp(-t * 30) * 0.18
        s += np.sin(2 * np.pi * np.cumsum(900 * p * np.exp(-t * 20) + 300) / SR) * np.exp(-t * 25) * 0.25
        return s * g, 0
    if name == 'sparkle':
        out = np.zeros(int(0.5 * SR))
        for i, m in enumerate([96, 100, 103, 108]):
            n = int(0.25 * SR); s = square(hz(m), n, 0.125) * env(n, d=0.05, s=0, r=0.01) * 0.06
            out[int(i * 0.04 * SR):int(i * 0.04 * SR) + n] += s
        return out * g, 0
    if name == 'blip':
        n = int(0.035 * SR)
        return square(hz(79) * p, n, 0.25) * env(n, d=0.02, s=0.2, r=0.005) * 0.08 * g, 0
    if name == 'boing':
        n = int(0.32 * SR); t = np.arange(n) / SR
        f = hz(60) * p * (1 + 1.2 * (1 - np.exp(-t * 12)) + 0.15 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 6))
        return np.where((np.cumsum(f) / SR) % 1 < 0.5, 1, -1) * np.exp(-t * 7) * 0.12 * g, 0
    if name == 'impact':
        n = int(0.6 * SR); t = np.arange(n) / SR
        s = np.sin(2 * np.pi * np.cumsum(40 + 200 * np.exp(-t * 18)) / SR) * np.exp(-t * 6) * 0.7
        s += lp_fast(noise(n), 1800) * np.exp(-t * 10) * 0.5
        return s * g, 0
    if name == 'sweep':
        n = int(1.4 * SR); t = np.arange(n) / SR
        s = np.zeros(n)
        for i in range(28):
            m = 84 + (i * 3) % 24
            k = int(i * 0.045 * SR); L = int(0.18 * SR)
            if k + L < n:
                s[k:k + L] += square(hz(m), L, 0.125) * env(L, d=0.05, s=0, r=0.01) * 0.05
        return s * g, 0
    if name == 'sneeze':
        pre = o.get('pre', 0.5)
        parts = []
        if pre > 0:
            # "ah... ah..." two rising squeaky vowels
            for i, (f0, f1, d) in enumerate([(hz(72), hz(76), 0.18), (hz(76), hz(81), 0.22)]):
                n = int(d * SR); t = np.arange(n) / SR
                v = square(f0, n, 0.3, slide=f1, vib=0.02) * env(n, a=0.02, d=0.1, s=0.7, r=0.04) * 0.12
                parts.append((i * 0.24, v))
        n = int(0.45 * SR); t = np.arange(n) / SR
        choo = (lp_fast(noise(n), 5000) * np.exp(-t * 7) * 0.6 + square(hz(88), n, 0.5, slide=hz(64)) * np.exp(-t * 12) * 0.12)
        total = np.zeros(int((pre + 0.5) * SR))
        for off, v in parts:
            k = int(off * SR); total[k:k + len(v)] += v
        k = int(pre * SR); total[k:k + n] += choo
        return total * g, pre
    if name == 'ahah':
        s, _ = sfx('sneeze', {'pre': 0.55})
        return s[: int(0.55 * SR)], 0
    if name == 'scratch':
        n = int(0.35 * SR); t = np.arange(n) / SR
        f = 400 * (1 + 0.8 * np.sin(2 * np.pi * 9 * t)) * np.exp(-t * 3)
        s = lp_fast(noise(n), 3000) * 0.3 * np.abs(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 4)
        return s * g, -o.get('at', 0)
    if name == 'creak':
        n = int(1.2 * SR); t = np.arange(n) / SR
        f = 180 + 120 * np.sin(2 * np.pi * 0.7 * t)
        s = np.where((np.cumsum(f) / SR) % 1 < 0.15, 1.0, -1.0) * 0.05 * (np.sin(np.pi * t / 1.2))
        return lp_fast(s, 2500) * g, 0
    if name == 'jingle':
        out = np.zeros(int(0.7 * SR))
        for i, m in enumerate([84, 88, 91, 96]):
            n = int(0.3 * SR); s = square(hz(m), n, 0.25) * env(n, d=0.1, s=0.1, r=0.02) * 0.07
            out[int(i * 0.07 * SR):int(i * 0.07 * SR) + n] += s
        return out * g, 0
    if name in ('whoosh', 'swoosh'):
        n = int(0.4 * SR); t = np.arange(n) / SR
        e = np.sin(np.pi * t / 0.4) ** 2
        s = lp_fast(noise(n), 3500 if name == 'whoosh' else 6000) * e * 0.35
        return s * g, 0.2
    if name == 'water':
        out = np.zeros(int(1.4 * SR))
        for i in range(16):
            m = 84 + [0, 4, 7, 12, 16, 19, 24, 19][i % 8]
            n = int(0.2 * SR); s = tri(hz(m), n) * env(n, d=0.06, s=0, r=0.01) * 0.12
            k = int(i * 0.06 * SR); out[k:k + n] += s
        n = int(1.0 * SR); t = np.arange(n) / SR
        out[:n] += hp_fast(noise(n), 3000) * np.exp(-t * 3) * 0.12
        return out * g, 0
    if name == 'flip':
        n = int(0.09 * SR); t = np.arange(n) / SR
        return square(hz(72) * p, n, 0.5, slide=hz(84) * p) * np.exp(-t * 25) * 0.1 * g, 0
    if name == 'yawn':
        n = int(1.0 * SR); t = np.arange(n) / SR
        return square(hz(67), n, 0.4, slide=hz(55), vib=0.03) * env(n, a=0.15, d=0.4, s=0.6, r=0.3) * 0.07 * g, 0
    if name == 'burst':
        a, _ = sfx('sparkle', {}); b, _ = sfx('impact', {'gain': 0.6})
        out = np.zeros(max(len(a), len(b))); out[:len(a)] += a * 2; out[:len(b)] += b
        return out * g, 0
    if name == 'land':
        n = int(0.18 * SR); t = np.arange(n) / SR
        return np.sin(2 * np.pi * np.cumsum(90 + 200 * np.exp(-t * 30)) / SR) * np.exp(-t * 20) * 0.45 * g, 0
    if name == 'bonk':
        n = int(0.5 * SR); t = np.arange(n) / SR
        return (tri(hz(48), n) * np.exp(-t * 6) * 0.35 + square(hz(36), n, 0.5) * np.exp(-t * 14) * 0.06) * g, 0
    raise KeyError(name)


def write(path, L, R):
    st = np.stack([L, R], 1)
    rms = np.sqrt(np.mean(st ** 2)) or 1
    st = st / rms * 0.11  # loudness target, then soft-limit the peaks
    st = np.tanh(st * 1.6) / np.tanh(1.6) * 0.92
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype('<i2').tobytes())


def master(bus, secs):
    L, R = bus.L, bus.R
    # light echo for space
    for dly, g in ((0.214, 0.18), (0.428, 0.09)):
        k = int(dly * SR)
        L[k:] += R[:-k] * g
        R[k:] += L[:-k] * g
    n = int(secs * SR)
    return L[:n], R[:n]


if __name__ == '__main__':
    mode, fmt, out = sys.argv[1], sys.argv[2], sys.argv[3]
    bus, secs = score(fmt)
    if mode == 'mix':
        offs = {}
        t = 0.0
        for shot, beats, _ in MAP[fmt]:
            offs[shot] = t
            t += beats * B
        for spec in sys.argv[4:]:
            path, shot = spec.split(':')
            data = json.load(open(path))
            for e in data['sfx']:
                s, pre = sfx(e['name'], e)
                bus.add(offs[shot] + e['t'] - pre, s * 1.6, 1.0, 0.5)
    L, R = master(bus, secs)
    write(out, L, R)
    print(out, round(secs, 3))
