"""Synthesised sound effects. Each generator returns a stereo float array (2, n) peaking around 0.9."""
import numpy as np
from dsp import *  # noqa


def _st(x, pan=0.0, width=0.3, rv=0.0, rt=1.2, seed=0):
    s = to_stereo(x, pan, width, seed)
    if rv > 0:
        s = reverb(s, rt=rt, mix=rv, seed=seed + 11)
    return s


def whoosh(d=0.7, f0=300, f1=3200, f2=700, seed=1, pan=(-0.6, 0.6)):
    n = int(d * SR)
    x = noise(d, seed, 'pink')
    k = np.linspace(0, 1, n)
    fc = np.where(k < 0.6, f0 + (f1 - f0) * (k / 0.6) ** 1.5, f1 + (f2 - f1) * ((k - 0.6) / 0.4))
    y = sweep_bp(x, fc, q=1.4)
    env = np.sin(np.pi * np.clip(k, 0, 1) ** 0.8) ** 2
    y = norm(y * env)
    L = y * np.linspace(0.5 - pan[0] / 2, 0.5 - pan[1] / 2, n) * 1.4
    R = y * np.linspace(0.5 + pan[0] / 2, 0.5 + pan[1] / 2, n) * 1.4
    return reverb(np.stack([L, R]), rt=0.8, mix=0.15)


def whoosh_up(seed=2):
    return whoosh(0.55, 200, 5200, 4000, seed, (-0.2, 0.2))


def riser(d=1.6, seed=3):
    n = int(d * SR)
    k = np.linspace(0, 1, n)
    x = sweep_bp(noise(d, seed, 'white'), 300 + 6000 * k ** 2, q=2.5)
    f = 110 * 2 ** (3 * k ** 1.6)
    s = osc(f * (1 + 0.01 * np.sin(2 * np.pi * (4 + 18 * k) * np.arange(n) / SR)), kind='saw')
    s = lp(s, 3000)
    y = (norm(x) * 0.6 + norm(s) * 0.4) * k ** 2.2
    y = fade(y, 0.01, 0.01)
    return reverb(to_stereo(y, 0, 0.6), rt=1.5, mix=0.2)


def boom(seed=4, d=2.2, f0=95, f1=28):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.18)
    sub = osc(f, kind='sine') * np.exp(-t / 0.7)
    nb = lp(noise(d, seed), 260) * np.exp(-t / 0.12) * 1.5
    y = softclip(sub * 1.2 + nb, 1.8)
    return reverb(to_stereo(norm(y), 0, 0.4), rt=2.4, mix=0.25, tone=2500)


def impact_big(seed=5):
    d = 2.6
    n = int(d * SR)
    t = np.arange(n) / SR
    b = boom(seed, d)[0]
    crack = bp(noise(d, seed + 1), 900, 4500) * np.exp(-t / 0.05)
    ring = sum(a * np.sin(2 * np.pi * fr * t + seed) for fr, a in [(196, 0.5), (311, 0.35), (523, 0.25), (887, 0.15)]) * np.exp(-t / 0.6)
    y = norm(b) + norm(crack) * 0.55 + norm(ring) * 0.25
    return reverb(to_stereo(norm(y), 0, 0.5), rt=2.8, mix=0.28, tone=4000)


def impact_soft(seed=6):
    s = impact_big(seed)
    return np.stack([lp(s[0], 1800), lp(s[1], 1800)]) * 0.8


def glitch(seed=7, d=0.45):
    r = rng(seed)
    n = int(d * SR)
    y = np.zeros(n)
    i = 0
    while i < n:
        m = int(r.uniform(0.012, 0.05) * SR)
        kind = r.integers(0, 4)
        seg_t = np.arange(m) / SR
        if kind == 0:
            seg = np.sign(np.sin(2 * np.pi * r.uniform(200, 2400) * seg_t))
        elif kind == 1:
            seg = r.standard_normal(m)
        elif kind == 2:
            seg = np.round(np.sin(2 * np.pi * r.uniform(60, 600) * seg_t) * 4) / 4
        else:
            seg = np.zeros(m)
        y[i:i + m] = seg[: max(0, min(m, n - i))] * r.uniform(0.3, 1)
        i += m
    y = hp(y, 120)
    st = np.stack([y * r.uniform(0.5, 1), np.roll(y, 37) * r.uniform(0.5, 1)])
    return st * 0.7


