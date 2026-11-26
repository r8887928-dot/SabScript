// Ролик 2: «Что внутри» — разборка BMW M5 Competition и Mercedes CLS 63 AMG S в гараже.
import * as THREE from 'three';
import { makeSubs } from './subs.js';
import { createEngine, drawFrame } from './engine.js';
import { makeEnv } from './env.js';
import { buildWorld } from './world.js';
import { loadModel, carFromModel } from './model.js';
import { buildV8 } from './engine_v8.js';

const q = new URLSearchParams(location.search);
const vertical = (window.VZ_FMT || q.get('fmt')) === 'v';
const W = +(q.get('w') || (vertical ? 1080 : 1920)), H = +(q.get('h') || (vertical ? 1920 : 1080));
export const FPS = 30, DUR = 180, FRAMES = DUR * FPS;
const E = createEngine({ width: W, height: H, fps: FPS });
document.body.appendChild(E.renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#07090d'); scene.fog = new THREE.FogExp2('#0b1222', 0.004);
scene.environment = makeEnv(E.renderer, 'hangar');
const VOICE = window.VZ_VOICE || await (await fetch('zvuk/voice/voice.json')).json();
const drawSubs = makeSubs(VOICE.TEAR, vertical);
const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 3000);
const world = buildWorld(scene);
world.strip.visible = false; world.sky.visible = false; world.stars.visible = false;
const MODELS = window.VZ_MODELS || { bmw: 'models/bmw_m5.glb', amg: 'models/mercedes_cls63.glb' };
const CLS_MATS = { METAL_PIANO: { c: '#060607', r: 0.08, cc: 1 }, PLASTIC: { c: '#111214', r: 0.55 }, SOLID_BLACK: { c: '#070708', r: 0.7 }, GRILLE: { c: '#c9cdd3', m: 1, r: 0.16 },
  RUBBER: { c: '#0b0b0c', r: 0.9 }, METAL_SATIN: { c: '#a9aeb4', m: 1, r: 0.34 }, METAL_GREY: { c: '#5d6268', m: 1, r: 0.4 }, LIGHTS: { c: '#d9dde2', m: 1, r: 0.1 },
  CARBON: { c: '#16171a', r: 0.35, cc: 0.8 }, METAL_CHROME: { c: '#e6e9ed', m: 1, r: 0.06 }, WHEELS_FACE: { c: '#b4b9bf', m: 1, r: 0.24 }, WHEELS_CHROME: { c: '#e6e9ed', m: 1, r: 0.06 },
  WHEELS_METAL: { c: '#696e74', m: 1, r: 0.35 }, WHEELS_BLACK: { c: '#0c0c0d', r: 0.6 }, TIRES: { c: '#111113', r: 0.88 } };
const bmw = carFromModel(await loadModel(MODELS.bmw), { length: 4.966, yaw: 0, kind: 'bmw', name: 'BMW M5 Competition', paint: '#16181d', paintMetal: 0.85, paintRough: 0.32 });
const amg = carFromModel(await loadModel(MODELS.amg), { length: 4.996, yaw: -Math.PI / 2, kind: 'amg', name: 'Mercedes CLS 63 AMG S', paint: '#6b0d16', paintMetal: 0.9, paintRough: 0.28, matTable: CLS_MATS });
const ZB = -3.2, ZA = 3.2;
bmw.root.position.set(0, 0, ZB); amg.root.position.set(0, 0, ZA); scene.add(bmw.root, amg.root);
// у модели Mercedes нет двигателя — ставим V8 5.5 битурбо в моторный отсек
const v8 = buildV8({ name: 'Двигатель V8 5.5 битурбо', plate: 'V8 5.5 BITURBO', cover: '#2a2c31', coil: '#c0151b', alu: '#8b8f95' }); v8.position.set(1.42, 0.22, 0); amg.body.add(v8);
// у BMW в модели только крышка мотора — ставим V8 4.4 твин-турбо (горячий развал)
const v8b = buildV8({ name: 'Двигатель V8 4.4 твин-турбо', plate: 'V8 4.4 TWIN-TURBO', cover: '#0d0e11', coil: '#2a6bff', alu: '#5f646b', hotV: true }); v8b.position.set(1.5, 0.3, 0); bmw.body.add(v8b);
const standMat = new THREE.MeshStandardMaterial({ color: 0xb3161b, roughness: 0.45, metalness: 0.4 });
const mkStand = () => { const g = new THREE.Group(); const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.08), standMat); post.position.y = -0.1; g.add(post);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), standMat); arm.position.y = 0.04; g.add(arm); const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), standMat); plate.rotation.z = Math.PI / 2; plate.position.set(-0.28, 0.12, 0); g.add(plate);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), standMat); foot.position.y = -0.26; g.add(foot); g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); g.userData.vz = 'Монтажный стенд'; g.visible = false; return g; };
const standB = mkStand(); standB.position.set(0, 0.05, 0); v8b.add(standB); const standA = mkStand(); standA.position.set(0, 0.05, 0); v8.add(standA);
for (const c of [bmw, amg]) { (c.lightMats.lens || []).forEach((m) => (m.emissiveIntensity = 0.35)); (c.lightMats.tail || []).forEach((m) => (m.emissiveIntensity = 0.6)); }
// поворотные подиумы под машинами
const turn = [];
for (const z of [ZB, ZA]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.15, 0.07, 96), new THREE.MeshPhysicalMaterial({ color: 0x15161a, roughness: 0.2, metalness: 1, clearcoat: 0.6 })); d.position.set(0, 0.035, z); d.receiveShadow = true; d.userData.vz = 'Поворотный подиум'; scene.add(d);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.12, 0.018, 8, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(z < 0 ? '#3a7bff' : '#ff3355').multiplyScalar(2.2) })); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.072, z); scene.add(ring); turn.push(d); }
for (const c of [bmw, amg]) { c.root.position.y = 0.07; }

