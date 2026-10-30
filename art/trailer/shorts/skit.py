"""Score for skit.html: bouncy comedy plucks, a 'dun dun DUNNN' at the mess reveal, double-speed chiptune for the
speedrun, a record scratch into the freeze frame, then snores and a music box."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
from synth import *

DUR, B, C, D, E, F = 17.0, 2.4, 4.4, 11.0, 12.6, 15.4
m = Mix(DUR)

# A: sneaky pizzicato at 2am, a ding when the idea lands
for i, n in enumerate([57, 60, 64, 60, 57, 60, 64, 67]):
    m.add(i * .14 + .05, pluck(hz(n), .25), .2, (-.3, .3)[i % 2], .2)
m.add(.9, pop(1.5), .15); m.add(1.15, bell(hz(93), 1.0), .25, .3, .4); m.add(1.15, kick(), .3)
m.add(1.35, osc('sq', hz(76), .08, a=.002, d=.05, s=.3, r=.02), .06); m.add(1.45, osc('sq', hz(81), .1, a=.002, d=.05, s=.3, r=.02), .06)

# B: the mess. Three brass-ish hits: dun, dun, DUNNN
def hit(f, d): return sum(pad(f * k, d, a=.01, r=.4, k=6) * a for k, a in ((1, 1), (1.5, .5), (2, .4)))
m.add(B + .05, hit(hz(45), .35), .35, 0, .4); m.add(B + .45, hit(hz(44), .35), .35, 0, .4)
m.add(B + 1.1, hit(hz(43), 1.4), .45, 0, .5); m.add(B + 1.1, boom(1.6), .5, 0, .4)
m.add(B + 1.5, pop(.7), .15)

# C: the speedrun. Chiptune at 240 bpm, an octave up
lead = [76, 79, 81, 84, 81, 79, 76, 72, 74, 76, 79, 76, 74, 72, 69, 72]
ch = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]
step = .125
for k in range(int((D - C) / step)):
    t = C + k * step; c = ch[(k // 8) % 4]
    m.add(t, osc('sq', hz(lead[k % 16] + 12), step * .9, a=.002, d=.04, s=.4, r=.02), .07, -.15, .1)
    m.add(t, osc('tri', hz(c[0] - 12 + (12 if k % 2 else 0)), step * .9, a=.002, d=.05, s=.5, r=.02), .22, 0, .05)
    if k % 4 == 0: m.add(t, kick(), .4, 0, .05)
    if k % 4 == 2: m.add(t, snap(), .12, .2, .1)
    m.add(t, hat(), .04, .3, .05)
m.add(C - .3, sweep(300, 1400, .3) * .3, .2)
for k in range(27): m.add(C + .3 + k * (6.2 / 27), pop(1.2 + (k % 5) * .1), .12, rs.uniform(-.6, .6), .1)
for k in range(18): m.add(C + .2 + k * .36, brush(.15, 2), .1, rs.uniform(-.5, .5), .1)
m.add(D - .5, pad(hz(81), .5, a=.4, r=.05, k=4) * .5, .25, 0, .3)   # the colour flood swell

# D: record scratch, then freeze-frame silence with a soft 'yep'
x = tt(.45); scratch = smooth(rs.uniform(-1, 1, len(x)), 3) * np.abs(np.sin(2 * np.pi * x * 9)) + sweep(900, 120, .45, 1) * .5
m.add(D, scratch * np.exp(-x * 2), .45, 0, .1)
m.add(D + .6, bell(hz(67), .8), .1, 0, .3)

# E: waddle to the pile, flop, snore
for k in range(5): m.add(E + .15 + k * .18, pop(1.8), .05, (-.2, .2)[k % 2], .1)
m.add(E + .95, boing(.45), .2); m.add(E + 1.05, smooth(noise(.4, 8), 6), .3)
for k in range(3):
    t = E + 1.4 + k * 1.3; x = tt(1.0)
    m.add(t, smooth(rs.uniform(-1, 1, len(x)), 40) * np.sin(np.pi * x) ** 2 * 3, .2, 0, .3)          # in
    m.add(t + .6, sweep(1400, 900, .5, 1) * np.sin(np.pi * tt(.5) / .5) * .3, .06, .2, .4)           # whistle out
for i, n in enumerate([69, 72, 76, 72, 74, 71, 67, 69]): m.add(E + 1.2 + i * .45, musicbox(hz(n + 12), 1.6), .14, (i % 3 - 1) * .3, .6)
m.add(F, bell(hz(81), 1.4), .12, 0, .6)
m.write(os.path.join(HERE, 'skit.wav'), fade_out=.4)
print('ok')