def alarm_klaxon(seed=8):
    out = []
    for k in range(2):
        d = 0.55
        n = int(d * SR)
        f = np.linspace(260, 430, n) + 6 * np.sin(np.arange(n) / SR * 2 * np.pi * 30)
        y = softclip(osc(f, kind='saw') * adsr(n, 0.02, 0.05, 0.9, 0.08), 2.5)
        y = bp(y, 300, 3500)
        out += [y, np.zeros(int(0.08 * SR))]
    return reverb(to_stereo(norm(np.concatenate(out)), 0, 0.3), rt=1.0, mix=0.2)


def needle_drop(seed=9):
    d = 1.1
    n = int(d * SR)
    k = np.linspace(0, 1, n)
    f = 1400 * (60 / 1400) ** (k ** 0.8)
    vib = 1 + 0.03 * np.sin(2 * np.pi * 9 * np.arange(n) / SR)
    y = osc(f * vib, kind='square', duty=0.3) * 0.5 + osc(f * vib, kind='sine')
    y = lp(y, 4000) * adsr(n, 0.005, 0.1, 0.9, 0.15)
    return reverb(to_stereo(norm(y), 0, 0.4), rt=1.2, mix=0.2)


def counter_down(seed=10, d=1.4, n_ticks=26):
    y = np.zeros(int(d * SR))
    for i in range(n_ticks):
        t0 = int((i / n_ticks) ** 0.9 * (d - 0.05) * SR)
        f = 2200 * (380 / 2200) ** (i / n_ticks)
        b = osc(f, 0.03, 'square', 0.5) * expdec(int(0.03 * SR), 0.008)
        y[t0:t0 + len(b)] += lp(b, 6000)
    return to_stereo(norm(y), 0, 0.2)


def boing(seed=11, f0=260):
    d = 0.9
    n = int(d * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.25 * np.exp(-t / 0.25) * np.sin(2 * np.pi * 14 * t)) * (1 + 0.6 * np.exp(-t / 0.05))
    y = osc(f, kind='sine') * np.exp(-t / 0.35) + 0.3 * osc(f * 2, kind='sine') * np.exp(-t / 0.15)
    return reverb(to_stereo(norm(y), 0, 0.2), rt=0.8, mix=0.15)


def dumb_horn(seed=12):
    """sad trombone 'wah-wah-wah-waaah'"""
    notes = [(n2m('G3'), 0.32), (n2m('F#3'), 0.32), (n2m('F3'), 0.32), (n2m('E3'), 1.1)]
    out = []
    for i, (m, d) in enumerate(notes):
        n = int(d * SR)
        t = np.arange(n) / SR
        vib = 1 + (0.025 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.3, 0, 1) if i == 3 else 0)
        f = mtof(m) * vib * (1 - 0.03 * np.exp(-t / 0.04))
        y = osc(f, kind='saw') * 0.6 + osc(f, kind='square', duty=0.35) * 0.4
        wah = 500 + 1600 * np.clip(np.sin(np.pi * np.clip(t / d, 0, 1)), 0, 1) ** 0.6
        y = sweep_lp(y, wah) * adsr(n, 0.03, 0.05, 0.85, 0.08 if i < 3 else 0.4)
        out.append(y)
    y = np.concatenate(out)
    return reverb(to_stereo(norm(y), 0, 0.3), rt=1.1, mix=0.18)


def bonk(seed=13):
    d = 1.0
    n = int(d * SR)
    t = np.arange(n) / SR
    thump = osc(170 * (1 + 0.5 * np.exp(-t / 0.02)), kind='sine') * np.exp(-t / 0.08)
    clang = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau) for f, a, tau in [(620, 0.6, 0.35), (1530, 0.4, 0.25), (2710, 0.25, 0.18), (3990, 0.15, 0.1)])
    click = bp(noise(d, seed), 1500, 6000) * np.exp(-t / 0.006)
    y = norm(thump) + norm(clang) * 0.5 + norm(click) * 0.4
    return reverb(to_stereo(norm(y), 0.1, 0.2), rt=0.9, mix=0.15)


def tweety(seed=14):
    r = rng(seed)
    d = 1.6
    y = np.zeros(int(d * SR))
    for i in range(7):
        t0 = int((0.05 + i * 0.2 + r.uniform(0, 0.05)) * SR)
        cd = r.uniform(0.07, 0.12)
        n = int(cd * SR)
        k = np.linspace(0, 1, n)
        f = r.uniform(2600, 3400) + 1200 * np.sin(np.pi * k) * (1 if i % 2 else -0.6)
        c = osc(f, kind='sine') * np.sin(np.pi * k) ** 2
        y[t0:t0 + n] += c
    return reverb(to_stereo(norm(y), 0, 0.6), rt=0.8, mix=0.2)


