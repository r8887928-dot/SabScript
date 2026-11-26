# Сборка одного HTML-файла с панелью правок Vizavi (по vydacha.md):
#   python3 -I tools/build_html.py <race|tear> <h|v> [--local]
# --local: рабочая копия для проверки в песочнице (three из папки ролика, файлы по ссылкам).
import base64, json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kind, fmt = sys.argv[1], sys.argv[2]; local = '--local' in sys.argv
EDITOR = '/tmp/claude-0/-home-user-SabScript/94b5b0d6-9746-57c7-b201-093383cf88c3/scratchpad/vizavi/skills/vizavi-motion-3d/assets/vizavi-editor.js'
entry = {'race': 'src/main.js', 'tear': 'src/teardown.js'}[kind]
bundle = subprocess.run(['npx', '--yes', 'esbuild@0.24.0', entry, '--bundle', '--format=esm', '--external:three', '--external:three/addons/*'], cwd=ROOT, capture_output=True, text=True, check=True).stdout
b64 = lambda p, mime: f'data:{mime};base64,' + base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
voice = json.load(open(os.path.join(ROOT, 'zvuk/voice/voice.json')))
tracks = [('Голос', 'voice'), ('Музыка', 'music'), ('Атмосфера', 'ambience'), ('Эффекты', 'effects')]
audio = []
for ru, en in tracks:
    p = f'zvuk/panel/{kind}_{en}.m4a'
    if os.path.exists(os.path.join(ROOT, p)): audio.append({'name': ru, 'src': p if local else b64(p, 'audio/mp4')})
models = {'bmw': 'models/bmw_m5.glb', 'amg': 'models/mercedes_cls63.glb'}
if not local: models = {k: b64(v, 'model/gltf-binary') for k, v in models.items()}
models.update({'bmwYaw': 0, 'amgYaw': -1.5707963267948966})
three = './three/three.module.js' if local else 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'
addons = './three/addons/' if local else 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/'
title = {'race': 'BMW M5 против Mercedes CLS 63 — гонка', 'tear': 'Что внутри: BMW M5 и Mercedes CLS 63'}[kind]
html = f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title>
<script type="importmap">{json.dumps({'imports': {'three': three, 'three/addons/': addons}})}</script>
<style>html,body{{margin:0;background:#000;color:#fff;font-family:Inter,Arial,sans-serif}}canvas{{display:block;max-width:100vw;max-height:100vh}}</style></head><body>
<script>window.VZ_FMT={json.dumps(fmt)};window.VZ_MODELS={json.dumps(models)};window.VZ_VOICE={json.dumps(voice, ensure_ascii=False)};window.VZ_AUDIO={json.dumps(audio)};</script>
<script type="module">
{bundle}
</script>
<script>
{open(EDITOR, encoding='utf-8').read()}
</script>
</body></html>'''
os.makedirs(os.path.join(ROOT, 'final'), exist_ok=True)
name = ('panel_' if local else '') + f'{kind}_{"16x9" if fmt == "h" else "9x16"}.html'
out = os.path.join(ROOT, 'final' if not local else '', name)
open(out, 'w', encoding='utf-8').write(html)
print(out, round(os.path.getsize(out) / 1e6, 1), 'MB', 'audio tracks', len(audio))
