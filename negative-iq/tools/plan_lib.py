"""Timelines for the Liberty Computer Club ad (9:16). Voice: ElevenLabs Liam.
python3 -I tools/plan_lib.py full|short  ->  src/liberty/tl_full.json | tl_short.json
"""
import json, os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
V = sys.argv[1] if len(sys.argv) > 1 else 'full'
VOICE = os.path.join(ROOT, f'assets/voice_lib/{V}_v2.mp3')
WORDS = os.path.join(ROOT, f'assets/voice_lib/{V}_v2_words.json')
OUT = os.path.join(ROOT, f'src/liberty/tl_{V}.json')

raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VOICE, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
VOICE_LEN = len(x) / 48000
hop = 480
n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12))
words = json.load(open(WORDS))

if V == 'full':
    FIX = {12: 'Liberty!', 19: 'Достык,', 20: '55.', 24: 'закрыто:', 25: 'Liberty', 28: 'Днём,', 30: 'в выходные.', 32: 'учёбы,', 39: 'ночи —', 40: 'двери',
           46: 'Liberty', 48: 'зоны,', 54: 'первый —', 55: 'MAIN.', 65: 'Всё', 70: '1 200', 71: '₸', 76: '1 400 ₸.', 78: 'второй —', 79: 'VIP.', 86: 'герц:',
           89: 'ещё', 91: '2 000', 92: '₸', 97: '2 300 ₸.', 99: 'третий —', 100: 'PRO.', 107: 'Super —', 108: 'для', 114: '2 500', 115: '₸', 120: '2 800 ₸.',
           123: 'уровень —', 124: 'PRIME.', 138: '3 000', 139: '₸', 144: '3 500 ₸.', 149: 'команду —', 150: 'играйте', 163: 'игре —', 164: 'здесь', 167: 'всё',
           173: 'Достык,', 176: 'Звони:', 177: '+7', 178: '', 182: '55.'}
    ENDS = {144: 74.6}
else:
    FIX = {9: 'Liberty —', 13: 'Достык,', 16: 'зоны —', 18: 'уровня:', 19: 'MAIN,', 20: 'VIP,', 21: 'PRO', 23: 'PRIME.', 27: 'предыдущей.', 37: 'Гц.', 39: '1 200',
           40: '₸', 43: 'Днём,', 45: 'в выходные —', 55: 'Достык,', 60: 'место!'}
    ENDS = {}
for i, w in enumerate(words):
    if i in FIX:
        w['w'] = FIX[i]
    if i in ENDS:
        w['e'] = ENDS[i]
for i, w in enumerate(words):
    a, b = int(w['s'] * 100), int(min(VOICE_LEN, w['e']) * 100)
    seg = db[a:b]
    loud = np.where(seg > -38)[0]
    if len(loud) and (a + loud[0]) / 100 > w['s'] + 0.04 and (a + loud[0]) / 100 < w['e'] - 0.08 and (seg[:loud[0]] < -45).all():
        w['s'] = round((a + loud[0]) / 100 - 0.03, 3)


def quiet_mid(t0, t1):
    seg = db[int(t0 * 100):int(t1 * 100)]
    q = np.where(seg < -50)[0]
    return (t0 + t1) / 2 if len(q) == 0 else (int(t0 * 100) + (q[0] + q[-1]) / 2) / 100


# music-only beats inserted after word index
INSERTS = [('B1', 8, 1.6), ('L1', 52, 1.5), ('L2', 76, 1.5), ('L3', 97, 1.5), ('L4', 120, 1.5)] if V == 'full' else [('B1', 9, 1.2)]
OUTRO_HOLD = 2.6
cuts = []
for name, wi, dur in INSERTS:
    c = round(quiet_mid(words[wi]['e'] - 0.2, words[wi + 1]['s'] + 0.2) * FPS) / FPS
    cuts.append((name, wi, c, dur))
blocks, inserts = [], {}
prev, offset = 0.0, 0.0
for name, wi, c, dur in cuts:
    blocks.append({'vin': prev, 'vout': c, 'g': prev + offset})
    inserts[name] = {'start': c + offset, 'dur': dur}
    offset += dur
    prev = c
blocks.append({'vin': prev, 'vout': VOICE_LEN, 'g': prev + offset})
TOTAL = VOICE_LEN + offset + OUTRO_HOLD
TOTAL_FRAMES = int(round(TOTAL * FPS))
gw = [{'w': w['w'], 's': round(w['s'] + sum(d for nm, wi, c, d in cuts if i > wi), 3), 'e': round(w['e'] + sum(d for nm, wi, c, d in cuts if i > wi), 3)} for i, w in enumerate(words)]