def honk(seed=15, f=(340, 425), d=0.38):
    n = int(d * SR)
    y = sum(osc(fr, d, 'square', 0.45) for fr in f)
    y = softclip(lp(y, 2600) * adsr(n, 0.01, 0.03, 0.9, 0.04), 1.6)
    return y


def honks(seed=16, d=2.6):
    r = rng(seed)
    y = np.zeros((2, int(d * SR)))
    for i in range(9):
        t0 = int(r.uniform(0, d - 0.5) * SR)
        base = r.uniform(280, 460)
        h = honk(seed + i, (base, base * 1.25), r.uniform(0.15, 0.5)) * r.uniform(0.3, 1)
        h = lp(h, r.uniform(1500, 4000))
        s = to_stereo(h, r.uniform(-0.8, 0.8))
        y[:, t0:t0 + s.shape[1]] += s
    return reverb(y, rt=1.4, mix=0.25)


def glass_bump(seed=17):
    d = 0.6
    n = int(d * SR)
    t = np.arange(n) / SR
    thud = osc(110 * (1 + 0.4 * np.exp(-t / 0.015)), kind='sine') * np.exp(-t / 0.07)
    rattle = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.09) for f, a in [(2300, 0.4), (3700, 0.3), (5100, 0.2)])
    rattle *= (1 + 0.6 * np.sin(2 * np.pi * 38 * t))
    y = norm(thud) + norm(rattle) * 0.35 + norm(bp(noise(d, seed), 800, 3000) * np.exp(-t / 0.01)) * 0.3
    return reverb(to_stereo(norm(y), 0, 0.2), rt=0.6, mix=0.12)


def shop_ding(seed=18):
    y = np.concatenate([bell(mtof(n2m('E5')), 0.45, tau=0.9), np.zeros(1)])
    y2 = bell(mtof(n2m('C5')), 1.2, tau=1.0)
    out = np.zeros(int(1.7 * SR))
    out[:len(y)] += y
    out[int(0.35 * SR):int(0.35 * SR) + len(y2)] += y2
    return reverb(to_stereo(norm(out), 0, 0.3), rt=1.4, mix=0.25)


def pop(seed=19, f0=500):
    d = 0.12
    n = int(d * SR)
    t = np.arange(n) / SR
    y = osc(f0 * (1 + 2.5 * t / d), kind='sine') * np.exp(-t / 0.03)
    return to_stereo(norm(y), rng(seed).uniform(-0.4, 0.4), 0.1)


def pops(seed=20, k=6):
    r = rng(seed)
    y = np.zeros((2, int(1.4 * SR)))
    for i in range(k):
        p = pop(seed + i, r.uniform(380, 800))
        t0 = int((0.05 + i * 0.18 + r.uniform(0, 0.05)) * SR)
        y[:, t0:t0 + p.shape[1]] += p * r.uniform(0.5, 1)
    return y


def reverse_beep(seed=21):
    out = []
    for k in range(3):
        out += [osc(1040, 0.35, 'sine') * adsr(int(0.35 * SR), 0.005, 0.02, 1, 0.01), np.zeros(int(0.3 * SR))]
    return reverb(to_stereo(norm(np.concatenate(out)), 0.3, 0.2), rt=1.0, mix=0.25)


def crash_small(seed=22):
    r = rng(seed)
    d = 1.3
    n = int(d * SR)
    t = np.arange(n) / SR
    body = lp(noise(d, seed), 900) * np.exp(-t / 0.12)
    metal = sum(a * np.sin(2 * np.pi * f * t + r.uniform(0, 6)) * np.exp(-t / tau) for f, a, tau in [(310, 0.6, 0.3), (740, 0.5, 0.25), (1260, 0.4, 0.2), (2030, 0.3, 0.15), (3100, 0.2, 0.1)])
    glass = np.zeros(n)
    for i in range(40):
        t0 = int(r.uniform(0.02, 0.6) * SR)
        ln = int(0.02 * SR)
        glass[t0:t0 + ln] += np.sin(2 * np.pi * r.uniform(3000, 8000) * np.arange(ln) / SR) * np.exp(-np.arange(ln) / SR / 0.005) * r.uniform(0.2, 1)
    thud = osc(80 * (1 + np.exp(-t / 0.02)), kind='sine') * np.exp(-t / 0.15)
    y = norm(body) * 0.8 + norm(metal) * 0.45 + norm(glass) * 0.35 + norm(thud) * 0.9
    return reverb(to_stereo(norm(softclip(y, 1.5)), 0, 0.4), rt=1.2, mix=0.18)


