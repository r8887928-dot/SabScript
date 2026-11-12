"""Builds the full soundtrack from src/timeline.json:
voice blocks (the user's recording, untouched except placement) + synthesised SFX + ambience beds + original score
ducked under the voice. Writes out/audio/mix.wav (48 kHz stereo, exact video length) and stems.

Run: python3 -I tools/audio/mix.py   (from the project folder)
"""
import json, os, subprocess, sys, zlib
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from dsp import *  # noqa
import sfx as S
import music as MU

ROOT = os.path.dirname(os.path.dirname(HERE))
TLP = sys.argv[1] if len(sys.argv) > 1 else 'src/timeline.json'
OUT = os.path.join(ROOT, sys.argv[2] if len(sys.argv) > 2 else 'out/audio')
os.makedirs(OUT, exist_ok=True)
tl = json.load(open(os.path.join(ROOT, TLP)))
GAME = tl.get('kind') == 'game'
FPS = tl['fps']
N = int(round(tl['frames'] / FPS * SR))
seed_of = lambda s: zlib.crc32(s.encode()) % 100000


def place(buf, st, t, gain=1.0):
    if st.ndim == 1:
        st = to_stereo(st, 0, 0.2)
    i = int(round(t * SR))
    if i < 0:
        st = st[:, -i:]
        i = 0
    m = min(st.shape[1], buf.shape[1] - i)
    if m > 0:
        buf[:, i:i + m] += st[:, :m] * gain


# ------------------------------------------------------------------ voice
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', os.path.join(ROOT, tl.get('voice', 'assets/voice/voice.mp3')), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
v = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
voice = np.zeros((2, N))
for b in tl['blocks']:
    seg = v[int(b['vin'] * SR):int(b['vout'] * SR)].copy()
    seg = fade(seg, 0.004, 0.006)
    place(voice, np.stack([seg, seg]), b['g'])
