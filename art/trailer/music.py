"""Synthesise the trailer soundtrack: 120 BPM chiptune-cosy loop plus SFX synced to trailer.html."""
import numpy as np, wave
SR, DUR = 44100, 33.0
N = int(SR * DUR)
mix = np.zeros((N, 2))
rs = np.random.default_rng(3)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a=.005, d=.1, s=.6, r=.08):
    e = np.ones(n) * s; ai, di, ri = int(a*SR), int(d*SR), int(r*SR)
    e[:ai] = np.linspace(0, 1, ai) if ai else 1
    e[ai:ai+di] = np.linspace(1, s, len(e[ai:ai+di]))
    if ri: e[-ri:] *= np.linspace(1, 0, len(e[-ri:]))
    return e
def add(t, sig, gain=1., pan=0.):
    i = int(t * SR); sig = sig[:max(0, N - i)]
    mix[i:i+len(sig), 0] += sig * gain * (1 - pan) ** .5 / 1.41 * 2 ** .5 * .71
    mix[i:i+len(sig), 1] += sig * gain * (1 + pan) ** .5 / 1.41 * 2 ** .5 * .71
def osc(kind, f, dur, **e):
    n = int(dur * SR); tt = np.arange(n) / SR; ph = (f * tt) % 1
    if kind == 'sq': w = np.where(ph < .25, 1., -1.) * .5
    elif kind == 'tri': w = 1 - 4 * np.abs(ph - .5)
    elif kind == 'saw': w = 2 * ph - 1
    else: w = np.sin(2 * np.pi * f * tt)
    return w * env(n, **e)
def bell(f, dur=1.2):
    n = int(dur*SR); tt = np.arange(n)/SR
    return (np.sin(2*np.pi*f*tt) + .4*np.sin(2*np.pi*f*2.76*tt)*np.exp(-tt*6) + .2*np.sin(2*np.pi*f*5.4*tt)*np.exp(-tt*9)) * np.exp(-tt*3.2)
def noise(dur, decay=30.):
    n = int(dur*SR); tt = np.arange(n)/SR
    return rs.uniform(-1, 1, n) * np.exp(-tt*decay)
def lowpass(x, a): 
    y = np.zeros_like(x); acc = 0.
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def kick():
    n = int(.3*SR); tt = np.arange(n)/SR; f = 150*np.exp(-tt*28)+45
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-tt*9)
KICK, SNARE, HAT = kick(), noise(.18, 22) * .6, noise(.05, 90) * .5
SNARE[:5292] += osc('sine', 190, .12, d=.08, s=0, r=0) * .5

BEAT = .5
CHORDS = [(53, [65, 69, 72]), (48, [64, 67, 72]), (50, [65, 69, 74]), (46, [65, 70, 74])]  # F C Dm Bb
MEL = [[72,None,69,72,77,None,76,72],[74,None,72,67,72,None,70,69],[69,None,74,72,69,None,65,69],[70,None,69,67,65,None,67,None]]

def section(t):
    if t < 3: return 'intro'
    if 15 <= t < 19.5: return 'soft'
    if 24.5 <= t < 26.5: return 'break'
    if t >= 29: return 'outro'
    return 'full'