def babble(d, seed, voices=12, pitch=1.0, rate=4.5, bright=1.0):
    """crowd murmur: formant-filtered noise with syllable-rate modulation"""
    r = rng(seed)
    n = int(d * SR)
    y = np.zeros((2, n))
    vowels = [(730, 1090), (530, 1840), (270, 2290), (570, 840), (440, 1020), (300, 870)]
    for v in range(voices):
        src = noise(d, seed + v * 7, 'pink')
        f1, f2 = vowels[r.integers(0, len(vowels))]
        sw = np.repeat(r.uniform(0.85, 1.2, int(d * 6) + 2), int(SR / 6))[:n]
        a = sweep_bp(src, f1 * pitch * sw, q=5) + 0.6 * sweep_bp(src, f2 * pitch * sw, q=6)
        syl = np.clip(np.sin(2 * np.pi * r.uniform(rate * 0.7, rate * 1.3) * np.arange(n) / SR + r.uniform(0, 6)), 0, 1) ** 1.5
        phr = np.clip(np.sin(2 * np.pi * r.uniform(0.15, 0.4) * np.arange(n) / SR + r.uniform(0, 6)) + 0.3, 0, 1)
        s = to_stereo(a * syl * phr * r.uniform(0.4, 1), r.uniform(-0.9, 0.9))
        y += s
    y = np.stack([lp(y[0], 3500 * bright), lp(y[1], 3500 * bright)])
    y = y / (np.max(np.abs(y)) + 1e-9)
    e = adsr(n, 0.3, 0.1, 1, 0.5)
    return reverb(y * e, rt=1.4, mix=0.3)


def crowd(seed=23):
    return babble(2.8, seed, 14, 1.0, 4.5)


def kids_murmur(seed=24):
    return babble(2.2, seed, 10, 1.35, 5.5)


def crowd_panic(seed=25):
    d = 3.2
    b = babble(d, seed, 18, 1.15, 6.5, 1.2)
    r = rng(seed)
    n = b.shape[1]
    for i in range(3):
        t0 = int(r.uniform(0.2, 2.2) * SR)
        ln = int(0.5 * SR)
        k = np.linspace(0, 1, ln)
        f = r.uniform(500, 700) * (1 + 0.3 * np.sin(np.pi * k)) * (1 + 0.02 * np.sin(2 * np.pi * 6 * k * 0.5))
        sc = lp(osc(f, kind='saw'), 2500) * np.sin(np.pi * k) ** 2 * 0.15
        b[:, t0:t0 + ln] += to_stereo(sc, r.uniform(-0.8, 0.8))
    return b


def siren(seed=26, d=4.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 1000 + 380 * np.sin(2 * np.pi * t / 2.6 - np.pi / 2)
    y = osc(f, kind='tri') * 0.7 + osc(f * 2, kind='sine') * 0.15
    y = lp(y, 3500) * adsr(n, 0.3, 0.1, 1, 0.6)
    return reverb(to_stereo(norm(y), -0.4, 0.5), rt=2.2, mix=0.45, tone=3500)


def ambulance(seed=27, d=3.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = np.where((t % 1.0) < 0.5, 590, 440)
    f = lp(f.astype(float), 40)
    y = osc(f, kind='square', duty=0.5)
    y = lp(y, 2400) * adsr(n, 0.05, 0.1, 1, 0.4)
    return reverb(to_stereo(norm(y), 0.3, 0.4), rt=2.0, mix=0.4, tone=3500)


def scanner(seed=28):
    y = osc(2700, 0.13, 'sine') * adsr(int(0.13 * SR), 0.003, 0.02, 1, 0.01)
    return to_stereo(y * 0.9, 0.2, 0)


def error_beep(seed=29):
    out = []
    for k in range(2):
        out += [lp(osc(392, 0.13, 'square', 0.5), 2500) * adsr(int(0.13 * SR), 0.003, 0.02, 1, 0.01), np.zeros(int(0.07 * SR))]
    return to_stereo(norm(np.concatenate(out)), 0.2, 0.1)


def error_buzz(seed=30):
    n = int(0.55 * SR)
    y = lp(osc(118, 0.55, 'square') + osc(121, 0.55, 'saw') * 0.5, 1800) * adsr(n, 0.005, 0.05, 0.9, 0.05)
    return to_stereo(norm(y), 0, 0.1)


def wrong_buzz(seed=31):
    n = int(0.8 * SR)
    y = osc(150, 0.8, 'saw') + osc(156, 0.8, 'saw') + osc(75, 0.8, 'square') * 0.5
    y = lp(y, 1500) * adsr(n, 0.01, 0.05, 0.9, 0.1)
    return to_stereo(norm(softclip(y, 1.5)), 0, 0.1)


def ding(seed=32):
    y = bell(1318, 1.4, tau=1.2)
    y[: int(1.0 * SR)] += 0.6 * bell(1976, 1.0, tau=0.8)
    return reverb(to_stereo(norm(y), 0, 0.3), rt=1.5, mix=0.25)


def chalk(seed=33, d=1.3):
    r = rng(seed)
    n = int(d * SR)
    y = bp(noise(d, seed), 1800, 6500)
    gate = np.zeros(n)
    i = 0
    while i < n:
        ln = int(r.uniform(0.05, 0.18) * SR)
        gate[i:i + ln] = np.sin(np.linspace(0, np.pi, ln[()] if False else ln)) * r.uniform(0.4, 1)
        i += ln + int(r.uniform(0.02, 0.1) * SR)
    y = y * gate * (1 + 0.5 * np.sin(2 * np.pi * 70 * np.arange(n) / SR))
    return to_stereo(norm(y) * 0.8, -0.2, 0.2)


def school_bell(seed=34, d=2.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    tone = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(1150, 1), (2780, 0.5), (4100, 0.3)])
    am = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 24 * t))
    y = lp(tone * am, 6000) * adsr(n, 0.01, 0.05, 1, 0.25)
    return reverb(to_stereo(norm(y), 0, 0.3), rt=1.8, mix=0.35)


