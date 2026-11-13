"""Timeline for the GAME VR ZONE ad (9:16). Voice: ElevenLabs Liam.  python3 -I tools/plan_vr.py -> src/vr/tl.json"""
import json, os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
V = 'vr'
VOICE = os.path.join(ROOT, 'assets/voice_vr/voice.mp3')
WORDS = os.path.join(ROOT, 'assets/voice_vr/words_raw.json')
OUT = os.path.join(ROOT, 'src/vr/tl.json')

raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VOICE, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
VOICE_LEN = len(x) / 48000
hop = 480
n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12))
words = json.load(open(WORDS))

FIX = {0: 'Надень', 1: '', 9: 'GAME VR ZONE —', 10: 'VR-арену', 11: '', 13: 'Умитбаева,', 14: '', 20: 'игру.', 21: 'Ты', 28: 'КИБЕРБОКС —', 29: 'бой',
       31: 'крыше', 32: 'небоскрёба', 36: 'DANCE BATTLE —', 37: 'повтори', 38: 'движения', 45: 'лихорадка —', 46: 'собери', 57: 'красок,', 59: 'пингвинов,',
       61: 'бокс,', 62: 'Древорубы,', 64: 'Запад', 66: 'Фотоохота —', 67: 'весёлые', 78: 'адреналин —', 79: 'ZOMBIES:', 80: 'отбивайся', 86: 'TACTICS —',
       87: 'реалистичная', 93: 'BATTLE —', 94: 'штурмовик,', 104: 'погружение,', 105: 'новое', 119: 'GAME', 120: 'VR', 121: 'ZONE.', 122: 'Умитбаева,', 123: '', 124: '29.'}
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


INSERTS = [('B1', 5, 1.4), ('B2', 27, 0.6)]
OUTRO_HOLD = 3.0
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
SHOTS = [
    ('v_headset', 0.0, 'none', ['w2', 'w4']), ('v_tunnel', 'B1', 'flash', []), ('v_logo', 'w6', 'zoomin', ['w9', 'w12']),
    ('v_real', 'w16', 'whip', []), ('v_virtual', 'w21', 'flash', []), ('v_select', 'w25', 'glitch', []),
    ('v_cyberbox', 'w28', 'flash', ['w28', 'w33']), ('v_dance', 'w36', 'whip', ['w36', 'w41']), ('v_gold', 'w44', 'whip', ['w44', 'w50']),
    ('v_paint', 'w56', 'glitch', ['w56']), ('v_penguins', 'w58', 'glitch', ['w58']), ('v_jetbox', 'w60', 'glitch', ['w60']), ('v_wood', 'w62', 'glitch', ['w62']),
    ('v_west', 'w63', 'glitch', ['w63']), ('v_photo', 'w65', 'glitch', ['w65']), ('v_family', 'w67', 'whip', ['w73']),
    ('v_zombies', 'w75', 'fade', ['w79']), ('v_tactics', 'w86', 'flash', ['w86', 'w90']), ('v_battle', 'w92', 'flash', ['w93', 'w94', 'w95', 'w96', 'w98', 'w100']),
    ('v_features', 'w103', 'whip', ['w103', 'w105', 'w108']), ('v_friends', 'w111', 'whip', ['w113', 'w115', 'w117']), ('v_final', 'w119', 'flash', ['w119', 'w122', 'w125', 'w126', 'w127']),
]
MUSIC = [('edm_build', 0.0, 'B1'), ('edm_big', 'B1', ('w75', -0.1)), ('heavy', ('w75', -0.1), ('w103', -0.1)), ('edm_big', ('w103', -0.1), TOTAL)]
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

KEYW = {'шлем', 'выключается.', 'GAME VR ZONE —', 'живёшь.', 'мир.', 'КИБЕРБОКС —', 'DANCE BATTLE —', 'Золотая', 'лихорадка —', 'адреналин —', 'ZOMBIES:', 'TACTICS —', 'BATTLE —', 'погружение,', 'GAME', 'VR', 'ZONE.', 'Выбирай,', 'играй,', 'побеждай!', 'ритм.', 'монет'}
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
CUES += [('power_off', ('w5', 0.0), 'power_down', -8), ('warp', ('B1', 0.0), 'riser', -8), ('logo_boom', ('w9', 0.0), 'boom', -8), ('punch1', ('w29', 0.1), 'thud_big', -8),
         ('punch2', ('w33', 0.0), 'thud_big', -8), ('bell', ('w28', 0.0), 'ding', -10), ('coins', ('w50', 0.0), 'coins', -6), ('paint', ('w56', 0.1), 'pops', -8),
         ('zombie_drone', ('w75', 0.0), 'drone_low', -10), ('zombie_hit', ('w79', 0.0), 'impact_big', -8), ('laser', ('w80', 0.2), 'sparks', -12), ('tactics_hit', ('w86', 0.0), 'impact_big', -8),
         ('final_hit', TOTAL - OUTRO_HOLD, 'impact_big', -10)]
cues = {}
for name, a, kind, gain in CUES:
    cues[name] = {'t': round(T(a) if not isinstance(a, float) else a, 3), 'kind': kind, 'gain': gain}
music = [{'mood': m, 's': round(T(a), 3), 'e': round(T(b), 3)} for m, a, b in MUSIC]
inserts['OUTRO'] = {'start': round(TOTAL - OUTRO_HOLD, 3), 'dur': 0}

tl = {'kind': 'liberty', 'version': V, 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': VOICE_LEN, 'voice': 'assets/voice_vr/voice.mp3',
      'blocks': blocks, 'inserts': inserts, 'words': gw, 'shots': shots, 'chapters': [], 'subs': subs, 'cues': cues, 'music': music, 'red': [],
      'levels': {k: {'zone': v, 'start': inserts[k]['start'], 'dur': inserts[k]['dur']} for k, v in LEVEL_IN.items()},
      'flashCues': [], 'title': None, 'outro': None}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'vr: total {TOTAL:.2f}s = {TOTAL_FRAMES} frames; {len(shots)} shots; {len(subs)} subs; {len(cues)} cues')
for s in shots:
    print(f"  {s['id']:12s} {s['t']:7.2f}s {s['dur']:4d}f {s['tr']}")
