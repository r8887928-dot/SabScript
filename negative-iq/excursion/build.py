"""Сборка вертикального ролика «Экскурсия в суд» (1080x1920, 30 fps) из присланного CapCut-ролика.
python3 -I excursion/build.py <src.mp4> <outdir>
Шаги: клипы на весь экран (без анимации перехода) -> склейка -> ASS-титры -> микс (голос + музыка) -> mp4."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from script import EDIT, KEYW

SRC, OUT = sys.argv[1], os.path.abspath(sys.argv[2])
os.makedirs(OUT, exist_ok=True)
FPS, W, H = 30, 1080, 1920
VO = os.path.join(ROOT, 'assets/voice_exc')
WORDS = json.load(open(os.path.join(VO, 'words.json')))
LEAD = 0.35  # голос стартует через 0.35 с после склейки


def run(*a):
    subprocess.run(list(a), check=True)


def dur_of(p):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)


# лучшие точки входа внутри исходных отрезков
IN_AT = {'v_lobby': 12.2, 'v_kiosk': 20.6, 'v_study': 31.8, 'v_cups': 36.7, 'v_museum': 44.2, 'v_gavel': 48.6, 'v_robes': 60.0,
         'v_portraits': 73.2, 'v_court': 82.4, 'v_tea': 93.0}
EXTRA = {'v_gavel': 1.6, 'v_tea': 2.6, 'v_robes': 1.4, 'p_final': 1.2}  # дать кадру подышать

GRADE = 'eq=contrast=1.07:saturation=1.18:brightness=0.012:gamma=0.98,colorbalance=rs=0.02:bs=-0.02:rh=0.03:bh=-0.02'
SHARP = 'unsharp=5:5:0.9:5:5:0.0'
segs, t = [], 0.0
for i, (sid, a, b, kind, text, chip) in enumerate(EDIT):
    vo = os.path.join(VO, f'{i:02d}_{sid}.mp3')
    vd = dur_of(vo)
    want = max(vd + LEAD + 0.75 + EXTRA.get(sid, 0), 3.0)
    out = os.path.join(OUT, f'seg_{i:02d}.mp4')
    if kind == 'video':
        st = IN_AT.get(sid, a)
        d = min(want, b - st)
        if d < want - 0.05:  # исходника не хватает — чуть замедлить
            k = want / d
            pts = f'setpts={k:.4f}*PTS,'
        else:
            k, pts = 1.0, ''
        d_out = min(want, d * k)
        vf = (f'crop=268:478:290:0,{pts}hqdn3d=2:2:4:4,scale={W}:1927:flags=lanczos,crop={W}:{H}:0:3,{SHARP},{GRADE},'
              f'vignette=angle=PI/5,fps={FPS},format=yuv420p')
        run('ffmpeg', '-v', 'error', '-y', '-ss', f'{st:.3f}', '-t', f'{d + 0.2:.3f}', '-i', SRC, '-vf', vf, '-t', f'{d_out:.3f}', '-an',
            '-c:v', 'libx264', '-crf', '12', '-preset', 'medium', out)
    else:  # фото: размытый фон на весь кадр + фото по ширине, без движения
        d_out = want
        mid = (a + b) / 2
        fc = (f'[0:v]split[bg][fg];'
              f'[bg]scale=-2:{H}:flags=bicubic,crop={W}:{H},delogo=x=12:y=14:w=140:h=38,boxblur=40:3,eq=brightness=-0.10:saturation=1.2[b];'
              f'[fg]delogo=x=12:y=14:w=140:h=38,hqdn3d=1.5:1.5:2:2,scale={W}:-2:flags=lanczos,{SHARP},{GRADE}[f];'
              f'[b][f]overlay=0:(H-h)/2-150,vignette=angle=PI/5,fps={FPS},format=yuv420p')
        run('ffmpeg', '-v', 'error', '-y', '-ss', f'{mid:.3f}', '-i', SRC, '-frames:v', '1', '-update', '1', os.path.join(OUT, f'still_{i:02d}.png'))
        run('ffmpeg', '-v', 'error', '-y', '-loop', '1', '-framerate', str(FPS), '-i', os.path.join(OUT, f'still_{i:02d}.png'), '-filter_complex', fc,
            '-t', f'{d_out:.3f}', '-an', '-c:v', 'libx264', '-crf', '12', '-preset', 'medium', out)
    nf = int(round(d_out * FPS))
    segs.append({'id': sid, 'i': i, 't': t, 'from': int(round(t * FPS)), 'dur': nf, 'vo': vo, 'vd': vd, 'kind': kind, 'chip': chip, 'text': text})
    t = (segs[-1]['from'] + nf) / FPS
    print(f'{sid:12s} {d_out:5.2f}s  voice {vd:4.2f}s')
TOTAL = t
TF = int(round(TOTAL * FPS))
print('total', round(TOTAL, 2))

# ------------------------------------------------------------------ склейка (жёсткие склейки)
lst = os.path.join(OUT, 'list.txt')
open(lst, 'w').write(''.join(f"file '{os.path.join(OUT, f'seg_{s['i']:02d}.mp4')}'\n" for s in segs))
run('ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', os.path.join(OUT, 'cut.mp4'))

# ------------------------------------------------------------------ голос одной дорожкой
SR = 48000
inputs, flt = [], []
for k, s in enumerate(segs):
    inputs += ['-i', s['vo']]
    ms = int((s['t'] + LEAD) * 1000)
    flt.append(f'[{k}:a]aresample={SR},pan=mono|c0=c0,adelay={ms}[a{k}]')
flt.append(''.join(f'[a{k}]' for k in range(len(segs))) + f'amix=inputs={len(segs)}:normalize=0,apad,atrim=0:{TOTAL:.3f}[v]')
voice = os.path.join(ROOT, 'assets/voice_exc/voice.wav')
run('ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(flt), '-map', '[v]', '-ar', str(SR), voice)

# ------------------------------------------------------------------ таймлайн для микшера
S = {s['id']: s['t'] for s in segs}
MUSIC = [('morning', 0.0, S['v_gavel']), ('comedy', S['v_gavel'], S['v_robes']), ('interlude', S['v_robes'], S['v_tea']),
         ('morning', S['v_tea'], S['p_final']), ('finale', S['p_final'], TOTAL)]
cues = {'gavel1': {'t': S['v_gavel'] + 0.15, 'kind': 'pop', 'gain': -16}, 'end': {'t': S['p_final'] + 0.1, 'kind': 'ding', 'gain': -12}}
shots = [{'id': s['id'], 't': s['t'], 'from': s['from'], 'to': s['from'] + s['dur'], 'dur': s['dur']} for s in segs]
tl = {'kind': 'club', 'version': 'exc', 'fps': FPS, 'total': TOTAL, 'frames': TF, 'voice': 'assets/voice_exc/voice.wav',
      'blocks': [{'vin': 0.0, 'vout': TOTAL, 'g': 0.0}], 'shots': shots, 'cues': cues,
      'music': [{'mood': m, 's': a, 'e': b} for m, a, b in MUSIC]}
tlp = os.path.join(HERE, 'tl.json')
json.dump(tl, open(tlp, 'w'), ensure_ascii=False, indent=1)
run('python3', '-I', os.path.join(ROOT, 'tools/audio/mix.py'), tlp, OUT)


# ------------------------------------------------------------------ ASS-титры
def ts(x):
    x = max(0, x)
    return f'{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}'


INK, YEL = '&H00261724', '&H0033D6FF'
ass = [f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Inter Display Black,76,&H00FFFFFF,&H00FFFFFF,{INK},&H96000000,-1,0,0,0,100,100,0,0,1,7,4,2,60,60,0,1
Style: Chip,Inter Display ExtraBold,52,{INK},&H00FFFFFF,{YEL},&H00000000,-1,0,0,0,100,100,2,0,3,16,0,8,40,40,0,1
Style: Title,Inter Display Black,128,&H00FFFFFF,&H00FFFFFF,{INK},&H96000000,-1,0,0,0,100,100,0,0,1,9,6,8,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"""]
SUB_Y = {'photo': 1500, 'video': 1440}
for s in segs:
    t0, t1 = s['t'], s['t'] + s['dur'] / FPS
    if s['id'] == 'p_build':
        ass.append(f'Dialogue: 2,{ts(t0)},{ts(t1)},Title,,0,0,0,,{{\\pos(540,250)\\fad(0,150)}}ЭКСКУРСИЯ\\N{{\\c{YEL}}}В СУД')
    else:
        ass.append(f'Dialogue: 1,{ts(t0)},{ts(t1)},Chip,,0,0,0,,{{\\pos(540,170)\\fad(120,100)}}{s["chip"]}')
    # слова озвучки -> фразы по 2-3 слова
    ws = WORDS[f'{s["i"]:02d}']
    orig = s['text'].replace('—', ' ').split()
    if len(orig) == len(ws):  # написание из сценария, тайминг из распознавания
        ws = [(o, w[1], w[2]) for o, w in zip(orig, ws)]
    chunks, cur = [], []
    for w in ws:
        cur.append(w)
        if len(cur) == 3 or w[0][-1] in '.,!:?' or sum(len(x[0]) for x in cur) > 13:
            chunks.append(cur); cur = []
    if cur:
        chunks.append(cur)
    base = s['t'] + LEAD
    for j, c in enumerate(chunks):
        a = base + c[0][1] - 0.05
        b = base + (chunks[j + 1][0][1] - 0.05 if j + 1 < len(chunks) else c[-1][2] + 0.45)
        b = min(b, t1)
        words = []
        for w in c:
            clean = w[0].strip('.,!:?')
            col = f'{{\\c{YEL}}}' if clean.lower() in KEYW or w[0].lower() in KEYW else ''
            words.append(f'{col}{clean.upper()}{{\\c&H00FFFFFF&}}' if col else clean.upper())
        ass.append(f'Dialogue: 3,{ts(a)},{ts(b)},Sub,,0,0,0,,{{\\pos(540,{SUB_Y[s["kind"]]})\\fad(60,0)\\t(0,90,\\fscx106\\fscy106)\\t(90,180,\\fscx100\\fscy100)}}' + ' '.join(words))
open(os.path.join(OUT, 'subs.ass'), 'w').write('\n'.join(ass) + '\n')

final = os.path.join(OUT, 'final.mp4')
run('ffmpeg', '-v', 'error', '-y', '-i', os.path.join(OUT, 'cut.mp4'), '-i', os.path.join(OUT, 'mix.wav'),
    '-vf', f"ass={os.path.join(OUT, 'subs.ass')}", '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow',
    '-maxrate', '12M', '-bufsize', '24M', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', final)
print('->', final)
