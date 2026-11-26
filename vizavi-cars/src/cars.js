// Две машины по паспортам сходства. Всё построено кодом: кузов — «лофт» по сечениям (суперэллипс),
// детали — отдельные меши, чтобы их можно было собирать на глазах у зрителя.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ------------------------------------------------------------------ вспомогательное
const sgn = (v) => (v < 0 ? -1 : 1);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Катмулл-Ром по неравномерным сечениям */
function sample(S, key, x) {
  let i = 0;
  while (i < S.length - 2 && x > S[i + 1].x) i++;
  const p1 = S[i], p2 = S[i + 1];
  const p0 = S[Math.max(0, i - 1)], p3 = S[Math.min(S.length - 1, i + 2)];
  const t = clamp((x - p1.x) / (p2.x - p1.x));
  const m1 = (p2[key] - p0[key]) / Math.max(1e-6, (p2.x - p0.x)) * (p2.x - p1.x);
  const m2 = (p3[key] - p1[key]) / Math.max(1e-6, (p3.x - p1.x)) * (p2.x - p1.x);
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p1[key] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[key] + (t3 - t2) * m2;
}

/** кузов по сечениям; возвращает BufferGeometry в координатах машины (x вперёд, y вверх, z вбок) */
export function loft(S, o = {}) {
  const x0 = o.x0 ?? S[0].x, x1 = o.x1 ?? S[S.length - 1].x;
  const steps = o.steps ?? 40, M = o.M ?? 40, inset = o.inset ?? 0, a0 = o.a0 ?? 0, a1 = o.a1 ?? Math.PI * 2, closed = o.closed ?? (a1 - a0 >= Math.PI * 2 - 1e-6);
  const yoff = o.yoff ?? 0, wmul = o.wmul ?? 1;
  const pos = [], idx = [], uv = [];
  const ring = (x) => {
    const yb = sample(S, 'yb', x), yt = sample(S, 'yt', x), w = sample(S, 'w', x) * wmul, n = Math.max(2, sample(S, 'n', x)), hump = S[0].hump !== undefined ? sample(S, 'hump', x) : 0;
    const ym = (yb + yt) / 2 + yoff, hh = Math.max(0.005, (yt - yb) / 2 - inset), ww = Math.max(0.005, w - inset);
    const out = [];
    for (let j = 0; j < M; j++) {
      const a = closed ? a0 + (a1 - a0) * (j / M) : a0 + (a1 - a0) * (j / (M - 1));
      const c = Math.cos(a), s = Math.sin(a);
      const zz = sgn(c) * Math.pow(Math.abs(c), 2 / n) * ww, yy = ym + sgn(s) * Math.pow(Math.abs(s), 2 / n) * hh;
      const zn = Math.abs(zz) / Math.max(ww, 1e-3), up = s > 0 ? Math.pow(Math.abs(s), 0.5) : 0;
      out.push([x, yy + hump * up * (Math.pow(zn, 3) * 1.0 - 0.35), zz]);
    }
    return out;
  };
  for (let i = 0; i <= steps; i++) {
    const x = lerp(x0, x1, i / steps);
    const r = ring(x);
    for (let j = 0; j < M; j++) { pos.push(...r[j]); uv.push(j / M, i / steps); }
  }
  const J = closed ? M : M - 1;
  for (let i = 0; i < steps; i++) for (let j = 0; j < J; j++) {
    const a = i * M + j, b = (i + 1) * M + j, c = i * M + ((j + 1) % M), d = (i + 1) * M + ((j + 1) % M);
    idx.push(a, b, c, c, b, d);
  }
  if (o.cap !== false && closed) {
    for (const [xe, flip] of [[x0, true], [x1, false]]) {
      const base = pos.length / 3; const r = ring(xe);
      let cy = 0; for (const p of r) cy += p[1]; cy /= M;
      pos.push(xe, cy, 0); uv.push(0.5, 0.5);
      for (let j = 0; j < M; j++) { pos.push(...r[j]); uv.push(0, 0); }
      for (let j = 0; j < M; j++) { const a = base + 1 + j, b = base + 1 + ((j + 1) % M); if (flip) idx.push(base, b, a); else idx.push(base, a, b); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
/** половина ширины корпуса на высоте y (для арок) */
export function halfWidthAt(S, x, y) {
  const yb = sample(S, 'yb', x), yt = sample(S, 'yt', x), w = sample(S, 'w', x), n = Math.max(2, sample(S, 'n', x));
  const ym = (yb + yt) / 2, hh = (yt - yb) / 2;
  const s = clamp((y - ym) / hh, -0.999, 0.999);
  return w * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), n)), 1 / n);
}