# ---- music grid (eighth notes) ----
for step in range(int(DUR / (BEAT / 2))):
    t = step * BEAT / 2; bar = int(t // 2) % 4; e8 = step % 8
    sec = section(t); root, tri = CHORDS[bar]
    if sec == 'outro' and t >= 29.5: break
    # melody
    note = MEL[bar][e8]
    if note is not None:
        ln = .25 * (2 if e8 + 1 < 8 and MEL[bar][e8+1] is None else 1)
        if sec in ('intro', 'soft', 'break', 'outro'):
            add(t, bell(hz(note + 12), 1.0), .16, -.2)
        else:
            up = 12 if 26.5 <= t < 29 else 0
            add(t, osc('sq', hz(note + up), ln, a=.003, d=.06, s=.5, r=.05), .10, -.15)
            add(t, bell(hz(note + 12 + up), .6), .06, .3)
    # bass + arp
    if sec in ('full',):
        add(t, osc('tri', hz(root - 12 + (12 if e8 % 2 else 0)), .24, a=.003, d=.1, s=.5, r=.04), .28)
        add(t, osc('sq', hz(tri[(step) % 3] + 12), .12, a=.002, d=.05, s=.2, r=.03), .035, .4)
    if sec == 'soft':
        add(t, osc('tri', hz(root - 12), .24, d=.1, s=.4, r=.05), .2)
    # drums
    if sec == 'full' or (sec == 'soft' and e8 % 2 == 0):
        if sec == 'full' and e8 in (0, 4): add(t, KICK, .55)
        if sec == 'full' and e8 in (2, 6): add(t, SNARE, .28, .1)
        add(t, HAT, .10 if e8 % 2 else .06, .3)
# pads
for b in range(int(DUR // 2)):
    t = b * 2; root, tri = CHORDS[b % 4]; sec = section(t + .01)
    g = {'intro': .05, 'soft': .05, 'break': .06, 'full': .03, 'outro': 0}[sec]
    if g: 
        for m in tri: add(t, osc('tri', hz(m), 2.0, a=.3, d=.5, s=.8, r=.4), g, rs.uniform(-.4, .4))
# snare roll + riser into the fountain drop
for i in range(16): add(25.5 + i * .0625, SNARE, .06 + i * .015, .1)
n = int(2.0*SR); tt = np.arange(n)/SR
add(24.5, np.sin(2*np.pi*np.cumsum(200 + 900*(tt/2)**2)/SR) * (tt/2)**2 * .5 + lowpass(rs.uniform(-1,1,n), .08) * (tt/2)**2, .25)
# outro chord
for m in [53, 65, 69, 72, 77]: add(29.0, osc('tri', hz(m), 4.0, a=.01, d=1., s=.5, r=1.5), .07)
for i, m in enumerate([72, 76, 77, 81, 84]): add(29.05 + i * .12, bell(hz(m + 12), 2.0), .14, (i - 2) * .2)
add(29.0, KICK, .6)

# ---- SFX ----
def pop(pitch=1.):
    n = int(.14*SR); tt = np.arange(n)/SR; f = (900*np.exp(-tt*30)+260)*pitch
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*22) + noise(.14, 40)*.35
def sparkle(t, base=84, n=5, g=.07):
    for i in range(n): add(t + i*.045, bell(hz(base + [0,4,7,12,16,19,24][i % 7]), .5), g, rs.uniform(-.6,.6))
def whoosh(dur=.5):
    n = int(dur*SR); tt = np.arange(n)/SR; e = np.sin(np.pi*tt/dur)**2
    return lowpass(rs.uniform(-1,1,n), .15) * e
for i, te in enumerate([4, 5, 6, 7, 8]):
    add(te, pop(1 + i*.12), .4); sparkle(te + .05, 79 + i*2)
# mega clean
add(9.0, KICK, .7); add(9.0, whoosh(.8), .6); sparkle(9.0, 84, 7, .1); add(8.8, whoosh(.3), .3)
for i in range(8): add(9.05 + i*.07, pop(1.4 + i*.05), .12, rs.uniform(-.7,.7))
add(9.75, whoosh(.5), .35); add(14.75, whoosh(.5), .35); add(24.25, whoosh(.5), .3); add(28.75, whoosh(.5), .35)
# grumble: grumpy "hmph" then boing
n = int(.25*SR); tt = np.arange(n)/SR; add(10.7, osc('sq', 110, .25, d=.1, s=.4) * (1 + .3*np.sin(2*np.pi*12*tt)), .08)
n = int(.6*SR); tt = np.arange(n)/SR
add(12.0, np.sin(2*np.pi*np.cumsum(260 + 200*np.sin(2*np.pi*7*tt)*np.exp(-tt*3) + 180*tt)/SR) * np.exp(-tt*4), .25)
add(12.0, pop(.8), .35); sparkle(12.1, 86, 6)
add(13.0, whoosh(.6), .4); sparkle(13.0, 79, 7, .08)
for i in range(5): add(13.15 + i*.2 + .45, pop(1.5 + i*.1), .18, (i-2)*.3)
# letter: paper slide, typing blips, tap + sticker
add(15.05, whoosh(.4), .4)
for i in range(30): add(15.6 + i * (2.0/30), osc('sq', hz(84 + (i*5) % 7), .03, d=.02, s=0, r=0), .025, rs.uniform(-.3,.3))
add(17.5, pop(1.2), .15); add(17.6, pop(1.3), .15)
add(18.0, noise(.03, 200), .3); add(18.15, pop(.9), .35); sparkle(18.15, 84, 7, .09)
# season cuts
for i, te in enumerate([19.5, 20.25, 21.0, 21.75]):
    add(te, whoosh(.25), .35); add(te, bell(hz([84, 88, 79, 91][i]), .8), .12)
# hearts filling
for i in range(6):
    for h in range(5):
        if (i + h) % 2 == 0: add(23.0 + i*.12 + h*.1, bell(hz(91 + h*2), .3), .03, (i % 2 - .5))
for i in range(6): add(22.55 + i*.1, pop(1.1 + i*.06), .14, (i % 2 - .5))
# spark rises, fountain drop and fireworks
n = int(.4*SR); tt = np.arange(n)/SR; add(26.15, np.sin(2*np.pi*np.cumsum(600 + 2000*tt)/SR) * .3 * np.exp(-tt*2), .2)
add(26.5, KICK, .9); add(26.5, noise(1.2, 3) * .5, .3); sparkle(26.5, 84, 7, .12)
n = int(1.5*SR); tt = np.arange(n)/SR; add(26.5, lowpass(rs.uniform(-1,1,n), .3) * np.exp(-tt*1.2), .12)
for i, te in enumerate([27.0, 27.45, 27.9, 28.35, 28.6]): add(te, pop(.6), .3, (i % 3 - 1)*.4); sparkle(te + .05, 88, 5, .06)
# title letters
for i in range(14): add(29.05 + i*.06, pop(1.3 + i*.04), .07, (i/13 - .5))
for te in (30.0, 31.0, 32.0): add(te, pop(1.0), .1)
add(30.6, bell(hz(96), 1.0), .1)

# fade, master
fade = np.ones(N); fade[-int(1.2*SR):] = np.linspace(1, 0, int(1.2*SR)) ** 1.5; fade[:int(.05*SR)] = np.linspace(0, 1, int(.05*SR))
mix *= fade[:, None]
mix = np.tanh(mix * 1.3) ; mix /= np.abs(mix).max() / .92
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', mix.shape)
