# Сведение по журналу событий: python3 -I tools/mix.py <race|tear>
# Дорожки: голос, музыка, атмосфера, эффекты (48 кГц стерео) + общий микс −14 LUFS. Для панели — M4A.
import json, os, subprocess, sys, hashlib
import numpy as np
from scipy.signal import fftconvolve
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
KIND = sys.argv[1]; SR = 48000; DUR = 180.0; N = int(DUR * SR)
src = json.load(open('zvuk/sources.json'))
byk = {}
for s in src: byk.setdefault(s['key'], []).append(s['file'])
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
cache = {}
def prep(p, maxlen=None):
    k = (p, maxlen)
    if k in cache: return cache[k]
    x = load(p); a = np.abs(x).max(0)
    if a.max() < 1e-5: cache[k] = None; return None
    on = np.argmax(a > a.max() * 0.1); on = max(0, on - int(0.004 * SR)); x = x[:, on:]  # настоящее начало
    if maxlen: x = x[:, :int(maxlen * SR)]
    n = x.shape[1]; fi = min(n, int(0.005 * SR)); fo = min(n, int(max(0.05, n / SR * 0.25) * SR))
    x[:, :fi] *= np.linspace(0, 1, fi); x[:, n - fo:] *= np.linspace(1, 0, fo) ** 2
    x /= np.abs(x).max() + 1e-9
    cache[k] = x; return x
def resample(x, f):  # f > 1 — выше и короче
    n = x.shape[1]; m = max(2, int(n / f)); t = np.linspace(0, n - 1, m)
    return np.stack([np.interp(t, np.arange(n), x[c]) for c in range(2)])
def db(v): return 10 ** (v / 20)
def place(buf, x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1] or x is None: return
    if i < 0: x = x[:, -i:]; i = 0
    n = min(x.shape[1], buf.shape[1] - i)
    L, R = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    buf[0, i:i + n] += x[0, :n] * g * min(1, L); buf[1, i:i + n] += x[1, :n] * g * min(1, R)
def pick(key, salt):
    files = [f for f in byk.get(key, []) if prep(f) is not None]
    if not files: return None
    h = int(hashlib.md5(f'{key}{salt}'.encode()).hexdigest(), 16); return files[h % len(files)], h
# ---------------- голос
voice = np.zeros((2, N))
for L in json.load(open('zvuk/voice/voice.json'))['RACE' if KIND == 'race' else 'TEAR']:
    x = load(L['file']); place(voice, x, L['t'])
act = np.abs(voice[0]) > 1e-4
rms = np.sqrt(np.mean(voice[0][act] ** 2)) if act.any() else 1
voice *= db(-19) / rms
# огибающая голоса для приглушения музыки
env = np.convolve(np.abs(voice[0]), np.ones(2400) / 2400, mode='same'); env = np.minimum(1, env / 0.02)
from scipy.ndimage import maximum_filter1d, uniform_filter1d
env = uniform_filter1d(maximum_filter1d(env, int(0.25 * SR)), int(0.3 * SR))
# ---------------- эффекты
ev = json.load(open(f'zvuk/events_{KIND}.json'))
fx = np.zeros((2, N)); log = []
LEN = {'impact_metal': 1.6, 'bolt': 0.6, 'tick': 0.25, 'whoosh': 1.4, 'air_wrench': 1.6, 'ratchet': 1.2, 'engine_rev': 3.5, 'engine_start': 3.5, 'passby': 3.2, 'tire': 2.6,
       'roller_door': 7, 'beep': 0.45, 'boom': 3.5, 'riser': 4.0, 'servo': 2.2, 'hiss': 1.0, 'light_on': 1.6, 'glass': 0.8}
GAIN = {'impact_metal': -11, 'bolt': -16, 'tick': -20, 'whoosh': -15, 'air_wrench': -13, 'ratchet': -15, 'engine_rev': -9, 'engine_start': -10, 'passby': -7, 'tire': -9,
        'roller_door': -11, 'beep': -12, 'boom': -5, 'riser': -14, 'servo': -15, 'hiss': -16, 'light_on': -12, 'glass': -16}
last = {}
for i, (t, typ, s, pan) in enumerate(ev):
    base = {'tick': 'glass', 'beep_go': 'beep', 'passby_slow': 'passby', 'engine_rev_slow': 'engine_rev'}.get(typ, typ)
    # частые мелкие события не чаще раза в 0,12 с, чтобы не было «пулемёта»
    if typ in ('bolt', 'tick', 'impact_metal', 'hiss') and t - last.get(typ, -9) < (0.12 if typ != 'impact_metal' else 0.18): continue
    last[typ] = t
    pk = pick(base, i)
    if not pk: continue
    f, h = pk; x = prep(f, LEN.get(base, 2.0))
    pitch = 1 + ((h % 1000) / 1000 - 0.5) * 0.08
    if typ == 'beep_go': pitch = 1.5
    if typ in ('passby_slow', 'engine_rev_slow'): pitch = 0.55
    x = resample(x, pitch) if abs(pitch - 1) > 0.005 else x
    g = db(GAIN.get(base, -14) + ((h >> 10) % 100 / 100 - 0.5) * 3) * (0.55 + 0.45 * s)
    pre = 0.35 if base in ('whoosh', 'passby') else 0.0  # пик пролёта — на событии
    if base == 'riser': pre = 2.5
    place(fx, x, t - pre, g, pan); log.append((round(t, 3), typ, os.path.basename(f)))
