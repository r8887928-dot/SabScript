"""Timeline for the club ad «затянуло в игру» (9:16): separate voice lines placed on a fixed story clock.
Builds assets/voice_cs/voice.wav (mic lines get a radio filter), transcribes each line for subtitles,
writes src/cs/tl.json.   Run: python3 -I tools/plan_cs.py <whisper_model_dir>
"""
import json, os, subprocess, sys, re
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS, SR = 30, 48000
VD = os.path.join(ROOT, 'assets/voice_cs')
OUT = os.path.join(ROOT, 'src/cs/tl.json')
MODEL = sys.argv[1] if len(sys.argv) > 1 else None

script = open(os.path.join(ROOT, '..', 'cs-ad', 'SCRIPT.md')).read().split('## Реплики (id | голос | текст)\n')[1]
TEXT = {}
for line in script.strip().splitlines():
    lid, voice, text = [x.strip() for x in line.split('|', 2)]
    TEXT[lid] = (voice, re.sub(r'\[[^\]]*\]\s*', '', text).strip())
NICK = {'Charlie': 'Kazbek', 'Will': 'TimurBRO', 'Callum': 'Dimon_AWP', 'Harry': 'Aidos', 'Adam': None, 'Liam': None}

# subtitle text where it differs from the spoken script (same word count as whisper hears)
DISP = {'VO': 'Лучше час эмоций в клубе с друзьями, чем целый вечер скуки дома одному. GAME VR ZONE, улица Умитбаева, 29. Приходи за эмоциями!'}

# story clock (seconds) — where each line starts
AT = {'H1': 12.9, 'M1': 16.7, 'M2': 19.8, 'M3': 22.0, 'H2': 26.5, 'M4': 33.4, 'A1': 40.3, 'M5': 45.6, 'M6': 48.3,
      'A2': 59.4, 'M7': 60.4, 'M8': 61.6, 'M9': 62.9, 'VO': 66.2}


