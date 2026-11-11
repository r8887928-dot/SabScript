"""Original procedural score: one generator per mood, rendered to fit its window on the timeline."""
import numpy as np
from dsp import *  # noqa


# ------------------------------------------------------------------ instruments (mono)
def pad(midis, d, bright=1800, detune=0.008, att=0.6, rel=0.8, seed=0):
    n = int(d * SR)
    y = np.zeros(n)
    r = rng(seed)
    for m in midis:
        f = mtof(m)
        for k in (-1, 0, 1):
            y += osc(f * (1 + k * detune), d, 'saw', phase0=r.uniform()) * 0.33
    y = lp(y, bright, 2)
    return y * adsr(n, att, 0.2, 0.85, rel) / max(1, len(midis))


def pluck(m, d=0.6, bright=0.6, seed=0):
    return ks(mtof(m), d, bright, seed) * expdec(int(d * SR), d * 0.5)


def piano(m, d=1.5, vel=1.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    y = np.zeros(n)
    for k, a in [(1, 1), (2, 0.45), (3, 0.2), (4, 0.12), (5, 0.06)]:
        fk = f * k * (1 + 0.0004 * k * k)
        y += a * np.sin(2 * np.pi * fk * t) * np.exp(-t * (0.8 + k * 0.9) * (f / 440) ** 0.3)
    y += lp(noise(0.02, int(m)), 3000)[: min(n, int(0.02 * SR))].sum() * 0
    y *= adsr(n, 0.003, 0.05, 1, 0.08)
    return y * vel


def glock(m, d=0.8):
    return bell(mtof(m), d, partials=((1, 1), (2.76, 0.3), (5.4, 0.1)), tau=0.5)


def bass(m, d, kind='sine', cut=500):
    n = int(d * SR)
    f = mtof(m)
    y = osc(f, d, 'sine') + (osc(f, d, 'saw') * 0.4 if kind == 'saw' else 0) + osc(f * 2, d, 'sine') * 0.15
    return lp(softclip(y, 1.5), cut) * adsr(n, 0.005, 0.08, 0.8, 0.05)


def pizz(m, d=0.3, seed=0):
    return ks(mtof(m), d, 0.25, seed, 0.99) * expdec(int(d * SR), 0.12) * 1.3


def reed(m, d, cut=1400):
    """comic bassoon-ish staccato"""
    n = int(d * SR)
    f = mtof(m)
    y = osc(f, d, 'square', 0.3) * 0.6 + osc(f, d, 'saw') * 0.4
    return lp(y, cut) * adsr(n, 0.01, 0.04, 0.7, 0.04)


def stringstab(midis, d, cut=2200, seed=0):
    n = int(d * SR)
    y = sum(osc(mtof(m) * (1 + 0.004 * k), d, 'saw') for m in midis for k in (-1, 1))
    return lp(y, cut) * adsr(n, 0.008, 0.06, 0.5, 0.05) / len(midis)


def brass(midis, d, cut=900):
    n = int(d * SR)
    y = sum(osc(mtof(m) * (1 + 0.003 * k), d, 'saw') for m in midis for k in (-1, 0, 1))
    env = adsr(n, 0.08, 0.2, 0.8, 0.3)
    return sweep_lp(y, cut * (0.4 + 0.8 * env)) * env / len(midis)


def kick(d=0.4, f0=150, f1=45):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    return softclip(osc(f, kind='sine') * np.exp(-t / 0.18) * 1.4, 1.5)


def snare(d=0.25, seed=0):
    n = int(d * SR)
    t = np.arange(n) / SR
    return bp(noise(d, seed), 1500, 7000) * np.exp(-t / 0.06) * 0.8 + osc(185, d, 'sine') * np.exp(-t / 0.05) * 0.6


def hat(d=0.05, seed=0, open_=False):
    n = int(d * SR)
    return hp(noise(d, seed), 7000) * expdec(n, 0.12 if open_ else 0.015) * 0.5


def clap(seed=0):
    d = 0.3
    n = int(d * SR)
    t = np.arange(n) / SR
    e = sum(np.exp(-np.clip(t - k * 0.01, 0, None) / 0.01) * (t >= k * 0.01) for k in range(3)) + np.exp(-t / 0.08) * 0.5
    return bp(noise(d, seed), 900, 5000) * e * 0.6


def taiko(d=1.2, f0=95):
    n = int(d * SR)
    t = np.arange(n) / SR
    y = osc(f0 * (1 + 0.3 * np.exp(-t / 0.03)), kind='sine') * np.exp(-t / 0.35) + lp(noise(d, 9), 600) * np.exp(-t / 0.05) * 0.6
    return softclip(y * 1.3, 1.4)


# ------------------------------------------------------------------ sequencing helpers
class Track:
    def __init__(self, d):
        self.n = int(d * SR) + SR * 4
        self.buf = np.zeros((2, self.n))
        self.d = d

    def add(self, sig, t0, gain=1.0, pan=0.0):
        if t0 >= self.d + 3:
            return
        st = to_stereo(sig, pan) if sig.ndim == 1 else sig
        i = int(t0 * SR)
        m = min(st.shape[1], self.n - i)
        if m > 0:
            self.buf[:, i:i + m] += st[:, :m] * gain

    def out(self, rt=1.6, mix=0.22, tone=6000):
        y = reverb(self.buf, rt=rt, mix=mix, tone=tone)
        return y[:, : int(self.d * SR)]


def chords_of(names):
    out = []
    for nm in names:
        root = n2m(nm.rstrip('m7') + '3') if not nm[-1].isdigit() else n2m(nm)
        minor = 'm' in nm[1:]
        out.append([root, root + (3 if minor else 4), root + 7])
    return out


# ------------------------------------------------------------------ moods
def m_hook(d, seed=1):
    T = Track(d)
    bpm = 120
    b = 60 / bpm
    T.add(pad([n2m('A1'), n2m('E2'), n2m('A2')], d, bright=500, att=0.05, rel=0.4), 0, 0.9)
    for i in range(int(d / (b / 2))):
        T.add(bass(n2m('A1'), b / 2 * 0.9, 'saw', 300), i * b / 2, 0.55 * (0.6 + 0.4 * (i % 2 == 0)))
    for i in range(int(d / b)):
        T.add(kick(), i * b, 0.8)
    trem = osc(mtof(n2m('A5')), d, 'saw') * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 12 * T_(d))))
    T.add(lp(trem, 3000) * np.linspace(0, 1, len(trem)) ** 2 * 0.12, 0, 1, 0.3)
    return T.out(1.8, 0.25)


