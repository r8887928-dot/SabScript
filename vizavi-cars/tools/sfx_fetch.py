# Поиск и скачивание звуков из Openverse (только cc0 / by / by-sa), записи источников.
import json, os, sys, time, urllib.request, urllib.parse, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); RAW = os.path.join(ROOT, 'zvuk/raw'); os.makedirs(RAW, exist_ok=True)
Q = {
 'amb_garage': ['garage room tone', 'workshop ambience hum', 'large room tone'],
 'amb_night': ['night ambience crickets', 'night wind ambience field', 'airport night ambience'],
 'impact_metal': ['metal impact heavy', 'metal clank hit', 'heavy metal thud'],
 'air_wrench': ['impact wrench pneumatic', 'air wrench'],
 'ratchet': ['ratchet wrench', 'socket wrench ratchet'],
 'whoosh': ['whoosh fast', 'swoosh swish fast'],
 'light_on': ['light switch clunk', 'fluorescent lights turn on', 'electrical switch on'],
 'engine_start': ['v8 engine start', 'car engine start rev'],
 'engine_rev': ['v8 engine rev', 'car engine revving', 'sports car rev'],
 'passby': ['race car pass by', 'car pass by fast', 'car passing high speed'],
 'tire': ['tire squeal', 'tyre screech', 'car burnout'],
 'roller_door': ['roller shutter door', 'garage door opening', 'rolling door metal'],
 'beep': ['countdown beep', 'start beep race', 'beep tone'],
 'riser': ['cinematic riser', 'riser tension'],
 'boom': ['cinematic boom', 'impact boom hit trailer'],
 'servo': ['servo motor mechanical', 'robot arm servo', 'hydraulic lift'],
 'bolt': ['bolt unscrew', 'screw metal tool'],
 'glass': ['glass panel place', 'glass clink'],
 'hiss': ['air release hiss', 'pneumatic hiss'],
}
OK = {'cc0', 'by', 'by-sa', 'pdm'}
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'}
get = lambda u, t=40: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t)
def search(q, music=False):
    url = 'https://api.openverse.org/v1/audio/?' + urllib.parse.urlencode({'q': q, 'page_size': 20, **({'category': 'music'} if music else {'source': 'freesound'})})
    for attempt in range(3):
        try: return json.load(get(url))['results']
        except Exception as e: time.sleep(2)
    return []
src = []
def grab(key, results, n, dmin, dmax):
    got = 0
    for r in results:
        if r.get('license') not in OK: continue
        d = (r.get('duration') or 0) / 1000
        if not (dmin <= d <= dmax): continue
        u = r.get('url'); fn = os.path.join(RAW, f'{key}_{got}.mp3')
        if not os.path.exists(fn):
            try: open(fn, 'wb').write(get(u, 60).read())
            except Exception as e: continue
        src.append({'key': key, 'file': os.path.relpath(fn, ROOT), 'title': r.get('title'), 'creator': r.get('creator'), 'license': r.get('license'), 'license_version': r.get('license_version'), 'url': r.get('foreign_landing_url'), 'duration': d})
        got += 1
        if got >= n: break
    return got
LIM = {'amb_garage': (20, 600), 'amb_night': (20, 600), 'riser': (2, 15), 'boom': (1, 12)}
for key, qs in Q.items():
    res = []
    for q in qs: res += search(q); time.sleep(1.1)
    seen = set(); res = [r for r in res if not (r['id'] in seen or seen.add(r['id']))]
    dmin, dmax = LIM.get(key, (0.3, 25))
    print(key, 'candidates', len(res), 'got', grab(key, res, 4, dmin, dmax))
# музыка
mres = []
for q in ['cinematic electronic', 'epic trailer', 'dark electronic driving', 'action cinematic']: mres += search(q, music=True); time.sleep(1.1)
seen = set(); mres = [r for r in mres if not (r['id'] in seen or seen.add(r['id']))]
print('music candidates', len(mres), 'got', grab('music', mres, 5, 90, 600))
json.dump(src, open(os.path.join(ROOT, 'zvuk/sources.json'), 'w'), ensure_ascii=False, indent=1)
with open(os.path.join(ROOT, 'zvuk/источники.md'), 'w') as f:
    f.write('# Источники звуков (Openverse)\n\n| файл | название | автор | лицензия | ссылка |\n|---|---|---|---|---|\n')
    for s in src: f.write(f"| {s['file']} | {s['title']} | {s['creator']} | {s['license']} {s['license_version'] or ''} | {s['url']} |\n")