def load(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def radio(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-af', 'highpass=f=320,lowpass=f=3300,acompressor=threshold=-20dB:ratio=6:attack=5:release=60,volume=1.6',
                          '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


clips = {}
for lid in AT:
    p = os.path.join(VD, f'{lid}.mp3')
    clips[lid] = radio(p) if lid.startswith('M') else load(p)
END_HOLD = 2.2
TOTAL = max(AT[k] + len(clips[k]) / SR for k in AT) + END_HOLD
N = int(TOTAL * SR)
voice = np.zeros(N)
for lid, t in AT.items():
    i = int(t * SR)
    y = clips[lid][: N - i]
    voice[i:i + len(y)] += y
from scipy.io import wavfile
wavfile.write(os.path.join(VD, 'voice.wav'), SR, (np.clip(voice, -1, 1) * 32767).astype(np.int16))

# word timings per line (whisper), text from the script
words = []
if MODEL:
    from faster_whisper import WhisperModel
    m = WhisperModel(MODEL, device='cpu', compute_type='int8', cpu_threads=4)
for lid, t in AT.items():
    voice_name, text = TEXT[lid]
    toks = DISP.get(lid, text).split()
    ws = []
    if MODEL:
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', os.path.join(VD, f'{lid}.mp3'), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
        segs, _ = m.transcribe(np.frombuffer(raw, dtype=np.float32), language='ru', word_timestamps=True, beam_size=5)
        ws = [(w.start, w.end) for s in segs for w in s.words]
    d = len(clips[lid]) / SR
    if len(ws) != len(toks):  # fall back: spread evenly by characters
        tot = sum(len(x) for x in toks); acc = 0; ws = []
        for x in toks:
            a = 0.1 + (d - 0.3) * acc / tot; acc += len(x); ws.append((a, 0.1 + (d - 0.3) * acc / tot))
    for (s, e), tok in zip(ws, toks):
        words.append({'w': tok, 's': round(t + s, 3), 'e': round(t + e, 3), 'line': lid, 'who': NICK.get(voice_name)})

# story beats (seconds)
B = {'grab': 4.6, 'pull': 6.4, 'flash': 7.8, 'land': 11.0, 'hud': 11.3, 'td1': 16.9, 'td2': 18.2, 'td3': 19.9, 'td4': 21.4,
     'pickup': 29.6, 'enemy_in': 31.6, 'headshot': 33.0, 'plant0': 37.4, 'plant1': 40.1, 'k1': 43.2, 'k2': 44.0, 'k3': 45.0, 'hp1': 45.2,
     'throw': 51.9, 'smoke': 52.4, 'enemy2_in': 54.4, 'defuse0': 55.9, 'kill_last': 58.4, 'win': 59.2, 'back': 65.4}
SHOTS = [('c_club', 0.0, 'none'), ('c_hand', 3.8, 'cut'), ('c_pull', 6.4, 'cut'), ('c_fall', 8.0, 'flash'), ('c_land', 10.8, 'cut'),
         ('c_where', 12.6, 'cut'), ('c_team1', 16.4, 'whip'), ('c_team2', 21.6, 'cut'), ('c_loot', 26.2, 'whip'), ('c_gate', 31.0, 'cut'),
         ('c_run', 34.6, 'whip'), ('c_plant', 37.0, 'cut'), ('c_tunnel', 41.6, 'whip'), ('c_lowhp', 46.4, 'cut'), ('c_smoke', 51.4, 'cut'),
         ('c_car', 53.6, 'cut'), ('c_kill', 58.2, 'cut'), ('c_win', 59.6, 'flash'), ('c_back', 65.4, 'flash'), ('c_end', 72.1, 'fade')]
TOTAL_FRAMES = int(round(TOTAL * FPS))
shots = []
for sid, t, tr in SHOTS:
    shots.append({'id': sid, 't': t, 'tr': tr, 'from': int(round(t * FPS)), 'beats': []})
for i, s in enumerate(shots):
    s['to'] = shots[i + 1]['from'] if i + 1 < len(shots) else TOTAL_FRAMES
    s['dur'] = s['to'] - s['from']

# subtitles: one line per voice line, split into chunks of <= 3 words
subs = []
KEY = {'Где', 'интересно.', 'проиграли...', 'раунд.', 'один', 'пяти?', 'погнали.', 'Харош!', 'заложена.', 'Красава!', 'хэпэшка...', 'выигран.', 'Харош!!', 'брат!', 'клатч!', 'пяти!', 'эмоций', 'скуки', 'GAME', 'ZONE,', 'Умитбаева,', 'эмоциями!'}
for lid in AT:
    ws = [w for w in words if w['line'] == lid]
    for k in range(0, len(ws), 3):
        c = ws[k:k + 3]
        subs.append({'s': c[0]['s'], 'e': c[-1]['e'] + 0.25, 'who': c[0]['who'], 'line': lid,
                     'words': [{'i': words.index(w), 'w': w['w'], 's': w['s'], 'e': w['e'], 'k': w['w'] in KEY} for w in c]})
subs.sort(key=lambda s: s['s'])
for i in range(len(subs) - 1):
    subs[i]['e'] = round(min(subs[i]['e'], subs[i + 1]['s']), 3)

CUES = [('club_amb', 0.0, 'crowd', -22), ('typing', 0.5, 'typing', -16), ('portal', B['grab'] - 0.6, 'shimmer', -8), ('grab', B['grab'], 'boing', -10),
        ('pull', B['pull'], 'whoosh_up', -6), ('flash', B['flash'], 'impact_big', -8), ('fall_wind', 8.0, 'wind', -10), ('scream_whoosh', 8.3, 'whoosh', -10),
        ('land', B['land'], 'thud_big', -4), ('land_dust', B['land'] + 0.05, 'crumble', -10), ('hud', B['hud'], 'chip_powerup', -12)]
for k in ['td1', 'td2', 'td3', 'td4']:
    CUES.append((k, B[k], 'gunshot', -18))
for lid in AT:
    if lid.startswith('M'):
        CUES.append((f'{lid}_click', AT[lid] - 0.08, 'radio_click', -12))
CUES += [('pickup1', B['pickup'], 'chip_coin', -10), ('pickup2', B['pickup'] + 0.3, 'clunk', -10), ('door', B['enemy_in'], 'shutter', -12),
         ('hs_shot', B['headshot'], 'gunshot', -4), ('hs_ding', B['headshot'] + 0.05, 'ding', -8), ('steps', 34.7, 'footsteps', -12),
         ('plant_beeps', B['plant0'], 'plant_beeps', -10), ('planted', B['plant1'], 'impact_soft', -8),
         ('k1', B['k1'], 'gunshot', -4), ('k2', B['k2'], 'gunshot', -4), ('k3', B['k3'], 'gunshot', -4), ('hit', B['hp1'], 'impact_big', -10),
         ('heart', 46.6, 'heartbeat', -8), ('throw', B['throw'], 'whoosh', -10), ('smoke', B['smoke'], 'smoke_hiss', -6),
         ('door2', B['enemy2_in'], 'footsteps', -14), ('defuse', B['defuse0'], 'relays', -10), ('last_shot', B['kill_last'], 'gunshot', -3),
         ('win_hit', B['win'], 'impact_big', -6), ('win_shimmer', B['win'] + 0.2, 'chip_achievement', -10), ('back_whoosh', B['back'] - 0.2, 'whoosh_up', -8),
         ('cheer', B['back'] + 0.3, 'crowd', -14), ('end_hit', 72.1, 'impact_soft', -10)]
for t in np.arange(B['plant1'] + 1.0, B['kill_last'], 1.0):
    CUES.append((f'beep{t:.0f}', float(t), 'bomb_beep', -16))
cues = {n: {'t': round(float(t), 3), 'kind': k, 'gain': g} for n, t, k, g in CUES}
MUSIC = [('edm', 0.0, 3.8), ('tension', 3.8, 8.0), ('heavy', 8.0, 46.4), ('tension', 46.4, 58.4), ('finale', 58.4, 65.4), ('edm_big', 65.4, TOTAL)]
music = [{'mood': m, 's': s, 'e': e} for m, s, e in MUSIC]

tl = {'kind': 'club', 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': TOTAL, 'voice': 'assets/voice_cs/voice.wav',
      'blocks': [{'vin': 0.0, 'vout': TOTAL, 'g': 0.0}], 'inserts': {'OUTRO': {'start': TOTAL, 'dur': 0}}, 'words': words, 'shots': shots,
      'chapters': [], 'subs': subs, 'cues': cues, 'music': music, 'red': [], 'beats': B, 'at': AT, 'flashCues': ['flash', 'land', 'hs_shot', 'win_hit'],
      'title': None, 'outro': None}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tl, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(f'total {TOTAL:.2f}s = {TOTAL_FRAMES} frames; {len(shots)} shots; {len(subs)} subs; {len(cues)} cues')
for s in shots:
    print(f"  {s['id']:10s} {s['t']:6.2f}s {s['dur']:4d}f")