// ------------------------------------------------------------------ материалы
let noiseTex = null, weaveTex = null, flakeTex = null;
function texNoise() {
  if (noiseTex) return noiseTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = 150 + (hash(i * 0.37) - 0.5) * 18 + (hash(Math.floor(i / 2048) * 3.1 + (i % 256 >> 5)) - 0.5) * 22; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
  g.putImageData(d, 0, 0);
  noiseTex = new THREE.CanvasTexture(c); noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping; noiseTex.repeat.set(2, 2); noiseTex.colorSpace = THREE.NoColorSpace; return noiseTex;
}
function texWeave() {
  if (weaveTex) return weaveTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#0d0e10'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) for (let x = 0; x < 128; x += 8) {
    const dark = ((x + y) / 8) % 2 === 0;
    const gr = g.createLinearGradient(x, y, dark ? x + 8 : x, dark ? y : y + 8);
    gr.addColorStop(0, '#2b2d31'); gr.addColorStop(1, '#0a0b0c'); g.fillStyle = gr; g.fillRect(x, y, 8, 8);
  }
  weaveTex = new THREE.CanvasTexture(c); weaveTex.wrapS = weaveTex.wrapT = THREE.RepeatWrapping; weaveTex.repeat.set(10, 10); weaveTex.colorSpace = THREE.SRGBColorSpace; weaveTex.anisotropy = 4; return weaveTex;
}
export const paint = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, metalness: o.metal ?? 1, roughness: o.r ?? 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: o.env ?? 1.0, ...(o.extra || {}) });
const glass = () => new THREE.MeshPhysicalMaterial({ color: 0x060a10, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.72, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4 });
const rubber = () => new THREE.MeshStandardMaterial({ color: 0x0c0c0d, metalness: 0, roughness: 0.92, roughnessMap: texNoise() });
const carbon = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: texWeave(), metalness: 0, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.12 });
const steel = (c = 0x9a9ea5, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: r });
const black = (r = 0.6) => new THREE.MeshStandardMaterial({ color: 0x08080a, metalness: 0, roughness: r });
const emis = (c, i = 3) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(c), emissiveIntensity: i, roughness: 0.4 });

// ------------------------------------------------------------------ колесо
function makeWheel(R, W, o) {
  const g = new THREE.Group();
  const rim = o.rim * R; // радиус обода
  // шина: профиль вращения (r, y)
  const pts = [];
  const hw = W / 2;
  const prof = [[rim, -hw * 0.9], [rim + 0.02, -hw], [R - 0.05 * (R - rim), -hw * 0.96], [R - 0.012, -hw * 0.72], [R, -hw * 0.45], [R, hw * 0.45], [R - 0.012, hw * 0.72], [R - 0.05 * (R - rim), hw * 0.96], [rim + 0.02, hw], [rim, hw * 0.9]];
  for (const [r, y] of prof) pts.push(new THREE.Vector2(r, y));
  const tire = new THREE.Mesh(new THREE.LatheGeometry(pts, 72), rubber()); tire.userData.vzPart = 'шины';
  tire.castShadow = true;
  const spin = new THREE.Group(); spin.add(tire);
  // обод
  const rimMat = o.rimMat;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rim, rim, W * 0.82, 56, 1, true), rimMat); barrel.material.side = THREE.DoubleSide; barrel.userData.vzPart = 'диски';
  spin.add(barrel);
  // тарелка диска и спицы на внешней стороне (+y), потом повернём ось на z
  const faceY = hw * 0.72;
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(rim * 0.2, rim * 0.28, 0.04, 28), rimMat); dish.position.y = faceY - 0.02; dish.userData.vzPart = 'диски'; spin.add(dish);
  const nsp = o.spokes;
  for (let i = 0; i < nsp; i++) {
    const a = (i / nsp) * Math.PI * 2;
    const L = rim * 0.86;
    const sp = new THREE.Mesh(new RoundedBoxGeometry(o.spokeW, 0.028, L, 2, 0.008), rimMat);
    sp.position.set(Math.cos(a) * L * 0.5 + Math.cos(a) * rim * 0.08, faceY - 0.012, Math.sin(a) * L * 0.5 + Math.sin(a) * rim * 0.08);
    sp.rotation.y = -a + Math.PI / 2; sp.userData.vzPart = 'диски';
    spin.add(sp);
    if (o.twin) { const sp2 = sp.clone(); sp2.rotation.y += 0.1; sp2.position.x += Math.sin(a) * 0.02; sp2.position.z -= Math.cos(a) * 0.02; spin.add(sp2); }
  }
  const lip = new THREE.Mesh(new THREE.TorusGeometry(rim, 0.012, 8, 72), o.lipMat || rimMat); lip.rotation.x = Math.PI / 2; lip.position.y = hw * 0.88; spin.add(lip);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(rim * 0.16, rim * 0.16, 0.05, 24), o.hubMat || steel(0xaaaaaa, 0.3)); hub.position.y = faceY + 0.005; spin.add(hub);
  // тормозной диск (вращается) и суппорт (стоит)
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(rim * 0.84, rim * 0.84, 0.034, 56), steel(0x6a6d72, 0.45)); disc.position.y = hw * 0.28; disc.userData.vzPart = 'тормоза'; spin.add(disc);
  for (let i = 0; i < 24; i++) { // вентиляционные отверстия диска
    const a = (i / 24) * Math.PI * 2; const h = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8), black()); h.position.set(Math.cos(a) * rim * 0.62, hw * 0.28 + 0.003, Math.sin(a) * rim * 0.62); spin.add(h);
  }
  const caliper = new THREE.Mesh(new RoundedBoxGeometry(rim * 0.9, 0.09, rim * 0.34, 2, 0.015), o.caliperMat); caliper.userData.vzPart = 'суппорты';
  caliper.position.set(0, hw * 0.28, rim * 0.62); caliper.rotation.y = 0.25;
  const wheel = new THREE.Group(); wheel.add(spin); wheel.add(caliper);
  wheel.rotation.x = Math.PI / 2; // ось колеса (y) → z (внешняя сторона +z: после поворота +y→+z)
  const root = new THREE.Group(); root.add(wheel);
  root.userData.spin = spin; root.userData.R = R;
  return root;
}

