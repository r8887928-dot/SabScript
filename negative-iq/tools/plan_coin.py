"""Timeline for the puzzle short «9 монет и 2 взвешивания» (9:16). One narration take (ElevenLabs Adam).
python3 -I tools/plan_coin.py -> src/coins/tl.json  (needs assets/voice_coin/words_raw.json from whisper)"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
VOICE = os.path.join(ROOT, 'assets/voice_coin/voice.mp3')
OUT = os.path.join(ROOT, 'src/coins/tl.json')
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VOICE, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True, check=True).stdout
VOICE_LEN = len(np.frombuffer(raw, dtype=np.float32)) / 48000
words = json.load(open(os.path.join(ROOT, 'assets/voice_coin/words_raw.json')))
FIX = {37: 'приём.', 91: 'ещё', 95: '', 96: 'налево,', 98: '', 99: 'направо,', 121: 'даёт', 139: 'всё.'}
for i, t in FIX.items():
    words[i]['w'] = t
OUTRO = 2.5
TOTAL = VOICE_LEN + OUTRO
TOTAL_FRAMES = int(round(TOTAL * FPS))
gw = words

# (id, first word, board text)
SHOTS = [('c_intro', 0, '9'), ('c_fake', 5, '1 ?'), ('c_scale', 18, '2'), ('c_ask', 30, '?'), ('c_trick', 33, '?'), ('c_split', 38, '3·3·3'),
         ('c_place', 48, '3·3·3'), ('c_balance', 60, '='), ('c_tilt', 68, '↑'), ('c_three', 77, '9→3'), ('c_again', 87, '3'), ('c_second', 93, '1·1·1'),
         ('c_result', 103, '↑'), ('c_eq', 108, '='), ('c_why', 115, '3×3'), ('c_math', 119, '3×3=9'), ('c_end', 137, '1')]
shots = []
for sid, wi, board in SHOTS:
    t = 0.0 if wi == 0 else gw[wi]['s'] - 0.1
    shots.append({'id': sid, 't': round(t, 3), 'tr': 'cut', 'board': board, 'beats': []})
for s in shots:
    s['from'] = int(round(s['t'] * FPS))
for i, s in enumerate(shots):
    s['to'] = shots[i + 1]['from'] if i + 1 < len(shots) else TOTAL_FRAMES
    s['dur'] = s['to'] - s['from']
KEYW = set()
FUNC = set()
toks = [i for i, w in enumerate(gw) if w['w']]
chunks, cur = [], []
for i in toks:
    if cur:
        gap = gw[i]['s'] - gw[cur[-1]]['e']
        ln = sum(len(gw[j]['w']) + 1 for j in cur) + len(gw[i]['w'])
        if True:
            carry = []
            while len(cur) > 1 and gw[cur[-1]]['w'].lower() in FUNC:
                carry.insert(0, cur.pop())
            chunks.append(cur); cur = carry
    cur.append(i)
    if gw[i]['w'][-1] in '.?!,:»':
        chunks.append(cur); cur = []
if cur:
    chunks.append(cur)
subs = []
for ci, c in enumerate(chunks):
    s, e = gw[c[0]]['s'], gw[c[-1]]['e'] + 0.3
    if ci + 1 < len(chunks):
        e = min(e, gw[chunks[ci + 1][0]]['s'])
    subs.append({'s': round(s, 3), 'e': round(e, 3), 'words': [{'i': j, 'w': gw[j]['w'], 's': gw[j]['s'], 'e': gw[j]['e'], 'k': gw[j]['w'] in KEYW} for j in c]})

W = lambda i, d=0.0: round(gw[i]['s'] + d, 3)
CUES = [('coins', W(2), 'coins', -10), ('fake', W(8), 'shimmer', -12), ('ask', W(30), 'ding', -12), ('split1', W(44), 'coins', -12), ('split2', W(47), 'coins', -12),
        ('pan1', W(52), 'clunk', -10), ('pan2', W(56), 'clunk', -10), ('eq', W(63), 'ding', -14), ('tilt', W(72), 'wood_hit', -10), ('three', W(86), 'pop', -10),
        ('pan3', W(96), 'clunk', -10), ('pan4', W(99), 'clunk', -10), ('tilt2', W(103), 'wood_hit', -10), ('eq2', W(108), 'ding', -14), ('math', W(135), 'chip_achievement', -12),
        ('end', W(141), 'shimmer', -10)]
for s in shots[1:]:
    if s['tr'] == 'cut':
        CUES.append((s['id'] + '_sw', s['t'] - 0.05, 'whoosh', -20))
cues = {n: {'t': t, 'kind': k, 'gain': g} for n, t, k, g in CUES}
MUSIC = [('eerie', 0.0, W(33)), ('interlude', W(33), W(115)), ('twist', W(115), W(137)), ('finale', W(137), TOTAL)]
music = [{'mood': m, 's': s, 'e': e} for m, s, e in MUSIC]
tl = {'kind': 'club', 'version': 'coin', 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': VOICE_LEN, 'voice': 'assets/voice_coin/voice.mp3',
      'blocks': [{'vin': 0.0, 'vout': VOICE_LEN, 'g': 0.0}], 'inserts': {'OUTRO': {'start': round(VOICE_LEN, 3), 'dur': 0}}, 'words': gw, 'shots': shots,
      'chapters': [], 'subs': subs, 'cues': cues, 'music': music, 'red': [], 'flashCues': [], 'title': None, 'outro': None}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'coin: total {TOTAL:.2f}s = {TOTAL_FRAMES} frames')
for s in shots:
    print(f"  {s['id']:9s} {s['t']:6.2f}s {s['dur']:4d}f")
