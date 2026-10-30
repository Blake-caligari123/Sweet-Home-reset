"""Synthesise the cinematic trailer score and sound effects (audio.wav), timed to trailer.html."""
import numpy as np, wave

SR, DUR = 44100, 55.0
N = int(SR * DUR)
dry = np.zeros((N, 2)); wet = np.zeros((N, 2))
rs = np.random.default_rng(7)

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=.005, d=.1, s=.6, r=.08):
    e = np.ones(n) * s; ai, di, ri = int(a * SR), int(d * SR), min(int(r * SR), n)
    e[:ai] = np.linspace(0, 1, ai) if ai else 1
    e[ai:ai + di] = np.linspace(1, s, len(e[ai:ai + di]))
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e
def add(t, sig, g=1., pan=0., rev=.3):
    i = int(t * SR); sig = sig[:max(0, N - i)]
    for bus, k in ((dry, 1 - rev * .5), (wet, rev)):
        bus[i:i + len(sig), 0] += sig * g * k * np.sqrt((1 - pan) / 2) * 1.41
        bus[i:i + len(sig), 1] += sig * g * k * np.sqrt((1 + pan) / 2) * 1.41
def osc(kind, f, dur, **e):
    x = tt(dur); ph = (f * x) % 1
    w = {'sq': np.where(ph < .3, 1., -1.) * .5, 'tri': 1 - 4 * np.abs(ph - .5), 'saw': 2 * ph - 1}.get(kind, np.sin(2 * np.pi * f * x))
    return w * env(len(x), **e)
def bell(f, d=1.6):
    x = tt(d)
    return (np.sin(2 * np.pi * f * x) + .45 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 5) + .2 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x * 8)) * np.exp(-x * 2.6)
def musicbox(f, d=1.4):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + .3 * np.sin(2 * np.pi * f * 4 * x) * np.exp(-x * 8)) * np.exp(-x * 3.5) * np.minimum(1, x * 400)
def lowpass(x, a):
    # one-pole lowpass, vectorised via an IIR filter in chunks
    from itertools import accumulate
    return np.fromiter(accumulate(x, lambda acc, v: acc + a * (v - acc)), float, len(x))
def noise(d, decay=30.):
    x = tt(d); return rs.uniform(-1, 1, len(x)) * np.exp(-x * decay)
def strings(f, d, a=.6, r=.8, bright=.12):
    # detuned saws through a lowpass: a soft string-ish pad
    x = tt(d); w = sum(2 * ((f * (1 + dt) * x + ph) % 1) - 1 for dt, ph in ((-.004, 0), (0, .3), (.005, .6))) / 3
    return lowpass(w, bright) * env(len(x), a=a, d=.2, s=.9, r=r)
def kick(power=1.):
    x = tt(.5); f = 120 * np.exp(-x * 22) + 40
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 6 / power)
def boom():
    x = tt(3.0); f = 70 * np.exp(-x * 3) + 32
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.4) + lowpass(noise(3.0, 2.5), .05) * 1.5
def tom(f=110):
    x = tt(.6); return np.sin(2 * np.pi * np.cumsum(f * (1 + .6 * np.exp(-x * 20))) / SR) * np.exp(-x * 7)
def cymbal(d=2.5):
    x = tt(d); n = rs.uniform(-1, 1, len(x)); return (n - lowpass(n, .3)) * np.exp(-x * 1.6) * .5
def swell(d=2.0):
    x = tt(d); n = rs.uniform(-1, 1, len(x)); return (n - lowpass(n, .2)) * (x / d) ** 3 * .6
def whoosh(d=.6):
    x = tt(d); return lowpass(rs.uniform(-1, 1, len(x)), .12) * np.sin(np.pi * x / d) ** 2
def riser(d, f0=200, f1=1600):
    x = tt(d); return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * (x / d) ** 2) / SR) * (x / d) ** 2 * .4 + swell(d) * .8
def pop(p=1.):
    x = tt(.14); f = (900 * np.exp(-x * 30) + 260) * p
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 22) + noise(.14, 40) * .3
def sparkle(t, base=84, n=6, g=.06):
    for i in range(n): add(t + i * .05, bell(hz(base + [0, 4, 7, 12, 16, 19, 24][i % 7]), .8), g, rs.uniform(-.7, .7), .6)