def T_(d):
    return np.arange(int(d * SR)) / SR


def m_morning(d, seed=2):
    T = Track(d)
    bpm = 104
    b = 60 / bpm
    prog = [[n2m('C4'), n2m('E4'), n2m('G4')], [n2m('G3'), n2m('B3'), n2m('D4')], [n2m('A3'), n2m('C4'), n2m('E4')], [n2m('F3'), n2m('A3'), n2m('C4')]]
    bar = 4 * b
    nbar = int(np.ceil(d / bar))
    mel = [n2m(x) for x in ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'C5', 'A4', 'C5', 'D5', 'E5', 'D5', 'C5']]
    for k in range(nbar):
        ch = prog[k % 4]
        t0 = k * bar
        T.add(pad(ch, bar + 0.4, bright=2500, att=0.3), t0, 0.35)
        T.add(bass(ch[0] - 12, bar * 0.95, 'sine', 400), t0, 0.5)
        arp = [ch[0], ch[1], ch[2], ch[1] + 12 if False else ch[2] + 5, ch[0] + 12, ch[2], ch[1], ch[2]]
        for j in range(8):
            T.add(pluck(arp[j] + 12, 0.5, 0.7, seed + j), t0 + j * b / 2, 0.32, -0.3 + 0.6 * (j % 2))
        for j in range(4):
            T.add(glock(mel[(k * 4 + j) % len(mel)] + 12, 0.6), t0 + j * b, 0.12, 0.2)
            T.add(hat(0.05, j), t0 + j * b + b / 2, 0.25, 0.4)
        T.add(kick(0.3, 120, 50), t0, 0.35)
        T.add(kick(0.3, 120, 50), t0 + 2 * b, 0.3)
    y = T.out(1.6, 0.22)
    return y