def T(a):
    if isinstance(a, tuple):
        return T(a[0]) + a[1]
    if isinstance(a, (int, float)):
        return float(a)
    if a.startswith('w'):
        return gw[int(a[1:-1])]['e'] if a.endswith('e') else gw[int(a[1:])]['s']
    if a.endswith('e') and a[:-1] in inserts:
        return inserts[a[:-1]]['start'] + inserts[a[:-1]]['dur']
    return inserts[a]['start']


LEAD = 2 / FPS
# (shot id, start, transition, beats: list of anchors for overlay timing)
if V == 'full':
    SHOTS = [
        ('l_lag', 0.0, 'none', ['w3', 'w6']), ('l_crack', 'w6', 'glitch', ['w8']), ('l_fly', 'B1', 'flash', []), ('l_logo', 'w12', 'zoomin', ['w12']),
        ('l_map', 'w18', 'whip', ['w19']), ('l_door', 'w21', 'whip', ['w27', 'w28', 'w29']), ('l_night', 'w31', 'fade', ['w37', 'w40']),
        ('l_select', 'w42', 'glitch', ['w47', 'w50', 'w51', 'w52']),
        ('lv_main', 'L1', 'flash', ['w55']), ('spec_main', 'w56', 'zoomin', ['w56', 'w59', 'w62']), ('play_main', 'w65', 'whip', ['w69', 'w74']),
        ('lv_vip', 'L2', 'flash', ['w79']), ('spec_vip', 'w80', 'zoomin', ['w80']), ('hz_vip', 'w83', 'zoomin', ['w85']), ('play_vip', 'w91', 'whip', ['w91', 'w95']),
        ('lv_pro', 'L3', 'flash', ['w100']), ('spec_pro', 'w101', 'zoomin', ['w101', 'w104']), ('play_pro', 'w108', 'whip', ['w114', 'w118']),
        ('lv_prime', 'L4', 'flash', ['w124']), ('spec_prime', 'w125', 'zoomin', ['w125', 'w128']), ('hz_prime', 'w131', 'zoomin', ['w134']),
        ('max_prime', 'w136', 'flash', ['w136', 'w138', 'w142']),
        ('l_team', 'w145', 'whip', ['w148']), ('l_team2', 'w152', 'whip', []), ('l_final', 'w169', 'flash', ['w169', 'w172', 'w175']),
        ('l_call', 'w176', 'zoomin', ['w177']), ('l_save', 'w183', 'whip', ['w183', 'w189']),
    ]
    MUSIC = [('edm_build', 0.0, 'B1'), ('edm', 'B1', 'L2'), ('edm', 'L2', 'L4'), ('edm_big', 'L4', ('w145', -0.1)), ('edm', ('w145', -0.1), ('w169', -0.1)), ('edm_big', ('w169', -0.1), TOTAL)]
    LEVEL_IN = {'L1': 'main', 'L2': 'vip', 'L3': 'pro', 'L4': 'prime'}
else:
    SHOTS = [
        ('l_lag', 0.0, 'none', ['w3']), ('l_fly', 'w6', 'glitch', []), ('l_logo', 'B1', 'flash', ['B1']), ('l_map', 'w10', 'whip', ['w13']),
        ('l_select', 'w15', 'glitch', ['w19', 'w20', 'w21', 'w23']), ('max_prime', 'w24', 'flash', ['w26']), ('spec_prime', 'w28', 'zoomin', ['w30']),
        ('hz_prime', 'w33', 'zoomin', ['w36']), ('play_main', 'w38', 'whip', ['w38']), ('l_door', 'w43', 'whip', ['w43', 'w44', 'w46']),
        ('l_team', 'w47', 'whip', ['w49']), ('l_final', 'w52', 'flash', ['w52', 'w55']), ('l_call', 'w57', 'zoomin', ['w57']),
    ]
    MUSIC = [('edm_build', 0.0, 'B1'), ('edm_big', 'B1', TOTAL)]
    LEVEL_IN = {}

shots = []
for sid, a, tr, beats in SHOTS:
    t = T(a) - (LEAD if isinstance(a, str) and a.startswith('w') else 0)
    shots.append({'id': sid, 't': max(0.0, t), 'tr': tr, 'beats': [round(T(b), 3) for b in beats]})
for s in shots:
    s['from'] = int(round(s['t'] * FPS))
for i, s in enumerate(shots):
    s['to'] = shots[i + 1]['from'] if i + 1 < len(shots) else TOTAL_FRAMES
    s['dur'] = s['to'] - s['from']
    assert s['dur'] > 8, (s['id'], s['dur'])