F, C, Dm, Bb, Am, Gm = [53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53], [45, 48, 52], [43, 46, 50]
THEME = [(72, 1), (69, .5), (72, .5), (77, 1.5), (76, .5), (74, 1), (72, 1), (70, 1), (69, 1),
         (67, .5), (69, .5), (70, 1), (72, 1.5), (65, .5), (69, 2)]  # in beats

def play_theme(t0, beat, voice, g, octave=0, until=None):
    t = t0
    for m, b in THEME:
        if until and t >= until: break
        voice(t, hz(m + octave), b * beat, g)
        t += b * beat
    return t

mb = lambda t, f, d, g: add(t, musicbox(f, max(1.2, d * 2)), g, rs.uniform(-.3, .3), .55)
bl = lambda t, f, d, g: add(t, bell(f, max(1.0, d * 2)), g, rs.uniform(-.2, .2), .5)
lead = lambda t, f, d, g: (add(t, osc('sq', f, d * .95, a=.004, d=.08, s=.55, r=.06), g, -.1, .35), add(t, bell(f * 2, .8), g * .5, .2, .5))

# ---- 0–12: the golden town, then the colour drains ----
for i, ch in enumerate([F, C, Dm, Bb, F, C]):
    t = i * 2.0
    drain = min(1, max(0, (t - 6) / 4))
    for m in ch: add(t, strings(hz(m + 12) * (1 - .01 * drain), 2.4, a=.5), .07, rs.uniform(-.5, .5), .6)
    add(t, strings(hz(ch[0]), 2.4, a=.4, bright=.05), .1, 0, .4)
play_theme(.6, .5, mb, .22, 12, until=6.4)
# the theme again, slowing and sinking as the colour fades
t = 6.6
for k, (m, b) in enumerate(THEME[:8]):
    slow = 1 + k * .08; add(t, musicbox(hz(m + 12 - k * .15), 1.6), .2 * (1 - k * .09), 0, .7); t += b * .5 * slow
add(6.0, strings(hz(38), 6.0, a=2, bright=.03), .22, 0, .4)
x = tt(5.5); add(9.5, lowpass(rs.uniform(-1, 1, len(x)), .25) * np.minimum(1, x / 1.5) * np.minimum(1, (5.5 - x) / .6), .12, 0, .2)  # rain

# ---- 12–19: mystery, the gathering and Puff's birth ----
add(11.8, strings(hz(38), 6.0, a=1.5, bright=.04), .25, 0, .4)
add(12.0, strings(hz(57), 5.4, a=2.5, bright=.08), .06, -.4, .8); add(12.0, strings(hz(64), 5.4, a=2.5, bright=.08), .06, .4, .8)
for i in range(24):
    t = 12.4 + i * .2; add(t, bell(hz([74, 77, 81, 84, 86, 89][i % 6] + (12 if i > 14 else 0)), .9), .03 + i * .002, rs.uniform(-.8, .8), .8)
for i in range(6): add(13.2 + i * .7, kick(.6) * .5, .25 + i * .05, 0, .2)  # heartbeat
add(15.3, riser(2.0, 300, 2400), .3, 0, .5)
add(17.3, boom(), .5, 0, .5); add(17.3, cymbal(3), .25, 0, .7)
for m in [65, 69, 72, 77]: add(17.3, strings(hz(m + 12), 2.0, a=.02, r=1.5, bright=.15), .07, rs.uniform(-.4, .4), .9)
sparkle(17.32, 84, 7, .08); add(18.25, bell(hz(96), .8), .08, .4, .7)  # eye glint
add(18.65, pop(1.4), .12, 0, .3)

# ---- 19–25: the first bloom ----
for i, ch in enumerate([F, Dm, Bb]):
    for m in ch: add(19 + i * 2, strings(hz(m + 12), 2.3, a=.6, bright=.07), .06, rs.uniform(-.5, .5), .7)
