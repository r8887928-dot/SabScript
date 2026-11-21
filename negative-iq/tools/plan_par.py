"""Timeline for the parable short «Абрикос через стену» (9:16). One narration take (ElevenLabs Adam).
python3 -I tools/plan_par.py -> src/parable/tl.json  (needs assets/voice_par/words_raw.json from whisper)"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
VOICE = os.path.join(ROOT, 'assets/voice_par/voice.mp3')
OUT = os.path.join(ROOT, 'src/parable/tl.json')
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VOICE, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True, check=True).stdout
VOICE_LEN = len(np.frombuffer(raw, dtype=np.float32)) / 48000
words = json.load(open(os.path.join(ROOT, 'assets/voice_par/words_raw.json')))
FIX = {16: 'Абдуллы,', 33: 'Абдулла', 39: 'абрикосы!»', 40: '', 50: 'махалля', 60: 'Абдуллы»,', 75: 'Абдулла', 111: 'Абдулла', 119: 'Отнятое'}
for i, t in FIX.items():
    words[i]['w'] = t
OUTRO = 4.0
TOTAL = VOICE_LEN + OUTRO
TOTAL_FRAMES = int(round(TOTAL * FPS))
gw = words

# (id, first word, small label, big label)
SHOTS = [('p_hook', 0, 'ДВА СОСЕДА', 'ОДНО ДЕРЕВО'), ('p_tree', 11, 'АБРИКОС', 'ЧЕРЕЗ СТЕНУ'), ('p_pick', 24, 'КАРИМ', 'УПАЛО — МОЁ'),
         ('p_shout', 33, 'АБДУЛЛА', '«МОИ!»'), ('p_no', 41, 'КАРИМ', '«НЕТ, МОИ!»'), ('p_crowd', 49, 'ПОЗВАЛИ МЕНЯ', 'ВСЯ МАХАЛЛЯ'),
         ('p_judge', 57, 'Я СКАЗАЛ', 'ДЕРЕВО — АБДУЛЛЫ'), ('p_shade', 61, 'ДЕРЕВО АБДУЛЛЫ', 'НО ТЕНЬ...'), ('p_think', 75, 'СОСЕДИ', 'ТИШИНА'),
         ('p_wind', 79, 'НОЧЬЮ', 'ВЕТЕР'), ('p_crack', 83, 'УТРОМ', 'ТРЕСК!'), ('p_fall', 94, 'ВПЕРВЫЕ ЗА ГОД', 'РЯДОМ'),
         ('p_build', 102, 'СТЕНА НИЖЕ', 'ВМЕСТЕ'), ('p_trade', 110, 'ТЕПЕРЬ', 'АБРИКОС ↔ ВИНОГРАД'), ('p_moral', 119, 'МОРАЛЬ', '1 ДЕНЬ / КАЖДЫЙ ГОД'),
         ('p_ask', 127, 'А ВЫ?', 'ДА ИЛИ НЕТ?')]
shots = []
for sid, wi, small, big in SHOTS:
    t = 0.0 if wi == 0 else gw[wi]['s'] - 0.1
    shots.append({'id': sid, 't': round(t, 3), 'tr': 'cut', 'small': small, 'big': big, 'beats': []})
for s in shots:
    s['from'] = int(round(s['t'] * FPS))
for i, s in enumerate(shots):
    s['to'] = shots[i + 1]['from'] if i + 1 < len(shots) else TOTAL_FRAMES
    s['dur'] = s['to'] - s['from']
for s in shots:
    if s['id'] in ('p_wind', 'p_crack', 'p_moral'):
        s['tr'] = 'fade' if s['id'] == 'p_moral' else 'flash'

KEYW = {'абрикосового', 'здоровались.', 'стену', 'всё,', '«Это', 'мои', 'абрикосы!»', '«Нет»,', 'мои».', 'махалля', 'рассудить.', 'тень', 'растёт.',
        'задумался.', 'замолчал.', 'ветер.', 'треска.', 'рухнула.', 'рядом.', 'Вместе', 'вместе', 'абрикосы,', 'виноград.', 'день.', 'каждый', 'год.', 'поделились', '«да»', '«нет».'}
FUNC = {'на', 'в', 'и', 'не', 'от', 'за', 'у', 'к', 'с', 'а', 'но', 'во', 'ко', 'бы', 'что'}
toks = [i for i, w in enumerate(gw) if w['w']]
chunks, cur = [], []
for i in toks:
    if cur:
        gap = gw[i]['s'] - gw[cur[-1]]['e']
        ln = sum(len(gw[j]['w']) + 1 for j in cur) + len(gw[i]['w'])
        if gap > 0.35 or ln > 20 or len(cur) >= 3:
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
CUES = [('amb_birds', 0.2, 'birds', -14), ('pick1', W(26), 'pop', -12), ('pick2', W(29), 'pop', -12), ('shout', W(37), 'boing', -12), ('no', W(41), 'bonk', -12),
        ('crowd', W(49), 'crowd', -16), ('judge', W(57), 'ding', -14), ('think', W(76), 'ticks', -16), ('wind', W(79), 'wind', -6), ('crack', W(86), 'wood_hit', -4),
        ('crash', W(94), 'crumble', -4), ('crash2', W(94, 0.1), 'thud_big', -6), ('build1', W(106), 'wood_hit', -12), ('build2', W(106, 0.6), 'thud', -12),
        ('trade', W(115), 'pop', -12), ('trade2', W(118), 'pop', -12), ('moral', W(119), 'shimmer', -12), ('ask', W(127), 'ding', -10), ('end', VOICE_LEN + 0.3, 'pop', -10)]
for s in shots[1:]:
    if s['tr'] == 'cut':
        CUES.append((s['id'] + '_sw', s['t'] - 0.05, 'whoosh', -20))
cues = {n: {'t': t, 'kind': k, 'gain': g} for n, t, k, g in CUES}
MUSIC = [('morning', 0.0, W(33)), ('comedy', W(33), W(57)), ('interlude', W(57), W(79)), ('tension', W(79), W(102)), ('finale', W(102), TOTAL)]
music = [{'mood': m, 's': s, 'e': e} for m, s, e in MUSIC]
tl = {'kind': 'club', 'version': 'par', 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': VOICE_LEN, 'voice': 'assets/voice_par/voice.mp3',
      'blocks': [{'vin': 0.0, 'vout': VOICE_LEN, 'g': 0.0}], 'inserts': {'OUTRO': {'start': round(VOICE_LEN, 3), 'dur': 0}}, 'words': gw, 'shots': shots,
      'chapters': [], 'subs': subs, 'cues': cues, 'music': music, 'red': [], 'flashCues': [], 'title': None, 'outro': None}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'par: total {TOTAL:.2f}s = {TOTAL_FRAMES} frames')
for s in shots:
    print(f"  {s['id']:9s} {s['t']:6.2f}s {s['dur']:4d}f")
