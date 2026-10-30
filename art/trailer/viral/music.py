"""Loopable 16 s soundtrack for short.html: a soft 120 bpm beat, rising pops on every tap, a chime on each colour flood.
Rendered twice over and the second pass kept, so tails wrap round and the loop is seamless."""
import numpy as np, wave
SR, LOOP = 44100, 16.0
N = int(SR * LOOP * 2)
mix = np.zeros((N, 2)); rs = np.random.default_rng(11)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def add(t, sig, g=1., pan=0.):
    for t0 in (t, t + LOOP):
        i = int(t0 * SR); s = sig[:max(0, N - i)]
        mix[i:i + len(s), 0] += s * g * np.sqrt((1 - pan) / 2) * 1.41
        mix[i:i + len(s), 1] += s * g * np.sqrt((1 + pan) / 2) * 1.41
def bell(f, d=1.0):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + .4 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 6)) * np.exp(-x * 3.5) * np.minimum(1, x * 600)
def pluck(f, d=.35):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + .3 * np.sin(4 * np.pi * f * x)) * np.exp(-x * 9) * np.minimum(1, x * 800)
def pop(p=1.):
    x = tt(.12); f = (1000 * np.exp(-x * 34) + 300) * p
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 26) * np.minimum(1, x * 2000)
def brush(d=.16):
    x = tt(d); n = rs.uniform(-1, 1, len(x)); n = n - np.convolve(n, np.ones(6) / 6, 'same'); return n * np.sin(np.pi * x / d) ** 2 * .5
def kick():
    x = tt(.35); return np.sin(2 * np.pi * np.cumsum(110 * np.exp(-x * 25) + 45) / SR) * np.exp(-x * 9)
def snap():
    x = tt(.12); n = rs.uniform(-1, 1, len(x)); return (n - np.convolve(n, np.ones(4) / 4, 'same')) * np.exp(-x * 40)
def whoosh(d=.45):
    x = tt(d); n = np.convolve(rs.uniform(-1, 1, len(x)), np.ones(30) / 30, 'same'); return n * np.sin(np.pi * x / d) ** 2 * 3

# soft lo-fi bed: F – Dm – Bb – C, one chord per bar, 8 bars = 16 s
CH = [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 59]]
for bar in range(8):
    t0 = bar * 2.0; ch = CH[bar % 4]
    for i, m in enumerate(ch): add(t0 + i * .03, bell(hz(m + 12), 2.0), .05, (i - 1.5) * .3)
    add(t0, pluck(hz(ch[0] - 12), 1.0), .25); add(t0 + 1.0, pluck(hz(ch[0] - 12), .8), .18); add(t0 + 1.5, pluck(hz(ch[2] - 12), .5), .12)
    for b in range(4):
        tb = t0 + b * .5
        if b in (0, 2): add(tb, kick(), .35)
        if b in (1, 3): add(tb, snap(), .12, .15)
        add(tb + .25, snap() * .4, .06, -.3)

# taps: pops climb a pentatonic scale as the combo grows, with a brush swish
TAPS = []; t, gap = .12, .56
for i in range(14): TAPS.append(t); t += gap; gap = max(.27, gap * .9)
FLOOD = TAPS[13] + .42
PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98, 100, 103]
for room in (0, 8):
    for i, tp in enumerate(TAPS):
        T = room + tp
        add(T - .05, brush(), .25, rs.uniform(-.3, .3))
        if room == 8 and i == 7:   # the Grumble cheers up: a boing
            x = tt(.5); add(T, np.sin(2 * np.pi * np.cumsum(300 + 220 * np.sin(2 * np.pi * 8 * x) * np.exp(-x * 4) + 200 * x) / SR) * np.exp(-x * 5), .25)
        add(T, pop(1 + i * .05), .35, rs.uniform(-.4, .4))
        add(T + .01, bell(hz(PENTA[i]), .7), .12, rs.uniform(-.5, .5))
    F = room + FLOOD
    add(F, kick(), .5)
    for i, m in enumerate([77, 81, 84, 89, 93, 96]): add(F + i * .045, bell(hz(m), 1.6), .11, (i - 2.5) * .25)
    x = tt(.8); add(F, np.convolve(rs.uniform(-1, 1, len(x)), np.ones(8) / 8, 'same') * np.exp(-x * 5) * 1.5, .15)
    for k in range(4): add(F + .45 * (k + 1), pop(1.4 + k * .1), .12, (k - 1.5) * .3)
    add(room + 7.5, whoosh(.5), .3)

out = mix[int(LOOP * SR):]
out /= np.abs(out).max() / .9
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print('ok')
