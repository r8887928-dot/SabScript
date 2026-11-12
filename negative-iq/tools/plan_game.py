"""Master timeline for «Что, если однажды ты проснёшься внутри видеоигры?»
Same pipeline as tools/plan.py (IQ video): voice word timings -> blocks + inserts -> shots, subtitles, sound cues,
music moods. Writes src/game/timeline.json.   Run: python3 -I tools/plan_game.py
"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
VOICE = os.path.join(ROOT, 'assets/voice_game/voice.mp3')
WORDS = os.path.join(ROOT, 'assets/voice_game/words_raw.json')
OUT = os.path.join(ROOT, 'src/game/timeline.json')

raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VOICE, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
VOICE_LEN = len(x) / 48000
hop = 480
n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12))

words = json.load(open(WORDS))
FIX = {32: '10', 60: 'неигровой', 61: '', 136: 'полушаге.', 159: 'сохранения.', 177: 'меню ты', 202: 'учёные', 203: 'всерьёз', 204: 'обсуждают:', 212: 'симуляция?'}
for i, w in enumerate(words):
    if i in FIX:
        w['w'] = FIX[i]
for i, w in enumerate(words):  # onset refinement (only later, only out of real silence)
    a, b = int(w['s'] * 100), int(min(VOICE_LEN, w['e']) * 100)
    seg = db[a:b]
    loud = np.where(seg > -38)[0]
    if len(loud) and (a + loud[0]) / 100 > w['s'] + 0.04 and (a + loud[0]) / 100 < w['e'] - 0.08 and (seg[:loud[0]] < -45).all():
        w['s'] = round((a + loud[0]) / 100 - 0.03, 3)


def quiet_mid(t0, t1):
    seg = db[int(t0 * 100):int(t1 * 100)]
    q = np.where(seg < -50)[0]
    return (t0 + t1) / 2 if len(q) == 0 else (int(t0 * 100) + (q[0] + q[-1]) / 2) / 100


# video = exactly the length of the voice-over: no inserted time
INSERTS = []
OUTRO = 0.0
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
voice_end_g = VOICE_LEN + offset
TOTAL = VOICE_LEN
TOTAL_FRAMES = int(round(TOTAL * FPS))


def g_word(i, t):
    return t + sum(dur for name, wi, c, dur in cuts if i > wi)


gw = [{'w': w['w'], 's': round(g_word(i, w['s']), 3), 'e': round(g_word(i, w['e']), 3)} for i, w in enumerate(words)]


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
SHOTS = [
    ('gh1_wake', 0.0, 'none'),
    ('gh2_world', 'w6', 'zoomout'),
    ('gh3_pixel', 'w12', 'glitch'),
    ('gm1_bed', 'w14', 'fade'),
    ('gm2_hpbar', 'w19', 'cut'),
    ('gm3_level', 'w25', 'zoomin'),
    ('I1', 'w31', 'glitch'),
    ('ga1_fridge', 'w34', 'whip'),
    ('ga2_mom', 'w46', 'whip'),
    ('ga3_npc', 'w58', 'zoomin'),
    ('I2', 'w63', 'glitch'),
    ('gb1_loops', 'w65', 'whip'),
    ('gb2_cars', 'w75', 'whip'),
    ('gb3_lod', 'w79', 'whip'),
    ('gb4_teeth', 'w88', 'whip'),
    ('I3', 'w100', 'glitch'),
    ('gc1_quests', 'w102', 'zoomin'),
    ('gc2_bread', 'w104', 'whip'),
    ('gc3_boss', 'w110', 'glitch'),
    ('gc4_wall', 'w118', 'whip'),
    ('I4', 'w128', 'glitch'),
    ('gd1_lag', 'w130', 'cut'),
    ('gd2_freeze', 'w133', 'glitch'),
    ('gd3_fall', 'w141', 'cut'),
    ('I5', 'w150', 'glitch'),
    ('ge1_save', 'w152', 'zoomin'),
    ('ge2_mug', 'w160', 'whip'),
    ('ge3_bus', 'w163', 'whip'),
    ('ge4_best', 'w166', 'flash'),
    ('I6', 'w172', 'glitch'),
    ('gf1_menu', 'w174', 'fade'),
    ('gf2_confirm', 'w185', 'cut'),
    ('gg1_lab', 'w197', 'fade'),
    ('gg2_sim', 'w205', 'glitch'),
    ('gg3_button', 'w213', 'glitch'),
    ('gg4_press', 'w225', 'zoomin'),
]
shots = []
for sid, a, tr in SHOTS:
    t = T(a) - (LEAD if isinstance(a, str) and a.startswith('w') else 0)
    shots.append({'id': sid, 't': max(0.0, t), 'tr': tr})
for s in shots:
    s['from'] = int(round(s['t'] * FPS))
for i, s in enumerate(shots):
    s['to'] = shots[i + 1]['from'] if i + 1 < len(shots) else TOTAL_FRAMES
    s['dur'] = s['to'] - s['from']
    assert s['dur'] > 8, (s['id'], s['dur'])

CHAPTERS = [('I1', 'ПЕРВЫЕ 10 МИНУТ', '00:10:00', 31, 33), ('I2', 'ПЕРВЫЙ ЧАС', '01:00:00', 63, 64), ('I3', 'ПЕРВЫЙ ДЕНЬ', 'ДЕНЬ 1', 100, 101),
            ('I4', 'ТРЕТИЙ ДЕНЬ', 'ДЕНЬ 3', 128, 129), ('I5', 'СЕДЬМОЙ ДЕНЬ', 'ДЕНЬ 7', 150, 151), ('I6', 'ТРИДЦАТЫЙ ДЕНЬ', 'ДЕНЬ 30', 172, 173)]
FACTS = {
    'I1': {'tag': 'ФАКТ', 'text': 'В видеоигры играют больше 3 миллиардов человек.', 'sub': 'Это почти каждый второй человек на Земле.'},
    'I2': {'tag': 'ФАКТ', 'text': 'Игры зарабатывают больше, чем мировой кинопрокат и музыка вместе.', 'sub': 'Это самая денежная индустрия развлечений.', 'q': 'А ты заметил бы, что мир — игра?'},
    'I3': {'tag': 'ФАКТ', 'text': 'Одну из первых видеоигр создали в 1958 году.', 'sub': 'Это был теннис на экране осциллографа.'},
    'I4': {'tag': 'ФАКТ', 'text': '«Лаг» — от английского lag: «отставание».', 'sub': 'Когда сервер не успевает, мир «замирает».', 'q': 'Как думаешь, что будет дальше?'},
    'I5': {'tag': 'ФАКТ', 'text': 'Реакция человека на картинку — около четверти секунды.', 'sub': 'Профи-геймеры тренируют её годами.'},
    'I6': {'tag': 'ФАКТ', 'text': 'В 2003 году философ Ник Бостром предположил:', 'sub': 'мы можем жить в компьютерной симуляции.', 'q': 'Самое странное — впереди…'},
}
chapters = [{'ins': ins, 'title': title, 'clock': clock, 'start': T(f'w{w0}'), 'end': T(f'w{w1}e'), 'ins_start': T(f'w{w0}') - LEAD,
             'ins_dur': 0, 'fact': None, 'short': True, 'w0': w0, 'w1': w1} for ins, title, clock, w0, w1 in CHAPTERS]
chapter_words = set()
for c in CHAPTERS:
    chapter_words.update(range(c[3], c[4] + 1))

KEY = {13, 10, 24, 29, 30, 39, 40, 45, 52, 57, 60, 74, 78, 82, 85, 87, 99, 98, 103, 105, 109, 111, 116, 117, 126, 127, 132, 136, 140, 146, 149, 159, 162, 165, 168, 169, 180, 182, 184, 196, 199, 212, 219, 224, 227}
RED = [13, 78, 111, 126, 127, 132, 146, 184, 196, 199, 212, 227]
FUNC = {'на', 'в', 'и', 'не', 'от', 'без', 'как', 'что', 'а', 'но', 'бы', 'до', 'по', 'у', 'к', 'с', 'за', 'из', 'о', 'им', 'их', 'её', 'под', 'тебе', 'ты'}
tokens = []
for i, w in enumerate(gw):
    if i in chapter_words:
        tokens.append(None)
        continue
    if not w['w'] or w['w'] == '—':
        continue
    tokens.append([i])


def tok_text(tk):
    return ''.join(gw[j]['w'] for j in tk)


chunks, cur = [], []
for tk in tokens + [None]:
    if tk is None:
        if cur:
            chunks.append(cur)
        cur = []
        continue
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
    subs.append({'s': round(s, 3), 'e': round(e, 3), 'words': [{'i': tk[0], 'w': tok_text(tk), 's': gw[tk[0]]['s'], 'e': gw[tk[-1]]['e'], 'k': any(j in KEY for j in tk)} for tk in c]})

CUES = [
    ('hook_tick', 0.0, 'impact_soft', -8),
    ('hook_eyes', ('w5', 0.0), 'boing', -12),
    ('hook_whoosh', ('w6', -0.12), 'whoosh_up', -8),
    ('hook_riser', ('w9', 0.0), 'riser', -10),
    ('hook_glitch', ('w12', -0.05), 'glitch', -6),
    ('hook_8bit', ('w13', 0.1), 'chip_powerup', -9),
    ('hook_boom', ('w13e', 0.02), 'boom', -4),
    ('birds', 'w14', 'birds', -12),
    ('eyes_open', ('w17', 0.1), 'chip_blip', -12),
    ('hp_appear', ('w23', -0.05), 'chip_powerup', -10),
    ('level_pop', ('w29', -0.05), 'chip_levelup', -8),
    ('steps', 'w34', 'footsteps', -16),
    ('fridge_glow', ('w39', 0.0), 'shimmer', -12),
    ('fridge_prompt', ('w44', 0.0), 'chip_blip', -10),
    ('mom1', ('w46', 0.0), 'chip_talk', -12),
    ('mom2', ('w53', -0.1), 'chip_talk', -12),
    ('mom3', ('w55', -0.1), 'chip_talk', -12),
    ('npc_tag', ('w60', 0.0), 'chip_select', -10),
    ('loops_amb', ('w65', -0.1), 'amb_city', -16),
    ('car_jitter', ('w76', 0.0), 'glitch', -12),
    ('car_clunk', ('w78', 0.0), 'clunk', -8),
    ('lod_pop1', ('w84', 0.0), 'pops', -12),
    ('lod_tex', ('w87', 0.0), 'shimmer', -12),
    ('brush', ('w93', 0.0), 'chalk', -16),
    ('xp_gain', ('w97', 0.0), 'chip_coin', -8),
    ('lvl2', ('w99', 0.2), 'chip_levelup', -9),
    ('quest_new', ('w102', 0.0), 'chip_quest', -12),
    ('shop_ding', ('w104', 0.0), 'shop_ding', -14),
    ('coins', ('w108', 0.0), 'chip_coins', -8),
    ('boss_alarm', ('w110', -0.05), 'alarm_klaxon', -14),
    ('boss_roar', ('w113', 0.0), 'chip_boss', -8),
    ('car_drive', ('w118', 0.0), 'amb_city', -18),
    ('wall_hit', ('w127', -0.05), 'chip_wall', -6),
    ('lag_stutter', ('w130', 0.0), 'chip_lag', -10),
    ('freeze', ('w134', 0.0), 'tape_freeze', -10),
    ('blink', ('w142', 0.0), 'chip_blip', -12),
    ('fall', ('w144', -0.1), 'chip_fall', -6),
    ('save', ('w153', 0.0), 'chip_save', -9),
    ('mug_drop', ('w160', 0.3), 'crash_small', -12),
    ('load1', ('w162', -0.1), 'rewind', -8),
    ('bus_leave', ('w163', 0.0), 'honk', -16),
    ('load2', ('w165', -0.1), 'rewind', -8),
    ('achievement', ('w168', 0.0), 'chip_achievement', -13),
    ('menu_open', ('w174', 0.0), 'chip_select', -9),
    ('menu_move1', ('w178', 0.0), 'chip_blip', -12),
    ('menu_move2', ('w180', 0.0), 'chip_blip', -12),
    ('menu_glitch', ('w182', 0.0), 'glitch', -9),
    ('dialog', ('w190', -0.05), 'chip_warning', -13),
    ('heart', ('w197', -0.3), 'heartbeat', -10),
    ('lab_drone', ('w197', 0.0), 'drone_low', -18),
    ('sim_glitch', ('w205', 0.0), 'glitch', -8),
    ('sim_power', ('w211', 0.0), 'power_down', -16),
    ('rewind_now', ('w213', -0.1), 'rewind', -10),
    ('present_city', ('w213', 1.2), 'amb_city', -18),
    ('button_appear', ('w219', -0.05), 'shimmer', -9),
    ('final_whoosh', ('w225', -0.15), 'whoosh_up', -10),
    ('final_hit', ('w227e', 0.15), 'impact_big', -7),
    ('outro_shimmer', ('w225', 0.0), 'chip_achievement', -14),
]
for ins, title, clock, w0, w1 in CHAPTERS:
    CUES += [(f'{ins}_glitch', (f'w{w0}', -0.1), 'glitch', -9), (f'{ins}_whoosh', (f'w{w0}', -0.25), 'whoosh', -12), (f'{ins}_slam', (f'w{w1}', 0.0), 'chip_select', -10)]
cues = {name: {'t': round(T(a), 3), 'kind': kind, 'gain': gain} for name, a, kind, gain in CUES}

MUSIC = [
    ('chip_hook', 0.0, ('w14', -0.6)),
    ('chip_morning', ('w14', -0.6), ('w31', -0.1)),
    ('chip_quirky', ('w31', -0.1), ('w63', -0.1)),
    ('chip_quirky2', ('w63', -0.1), ('w100', -0.1)),
    ('chip_quest', ('w100', -0.1), ('w128', -0.1)),
    ('chip_lag', ('w128', -0.1), ('w150', -0.1)),
    ('chip_happy', ('w150', -0.1), ('w172', -0.1)),
    ('chip_menu', ('w172', -0.1), ('w197', -0.3)),
    ('dark', ('w197', -0.3), ('w205', -0.1)),
    ('eerie', ('w205', -0.1), ('w213', -0.1)),
    ('finale', ('w213', -0.1), TOTAL),
]
music = [{'mood': m, 's': round(T(a), 3), 'e': round(T(b), 3)} for m, a, b in MUSIC]

HUD = {'start': T('w25'), 'end': T('w197'), 'xp': T('w97'), 'lvl2': T(('w99', 0.2)), 'coins': T('w108'),
       'wall': T(('w127', -0.05)), 'fall': T('w144'), 'load': T(('w162', -0.1)), 'lag0': T('w130'), 'lag1': T('w150'),
       'ch4': T('w128'), 'ch5': T('w150'), 'ch6': T('w172')}
inserts['TITLE'] = {'start': T(('w13e', -0.05)), 'dur': 0}
inserts['OUTRO'] = {'start': T(('w225', -0.1)), 'dur': 0}

tl = {
    'kind': 'game', 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': VOICE_LEN, 'voice': 'assets/voice_game/voice.mp3',
    'blocks': blocks, 'inserts': inserts, 'words': gw, 'shots': shots, 'chapters': chapters, 'subs': subs, 'cues': cues, 'music': music,
    'red': RED, 'hud': HUD, 'clockLabel': 'ВРЕМЯ В ИГРЕ', 'flashCues': ['hook_boom', 'wall_hit', 'final_hit'],
    'title': {'small': 'ЧТО, ЕСЛИ…', 'big': 'МИР — ИГРА?', 'sub': 'НАУЧНО-ФАНТАСТИЧЕСКИЙ ЭКСПЕРИМЕНТ', 'dur': round(T('w14') - T(('w13e', -0.05)) - 0.1, 3), 'fast': True},
    'outro': {'big': ['А ТЫ БЫ', 'НАЖАЛ?'], 'small': ['«Выйти из игры»…', 'или остаться?'], 'follow': 'Подпишись — впереди новые эксперименты', 'fast': True},
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'total {TOTAL:.2f}s = {TOTAL_FRAMES} frames; {len(shots)} shots; {len(subs)} subs; {len(cues)} cues')
for s in shots:
    print(f"  {s['id']:14s} {s['t']:7.2f}s {s['dur']:4d}f {s['tr']}")
for s in subs:
    print(f"  {s['s']:7.2f}-{s['e']:7.2f} " + ' '.join(('*' if w['k'] else '') + w['w'] for w in s['words']))