# общий отзвук: в гараже больше, на улице суше
rng = np.random.default_rng(3); ir_n = int(0.9 * SR); tt = np.arange(ir_n) / SR
ir = np.stack([rng.standard_normal(ir_n), rng.standard_normal(ir_n)]) * np.exp(-tt / 0.22); ir /= np.abs(ir).sum(1, keepdims=True) ** 0.5 * 12
wet = np.stack([fftconvolve(fx[c], ir[c])[:N] for c in range(2)])
inside = np.ones(N)
if KIND == 'race':
    tg = np.arange(N) / SR; inside = np.clip(1 - (tg - 104) / 6, 0.25, 1)
fx = fx + wet * inside * 0.9
# ---------------- атмосфера
amb = np.zeros((2, N))
def bed(key, t0, t1, g, fade=1.5):
    pk = pick(key, 0)
    if not pk: return
    x = prep(pk[0]); L = int((t1 - t0) * SR); reps = int(np.ceil(L / x.shape[1])) + 1
    y = np.concatenate([x] * reps, 1)[:, :L]; f = int(fade * SR); y[:, :f] *= np.linspace(0, 1, f); y[:, -f:] *= np.linspace(1, 0, f)
    place(amb, y, t0, g)
if KIND == 'race': bed('amb_garage', 0, 106, db(-32)); bed('amb_night', 103, 180, db(-30), 2.5)
else: bed('amb_garage', 0, 180, db(-32))
# ---------------- музыка: аранжировка из лупов
mus = np.zeros((2, N))
def loop(file_key, idx, t0, t1, g, fi=1.0, fo=1.5):
    files = byk.get(file_key, [])
    if idx >= len(files): return
    x = prep(files[idx]); L = int((t1 - t0) * SR)
    if L <= 0: return
    reps = int(np.ceil(L / x.shape[1])) + 1; y = np.concatenate([x] * reps, 1)[:, :L]
    a, b = int(fi * SR), int(fo * SR); y[:, :a] *= np.linspace(0, 1, a); y[:, -b:] *= np.linspace(1, 0, b)
    place(mus, y, t0, g)
def file_idx(key, title_part):
    for i, f in enumerate(byk.get(key, [])):
        s = next(x for x in src if x['file'] == f)
        if title_part.lower() in (s['title'] or '').lower(): return i
    return 0
if KIND == 'race':
    loop('mus_pad', file_idx('mus_pad', 'Dark Soul'), 0, 104, db(-18), 2, 4)
    loop('mus_pad', file_idx('mus_pad', 'Lost Transmission'), 0, 8, db(-20), 0.5, 1)
    loop('mus_beat', file_idx('mus_beat', 'Percussion'), 41, 101, db(-17), 0.05, 2)
    loop('mus_beat', file_idx('mus_beat', 'Percussion'), 104, 135.6, db(-15), 0.5, 0.3)
    loop('mus_beat', file_idx('mus_beat', 'Epic Orchestra'), 136.2, 178, db(-13), 0.02, 3)
    pk = byk['mus_beat'][file_idx('mus_beat', 'Epic_End')]; place(mus, prep(pk), 175.5, db(-12))
else:
    loop('mus_pad', file_idx('mus_pad', 'LightWaves'), 0, 180, db(-19), 2, 4)
    loop('mus_lead', 0, 24, 100, db(-22), 2, 3)
    loop('mus_beat', file_idx('mus_beat', 'Percussion'), 100, 160, db(-17), 1, 2)
    loop('mus_beat', file_idx('mus_beat', 'Epic Orchestra'), 160, 178, db(-14), 1, 3)
    pk = byk['mus_beat'][file_idx('mus_beat', 'Epic_End')]; place(mus, prep(pk), 175.5, db(-12))
# музыка уходит под голос (−8 дБ) и под главные удары
duck = 1 - 0.6 * env
for t, typ, s, pan in ev:
    if typ in ('boom', 'beep_go'):
        i0 = int(t * SR); n = int(1.2 * SR); duck[i0:i0 + n] = np.minimum(duck[i0:i0 + n], np.linspace(0.45, 1, min(n, N - i0)))
mus *= duck
# ---------------- общий микс, громкость и ограничитель (тот же коэффициент на все дорожки)
stems = {'voice': voice, 'music': mus, 'ambience': amb, 'effects': fx}
mix = sum(stems.values())
os.makedirs('zvuk/mix', exist_ok=True); os.makedirs('zvuk/panel', exist_ok=True)
def wav(p, x):
    import wave
    y = (np.clip(x.T, -1, 1) * 32767).astype(np.int16)
    with wave.open(p, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
wav(f'zvuk/mix/{KIND}_pre.wav', mix * 0.5)
m = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'zvuk/mix/{KIND}_pre.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(json.loads(m[m.rindex('{'):m.rindex('}') + 1])['input_i'])
G = db(-14 - I) * 0.5
peak = np.abs(mix * G).max(0); look = int(0.005 * SR)
pk = maximum_filter1d(peak, look * 2 + 1); gr = np.minimum(1, db(-1.2) / (pk + 1e-9)); gr = uniform_filter1d(gr, look * 2 + 1); gr = np.minimum(gr, db(-1.0) / (peak + 1e-9))
for k in stems: stems[k] = stems[k] * G * gr
mix = sum(stems.values())
wav(f'zvuk/mix/{KIND}_mix.wav', mix)
for k, x in stems.items():
    wav(f'zvuk/mix/{KIND}_{k}.wav', x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'zvuk/mix/{KIND}_{k}.wav', '-c:a', 'aac', '-b:a', '160k', f'zvuk/panel/{KIND}_{k}.m4a'], check=True)
os.remove(f'zvuk/mix/{KIND}_pre.wav')
json.dump(log, open(f'zvuk/events_{KIND}_placed.json', 'w'), ensure_ascii=False)
print(KIND, 'events placed', len(log), 'input', round(I, 1), 'LUFS')
