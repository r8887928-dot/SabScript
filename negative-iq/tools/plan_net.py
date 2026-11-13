"""Shorts timeline for «Что, если на Земле пропадёт интернет?» (9:16). Voice: ElevenLabs Liam, 2:20.
Voice + 1.3 s title beat -> src/net/timeline.json.   Run: python3 -I tools/plan_net.py
"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
VOICE = os.path.join(ROOT, 'assets/voice_net/voice.mp3')
WORDS = os.path.join(ROOT, 'assets/voice_net/words_raw.json')
OUT = os.path.join(ROOT, 'src/net/timeline.json')

raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VOICE, '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
VOICE_LEN = len(x) / 48000
hop = 480
n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12))

words = json.load(open(WORDS))
FIX = {6: 'Земле', 11: 'тебя.', 12: 'Везде.', 13: 'Сразу.', 16: 'конца:', 39: '«отправке».', 40: 'А', 42: 'онлайн-игре', 43: '', 45: 'надпись:', 117: 'Спутникам',
       124: 'загрузится,', 125: 'и', 128: 'синей', 178: 'недели', 179: '—', 195: 'своём', 197: 'проводами,', 198: 'и', 220: 'идёт', 235: 'солнечная', 236: 'буря',
       237: 'была', 239: 'сильной,', 261: 'из-за', 262: '', 273: 'сервиса,', 274: 'и', 313: 'подписывайся:', 314: 'дальше —', 319: 'Луна.'}
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


INSERTS = [('TITLE', 27, 1.4)]
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
OUTRO_HOLD = 0.6
TOTAL = VOICE_LEN + offset + OUTRO_HOLD
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
    ('nh1_earth', 0.0, 'none'),
    ('nh2_you', 'w9', 'whip'),
    ('nh3_world', 'w12', 'zoomout'),
    ('nh4_tease', 'w14', 'glitch'),
    ('title', 'TITLE', 'glitch'),
    ('I1', 'w28', 'glitch'),
    ('n1_freeze', 'w30', 'zoomin'),
    ('n1_send', 'w35', 'whip'),
    ('n1_game', 'w40', 'whip'),
    ('n1_billions', 'w48', 'zoomout'),
    ('I2', 'w58', 'glitch'),
    ('n2_router', 'w60', 'zoomin'),
    ('n2_door', 'w66', 'whip'),
    ('n2_neighbor', 'w74', 'cut'),
    ('I3', 'w85', 'glitch'),
    ('n3_terminal', 'w87', 'zoomin'),
    ('n3_cash', 'w95', 'whip'),
    ('n3_courier', 'w100', 'whip'),
    ('n3_gps', 'w113', 'zoomout'),
    ('n3_map', 'w121', 'zoomin'),
    ('I4', 'w133', 'glitch'),
    ('n4_radio', 'w135', 'whip'),
    ('n4_news', 'w144', 'zoomin'),
    ('n4_street', 'w149', 'whip'),
    ('I5', 'w159', 'glitch'),
    ('n5_shelves', 'w161', 'whip'),
    ('n5_post', 'w171', 'whip'),
    ('n5_ham', 'w176', 'zoomin'),
    ('I6', 'w189', 'glitch'),
    ('n6_wires', 'w191', 'whip'),
    ('n6_chat', 'w198', 'zoomin'),
    ('n7_possible', 'w211', 'glitch'),
    ('n7_cables', 'w215', 'zoomout'),
    ('n7_anchor', 'w226', 'fade'),
    ('n7_sun', 'w232', 'flash'),
    ('n7_telegraph', 'w240', 'whip'),
    ('n7_today', 'w245', 'zoomout'),
    ('n7_outage', 'w257', 'glitch'),
    ('n7_people', 'w274', 'whip'),
    ('n8_lab', 'w280', 'fade'),
    ('n8_lo', 'w288', 'zoomin'),
    ('n9_cta', 'w299', 'whip'),
    ('n9_moon', 'w314', 'fade'),
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

CHAPTERS = [('I1', 'ПЕРВАЯ СЕКУНДА', '00:00:01', 28, 29, [0, 1]), ('I2', 'ПЕРВАЯ МИНУТА', '00:01:00', 58, 59, [1, 60]),
            ('I3', 'ПЕРВЫЙ ЧАС', '01:00:00', 85, 86, [60, 3600]), ('I4', 'ПЕРВЫЙ ДЕНЬ', 'ДЕНЬ 1', 133, 134, [3600, 86400]),
            ('I5', 'ПЕРВАЯ НЕДЕЛЯ', 'ДЕНЬ 7', 159, 160, [86400, 7 * 86400]), ('I6', 'ПЕРВЫЙ МЕСЯЦ', 'ДЕНЬ 30', 189, 190, [7 * 86400, 30 * 86400])]
chapters = [{'ins': ins, 'title': title, 'clock': clock, 'start': T(f'w{w0}'), 'end': T(f'w{w1}e'), 'ins_start': T(f'w{w0}') - LEAD,
             'ins_dur': 0, 'fact': None, 'short': True, 'target': tgt, 'w0': w0, 'w1': w1} for ins, title, clock, w0, w1, tgt in CHAPTERS]
chapter_words = set()
for c in CHAPTERS:
    chapter_words.update(range(c[3], c[4] + 1))

KEY = {7, 8, 12, 13, 31, 34, 39, 46, 47, 50, 62, 63, 65, 71, 84, 92, 94, 99, 100, 114, 116, 128, 139, 141, 154, 158, 164, 175, 180, 188, 197, 200, 201, 214,
       222, 225, 230, 233, 244, 252, 253, 259, 268, 269, 275, 279, 287, 294, 298, 302, 305, 306, 308, 318, 319}
RED = [7, 8, 47, 65, 92, 94, 158, 164, 230, 244, 252, 279, 287, 298, 318, 319]
FUNC = {'на', 'в', 'и', 'не', 'от', 'без', 'как', 'что', 'а', 'но', 'бы', 'до', 'по', 'у', 'к', 'с', 'за', 'из', 'о', 'им', 'их', 'её', 'под', 'тебе', 'ты', 'ни', 'со'}
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
    ('hook_hum', 0.0, 'server_hum', -16),
    ('hook_notifs', ('w2', 0.0), 'notifs', -14),
    ('hook_power', ('w7', -0.05), 'power_down', -6),
    ('hook_glitch', ('w8', 0.0), 'glitch', -8),
    ('you_err', ('w9', 0.1), 'error_beep', -10),
    ('world_whoosh', ('w12', -0.1), 'whoosh_up', -8),
    ('world_boom', ('w13', 0.0), 'boom', -6),
    ('tease_riser', ('w14', 0.0), 'riser', -12),
    ('tease_spark', ('w23', 0.0), 'sparks', -10),
    ('title_hit', ('TITLE', 0.05), 'impact_big', -6),
    ('freeze_tape', ('w31', 0.0), 'tape_freeze', -10),
    ('send_tick', ('w37', 0.0), 'clock_ticks', -16),
    ('game_err', ('w46', 0.0), 'error_buzz', -8),
    ('billions_crowd', ('w48', 0.0), 'crowd', -18),
    ('router_click', ('w62', 0.0), 'clunk', -10),
    ('router_beeps', ('w63', 0.2), 'relays', -14),
    ('router_fail', ('w65', 0.0), 'wrong_buzz', -10),
    ('steps', ('w67', 0.0), 'footsteps', -16),
    ('knock', ('w71', 0.05), 'knock', -6),
    ('door_open', ('w75', 0.0), 'shutter', -16),
    ('neighbor_spin', ('w83', 0.0), 'error_beep', -12),
    ('term_err', ('w91', 0.0), 'error_beep', -8),
    ('cash_coins', ('w98', 0.0), 'coins', -10),
    ('courier_honk', ('w101', 0.2), 'honk', -16),
    ('gps_ping', ('w114', 0.0), 'sonar', -10),
    ('gps_shimmer', ('w117', 0.0), 'shimmer', -14),
    ('map_err', ('w123', 0.0), 'error_beep', -12),
    ('radio_static', ('w139', -0.1), 'radio_static', -12),
    ('tv_news', ('w141', 0.2), 'airport_chime', -16),
    ('street_crowd', ('w151', 0.0), 'crowd', -16),
    ('shelf_clunk', ('w164', 0.0), 'clunk', -14),
    ('post_stamp', ('w174', 0.0), 'stamp', -8),
    ('ham_morse', ('w180', -0.2), 'morse', -12),
    ('wires_click', ('w192', 0.0), 'relays', -12),
    ('lan_ding', ('w199', 0.1), 'shimmer', -10),
    ('chat_pop', ('w207', 0.0), 'notifs', -12),
    ('possible_hit', ('w211', 0.0), 'impact_soft', -6),
    ('possible_drone', ('w211', 0.2), 'drone_low', -14),
    ('cables_whoosh', ('w215', -0.1), 'whoosh', -10),
    ('anchor_clunk', ('w230', 0.0), 'clunk', -6),
    ('anchor_spark', ('w230', 0.35), 'sparks', -8),
    ('sun_boom', ('w233', 0.0), 'boom', -6),
    ('tele_spark', ('w243', 0.0), 'sparks', -6),
    ('tele_morse', ('w240', 0.0), 'morse', -14),
    ('today_power', ('w252', 0.0), 'power_down', -10),
    ('outage_glitch', ('w257', 0.0), 'glitch', -10),
    ('outage_err', ('w270', 0.0), 'error_buzz', -10),
    ('lo_typing', ('w291', 0.0), 'typing', -12),
    ('lo_crash', ('w298e', 0.05), 'crash_small', -8),
    ('lo_power', ('w298e', 0.15), 'power_down', -12),
    ('cta_pop1', ('w305', 0.0), 'pop', -10),
    ('cta_pop2', ('w306', 0.0), 'pop', -10),
    ('cta_pop3', ('w308', 0.0), 'pop', -10),
    ('moon_whoosh', ('w314', -0.1), 'whoosh_up', -12),
    ('moon_shimmer', ('w318', 0.0), 'shimmer', -10),
    ('final_hit', ('w319e', 0.05), 'impact_soft', -8),
]
for ins, title, clock, w0, w1, tgt in CHAPTERS:
    CUES += [(f'{ins}_glitch', (f'w{w0}', -0.1), 'glitch', -10), (f'{ins}_whoosh', (f'w{w0}', -0.25), 'whoosh', -12), (f'{ins}_slam', (f'w{w1}', 0.0), 'impact_soft', -10)]
cues = {name: {'t': round(T(a), 3), 'kind': kind, 'gain': gain} for name, a, kind, gain in CUES}

MUSIC = [
    ('hook', 0.0, 'TITLE'),
    ('glitchy', 'TITLE', ('w58', -0.1)),
    ('comedy', ('w58', -0.1), ('w133', -0.1)),
    ('morning', ('w133', -0.1), ('w211', -0.1)),
    ('tension', ('w211', -0.1), ('w280', -0.1)),
    ('eerie', ('w280', -0.1), ('w299', -0.1)),
    ('finale', ('w299', -0.1), TOTAL),
]
music = [{'mood': m, 's': round(T(a), 3), 'e': round(T(b), 3)} for m, a, b in MUSIC]

HUD = {'start': T(('w8', 0.1)), 'end': T(('w299', -0.1))}
inserts['OUTRO'] = {'start': T(('w299', -0.1)), 'dur': 0}

tl = {
    'kind': 'net', 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': VOICE_LEN, 'voice': 'assets/voice_net/voice.mp3',
    'blocks': blocks, 'inserts': inserts, 'words': gw, 'shots': shots, 'chapters': chapters, 'subs': subs, 'cues': cues, 'music': music,
    'red': RED, 'hud': HUD, 'clockLabel': 'БЕЗ ИНТЕРНЕТА', 'flashCues': ['world_boom', 'title_hit', 'sun_boom', 'lo_crash'],
    'title': {'small': 'ЧТО, ЕСЛИ ПРОПАДЁТ', 'smallSize': 72, 'big': 'ИНТЕРНЕТ?', 'size': 158, 'sub': 'НА ВСЕЙ ЗЕМЛЕ · СРАЗУ', 'dur': inserts['TITLE']['dur'], 'fast': True},
    'outro': None,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'total {TOTAL:.2f}s = {TOTAL_FRAMES} frames; {len(shots)} shots; {len(subs)} subs; {len(cues)} cues')
for s in shots:
    print(f"  {s['id']:14s} {s['t']:7.2f}s {s['dur']:4d}f {s['tr']}")
for s in subs:
    print(f"  {s['s']:7.2f}-{s['e']:7.2f} " + ' '.join(('*' if w['k'] else '') + w['w'] for w in s['words']))
