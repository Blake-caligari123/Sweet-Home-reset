"""The film's single source of truth: Puff's path, the colour blooms and every sound cue, in seconds and in
burrow-painting pixels. Run it to write timeline.json (for score.py) and timeline.js (for film.html).
Times follow the cue map in TREATMENT.md: 100 bpm, a beat is 0.6 s, a bar 2.4 s."""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 36.0
P0 = (430, 650)                     # the dust pile Puff pops out of
D1, D2 = (300, 640), (520, 470)     # the two dust piles Puff sweeps
SOCK, BASKET = (400, 760), (510, 322)
WINDOW, LAMP, BED, PILLOW = (415, 195), (410, 282), (285, 400), (292, 352)

# Puff's acting, as segments: (pose, t0, t1, from, to). Between segments Puff holds the last pose.
SEGS = [
    ('hide',   0.0,  2.0,  P0, P0),
    ('pop',    2.0,  2.35, P0, P0),
    ('waking', 2.35, 3.0,  P0, P0),
    ('look-l', 3.0,  3.6,  P0, P0),
    ('look-r', 3.6,  3.95, P0, P0),
    ('walk',   3.95, 4.2,  P0, (465, 640)),
    ('down',   4.2,  5.15, (465, 640), (465, 640)),
    ('walk',   5.15, 5.4,  (465, 640), (500, 630)),
    ('down',   5.4,  5.75, (500, 630), (500, 630)),
    ('walk',   5.75, 6.0,  (500, 630), (535, 620)),
    ('idle',   6.0,  6.6,  (535, 620), (535, 620)),
    ('hop',    6.6,  7.0,  (535, 620), (535, 620)),
    ('idle',   7.0,  7.8,  (535, 620), (535, 620)),
    # the tidy, one continuous take
    ('walk',   7.8,  9.4,  (535, 620), (350, 645)),
    ('sweep',  9.4,  9.8,  (350, 645), (350, 645)),
    ('walk',   9.8,  10.6, (350, 645), (480, 490)),
    ('sweep',  10.6, 11.0, (480, 490), (480, 490)),
    ('walk',   11.0, 12.3, (480, 490), (412, 735)),
    ('hop',    12.4, 12.8, (412, 735), (412, 735)),          # flips the sock onto its head
    ('carry',  12.8, 14.6, (412, 735), (505, 412)),
    ('hop',    14.8, 15.2, (505, 412), (505, 412)),          # tosses it into the basket
    ('walk',   15.2, 16.4, (505, 412), (452, 400)),
    ('bighop', 16.6, 17.2, (452, 400), (452, 400)),          # wipes the window at the top of the hop
    ('bump',   17.2, 18.0, (452, 400), (440, 402)),          # lands against the nightstand; the lamp clicks on
    ('walk',   18.2, 19.6, (440, 402), (300, 520)),
    ('yawn',   19.8, 21.4, (300, 520), (300, 520)),
    ('idle',   21.4, 22.2, (300, 520), (300, 520)),          # the held breath
    ('hop',    22.2, 22.6, (300, 520), (290, 440)),          # onto the bed
    ('tug',    22.6, 23.4, (290, 440), (290, 440)),
    ('idle',   23.4, 24.6, (290, 440), (290, 440)),
    ('walk',   24.6, 25.8, (290, 440), PILLOW),
    ('curl',   25.8, 27.0, PILLOW, PILLOW),
    ('sleep',  27.0, DUR,  PILLOW, PILLOW),
]

def pos_at(t):
    last = SEGS[0]
    for s in SEGS:
        if s[1] <= t < s[2]:
            k = (t - s[1]) / (s[2] - s[1])
            k = k * k * (3 - 2 * k) if s[0] in ('carry', 'walk') and s[2] - s[1] > .5 else k
            return s[3][0] + (s[4][0] - s[3][0]) * k, s[3][1] + (s[4][1] - s[3][1]) * k
        if s[1] <= t: last = s
    return last[4]

# colour blooms: (t, x, y, radius, grow seconds, kind). Footprints come from the walks, every half beat.
BLOOMS = []
for pose, t0, t1, a, b in SEGS:
    if pose in ('walk', 'carry'):
        n = max(1, round((t1 - t0) / .3))
        for i in range(1, n + 1):
            t = t0 + i * (t1 - t0) / n
            x, y = pos_at(min(t, t1 - 1e-6))
            BLOOMS.append((round(t, 3), round(x), round(y), 38, .5, 'step'))
BLOOMS += [
    (9.6,  *D1, 200, .8, 'poof'), (10.8, *D2, 200, .8, 'poof'),
    (12.6, *SOCK, 130, .7, 'pick'), (15.0, *BASKET, 160, .8, 'plop'),
    (16.9, *WINDOW, 220, .9, 'window'), (18.0, *LAMP, 190, .8, 'lamp'),
    (23.2, *BED, 2400, 2.6, 'flood'),
]
BLOOMS.sort()

# named moments for the picture and the score
CUES = {
    'twitch': [0.4, 1.2], 'pop': 2.0, 'land': 2.35, 'wake': 2.7, 'shiver': 3.9,
    'ooh': 6.6, 'music': 7.8, 'sock_flip': 12.6, 'sock_toss': 14.95, 'sock_in': 15.35,
    'wipe': 16.9, 'birds': 16.5, 'lamp': 18.0, 'yawn': 19.9, 'hush': [21.4, 22.2],
    'bed_hop': 22.2, 'tug': 22.8, 'flood': 23.2, 'curl': 25.8, 'sleep': 27.0, 'one_home': 29.5, 'title': 31.8,
}

data = {'dur': DUR, 'bpm': 100, 'segs': SEGS, 'blooms': BLOOMS, 'cues': CUES,
        'places': {'p0': P0, 'd1': D1, 'd2': D2, 'sock': SOCK, 'basket': BASKET, 'window': WINDOW, 'lamp': LAMP, 'bed': BED, 'pillow': PILLOW}}
text = json.dumps(data, indent=1)
open(os.path.join(HERE, 'timeline.json'), 'w').write(text)
open(os.path.join(HERE, 'timeline.js'), 'w').write('// written by timeline.py: do not edit by hand\nwindow.TL = ' + text + ';\n')
print(len(SEGS), 'segments,', len(BLOOMS), 'blooms')
