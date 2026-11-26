"""Timeline for the wordless short «Снеговик мстит» (9:16): music + SFX + big captions, no narration.
python3 -I tools/plan_snow.py -> src/snowman/tl.json"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
# (id, seconds, caption or '', transition)
SHOTS = [('s_build', 3.6, 'ОН ЛЕПИЛ ЕГО ЦЕЛЫЙ ЧАС', 'none'), ('s_nose', 3.0, 'ОСТАЛСЯ НОС', 'cut'), ('s_proud', 2.6, 'ИДЕАЛЬНО', 'cut'),
         ('s_leave', 2.4, '', 'cut'), ('s_dog', 3.0, 'НО ТУТ...', 'cut'), ('s_steal', 2.6, '', 'cut'), ('s_run', 2.2, 'ХОП!', 'whip'),
         ('s_wake', 3.2, 'ОН НЕ ЗНАЛ ОДНОГО', 'cut'), ('s_angry', 2.0, '', 'cut'), ('s_chase', 4.0, 'СНЕГОВИКИ ЖИВЫЕ', 'flash'),
         ('s_look', 2.2, '', 'cut'), ('s_catch', 3.2, '', 'cut'), ('s_back', 3.0, 'ВЕРНИ НОС', 'cut'), ('s_return', 3.6, 'КАК БУДТО НИЧЕГО НЕ БЫЛО', 'cut'),
         ('s_wink', 2.6, '', 'cut')]
shots, t = [], 0.0
for sid, d, cap, tr in SHOTS:
    shots.append({'id': sid, 't': round(t, 3), 'tr': tr, 'cap': cap, 'beats': []}); t += d
TOTAL = t
TOTAL_FRAMES = int(round(TOTAL * FPS))
for s in shots:
    s['from'] = int(round(s['t'] * FPS))
for i, s in enumerate(shots):
    s['to'] = shots[i + 1]['from'] if i + 1 < len(shots) else TOTAL_FRAMES
    s['dur'] = s['to'] - s['from']
S = {s['id']: s['t'] for s in shots}
CUES = [('wind', 0.0, 'wind', -16), ('crunch1', 0.6, 'crumble', -14), ('crunch2', 1.8, 'crumble', -14), ('pop_nose', S['s_nose'] + 1.6, 'pop', -8), ('proud', S['s_proud'] + 0.3, 'chip_achievement', -12),
        ('door', S['s_leave'] + 1.6, 'shutter', -14), ('steps_dog', S['s_dog'] + 0.2, 'footsteps', -16), ('sneak', S['s_dog'] + 0.5, 'tweety', -18), ('snatch', S['s_steal'] + 1.4, 'boing', -8),
        ('run', S['s_run'], 'whoosh', -10), ('wake', S['s_wake'] + 1.2, 'reverse_beep', -12), ('blink', S['s_wake'] + 2.0, 'pop', -12), ('angry', S['s_angry'] + 0.2, 'impact_big', -6),
        ('chase', S['s_chase'], 'riser', -10), ('bounce1', S['s_chase'] + 0.6, 'thud', -10), ('bounce2', S['s_chase'] + 1.4, 'thud', -10), ('bounce3', S['s_chase'] + 2.2, 'thud', -10), ('bounce4', S['s_chase'] + 3.0, 'thud', -10),
        ('gulp', S['s_look'] + 0.4, 'dumb_horn', -10), ('catch', S['s_catch'] + 1.8, 'bonk', -6), ('drop', S['s_back'] + 0.6, 'pop', -10), ('put', S['s_return'] + 1.0, 'pop', -8),
        ('door2', S['s_return'] + 2.2, 'shutter', -14), ('wink', S['s_wink'] + 1.2, 'ding', -8)]
cues = {n: {'t': round(t, 3), 'kind': k, 'gain': g} for n, t, k, g in CUES}
MUSIC = [('morning', 0.0, S['s_dog']), ('comedy', S['s_dog'], S['s_wake']), ('eerie', S['s_wake'], S['s_chase']), ('chip_quest', S['s_chase'], S['s_return']), ('comedy', S['s_return'], TOTAL)]
music = [{'mood': m, 's': s, 'e': e} for m, s, e in MUSIC]
tl = {'kind': 'club', 'version': 'snow', 'fps': FPS, 'total': TOTAL, 'frames': TOTAL_FRAMES, 'voiceLen': 1.0, 'voice': 'assets/voice_snow/silence.wav',
      'blocks': [], 'inserts': {'OUTRO': {'start': TOTAL, 'dur': 0}}, 'words': [], 'shots': shots, 'chapters': [], 'subs': [], 'cues': cues, 'music': music,
      'red': [], 'flashCues': [], 'title': None, 'outro': None}
os.makedirs(os.path.join(ROOT, 'src/snowman'), exist_ok=True)
json.dump(tl, open(os.path.join(ROOT, 'src/snowman/tl.json'), 'w'), ensure_ascii=False, indent=1)
print(f'snow: {TOTAL:.1f}s {TOTAL_FRAMES}f {len(shots)} shots')
