"""v3 soundtrack: harder chip-pop with 808s, claps, risers and a silence before every drop.
python3 audio3.py <A|B|C|H> out.wav [sfx.json]
"""
import json, sys
import numpy as np
import audio as a

SR, B = a.SR, a.B
rng = np.random.default_rng(11)


def kick808(g=1.0):
    n = int(0.55 * SR); t = np.arange(n) / SR
    f = 46 + 160 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5)
    click = a.hp_fast(rng.uniform(-1, 1, n), 3000) * np.exp(-t * 300) * 0.5
    return np.tanh((body + click) * 1.8) * 0.6 * g


def clap(g=1.0):
    n = int(0.25 * SR); t = np.arange(n) / SR
    nz = rng.uniform(-1, 1, n)
    env = np.zeros(n)
    for k, off in enumerate((0, 0.011, 0.022)):
        i = int(off * SR); env[i:] += np.exp(-(t[: n - i]) * (60 if k < 2 else 16))
    bp = a.hp_fast(a.lp_fast(nz, 2600), 900)
    return bp * env * 0.55 * g


def ohat(g=1.0):
    n = int(0.18 * SR); t = np.arange(n) / SR
    return a.hp_fast(rng.uniform(-1, 1, n), 7000) * np.exp(-t * 18) * 0.12 * g


def sub(m, dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * a.hz(m) * t)
    return np.tanh(s * 2.2) * a.env(n, a=0.003, d=0.4, s=0.6, r=0.05) * 0.35 * g


