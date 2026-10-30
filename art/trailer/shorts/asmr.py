"""Foley for asmr.html: no music. Broom bristles panned with each stroke, cloth wipes, glass glints, water drops,
a quiet room tone and Puff's tiny sneeze. Times match asmr.html."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
from synth import *

DUR = 20.0
m = Mix(DUR)
BRUSH = [(.6, 1.9, 1), (2.1, 3.4, -1), (3.6, 5.0, 1)]
WIPES = [(6.1, 7.5, 1), (7.8, 9.2, -1)]
DROPS = [10.5, 11.2, 11.9, 12.5, 13.0, 13.4]
BLINK, SNEEZE = 15.7, 17.2

# room tone: very soft, warm noise all the way through
m.add(0, smooth(noise(DUR), 120) * 2.5, .06, 0, .2)

def panned(t0, d, sig_fn, direction, g, pieces=12):
    """Play a long sound in short slices whose pan follows the stroke left↔right."""
    for i in range(pieces):
        k = (i + .5) / pieces
        m.add(t0 + i * d / pieces, sig_fn(d / pieces * 1.6), g * np.sin(np.pi * k) ** .5, direction * (2 * k - 1) * .85, .15)

for a, b, d in BRUSH:
    panned(a, b - a, lambda x: brush(x, 2), d, .55)                       # crisp bristles
    panned(a, b - a, lambda x: smooth(noise(x), 30) * 2, d, .25)          # the body of the sweep
    m.add(b - .1, pop(.5), .06, d * .6, .3)                                # the brush lifts
for t in (.9, 2.4, 3.9, 4.6): m.add(t, bell(hz(96), .9), .025, rs.uniform(-.5, .5), .7)   # dust motes catching light

for a, b, d in WIPES:
    panned(a, b - a, lambda x: smooth(noise(x), 8) * (1 + .5 * np.sin(np.linspace(0, 60, int(x * SR)))), d, .4, 16)  # cloth on glass
    m.add(b, osc('sine', 2900, .25, a=.002, d=.2, s=0, r=.02), .04, d * .6, .5)                                         # squeak
m.add(9.3, sweep(2000, 5200, .6, 1) * np.exp(-tt(.6) * 4), .05, 0, .7); m.sparkle(9.6, 91, 5, .05)                  # glint

for i, t in enumerate(DROPS):
    x = tt(.35); plink = np.sin(2 * np.pi * np.cumsum(1400 * np.exp(-x * 18) + 600 + 120 * i) / SR) * np.exp(-x * 14)
    m.add(t, plink, .35, rs.uniform(-.6, .6), .6)
    m.add(t, smooth(noise(.6, 6), 6), .08, 0, .5)
x = tt(4.4); m.add(10.2, smooth(rs.uniform(-1, 1, len(x)), 4) * (.5 + .5 * np.sin(x * 23) * np.sin(x * 7)) * np.minimum(1, x), .05, 0, .5)  # trickle

for t in (10.2, 14.6): m.add(t - .4, smooth(noise(.8), 60) * np.sin(np.pi * tt(.8) / .8) ** 2 * 3, .1, 0, .6)   # soft transition air
m.add(BLINK, osc('sine', 3200, .02, a=.001, d=.015, s=0, r=0), .05)
x = tt(.35); m.add(SNEEZE - .3, sweep(500, 900, .3) * np.exp(-x[:len(tt(.3))] * 3) * .5, .05, 0, .3)   # tiny inhale
x = tt(.25); m.add(SNEEZE, smooth(rs.uniform(-1, 1, len(x)), 2) * np.exp(-x * 16) + sweep(1600, 700, .25, 1) * np.exp(-x * 20) * .5, .3, 0, .3)
m.sparkle(SNEEZE + .05, 88, 5, .04)
for i, n in enumerate([72, 76, 79, 84]): m.add(18.2 + i * .3, bell(hz(n), 1.8), .06, (i - 1.5) * .3, .8)
m.write(os.path.join(HERE, 'asmr.wav'), fade_in=.02, fade_out=.4)
print('ok')