def alarm_clock(seed=35, d=1.6):
    n = int(d * SR)
    t = np.arange(n) / SR
    tone = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(2100, 1), (3350, 0.6), (5200, 0.3)])
    am = np.abs(np.sin(2 * np.pi * 16 * t)) ** 3
    y = tone * am * adsr(n, 0.005, 0.05, 1, 0.05)
    return reverb(to_stereo(norm(y), 0.25, 0.3), rt=0.7, mix=0.18)


def thud(seed=36, f0=75, tau=0.12):
    d = 0.5
    n = int(d * SR)
    t = np.arange(n) / SR
    y = osc(f0 * (1 + 0.8 * np.exp(-t / 0.015)), kind='sine') * np.exp(-t / tau) + lp(noise(d, seed), 1200) * np.exp(-t / 0.02) * 0.4
    return reverb(to_stereo(norm(y), 0, 0.1), rt=0.6, mix=0.12)


def thud_big(seed=37):
    a = thud(seed, 60, 0.25)
    d = a.shape[1] / SR
    t = np.arange(a.shape[1]) / SR
    creak = bp(noise(d, seed + 3), 300, 1200) * np.exp(-t / 0.15) * 0.4
    return a + to_stereo(creak, 0, 0.3)


def wood_hit(seed=38):
    d = 0.5
    n = int(d * SR)
    t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau) for f, a, tau in [(210, 1, 0.09), (560, 0.6, 0.05), (1240, 0.35, 0.03)])
    y += bp(noise(d, seed), 1500, 5000) * np.exp(-t / 0.004) * 0.6
    return reverb(to_stereo(norm(y), 0.1, 0.1), rt=0.5, mix=0.12)


def clunk(seed=39):
    s = wood_hit(seed)
    return np.stack([lp(s[0], 1500), lp(s[1], 1500)]) + thud(seed, 90, 0.08) * 0.5


def alarm_beeps(seed=40, d=2.4):
    n = int(d * SR)
    t = np.arange(n) / SR
    gate = ((t * 4) % 1) < 0.5
    y = lp(osc(880, d, 'square'), 3000) * gate
    y = lp(y, 5000)
    return reverb(to_stereo(norm(y), -0.2, 0.3), rt=1.4, mix=0.3)