play_theme(19.2, .42, bl, .14, 12, until=22.8)
add(21.0, pop(1.3), .08); add(22.1, pop(1.4), .08)
add(22.5, swell(.5), .3, 0, .5)
add(23.0, pop(.9), .3, 0, .3); add(23.0, cymbal(2.5), .2, 0, .8)
for m in [53, 60, 65, 69, 72, 76]: add(23.0, strings(hz(m + 12), 2.2, a=.05, r=1.2, bright=.2), .07, rs.uniform(-.5, .5), .8)
sparkle(23.0, 84, 7, .09); add(24.6, whoosh(.5), .3)

# ---- 25–37: the montage, 120 bpm build ----
BEAT = .5
prog = [F, C, Dm, Bb, F, C]
for bar in range(6):
    t0 = 25 + bar * 2; ch = prog[bar]
    for m in ch: add(t0, strings(hz(m + 12), 2.1, a=.1, bright=.1 + bar * .02), .06, rs.uniform(-.5, .5), .5)
    for e in range(8):
        t = t0 + e * BEAT / 2
        add(t, osc('saw', hz(ch[e % 3] + 24), .2, a=.003, d=.1, s=.2, r=.05) * .5, .05, .3 * (1 if e % 2 else -1), .4)  # ostinato
        add(t, osc('tri', hz(ch[0] - 12 + (12 if e % 2 else 0)), .22, d=.1, s=.5, r=.05), .22, 0, .1)
        if e in (0, 4): add(t, kick(), .5, 0, .15)
        if e in (2, 6): add(t, tom(140), .25, .2, .4); add(t, noise(.2, 20), .12, -.1, .4)
        if bar >= 2: add(t, noise(.05, 90), .06, .3, .1)
    if bar == 5:
        for i in range(8): add(t0 + 1 + i * .125, tom(90 + i * 12), .2 + i * .02, (i % 2 - .5), .4)
play_theme(25, .5, lead, .09, 0, until=33)
play_theme(33, .5, lead, .1, 12, until=37)
for i, te in enumerate([25.5, 26.0, 26.5]): add(te, pop(1 + i * .15), .3, 0, .3); sparkle(te + .03, 79 + i * 3, 5, .05)
x = tt(.6); add(27.6, np.sin(2 * np.pi * np.cumsum(260 + 200 * np.sin(2 * np.pi * 7 * x) * np.exp(-x * 3) + 180 * x) / SR) * np.exp(-x * 4), .2, 0, .3)
sparkle(27.65, 86, 6, .06); add(28.0, whoosh(.6), .3)
for i in range(5): add(29.15 + i * .3, bell(hz([84, 86, 88, 91, 93][i]), 1.0), .1, (i - 2) * .3, .6)
for i in range(20): add(31.1 + i * .07, osc('sine', hz(96 + (i * 5) % 7), .03, d=.02, s=0, r=0), .02, rs.uniform(-.3, .3), .3)  # writing
for te in (33, 34, 35, 36): add(te - .15, whoosh(.3), .3); add(te, cymbal(1.2), .14, 0, .5)

# ---- 37–46: Many paws, light work ----
add(37.0, boom(), .5, 0, .6); add(37.0, cymbal(3), .15, 0, .9)
for m in [38, 50, 57]: add(37.0, strings(hz(m + 12), 4.0, a=.4, bright=.05), .1, rs.uniform(-.4, .4), .7)
play_theme(37.2, .55, mb, .16, 12, until=40.6)
for i in range(6): add(38.7 + i * .15, bell(hz(84 + i * 2), 1.2), .05, (i - 2.5) * .25, .8)
add(38.6, riser(2.1, 200, 2200), .4, 0, .4)
for i in range(16): add(39.5 + i * (1.2 / 16), noise(.12, 25), .04 + i * .012, .1, .3)
add(40.75, pop(1.2), .15)  # Puff's hop in the hush
# DROP
add(41.0, boom(), .9, 0, .5); add(41.0, kick(1.5), .8, 0, .2); add(41.0, cymbal(3.5), .35, 0, .7)
sparkle(41.0, 84, 7, .1)
prog = [F, C, Dm, Bb, F]
for bar in range(3):
    t0 = 41 + bar * 2; ch = prog[bar]
    for m in ch + [ch[0] + 12]: add(t0, strings(hz(m + 12), 2.1, a=.05, bright=.22), .08, rs.uniform(-.6, .6), .6)
    for e in range(8):
        t = t0 + e * .25
        add(t, osc('tri', hz(ch[0] - 12 + (12 if e % 2 else 0)), .22, d=.1, s=.5, r=.05), .25, 0, .1)
        if e % 2 == 0: add(t, kick(), .5, 0, .15)
        if e in (2, 6): add(t, tom(150), .28, .2, .4); add(t, noise(.25, 14), .16, -.1, .5)
        add(t, noise(.05, 80), .07, .3, .1)
        add(t, osc('saw', hz(ch[e % 3] + 24), .2, a=.003, d=.1, s=.2, r=.05) * .5, .06, .3 * (1 if e % 2 else -1), .4)
