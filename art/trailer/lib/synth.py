"""Shared sound kit for the trailer scores: oscillators, instruments, effects, a reverb and a stereo mixer.
A score script builds a Mix, adds sounds at times in seconds, then calls write('audio.wav')."""
import wave
import numpy as np

SR = 44100
rs = np.random.default_rng(7)


def hz(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR


def env(n, a=.005, d=.1, s=.6, r=.08):
    e = np.ones(n) * s; ai, di, ri = int(a * SR), int(d * SR), min(int(r * SR), n)
    e[:ai] = np.linspace(0, 1, ai) if ai else 1
    e[ai:ai + di] = np.linspace(1, s, len(e[ai:ai + di]))
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e


def smooth(x, k):
    """Cheap lowpass: moving average over k samples."""
    return np.convolve(x, np.ones(k) / k, 'same') if k > 1 else x


def noise(d, decay=0.):
    x = tt(d); return rs.uniform(-1, 1, len(x)) * np.exp(-x * decay)


def osc(kind, f, dur, **e):
    x = tt(dur); ph = (f * x) % 1
    w = {'sq': np.where(ph < .3, 1., -1.) * .5, 'tri': 1 - 4 * np.abs(ph - .5), 'saw': 2 * ph - 1}.get(kind, np.sin(2 * np.pi * f * x))
    return w * env(len(x), **e)


def sweep(f0, f1, d, curve=2.):
    x = tt(d); return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * (x / d) ** curve) / SR)


# ---- instruments ----
def bell(f, d=1.2):
    x = tt(d)
    return (np.sin(2 * np.pi * f * x) + .45 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 5)
            + .2 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x * 8)) * np.exp(-x * 2.8) * np.minimum(1, x * 600)


def musicbox(f, d=1.4):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + .3 * np.sin(2 * np.pi * f * 4 * x) * np.exp(-x * 8)) * np.exp(-x * 3.5) * np.minimum(1, x * 400)


def pluck(f, d=.4, bright=.3):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + bright * np.sin(4 * np.pi * f * x)) * np.exp(-x * 9) * np.minimum(1, x * 800)


def piano(f, d=1.6):
    x = tt(d); h = sum(a * np.sin(2 * np.pi * f * k * x) * np.exp(-x * (2 + k)) for k, a in ((1, 1), (2, .5), (3, .25), (4, .12)))
    return h * np.minimum(1, x * 900) * np.exp(-x * 1.2)


def pad(f, d, a=.5, r=.6, k=40):
    """Detuned saws, softened: a warm string pad."""
    x = tt(d); w = sum(2 * ((f * (1 + dt) * x + ph) % 1) - 1 for dt, ph in ((-.004, 0), (0, .3), (.005, .6))) / 3
    return smooth(w, k) * env(len(x), a=a, d=.2, s=.9, r=r)


def bass(f, d=.25): return osc('tri', f, d, a=.003, d=.1, s=.5, r=.05)


# ---- drums ----
def kick(power=1.):
    x = tt(.4); return np.sin(2 * np.pi * np.cumsum(115 * np.exp(-x * 24) + 42) / SR) * np.exp(-x * 7 / power)


def snap(d=.12):
    n = noise(d, 40); return n - smooth(n, 4)


def hat(): n = noise(.05, 90); return (n - smooth(n, 3)) * .6


def boom(d=2.5):
    x = tt(d); return np.sin(2 * np.pi * np.cumsum(70 * np.exp(-x * 3) + 32) / SR) * np.exp(-x * 1.5) + smooth(noise(d, 2.5), 60) * 1.5


def cymbal(d=2.0):
    n = noise(d, 1.8); return (n - smooth(n, 3)) * .5


# ---- effects ----
def pop(p=1.):
    x = tt(.13); f = (950 * np.exp(-x * 32) + 280) * p
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 24) * np.minimum(1, x * 2000) + noise(.13, 45) * .2


def whoosh(d=.5, k=25):
    x = tt(d); return smooth(rs.uniform(-1, 1, len(x)), k) * np.sin(np.pi * x / d) ** 2 * 3


def swell(d=2.):
    x = tt(d); n = rs.uniform(-1, 1, len(x)); return (n - smooth(n, 5)) * (x / d) ** 3 * .6


def riser(d, f0=200, f1=1800): x = tt(d); return sweep(f0, f1, d) * (x / d) ** 2 * .4 + swell(d) * .8


def brush(d=.3, k=3):
    """A bristle stroke: bright noise with a soft rise and fall."""
    x = tt(d); n = rs.uniform(-1, 1, len(x)); n = n - smooth(n, k); return n * np.sin(np.pi * x / d) ** 1.5 * (.6 + .4 * np.sin(x * 60))


def boing(d=.5):
    x = tt(d); return np.sin(2 * np.pi * np.cumsum(300 + 220 * np.sin(2 * np.pi * 8 * x) * np.exp(-x * 4) + 200 * x) / SR) * np.exp(-x * 5)


class Mix:
    def __init__(self, dur, loop=False):
        self.dur, self.loop = dur, loop
        n = int(SR * dur * (2 if loop else 1))
        self.dry = np.zeros((n, 2)); self.wet = np.zeros((n, 2))

    def add(self, t, sig, g=1., pan=0., rev=.25):
        starts = (t, t + self.dur) if self.loop else (t,)
        n = len(self.dry)
        for t0 in starts:
            i = int(t0 * SR)
            if i >= n or i < 0: continue
            s = sig[:n - i]
            for bus, k in ((self.dry, 1 - rev * .4), (self.wet, rev)):
                bus[i:i + len(s), 0] += s * g * k * np.sqrt((1 - pan) / 2) * 1.41
                bus[i:i + len(s), 1] += s * g * k * np.sqrt((1 + pan) / 2) * 1.41

    def sparkle(self, t, base=84, n=6, g=.06):
        for i in range(n): self.add(t + i * .045, bell(hz(base + [0, 4, 7, 12, 16, 19, 24][i % 7]), .8), g, rs.uniform(-.7, .7), .6)

    def write(self, path, fade_in=.05, fade_out=.4, room=2.2):
        ir_t = tt(room); ir = rs.uniform(-1, 1, (len(ir_t), 2)) * np.exp(-ir_t * 3)[:, None]
        ir = np.stack([smooth(ir[:, 0], 6), smooth(ir[:, 1], 6)], 1); ir /= np.abs(ir).sum(0) ** .5 * 6
        n = len(self.dry); L = 1 << int(np.ceil(np.log2(n + len(ir_t))))
        rev = np.stack([np.fft.irfft(np.fft.rfft(self.wet[:, c], L) * np.fft.rfft(ir[:, c], L), L)[:n] for c in range(2)], 1)
        mix = self.dry + rev
        if self.loop: mix = mix[n // 2:]          # second pass: tails from the end wrap round to the start
        else:
            m = len(mix); f = np.ones(m)
            f[:int(fade_in * SR)] = np.linspace(0, 1, int(fade_in * SR)); f[m - int(fade_out * SR):] = np.linspace(1, 0, int(fade_out * SR))
            mix *= f[:, None]
        mix /= np.percentile(np.abs(mix), 99.97)
        mix = np.tanh(mix * 1.1) / np.tanh(1.1) * .92
        with wave.open(path, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
