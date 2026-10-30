"""Sound for a gameplay short, synced to the capture's events.json.
usage: python3 gameplay/sound.py <name> <capture dir> <seconds>   → writes <capture dir>/audio.wav
Event times go through <name>.cut.js exactly as edit.html maps them; <seconds> is the edited length.

Every tap gets a soft scrub, every cleaned spot a rising sparkle note, over a cosy lo-fi bed;
each video adds its own moments (the restore fanfare, the doze lullaby, the letter)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from synth import *

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

# ---- the lo-fi bed: F – Dm – Bb – C, softer at night ----
night = name == 'late-night'
CH = [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 59]]
stop = first('asleep', dur) if night else dur
for bar in range(int(stop / 2) + 1):
    t0 = bar * 2.0
    if t0 >= stop: break
    ch = CH[bar % 4]
    for i, n in enumerate(ch): m.add(t0 + i * .03, bell(hz(n + 12), 2.0), .04, (i - 1.5) * .3, .5)
    m.add(t0, pluck(hz(ch[0] - 12), 1.0), .2, 0, .1); m.add(t0 + 1.0, pluck(hz(ch[0] - 12), .8), .14, 0, .1)
    for b in range(4):
        tb = t0 + b * .5
        if tb >= stop: break
        if b in (0, 2): m.add(tb, kick(), .22 if night else .32)
        if b in (1, 3): m.add(tb, snap(), .08, .15, .2)

# ---- every tap and every cleaned spot ----
PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96]
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
        m.add(t + .01, bell(hz(PENTA[k % len(PENTA)]), .7), .06 if fast else .1, rs.uniform(-.5, .5), .5)
    if e['name'] == 'click':
        m.add(t, pop(1.5), .15, 0, .2)

# ---- moments for each video ----
if first('fast') is not None:
    m.add(first('fast') - .2, sweep(400, 1600, .25) * .3, .2)                       # speed-up swoosh
if first('last') is not None:
    m.add(first('last') - .1, sweep(1600, 500, .25) * .3, .15)                       # back to real speed
if first('restored') is not None:
    t = first('restored')
    m.add(t, kick(1.4), .4); m.add(t, cymbal(2.0), .14, 0, .6)
    for i, n in enumerate([77, 81, 84, 89, 93]): m.add(t + i * .06, bell(hz(n), 1.8), .1, (i - 2) * .25, .7)
    for n in [53, 60, 65, 69]: m.add(t, pad(hz(n + 12), 4.0, a=.3, r=1.5), .05, rs.uniform(-.4, .4), .7)
if night:
    t = first('asleep')
    m.add(t - .3, sweep(900, 300, .8, 1) * np.exp(-tt(.8) * 2), .12, 0, .4)        # yawn-ish slide down
    for i, n in enumerate([76, 72, 69, 72, 74, 71, 67]): m.add(t + .2 + i * .45, musicbox(hz(n + 12), 1.6), .16, (i % 3 - 1) * .3, .7)   # lullaby
    x = tt(1.0); m.add(t + 1.0, smooth(rs.uniform(-1, 1, len(x)), 40) * np.sin(np.pi * x) ** 2 * 3, .15, 0, .3)                  # one snore
    if first('letter') is not None:
        t = first('letter'); m.add(t, whoosh(.4, 10), .2)                                                                        # paper
        for i, n in enumerate([72, 76, 79]): m.add(t + .3 + i * .12, bell(hz(n + 12), 1.2), .08, (i - 1) * .3, .6)
        for bar in range(int((dur - t) / 2) + 1):                                                                                 # morning bed
            tb = t + bar * 2.0; ch = CH[bar % 4]
            for i, n in enumerate(ch): m.add(tb, bell(hz(n + 12), 2.0), .035, (i - 1.5) * .3, .6)
            m.add(tb, pluck(hz(ch[0] - 12), 1.0), .16)
    if first('did-it') is not None:
        t = first('did-it'); m.sparkle(t + .05, 84, 7, .09); m.add(t, kick(1.2), .3)
m.write(os.path.join(cap, 'audio.wav'), fade_out=.5)
print('ok', round(dur, 1), 's')