play_theme(41, .5, lead, .12, 12, until=47)
for i, te in enumerate([41.6, 42.1, 42.6, 43.1, 43.5, 44.0, 44.5, 44.9]): add(te, pop(.55), .25, (i % 3 - 1) * .5, .6); sparkle(te + .05, 88, 4, .04)
for m in [53, 60, 65, 69, 72]: add(47.0 - 2, strings(hz(m + 12), 1.8, a=.6, r=.4, bright=.15), .05, rs.uniform(-.5, .5), .7)
add(45.4, swell(.6), .3)

# ---- 46–52: title ----
add(46.0, boom(), .8, 0, .7); add(46.0, kick(1.6), .6, 0, .3); add(46.0, cymbal(4), .25, 0, .9)
for m in [41, 53, 60, 65, 69, 72, 77]: add(46.0, strings(hz(m + 12), 6.0, a=.08, r=3.0, bright=.12), .07, rs.uniform(-.6, .6), .9)
for i in range(10): add(46.0 + i * .08, bell(hz(84 + [0, 4, 7, 12, 16, 19, 24, 28, 31, 36][i]), 1.6), .05, rs.uniform(-.8, .8), .9)
add(47.5, whoosh(.9), .25, 0, .6); sparkle(47.9, 91, 5, .05)
play_theme(48.2, .55, mb, .14, 12, until=51.8)
add(49.0, pop(1.2), .08); add(50.5, pop(1.25), .08)

# ---- 52–55: the stinger ----
for i in range(6): add(52.2 + i * .14, pop(2.0), .05, -.3 + i * .1, .2)  # tiny steps
x = tt(.35); add(53.4, np.sin(2 * np.pi * np.cumsum(700 + 500 * x / .35) / SR) * np.minimum(1, x * 30) * np.exp(-x * 3), .06, 0, .3)  # inhale
x = tt(.3); sneeze = lowpass(rs.uniform(-1, 1, len(x)), .5) * np.exp(-x * 14) + np.sin(2 * np.pi * np.cumsum(1400 * np.exp(-x * 9) + 500) / SR) * np.exp(-x * 18) * .6
add(53.75, sneeze, .45, 0, .3); sparkle(53.78, 88, 7, .07)
add(54.2, musicbox(hz(89), 1.5), .15, 0, .7)

# ---- reverb (exponential noise tail, FFT convolution) and master ----
ir_t = tt(2.6); ir = rs.uniform(-1, 1, (len(ir_t), 2)) * np.exp(-ir_t * 2.6)[:, None]
ir[:, 0] = lowpass(ir[:, 0], .35); ir[:, 1] = lowpass(ir[:, 1], .35); ir /= np.abs(ir).sum(0) ** .5 * 6
L = 1 << int(np.ceil(np.log2(N + len(ir_t))))
rev = np.stack([np.fft.irfft(np.fft.rfft(wet[:, c], L) * np.fft.rfft(ir[:, c], L), L)[:N] for c in range(2)], 1)
mix = dry + rev * 1.2
fade = np.ones(N); fade[:int(.3 * SR)] = np.linspace(0, 1, int(.3 * SR)); fade[-int(.6 * SR):] = np.linspace(1, 0, int(.6 * SR))
mix *= fade[:, None]
mix /= np.percentile(np.abs(mix), 99.95)
mix = np.tanh(mix * 1.1) / np.tanh(1.1) * .9
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('ok', round(N / SR, 1), 's')
