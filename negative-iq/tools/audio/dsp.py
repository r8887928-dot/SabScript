"""Tiny synthesis / DSP kit (numpy + scipy). Everything is generated — no samples, no copyrighted audio."""
import numpy as np
from scipy import signal

SR = 48000


def T(d):
    return np.arange(int(d * SR)) / SR


def rng(seed):
    return np.random.default_rng(seed)


def noise(d, seed=0, color='white'):
    n = int(d * SR)
    x = rng(seed).standard_normal(n)
    if color == 'pink':
        b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
        x = signal.lfilter(b, a, x) * 3.5
    elif color == 'brown':
        x = np.cumsum(x) * 0.02
        x = signal.lfilter([1, -1], [1, -0.995], x)
    return x


def sos(kind, f, order=2, q=None):
    nyq = SR / 2
    if kind == 'bp':
        lo, hi = f
        return signal.butter(order, [max(10, lo) / nyq, min(hi, nyq * 0.98) / nyq], 'bandpass', output='sos')
    return signal.butter(order, min(f, nyq * 0.98) / nyq, {'lp': 'lowpass', 'hp': 'highpass'}[kind], output='sos')


def lp(x, f, order=2):
    return signal.sosfilt(sos('lp', f, order), x)


def hp(x, f, order=2):
    return signal.sosfilt(sos('hp', f, order), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(sos('bp', (lo, hi), order), x)


def sweep_bp(x, fc, q=2.0, block=256):
    """time-varying band-pass; fc: array of centre freqs (per sample) or callable(t)"""
    n = len(x)
    out = np.zeros(n)
    zi = None
    fcs = fc if hasattr(fc, '__len__') else np.full(n, fc)
    for i in range(0, n, block):
        c = float(np.clip(fcs[min(i + block // 2, n - 1)], 40, SR * 0.45))
        bw = c / q
        s = sos('bp', (max(20, c - bw / 2), c + bw / 2), 2)
        if zi is None:
            zi = np.zeros((s.shape[0], 2))
        out[i:i + block], zi = signal.sosfilt(s, x[i:i + block], zi=zi)
    return out


def sweep_lp(x, fc, block=256):
    n = len(x)
    out = np.zeros(n)
    zi = np.zeros((1, 2))
    fcs = fc if hasattr(fc, '__len__') else np.full(n, fc)
    for i in range(0, n, block):
        c = float(np.clip(fcs[min(i + block // 2, n - 1)], 30, SR * 0.45))
        s = sos('lp', c, 2)
        out[i:i + block], zi = signal.sosfilt(s, x[i:i + block], zi=zi)
    return out


def phase_of(freq):
    """freq: array per sample -> cycles"""
    return np.cumsum(freq) / SR


def osc(freq, d=None, kind='sine', duty=0.5, phase0=0.0):
    if np.isscalar(freq):
        freq = np.full(int(d * SR), float(freq))
    ph = phase_of(freq) + phase0
    if kind == 'sine':
        return np.sin(2 * np.pi * ph)
    if kind == 'saw':
        return 2 * (ph % 1) - 1
    if kind == 'square':
        return np.where((ph % 1) < duty, 1.0, -1.0)
    if kind == 'tri':
        return 2 * np.abs(2 * (ph % 1) - 1) - 1
    raise ValueError(kind)


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2, sr=SR):
    a_, d_, r_ = int(a * sr), int(d * sr), int(r * sr)
    s_ = max(0, n - a_ - d_ - r_)
    e = np.concatenate([np.linspace(0, 1, max(1, a_)), np.linspace(1, s, max(1, d_)), np.full(s_, s), np.linspace(s, 0, max(1, r_))])
    if len(e) < n:
        e = np.pad(e, (0, n - len(e)))
    return e[:n]


def expdec(n, tau, a=0.002):
    t = np.arange(n) / SR
    e = np.exp(-t / tau)
    k = int(a * SR)
    if k > 0:
        e[:k] *= np.linspace(0, 1, k)
    return e


def fade(x, fi=0.005, fo=0.02):
    x = x.copy()
    a, b = int(fi * SR), int(fo * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def ks(freq, d, bright=0.5, seed=0, decay=0.996):
    """Karplus–Strong plucked string"""
    n = int(d * SR)
    p = max(2, int(SR / freq))
    buf = rng(seed).uniform(-1, 1, p)
    buf = lp(buf, 1000 + bright * 9000)
    out = np.zeros(n)
    # vectorised by periods
    i = 0
    prev = buf.copy()
    while i < n:
        m = min(p, n - i)
        out[i:i + m] = prev[:m]
        nxt = decay * 0.5 * (prev + np.roll(prev, -1))
        prev = nxt
        i += p
    return out


def bell(freq, d, partials=((1, 1), (2.76, 0.5), (5.4, 0.25), (8.93, 0.12)), tau=0.8):
    n = int(d * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for r, a in partials:
        x += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (tau / (0.6 + r * 0.25)))
    return x * adsr(n, 0.002, 0.01, 1, 0.02)


def softclip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def to_stereo(x, pan=0.0, width=0.0, seed=0):
    """equal-power pan (−1..1); width adds a short decorrelating delay to one side"""
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    L, R = x * l * 1.414, x * r * 1.414
    if width > 0:
        k = int(width * 0.012 * SR)
        R = np.concatenate([np.zeros(k), R[:-k]]) if k else R
    return np.stack([L, R])


_IR = {}


def reverb(st, rt=1.8, mix=0.25, pre=0.015, tone=6000, seed=3):
    """stereo convolution reverb with a synthetic exponentially decaying noise IR"""
    key = (rt, pre, tone, seed)
    if key not in _IR:
        n = int(rt * SR)
        t = np.arange(n) / SR
        irs = []
        for ch in range(2):
            ir = rng(seed + ch).standard_normal(n) * np.exp(-6.9 * t / rt)
            ir = lp(ir, tone)
            ir = np.concatenate([np.zeros(int(pre * SR)), ir])
            irs.append(ir / np.sqrt(np.sum(ir ** 2)))
        _IR[key] = irs
    irs = _IR[key]
    if st.ndim == 1:
        st = np.stack([st, st])
    wet = np.stack([signal.fftconvolve(st[c], irs[c])[: st.shape[1]] for c in range(2)])
    return st * (1 - mix) + wet * mix * 1.6


def db(x):
    return 10 ** (x / 20)


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) + 1e-9
    return x * (peak / m)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n2m(name):
    """'A4' -> midi"""
    if name[1:2] in ('#', 'b'):
        return NOTE[name[:2]] + 12 * (int(name[2:]) + 1)
    return NOTE[name[0]] + 12 * (int(name[1:]) + 1)
