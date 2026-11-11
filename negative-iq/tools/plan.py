"""Master timeline for «Что, если у всех людей на Земле внезапно станет отрицательный IQ?»

Reads the voice word timings (assets/voice/words_raw.json, faster-whisper), cuts the voice into
blocks at silent gaps, inserts the cinematic interludes, and writes src/timeline.json which both the
picture (Remotion) and the sound (tools/audio/*.py) read. Every visual and every sound effect is
anchored to a word, so changing an insert length here re-times everything consistently.

Run: python3 -I tools/plan.py
"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
VOICE = os.path.join(ROOT, 'assets/voice/voice.mp3')
WORDS = os.path.join(ROOT, 'assets/voice/words_raw.json')
OUT = os.path.join(ROOT, 'src/timeline.json')

# ---------------------------------------------------------------- voice + word clean-up
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VOICE, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
VOICE_LEN = len(x) / 48000
hop = 480
n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12))

words = json.load(open(WORDS))
FIX = {9: 'отрицательный', 10: 'IQ?', 46: '-то', 57: '-то', 236: '-нибудь'}
for i, w in enumerate(words):
    if i in FIX:
        w['w'] = FIX[i]

# Refine onsets: if whisper starts a word inside the silence before it, move the start to the real onset.
for i, w in enumerate(words):
    a = int(w['s'] * 100)
    b = int(min(VOICE_LEN, w['e']) * 100)
    seg = db[a:b]
    loud = np.where(seg > -38)[0]
    if len(loud) == 0:
        continue
    first_loud = (a + loud[0]) / 100
    if first_loud > w['s'] + 0.04 and first_loud < w['e'] - 0.08 and (seg[:loud[0]] < -45).all():
        w['s'] = round(first_loud - 0.03, 3)


def quiet_mid(t0, t1):
    seg = db[int(t0 * 100):int(t1 * 100)]
    q = np.where(seg < -50)[0]
    if len(q) == 0:
        return (t0 + t1) / 2
    return (int(t0 * 100) + (q[0] + q[-1]) / 2) / 100


# ---------------------------------------------------------------- inserts (silent voice gaps)
# (name, insert after word index, seconds)
INSERTS = [
    ('TITLE', 10, 3.0),
    ('I1', 35, 7.0),
    ('I2', 73, 7.0),
    ('I3', 110, 7.0),
    ('I4', 134, 7.0),
    ('I5', 163, 7.0),
    ('I6', 187, 7.0),
    ('BEAT1', 212, 1.0),
    ('BEAT2', 222, 1.5),
]
OUTRO = 7.0

cuts = []
for name, wi, dur in INSERTS:
    c = quiet_mid(words[wi]['e'] - 0.2, words[wi + 1]['s'] + 0.2)
    c = round(c * FPS) / FPS
    cuts.append((name, wi, c, dur))

blocks = []  # voice blocks: voice in/out and global start
prev = 0.0
offset = 0.0
inserts = {}
for name, wi, c, dur in cuts:
    blocks.append({'vin': prev, 'vout': c, 'g': prev + offset})
    inserts[name] = {'start': c + offset, 'dur': dur}
    offset += dur
    prev = c
blocks.append({'vin': prev, 'vout': VOICE_LEN, 'g': prev + offset})
voice_end_g = VOICE_LEN + offset
inserts['OUTRO'] = {'start': voice_end_g + 0.1, 'dur': OUTRO}
TOTAL = voice_end_g + 0.1 + OUTRO
TOTAL_FRAMES = int(round(TOTAL * FPS))


def g_word(i, t):
    """voice time of word i -> global time (offset by every insert placed before that word)"""
    off = 0.0
    for name, wi, c, dur in cuts:
        if i > wi:
            off += dur
    return t + off


gw = [{'w': w['w'], 's': round(g_word(i, w['s']), 3), 'e': round(g_word(i, w['e']), 3)} for i, w in enumerate(words)]


def T(a):
    """anchor -> global seconds. 'w12' word start, 'w12e' word end, 'I1' insert start, 'I1e' insert end,
    float = absolute, ('w12', 0.3) = anchor + offset."""
    if isinstance(a, tuple):
        return T(a[0]) + a[1]
    if isinstance(a, (int, float)):
        return float(a)
    if a.startswith('w'):
        if a.endswith('e'):
            return gw[int(a[1:-1])]['e']
        return gw[int(a[1:])]['s']
    if a.endswith('e') and a[:-1] in inserts:
        return inserts[a[:-1]]['start'] + inserts[a[:-1]]['dur']
    return inserts[a]['start']


LEAD = 2 / FPS  # cuts land two frames before their word

# ---------------------------------------------------------------- shots
# (id, anchor, transition-in)
SHOTS = [
    ('h1_face', 0.0, 'none'),
    ('h2_crowd', 'w3', 'zoomout'),
    ('h3_earth', 'w5', 'zoomout'),
    ('title', 'TITLE', 'glitch'),
    ('m1_sunrise', 'w11', 'flash'),
    ('m2_alarm', 'w13', 'whip'),
    ('m3_commute', 'w16', 'whip'),
    ('m4_school', 'w19', 'whip'),
    ('m5_cross', 'w20', 'zoomin'),
    ('t1_freeze', 'w24', 'cut'),
    ('t2_heads', 'w29', 'flash'),
    ('t3_face', 'w34', 'zoomin'),
    ('I1', 'I1', 'glitch'),
    ('a1_pole', 'w39', 'whip'),
    ('a2_absurd', 'w42', 'whip'),
    ('a3_door', 'w45', 'zoomin'),
    ('a4_glass', 'w50', 'cut'),
    ('a5_shop', 'w56', 'whip'),
    ('a6_reverse', 'w63', 'whip'),
    ('a7_inter', 'w66', 'zoomout'),
    ('a8_crowdq', 'w69', 'whip'),
    ('I2', 'I2', 'glitch'),
    ('b1_chaos', 'w76', 'zoomin'),
    ('b2_jam', 'w81', 'whip'),
    ('b3_checkout', 'w86', 'whip'),
    ('b4_class', 'w94', 'whip'),
    ('b5_board', 'w98', 'zoomin'),
    ('b6_peg', 'w105', 'whip'),
    ('I3', 'I3', 'glitch'),
    ('c1_control', 'w113', 'zoomin'),
    ('c2_blackout', 'w117', 'cut'),
    ('c3_airport', 'w119', 'whip'),
    ('c4_hospital', 'w122', 'whip'),
    ('c5_shutters', 'w126', 'whip'),
    ('c6_sofa', 'w128', 'whip'),
    ('I4', 'I4', 'glitch'),
    ('d1_servers', 'w137', 'zoomin'),
    ('d2_phone', 'w141', 'whip'),
    ('d3_feed', 'w147', 'glitch'),
    ('d4_chair', 'w151', 'whip'),
    ('d5_choice', 'w154', 'whip'),
    ('I5', 'I5', 'glitch'),
    ('e1_dusk', 'w166', 'fade'),
    ('e2_curb', 'w172', 'cut'),
    ('e3_pillars', 'w181', 'zoomout'),
    ('I6', 'I6', 'glitch'),
    ('f1_overgrown', 'w190', 'fade'),
    ('f2_earthnight', 'w194', 'zoomout'),
    ('f3_artifact', 'w202', 'whip'),
    ('f4_rope', 'w208', 'whip'),
    ('g1_dark', 'BEAT1', 'fade'),
    ('g2_ruins', 'w216', 'cut'),
    ('g3_rewind', 'BEAT2', 'glitch'),
    ('g4_earth', 'w232', 'zoomout'),
    ('outro', 'OUTRO', 'flash'),
]

shots = []
for i, (sid, a, tr) in enumerate(SHOTS):
    t = T(a)
    if isinstance(a, str) and a.startswith('w'):
        t -= LEAD
    shots.append({'id': sid, 't': max(0.0, t), 'tr': tr})
for i, s in enumerate(shots):
    s['from'] = int(round(s['t'] * FPS))
for i, s in enumerate(shots):
    s['to'] = shots[i + 1]['from'] if i + 1 < len(shots) else TOTAL_FRAMES
    s['dur'] = s['to'] - s['from']
    assert s['dur'] > 8, (s['id'], s['dur'])

# ---------------------------------------------------------------- chapters (big HUD titles)
CHAPTERS = [
    ('I1', 'ПЕРВЫЕ 10 МИНУТ', '00:10:00', 36, 38),
    ('I2', 'ПЕРВЫЙ ЧАС', '01:00:00', 74, 75),
    ('I3', 'ПЕРВЫЙ ДЕНЬ', 'ДЕНЬ 1', 111, 112),
    ('I4', 'ТРЕТИЙ ДЕНЬ', 'ДЕНЬ 3', 135, 136),
    ('I5', 'СЕДЬМОЙ ДЕНЬ', 'ДЕНЬ 7', 164, 165),
    ('I6', 'ТРИДЦАТЫЙ ДЕНЬ', 'ДЕНЬ 30', 188, 189),
]
FACTS = {
    'I1': {'tag': 'ФАКТ', 'text': 'Средний IQ людей — ровно 100.', 'sub': 'Тесты специально настраивают так, чтобы среднее было 100.'},
    'I2': {'tag': 'ФАКТ', 'text': 'Мозг — около 2% веса тела,', 'sub': 'но он сжигает около 20% всей энергии организма.', 'q': 'Как думаешь, что сломается первым?'},
    'I3': {'tag': 'ФАКТ', 'text': 'Каждый день в мире — около 100 000 авиарейсов.', 'sub': 'И каждый из них ведут люди, которые умеют думать.'},
    'I4': {'tag': 'ФАКТ', 'text': 'Интернетом пользуются больше 5 миллиардов человек.', 'sub': 'Это больше половины всех людей на Земле.'},
    'I5': {'tag': 'ФАКТ', 'text': 'Еды в магазинах большого города хватает всего на несколько дней.', 'sub': 'Полки пополняют каждый день.', 'q': 'Сколько продержится твой город?'},
    'I6': {'tag': 'ФАКТ', 'text': 'Эффект Даннинга — Крюгера:', 'sub': 'чем меньше человек знает, тем увереннее он в себе.', 'q': 'Самое страшное — впереди…'},
}
chapters = []
for ins, title, clock, w0, w1 in CHAPTERS:
    chapters.append({'ins': ins, 'title': title, 'clock': clock, 'start': T(f'w{w0}'), 'end': T(f'w{w1}e'),
                     'ins_start': inserts[ins]['start'], 'ins_dur': inserts[ins]['dur'], 'fact': FACTS[ins],
                     'w0': w0, 'w1': w1})
chapter_words = set()
for c in CHAPTERS:
    chapter_words.update(range(c[3], c[4] + 1))

# ---------------------------------------------------------------- subtitles
KEY = {9, 10, 13, 28, 29, 35, 43, 49, 55, 58, 65, 67, 80, 85, 93, 103, 110, 118, 119, 122, 127, 132, 137, 146,
       149, 153, 158, 161, 162, 163, 169, 183, 184, 187, 193, 195, 212, 215, 221, 222, 230, 231, 237, 238, 239, 1, 6}
FUNC = {'на', 'в', 'и', 'не', 'от', 'без', 'как', 'что', 'а', 'но', 'бы', 'до', 'по', 'у', 'к', 'с', 'за', 'из', 'о', 'им', 'их', 'её'}
tokens = []  # display tokens: list of word indices ('-то' glued to its word)
for i, w in enumerate(gw):
    if i in chapter_words:
        tokens.append(None)
        continue
    if w['w'].startswith('-') and tokens and tokens[-1]:
        tokens[-1].append(i)
    else:
        tokens.append([i])


def tok_text(tk):
    return ''.join(gw[j]['w'] for j in tk)


chunks = []
cur = []
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
    if tok_text(tk)[-1] in '.?!,':
        chunks.append(cur)
        cur = []
subs = []
for ci, c in enumerate(chunks):
    s = gw[c[0][0]]['s']
    e = gw[c[-1][-1]]['e'] + 0.3
    if ci + 1 < len(chunks):
        e = min(e, gw[chunks[ci + 1][0][0]]['s'])
    subs.append({'s': round(s, 3), 'e': round(e, 3),
                 'words': [{'i': tk[0], 'w': tok_text(tk), 's': gw[tk[0]]['s'], 'e': gw[tk[-1]]['e'],
                            'k': any(j in KEY for j in tk)} for tk in c]})

# ---------------------------------------------------------------- sound cues
# (name, anchor, sfx kind, gain dB)   — scenes read cue times by name, the sound renderer reads kind/gain
CUES = [
    # hook
    ('hook_hit', 0.0, 'impact_soft', -4),
    ('hook_whoosh1', ('w3', -0.12), 'whoosh_up', -8),
    ('hook_whoosh2', ('w5', -0.12), 'whoosh_up', -6),
    ('hook_riser', 'w7', 'riser', -8),
    ('hook_alarm', 'w9', 'alarm_klaxon', -10),
    ('hook_drop', ('w9', 0.05), 'needle_drop', -6),
    ('hook_boom', ('w10e', 0.02), 'boom', -3),
    ('title_glitch', 'TITLE', 'glitch', -6),
    ('title_hit', ('TITLE', 0.35), 'impact_big', -3),
    ('title_out', ('TITLEe', -0.35), 'whoosh', -8),
    # morning
    ('birds', 'w11', 'birds', -10),
    ('alarm_ring', ('w13', -0.05), 'alarm_clock', -12),
    ('alarm_slap', ('w15', 0.45), 'thud', -8),
    ('steps', 'w16', 'footsteps', -14),
    ('school_bell', ('w19', 0.1), 'school_bell', -16),
    ('city_calm', 'w11', 'amb_city', -14),
    # twist
    ('tape_stop', ('w24', -0.05), 'tape_stop', -8),
    ('shock_riser', 'w25', 'riser', -9),
    ('shockwave', ('w27', 0.0), 'shockwave', -4),
    ('flash_hit', ('w28', 0.25), 'impact_big', -4),
    ('iq_glitch', 'w29', 'glitch', -8),
    ('iq_count', ('w29', 0.1), 'counter_down', -12),
    ('iq_boing', ('w35', 0.0), 'boing', -12),
    ('iq_stinger', ('w35e', -0.05), 'dumb_horn', -11),
    # 10 min
    ('pole_bonk', ('w40', 0.15), 'bonk', -5),
    ('pole_birds', ('w40', 0.3), 'tweety', -12),
    ('absurd_honk', ('w43', 0.1), 'honk', -14),
    ('door_bump1', ('w47', 0.05), 'glass_bump', -6),
    ('door_bump2', ('w49', 0.05), 'glass_bump', -6),
    ('door_bump3', ('w51', 0.0), 'glass_bump', -5),
    ('door_bump4', ('w54', 0.0), 'glass_bump', -5),
    ('shop_chime', ('w56', 0.0), 'shop_ding', -14),
    ('shop_q', ('w59', 0.0), 'pop', -10),
    ('car_reverse', ('w63', 0.0), 'reverse_beep', -14),
    ('car_crash1', ('w65', 0.1), 'crash_small', -7),
    ('car_horns', ('w66', 0.1), 'honks', -11),
    ('car_crash2', ('w68e', 0.0), 'crash_small', -10),
    ('crowd_confused', ('w69', -0.1), 'crowd', -12),
    ('q_pops', ('w71', 0.0), 'pops', -12),
    # hour 1
    ('sirens1', ('w76', -0.1), 'siren', -16),
    ('chaos_crowd', ('w76', 0.0), 'crowd_panic', -14),
    ('jam_honks', ('w81', -0.1), 'honks', -16),
    ('scan_beep', ('w88', 0.0), 'scanner', -12),
    ('scan_err1', ('w90', 0.0), 'error_beep', -10),
    ('scan_err2', ('w92', 0.1), 'error_beep', -10),
    ('register_bang', ('w93', 0.1), 'thud', -8),
    ('class_bell', ('w94', -0.1), 'school_bell', -18),
    ('chalk', ('w98', 0.1), 'chalk', -10),
    ('class_laugh', ('w103', 0.0), 'kids_murmur', -16),
    ('peg_hit1', ('w106', 0.0), 'wood_hit', -7),
    ('peg_hit2', ('w108', 0.0), 'wood_hit', -7),
    ('peg_hit3', ('w110', 0.0), 'wood_hit', -6),
    # day 1
    ('control_alarm', ('w113', 0.0), 'alarm_beeps', -13),
    ('power_down', ('w117', 0.2), 'power_down', -6),
    ('lights_off', ('w118', 0.0), 'relays', -10),
    ('airport_chime', ('w119', 0.0), 'airport_chime', -12),
    ('flapboard', ('w120', 0.0), 'flapboard', -12),
    ('amb_siren', ('w122', -0.1), 'ambulance', -18),
    ('monitor_beeps', ('w123', 0.0), 'monitor', -18),
    ('shutter1', ('w126', 0.2), 'shutter', -8),
    ('shutter2', ('w127', 0.1), 'shutter', -8),
    ('sofa_strain', ('w129', 0.0), 'strain', -12),
    ('sofa_drop', ('w134', 0.0), 'thud_big', -6),
    # day 3
    ('servers', ('w137', -0.1), 'server_hum', -12),
    ('phone_err', ('w142', 0.0), 'error_buzz', -12),
    ('notifs', ('w147', 0.0), 'notifs', -11),
    ('typing', ('w148', 0.0), 'typing', -16),
    ('chair_clunk', ('w152', 0.0), 'clunk', -8),
    ('choice_ding', ('w158', 0.0), 'ding', -12),
    ('choice_wrong', ('w162', 0.0), 'wrong_buzz', -10),
    # day 7
    ('wind1', ('w166', -0.1), 'wind', -12),
    ('blink_light', ('w168', 0.0), 'ticks', -18),
    ('crumble', ('w187', 0.2), 'crumble', -6),
    ('pillar_on1', ('w183', 0.0), 'shimmer', -12),
    ('pillar_on2', ('w184', 0.0), 'shimmer', -12),
    ('pillar_on3', ('w186', 0.0), 'shimmer', -12),
    # day 30
    ('wind2', ('w190', -0.1), 'wind', -12),
    ('crows', ('w191', 0.2), 'crow', -16),
    ('earth_off', ('w196', 0.0), 'power_down', -10),
    ('poke', ('w204', 0.0), 'poke', -10),
    ('rope_strain', ('w208', 0.0), 'strain', -12),
    ('heart', 'BEAT1', 'heartbeat', -6),
    ('dark_drone', ('w213', 0.0), 'drone_low', -10),
    ('ruins_wind', ('w216', 0.0), 'wind', -14),
    ('rewind', 'BEAT2', 'rewind', -5),
    ('present_city', ('BEAT2', 1.2), 'amb_city', -16),
    ('final_whoosh', ('w232', -0.15), 'whoosh_up', -8),
    ('final_hit', ('w239', 0.25), 'impact_big', -6),
    ('outro_shimmer', ('OUTRO', 0.2), 'shimmer', -10),
]
for ins in ['I1', 'I2', 'I3', 'I4', 'I5', 'I6']:
    CUES += [
        (f'{ins}_glitch', ins, 'glitch', -7),
        (f'{ins}_stamp', (ins, 0.55), 'stamp', -5),
        (f'{ins}_whoosh', (ins, 3.75), 'whoosh', -9),
        (f'{ins}_ticks', (ins, 4.0), 'clock_ticks', -12),
        (f'{ins}_slam', (f'{ins}e', -0.12), 'impact_big', -8),
    ]
cues = {}
for name, a, kind, gain in CUES:
    cues[name] = {'t': round(T(a), 3), 'kind': kind, 'gain': gain}

# ---------------------------------------------------------------- music cues (mood per section)
MUSIC = [
    ('hook', 0.0, 'w11'),
    ('morning', ('w11', -0.6), ('w24', -0.05)),
    ('twist', ('w24', -0.05), 'I1'),
    ('interlude', 'I1', ('w39', -0.1)),
    ('comedy', ('w39', -0.1), 'I2'),
    ('interlude', 'I2', ('w76', -0.1)),
    ('tension', ('w76', -0.1), 'I3'),
    ('interlude', 'I3', ('w113', -0.1)),
    ('heavy', ('w113', -0.1), 'I4'),
    ('interlude', 'I4', ('w137', -0.1)),
    ('glitchy', ('w137', -0.1), 'I5'),
    ('interlude', 'I5', ('w166', -0.1)),
    ('sad', ('w166', -0.1), 'I6'),
    ('interlude', 'I6', ('w190', -0.1)),
    ('eerie', ('w190', -0.1), 'BEAT1'),
    ('dark', 'BEAT1', 'BEAT2'),
    ('finale', 'BEAT2', TOTAL),
]
music = [{'mood': m, 's': round(T(a), 3), 'e': round(T(b), 3)} for m, a, b in MUSIC]

tl = {
    'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': VOICE_LEN,
    'blocks': blocks, 'inserts': inserts, 'words': gw, 'shots': shots, 'chapters': chapters,
    'subs': subs, 'cues': cues, 'music': music,
}
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'total {TOTAL:.2f}s = {TOTAL_FRAMES} frames; {len(shots)} shots; {len(subs)} subtitle chunks; {len(cues)} cues')
for s in shots:
    print(f"  {s['id']:14s} {s['t']:7.2f}s  {s['dur']:4d}f  {s['tr']}")
print('subs:')
for s in subs:
    print(f"  {s['s']:7.2f}-{s['e']:7.2f} " + ' '.join(('*' if w['k'] else '') + w['w'] for w in s['words']))