KEYW = {'лаги!', 'Liberty!', 'Liberty', 'круглосуточно.', 'уровень.', 'MAIN.', 'VIP.', 'PRO.', 'PRIME.', 'RTX', 'максимум.', 'команду —', 'Звони:', 'Круглосуточно.', 'место!', 'MAIN,', 'VIP,', 'Super', '600', '500', 'ждёт.'}
FUNC = {'на', 'в', 'и', 'не', 'от', 'без', 'как', 'что', 'а', 'но', 'бы', 'до', 'по', 'у', 'к', 'с', 'за', 'из', 'о', 'для'}
tokens = [[i] for i, w in enumerate(gw) if w['w'] and w['w'] != '—']


def tok_text(tk):
    return ''.join(gw[j]['w'] for j in tk)


chunks, cur = [], []
for tk in tokens + [None]:
    if tk is None:
        if cur:
            chunks.append(cur)
        break
    if cur:
        gap = gw[tk[0]]['s'] - gw[cur[-1][-1]]['e']
        text_len = sum(len(tok_text(x)) + 1 for x in cur) + len(tok_text(tk))
        if gap > 0.35 or text_len > 19 or len(cur) >= 3:
            carry = []
            while len(cur) > 1 and tok_text(cur[-1]).lower() in FUNC:
                carry.insert(0, cur.pop())
            chunks.append(cur)
            cur = carry
    cur.append(tk)
    if tok_text(tk)[-1] in '.?!,:':
        chunks.append(cur)
        cur = []
subs = []
for ci, c in enumerate(chunks):
    s = gw[c[0][0]]['s']
    e = gw[c[-1][-1]]['e'] + 0.3
    if ci + 1 < len(chunks):
        e = min(e, gw[chunks[ci + 1][0][0]]['s'])
    subs.append({'s': round(s, 3), 'e': round(e, 3), 'words': [{'i': tk[0], 'w': tok_text(tk), 's': gw[tk[0]]['s'], 'e': gw[tk[-1]]['e'], 'k': tok_text(tk) in KEYW} for tk in c]})

CUES = []
for s in shots:
    if s['tr'] in ('flash', 'glitch'):
        CUES.append((f"{s['id']}_hit", s['t'], 'impact_soft' if s['tr'] == 'flash' else 'glitch', -10))
    elif s['tr'] in ('whip', 'zoomin'):
        CUES.append((f"{s['id']}_whoosh", s['t'] - 0.05, 'whoosh', -14))
for ins in LEVEL_IN:
    CUES += [(f'{ins}_riser', (ins, 0.0), 'whoosh_up', -10), (f'{ins}_lvl', (ins, 0.75), 'impact_big', -9), (f'{ins}_shine', (ins, 0.8), 'shimmer', -14)]
for s in shots:
    for bi, b in enumerate(s['beats']):
        CUES.append((f"{s['id']}_b{bi}", b, 'pop', -16))
CUES += [('lag_err', ('w3', 0.0), 'error_buzz', -10), ('fly_riser', ('B1', 0.0), 'riser', -10), ('final_hit', TOTAL - OUTRO_HOLD, 'impact_big', -10)]
if V == 'full':
    CUES += [('crack', ('w8', 0.0), 'glitch', -6), ('crack2', ('w8', 0.15), 'crash_small', -8), ('logo_boom', ('w12', 0.0), 'boom', -8), ('door_open', ('w40', 0.0), 'shutter', -14)]
cues = {}
for name, a, kind, gain in CUES:
    cues[name] = {'t': round(T(a) if not isinstance(a, float) else a, 3), 'kind': kind, 'gain': gain}
music = [{'mood': m, 's': round(T(a), 3), 'e': round(T(b), 3)} for m, a, b in MUSIC]
inserts['OUTRO'] = {'start': round(TOTAL - OUTRO_HOLD, 3), 'dur': 0}

tl = {'kind': 'liberty', 'version': V, 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': VOICE_LEN, 'voice': f'assets/voice_lib/{V}_v2.mp3',
      'blocks': blocks, 'inserts': inserts, 'words': gw, 'shots': shots, 'chapters': [], 'subs': subs, 'cues': cues, 'music': music, 'red': [],
      'levels': {k: {'zone': v, 'start': inserts[k]['start'], 'dur': inserts[k]['dur']} for k, v in LEVEL_IN.items()},
      'flashCues': [], 'title': None, 'outro': None}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'{V}: total {TOTAL:.2f}s = {TOTAL_FRAMES} frames; {len(shots)} shots; {len(subs)} subs; {len(cues)} cues')
for s in shots:
    print(f"  {s['id']:12s} {s['t']:7.2f}s {s['dur']:4d}f {s['tr']}")