def m_twist(d, seed=3):
    T = Track(d)
    T.add(pad([n2m('A1'), n2m('D#2'), n2m('A2')], d, bright=400, att=1.2, rel=1.0), 0, 0.9)
    T.add(pad([n2m('A5'), n2m('A#5')], d, bright=5000, att=2.0, rel=1.0, detune=0.003), 0.8, 0.12)
    for t0 in np.arange(0.3, d, 0.9):
        T.add(kick(0.5, 80, 38), t0, 0.7)
        T.add(kick(0.5, 70, 36), t0 + 0.22, 0.45)
    return T.out(3.0, 0.35, 3500)


def m_interlude(d, seed=4, key='A'):
    """the experiment clock: pulse that builds into the chapter slam"""
    T = Track(d)
    bpm = 120
    b = 60 / bpm
    root = n2m(key + '1')
    nb = int(d / b) + 1
    for i in range(nb * 2):
        t0 = i * b / 2
        k = t0 / d
        T.add(bass(root + (0 if (i // 8) % 2 == 0 else 3), b / 2 * 0.85, 'saw', 280 + 900 * k), t0, 0.5 + 0.3 * k)
    for i in range(nb):
        T.add(kick(0.35, 140, 45), i * b, 0.6 + 0.3 * (i / nb))
        if i % 2 == 1:
            T.add(snare(0.22, i), i * b, 0.25 + 0.25 * (i / nb))
    for i in range(nb * 4):
        T.add(hat(0.04, i), i * b / 4, 0.18 + 0.12 * (i % 2 == 0))
    for i in range(0, nb, 2):
        T.add(stringstab([root + 24, root + 27, root + 31], 0.35, 2400), i * b, 0.25, 0.2)
    T.add(pad([root + 36, root + 39, root + 43], d, bright=1500, att=1.0, rel=0.3), 0, 0.15)
    return T.out(1.4, 0.2)


def m_comedy(d, seed=5):
    """quirky pizzicato + bassoon, slightly off-kilter"""
    T = Track(d)
    bpm = 128
    b = 60 / bpm
    nb = int(d / b) + 1
    line = ['D3', 'A2', 'D3', 'A2', 'C3', 'G2', 'C3', 'G2', 'Bb2', 'F2', 'Bb2', 'F2', 'A2', 'E2', 'A2', 'C#3']
    mel = ['D5', None, 'F5', 'E5', None, 'D5', 'C#5', None, 'D5', 'A4', None, 'Bb4', 'A4', None, 'G#4', 'A4']
    for i in range(nb):
        t0 = i * b
        T.add(reed(n2m(line[i % 16]), b * 0.4), t0, 0.5, -0.2)
        T.add(pizz(n2m(line[i % 16]) + 12, 0.25, i), t0 + b / 2, 0.45, 0.3)
        m = mel[i % 16]
        if m:
            T.add(pizz(n2m(m), 0.3, i + 50), t0, 0.5, 0.15)
            T.add(glock(n2m(m) + 12, 0.4), t0, 0.07, 0.4)
        T.add(kick(0.25, 110, 50), t0, 0.35 if i % 2 == 0 else 0.0)
        if i % 2 == 1:
            T.add(clap(i), t0, 0.22)
        if i % 4 == 3:
            T.add(bell(mtof(n2m('E6')), 0.25, tau=0.12), t0 + b * 0.75, 0.08, -0.5)
    return T.out(1.2, 0.18)


def m_tension(d, seed=6):
    T = Track(d)
    bpm = 140
    b = 60 / bpm
    nb = int(d / b) + 1
    prog = [['C3', 'Eb3', 'G3'], ['Ab2', 'C3', 'Eb3'], ['Bb2', 'D3', 'F3'], ['G2', 'B2', 'D3']]
    for i in range(nb * 2):
        t0 = i * b / 2
        ch = [n2m(x) for x in prog[(i // 8) % 4]]
        k = t0 / d
        T.add(stringstab([c + 12 for c in ch], b / 2 * 0.7, 1800 + 2000 * k, i), t0, 0.32 + 0.15 * k, -0.2 + 0.4 * (i % 2))
        T.add(bass(ch[0] - 12, b / 2 * 0.8, 'saw', 350), t0, 0.45)
    for i in range(nb):
        T.add(kick(0.35, 130, 45), i * b, 0.55 if i % 2 == 0 else 0.3)
        if i % 4 == 2:
            T.add(snare(0.25, i), i * b, 0.35)
        if i % 8 == 7:
            T.add(taiko(0.9, 110), i * b, 0.5)
        T.add(hat(0.04, i), i * b + b / 2, 0.2)
    T.add(pad([n2m('C5'), n2m('G5')], d, 2500, att=2.0), 0, 0.1)
    return T.out(1.6, 0.22)


def m_heavy(d, seed=7):
    T = Track(d)
    bpm = 90
    b = 60 / bpm
    nb = int(d / b) + 1
    prog = [['D2', 'F2', 'A2'], ['Bb1', 'D2', 'F2'], ['C2', 'E2', 'G2'], ['A1', 'C#2', 'E2']]
    for k in range(int(np.ceil(d / (4 * b)))):
        ch = [n2m(x) for x in prog[k % 4]]
        T.add(brass([c + 12 for c in ch], 4 * b * 0.95, 1100), k * 4 * b, 0.4)
        T.add(bass(ch[0], 4 * b * 0.9, 'saw', 220), k * 4 * b, 0.6)
    for i in range(nb):
        if i % 2 == 0:
            T.add(taiko(1.0, 85), i * b, 0.75)
        else:
            T.add(taiko(0.6, 140), i * b + b / 2, 0.35)
        T.add(hat(0.05, i, True), i * b + b / 2, 0.12)
    T.add(pad([n2m('D5'), n2m('Eb5')], d, 3000, att=1.5, detune=0.002), 0, 0.06, 0.4)
    return T.out(2.2, 0.28, 4000)


def m_glitchy(d, seed=8):
    T = Track(d)
    bpm = 120
    b = 60 / bpm
    nb = int(d / b) + 1
    r = rng(seed)
    arp = [n2m(x) for x in ['E4', 'G4', 'B4', 'E5', 'D5', 'B4', 'G4', 'F#4']]
    for i in range(nb * 4):
        t0 = i * b / 4
        m = arp[i % 8]
        s = osc(mtof(m), b / 4 * 0.8, 'square', 0.3)
        s = np.round(s * 3) / 3
        s = lp(s, 3500) * adsr(len(s), 0.003, 0.05, 0.4, 0.02)
        rep = 2 if r.uniform() < 0.12 else 1
        for q in range(rep):
            T.add(s, t0 + q * b / 8, 0.22, -0.4 + 0.8 * r.uniform())
    for i in range(nb):
        T.add(kick(0.3, 150, 45), i * b, 0.6)
        if i % 2 == 1:
            T.add(snare(0.2, i) * 0.8, i * b, 0.3); T.add(clap(i) * 0.5, i * b, 0.3)
        T.add(hat(0.03, i), i * b + b / 2, 0.22)
        T.add(bass(n2m('E1') + (0 if (i // 4) % 2 == 0 else 3), b * 0.9, 'saw', 400), i * b, 0.45)
    y = T.out(1.0, 0.15)
    # sidechain pump
    t = np.arange(y.shape[1]) / SR
    pump = 0.6 + 0.4 * np.clip(((t % b) / b) * 3, 0, 1)
    return y * pump


def m_sad(d, seed=9):
    T = Track(d)
    bpm = 70
    b = 60 / bpm
    prog = [['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['C3', 'E3', 'G3'], ['G2', 'B2', 'D3']]
    mel = ['E5', 'D5', 'C5', 'B4', 'C5', 'A4', 'G4', 'E4']
    for k in range(int(np.ceil(d / (4 * b)))):
        ch = [n2m(x) for x in prog[k % 4]]
        t0 = k * 4 * b
        T.add(pad([c + 12 for c in ch], 4 * b + 0.6, bright=1400, att=0.8), t0, 0.3)
        T.add(piano(ch[0] - 12, 3.5, 0.5), t0, 0.5, -0.2)
        for j, c in enumerate([ch[0], ch[1], ch[2], ch[1]]):
            T.add(piano(c + 12, 2.0, 0.35), t0 + j * b, 0.4, 0.1)
        T.add(piano(n2m(mel[(2 * k) % 8]), 2.0, 0.6), t0, 0.45, 0.25)
        T.add(piano(n2m(mel[(2 * k + 1) % 8]), 2.0, 0.6), t0 + 2 * b, 0.45, 0.25)
    return T.out(2.6, 0.32)


def m_eerie(d, seed=10):
    T = Track(d)
    r = rng(seed)
    T.add(pad([n2m('F#2'), n2m('C#3'), n2m('G3')], d, bright=700, att=2.0, rel=1.5, detune=0.012), 0, 0.5)
    t0 = 0.4
    notes = ['C#6', 'F#5', 'A5', 'G5', 'C#6', 'D6', 'F#5']
    i = 0
    while t0 < d - 0.5:
        T.add(glock(n2m(notes[i % len(notes)]), 2.0) * 0.6 + piano(n2m(notes[i % len(notes)]) - 12, 2.0, 0.3), t0, 0.3, r.uniform(-0.6, 0.6))
        t0 += r.uniform(0.9, 1.6)
        i += 1
    return T.out(3.5, 0.45, 4000)


def m_dark(d, seed=11):
    T = Track(d)
    T.add(pad([n2m('C1'), n2m('C#2'), n2m('G2')], d, bright=300, att=0.5, rel=0.8), 0, 0.8)
    return T.out(3.0, 0.3, 2000)


def m_finale(d, seed=12):
    """hopeful but questioning build, unresolved at the question, then a soft outro"""
    T = Track(d)
    bpm = 96
    b = 60 / bpm
    bar = 4 * b
    prog = [['C3', 'E3', 'G3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['G2', 'B2', 'D3'], ['C3', 'E3', 'G3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3', 'E3'], ['D3', 'F3', 'A3', 'C4']]
    mel = ['G5', 'E5', 'C5', 'E5', 'A5', 'G5', 'E5', 'C5', 'F5', 'E5', 'C5', 'A4', 'B4', 'D5', 'G5', 'F5']
    nbar = int(np.ceil(d / bar))
    for k in range(nbar):
        ch = [n2m(x) for x in prog[min(k, len(prog) - 1)]] if k < len(prog) else [n2m('F2'), n2m('A2'), n2m('C3'), n2m('E3')]
        t0 = k * bar
        g = min(1.0, 0.5 + k * 0.08)
        T.add(pad([c + 12 for c in ch], bar + 0.8, bright=1600 + 300 * k, att=0.6), t0, 0.32 * g)
        T.add(bass(ch[0] - 12, bar * 0.95, 'sine', 380), t0, 0.5 * g)
        for j in range(4):
            T.add(piano(ch[j % len(ch)] + 12, 1.6, 0.5), t0 + j * b, 0.35, 0.15)
            T.add(piano(n2m(mel[(k * 4 + j) % len(mel)]), 1.8, 0.55), t0 + j * b + (b / 2 if j % 2 else 0), 0.3 * g, 0.3)
        if 1 <= k < 6:
            T.add(kick(0.4, 110, 45), t0, 0.35)
            T.add(kick(0.4, 110, 45), t0 + 2 * b, 0.3)
            T.add(taiko(0.8, 100), t0 + 3.5 * b, 0.2 * (k > 2))
        if k >= 3:
            T.add(stringstab([c + 24 for c in ch[:3]], bar * 0.95, 2400), t0, 0.08 * min(1, (k - 2) / 3))
    return T.out(2.6, 0.3)


MOODS = {'hook': m_hook, 'morning': m_morning, 'twist': m_twist, 'interlude': m_interlude, 'comedy': m_comedy, 'tension': m_tension,
         'heavy': m_heavy, 'glitchy': m_glitchy, 'sad': m_sad, 'eerie': m_eerie, 'dark': m_dark, 'finale': m_finale}
LEVEL = {'hook': 0.8, 'morning': 0.75, 'twist': 0.8, 'interlude': 0.8, 'comedy': 0.75, 'tension': 0.8, 'heavy': 0.65, 'glitchy': 0.5, 'sad': 0.8, 'eerie': 0.85, 'dark': 0.8, 'finale': 0.8}
