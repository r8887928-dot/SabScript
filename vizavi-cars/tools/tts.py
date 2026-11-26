# Голос: каждая фраза отдельным файлом (ElevenLabs, Liam, eleven_v3, ru). Ключ — вне репозитория.
import json, os, re, sys, urllib.request, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'src/narration.js'), encoding='utf-8').read()
def lines(name):
    block = src[src.index(f'export const {name} = ['):]; block = block[:block.index('];')]
    return [(float(a), b) for a, b in re.findall(r"\[([\d.]+), '([^']*)'\]", block)]
SAY = [('CLS 63', 'Си-Эл-Эс шестьдесят три'), ('AMG S', 'А-Эм-Гэ эс'), ('AMG', 'А-Эм-Гэ'), ('M5 Competition', 'Эм-пять Компетишн'), ('M5', 'Эм-пять'), ('M Compound', 'Эм Компаунд'),
       ('BMW', 'БМВ'), ('Mercedes', 'Мерседес'), ('V8', 'вэ-восемь'), ('четыре и четыре литра', 'четыре и четыре десятых литра')]
def say(t):
    for a, b in SAY: t = t.replace(a, b)
    return t
key = open('/root/.config/elevenlabs/api_key').read().strip()
out = os.path.join(ROOT, 'zvuk/voice'); meta = {}
for name in ('RACE', 'TEAR'):
    for i, (t0, text) in enumerate(lines(name)):
        p = os.path.join(out, f'{name.lower()}_{i:02d}.mp3')
        if not os.path.exists(p):
            body = json.dumps({'text': say(text), 'model_id': 'eleven_v3', 'language_code': 'ru', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8}}).encode()
            rq = urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/TX3LPaxmHKxFdv7VOQHJ?output_format=mp3_44100_128', body, {'xi-api-key': key, 'Content-Type': 'application/json'})
            try: open(p, 'wb').write(urllib.request.urlopen(rq, timeout=180).read())
            except urllib.error.HTTPError as e: print('ERR', name, i, e.code, e.read()[:200]); sys.exit(1)
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
        meta.setdefault(name, []).append({'t': t0, 'text': text, 'file': os.path.relpath(p, ROOT), 'dur': round(d, 3)})
json.dump(meta, open(os.path.join(out, 'voice.json'), 'w'), ensure_ascii=False, indent=1)
for name in meta:
    for k, m in enumerate(meta[name]):
        nxt = meta[name][k + 1]['t'] if k + 1 < len(meta[name]) else 180
        flag = '  <-- НАЛЕЗАЕТ' if m['t'] + m['dur'] > nxt - 0.2 else ''
        print(name, k, m['t'], m['dur'], 'до', round(m['t'] + m['dur'], 2), 'след', nxt, flag)
