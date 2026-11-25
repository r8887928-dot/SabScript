"""Timeline for «Сладкая волна» (Boston molasses flood, 9:16). One narration take (ElevenLabs Adam).
python3 -I tools/plan_mol.py -> src/molasses/tl.json  (needs assets/voice_mol/words_raw.json from whisper)"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
VOICE = os.path.join(ROOT, 'assets/voice_mol/voice.mp3')
OUT = os.path.join(ROOT, 'src/molasses/tl.json')
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VOICE, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True, check=True).stdout
VOICE_LEN = len(np.frombuffer(raw, dtype=np.float32)) / 48000
words = json.load(open(os.path.join(ROOT, 'assets/voice_mol/words_raw.json')))
FIX = {46: 'коричневый,', 61: 'бродить.', 71: 'неслась', 72: ''}
for i, t in FIX.items():
    words[i]['w'] = t
OUTRO = 2.2
TOTAL = VOICE_LEN + OUTRO
TOTAL_FRAMES = int(round(TOTAL * FPS))
gw = words

# (id, first word, small label, big label)
SHOTS = [('m_hook', 0, 'БОСТОН', '1919'), ('m_notwater', 11, 'ЭТО НЕ ВОДА', 'ПАТОКА'), ('m_tank', 19, 'ОДИН БАК', '9 000 000 Л'),
         ('m_leak', 28, 'С ПЕРВОГО ДНЯ', 'ТЕЧЁТ'), ('m_paint', 40, 'РЕШЕНИЕ', 'ПЕРЕКРАСИТЬ'), ('m_warm', 52, '15 ЯНВАРЯ', '−17° → +5°'),
         ('m_burst', 62, 'ПОЛДЕНЬ', 'БАК ЛОПНУЛ'), ('m_wave', 70, 'СКОРОСТЬ', '56 КМ/Ч'), ('m_run', 86, 'УБЕЖАТЬ?', ''),
         ('m_stuck', 91, 'НА ХОЛОДЕ', 'КАК МЁД'), ('m_after', 105, 'ПОГИБЛИ', '21 ЧЕЛОВЕК'), ('m_rule', 108, 'НОВОЕ ПРАВИЛО', 'ПОДПИСЬ ИНЖЕНЕРА'),
         ('m_today', 119, 'СЕГОДНЯ', 'ВЕРИТЕ?')]
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
    if s['id'] in ('m_burst', 'm_after', 'm_today'):
        s['tr'] = 'flash' if s['id'] == 'm_burst' else 'fade'
KEYW = {'трёхэтажный', 'патока.', 'гигантский', 'девять', 'миллионов', 'протекал', 'леденцы.', 'коричневый,', 'видно.', 'потеплело.', 'бродить.', 'пули,', 'лопнул.', 'Волна', '50', 'километров', 'убежать.', 'густеет,', 'мёд.', 'держит.', '21', 'инженер.', 'пахнет', 'патокой.', 'Верите?'}
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
CUES = [('wind', 0.0, 'wind', -14), ('hook_boom', 0.05, 'boom', -8), ('gulls', W(19), 'birds', -16), ('drip1', W(29), 'pop', -14), ('drip2', W(35), 'pop', -14),
        ('brush', W(43), 'whoosh', -16), ('creak', W(57), 'strain', -8), ('bubbles', W(60), 'pops', -12), ('rivets', W(64), 'gunshot', -6), ('rivets2', W(66), 'gunshot', -8),
        ('burst', W(68), 'impact_big', -2), ('burst2', W(69), 'crash_small', -6), ('wave', W(70), 'riser', -8), ('rumble', W(71), 'drone_low', -8), ('bend', W(82), 'strain', -6),
        ('bend2', W(83), 'thud_big', -6), ('run', W(88), 'footsteps', -12), ('stuck', W(94), 'crumble', -12), ('bell', W(105), 'school_bell', -22), ('stamp', W(117), 'stamp', -6),
        ('birds', W(119), 'birds', -12), ('end', W(131), 'ding', -12)]
for s in shots[1:]:
    if s['tr'] == 'cut':
        CUES.append((s['id'] + '_sw', s['t'] - 0.05, 'whoosh', -20))
cues = {n: {'t': t, 'kind': k, 'gain': g} for n, t, k, g in CUES}
MUSIC = [('eerie', 0.0, W(19)), ('comedy', W(19), W(52)), ('tension', W(52), W(70)), ('heavy', W(70), W(105)), ('sad', W(105), W(119)), ('interlude', W(119), TOTAL)]
music = [{'mood': m, 's': s, 'e': e} for m, s, e in MUSIC]
tl = {'kind': 'club', 'version': 'mol', 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': VOICE_LEN, 'voice': 'assets/voice_mol/voice.mp3',
      'blocks': [{'vin': 0.0, 'vout': VOICE_LEN, 'g': 0.0}], 'inserts': {'OUTRO': {'start': round(VOICE_LEN, 3), 'dur': 0}}, 'words': gw, 'shots': shots,
      'chapters': [], 'subs': subs, 'cues': cues, 'music': music, 'red': [], 'flashCues': [], 'title': None, 'outro': None}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'mol: total {TOTAL:.2f}s = {TOTAL_FRAMES} frames')
for s in shots:
    print(f"  {s['id']:9s} {s['t']:6.2f}s {s['dur']:4d}f")