// ---------------- разлёт деталей: направление от центра машины, внешние детали дальше и раньше
const CORE = /днище|салон/;
function planExplode(c) {
  const ctr = new THREE.Vector3((c.front + c.rear) / 2, 0.7, 0); let maxD = 0;
  for (const p of c.parts) maxD = Math.max(maxD, p.base.distanceTo(ctr));
  for (const p of c.parts) {
    const d = p.base.clone().sub(ctr), dist = d.length(); d.normalize();
    let mag = 0.5 + 1.3 * (dist / maxD), up = 0.35 + 0.5 * Math.max(0, d.y);
    if (/кузов|хром|решётка|фары|эмблемы|карбон/.test(p.name)) { mag *= 1.35; up += 0.5; }
    if (/стёкла/.test(p.name)) { mag *= 1.1; up += 1.0; }
    if (/двигатель/.test(p.name)) { mag *= 0.6; up += 1.3; }
    if (CORE.test(p.name)) { mag = 0.0; up = 0.0; }
    if (/салон/.test(p.name)) { mag = 0.25; up = 0.15; }
    p.ex = new THREE.Vector3(d.x * mag, up, d.z * mag * 1.4); p.exDelay = (1 - dist / maxD) * 0.45; p.spinEx = (p.base.x * 7.1 % 1) * 0.3;
  }
  for (const w of c.wheels) { const f = w.userData.final; w.userData.ex = new THREE.Vector3(Math.sign(f.x) * 0.5, 0.2, Math.sign(f.z) * 1.6); }
}
planExplode(bmw); planExplode(amg);
const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * u * (u * (u * 6 - 15) + 10); };
const back = (u) => { u = Math.min(1, Math.max(0, u)); const s = 1.3; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
function explode(c, e, t) {
  for (const p of c.parts) {
    const u = (e - p.exDelay) / (1 - 0.45); const k = e >= 1 ? 1 : u <= 0 ? 0 : back(u);
    const float = k * 0.02 * Math.sin(t * 0.9 + p.base.x * 3 + p.base.z * 5);
    p.obj.position.set(p.base.x + p.ex.x * k, p.base.y + p.ex.y * k + float, p.base.z + p.ex.z * k);
    p.obj.rotation.set(p.spinEx * k * 0.3, 0, p.spinEx * k * 0.2);
    p.obj.visible = true;
  }
  for (const w of c.wheels) { const k = sm(e * 1.2 - 0.1); const f = w.userData.final, x = w.userData.ex; w.position.set(f.x + x.x * k, f.y + x.y * k, f.z + x.z * k); w.rotation.y = Math.sign(f.z) * k * 0.6; w.visible = true; }
}
// ---------------- хронометраж
export const T = { hook: 0, intro: 8, bExp: 24, bDet: 36, aExp: 62, aDet: 74, cmp: 100, back: 135, fin: 160, end: 180 };
export const SCENES = [['Сцена 1: что внутри', 0, 8], ['Сцена 2: две машины', 8, 24], ['Сцена 3: разборка BMW', 24, 36], ['Сцена 4: мотор BMW', 36, 50], ['Сцена 5: колёса и салон BMW', 50, 62],
  ['Сцена 6: разборка Mercedes', 62, 74], ['Сцена 7: мотор Mercedes', 74, 88], ['Сцена 8: колёса и салон Mercedes', 88, 100], ['Сцена 9: сравнение', 100, 135], ['Сцена 10: сборка', 135, 160], ['Сцена 11: финал', 160, 180]];
function explodeState(t) {
  const hookB = t < 8 ? sm((t - 2.2) / 4) * 0.22 : 0;
  const b = t < 8 ? hookB : t < T.back ? sm((t - T.bExp) / 9) : 1 - sm((t - T.back - 2) / 9);
  const a = t < T.back ? sm((t - T.aExp) / 9) : 1 - sm((t - T.back - 9) / 9);
  return { b: Math.max(0, b), a: Math.max(0, a) };
}
// ---------------- камера: ключи {t, p, l, fov, ap, cut}
const K = [
  { t: 0, p: [3.9, 1.15, ZB - 1.3], l: [1.7, 0.8, ZB], fov: 28, ap: 0.012, cut: true },
  { t: 4, p: [4.6, 2.6, ZB - 2.4], l: [1.5, 0.7, ZB], fov: 32, ap: 0.012 },
  { t: 7.99, p: [3.6, 4.2, ZB + 0.4], l: [1.5, 0.5, ZB], fov: 36, ap: 0.012 },
  { t: 8, p: [10, 2.4, -9], l: [0, 0.7, 0], fov: 30, ap: 0.04, cut: true },
  { t: 14, p: [11.5, 1.3, 0], l: [0, 0.7, 0], fov: 30, ap: 0.04 },
  { t: 19, p: [9, 3.2, 8.5], l: [0, 0.7, 0], fov: 32, ap: 0.04 },
  { t: 23.9, p: [5, 2.0, ZB - 7.5], l: [0, 0.8, ZB], fov: 32, ap: 0.03 },
  { t: 28, p: [-4, 2.6, ZB - 7.0], l: [0, 0.9, ZB], fov: 34, ap: 0.03 },
  { t: 32, p: [-6.5, 4.0, ZB + 0.5], l: [0, 0.9, ZB], fov: 36, ap: 0.03 },
  { t: 36, p: [3.8, 2.6, ZB - 2.4], l: [1.5, 0.65, ZB], fov: 30, ap: 0.02 },
  { t: 42, p: [2.9, 1.7, ZB - 1.6], l: [1.5, 0.62, ZB], fov: 28, ap: 0.015 },
  { t: 49, p: [2.7, 2.2, ZB + 1.8], l: [1.5, 0.62, ZB], fov: 28, ap: 0.015 },
  { t: 54, p: [3.4, 0.75, ZB - 4.2], l: [1.95, 0.5, ZB - 2.4], fov: 30, ap: 0.015 },
  { t: 58, p: [0.5, 1.9, ZB - 2.4], l: [-0.2, 0.75, ZB], fov: 32, ap: 0.02 },
  { t: 61.9, p: [-1, 3.6, 0], l: [0, 0.7, ZA], fov: 34, ap: 0.03 },
  { t: 66, p: [5, 2.0, ZA + 7.5], l: [0, 0.8, ZA], fov: 32, ap: 0.03 },
  { t: 70, p: [-5, 3.2, ZA + 6.5], l: [0, 0.9, ZA], fov: 34, ap: 0.03 },
  { t: 74, p: [3.6, 2.4, ZA + 2.2], l: [1.45, 0.6, ZA], fov: 30, ap: 0.02 },
  { t: 80, p: [2.6, 1.4, ZA + 1.4], l: [1.45, 0.55, ZA], fov: 28, ap: 0.015 },
  { t: 87, p: [2.4, 2.1, ZA - 1.5], l: [1.4, 0.55, ZA], fov: 28, ap: 0.015 },
  { t: 92, p: [3.4, 0.75, ZA + 4.2], l: [1.95, 0.5, ZA + 2.4], fov: 30, ap: 0.015 },
  { t: 96, p: [0.5, 1.9, ZA + 2.4], l: [-0.2, 0.75, ZA], fov: 32, ap: 0.02 },
  { t: 100, p: [9.5, 2.2, 0], l: [0, 0.8, 0], fov: 32, ap: 0.02 },
  { t: 108, p: [5.5, 1.2, 0], l: [1.4, 0.7, 0], fov: 34, ap: 0.02 },
  { t: 116, p: [-1.5, 6.5, 0.1], l: [0.5, 0.4, 0], fov: 40, ap: 0.01 },
  { t: 124, p: [-9, 2.4, 6], l: [0, 0.8, 0], fov: 32, ap: 0.02 },
  { t: 134.9, p: [-10, 1.6, -4], l: [0, 0.8, 0], fov: 32, ap: 0.02 },
  { t: 140, p: [7, 1.3, -7.5], l: [0, 0.7, ZB], fov: 30, ap: 0.03 },
  { t: 147, p: [9, 2.0, 0], l: [0, 0.7, 0], fov: 32, ap: 0.03 },
  { t: 153, p: [7, 1.3, 7.5], l: [0, 0.7, ZA], fov: 30, ap: 0.03 },
  { t: 159.9, p: [12, 1.6, 0], l: [0, 0.7, 0], fov: 30, ap: 0.03 },
  { t: 166, p: [13.5, 1.2, -2], l: [0, 0.8, 0], fov: 28, ap: 0.03 },
  { t: 180, p: [9, 5.5, 0], l: [0, 0.6, 0], fov: 38, ap: 0.02 },
];
const cr = (p0, p1, p2, p3, u) => { const u2 = u * u, u3 = u2 * u; return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3); };
function camAt(t) {
  const base = camAtKeys(t);
  const c = CALL.find((x) => x.wheel !== undefined && t > x.a - 1.2 && t < x.b + 0.4);
  if (!c) return base;
  const tp = calloutPoint(c, new THREE.Vector3()); const side = c.car === 'bmw' ? -1 : 1;
  const k = Math.min(1, (t - c.a + 1.2) / 1.0, (c.b + 0.4 - t) / 0.6), e = k * k * (3 - 2 * k);
  const want = [tp.x + 1.25, tp.y + 0.32, tp.z + side * 1.55];
  base.pos = base.pos.map((v, i) => v + (want[i] - v) * e); base.look = base.look.map((v, i) => v + ([tp.x, tp.y, tp.z][i] - v) * e);
  base.fov = base.fov + (32 - base.fov) * e; base.focus = Math.hypot(base.pos[0] - tp.x, base.pos[1] - tp.y, base.pos[2] - tp.z); return base;
}
function camAtKeys(t) {
  let i = 0; while (i < K.length - 1 && K[i + 1].t <= t) i++;
  const k1 = K[i], k2 = K[Math.min(K.length - 1, i + 1)], same = k2 === k1 || k2.cut;
  const k0 = K[i - 1] && !k1.cut ? K[i - 1] : k1, k3 = K[i + 2] && !K[i + 2].cut ? K[i + 2] : (same ? k1 : k2);
  const C = same ? k1 : k2, u = same ? 0 : Math.min(1, Math.max(0, (t - k1.t) / (k2.t - k1.t)));
  const p = [0, 1, 2].map((j) => cr(k0.p[j], k1.p[j], C.p[j], k3.p[j], u)), l = [0, 1, 2].map((j) => cr(k0.l[j], k1.l[j], C.l[j], k3.l[j], u));
  let fov = k1.fov + (C.fov - k1.fov) * sm(u); const ap = (k1.ap ?? 0.02) + ((C.ap ?? 0.02) - (k1.ap ?? 0.02)) * u;
  const n1 = Math.sin(t * 0.71) * 0.6 + Math.sin(t * 1.33 + 1.7) * 0.4, n2 = Math.sin(t * 0.53 + 0.3) * 0.5 + Math.sin(t * 1.07 + 2.1) * 0.5;
  p[0] += n1 * 0.015; p[1] += n2 * 0.012;
  if (vertical) { fov = Math.min(75, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * 1.6) * 180 / Math.PI); }
  return { pos: p, look: l, fov, aperture: ap * settings.blur, roll: n1 * 0.2, focus: Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]) };
}
// ---------------- подписи-выноски (2D поверх кадра, привязаны к 3D-точкам)
const CALL = [
  { a: 36.5, b: 49.5, car: 'bmw', p: [1.5, 0.88, 0], t: 'V8 4.4 твин-турбо', s: '625 л.с. · 750 Н·м' },
  { a: 51, b: 57.5, car: 'bmw', wheel: 0, t: 'Тормоза M Compound', s: 'диск 395 мм спереди' },
  { a: 58, b: 61.8, car: 'bmw', p: [-0.2, 0.8, 0], t: 'Салон', s: 'кожа Merino, карбон' },
  { a: 74.5, b: 87.5, car: 'amg', p: [1.42, 0.75, 0], t: 'V8 5.5 битурбо', s: '585 л.с. · 800 Н·м' },
  { a: 88, b: 95.5, car: 'amg', wheel: 0, t: 'Тормоза AMG', s: 'диск 390 мм спереди' },
  { a: 96, b: 99.8, car: 'amg', p: [-0.2, 0.8, 0], t: 'Салон', s: 'кожа, отделка designo' },
];
const BOARDS = [
  { a: 103, b: 110, t: 'МОЩНОСТЬ', l: '625 л.с.', r: '585 л.с.' }, { a: 110, b: 117, t: 'КРУТЯЩИЙ МОМЕНТ', l: '750 Н·м', r: '800 Н·м' },
  { a: 117, b: 124, t: '0–100 КМ/Ч', l: '3,3 с', r: '3,6 с' }, { a: 124, b: 131, t: 'МАССА', l: '≈1890 кг', r: '≈1870 кг' },
];
function calloutPoint(c, out) {
  const car = c.car === 'bmw' ? bmw : amg; car.root.updateMatrixWorld(true);
  if (c.wheel !== undefined) { const w = car.wheels.find((x) => x.userData.final.x > 0 && Math.sign(x.userData.final.z) === (car === bmw ? -1 : 1)) || car.wheels[0]; return w.getWorldPosition(out).add(new THREE.Vector3(0, 0.05, car === bmw ? -0.12 : 0.12)); }
  return out.set(...c.p).applyMatrix4(car.root.matrixWorld);
}
const settings = { exposure: 1, bloom: 1, blur: 1, vignette: 1, grain: 1, lamps: 1, labels: 1 };
const proj = new THREE.Vector3();
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const W3 = {
  scene, camera,
  update(t) {
    const ex = explodeState(t); explode(bmw, ex.b, t); explode(amg, ex.a, t);
    // студийный показ: на крупных планах остаются только шасси, колёса и то, о чём рассказ
    const focus = CALL.find((c) => t > c.a - 1.2 && t < c.b + 0.3);
    const cpos = new THREE.Vector3(...camAt(t).pos), wp = new THREE.Vector3();
    for (const c of [bmw, amg]) { c.root.updateMatrixWorld(true); const iso = focus && (focus.car === (c === bmw ? 'bmw' : 'amg'));
      const keep = !iso ? null : /мотор|V8/.test(focus.t) ? /^$/ : /Тормоза|привод/.test(focus.t) ? /днище|тормоз|суппорт/ : /днище|салон/;
      for (const p of c.parts) { p.obj.getWorldPosition(wp); let vis = p.obj.visible && wp.distanceTo(cpos) > 0.55; if (keep && !keep.test(p.name)) vis = false; p.obj.visible = vis; }
      for (const w of c.wheels) w.visible = !(iso && /V8/.test(focus.t));
    }
    standB.visible = !!(focus && focus.car === 'bmw' && /V8/.test(focus.t)); standA.visible = !!(focus && focus.car === 'amg' && /V8/.test(focus.t));
    // подиумы крутятся во вступлении и в финале
    const spin = (t < T.bExp ? (t - 8) * 0.12 : 0) + (t > T.fin ? (t - T.fin) * 0.1 : 0);
    for (const [c, d] of [[bmw, turn[0]], [amg, turn[1]]]) { c.root.rotation.y = t > 8 && t < T.bExp ? spin * (c === bmw ? 1 : -1) * 0.35 : t > T.fin ? spin * (c === bmw ? 1 : -1) * 0.35 : 0; d.rotation.y = c.root.rotation.y; }
    // свет гаража
    const lampOn = t < 8 ? 0.45 : 1;
    world.hexMat.color.set('#f2f6ff').multiplyScalar(2.2 * lampOn * settings.lamps);
    world.lights.key.intensity = 520 * lampOn * settings.lamps; world.lights.top.intensity = 110 * lampOn; world.lights.rim.intensity = 300;
    // переносной рабочий свет: висит над деталью, о которой сейчас рассказ
    if (!world.work) { world.work = new THREE.SpotLight(0xfff0dc, 0, 9, 0.6, 0.6, 1.4); world.work.castShadow = false; scene.add(world.work, world.work.target); }
    const cc = CALL.find((c) => t > c.a - 1.5 && t < c.b + 0.5);
    if (cc) { const car = cc.car === 'bmw' ? bmw : amg; const tp = calloutPoint(cc, new THREE.Vector3()); world.work.position.set(tp.x + 0.8, tp.y + 2.2, tp.z + (car === bmw ? -1.2 : 1.2)); world.work.target.position.copy(tp); world.work.intensity = 55 * Math.min(1, (t - cc.a + 1.5) / 1, (cc.b + 0.5 - t) / 0.5); } else world.work.intensity = 0;
    // мотор «дышит» жаром на сравнении
    [...(v8.userData.hot || []), ...(v8b.userData.hot || [])].forEach((m) => (m.emissiveIntensity = t > T.cmp && t < T.back ? 0.35 + 0.25 * Math.max(0, Math.sin(t * 2)) : 0));
    const p = world.dustPts.geometry.attributes.position, b = world.dustBase; for (let i = 0; i < p.count; i++) { p.array[i * 3 + 1] = 0.3 + ((b[i * 3 + 1] - 0.3 + t * 0.04 * (0.5 + (i % 7) / 7)) % 3.2); } p.needsUpdate = true;
    world.rollSlats.forEach((s) => (s.visible = true));
  },
  camAt,
  jitterLights(k, N) { const d = E.disc(k, N); world.lights.key.position.set(-7 + d[0] * 0.5, 6.6, -7 + d[1] * 0.5); },
  post(t) { const flash = 0 * Math.max(0, 1 - Math.abs(t - 7.95) / 0.2) + Math.max(0, 1 - Math.abs(t - (T.back + 18.5)) / 0.3) * 0.5; return { exposure: 0.85 * settings.exposure, bloom: 0.22 * settings.bloom, bloomThreshold: 2.2, bloomRadius: 0.35, vignette: 0.22 * settings.vignette, grain: 0.035 * settings.grain, flash, fade: Math.max(0, (t - 179) / 1, 1 - Math.abs(t - 8) / 0.35) }; },
  overlay(g, t, n, w, h) {
    if (!settings.labels) return;
    const S = Math.min(w, h) / 1080;
    camera.updateMatrixWorld();
    for (const c of CALL) {
      const a = Math.min(1, (t - c.a) / 0.5, (c.b - t) / 0.4); if (a <= 0) continue;
      const car = c.car === 'bmw' ? bmw : amg; calloutPoint(c, proj).project(camera);
      if (proj.z > 1) continue;
      const x = (proj.x * 0.5 + 0.5) * w, y = (-proj.y * 0.5 + 0.5) * h;
      const bx = x + (x < w * 0.6 ? 90 : -90 - 420 * S) * S, by = y - 140 * S;
      g.globalAlpha = a; g.strokeStyle = '#ffffff'; g.lineWidth = 2.5 * S; g.beginPath(); g.moveTo(x, y); g.lineTo(bx + (x < w * 0.6 ? 0 : 420 * S), by + 50 * S); g.stroke();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 7 * S, 0, 7); g.fill();
      g.fillStyle = 'rgba(8,10,14,0.72)'; roundRect(g, bx, by, 420 * S, 100 * S, 14 * S); g.fill();
      g.fillStyle = car === bmw ? '#4d8dff' : '#ff4a66'; g.fillRect(bx, by, 7 * S, 100 * S);
      g.fillStyle = '#ffffff'; g.font = `800 ${34 * S}px Inter, Arial, sans-serif`; g.fillText(c.t, bx + 24 * S, by + 44 * S);
      g.fillStyle = '#c9d2df'; g.font = `600 ${26 * S}px Inter, Arial, sans-serif`; g.fillText(c.s, bx + 24 * S, by + 80 * S);
      g.globalAlpha = 1;
    }
    for (const bd of BOARDS) {
      const a = Math.min(1, (t - bd.a) / 0.5, (bd.b - t) / 0.4); if (a <= 0) continue;
      const bw = Math.min(w * 0.86, 980 * S), bh = 190 * S, bx = (w - bw) / 2, by = h * (vertical ? 0.14 : 0.08);
      g.globalAlpha = a; g.fillStyle = 'rgba(8,10,14,0.75)'; roundRect(g, bx, by, bw, bh, 18 * S); g.fill();
      g.fillStyle = '#ffffff'; g.font = `800 ${30 * S}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.fillText(bd.t, w / 2, by + 46 * S);
      g.font = `900 ${64 * S}px Inter, Arial, sans-serif`; g.fillStyle = '#4d8dff'; g.fillText(bd.l, bx + bw * 0.73, by + 140 * S); g.fillStyle = '#ff4a66'; g.fillText(bd.r, bx + bw * 0.27, by + 140 * S);
      g.fillStyle = '#8a93a3'; g.font = `700 ${22 * S}px Inter, Arial, sans-serif`; g.fillText('BMW M5', bx + bw * 0.73, by + 176 * S); g.fillText('CLS 63', bx + bw * 0.27, by + 176 * S);
      g.textAlign = 'left'; g.globalAlpha = 1;
    }
    drawSubs(g, t, w, h);
  },
};
let quality = 8;
const renderFrame = (n) => drawFrame(E, W3, n, quality);
const aimCamera = (n) => { const t = n / FPS; W3.update(t); const c = camAt(t); camera.position.set(...c.pos); camera.lookAt(...c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); };
const range = (name, key, max = 2) => ({ name, type: 'range', min: 0, max, step: 0.05, get: () => settings[key], set: (v) => { settings[key] = v; } });
function events() {
  const ev = [[0.3, 'riser', 0.5, 0], [2.3, 'servo', 0.7, -0.3], [7.95, 'boom', 1, 0], [T.bExp, 'riser', 0.8, -0.3], [T.aExp, 'riser', 0.8, 0.3]];
  for (const [c, st, pan] of [[bmw, T.bExp, -0.3], [amg, T.aExp, 0.3]]) {
    for (const p of c.parts) if (p.heavy > 0.12) ev.push([st + 9 * (p.exDelay + 0.05), p.heavy > 0.35 ? 'hiss' : 'bolt', 0.4 + p.heavy * 0.5, pan]);
    ev.push([st + 1.0, 'air_wrench', 0.9, pan], [st + 3.2, 'servo', 0.8, pan], [st + 5.5, 'ratchet', 0.7, pan]);
  }
  for (const c of CALL) ev.push([c.a - 0.4, 'whoosh', 0.45, 0]);
  for (const b of BOARDS) ev.push([b.a + 0.1, 'bolt', 0.5, 0]);
  ev.push([T.cmp + 2, 'servo', 0.6, -0.4], [T.cmp + 9, 'hiss', 0.6, 0.4]);
  for (const [c, st, pan] of [[bmw, T.back + 2, -0.3], [amg, T.back + 9, 0.3]]) for (const p of c.parts) if (p.heavy > 0.2) ev.push([st + 9 * (1 - p.exDelay / 0.45 * 0.45) * 0.95, 'impact_metal', 0.4 + p.heavy * 0.6, pan]);
  ev.push([T.back + 18.5, 'light_on', 0.9, 0], [T.fin, 'engine_start', 0.8, -0.3], [T.fin + 1.3, 'engine_start', 0.8, 0.3], [T.fin + 3, 'engine_rev', 0.8, 0], [178.0, 'boom', 0.6, 0]);
  return ev.sort((a, b) => a[0] - b[0]);
}
window.vizaviScene = {
  title: 'Что внутри: BMW M5 и Mercedes CLS 63', fps: FPS, frames: FRAMES, width: W, height: H, saveQuality: 24,
  canvas: E.renderer.domElement, three: THREE, scene, camera, renderFrame, setQuality: (s) => { quality = s; }, aimCamera,
  sceneKnobs: [range('Яркость кадра', 'exposure'), range('Размытие фона', 'blur'), range('Свечение бликов', 'bloom'), range('Виньетка', 'vignette'), range('Зерно', 'grain'), range('Свет гаража', 'lamps'), range('Подписи', 'labels', 1)],
  shots: SCENES.map(([name, a, b]) => ({ name, from: Math.round(a * FPS), to: Math.round(b * FPS) - 1, knobs: [] })),
  audio: window.VZ_AUDIO || [], events, E, world: W3, drawFrame: (n, N) => drawFrame(E, W3, n, N), worldRef: world,
};
window.sceneReady = true;
