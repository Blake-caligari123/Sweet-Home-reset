"""Sound for a gameplay short, synced to the capture's events.json.
usage: python3 gameplay/sound.py <name> <capture dir> <seconds>   → writes <capture dir>/audio.wav
Event times go through <name>.cut.js exactly as edit.html maps them; <seconds> is the edited length.

The music is played on real recorded instruments (CC0 sample libraries, through the sampler in Lemo-Opuscar,
github.com/lemomo-ai/lemo-opuscar; set OPUSCAR to its folder, and run with its .venv python):
harp, cello and violin pizzicato, marimba, flute, clarinet, vibraphone, glockenspiel and hand chimes.
Foley stays synthesised: every tap gets a soft scrub, every cleaned spot a pop and a rising glockenspiel note.
Each video adds its own moments (a hush and the restore fanfare, the doze lullaby, the morning letter)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from synth import *
OPUSCAR = os.environ.get('OPUSCAR', '/home/user/lemomo-ai/lemo-opuscar')
sys.path.insert(0, OPUSCAR)
from core.audio import sampler as S
import soxr

name, cap, dur = sys.argv[1], sys.argv[2], float(sys.argv[3])
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(cap, 'events.json')))
fps = ev['fps']
cut = open(os.path.join(HERE, f'{name}.cut.js')).read()
SEGS = json.loads(cut[cut.index('{'):cut.rindex('}') + 1])['segments']

def out_of(f):
    """Capture frame → output seconds (the same mapping as outOf() in edit.html); None if the frame was cut."""
    if not SEGS: return f / fps
    acc = 0
    for f0, f1, d in SEGS:
        if (f == f0) if f0 == f1 else (f0 <= f < f1): return acc if f0 == f1 else acc + (f - f0) / (f1 - f0) * d
        acc += d
    return None

for e in ev['events']: e['t'] = out_of(e['f'])
ev['events'] = [e for e in ev['events'] if e['t'] is not None]
marks = {}
for e in ev['events']: marks.setdefault(e['name'], []).append(e['t'])
first = lambda k, default=None: marks.get(k, [default])[0]
m = Mix(dur)

# ---- the score: real instruments, F – Dm – Bb – C, two seconds a bar ----
night = name == 'late-night'
score = []                                   # (t, instrument, midi pitch, seconds, velocity, pan)
CH = [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 59]]
ROOT = [41, 38, 46, 48]
THEME = [72, 69, 72, 77, 76, 74, 72, 69, 70, 72, 74, 72, 69, 67, 65, 67]      # quarter notes, four bars
stop = first('asleep', dur) if night else dur
# a hush just before the room is restored, so the first sound after it (the fanfare) lands
hush = (first('restored') - .8, first('restored')) if first('restored') is not None else (-1, -1)
fast_span = (first('fast', -1), first('last', first('restored', -1)))
play = lambda t: t < stop and not (hush[0] <= t < hush[1])
for bar in range(int(stop / 2) + 1):
    t0, ch = bar * 2.0, CH[bar % 4]
    if not play(t0): continue
    score.append((t0, 'cellos_pizz', ROOT[bar % 4], 1.0, .55, 0))
    if play(t0 + 1): score.append((t0 + 1, 'cellos_pizz', ROOT[bar % 4] + 7, .8, .45, 0))
    for k in range(8):                                                        # harp arpeggio in eighths
        t = t0 + k * .25
        if play(t): score.append((t, 'harp', ch[[0, 1, 2, 3, 2, 1, 2, 3][k]] + 12, .9, .32 if night else .4, -.35))
    if night:
        score.append((t0, 'vibraphone', ch[1] + 12, 1.9, .3, .3)); score.append((t0, 'vibraphone', ch[3] + 12, 1.9, .25, .3))
        continue
    for b in (1, 3):                                                          # soft marimba off-beats
        if play(t0 + b * .5):
            for n in ch[1:]: score.append((t0 + b * .5, 'marimba', n + 12, .4, .3, .35))
    if bar >= 1:                                                               # the flute carries the tune
        for q in range(4):
            t = t0 + q * .5
            if play(t): score.append((t, 'flute', THEME[(bar * 4 + q) % 16], .48, .42, -.1))
    for k in range(16):                                                       # pizzicato drive while it's sped up
        t = t0 + k * .125
        if fast_span[0] <= t < fast_span[1] and play(t): score.append((t, 'violins_pizz', ch[k % 4] + 12, .2, .3, .45))
    if play(t0 + .5): score.append((t0 + .5, 'snare2', 'taps', None, .25, .2))
    if play(t0 + 1.5): score.append((t0 + 1.5, 'snare2', 'taps', None, .25, .2))

# ---- every tap and every cleaned spot ----
PENTA = [84, 86, 88, 91, 93, 96, 98, 100, 103]                 # glockenspiel, climbing as the room fills
for e in ev['events']:
    t = e['t']
    fast = e.get('speed', 1) > 1
    if e['name'] == 'tap':
        wet = e.get('type') == 'stain'
        m.add(t + .08, brush(.14 if fast else .22, 2), .14 if fast else .22, rs.uniform(-.4, .4), .1)
        if wet: m.add(t + .1, smooth(noise(.2, 10), 3), .1, 0, .3)
    if e['name'] == 'cleaned':
        k = sum(1 for x in ev['events'] if x['name'] == 'cleaned' and x['f'] <= e['f'])
        m.add(t, pop(1 + (k % 8) * .06), .18 if fast else .28, rs.uniform(-.4, .4), .2)
        score.append((t + .01, 'glockenspiel', PENTA[k % len(PENTA)], .6, .22 if fast else .45, float(rs.uniform(-.5, .5))))
    if e['name'] == 'click':
        m.add(t, pop(1.5), .15, 0, .2)

# ---- moments for each video ----
if first('fast') is not None:
    m.add(first('fast') - .2, sweep(400, 1600, .25) * .3, .2)                       # speed-up swoosh
if first('last') is not None:
    m.add(first('last') - .1, sweep(1600, 500, .25) * .3, .15)                       # back to real speed
if first('restored') is not None:
    t = first('restored')
    score.append((t, 'bass_drum', None, None, .45, 0)); m.add(t, cymbal(2.0), .1, 0, .6)
    for i, n in enumerate([65, 69, 72, 77, 81, 84, 89]): score.append((t + i * .035, 'harp', n, 2.5, .55, -.3 + i * .1))   # glissando
    for i, n in enumerate([89, 93, 96, 101]): score.append((t + .25 + i * .09, 'glockenspiel', n, 1.5, .55, (i - 1.5) * .3))
    for n in [72, 77, 81]: score.append((t + .1, 'hand_chimes', n, 3.0, .5, 0))
    for n in [65, 69, 72, 77]: score.append((t, 'vibraphone', n, 3.5, .4, .2))
if night:
    t = first('asleep')
    m.add(t - .3, sweep(900, 300, .8, 1) * np.exp(-tt(.8) * 2), .12, 0, .4)        # yawn-ish slide down
    for i, n in enumerate([76, 72, 69, 72, 74, 71, 67]): score.append((t + .2 + i * .55, 'flute', n, .7, .4, -.1))          # lullaby
    for n in [53, 60, 64]: score.append((t + .2, 'vibraphone', n + 12, 3.5, .25, .3))
    x = tt(1.0); m.add(t + 1.0, smooth(rs.uniform(-1, 1, len(x)), 40) * np.sin(np.pi * x) ** 2 * 3, .15, 0, .3)                  # one snore
    if first('letter') is not None:
        t = first('letter'); m.add(t, whoosh(.4, 10), .2)                                                                        # paper
        for i, n in enumerate([84, 88, 91]): score.append((t + .3 + i * .12, 'glockenspiel', n, 1.0, .4, (i - 1) * .3))
        morning = [72, 74, 76, 77, 76, 74, 72, 67]
        for bar in range(int((dur - t) / 2) + 1):                                                                                 # morning bed
            tb = t + bar * 2.0; ch = CH[bar % 4]
            if tb >= dur - .5: break
            score.append((tb, 'cellos_pizz', ROOT[bar % 4], 1.0, .5, 0))
            for k in range(4): score.append((tb + k * .5, 'harp', ch[k % 4] + 12, .9, .35, -.35))
            for q in range(2): score.append((tb + q * 1.0, 'clarinet', morning[(bar * 2 + q) % 8], .9, .35, .1))
    if first('did-it') is not None:
        t = first('did-it')
        for i, n in enumerate([84, 88, 91, 96, 100]): score.append((t + .05 + i * .06, 'glockenspiel', n, 1.0, .5, (i - 2) * .25))
        for n in [72, 76, 79]: score.append((t + .1, 'hand_chimes', n, 2.5, .45, 0))
stem = soxr.resample(S.render(score, dur=dur), 48000, SR)        # the sampler works at 48 kHz
n = min(len(stem), len(m.dry))
m.dry[:n] += stem[:n] * .9; m.wet[:n] += stem[:n] * .3
m.write(os.path.join(cap, 'audio.wav'), fade_out=.5)
print('ok', round(dur, 1), 's')