# level-match the voice: active speech RMS -> -18.7 dBFS (the reference level the mix is balanced for)
_w = SR // 2
_r = np.array([np.sqrt(np.mean(voice[0, i * _w:(i + 1) * _w] ** 2) + 1e-12) for i in range(N // _w)])
_act = 20 * np.log10(_r) > -40
_vg = db(-18.7) / np.median(_r[_act])
voice *= _vg
print('voice placed', len(tl['blocks']), 'blocks; voice gain %.1f dB' % (20 * np.log10(_vg)))

# voice envelope for ducking
env = np.abs(voice[0])
win = int(0.03 * SR)
env = np.convolve(env, np.ones(win) / win, mode='same')
att, rel = 1 - np.exp(-1 / (0.02 * SR)), 1 - np.exp(-1 / (0.35 * SR))
from scipy.signal import lfilter
env_s = lfilter([rel], [1, -(1 - rel)], env)  # smooth (release-dominated)
env_s = np.maximum(env_s, lfilter([att], [1, -(1 - att)], env))
duck = np.clip(env_s / 0.035, 0, 1)

# ------------------------------------------------------------------ music
music = np.zeros((2, N))
keys = iter(['A', 'C', 'D', 'E', 'F', 'G'])
cues = tl['music']
tape_t = tl['cues']['tape_stop']['t'] if 'tape_stop' in tl['cues'] else -1
for i, c in enumerate(cues):
    s, e, mood = c['s'], c['e'], c['mood']
    d = e - s + 0.6
    gen = MU.MOODS[mood]
    y = gen(d, key=next(keys)) if mood == 'interlude' else gen(d)
    y = y * MU.LEVEL[mood]
    # fades
    n = y.shape[1]
    fi = int((0.02 if mood in ('twist', 'interlude', 'finale', 'dark') else 0.25) * SR)
    fo = int(0.6 * SR)
    y[:, :fi] *= np.linspace(0, 1, fi)
    y[:, -fo:] *= np.linspace(1, 0, fo)
    if mood == 'morning':  # tape stop at the twist
        k0 = int((tape_t - s) * SR)
        L = int(0.55 * SR)
        if 0 < k0 < n:
            src = y[:, k0:k0 + L * 2].copy()
            rate = np.linspace(1, 0, L) ** 1.3
            pos = np.cumsum(rate)
            pos = np.clip(pos, 0, src.shape[1] - 2)
            stopped = np.stack([np.interp(pos, np.arange(src.shape[1]), src[ch]) for ch in range(2)])
            stopped *= np.linspace(1, 0.2, L)
            y[:, k0:k0 + L] = stopped[:, : max(0, min(L, n - k0))]
            y[:, k0 + L:] = 0
    place(music, y, s)
print('music rendered')
# score level: louder in interludes (no voice), ducked under speech
music *= db(-14.5)
music *= (1 - 0.68 * duck)

# ------------------------------------------------------------------ SFX
fx = np.zeros((2, N))
PRE = {'shockwave': 1.08, 'whoosh': 0.38, 'whoosh_up': 0.3}
cache = {}
for name, c in tl['cues'].items():
    kind = c['kind']
    if kind not in S.GEN:
        print('missing sfx', kind)
        continue
    key = (kind, seed_of(name) % 5)
    if key not in cache:
        try:
            cache[key] = S.GEN[kind](seed=seed_of(name) % 5 + 1)
        except TypeError:
            cache[key] = S.GEN[kind]()
    st = cache[key]
    place(fx, st, c['t'] - PRE.get(kind, 0), db(c['gain']))
print('sfx placed', len(tl['cues']))
fx *= db(-8)

# ------------------------------------------------------------------ ambience beds
BED_IQ = {
    'city': ['h1_face', 'h2_crowd', 'm1_sunrise', 'm3_commute', 'm4_school', 'm5_cross', 't1_freeze', 'a1_pole', 'a2_absurd', 'a3_door', 'a6_reverse', 'a7_inter', 'a8_crowdq', 'g3_rewind'],
    'room': ['m2_alarm', 'a4_glass', 'a5_shop', 'b3_checkout', 'b4_class', 'b5_board', 'c1_control', 'd1_servers', 'd4_chair', 'c3_airport'],
    'chaos': ['b1_chaos', 'b2_jam', 'c2_blackout', 'c4_hospital', 'c5_shutters', 'c6_sofa', 'd2_phone', 'I2', 'I3'],
    'wind': ['e1_dusk', 'e2_curb', 'f1_overgrown', 'f3_artifact', 'f4_rope', 'g2_ruins', 'I5', 'I6'],
    'space': ['h3_earth', 'title', 'f2_earthnight', 'g4_earth', 'outro'],
    'studio': ['t2_heads', 't3_face', 'b6_peg', 'd3_feed', 'd5_choice', 'e3_pillars', 'g1_dark', 'I1', 'I4'],
}
BED_GAME = {
    'city': ['gh2_world', 'gb1_loops', 'gb2_cars', 'gb3_lod', 'gc1_quests', 'gc2_bread', 'gd1_lag', 'gd2_freeze', 'gd3_fall', 'ge1_save', 'ge3_bus', 'ge4_best', 'gg3_button', 'gg4_press'],
    'room': ['gh1_wake', 'gm1_bed', 'gm2_hpbar', 'gm3_level', 'ga1_fridge', 'ga2_mom', 'ga3_npc', 'gb4_teeth', 'gc3_boss', 'ge2_mug'],
    'wind': ['gc4_wall', 'gf1_menu', 'gf2_confirm'],
    'space': ['title', 'loading', 'gg2_sim', 'outro'],
    'studio': ['gg1_lab', 'I1', 'I2', 'I3', 'I4', 'I5', 'I6'],
}
BED = BED_GAME if GAME else BED_IQ
LV = {'city': -21, 'room': -30, 'chaos': -21, 'wind': -22, 'space': -26, 'studio': -32}


def bed(kind, d, seed):
    if kind == 'city':
        y = S.amb_city(seed, d)
        if seed % 2 == 0:
            y = y + S.birds(seed, d)[:, : y.shape[1]] * 0.25
        return y
    if kind == 'room':
        n = int(d * SR)
        x = lp(noise(d, seed, 'pink'), 900) + osc(50, d, 'sine') * 0.05
        return to_stereo(norm(x) * adsr(n, 0.1, 0.1, 1, 0.1), 0, 0.8)
    if kind == 'chaos':
        y = S.amb_city(seed, d)
        far = S.babble(d, seed, 10, 1.05, 5.0, 0.6) * 0.5
        sir = S.siren(seed, d) * 0.35
        n = y.shape[1]
        return y + far[:, :n] + sir[:, :n]
    if kind == 'wind':
        return S.wind(seed, d)
    if kind == 'space':
        n = int(d * SR)
        x = lp(noise(d, seed, 'brown'), 200) + osc(55, d, 'sine') * 0.2 + osc(82.4, d, 'sine') * 0.1
        return to_stereo(norm(x) * adsr(n, 0.5, 0.1, 1, 0.5), 0, 0.9)
    n = int(d * SR)
    x = lp(noise(d, seed, 'pink'), 400)
    return to_stereo(norm(x) * adsr(n, 0.3, 0.1, 1, 0.3), 0, 0.9)


beds = np.zeros((2, N))
kind_of = {sid: k for k, ids in BED.items() for sid in ids}
for s in tl['shots']:
    k = kind_of.get(s['id'])
    if not k:
        continue
    d = s['dur'] / FPS + 0.3
    y = bed(k, d, seed_of(s['id']) % 997)
    n = y.shape[1]
    f = int(0.12 * SR)
    y[:, :f] *= np.linspace(0, 1, f)
    y[:, -f:] *= np.linspace(1, 0, f)
    place(beds, y, s['from'] / FPS - 0.05, db(LV[k]))
print('beds placed')

# ------------------------------------------------------------------ master
mixb = voice + music + fx + beds
# gentle bus glue + peak limiter (5 ms look-ahead)
peak = np.max(np.abs(mixb), axis=0)
from scipy.ndimage import maximum_filter1d, uniform_filter1d
look = int(0.005 * SR)
pk = maximum_filter1d(peak, size=look * 2 + 1)
ceil = db(-1.5)
g = np.minimum(1.0, ceil / (pk + 1e-9))
g = uniform_filter1d(g, size=look * 2 + 1)
g = np.minimum(g, ceil / (pk + 1e-9) + 0.02)
mixb = mixb * g
for nm, st in [('voice', voice), ('music', music), ('sfx', fx), ('beds', beds), ('mix_pre', mixb)]:
    wavfile.write(os.path.join(OUT, f'{nm}.wav'), SR, (np.clip(st.T, -1, 1) * 32767).astype(np.int16))
print('wrote stems; loudness normalising…')
# two-pass loudnorm to -14 LUFS / -1.5 dBTP
pre = os.path.join(OUT, 'mix_pre.wav')
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
js = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
      f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true:print_format=summary")
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', pre, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le', os.path.join(OUT, 'mix.wav')], check=True)
print('input loudness', js['input_i'], 'LUFS -> mix.wav')