def power_down(seed=41, d=1.8):
    n = int(d * SR)
    k = np.linspace(0, 1, n)
    f = 1200 * (55 / 1200) ** (k ** 0.7)
    whine = osc(f, kind='saw') * 0.3 + osc(f, kind='sine')
    hum = osc(100 * (1 - 0.5 * k), kind='saw') * (1 - k)
    y = lp(whine + hum * 0.6, 3000) * (1 - k) ** 0.6
    y[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
    return reverb(to_stereo(norm(y), 0, 0.4), rt=1.6, mix=0.25)


def relays(seed=42, k=9, d=1.5):
    r = rng(seed)
    y = np.zeros((2, int(d * SR)))
    for i in range(k):
        t0 = int((0.05 + i * (d - 0.2) / k) * SR)
        c = thud(seed + i, 140, 0.03)[0] * 0.7
        s = to_stereo(c, -0.8 + 1.6 * i / k)
        y[:, t0:t0 + s.shape[1]] += s[:, : max(0, min(s.shape[1], y.shape[1] - t0))]
    return reverb(y, rt=1.2, mix=0.3)


def airport_chime(seed=43):
    notes = ['G5', 'E5', 'C5']
    out = np.zeros(int(2.4 * SR))
    for i, nm in enumerate(notes):
        b = bell(mtof(n2m(nm)), 1.5, partials=((1, 1), (4, 0.3), (10, 0.08)), tau=1.1)
        t0 = int(i * 0.42 * SR)
        out[t0:t0 + len(b)] += b
    return reverb(to_stereo(norm(out), 0, 0.3), rt=2.4, mix=0.4)


def flapboard(seed=44, d=1.4):
    r = rng(seed)
    n = int(d * SR)
    y = np.zeros(n)
    for i in range(160):
        t0 = int(r.uniform(0, d - 0.01) * SR)
        ln = int(0.006 * SR)
        y[t0:t0 + ln] += r.standard_normal(ln) * np.exp(-np.arange(ln) / SR / 0.0015) * r.uniform(0.3, 1)
    y = bp(y, 1200, 7000)
    return to_stereo(norm(y) * 0.8, 0, 0.5)


def monitor(seed=45, d=2.6):
    n = int(d * SR)
    y = np.zeros(n)
    b = osc(960, 0.12, 'sine') * adsr(int(0.12 * SR), 0.003, 0.02, 1, 0.02)
    for t0 in np.arange(0, d - 0.15, 0.47):
        i = int(t0 * SR)
        y[i:i + len(b)] += b
    return reverb(to_stereo(y * 0.8, -0.3, 0.1), rt=1.0, mix=0.25)


def shutter(seed=46, d=0.9):
    n = int(d * SR)
    t = np.arange(n) / SR
    rat = bp(noise(d, seed), 400, 3500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (45 - 25 * t / d) * t)))
    rat *= np.clip(1 - t / (d - 0.1), 0, 1)
    slam = np.zeros(n)
    s = thud(seed, 90, 0.12)[0].copy()
    tt = np.arange(len(s)) / SR
    s += sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.12) for f, a in [(420, 0.4), (980, 0.3), (1700, 0.2)])
    i = int((d - 0.12) * SR)
    m = min(len(s), n - i)
    slam[i:i + m] += s[:m]
    y = norm(rat) * 0.5 + norm(slam)
    return reverb(to_stereo(norm(y), 0, 0.3), rt=1.0, mix=0.2)


def strain(seed=47, d=1.6):
    n = int(d * SR)
    t = np.arange(n) / SR
    r = rng(seed)
    jit = lp(r.standard_normal(n), 30) * 40
    f = 85 + jit + 10 * np.sin(2 * np.pi * 0.7 * t)
    y = bp(osc(f, kind='saw'), 200, 1400) * adsr(n, 0.2, 0.1, 0.8, 0.4)
    return reverb(to_stereo(norm(y) * 0.7, 0, 0.3), rt=0.8, mix=0.2)


def server_hum(seed=48, d=2.6):
    n = int(d * SR)
    y = lp(noise(d, seed, 'pink'), 1800) * 0.6 + osc(120, d, 'sine') * 0.2 + osc(240, d, 'sine') * 0.08 + osc(7400, d, 'sine') * 0.015
    y *= adsr(n, 0.4, 0.1, 1, 0.6)
    return to_stereo(norm(y) * 0.8, 0, 0.8)


def notifs(seed=49):
    out = np.zeros(int(1.3 * SR))
    for i in range(3):
        b = bell(1568, 0.3, partials=((1, 1), (1.335, 0.6)), tau=0.15)
        b[: int(0.25 * SR)] += bell(2093, 0.25, partials=((1, 0.6),), tau=0.1)
        t0 = int((i * 0.3) * SR)
        out[t0:t0 + len(b)] += b
    return reverb(to_stereo(norm(out), 0, 0.3), rt=0.8, mix=0.2)


def typing(seed=50, d=1.6):
    r = rng(seed)
    y = np.zeros(int(d * SR))
    t0 = 0.0
    while t0 < d - 0.05:
        i = int(t0 * SR)
        ln = int(0.02 * SR)
        y[i:i + ln] += bp(r.standard_normal(ln), 1500, 6000) * np.exp(-np.arange(ln) / SR / 0.003) * r.uniform(0.4, 1)
        t0 += r.uniform(0.05, 0.16)
    return to_stereo(norm(y) * 0.8, 0.2, 0.3)