// ------------------------------------------------------------------ фабрика
/**
 * spec: stations (оболочка), cabin (стёкла), L,H и т.д. Возвращает {root, body, parts, update(t), setPose...}
 * Все детали лежат в body (подрессоренная часть); колёса — в root, но под кузовом.
 */
export function buildCar(kind) {
  const xm = kind === 'xm';
  const root = new THREE.Group(); root.userData.vz = xm ? 'BMW XM Label' : 'Mercedes-AMG ONE';
  const body = new THREE.Group(); root.add(body);
  const parts = []; // {obj, delay, dur, from:[x,y,z], rot:[x,y,z], heavy, name}
  const add = (mesh, name, o = {}) => {
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.vzPart = o.vzPart || name; (o.parent || body).add(mesh);
    parts.push({ obj: mesh, base: mesh.position.clone(), baseR: mesh.rotation.clone(), name, delay: o.delay ?? 0, dur: o.dur ?? 0.9, from: o.from ?? [0, 6, 0], rot: o.rot ?? [0, 0, 0], heavy: o.heavy ?? 0.5, sound: o.sound });
    return mesh;
  };

  const S = xm ? [
    { x: -2.555, yb: 0.45, yt: 1.24, w: 0.80, n: 3, hump: 0.0 }, { x: -2.50, yb: 0.36, yt: 1.38, w: 0.93, n: 3.4, hump: 0.0 }, { x: -2.30, yb: 0.32, yt: 1.44, w: 0.98, n: 3.8, hump: 0.0 },
    { x: -1.60, yb: 0.30, yt: 1.40, w: 1.0, n: 4, hump: 0.0 }, { x: -0.60, yb: 0.30, yt: 1.36, w: 1.0, n: 4, hump: 0.0 }, { x: 0.40, yb: 0.30, yt: 1.30, w: 1.0, n: 4, hump: 0.0 },
    { x: 1.00, yb: 0.30, yt: 1.27, w: 1.0, n: 3.8, hump: 0.0 }, { x: 1.80, yb: 0.30, yt: 1.19, w: 1.0, n: 3.8, hump: 0.0 }, { x: 2.30, yb: 0.31, yt: 1.13, w: 0.98, n: 3.8, hump: 0.0 },
    { x: 2.50, yb: 0.33, yt: 1.09, w: 0.92, n: 3.6, hump: 0.0 }, { x: 2.555, yb: 0.36, yt: 1.03, w: 0.84, n: 3.4, hump: 0.0 },
  ] : [
    { x: -2.378, yb: 0.25, yt: 0.78, w: 0.50, n: 3, hump: 0.0 }, { x: -2.30, yb: 0.18, yt: 0.92, w: 0.70, n: 3, hump: 0.04 }, { x: -2.00, yb: 0.14, yt: 1.04, w: 0.90, n: 3.4, hump: 0.12 },
    { x: -1.50, yb: 0.12, yt: 1.05, w: 0.99, n: 3.8, hump: 0.14 }, { x: -0.90, yb: 0.11, yt: 0.98, w: 1.0, n: 3.8, hump: 0.1 }, { x: -0.20, yb: 0.11, yt: 0.90, w: 1.0, n: 3.8, hump: 0.02 },
    { x: 0.50, yb: 0.10, yt: 0.84, w: 1.0, n: 3.8, hump: 0.03 }, { x: 1.00, yb: 0.10, yt: 0.80, w: 1.0, n: 3.6, hump: 0.1 }, { x: 1.50, yb: 0.09, yt: 0.70, w: 0.99, n: 3.4, hump: 0.12 },
    { x: 2.00, yb: 0.09, yt: 0.55, w: 0.93, n: 3.2, hump: 0.09 }, { x: 2.30, yb: 0.10, yt: 0.42, w: 0.80, n: 3, hump: 0.04 }, { x: 2.378, yb: 0.12, yt: 0.30, w: 0.55, n: 3, hump: 0.0 },
  ];
  const C = xm ? [
    { x: -2.50, yb: 1.42, yt: 1.50, w: 0.80, n: 3 }, { x: -2.40, yb: 1.42, yt: 1.60, w: 0.88, n: 3 }, { x: -2.10, yb: 1.40, yt: 1.65, w: 0.92, n: 3.2 },
    { x: -1.60, yb: 1.38, yt: 1.72, w: 0.93, n: 3.6 }, { x: -0.50, yb: 1.34, yt: 1.755, w: 0.92, n: 3.6 }, { x: 0.10, yb: 1.32, yt: 1.72, w: 0.90, n: 3.4 },
    { x: 0.60, yb: 1.30, yt: 1.55, w: 0.88, n: 3.2 }, { x: 1.00, yb: 1.28, yt: 1.32, w: 0.86, n: 3 },
  ] : [
    { x: -1.55, yb: 0.98, yt: 1.02, w: 0.30, n: 3 }, { x: -1.10, yb: 0.96, yt: 1.14, w: 0.55, n: 3 }, { x: -0.55, yb: 0.92, yt: 1.235, w: 0.68, n: 3.2 },
    { x: 0.00, yb: 0.88, yt: 1.261, w: 0.72, n: 3.4 }, { x: 0.50, yb: 0.84, yt: 1.20, w: 0.76, n: 3.4 }, { x: 0.95, yb: 0.81, yt: 1.02, w: 0.84, n: 3.2 },
    { x: 1.30, yb: 0.78, yt: 0.86, w: 0.90, n: 3 },
  ];
  const wb = xm ? 1.5525 : 1.365, R = xm ? 0.395 : 0.345, RR = xm ? 0.395 : 0.355;
  const paintMat = xm ? paint(0x0a0a0d, { metal: 0, r: 0.32, env: 1.25 }) : paint(0xc3c8cf, { metal: 1, r: 0.28, env: 1.1 });
  const accent = xm ? new THREE.Color('#e11b22') : new THREE.Color('#19d2e8');
  const trim = xm ? black(0.45) : carbon();

  // ---- кузов по частям: щель между панелями 8 мм
  const g = 0.004;
  const cut = xm ? [-2.555, -1.95, -0.2, 0.9, 1.75, 2.555] : [-2.378, -1.7, -0.2, 0.55, 1.5, 2.378];
  const names = xm ? ['задний бампер', 'задняя часть', 'корпус', 'капот', 'передний бампер'] : ['хвост', 'задние крылья', 'корпус', 'капот', 'нос'];
  const fromV = [[-10, 3, 0], [-9, 5, 1], [0, 7, 0], [9, 4, -1], [10, 3, 0]];
  const hv = [0.4, 0.5, 1.0, 0.6, 0.45];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(loft(S, { x0: cut[i] + (i ? g : 0), x1: cut[i + 1] - (i < 4 ? g : 0), steps: 22, M: 44 }), i === 4 && !xm ? carbon() : paintMat);
    add(m, names[i], { delay: [1.9, 1.5, 0.6, 3.5, 3.1][i], dur: 1.1, from: fromV[i], heavy: hv[i], vzPart: 'кузов' });
  }
  // нижняя панель (днище/сплиттер/диффузор)
  const under = new THREE.Mesh(loft(S, { inset: 0.0, yoff: -0.04, wmul: 0.97, steps: 30, M: 24, a0: Math.PI + 0.35, a1: Math.PI * 2 - 0.35 }), black(0.7));
  under.material.side = THREE.DoubleSide;
  add(under, 'днище', { delay: 0.0, dur: 0.7, from: [0, -4, 0], heavy: 0.2, vzPart: 'днище' });
  // сплиттер и диффузор
  const front = S[S.length - 1].x, rear = S[0].x;
  const split = new THREE.Mesh(new RoundedBoxGeometry(xm ? 0.16 : 0.34, 0.022, xm ? 1.5 : 1.7, 2, 0.008), xm ? black(0.5) : carbon()); split.position.set(front - (xm ? 0.12 : 0.24), xm ? 0.35 : 0.085, 0);
  add(split, 'сплиттер', { delay: 4.0, dur: 0.6, from: [4, 0, 0], heavy: 0.1 });
  const diff = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.05, xm ? 1.5 : 1.7, 2, 0.01), xm ? black(0.5) : carbon()); diff.position.set(rear + 0.25, xm ? 0.34 : 0.17, 0); diff.rotation.z = -0.12;
  add(diff, 'диффузор', { delay: 2.4, dur: 0.6, from: [-4, 0, 0], heavy: 0.1 });
  if (!xm) for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.012), carbon()); f.position.set(rear + 0.28, 0.24, -0.62 + i * 0.205); diff.userData.f = 1; add(f, 'ребро диффузора', { delay: 2.5 + i * 0.03, dur: 0.4, from: [0, 2, 0], heavy: 0.05 }); }

  // ---- кабина: стекла, крыша, стойки
  const cab = new THREE.Mesh(loft(C, { steps: 30, M: 40 }), glass()); cab.renderOrder = 2;
  add(cab, 'стёкла', { delay: 4.8, dur: 0.9, from: [0, 7, 0], heavy: 0.3, vzPart: 'стёкла' });
  const roofX0 = xm ? -2.3 : -0.95, roofX1 = xm ? 0.1 : 0.35;
  const roofS = C.map((c) => ({ ...c, yb: c.yt - 0.055, yt: c.yt + 0.006, w: c.w - 0.075 }));
  const roof = new THREE.Mesh(loft(roofS, { x0: roofX0, x1: roofX1, steps: 22, M: 32, a0: 0.15, a1: Math.PI - 0.15 }), xm ? paintMat : carbon());
  roof.material = roof.material.clone(); roof.material.side = THREE.DoubleSide;
  add(roof, 'крыша', { delay: 4.4, dur: 0.9, from: [0, 8, 0], heavy: 0.4, vzPart: 'крыша' });
  // стойки A, B, C (тонкие, цвет кузова)
  const pill = (x0, y0, x1, y1, w, z, name, d) => {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const m = new THREE.Mesh(new RoundedBoxGeometry(L, 0.05, w, 2, 0.01), xm ? black(0.35) : paintMat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z); m.rotation.z = Math.atan2(y1 - y0, x1 - x0);
    add(m, name, { delay: d, dur: 0.5, from: [0, 3, z * 4], heavy: 0.1, vzPart: 'стойки' });
  };
  for (const z of [-1, 1]) {
    if (xm) { pill(1.0, 1.31, 0.12, 1.705, 0.045, z * 0.885, 'стойка A', 5.2); pill(-0.58, 1.34, -0.58, 1.75, 0.05, z * 0.93, 'стойка B', 5.3); pill(-2.5, 1.45, -2.1, 1.72, 0.05, z * 0.85, 'стойка C', 5.3); }
  }
  // линия окна по бокам: тонкая хромированная окантовка у XM, чёрная у AMG
  // ---- двери: накладные панели на корпусе (3 мм над поверхностью)
  const doorSlice = (x0, x1, nm, dly, zs) => {
    const m = new THREE.Mesh(loft(S, { x0, x1, steps: 14, M: 16, a0: zs > 0 ? -0.5 : Math.PI - 0.5, a1: zs > 0 ? 0.5 : Math.PI + 0.5, closed: false, inset: -0.004 }), paintMat);
    add(m, nm, { delay: dly, dur: 0.7, from: [0, 1.2, zs * 5], heavy: 0.3, vzPart: 'двери' });
  };
  const dxs = xm ? [[-1.35, -0.35], [-0.31, 0.78]] : [[-0.55, 0.2], [0.24, 0.9]];
  for (const zs of [1, -1]) for (const [a, b] of dxs) doorSlice(a, b, 'дверь', 4.0 + (zs > 0 ? 0 : 0.18) + (a > -0.5 ? 0.1 : 0), zs);

  // ---- решётка, фары, огни
  if (xm) {
    // огромная вертикальная решётка с контуром, ламели отдельно
    const sh = new THREE.Shape(); const gw = 0.42, gh = 0.40, ch = 0.12;
    sh.moveTo(-gw + ch, -gh); sh.lineTo(gw - ch, -gh); sh.lineTo(gw, -gh + ch); sh.lineTo(gw, gh - ch); sh.lineTo(gw - ch, gh); sh.lineTo(-gw + ch, gh); sh.lineTo(-gw, gh - ch); sh.lineTo(-gw, -gh + ch); sh.closePath();
    const hole = new THREE.Path(); const iw = gw - 0.045, ih = gh - 0.045, ic = ch - 0.02;
    hole.moveTo(-iw + ic, -ih); hole.lineTo(iw - ic, -ih); hole.lineTo(iw, -ih + ic); hole.lineTo(iw, ih - ic); hole.lineTo(iw - ic, ih); hole.lineTo(-iw + ic, ih); hole.lineTo(-iw, ih - ic); hole.lineTo(-iw, -ih + ic); hole.closePath(); sh.holes.push(hole);
    const frameGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 3 });
    const frame = new THREE.Mesh(frameGeo, steel(0x16161a, 0.25)); frame.rotation.y = Math.PI / 2; frame.position.set(front - 0.07, 0.68, 0);
    add(frame, 'рамка решётки', { delay: 5.9, dur: 0.6, from: [3, 0, 0], heavy: 0.1, vzPart: 'решётка' });
    // светящийся контур (Iconic Glow): красная лента внутри рамки
    const glow = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false }), emis('#ff2a2a', 0));
    glow.rotation.y = Math.PI / 2; glow.position.set(front - 0.008, 0.68, 0); glow.scale.set(1.0, 1.0, 1.0);
    add(glow, 'контур решётки', { delay: 6.0, dur: 0.4, from: [0, 0, 0], heavy: 0, vzPart: 'решётка' }); body.userData.glowMat = glow.material;
    const nsl = 13;
    for (let i = 0; i < nsl; i++) { // вертикальные ламели
      const t = i / (nsl - 1) * 2 - 1; const sl = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.74, 0.02, 2, 0.006), black(0.3));
      sl.position.set(front - 0.04, 0.68, t * (iw - 0.02)); add(sl, 'ламель решётки', { delay: 6.0 + i * 0.02, dur: 0.35, from: [2, 0, 0], heavy: 0.02, vzPart: 'решётка' });
    }
    // расщеплённые фары
    for (const z of [-1, 1]) {
      const drl = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.028, 0.5, 3, 0.01), emis('#ffffff', 0)); drl.position.set(front - 0.2, 0.98, z * 0.64); drl.rotation.y = z * -0.25; drl.rotation.z = -0.1;
      add(drl, 'ходовой огонь', { delay: 6.4, dur: 0.4, from: [2, 0, 0], heavy: 0, vzPart: 'фары' }); (body.userData.drl ||= []).push(drl.material);
      const low = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.09, 0.42, 3, 0.02), black(0.1)); low.position.set(front - 0.18, 0.84, z * 0.7); low.rotation.y = z * -0.28;
      add(low, 'блок фар', { delay: 6.3, dur: 0.4, from: [2, 0, 0], heavy: 0.02, vzPart: 'фары' });
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 20), emis('#e8f2ff', 0)); lens.rotation.z = Math.PI / 2; lens.position.set(front - 0.1, 0.84, z * 0.64); lens.rotation.y = z * -0.28;
      add(lens, 'линза фары', { delay: 6.5, dur: 0.3, from: [1, 0, 0], heavy: 0, vzPart: 'фары' }); (body.userData.lens ||= []).push(lens.material);
      // L-образные задние огни
      const tl = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.05, 0.55, 2, 0.01), emis('#ff1010', 0)); tl.position.set(rear + 0.05, 1.28, z * 0.68);
      add(tl, 'задний огонь', { delay: 3.3, dur: 0.4, from: [-2, 0, 0], heavy: 0, vzPart: 'задние огни' }); (body.userData.tail ||= []).push(tl.material);
      const tv = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.4, 0.05, 2, 0.01), emis('#ff1010', 0)); tv.position.set(rear + 0.05, 1.05, z * 0.93);
      add(tv, 'задний огонь', { delay: 3.35, dur: 0.4, from: [-2, 0, 0], heavy: 0, vzPart: 'задние огни' }); body.userData.tail.push(tv.material);
      // выхлопные трубы (шестигранные, по две с края)
      for (const dz of [0, 1]) {
        const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.22, 6), steel(0x4b4d52, 0.3)); ex.rotation.z = Math.PI / 2; ex.position.set(rear + 0.02, 0.39, z * (0.62 + dz * 0.2));
        add(ex, 'выхлоп', { delay: 2.6 + dz * 0.05, dur: 0.4, from: [-2, 0, 0], heavy: 0.05, vzPart: 'выхлоп' });
        (body.userData.exhaust ||= []).push([rear - 0.12, 0.39, z * (0.62 + dz * 0.2)]);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 6, 6), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, emissive: new THREE.Color('#ff3b12'), emissiveIntensity: 0, roughness: 0.3, metalness: 1 })); ring.rotation.y = Math.PI / 2; ring.position.set(rear - 0.1, 0.39, z * (0.62 + dz * 0.2));
        add(ring, 'горячий срез', { delay: 2.7, dur: 0.3, from: [0, 0, 0], heavy: 0, vzPart: 'выхлоп' }); (body.userData.exhaustHot ||= []).push(ring.material);
      }
    }
    // красные акценты Label: вставки на нижней кромке и зеркала
    for (const z of [-1, 1]) {
      const mir = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.13, 0.22, 3, 0.03), black(0.35)); mir.position.set(0.95, 1.35, z * 1.06); add(mir, 'зеркало', { delay: 5.6, dur: 0.4, from: [0, 1, z * 2], heavy: 0.05, vzPart: 'зеркала' });
      const mr = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.1), emis('#e11b22', 0.5)); mr.position.set(0.93, 1.27, z * 1.1); add(mr, 'акцент зеркала', { delay: 5.7, dur: 0.3, from: [0, 1, z * 2], heavy: 0, vzPart: 'зеркала' });
      const sk = new THREE.Mesh(new RoundedBoxGeometry(2.7, 0.03, 0.04, 2, 0.01), new THREE.MeshStandardMaterial({ color: 0xe11b22, roughness: 0.4, emissive: new THREE.Color('#e11b22'), emissiveIntensity: 0.25 })); sk.position.set(-0.2, 0.34, z * 0.985);
      add(sk, 'красный акцент порога', { delay: 5.5, dur: 0.4, from: [0, -1, z * 2], heavy: 0, vzPart: 'акценты' });
    }
  } else {
    // AMG ONE: узкие фары-серпы, большое крыло, шноркель, плавник, выхлоп по центру
    for (const z of [-1, 1]) {
      const hl = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.035, 0.42, 3, 0.012), emis('#ffffff', 0)); hl.position.set(1.95, 0.5, z * 0.7); hl.rotation.y = z * -0.5; hl.rotation.z = -0.28;
      add(hl, 'фара', { delay: 6.3, dur: 0.4, from: [2, 0, 0], heavy: 0, vzPart: 'фары' }); (body.userData.drl ||= []).push(hl.material);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 18), emis('#e8f2ff', 0)); lens.rotation.z = Math.PI / 2; lens.position.set(2.0, 0.46, z * 0.62); lens.rotation.y = z * -0.4;
      add(lens, 'линза фары', { delay: 6.4, dur: 0.3, from: [1, 0, 0], heavy: 0, vzPart: 'фары' }); (body.userData.lens ||= []).push(lens.material);
      const tl = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.03, 0.58, 2, 0.01), emis('#ff1010', 0)); tl.position.set(-2.33, 0.9, z * 0.34);
      add(tl, 'задний огонь', { delay: 3.3, dur: 0.4, from: [-2, 0, 0], heavy: 0, vzPart: 'задние огни' }); (body.userData.tail ||= []).push(tl.material);
      // боковые воздуховоды и зеркала-камеры
      const vent = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.12, 0.03, 2, 0.01), carbon()); vent.position.set(-0.5, 0.58, z * 0.998);
      add(vent, 'боковой воздуховод', { delay: 5.6, dur: 0.5, from: [0, 1, z * 2], heavy: 0.05, vzPart: 'воздуховоды' });
      const mir = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.07, 0.16, 3, 0.025), carbon()); mir.position.set(0.75, 0.98, z * 1.0); add(mir, 'зеркало', { delay: 5.6, dur: 0.4, from: [0, 1, z * 2], heavy: 0.05, vzPart: 'зеркала' });
      const cy = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.012, 0.02), emis('#19d2e8', 1.2)); cy.position.set(0.55, 0.43, z * 0.995);
      add(cy, 'голубая линия', { delay: 5.8, dur: 0.4, from: [0, 0, z * 2], heavy: 0, vzPart: 'акценты' });
    }
    const snorkel = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.2, 0.42, 4, 0.06), carbon()); snorkel.position.set(-0.45, 1.3, 0); snorkel.rotation.z = 0.06;
    add(snorkel, 'воздухозаборник на крыше', { delay: 5.3, dur: 0.7, from: [0, 6, 0], heavy: 0.3, vzPart: 'шноркель' });
    const mouth = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.13, 0.34, 3, 0.02), black(0.8)); mouth.position.set(-0.08, 1.31, 0); add(mouth, 'раструб', { delay: 5.4, dur: 0.3, from: [0, 3, 0], heavy: 0, vzPart: 'шноркель' });
    const fin = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.38, 0.03, 2, 0.01), paintMat); fin.position.set(-1.25, 1.14, 0); fin.rotation.z = -0.08;
    add(fin, 'плавник', { delay: 5.0, dur: 0.7, from: [-3, 5, 0], heavy: 0.2, vzPart: 'плавник' });
    // крыло: на двух стойках, большое, задняя кромка
    const wing = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.045, 2.02, 3, 0.012), carbon()); wing.position.set(-2.25, 1.2, 0); wing.rotation.z = 0.13;
    add(wing, 'заднее крыло', { delay: 6.6, dur: 0.8, from: [-4, 5, 0], heavy: 0.3, vzPart: 'крыло' });
    for (const z of [-1, 1]) { const ep = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.17, 0.02, 2, 0.008), carbon()); ep.position.set(-2.25, 1.2, z * 1.01); add(ep, 'торцевая шайба', { delay: 6.9, dur: 0.4, from: [0, 3, z * 2], heavy: 0.02, vzPart: 'крыло' });
      const st = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.3, 0.04, 2, 0.01), carbon()); st.position.set(-2.18, 1.04, z * 0.55); add(st, 'стойка крыла', { delay: 6.5, dur: 0.4, from: [0, -3, 0], heavy: 0.02, vzPart: 'крыло' }); }
    const cs = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 1.9), emis('#19d2e8', 0.9)); cs.position.set(-2.0, 1.215, 0); cs.rotation.z = 0.13; add(cs, 'голубая кромка крыла', { delay: 7.0, dur: 0.3, from: [0, 1, 0], heavy: 0, vzPart: 'крыло' });
    // центральный выхлоп, горячий
    for (const z of [-1, 1]) {
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.3, 28, 1, true), steel(0xb0b5bd, 0.22)); ex.material.side = THREE.DoubleSide; ex.rotation.z = Math.PI / 2; ex.position.set(rear + 0.12, 0.55, z * 0.2);
      add(ex, 'выхлопная труба', { delay: 2.8, dur: 0.4, from: [-2, 0, 0], heavy: 0.05, vzPart: 'выхлоп' });
      (body.userData.exhaust ||= []).push([rear - 0.05, 0.55, z * 0.2]);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 8, 32), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: new THREE.Color('#ff5a1e'), emissiveIntensity: 0, roughness: 0.35, metalness: 1 })); ring.rotation.y = Math.PI / 2; ring.position.set(rear - 0.03, 0.55, z * 0.2);
      add(ring, 'горячий срез', { delay: 2.9, dur: 0.3, from: [0, 0, 0], heavy: 0, vzPart: 'выхлоп' }); (body.userData.exhaustHot ||= []).push(ring.material);
    }
    // узкая решётка на носу
    const gr = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.06, 0.92, 2, 0.01), black(0.4)); gr.position.set(2.3, 0.2, 0); add(gr, 'воздухозаборник носа', { delay: 6.0, dur: 0.4, from: [3, 0, 0], heavy: 0, vzPart: 'нос' });
  }

  // ---- салон: руль и сиденья видны через стёкла
  const seatMat = new THREE.MeshStandardMaterial({ color: xm ? 0x1b1b1f : 0x15161a, roughness: 0.7 });
  for (const z of [-1, 1]) {
    const sx = xm ? -0.25 : -0.22, sy = xm ? 0.82 : 0.38;
    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.12, 0.5, 3, 0.05), seatMat); seat.position.set(sx, sy, z * 0.38);
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.62, 0.5, 3, 0.04), seatMat); back.position.set(sx - 0.28, sy + 0.33, z * 0.38); back.rotation.z = -0.2;
    add(seat, 'сиденье', { delay: 3.9, dur: 0.4, from: [0, 3, 0], heavy: 0.02, vzPart: 'салон' }); add(back, 'спинка сиденья', { delay: 3.95, dur: 0.4, from: [0, 3, 0], heavy: 0.02, vzPart: 'салон' });
  }
  const wheelS = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 10, 40), black(0.5)); wheelS.position.set(xm ? 0.45 : 0.5, xm ? 1.06 : 0.62, xm ? -0.38 : -0.32); wheelS.rotation.y = Math.PI / 2; wheelS.rotation.x = 0.35;
  add(wheelS, 'руль', { delay: 4.0, dur: 0.4, from: [0, 3, 0], heavy: 0, vzPart: 'салон' });
  const dash = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.14, 1.5, 3, 0.04), seatMat); dash.position.set(xm ? 0.88 : 0.95, xm ? 1.18 : 0.76, 0);
  add(dash, 'панель приборов', { delay: 3.9, dur: 0.4, from: [0, 3, 0], heavy: 0, vzPart: 'салон' });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), emis(xm ? '#e11b22' : '#19d2e8', 0.4)); screen.position.set(xm ? 0.7 : 0.8, xm ? 1.2 : 0.8, 0); screen.rotation.y = Math.PI / 2 * -1 + Math.PI; screen.rotation.y = -Math.PI / 2;
  add(screen, 'экран', { delay: 4.0, dur: 0.3, from: [0, 3, 0], heavy: 0, vzPart: 'салон' }); body.userData.screen = screen.material;

  // ---- колёса
  const wheels = [];
  const rimMat = xm ? new THREE.MeshStandardMaterial({ color: 0x111113, metalness: 1, roughness: 0.28 }) : steel(0xb7bcc4, 0.22);
  const caliperMat = new THREE.MeshStandardMaterial({ color: xm ? 0xd01820 : 0xe6b34a, metalness: 0.2, roughness: 0.35 });
  const archMat = new THREE.MeshBasicMaterial({ color: 0x020203, side: THREE.DoubleSide });
  for (const [axle, ax, Rw, Ww] of [['перед', wb, R, xm ? 0.3 : 0.29], ['зад', -wb, RR, xm ? 0.3 : 0.34]]) {
    for (const z of [-1, 1]) {
      const w = makeWheel(Rw, Ww, { rim: xm ? 0.7 : 0.72, rimMat, caliperMat, spokes: xm ? 10 : 15, spokeW: xm ? 0.045 : 0.03, twin: !xm, lipMat: xm ? new THREE.MeshStandardMaterial({ color: 0xe11b22, roughness: 0.4, metalness: 0.4 }) : steel(0x2a2d31, 0.3), hubMat: xm ? new THREE.MeshStandardMaterial({ color: 0xe11b22, metalness: 0.3, roughness: 0.4 }) : steel(0x2a2d31, 0.3) });
      const hw = sample(S, 'w', ax);
      const zc = hw - Ww * 0.5 + 0.015;
      w.position.set(ax, Rw, z * zc);
      if (z < 0) w.rotation.y = Math.PI;
      w.userData.name = `колесо ${axle}`; w.userData.dir = z;
      w.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      root.add(w); wheels.push(w);
      // имитация арки: чёрный диск и кромка кузова
      const disc = new THREE.Mesh(new THREE.CircleGeometry(Rw + 0.07, 40), archMat); disc.position.set(ax, Rw, z * (hw + 0.004)); disc.rotation.y = z > 0 ? 0 : Math.PI;
      add(disc, 'арка', { delay: 1.0, dur: 0.01, from: [0, 0, 0], heavy: 0, vzPart: 'арки' });
      const lip = new THREE.Mesh(new THREE.TorusGeometry(Rw + 0.07, 0.024, 10, 40, Math.PI), xm ? black(0.4) : paintMat); lip.position.set(ax, Rw, z * (hw + 0.008)); lip.rotation.y = 0;
      add(lip, 'кромка арки', { delay: 1.0, dur: 0.01, from: [0, 0, 0], heavy: 0, vzPart: 'арки' });
      w.userData.fromY = 0;
    }
  }
  // сборка колёс: прилёт сбоку
  const wheelDelay = [0.2, 0.3, 0.4, 0.5];
  wheels.forEach((w, i) => { w.userData.delay = 0.15 + i * 0.22; w.userData.dur = 0.8; w.userData.from = [0, 3, w.userData.dir * 5]; w.userData.final = w.position.clone(); });

  // ---- подвеска: контрольная точка силы крена/приседания
  const car = { root, body, parts, wheels, S, L: xm ? 5.11 : 4.756, W: xm ? 2.005 : 2.01, H: xm ? 1.755 : 1.261, wb, R, RR, front, rear, accent, kind, lightMats: body.userData };
  return car;
}

