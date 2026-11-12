"""Long-form (16:9) timeline for «Что, если однажды ты проснёшься внутри видеоигры?» — voice: ElevenLabs Liam, 7:26.
Voice + title + 2 s chapter beats + 20 s end screen  ->  src/long/timeline.json.   Run: python3 -I tools/plan_long.py
"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
VOICE = os.path.join(ROOT, 'assets/voice_long/voice.mp3')
WORDS = os.path.join(ROOT, 'assets/voice_long/words_raw.json')
OUT = os.path.join(ROOT, 'src/long/timeline.json')

raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VOICE, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
VOICE_LEN = len(x) / 48000
hop = 480
n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12))

words = json.load(open(WORDS))
FIX = {72: 'всплывает', 142: 'неигровой', 143: '', 253: 'не выдумка.', 642: 'сохранения.', 699: '1.1.', 700: '', 701: 'Исправлены', 712: 'Сохранения',
       722: 'лёгкой.', 736: 'убирают', 743: 'Двадцать первый', 759: 'раздаёт', 773: 'ими.', 814: 'определённым', 819: 'неё.', 838: 'спидраннерами.',
       849: 'Тридцатый', 854: 'меню ты', 875: 'учёные', 876: 'всерьёз', 921: 'живём', 981: 'ошибок.', 1015: 'пропадёт', 624: 'жизней', 565: '',
       564: 'настоящий?»', 882: '—'}
for i, w in enumerate(words):
    if i in FIX:
        w['w'] = FIX[i]
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


INSERTS = [('TITLE', 42, 3.5), ('C1', 109, 2.0), ('C2', 205, 2.0), ('C3', 296, 2.0), ('C4', 370, 2.0), ('C5', 458, 2.0), ('C6', 531, 2.0),
           ('C7', 633, 2.0), ('C8', 671, 2.0), ('C9', 742, 2.0), ('C10', 848, 2.0), ('STRANGE', 870, 1.5), ('NOW', 981, 1.0)]
END = 20.0
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
inserts['END'] = {'start': voice_end_g + 0.3, 'dur': END}
TOTAL = voice_end_g + 0.3 + END
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
    ('L01_wake', 0.0, 'none'), ('L02_world', 'w6', 'zoomout'), ('L03_pixel', 'w12', 'glitch'), ('L04_notdream', 'w14', 'glitch'),
    ('L05_gameworld', 'w18', 'whip'), ('L06_teaser', 'w26', 'zoomin'),
    ('title', 'TITLE', 'glitch'),
    ('L07_sunrise', 'w43', 'flash'), ('L08_eyes', 'w45', 'cut'), ('L09_hpbar', 'w48', 'cut'), ('L10_level', 'w54', 'zoomin'),
    ('L11_tutorial', 'w65', 'whip'), ('L12_inventory', 'w82', 'zoomin'),
    ('C1', 'C1', 'glitch'), ('L13_fridge', 'w113', 'whip'), ('L14_mom', 'w125', 'whip'), ('L15_npc', 'w140', 'zoomin'), ('L16_dad', 'w145', 'whip'),
    ('L17_trash', 'w159', 'whip'), ('L18_choice', 'w175', 'whip'),
    ('C2', 'C2', 'glitch'), ('L19_loops', 'w208', 'whip'), ('L20_dog', 'w221', 'whip'), ('L21_cars', 'w231', 'whip'), ('L22_lod', 'w241', 'whip'),
    ('L23_lodfact', 'w250', 'zoomin'), ('L24_saving', 'w272', 'zoomout'), ('L25_teeth', 'w280', 'whip'),
    ('C3', 'C3', 'glitch'), ('L26_quests', 'w299', 'zoomin'), ('L27_bread', 'w301', 'whip'), ('L28_boss', 'w317', 'glitch'), ('L29_wall', 'w337', 'whip'),
    ('C4', 'C4', 'glitch'), ('L30_pay', 'w373', 'zoomin'), ('L31_discount', 'w382', 'whip'), ('L32_garages', 'w391', 'whip'), ('L33_room', 'w398', 'fade'),
    ('L34_egg', 'w408', 'glitch'), ('L35_name', 'w447', 'fade'),
    ('C5', 'C5', 'glitch'), ('L36_lag', 'w461', 'cut'), ('L37_freeze', 'w464', 'glitch'), ('L38_fall', 'w480', 'cut'), ('L39_under', 'w489', 'zoomout'),
    ('L40_respawn', 'w504', 'flash'), ('L41_lagfact', 'w516', 'glitch'),
    ('C6', 'C6', 'glitch'), ('L42_stranger', 'w534', 'whip'), ('L43_chat', 'w553', 'zoomin'), ('L44_players', 'w566', 'whip'), ('L45_jump', 'w593', 'whip'),
    ('L46_lives', 'w623', 'zoomout'),
    ('C7', 'C7', 'glitch'), ('L47_save', 'w636', 'zoomin'), ('L48_mug', 'w643', 'whip'), ('L49_bus', 'w645', 'whip'), ('L50_exam', 'w647', 'whip'),
    ('L51_best', 'w650', 'flash'), ('L52_reaction', 'w656', 'zoomin'),
    ('C8', 'C8', 'glitch'), ('L53_fixed', 'w674', 'fade'), ('L54_patch', 'w692', 'zoomout'), ('L55_noload', 'w703', 'glitch'), ('L56_updates', 'w723', 'whip'),
    ('C9', 'C9', 'glitch'), ('L57_flyer', 'w745', 'whip'), ('L58_money', 'w753', 'whip'), ('L60_banned', 'w774', 'whip'), ('L61_clip', 'w799', 'whip'),
    ('L62_speedrun', 'w820', 'zoomin'),
    ('C10', 'C10', 'glitch'), ('L63_menu', 'w851', 'fade'), ('L64_confirm', 'w861', 'cut'),
    ('L65_lab', 'STRANGE', 'fade'), ('L66_sim', 'w878', 'glitch'), ('L67_bostrom', 'w886', 'whip'), ('L68_worlds', 'w895', 'zoomout'), ('L69_chance', 'w916', 'zoomin'),
    ('L70_pixels', 'w934', 'glitch'), ('L71_dev', 'w960', 'fade'),
    ('L72_button', 'NOW', 'glitch'), ('L73_press', 'w994', 'zoomin'), ('L74_cta', 'w997', 'flash'),
    ('END', 'END', 'fade'),
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

CHAPTERS = [('C1', 'ПЕРВЫЕ 10 МИНУТ', '00:10:00', 110, 112), ('C2', 'ПЕРВЫЙ ЧАС', '01:00:00', 206, 207), ('C3', 'ПЕРВЫЙ ДЕНЬ', 'ДЕНЬ 1', 297, 298),
            ('C4', 'ВТОРОЙ ДЕНЬ', 'ДЕНЬ 2', 371, 372), ('C5', 'ТРЕТИЙ ДЕНЬ', 'ДЕНЬ 3', 459, 460), ('C6', 'ПЯТЫЙ ДЕНЬ', 'ДЕНЬ 5', 532, 533),
            ('C7', 'СЕДЬМОЙ ДЕНЬ', 'ДЕНЬ 7', 634, 635), ('C8', 'ЧЕТЫРНАДЦАТЫЙ ДЕНЬ', 'ДЕНЬ 14', 672, 673), ('C9', 'ДВАДЦАТЬ ПЕРВЫЙ ДЕНЬ', 'ДЕНЬ 21', 743, 744),
            ('C10', 'ТРИДЦАТЫЙ ДЕНЬ', 'ДЕНЬ 30', 849, 850)]
TARGETS = {'C1': [0, 600], 'C2': [600, 3600], 'C3': [3600, 86400], 'C4': [86400, 2 * 86400], 'C5': [2 * 86400, 3 * 86400], 'C6': [3 * 86400, 5 * 86400],
           'C7': [5 * 86400, 7 * 86400], 'C8': [7 * 86400, 14 * 86400], 'C9': [14 * 86400, 21 * 86400], 'C10': [21 * 86400, 30 * 86400]}
chapters = [{'ins': ins, 'title': title, 'clock': clock, 'start': T(f'w{w0}'), 'end': T(f'w{w1}e'), 'ins_start': inserts[ins]['start'], 'ins_dur': inserts[ins]['dur'],
             'fact': None, 'target': TARGETS[ins], 'w0': w0, 'w1': w1} for ins, title, clock, w0, w1 in CHAPTERS]
chapter_words = set()
for c in CHAPTERS:
    chapter_words.update(range(c[3], c[4] + 1))

KEY = {13, 19, 25, 42, 53, 59, 74, 94, 98, 101, 118, 124, 131, 136, 142, 155, 158, 166, 174, 189, 192, 201, 217, 220, 223, 230, 234, 244, 249, 253, 271, 277, 279, 291,
       296, 300, 305, 316, 318, 324, 336, 356, 367, 381, 390, 397, 407, 409, 427, 446, 458, 463, 467, 471, 479, 488, 492, 495, 503, 515, 517, 524, 537, 545, 564, 568,
       583, 597, 610, 622, 633, 638, 642, 644, 646, 649, 653, 661, 671, 680, 697, 699, 702, 709, 713, 728, 752, 757, 764, 791, 798, 808, 819, 838, 848, 857, 860, 870,
       873, 885, 891, 894, 910, 915, 928, 933, 944, 959, 964, 971, 981, 988, 993, 996, 1000, 1002, 1004, 1016}
RED = [13, 25, 234, 244, 336, 356, 463, 488, 492, 622, 633, 713, 764, 791, 798, 860, 870, 873, 885, 996]
FUNC = {'на', 'в', 'и', 'не', 'от', 'без', 'как', 'что', 'а', 'но', 'бы', 'до', 'по', 'у', 'к', 'с', 'за', 'из', 'о', 'им', 'их', 'её', 'под', 'тебе', 'ты', 'со'}
tokens = []
for i, w in enumerate(gw):
    if i in chapter_words:
        tokens.append(None)
        continue
    if not w['w'] or w['w'] in ('—', '–'):
        continue
    if w['w'].startswith('-') and tokens and tokens[-1]:
        tokens[-1].append(i)
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
        if gap > 0.35 or text_len > 26 or len(cur) >= 4:
            carry = []
            while len(cur) > 1 and tok_text(cur[-1]).lower() in FUNC:
                carry.insert(0, cur.pop())
            chunks.append(cur)
            cur = carry
    cur.append(tk)
    if tok_text(tk)[-1] in '.?!,:»':
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
    ('hook_tick', 0.0, 'impact_soft', -8), ('hook_eyes', ('w5', 0.0), 'boing', -12), ('hook_whoosh', ('w6', -0.12), 'whoosh_up', -9),
    ('hook_glitch', ('w12', -0.05), 'glitch', -7), ('hook_8bit', ('w13', 0.1), 'chip_powerup', -10), ('hook_boom', ('w13e', 0.02), 'boom', -5),
    ('notdream', ('w14', 0.0), 'glitch', -12), ('gameworld', ('w18', 0.0), 'chip_quest', -13), ('btn_tease', ('w24', 0.0), 'chip_select', -12),
    ('teaser', ('w26', -0.1), 'drone_low', -18),
    ('title_glitch', 'TITLE', 'glitch', -7), ('title_hit', ('TITLE', 0.35), 'impact_big', -6),
    ('birds', 'w43', 'birds', -13), ('eyes_open', ('w46', 0.1), 'chip_blip', -12), ('hp_appear', ('w52', -0.05), 'chip_powerup', -11),
    ('level_pop', ('w58', -0.05), 'chip_levelup', -10), ('blink', ('w61', 0.0), 'chip_blip', -14), ('tutorial', ('w74', -0.05), 'chip_quest', -12),
    ('inv_open', ('w93', 0.0), 'chip_select', -10), ('inv1', ('w95', 0.0), 'chip_blip', -12), ('inv2', ('w96', 0.0), 'chip_blip', -12), ('inv3', ('w98', 0.0), 'chip_blip', -12),
    ('fridge_glow', ('w119', 0.0), 'shimmer', -13), ('fridge_prompt', ('w123', 0.0), 'chip_blip', -11),
    ('mom1', ('w125', 0.0), 'chip_talk', -13), ('mom2', ('w132', -0.1), 'chip_talk', -13), ('mom3', ('w134', -0.1), 'chip_talk', -13), ('npc_tag', ('w142', 0.0), 'chip_select', -11),
    ('dad_quest', ('w153', 0.0), 'chip_quest', -11), ('trash_xp', ('w164', 0.0), 'chip_coin', -9), ('choice', ('w186', 0.0), 'chip_select', -11), ('choice_pick', ('w192', 0.0), 'chip_blip', -11),
    ('loops_amb', ('w208', -0.1), 'amb_city', -17), ('dog', ('w223', 0.0), 'pop', -14), ('car_jitter', ('w232', 0.0), 'glitch', -13), ('car_clunk', ('w236', 0.0), 'clunk', -10),
    ('lod_pop', ('w246', 0.0), 'pops', -13), ('lod_tex', ('w249', 0.0), 'shimmer', -13), ('fact_lod', ('w254', 0.0), 'stamp', -12),
    ('brush', ('w285', 0.0), 'chalk', -16), ('xp_gain', ('w289', 0.0), 'chip_coin', -9), ('lvl2', ('w295', 0.0), 'chip_levelup', -10),
    ('quest_new', ('w299', 0.0), 'chip_quest', -12), ('coins', ('w304', 0.0), 'chip_coins', -9), ('coins2', ('w312', 0.0), 'chip_coins', -11),
    ('boss_roar', ('w320', 0.0), 'chip_boss', -9), ('car_drive', ('w337', 0.0), 'amb_city', -18), ('wall_hit', ('w356', -0.05), 'chip_wall', -7),
    ('pay', ('w380', 0.0), 'chip_coin', -11), ('talk1', ('w383', 0.0), 'chip_talk', -14), ('discount', ('w390', 0.0), 'chip_achievement', -12),
    ('secret', ('w396', 0.0), 'shimmer', -11), ('room', ('w398', 0.0), 'drone_low', -18), ('fact_egg', ('w408', 0.0), 'stamp', -12),
    ('lag_stutter', ('w461', 0.0), 'chip_lag', -11), ('freeze', ('w465', 0.0), 'tape_freeze', -11), ('blink2', ('w481', 0.0), 'chip_blip', -12),
    ('fall', ('w483', -0.1), 'chip_fall', -7), ('void', ('w489', 0.0), 'drone_low', -16), ('respawn', ('w509', -0.1), 'chip_ready', -10), ('fact_lag', ('w516', 0.0), 'stamp', -12),
    ('stranger', ('w543', 0.0), 'chip_blip', -13), ('chat', ('w556', 0.0), 'chip_talk', -11), ('player2', ('w567', 0.0), 'chip_select', -11),
    ('jump', ('w599', 0.0), 'whoosh', -12), ('life_lost', ('w607', 0.0), 'chip_warning', -12), ('respawn2', ('w611', 0.0), 'chip_ready', -11),
    ('save', ('w641', 0.0), 'chip_save', -10), ('mug_drop', ('w643', 0.2), 'crash_small', -13), ('load1', ('w644', -0.1), 'rewind', -9),
    ('bus_leave', ('w645', 0.0), 'honk', -17), ('load2', ('w646', -0.1), 'rewind', -9), ('save2', ('w649', 0.0), 'chip_save', -11),
    ('achievement', ('w652', 0.0), 'chip_achievement', -13), ('reaction', ('w656', 0.0), 'chip_blip', -12),
    ('fixed', ('w674', 0.0), 'shimmer', -13), ('patch', ('w698', -0.05), 'chip_achievement', -10), ('noload', ('w709', 0.0), 'chip_warning', -11),
    ('fact_upd', ('w723', 0.0), 'stamp', -12), ('flyer', ('w747', 0.0), 'whoosh_up', -11), ('money', ('w759', 0.0), 'chip_coins', -10),
    ('cheaters', ('w764', 0.0), 'chip_warning', -12), ('banned', ('w790', -0.05), 'stamp', -9), ('clip', ('w818', 0.0), 'glitch', -10),
    ('speedrun', ('w838', 0.0), 'clock_ticks', -13),
    ('menu_open', ('w851', 0.0), 'chip_select', -10), ('menu_move1', ('w855', 0.0), 'chip_blip', -12), ('menu_move2', ('w857', 0.0), 'chip_blip', -12),
    ('menu_glitch', ('w858', 0.0), 'glitch', -10), ('dialog', ('w865', -0.05), 'chip_warning', -12),
    ('heart', 'STRANGE', 'heartbeat', -10), ('lab_drone', ('w874', 0.0), 'drone_low', -18), ('sim_glitch', ('w878', 0.0), 'glitch', -9),
    ('bostrom', ('w890', 0.0), 'stamp', -12), ('worlds', ('w903', 0.0), 'shimmer', -11), ('hyp', ('w933', 0.0), 'stamp', -11), ('pixels', ('w944', 0.0), 'glitch', -12),
    ('dev', ('w976', 0.0), 'typing', -14),
    ('rewind_now', 'NOW', 'rewind', -10), ('button_appear', ('w988', -0.05), 'shimmer', -10), ('final_whoosh', ('w994', -0.15), 'whoosh_up', -11),
    ('final_hit', ('w996e', 0.1), 'impact_big', -9), ('cta', ('w997', 0.0), 'chip_achievement', -13), ('sub', ('w1004', 0.0), 'chip_select', -11),
    ('end_shimmer', ('END', 0.3), 'chip_ready', -12),
]
for ins, title, clock, w0, w1 in CHAPTERS:
    CUES += [(f'{ins}_glitch', ins, 'glitch', -9), (f'{ins}_ticks', (ins, 0.1), 'clock_ticks', -15), (f'{ins}_slam', (f'w{w0}', -0.08), 'chip_select', -10)]
cues = {name: {'t': round(T(a), 3), 'kind': kind, 'gain': gain} for name, a, kind, gain in CUES}

MUSIC = [
    ('chip_hook', 0.0, ('w43', -0.6)), ('chip_morning', ('w43', -0.6), 'C1'), ('chip_quirky', 'C1', 'C2'), ('chip_quirky2', 'C2', 'C3'), ('chip_quest', 'C3', 'C4'),
    ('chip_happy', 'C4', ('w391', -0.1)), ('chip_menu', ('w391', -0.1), 'C5'), ('chip_lag', 'C5', 'C6'), ('chip_quest', 'C6', 'C7'), ('chip_happy', 'C7', 'C8'),
    ('chip_menu', 'C8', 'C9'), ('chip_quirky2', 'C9', 'C10'), ('chip_menu', 'C10', 'STRANGE'), ('dark', 'STRANGE', ('w886', -0.1)), ('eerie', ('w886', -0.1), 'NOW'),
    ('finale', 'NOW', TOTAL),
]
music = [{'mood': m, 's': round(T(a), 3), 'e': round(T(b), 3)} for m, a, b in MUSIC]

HUD = {'start': T('w54'), 'end': T('STRANGE'), 'xp': T('w289'), 'lvl2': T('w295'), 'coins': T('w304'), 'wall': T(('w356', -0.05)), 'fall': T('w483'),
       'load': T(('w509', -0.1)), 'lag0': T('w461'), 'lag1': T('C6'), 'ch4': T('C5'), 'ch5': T('C7'), 'ch6': T('C10'), 'tease': ['L02_world', 'L03_pixel'],
       'hideIn': ['L06_teaser', 'L23_lodfact', 'L34_egg', 'L41_lagfact', 'L52_reaction', 'L56_updates', 'L62_speedrun']}

tl = {
    'kind': 'game', 'long': True, 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': VOICE_LEN, 'voice': 'assets/voice_long/voice.mp3',
    'blocks': blocks, 'inserts': inserts, 'words': gw, 'shots': shots, 'chapters': chapters, 'subs': subs, 'cues': cues, 'music': music,
    'red': RED, 'hud': HUD, 'clockLabel': 'ВРЕМЯ В ИГРЕ', 'flashCues': ['hook_boom', 'wall_hit', 'final_hit'],
    'title': {'small': 'ЧТО, ЕСЛИ…', 'big': 'МИР — ИГРА?', 'sub': 'НАУЧНО-ФАНТАСТИЧЕСКИЙ ЭКСПЕРИМЕНТ', 'dur': 3.5}, 'outro': None,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'total {TOTAL:.2f}s = {TOTAL_FRAMES} frames; {len(shots)} shots; {len(subs)} subs; {len(cues)} cues')
for s in shots:
    print(f"  {s['id']:14s} {s['t']:7.2f}s {s['dur']:4d}f")