def riser(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    k = t / dur
    nz = a.hp_fast(rng.uniform(-1, 1, n), 1500) * k ** 2 * 0.25
    sq = a.square(a.hz(60), n, 0.25, slide=a.hz(96)) * k ** 1.6 * 0.06
    return (nz + sq) * g


class Mix:
    def __init__(self, beats):
        self.secs = beats * B
        self.drums = a.Bus(self.secs)
        self.music = a.Bus(self.secs)
        self.kicks = []

    def kick(self, t, g=1.0):
        self.drums.add(t, kick808(g)); self.kicks.append(t)


def drums(m, t0, beats, style):
    for k in range(int(round(beats * 4))):  # 16ths
        t = t0 + k * B / 4
        pos = k % 16  # within a bar
        if style in ('groove', 'groove2', 'drop', 'hook'):
            if pos in (0, 6, 10) or (style == 'drop' and pos == 14):
                m.kick(t)
            if pos in (4, 12):
                m.drums.add(t, clap(1.0 if style == 'drop' else 0.8), 1.0, 0.5)
            if style in ('groove2', 'drop') or pos % 2 == 0:
                m.drums.add(t, a.hat(1.0 if pos % 4 == 2 else 0.55), 1.0, 0.65)
            if style == 'drop' and pos == 14:
                m.drums.add(t, ohat(), 1.0, 0.35)
        elif style == 'light':
            if pos % 2 == 0:
                m.drums.add(t, a.hat(0.5), 1.0, 0.65)
            if pos == 0:
                m.drums.add(t, kick808(0.5))


def bassline(m, t0, beats, sub808=False):
    for bar in range(int(np.ceil(beats / 4))):
        ch = a.PROG[bar % 4]
        for k in range(8):
            t = t0 + bar * 4 * B + k * B / 2
            if t - t0 >= beats * B - 1e-6:
                break
            if sub808:
                if k in (0, 3, 5):
                    m.music.add(t, sub(ch[0] - 24, B * 0.9))
            else:
                m.music.add(t, a.bass(ch[0] - 24 + (12 if k % 2 else 0), B / 2 * 0.9))


def arps(m, t0, beats, g=1.0):
    for k in range(int(round(beats * 4))):
        t = t0 + k * B / 4
        ch = a.PROG[(k // 16) % 4]
        m.music.add(t, a.arp_note(ch[k % 3] + 24, B / 4) * g, 1.0, 0.3 if k % 2 else 0.7)


def melody(m, t0, beats, alt=False, g=1.0):
    for bar in range(int(np.ceil(beats / 4))):
        mel = (a.MEL2 if alt else a.MEL)[bar % 4]
        for k in range(8):
            t = t0 + bar * 4 * B + k * B / 2
            if t - t0 >= beats * B - 1e-6:
                break
            n = mel[k]
            if n is None:
                continue
            L = 1
            while k + L < 8 and mel[k + L] is None:
                L += 1
            m.music.add(t, a.lead(n, B / 2 * L * 0.95, g=g * 1.2), 1.0, 0.5)
            m.music.add(t, a.lead(n + 12, B / 2 * L * 0.9, duty=0.125, g=g * 0.35), 1.0, 0.4)


def section(m, t0, beats, style, alt=False):
    if style == 'hook':
        drums(m, t0, beats, 'hook'); bassline(m, t0, beats, sub808=True)
        for i, n in enumerate([72, 76, 79, 84]):
            m.music.add(t0 + i * B / 4, a.arp_note(n, 0.2) * 2.5)
    elif style == 'groove':
        drums(m, t0, beats, 'groove'); bassline(m, t0, beats); arps(m, t0, beats, 0.8)
    elif style == 'groove2':
        drums(m, t0, beats, 'groove2'); bassline(m, t0, beats); arps(m, t0, beats, 1.0)
        m.music.add(t0, riser(beats * B, 0.6))
    elif style == 'build':
        total = beats * B; t = 0.0
        while t < total - 0.01:
            k = t / total
            step = B / 4 if k < 0.5 else B / 8
            m.drums.add(t0 + t, a.snare(0.9 + 1.6 * k), 1.0, 0.5)
            t += step
        for b in range(int(np.ceil(beats))):
            if b * B < total - 0.01: m.kick(t0 + b * B, 0.9)
        bassline(m, t0, beats)
        m.music.add(t0, riser(total, 1.8)); arps(m, t0, beats, 1.0)
    elif style == 'drop':
        m.music.add(t0, a.bell(48, 2.5, 1.5))
        drums(m, t0, beats, 'drop'); bassline(m, t0, beats, sub808=True); arps(m, t0, beats, 0.9); melody(m, t0, beats, alt)
    elif style == 'cute':
        drums(m, t0, beats, 'light')
        for k in range(int(beats * 2)):
            ch = a.PROG[(k // 8) % 4]
            m.music.add(t0 + k * B / 2, a.bell([ch[0], ch[1], ch[2], ch[1]][k % 4] + 24, 1.0, 0.8), 1.0, 0.35 if k % 2 else 0.65)
    elif style == 'tension':
        for k in range(int(beats)):
            m.music.add(t0 + k * B, a.sfx('blip', {'pitch': 0.5, 'gain': 1.6})[0])
        n = int(beats * B * SR)
        m.music.add(t0, np.sin(2 * np.pi * 55 * np.arange(n) / SR) * 0.06)
    elif style == 'outro':
        drums(m, t0, max(0, beats - 2), 'groove'); arps(m, t0, max(0, beats - 2), 0.7); melody(m, t0, max(0, beats - 2), True, 0.8)
        tf = t0 + (beats - 2) * B
        for i, n in enumerate([60, 64, 67, 72, 76, 79, 84]):
            m.music.add(tf + i * 0.035, a.arp_note(n + 12, 0.25) * 2.0)
        for n in [72, 76, 79, 84]:
            L = int(1.5 * SR)
            m.music.add(tf, a.square(a.hz(n), L, 0.25, vib=0.01) * a.env(L, d=0.4, s=0.5, r=0.5, hold=0.85) * 0.08)
        m.kick(tf, 1.2); m.music.add(tf, a.bell(48, 2.5, 1.4))
    elif style == 'silence':
        pass
    elif style == 'roomtone':
        n = int(beats * B * SR)
        m.music.add(t0, a.lp_fast(rng.uniform(-1, 1, n), 400) * 0.012)
    elif style == 'chime':
        for i, n in enumerate([72, 76, 79, 84, 88]):
            m.music.add(t0 + i * 0.12, a.bell(n, 2.5, 0.9))


ARR = {
    'A': [(0, 2, 'hook'), (2, 10, 'groove'), (10, 14, 'groove2'), (14, 16, 'build'), (16, 17, 'silence'), (17, 25, 'drop'), (25, 29, 'drop', True), (29, 34.5, 'outro'), (34.5, 35, 'silence')],
    'H': [(0, 2, 'hook'), (2, 10, 'groove'), (10, 14, 'groove2'), (14, 16, 'build'), (16, 17, 'silence'), (17, 25, 'drop'), (25, 31, 'drop', True), (31, 37, 'outro')],
    'B': [(0, 3, 'cute'), (3, 8, 'tension'), (8, 9, 'silence'), (9, 13, 'groove'), (13, 15, 'groove2'), (15, 17, 'build'), (17, 18, 'silence'), (18, 22, 'drop'), (22, 24.5, 'cute'), (24.5, 25, 'silence')],
    'C': [(0, 2, 'groove'), (2, 5.5, 'build'), (5.5, 6, 'silence'), (6, 8, 'drop'), (8, 9, 'build'), (9, 11, 'drop', True), (11, 12, 'build'), (12, 14, 'drop'), (14, 15, 'build'), (15, 17, 'drop', True), (17, 22, 'outro')],
}
ARR['A4'] = [(0, 2, 'hook'), (2, 10, 'groove'), (10, 14, 'groove2'), (14, 16, 'build'), (16, 17, 'silence'), (17, 21, 'drop'), (21, 23, 'drop', True),
             (23, 25, 'groove'), (25, 31, 'groove'), (31, 34, 'groove2'), (34, 35, 'build'), (35, 36, 'silence'), (36, 44, 'drop'), (44, 48, 'drop', True),
             (48, 52, 'groove'), (52, 56, 'cute'), (56, 58, 'groove'), (58, 66, 'outro'), (66, 70, 'cute')]
ARR['H4'] = ARR['A4'][:-2] + [(58, 70, 'outro')]
ARR['B4'] = [(0, 3, 'cute'), (3, 8, 'tension'), (8, 9, 'silence'), (9, 13, 'groove'), (13, 15, 'groove2'), (15, 17, 'build'), (17, 18, 'silence'),
             (18, 22, 'drop'), (22, 25, 'drop', True), (25, 27, 'groove'), (27, 31, 'tension'), (31, 32, 'silence'), (32, 36, 'groove'), (36, 39, 'groove2'),
             (39, 41, 'build'), (41, 42, 'silence'), (42, 50, 'drop'), (50, 55, 'cute'), (55, 62, 'groove'), (62, 69.5, 'cute'), (69.5, 70, 'silence')]
ARR['C4'] = [(0, 2, 'groove'), (2, 5.5, 'build'), (5.5, 6, 'silence'), (6, 10, 'drop'), (10, 13.5, 'build'), (13.5, 14, 'silence'), (14, 18, 'drop', True),
             (18, 21.5, 'build'), (21.5, 22, 'silence'), (22, 26, 'drop'), (26, 29.5, 'build'), (29.5, 30, 'silence'), (30, 34, 'drop', True),
             (34, 35, 'build'), (35, 45, 'drop'), (45, 53, 'cute'), (53, 57, 'groove'), (57, 61, 'drop', True), (61, 70, 'outro')]
ARR['G5'] = [(0, 4, 'cute'), (4, 7, 'silence'), (7, 15, 'groove'), (15, 21, 'groove2'), (21, 25, 'build'), (25, 26, 'silence'), (26, 30, 'drop'), (30, 38, 'cute'), (38, 48, 'outro')]
ARR['T5'] = [(0, 4, 'cute'), (4, 6, 'groove'), (6, 14, 'groove'), (14, 20, 'groove2'), (20, 24, 'build'), (24, 25, 'silence'), (25, 33, 'drop'), (33, 41, 'groove'), (41, 48, 'outro')]
ARR['M5'] = [(0, 40, 'roomtone'), (40, 41, 'chime'), (41, 50, 'roomtone')]
BEATS = {'G5': 48, 'T5': 48, 'M5': 50, 'A': 35, 'H': 37, 'B': 25, 'C': 22, 'A4': 70, 'H4': 70, 'B4': 70, 'C4': 70}


def render(fmt, sfx_path=None):
    m = Mix(BEATS[fmt])
    for row in ARR[fmt]:
        s, e, style = row[:3]
        section(m, s * B, e - s, style, alt=len(row) > 3)
    # sidechain the music under each kick
    duck = np.ones(m.music.n)
    L = int(0.22 * SR); shape = 1 - 0.55 * np.exp(-np.arange(L) / SR * 14)
    for t in m.kicks:
        i = int(t * SR); j = min(m.music.n, i + L); duck[i:j] = np.minimum(duck[i:j], shape[: j - i])
    bus = a.Bus(m.secs)
    bus.L = m.music.L * duck + m.drums.L; bus.R = m.music.R * duck + m.drums.R
    if sfx_path:
        for e in json.load(open(sfx_path))['sfx']:
            s, pre = a.sfx(e['name'], e)
            bus.add(e['t'] - pre, s * 1.7, 1.0, 0.5)
    return a.master(bus, m.secs)


if __name__ == '__main__':
    fmt, out = sys.argv[1], sys.argv[2]
    L, R = render(fmt, sys.argv[3] if len(sys.argv) > 3 else None)
    a.write(out, L, R)
    print(out)
