"""Score for timelapse.html: a clock tick for every day, a chime for every restoration, a swell at each season
change, and a full-band finale when the Glimmerwell relights on day 56."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
from synth import *

DUR, DAY0, DAY56 = 20.0, .8, 17.4
day_t = lambda d: DAY0 + (d - 1) * (DAY56 - DAY0) / 55
m = Mix(DUR)

# music: F – C – Dm – Bb at 120 bpm, getting fuller each season
CH = [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53]]
THEME = [72, 69, 72, 77, 76, 74, 72, 69, 70, 72, 74, 72, 69, 67, 65, 67]
for bar in range(int(DAY56 // 2) + 1):
    t0 = bar * 2.0; ch = CH[bar % 4]; layer = min(3, int(t0 / 4.4))   # 0 sparse → 3 full
    for i, n in enumerate(ch): m.add(t0, pad(hz(n + 12), 2.1, a=.3), .05 + .015 * layer, (i - 1) * .4, .5)
    for e in range(8):
        t = t0 + e * .25
        if t >= DAY56: break
        if layer >= 1: m.add(t, bass(hz(ch[0] - 12 + (12 if e % 2 else 0))), .2, 0, .1)
        if layer >= 2 and e in (0, 4): m.add(t, kick(), .4, 0, .1)
        if layer >= 2 and e in (2, 6): m.add(t, snap(), .12, .2, .3)
        if layer >= 3: m.add(t, hat(), .05, .3, .1)
        m.add(t, pluck(hz(THEME[(bar * 8 + e) % 16] + (12 if layer >= 2 else 0)), .35), .07 + .02 * layer, (-.3, .3)[e % 2], .4)

# a soft clock tick each day, and the day counter's little bump
for d in range(2, 57):
    t = day_t(d)
    m.add(t, osc('sine', 2400 if d % 2 else 1800, .025, a=.001, d=.02, s=0, r=0), .05, (-.4, .4)[d % 2], .1)
# restorations: home, bunting, fountain, lighthouse; dust piles pop
for d in [6, 14, 22, 30, 38, 18, 44, 48]:
    t = day_t(d); m.add(t, pop(.9), .25, 0, .3); m.sparkle(t + .02, 84, 6, .07)
for d in [2, 3, 5, 8, 10, 13, 16, 20, 25]: m.add(day_t(d), pop(1.3), .12, rs.uniform(-.5, .5), .2)
# season changes
for d in (15, 29, 43): t = day_t(d); m.add(t - .5, swell(.5), .3, 0, .5); m.add(t, cymbal(1.5), .12, 0, .6)

# finale: a hush, then the Glimmerwell
m.add(DAY56 - .6, riser(.6, 300, 2000), .35, 0, .4)
m.add(DAY56, boom(), .7, 0, .6); m.add(DAY56, kick(1.5), .6, 0, .2); m.add(DAY56, cymbal(2.5), .3, 0, .8)
for i, n in enumerate([53, 60, 65, 69, 72, 77]): m.add(DAY56, pad(hz(n + 12), 2.6, a=.05, r=1.0, k=20), .07, (i - 2.5) * .25, .8)
m.sparkle(DAY56 + .1, 84, 7, .1)
for i, n in enumerate([77, 81, 84, 89]): m.add(DAY56 + .4 + i * .15, bell(hz(n), 1.6), .1, (i - 1.5) * .3, .7)
for i, te in enumerate([.5, .9, 1.3, 1.7, 2.0]): m.add(DAY56 + te, pop(.55), .25, (i % 3 - 1) * .5, .6); m.sparkle(DAY56 + te + .05, 88, 4, .04)
m.write(os.path.join(HERE, 'timelapse.wav'), fade_out=.3)
print('ok')