/** пружина с перелётом: 0→1, перелёт и затухание */
export function spring(u) {
  if (u <= 0) return 0; if (u >= 1.0) { const t = (u - 1) * 3.2; return 1 + Math.exp(-t * 4.2) * Math.sin(t * 14) * 0.04 * (t < 1.4 ? 1 : 0); }
  const e = 1 - Math.pow(1 - u, 3.0); return e;
}
export function easeOutBack(u, s = 1.4) { u = clamp(u); const c3 = s + 1; return 1 + c3 * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); }

/** сборка: t — секунды от начала сборки. Возвращает силу последнего удара для звука/искр */
export function assemble(car, t, tmpV = new THREE.Vector3()) {
  let sink = 0;
  for (const p of car.parts) {
    const u = (t - p.delay) / p.dur;
    if (u <= 0) { p.obj.visible = false; continue; }
    p.obj.visible = true;
    const k = easeOutBack(Math.min(1, u), 1.0 + p.heavy * 0.8);
    const r = 1 - (u >= 1 ? 1 : k);
    p.obj.position.set(p.base.x + p.from[0] * r, p.base.y + p.from[1] * r, p.base.z + p.from[2] * r);
    p.obj.rotation.set(p.baseR.x + p.rot[0] * r, p.baseR.y + p.rot[1] * r, p.baseR.z + p.rot[2] * r);
    // тяжёлая деталь, севшая на место, проседает кузов и качает
    if (u > 1 && p.heavy > 0.15) { const tt = (u - 1) * p.dur; sink += -p.heavy * 0.022 * Math.exp(-tt * 5.5) * Math.cos(tt * 17); }
  }
  for (const w of car.wheels) {
    const u = (t - w.userData.delay) / w.userData.dur;
    if (u <= 0) { w.visible = false; continue; }
    w.visible = true;
    const r = 1 - (u >= 1 ? 1 : easeOutBack(Math.min(1, u), 0.9));
    const f = w.userData.from;
    w.position.set(w.userData.final.x + f[0] * r, w.userData.final.y + f[1] * r, w.userData.final.z + f[2] * r);
  }
  return sink;
}