def wind(seed=51, d=4.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    x = noise(d, seed, 'pink')
    fc = 500 + 350 * np.sin(2 * np.pi * 0.23 * t) + 200 * np.sin(2 * np.pi * 0.61 * t + 1)
    y = sweep_bp(x, fc, q=1.2) + 0.15 * sweep_bp(noise(d, seed + 1), 900 + 300 * np.sin(2 * np.pi * 0.4 * t), q=12)
    y *= (0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * t)) * adsr(n, 0.6, 0.1, 1, 0.8)
    return to_stereo(norm(y), 0, 0.9)


def ticks(seed=52, d=2.4):
    y = np.zeros(int(d * SR))
    for k, t0 in enumerate(np.arange(0, d - 0.05, 0.4)):
        c = thud(seed + k, 900, 0.01)[0][: int(0.03 * SR)]
        i = int(t0 * SR)
        y[i:i + len(c)] += c
    return to_stereo(y * 0.6, 0.3, 0.2)


def crumble(seed=53, d=1.8):
    r = rng(seed)
    n = int(d * SR)
    t = np.arange(n) / SR
    rumble = lp(noise(d, seed, 'brown'), 160) * adsr(n, 0.05, 0.3, 0.6, 0.8)
    debris = np.zeros(n)
    for i in range(70):
        t0 = int(r.uniform(0, d * 0.8) * SR)
        ln = int(r.uniform(0.01, 0.05) * SR)
        debris[t0:t0 + ln] += lp(r.standard_normal(ln), r.uniform(600, 3000)) * np.exp(-np.arange(ln) / SR / 0.01) * r.uniform(0.2, 1)
    crack = bp(noise(d, seed + 2), 500, 3000) * np.exp(-t / 0.04)
    y = norm(rumble) + norm(debris) * 0.6 + norm(crack) * 0.6
    return reverb(to_stereo(norm(y), 0, 0.6), rt=2.0, mix=0.3)


def shimmer(seed=54):
    notes = ['C6', 'E6', 'G6', 'C7']
    out = np.zeros(int(1.6 * SR))
    for i, nm in enumerate(notes):
        b = bell(mtof(n2m(nm)), 1.0, tau=0.6) * 0.6
        t0 = int(i * 0.06 * SR)
        out[t0:t0 + len(b)] += b
    return reverb(to_stereo(norm(out), 0, 0.6), rt=2.2, mix=0.45)


def crow(seed=55):
    out = []
    for k in range(2):
        d = 0.32
        n = int(d * SR)
        t = np.arange(n) / SR
        f = 560 * (1 - 0.2 * t / d)
        y = osc(f, kind='saw') + rng(seed + k).standard_normal(n) * 0.6
        y = bp(y, 600, 2400) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.7
        out += [y, np.zeros(int(0.18 * SR))]
    return reverb(to_stereo(norm(np.concatenate(out)), -0.5, 0.3), rt=2.0, mix=0.35)


def poke(seed=56):
    d = 0.5
    n = int(d * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.06) + np.sin(2 * np.pi * 4100 * t) * np.exp(-t / 0.03) * 0.5
    return to_stereo(norm(y) * 0.8, 0, 0.1)


def heartbeat(seed=57, d=2.6, bpm=66):
    n = int(d * SR)
    y = np.zeros(n)
    per = 60 / bpm
    for t0 in np.arange(0.05, d - 0.3, per):
        for off, a in [(0, 1), (0.22, 0.7)]:
            b = thud(seed, 52, 0.09)[0] * a
            i = int((t0 + off) * SR)
            y[i:i + len(b)] += b[: max(0, min(len(b), n - i))]
    y = lp(y, 300)
    return to_stereo(norm(y), 0, 0)


def drone_low(seed=58, d=3.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    y = osc(41.2, d, 'saw') + osc(43.65, d, 'saw') * 0.7 + osc(61.7, d, 'sine') * 0.5
    y = sweep_lp(y, 150 + 500 * t / d) * adsr(n, 1.0, 0.2, 1, 0.8)
    return reverb(to_stereo(norm(y), 0, 0.8), rt=3, mix=0.3, tone=2000)


def rewind(seed=59, d=1.5):
    n = int(d * SR)
    k = np.linspace(0, 1, n)
    f = 180 * (2400 / 180) ** (k ** 0.8)
    whir = osc(f, kind='saw') * 0.3 + osc(f * 1.5, kind='sine') * 0.3
    chat = sweep_bp(noise(d, seed), 800 + 4000 * k, q=3) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (8 + 30 * k) * np.arange(n) / SR)))
    y = lp(whir, 5000) + norm(chat) * 0.6
    y *= adsr(n, 0.05, 0.1, 1, 0.08)
    return reverb(to_stereo(norm(y), 0, 0.6), rt=1.0, mix=0.2)


