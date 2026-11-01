"""Score, foley and ambience for "One Home", from timeline.json (the same times the picture uses).
usage: OPUSCAR=<Lemo-Opuscar checkout with vcsl + vsco2ce> $OPUSCAR/.venv/bin/python film/score.py  → film/score.wav
Music: real instruments (CC0) through the Lemo-Opuscar sampler. Foley and ambience: synthesised (lib/synth.py).
100 bpm in F major; a beat is 0.6 s, a bar 2.4 s. Sections follow the sound table in TREATMENT.md."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
from synth import *
sys.path.insert(0, os.environ.get('OPUSCAR', '/home/user/lemomo-ai/lemo-opuscar'))
from core.audio import sampler as S
import soxr

TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR, C = TL['dur'], TL['cues']
BEAT, BAR = .6, 2.4
m = Mix(DUR)
score = []                                  # (t, instrument, midi pitch or variant, seconds, velocity, pan)
F, Dm, Bb, Cc = [53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55]

# ---------------- ambience: rain until the window is wiped, then birds and a warm room ----------------
rain_end = C['wipe'] + .3
x = tt(rain_end); rain = smooth(rs.uniform(-1, 1, len(x)), 6) - smooth(rs.uniform(-1, 1, len(x)), 40)
rain *= np.minimum(1, x / .3) * np.clip((rain_end - x) / .6, 0, 1)
m.add(0, rain * 1.4, .16, 0, .2)
for i in range(60):                                         # drips on the glass
    t = rs.uniform(0, rain_end - .4); m.add(t, sweep(2600, 1500, .05, 1) * np.exp(-tt(.05) * 60), .03, rs.uniform(-.6, .6), .4)
for i in range(16):                                         # birds outside, from just before the wipe (a J-cut)
    t = C['birds'] + i * 1.1 + rs.uniform(0, .5)
    if t > DUR - 1: break
    for j in range(rs.integers(2, 4)):
        f0 = rs.uniform(2600, 4200); m.add(t + j * .09, sweep(f0, f0 * rs.uniform(1.15, 1.4), .07, 1) * np.exp(-tt(.07) * 25), .035, rs.uniform(-.8, .8), .5)
m.add(0, smooth(noise(DUR), 150) * 2.5, .05, 0, .2)          # room tone throughout

# ---------------- foley: every action has a sound ----------------
def pat(t, g=.22, p=1.):                                    # a soft fluffy footstep
    m.add(t, smooth(noise(.06, 50), 8) * 2, g, rs.uniform(-.2, .2), .1); m.add(t, osc('sine', 140 * p, .05, a=.002, d=.04, s=0, r=0), g * .6)
for t in C['twitch']: m.add(t, brush(.25, 4), .2, 0, .2)
m.add(1.6, brush(.4, 3) * np.linspace(.3, 1, len(tt(.4))), .22, 0, .2)
m.add(C['pop'], pop(.8), .45, 0, .3); m.add(C['pop'], smooth(noise(.35, 9), 3), .3, 0, .3)          # pff!
m.add(C['land'], osc('sine', 110, .12, a=.002, d=.1, s=0, r=0), .3); pat(C['land'], .3, .8)
x = tt(.3); m.add(C['shiver'], smooth(rs.uniform(-1, 1, len(x)), 5) * (.5 + .5 * np.sin(x * 2 * np.pi * 24)), .08)
for b in TL['blooms']:
    t, kind = b[0], b[5]
    if kind == 'step': pat(t)
    if kind == 'poof': m.add(t, smooth(noise(.4, 7), 4) * 1.5, .3, -.2, .3); m.add(t - .05, brush(.3, 3), .3, 0, .2)
for s in TL['segs']:
    if s[0] in ('hop', 'bighop'): pat(s[1] + (s[2] - s[1]) * .18, .2, 1.2); pat(s[2] - .02, .3, .9)
m.add(C['sock_flip'], whoosh(.3, 8), .2, 0, .2)
m.add(C['sock_toss'], whoosh(.4, 8), .2, .2, .2)
m.add(C['sock_in'], smooth(noise(.15, 20), 6) * 2, .25, .3, .3)
m.add(C['wipe'], sweep(1800, 2600, .35, 1) * np.sin(np.pi * tt(.35) / .35) * .4, .1, -.3, .4)          # squeak on glass
m.add(C['lamp'], smooth(noise(.02, 300), 1) * 3, .2, -.2, .1)                                          # click
x = tt(1.6); m.add(C['yawn'], sweep(620, 300, 1.6, .8) * np.sin(np.pi * x / 1.6) * (1 + .3 * np.sin(x * 30)) * .4, .14, 0, .5)   # a yawn
m.add(C['tug'], brush(.5, 6), .25, 0, .2); m.add(C['tug'] + .3, brush(.3, 6), .2, 0, .2)
for t in (27.6, 30.2, 32.8):                                                                            # soft snores
    x = tt(1.1); m.add(t, smooth(rs.uniform(-1, 1, len(x)), 40) * np.sin(np.pi * x / 1.1) ** 2 * 2.5, .1, 0, .3)

# ---------------- music ----------------
# discovery: one glockenspiel note per step, rising; "Ooh." on the marimba
for t, n in zip((4.2, 5.4, 6.0), (84, 88, 91)): score.append((t, 'glockenspiel', n, 1.2, .5, 0))
score += [(C['pop'] + .05, 'glockenspiel', 96, 1.0, .35, .2), (C['wake'], 'hand_chimes', 84, 1.5, .3, 0),
          (C['ooh'], 'marimba', 67, .6, .55, 0), (C['ooh'] + .3, 'marimba', 72, 1.0, .55, 0)]

def groove(t0, bars, chords, flute=True, full=False):
    theme = [72, 69, 72, 77, 76, 74, 72, 69, 70, 72, 74, 72, 69, 67, 65, 67]
    for b in range(bars):
        tb, ch = t0 + b * BAR, chords[b % len(chords)]
        root = {53: 41, 50: 38, 46: 46, 48: 48}[ch[0]]
        score.append((tb, 'cellos_pizz', root, 1.0, .6, 0)); score.append((tb + 2 * BEAT, 'cellos_pizz', root + 7, .8, .5, 0))
        for k in range(8): score.append((tb + k * BEAT / 2, 'harp', [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[2], ch[0] + 12][k] + 12, 1.0, .38, -.35))
        for q in (1, 3):
            for n in ch: score.append((tb + q * BEAT, 'marimba', n + 12, .4, .32, .35))
            score.append((tb + q * BEAT, 'snare2', 'taps', None, .28, .2))
        if flute:
            for q in range(4): score.append((tb + q * BEAT, 'flute', theme[(b * 4 + q) % 16], BEAT * .95, .45, -.1))
        if full:
            for n in ch: score.append((tb, 'violins', n + 12, BAR, .32, 0))
            score.append((tb, 'bass_drum', None, None, .35, 0))

groove(C['music'], 5, [F, Dm, Bb, Cc, F])                               # the tidy: 7.8–19.8
# accents on the actions
for t in (9.6, 10.8):
    for i, n in enumerate((84, 88, 91)): score.append((t + i * .06, 'glockenspiel', n, .8, .45, (i - 1) * .3))
for i, n in enumerate((72, 76, 79, 84)): score.append((C['sock_flip'] + i * .05, 'xylophone', n, .5, .45, .2))
score += [(C['sock_in'], 'marimba', 53, .8, .6, .3), (C['sock_in'] + .05, 'hand_chimes', 88, 1.2, .35, .3)]
for i, n in enumerate((65, 69, 72, 77, 81, 84)): score.append((C['wipe'] + i * .04, 'harp', n, 1.6, .5, -.4 + i * .12))
for n in (65, 69, 72, 76): score.append((C['lamp'] + .05, 'vibraphone', n, 2.0, .4, .2))
# the bed: one held chord, then nothing (the hush before the flood)
for n in (53, 60, 65, 69): score.append((19.8, 'vibraphone', n + 12, 1.5, .35, .1))
# the flood: everything at once, then two full bars
t = C['flood']
score.append((t, 'bass_drum', None, None, .55, 0)); m.add(t, cymbal(2.6), .12, 0, .7)
for i, n in enumerate((53, 57, 60, 65, 69, 72, 77, 81, 84, 89)): score.append((t + i * .03, 'harp', n, 2.5, .55, -.45 + i * .1))
for i, n in enumerate((89, 93, 96, 101)): score.append((t + .3 + i * .09, 'glockenspiel', n, 1.4, .55, (i - 1.5) * .3))
for n in (72, 77, 81): score.append((t + .1, 'hand_chimes', n, 3.0, .45, 0))
groove(t + .02, 2, [F, Bb], flute=True, full=True)                       # 23.2–28.0
# the ending: a lullaby on the flute over slow harp, resolving on the title
lull = [(72, 1.2), (69, 1.2), (65, 2.4), (67, 1.2), (69, 1.2), (72, 2.4), (70, 1.2), (69, 1.2), (67, 2.4), (65, 3.6)]
tl = 28.0
for n, d in lull:
    if tl > DUR - 1.5: break
    score.append((tl, 'flute', n, d * .95, .38, -.1)); tl += d
for b in range(4):
    tb, ch = 28.0 + b * BAR, [F, Dm, Bb, F][b]
    for k in range(4): score.append((tb + k * BEAT, 'harp', ch[k % 3] + 12, 1.4, .3, -.3))
    score.append((tb, 'vibraphone', ch[1] + 12, BAR, .22, .3))
for n in (65, 72, 77, 81): score.append((C['title'] + .1, 'hand_chimes', n, 3.5, .4, 0))
score.append((34.4, 'glockenspiel', 89, 1.6, .35, 0))

# ---------------- mix: the music under the foley, the hush kept silent ----------------
stem = soxr.resample(S.render(score, dur=DUR), 48000, SR)
h0, h1 = (int(v * SR) for v in C['hush'])
stem[h0:h1] *= np.linspace(1, 0, h1 - h0)[:, None] ** 3                 # let the held chord die into the silence
n = min(len(stem), len(m.dry))
m.dry[:n] += stem[:n] * .85; m.wet[:n] += stem[:n] * .3
m.write(os.path.join(HERE, 'score.wav'), fade_in=.02, fade_out=.8, room=2.6)
print('ok', DUR, 's')
