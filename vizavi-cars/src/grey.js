// Серый черновик: коробки настоящих размеров, настоящие камеры и хронометраж.
import * as THREE from 'three';
import { createEngine, drawFrame } from './engine.js';
import { FPS, FRAMES, T, START_X, LANE, carX, camAt, sceneAt, raceTime } from './timeline.js';
import { FINISH } from './race.js';

const q = new URLSearchParams(location.search);
const vertical = q.get('fmt') === 'v';
const W = +(q.get('w') || (vertical ? 540 : 960)), H = +(q.get('h') || (vertical ? 960 : 540));
const E = createEngine({ width: W, height: H, fps: FPS });
document.body.appendChild(E.renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x202530); scene.fog = new THREE.Fog(0x202530, 60, 600);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 3000);
const grey = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
scene.add(new THREE.HemisphereLight(0xbfc8d8, 0x30302c, 1.2));
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-30, 50, 20); scene.add(key);
// ангар 48×32×14, ворота в торце x = 24
const hangar = new THREE.Group();
const box = (w, h, d, x, y, z, c, g = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), grey(c)); m.position.set(x, y, z); g.add(m); return m; };
box(48, 0.2, 32, 0, -0.1, 0, 0x555a60, hangar);
box(0.4, 14, 32, -24, 7, 0, 0x6a6f78, hangar); box(48, 14, 0.4, 0, 7, -16, 0x6a6f78, hangar); box(48, 14, 0.4, 0, 7, 16, 0x6a6f78, hangar);
box(48, 0.4, 32, 0, 14, 0, 0x4a4e55, hangar);
box(0.4, 4, 32, 24, 12, 0, 0x6a6f78, hangar);
const doorL = box(0.5, 10, 8.5, 24, 5, -4.25, 0x80858e, hangar), doorR = box(0.5, 10, 8.5, 24, 5, 4.25, 0x80858e, hangar);
box(0.4, 10, 7.5, 24, 5, -12.25, 0x6a6f78, hangar); box(0.4, 10, 7.5, 24, 5, 12.25, 0x6a6f78, hangar);
scene.add(hangar);
// полоса
box(1200, 0.1, 40, 24 + 600, -0.05, 0, 0x3a3d42);
for (let x = 30; x < 1200; x += 30) box(10, 0.02, 0.3, x, 0.01, 0, 0xdddddd);
box(0.6, 0.02, 12, START_X, 0.01, 0, 0xffffff); box(0.6, 0.02, 12, START_X + FINISH, 0.01, 0, 0xffeb3b);
// машины-коробки
const carBox = (L, Wd, Hh, wb, R, c) => {
  const g = new THREE.Group(); const b = box(L, Hh - R * 0.6, Wd, 0, R * 0.6 + (Hh - R * 0.6) / 2, 0, c, g);
  for (const x of [wb / 2, -wb / 2]) for (const z of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.3, 20), grey(0x111111)); w.rotation.x = Math.PI / 2; w.position.set(x, R, z * (Wd / 2 - 0.1)); g.add(w); }
  scene.add(g); return g;
};
const bmw = carBox(4.944, 2.046, 1.24, 2.901, 0.34, 0x9a9a9a), amg = carBox(4.756, 2.01, 1.261, 2.73, 0.35, 0xdcdcdc);
// столбы замеров
const bars = []; for (let i = 0; i < 8; i++) { const m = box(0.8, 1, 0.8, -4.5, 0.5, (i % 2 ? 1 : -1) * LANE + (i % 2 ? 1.5 : -1.5), i % 2 ? 0x19d2e8 : 0xe11b22); m.visible = false; bars.push(m); }

const world = {
  scene, camera,
  update(t) {
    const asmB = t < T.asmB ? 99 : (t - T.asmB - 0.5) * 0.5, asmA = t < T.asmB ? 99 : t < T.asmA ? -1 : (t - T.asmA - 0.5) * 0.5;
    bmw.visible = asmB > 0; amg.visible = asmA > 0;
    bmw.scale.y = Math.min(1, Math.max(0.05, asmB / 7)); amg.scale.y = Math.min(1, Math.max(0.05, asmA / 7));
    const a = carX('amg', t), b = carX('bmw', t);
    amg.position.set(a.x, 0, LANE); bmw.position.set(b.x, 0, -LANE);
    const g = Math.min(1, Math.max(0, (t - T.gate - 1) / 5));
    doorL.position.z = -4.25 - g * 8; doorR.position.z = 4.25 + g * 8;
    bars.forEach((m, i) => { const st = 54 + Math.floor(i / 2) * 12; const u = Math.min(1, Math.max(0, (t - st) / 2)); m.visible = t > st && t < st + 11; const h = 0.1 + u * [3, 4.5, 3.4, 2.9, 2.9, 3.5, 4.1, 2.6][i]; m.scale.y = h; m.position.y = h / 2; });
  },
  camAt: (t) => camAt(t, vertical),
  post: () => ({ exposure: 1.0, bloom: 0.0, grain: 0.0, vignette: 0.1 }),
  overlay(g, t, n, w, h) {
    g.font = `${Math.round(h * 0.035)}px sans-serif`; g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, w, h * 0.06);
    g.fillStyle = '#fff'; g.fillText(`${t.toFixed(1)} с · ${sceneAt(t)} · гонка ${raceTime(t).toFixed(2)} с`, 12, h * 0.045);
  },
};
window.vizaviScene = { E, world, drawFrame: (n, N) => drawFrame(E, world, n, N), frames: FRAMES };
window.sceneReady = true;