def stamp(seed=60):
    d = 0.6
    n = int(d * SR)
    t = np.arange(n) / SR
    y = osc(95 * (1 + 0.6 * np.exp(-t / 0.01)), kind='sine') * np.exp(-t / 0.1) + bp(noise(d, seed), 400, 2500) * np.exp(-t / 0.025) * 0.8
    return reverb(to_stereo(norm(softclip(y, 1.4)), 0, 0.2), rt=0.9, mix=0.18)


def clock_ticks(seed=61, d=3.0):
    y = np.zeros(int(d * SR))
    t0, k = 0.0, 0
    while t0 < d - 0.05:
        f = 3000 if k % 2 == 0 else 2350
        c = (bp(noise(0.02, seed + k), f * 0.8, f * 1.2) * np.exp(-np.arange(int(0.02 * SR)) / SR / 0.003))
        i = int(t0 * SR)
        y[i:i + len(c)] += c
        rate = 4 + 14 * (t0 / d) ** 1.5
        t0 += 1 / rate
        k += 1
    return to_stereo(norm(y) * 0.8, 0, 0.2)


def tape_stop(seed=62):
    return np.zeros((2, 10))  # handled on the music bus


def footsteps(seed=63, d=2.6):
    r = rng(seed)
    y = np.zeros((2, int(d * SR)))
    t0 = 0.05
    k = 0
    while t0 < d - 0.2:
        s = thud(seed + k, 120, 0.03)[0] * 0.6
        s += np.pad(bp(r.standard_normal(int(0.05 * SR)), 800, 4000) * np.exp(-np.arange(int(0.05 * SR)) / SR / 0.01), (0, len(s) - int(0.05 * SR)))[: len(s)] * 0.4
        st = to_stereo(s, -0.3 + 0.6 * (k % 2))
        i = int(t0 * SR)
        y[:, i:i + st.shape[1]] += st[:, : max(0, min(st.shape[1], y.shape[1] - i))]
        t0 += r.uniform(0.18, 0.32)
        k += 1
    return y


def birds(seed=64, d=4.5):
    r = rng(seed)
    y = np.zeros((2, int(d * SR)))
    for i in range(14):
        t0 = int(r.uniform(0, d - 0.4) * SR)
        m = r.integers(2, 5)
        base = r.uniform(2600, 5200)
        for j in range(m):
            ln = int(r.uniform(0.04, 0.09) * SR)
            k = np.linspace(0, 1, ln)
            f = base * (1 + r.uniform(-0.25, 0.35) * k)
            c = osc(f, kind='sine') * np.sin(np.pi * k) ** 2
            st = to_stereo(c * r.uniform(0.3, 1), r.uniform(-0.9, 0.9))
            s0 = t0 + int(j * r.uniform(0.07, 0.12) * SR)
            y[:, s0:s0 + ln] += st[:, : max(0, min(ln, y.shape[1] - s0))]
    return reverb(y, rt=1.5, mix=0.3)


def amb_city(seed=65, d=6.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    bed = lp(noise(d, seed, 'brown'), 700) * 0.8 + lp(noise(d, seed + 1, 'pink'), 2500) * 0.12
    r = rng(seed)
    cars = np.zeros(n)
    for i in range(5):
        c0 = r.uniform(0, d)
        e = np.exp(-((t - c0) / r.uniform(0.6, 1.4)) ** 2)
        cars += lp(noise(d, seed + 10 + i, 'pink'), r.uniform(600, 1500)) * e
    y = norm(bed) * 0.7 + norm(cars) * 0.5
    y *= adsr(n, 0.4, 0.1, 1, 0.6)
    return to_stereo(norm(y), 0, 1.0)


def shockwave(seed=66):
    d = 1.1
    n = int(d * SR)
    k = np.linspace(0, 1, n)
    rev = sweep_bp(noise(d, seed), 500 + 6000 * k ** 2, q=1.2) * k ** 3
    rev = norm(rev)
    b = impact_big(seed)
    out = np.zeros((2, n + b.shape[1]))
    out[:, :n] += to_stereo(rev, 0, 0.5)
    out[:, n - int(0.02 * SR):n - int(0.02 * SR) + b.shape[1]] += b
    return out


GEN = {k: v for k, v in globals().items() if callable(v) and not k.startswith('_')}
