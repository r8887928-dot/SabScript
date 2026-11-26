// Сцена ролика: мир + две машины + сборка + гонка + камера. renderFrame(n) зависит только от n.
import * as THREE from 'three';
import { createEngine, drawFrame } from './engine.js';
import { buildCar, assemble } from './cars.js';
import { makeEnv } from './env.js';
import { buildWorld, glowSprite } from './world.js';
import { loadModel, carFromModel } from './model.js';
import { FPS, FRAMES, T, SCENES, LANE, carX, camAt, timeRate } from './timeline.js';

const q = new URLSearchParams(location.search);
const vertical = q.get('fmt') === 'v';
const W = +(q.get('w') || (vertical ? 1080 : 1920)), H = +(q.get('h') || (vertical ? 1920 : 1080));
const E = createEngine({ width: W, height: H, fps: FPS });
document.body.appendChild(E.renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0a0e18');
scene.fog = new THREE.FogExp2('#141a26', 0.0055);
const envH = makeEnv(E.renderer, 'hangar'), envN = makeEnv(E.renderer, 'night'), envD = makeEnv(E.renderer, 'dawn');
scene.environment = envH;
const camera = new THREE.PerspectiveCamera(30, W / H, 0.08, 3000);
const world = buildWorld(scene);
// готовые модели: ?bmw=models/bmw.glb&bmwYaw=1.5708 (если присланы), иначе машины кодом
const MODELS = window.VZ_MODELS || {};
const mk = async (kind, len, name) => { const url = q.get(kind) || MODELS[kind]; if (!url) return buildCar(kind); return carFromModel(await loadModel(url), { length: len, yaw: +(q.get(kind + 'Yaw') || MODELS[kind + 'Yaw'] || 0), kind, name }); };
const bmw = await mk('bmw', 4.944, 'BMW M6 GT3'), amg = await mk('amg', 4.756, 'Mercedes-AMG ONE');
scene.add(bmw.root, amg.root);
bmw.root.position.set(0, 0, -LANE); amg.root.position.set(0, 0, LANE);
// фары-прожекторы
for (const c of [bmw, amg]) {
  c.heads = [];
  for (const z of [-0.6, 0.6]) {
    const s = new THREE.SpotLight(0xeaf2ff, 0, 80, 0.38, 0.5, 1.4); s.position.set(c.front - 0.2, 0.6, z); s.target.position.set(c.front + 20, 0, z * 2);
    c.root.add(s, s.target); c.heads.push(s);
  }
  c.flames = (c.lightMats.exhaust || []).map((p) => { const g = glowSprite('#ff7a2a', 0.0, 0.9); g.position.set(...p); c.body.add(g); return g; });
}
const settings = { exposure: 1, bloom: 1, blur: 1, vignette: 1, grain: 1, lamps: 1 };
const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const ramp = (t, a, b) => sm((t - a) / (b - a));

function updateCar(c, t, asmT, lightsOn) {
  const sink = assemble(c, asmT);
  const k = c.kind === 'amg' ? 'amg' : 'bmw';
  const st = carX(k, t);
  c.root.position.x = st.x;
  // подвеска: приседание при разгоне, клевок при торможении, удары сборки
  const pitch = Math.max(-0.035, Math.min(0.035, -(st.a || 0) * 0.0032));
  c.body.rotation.z = pitch; c.body.position.y = sink;
  // колёса вращаются ровно на пройденный путь
  for (const w of c.wheels) { const a = -(st.x) / w.userData.R * (w.userData.dir || 1); if (w.userData.spinAxis === 'z') w.userData.spin.rotation.z = a; else w.userData.spin.rotation.y = a; }
  const L = c.lightMats;
  (L.drl || []).forEach((m) => (m.emissiveIntensity = 3 * lightsOn));
  (L.lens || []).forEach((m) => (m.emissiveIntensity = 4 * lightsOn));
  (L.tail || []).forEach((m) => (m.emissiveIntensity = 3.5 * lightsOn));
  if (L.glowMat) L.glowMat.emissiveIntensity = 3 * lightsOn;
  c.heads.forEach((s) => (s.intensity = 90 * lightsOn));
  return st;
}

const W3 = {
  scene, camera,
  update(t) {
    // время сборки: хук (до 7 с) — машины уже собраны; затем сборка с нуля
    const asmB = t < T.asmB ? 99 : (t - T.asmB - 0.6) * 0.62;
    const asmA = t < T.asmB ? 99 : t < T.asmA ? -1 : (t - T.asmA - 0.4) * 0.62;
    const lights = t < T.asmB ? 1 : ramp(t, T.lights, T.lights + 0.4);
    updateCar(bmw, t, asmB, lights); updateCar(amg, t, asmA, lights);
    // ворота
    const g = ramp(t, T.gate + 1, T.gate + 7);
    world.doors[0].position.z = -4.25 - g * 8.2; world.doors[1].position.z = 4.25 + g * 8.2;
    // лампы ангара: в хуке тёмный ангар, при сборке зажигаются по рядам
    world.lamps.forEach((l) => { const on = t < T.asmB ? 0.15 : ramp(t, T.asmB + 0.2 + l.i * 0.08, T.asmB + 0.35 + l.i * 0.08); l.lamp.material.color.setScalar(0); l.lamp.visible = on > 0.02; });
    const lampOn = t < T.asmB ? 0.2 : ramp(t, T.asmB + 0.2, T.asmB + 2.2);
    world.lamps[0].lamp.material.color.set('#d9e6ff').multiplyScalar(3.2 * lampOn * settings.lamps);
    world.lights.key.intensity = 650 * (0.25 + 0.75 * lampOn) * settings.lamps;
    world.lights.rim.intensity = 500 * (0.3 + 0.7 * lampOn);
    // окружение и туман по актам
    const out = t > T.roll + 6;
    scene.environment = t > T.finale + 4 ? envD : out ? envN : envH;
    world.hangar.visible = t < T.stage + 1 || camera.position.x < 30;
    // роботы: наклоняются к своей машине, кивают при посадке деталей, светится инструмент
    for (const r of world.robots) {
      const st = r.car === 'bmw' ? T.asmB : T.asmA, work = ramp(t, st, st + 1.5) * (1 - ramp(t, st + 14, st + 16));
      const ph = t * 1.7 + r.x;
      r.yaw.rotation.y = (r.side > 0 ? Math.PI : 0) + (r.x > 0 ? -0.55 : 0.55) * work + Math.sin(ph * 0.7) * 0.12 * work;
      r.sh.rotation.z = 0; r.sh.rotation.x = r.side * (0.25 + 0.55 * work + Math.sin(ph) * 0.06 * work);
      r.el.rotation.x = r.side * (0.6 + 0.7 * work + Math.sin(ph * 1.3 + 1) * 0.1 * work);
      r.wr.rotation.x = r.side * 0.4 * work;
      const spark = work * Math.max(0, Math.sin(ph * 3.1)) ;
      r.tip.scale.setScalar(spark * 0.9);
    }
    // пыль
    const p = world.dustPts.geometry.attributes.position; const b = world.dustBase;
    for (let i = 0; i < p.count; i++) { p.array[i * 3] = b[i * 3] + Math.sin(t * 0.13 + i) * 0.3; p.array[i * 3 + 1] = (b[i * 3 + 1] + t * 0.05 * (0.5 + (i % 7) / 7)) % 11; }
    p.needsUpdate = true;
    // огонь из выхлопа на замерах
    for (const c of [bmw, amg]) c.flames.forEach((f, i) => { const pop = (t > T.specs && t < T.gate) ? Math.max(0, Math.sin(t * 9 + i * 1.7) - 0.7) * 3 : 0; f.scale.setScalar(0.05 + pop * 0.9); });
  },
  camAt: (t) => { const c = camAt(t, vertical); c.aperture *= settings.blur; return c; },
  jitterLights(k, N) { const d = E.disc(k, N); world.lights.key.position.set(-10 + d[0] * 0.8, 13, -11 + d[1] * 0.8); },
  post(t) {
    const flash = Math.max(0, 1 - Math.abs(t - 6.95) / 0.25) * 3 + Math.max(0, 1 - Math.abs(t - (T.lights + 0.15)) / 0.3) * 0.6;
    return { exposure: 0.9 * settings.exposure, bloom: 0.22 * settings.bloom, bloomThreshold: 2.2, bloomRadius: 0.35, vignette: 0.22 * settings.vignette, grain: 0.035 * settings.grain, flash, fade: Math.max(0, (t - 179) / 1) };
  },
  overlay() {},
};
let quality = 8;
const renderFrame = (n) => drawFrame(E, W3, n, quality);
const aimCamera = (n) => { const t = n / FPS; W3.update(t); const c = camAt(t, vertical); camera.position.set(...c.pos); camera.lookAt(...c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); };
const range = (name, key, max = 2) => ({ name, type: 'range', min: 0, max, step: 0.05, get: () => settings[key], set: (v) => { settings[key] = v; } });
window.vizaviScene = {
  title: 'BMW M6 GT3 против Mercedes-AMG ONE', fps: FPS, frames: FRAMES, width: W, height: H, saveQuality: 24,
  canvas: E.renderer.domElement, three: THREE, scene, camera, renderFrame, setQuality: (s) => { quality = s; }, aimCamera,
  sceneKnobs: [range('Яркость кадра', 'exposure'), range('Размытие фона', 'blur'), range('Свечение бликов', 'bloom'), range('Виньетка', 'vignette'), range('Зерно', 'grain'), range('Лампы ангара', 'lamps')],
  shots: SCENES.map(([name, a, b]) => ({ name, from: Math.round(a * FPS), to: Math.round(b * FPS) - 1, knobs: [] })),
  audio: [],
  // для локальной проверки
  E, world: W3, drawFrame: (n, N) => drawFrame(E, W3, n, N),
};
window.sceneReady = true;
