"""Storybook score for "The Day the Colour Left" (64 s). Original, synthesized.
python3 audio7.py out.wav [sfx.json]
"""
import json, sys
import numpy as np
import audio as a
import audio3 as a3

SR = a.SR
DUR = 64.0
rng = np.random.default_rng(21)
BEAT = 60 / 96  # 96 bpm


def piano(m, dur=2.5, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = a.hz(m)
    s = (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 2.5) + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 4)
         + 0.08 * np.sin(2 * np.pi * 4.02 * f * t) * np.exp(-t * 6))
    return s * np.exp(-t * 1.6) * np.minimum(1, t * 300) * 0.16 * g


def pad(ms, dur, g=1.0, bright=1800):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for det in (-0.06, 0.0, 0.07):
            ph = np.cumsum(np.full(n, a.hz(m + det))) / SR
            s += 2 * (ph % 1) - 1
    s = a.lp_fast(s / (len(ms) * 3), bright)
    env = np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 0.9)
    return s * env * 0.22 * g


def strings_swell(ms, dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    base = pad(ms, dur, 1.0, bright=2600)
    return base * (t / dur) ** 1.4 * 1.6 * g


def heartbeat(g=1.0):
    n = int(0.5 * SR); t = np.arange(n) / SR
    one = np.sin(2 * np.pi * np.cumsum(50 + 30 * np.exp(-t * 20)) / SR) * np.exp(-t * 14)
    out = one.copy(); k = int(0.18 * SR); out[k:] += one[:-k] * 0.7
    return out * 0.6 * g


def timpani_roll(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = a.lp_fast(rng.uniform(-1, 1, n), 300) * 3 + np.sin(2 * np.pi * 55 * t) * 0.3
    return s * (t / dur) ** 2 * 0.5 * g


def wind(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = a.lp_fast(rng.uniform(-1, 1, n), 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t))
    return s * np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.5) * 0.35 * g


F, C, Dm, Bb, Gm = [53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53], [43, 46, 50]
PROG = [F, C, Dm, Bb]
MEL = [77, 76, 74, 72, 74, 72, 69, None, 70, 72, 74, 77, 76, None, 72, None]  # 8ths over 2 bars


def storybook(bus, t0, t1, mel=True, arps=True, g=1.0, prog=PROG):
    bar = 4 * BEAT; t = t0; b = 0
    while t < t1 - 0.05:
        ch = prog[b % len(prog)]; L = min(bar, t1 - t)
        bus.add(t, pad([m + 12 for m in ch], L + 0.6, 0.9 * g))
        bus.add(t, piano(ch[0] - 12, 3.0, 0.9 * g))
        if arps:
            for k in range(8):
                tk = t + k * BEAT / 2
                if tk >= t1: break
                bus.add(tk, a.bell([ch[0], ch[1], ch[2], ch[1]][k % 4] + 24, 1.2, 0.55 * g), 1.0, 0.3 if k % 2 else 0.7)
        if mel:
            for k in range(8):
                tk = t + k * BEAT / 2
                if tk >= t1: break
                m = MEL[(b % 2) * 8 + k]
                if m is not None: bus.add(tk, piano(m, 1.8, 0.8 * g), 1.0, 0.55)
        t += bar; b += 1


def drums(m, t0, t1, g=1.0):
    t = t0; k = 0
    while t < t1 - 0.01:
        if k % 4 == 0: m.kick(t, 0.55 * g)
        if k % 4 == 2: m.drums.add(t, a3.clap(0.4 * g), 1.0, 0.5)
        m.drums.add(t + BEAT / 2, a.hat(0.4 * g), 1.0, 0.65)
        t += BEAT; k += 1


def score():
    m = a3.Mix(DUR / a.B)  # Mix sizes itself in 140-bpm beats
    mu = m.music
    # 1–2: once upon a time, Puff asleep
    storybook(mu, 0.0, 7.5, mel=False, g=0.8)
    storybook(mu, 7.5, 14.3, mel=True, g=0.9)
    # wind-up: thin to a held high note + rising pizzicato
    mu.add(14.3, pad([77, 81], 2.0, 0.6, bright=2400))
    for i, n in enumerate([72, 74, 76, 77, 79, 81]):
        mu.add(14.4 + i * 0.25, a.arp_note(n + 12, 0.15) * 1.4)
    # 16.3 ACHOO: silence, wind, then one low note
    mu.add(16.6, wind(4.4, 0.9))
    mu.add(18.0, piano(41, 4.0, 1.4)); mu.add(18.0, piano(29, 4.0, 1.0))
    mu.add(19.3, pad([41, 48], 2.2, 0.5, bright=600))
    # 4: one small bunny — heartbeat + minor swell + timpani
    for i, tt in enumerate(np.arange(21.4, 27.4, 0.82)):
        mu.add(tt, heartbeat(0.6 + i * 0.07))
    mu.add(21.2, pad([50, 57, 62], 6.4, 0.7, bright=1200))
    mu.add(24.2, strings_swell([53, 57, 60, 65], 3.4, 0.9))
    mu.add(24.4, timpani_roll(3.2, 0.9))
    mu.add(24.4, piano(65, 3.0, 0.8)); mu.add(25.0, piano(69, 2.6, 0.7)); mu.add(25.6, piano(72, 2.6, 0.7))
    # 5–8: the journey
    storybook(mu, 27.6, 50.0, mel=True, g=1.0)
    drums(m, 27.6, 49.6)
    for tt in (31.2, 34.4, 39.4):
        mu.add(tt - 1.2, strings_swell([65, 69, 72], 1.2, 0.9))
        mu.add(tt, a.bell(84, 2.0, 1.2)); mu.add(tt, a.bell(88, 2.0, 0.9))
    # 9: the promise — soft
    storybook(mu, 50.0, 56.0, mel=False, g=0.75, prog=[Bb, F, C, F])
    for i in range(6):
        mu.add(50.6 + i * 0.45, a.bell(79 + [0, 2, 4, 7, 9, 12][i], 1.6, 0.6))
    # 10: title — big final chord
    for n in [53, 57, 60, 65, 69, 72, 77]:
        mu.add(56.6, piano(n, 6.0, 0.9))
    mu.add(56.6, pad([65, 69, 72, 77], 6.5, 1.0, bright=2600))
    m.kick(56.6, 0.8)
    for i, n in enumerate([84, 88, 91, 96]):
        mu.add(56.7 + i * 0.09, a.bell(n, 2.5, 0.7))
    return m


if __name__ == '__main__':
    out = sys.argv[1]
    m = score()
    bus = a.Bus(m.secs)
    duck = np.ones(m.music.n)
    L = int(0.2 * SR); shape = 1 - 0.3 * np.exp(-np.arange(L) / SR * 14)
    for t in m.kicks:
        i = int(t * SR); j = min(m.music.n, i + L); duck[i:j] = np.minimum(duck[i:j], shape[: j - i])
    bus.L = m.music.L * duck + m.drums.L; bus.R = m.music.R * duck + m.drums.R
    if len(sys.argv) > 2:
        for e in json.load(open(sys.argv[2]))['sfx']:
            s, pre = a.sfx(e['name'], e)
            g = {'sneeze': 1.6, 'scratch': 0.8, 'water': 1.2, 'sparkle': 1.1}.get(e['name'], 0.9)
            bus.add(e['t'] - pre, s * g, 1.0, 0.5)
    # fade out
    n = int(DUR * SR); tt = np.arange(n) / SR
    Lc, Rc = a.master(bus, DUR)
    fade = np.clip((DUR - tt) / 1.5, 0, 1) * np.clip(tt / 0.8, 0, 1)
    a.write(out, Lc * fade, Rc * fade)
    print(out)
