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

/** половина сечения (правая сторона) от низа по центру до верха по центру; st = {yb, ys, yt, w, wt, tuck} */
function halfProfile(st) {
  const { yb, ys, yt, w, wt, tuck } = st;
  return [[0, yb], [w * 0.55, yb], [w - tuck, yb + 0.006], [w - tuck * 0.25, yb + 0.05], [w, yb + 0.16 * (ys - yb)], [w, ys - 0.045], [w - 0.008, ys - 0.012], [w - 0.03, ys],
    [wt + (w - wt) * 0.45, ys + 0.3 * (yt - ys)], [wt, ys + 0.62 * (yt - ys)], [wt * 0.55, yt - 0.006], [0, yt]];
}
function resample(pts, n) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const out = []; let k = 0;
  for (let j = 0; j < n; j++) { const d = L[L.length - 1] * j / (n - 1); while (k < L.length - 2 && L[k + 1] < d) k++; const u = (d - L[k]) / Math.max(1e-6, L[k + 1] - L[k]); out.push([pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u]); }
  return out;
}
/** кузов по профильным сечениям: плоские бока, грань плеча, поджатый низ; arches — вырезы арок с нишей */
export function loftP(S, o = {}) {
  const x0 = o.x0 ?? S[0].x, x1 = o.x1 ?? S[S.length - 1].x, steps = o.steps ?? 60, half = o.half ?? 26, u0 = o.u0 ?? 0, u1 = o.u1 ?? 1;
  const closed = u0 === 0 && u1 === 1, inset = o.inset ?? 0;
  const pos = [], col = [], uv = [], idx = [];
  const keys = ['yb', 'ys', 'yt', 'w', 'wt', 'tuck'];
  let M = 0;
  for (let i = 0; i <= steps; i++) {
    const x = lerp(x0, x1, i / steps);
    const st = {}; for (const k of keys) st[k] = sample(S, k, x);
    st.w += inset; st.wt += inset; st.yt += inset; st.yb -= inset;
    const h = resample(halfProfile(st), half);
    const ring = [];
    for (let j = 0; j < half; j++) ring.push([h[j][0], h[j][1]]);
    for (let j = half - 2; j >= 1; j--) ring.push([-h[j][0], h[j][1]]);
    const R = ring.length; let J0 = Math.round(u0 * R), J1 = closed ? R : Math.round(u1 * R) + 1;
    M = J1 - J0;
    for (let jj = J0; jj < J1; jj++) {
      const [z, y] = ring[((jj % R) + R) % R]; let zz = z, c = 1;
      for (const a of o.arches || []) {
        const d = Math.hypot(x - a.x, y - a.y);
        if (d < a.r && Math.abs(z) > a.zmin) { const e = Math.min(1, (a.r - d) / 0.025); zz = Math.sign(z) * lerp(Math.abs(z), a.inner, e); c = lerp(1, 0.06, e); }
      }
      pos.push(x, y, zz); col.push(c, c, c); uv.push((jj - J0) / M, i / steps);
    }
  }
  for (let i = 0; i < steps; i++) for (let j = 0; j < (closed ? M : M - 1); j++) {
    const a = i * M + j, b = (i + 1) * M + j, c = i * M + ((j + 1) % M), d = (i + 1) * M + ((j + 1) % M);
    idx.push(a, c, b, c, d, b);
  }
  if (closed && o.cap !== false) for (const [ii, flip] of [[0, false], [steps, true]].filter(([ii]) => (ii === 0 ? o.cap0 !== false : o.cap1 !== false))) {
    const base = pos.length / 3; let cy = 0, cx = pos[ii * M * 3];
    for (let j = 0; j < M; j++) cy += pos[(ii * M + j) * 3 + 1]; cy /= M;
    pos.push(cx, cy, 0); col.push(1, 1, 1); uv.push(0.5, 0.5);
    for (let j = 0; j < M; j++) { const a = ii * M + j, b = ii * M + ((j + 1) % M); if (flip) idx.push(base, a, b); else idx.push(base, b, a); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
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
let camoTex = null, meshTex = null;
function texCamo() {
  if (camoTex) return camoTex;
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.fillStyle = '#ecebe7'; g.fillRect(0, 0, N, N); g.strokeStyle = '#0b0b0c'; g.lineCap = 'round';
  let seed = 3; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 420; k++) {
    const x = r() * N, y = r() * N, R = 14 + r() * 60, turns = 2 + r() * 3, dir = r() < 0.5 ? -1 : 1, lw = 3 + r() * 6;
    g.lineWidth = lw; g.beginPath();
    for (let a = 0; a < turns * Math.PI * 2; a += 0.12) { const rr = R * a / (turns * Math.PI * 2); const px = x + Math.cos(a * dir) * rr, py = y + Math.sin(a * dir) * rr; if (a === 0) g.moveTo(px, py); else g.lineTo(px, py); }
    g.stroke();
    for (const [ox, oy] of [[-N, 0], [N, 0], [0, -N], [0, N]]) if (x + ox > -R && x + ox < N + R && y + oy > -R && y + oy < N + R) { g.save(); g.translate(ox, oy); g.beginPath(); for (let a = 0; a < turns * Math.PI * 2; a += 0.12) { const rr = R * a / (turns * Math.PI * 2); const px = x + Math.cos(a * dir) * rr, py = y + Math.sin(a * dir) * rr; if (a === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); g.restore(); }
  }
  for (let k = 0; k < 90; k++) { g.fillStyle = '#0b0b0c'; g.beginPath(); g.ellipse(r() * N, r() * N, 4 + r() * 16, 3 + r() * 9, r() * 3, 0, 7); g.fill(); }
  camoTex = new THREE.CanvasTexture(c); camoTex.wrapS = camoTex.wrapT = THREE.RepeatWrapping; camoTex.colorSpace = THREE.SRGBColorSpace; camoTex.anisotropy = 4; return camoTex;
}
function texMesh() {
  if (meshTex) return meshTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#050506'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#2b2c30'; g.lineWidth = 3; for (let i = -128; i < 256; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke(); g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke(); }
  meshTex = new THREE.CanvasTexture(c); meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping; meshTex.repeat.set(1, 1); meshTex.colorSpace = THREE.SRGBColorSpace; return meshTex;
}
/** камуфляжная плёнка: трипланарная проекция в координатах машины */
let camoMat = null;
export function camoPaint() {
  if (camoMat) return camoMat;
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.18, envMapIntensity: 1.0, vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tCamo = { value: texCamo() }; sh.uniforms.camoScale = { value: 0.75 };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObjPos; varying vec3 vObjN;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position; vObjN = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tCamo; uniform float camoScale; varying vec3 vObjPos; varying vec3 vObjN;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n{ vec3 bw = pow(abs(normalize(vObjN)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z + 1e-4);\n vec3 cx = texture2D(tCamo, vObjPos.zy * camoScale).rgb, cy = texture2D(tCamo, vObjPos.xz * camoScale).rgb, cz = texture2D(tCamo, vObjPos.xy * camoScale).rgb;\n diffuseColor.rgb *= cx * bw.x + cy * bw.y + cz * bw.z; }');
  };
  m.userData.vzCamo = true; camoMat = m; return m;
}
export const paint = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, vertexColors: o.vc ?? false, metalness: o.metal ?? 1, roughness: o.r ?? 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: o.env ?? 1.0, ...(o.extra || {}) });
const glass = () => new THREE.MeshPhysicalMaterial({ color: 0x060a10, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.72, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4 });
const rubber = () => new THREE.MeshStandardMaterial({ color: 0x0c0c0d, metalness: 0, roughness: 0.92, roughnessMap: texNoise() });
const carbon = () => new THREE.MeshPhysicalMaterial({ color: 0x8a8a8a, map: texWeave(), metalness: 0, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.12 });
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
  const xm = kind === 'bmw' || kind === 'xm'; // BMW M6 GT3
  const root = new THREE.Group(); root.userData.vz = xm ? 'BMW M6 GT3' : 'Mercedes-AMG ONE';
  const body = new THREE.Group(); root.add(body);
  const parts = []; // {obj, delay, dur, from:[x,y,z], rot:[x,y,z], heavy, name}
  const add = (mesh, name, o = {}) => {
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.vzPart = o.vzPart || name; (o.parent || body).add(mesh);
    parts.push({ obj: mesh, base: mesh.position.clone(), baseR: mesh.rotation.clone(), name, delay: o.delay ?? 0, dur: o.dur ?? 0.9, from: o.from ?? [0, 6, 0], rot: o.rot ?? [0, 0, 0], heavy: o.heavy ?? 0.5, sound: o.sound });
    return mesh;
  };

  const S = xm ? [
    { x: -2.472, yb: 0.30, ys: 0.62, yt: 0.80, w: 0.80, wt: 0.62, tuck: 0.10 }, { x: -2.40, yb: 0.22, ys: 0.70, yt: 0.90, w: 0.92, wt: 0.75, tuck: 0.08 },
    { x: -2.15, yb: 0.14, ys: 0.76, yt: 0.96, w: 1.0, wt: 0.84, tuck: 0.06 }, { x: -1.45, yb: 0.12, ys: 0.78, yt: 0.97, w: 1.023, wt: 0.86, tuck: 0.05 },
    { x: -0.70, yb: 0.12, ys: 0.74, yt: 0.92, w: 0.94, wt: 0.83, tuck: 0.05 }, { x: 0.20, yb: 0.12, ys: 0.72, yt: 0.88, w: 0.94, wt: 0.83, tuck: 0.05 },
    { x: 0.90, yb: 0.12, ys: 0.70, yt: 0.86, w: 0.97, wt: 0.85, tuck: 0.05 }, { x: 1.45, yb: 0.12, ys: 0.68, yt: 0.82, w: 1.023, wt: 0.88, tuck: 0.05 },
    { x: 2.00, yb: 0.12, ys: 0.62, yt: 0.74, w: 0.99, wt: 0.82, tuck: 0.05 }, { x: 2.35, yb: 0.13, ys: 0.52, yt: 0.66, w: 0.92, wt: 0.72, tuck: 0.06 },
    { x: 2.472, yb: 0.17, ys: 0.44, yt: 0.58, w: 0.82, wt: 0.55, tuck: 0.08 },
  ] : [
    { x: -2.378, yb: 0.25, ys: 0.66, yt: 0.70, w: 0.52, wt: 0.40, tuck: 0.05 }, { x: -2.30, yb: 0.18, ys: 0.80, yt: 0.84, w: 0.74, wt: 0.56, tuck: 0.05 },
    { x: -2.00, yb: 0.14, ys: 0.95, yt: 0.96, w: 0.93, wt: 0.74, tuck: 0.05 }, { x: -1.36, yb: 0.12, ys: 1.0, yt: 0.98, w: 1.005, wt: 0.82, tuck: 0.05 },
    { x: -0.70, yb: 0.11, ys: 0.80, yt: 0.90, w: 0.93, wt: 0.72, tuck: 0.05 }, { x: -0.10, yb: 0.11, ys: 0.72, yt: 0.84, w: 0.91, wt: 0.72, tuck: 0.05 },
    { x: 0.60, yb: 0.10, ys: 0.78, yt: 0.74, w: 0.94, wt: 0.78, tuck: 0.05 }, { x: 1.36, yb: 0.10, ys: 0.80, yt: 0.68, w: 1.005, wt: 0.86, tuck: 0.05 },
    { x: 1.90, yb: 0.09, ys: 0.62, yt: 0.52, w: 0.96, wt: 0.78, tuck: 0.05 }, { x: 2.25, yb: 0.10, ys: 0.46, yt: 0.40, w: 0.82, wt: 0.62, tuck: 0.05 },
    { x: 2.378, yb: 0.12, ys: 0.32, yt: 0.30, w: 0.58, wt: 0.45, tuck: 0.05 },
  ];
  const C = xm ? [
    { x: -1.80, yb: 0.94, yt: 0.99, w: 0.62, n: 3 }, { x: -1.40, yb: 0.93, yt: 1.10, w: 0.70, n: 3 }, { x: -0.80, yb: 0.92, yt: 1.22, w: 0.74, n: 3.2 },
    { x: -0.20, yb: 0.90, yt: 1.24, w: 0.76, n: 3.4 }, { x: 0.30, yb: 0.89, yt: 1.19, w: 0.78, n: 3.4 }, { x: 0.70, yb: 0.88, yt: 1.04, w: 0.82, n: 3.2 },
    { x: 1.00, yb: 0.86, yt: 0.90, w: 0.84, n: 3 },
  ] : [
    { x: -1.55, yb: 0.98, yt: 1.02, w: 0.30, n: 3 }, { x: -1.10, yb: 0.96, yt: 1.14, w: 0.55, n: 3 }, { x: -0.55, yb: 0.92, yt: 1.235, w: 0.68, n: 3.2 },
    { x: 0.00, yb: 0.88, yt: 1.261, w: 0.72, n: 3.4 }, { x: 0.50, yb: 0.84, yt: 1.20, w: 0.76, n: 3.4 }, { x: 0.95, yb: 0.81, yt: 1.02, w: 0.84, n: 3.2 },
    { x: 1.30, yb: 0.78, yt: 0.86, w: 0.90, n: 3 },
  ];
  const wb = xm ? 1.4505 : 1.365, R = xm ? 0.34 : 0.345, RR = xm ? 0.345 : 0.355;
  const paintMat = xm ? camoPaint() : paint(0xc3c8cf, { metal: 1, r: 0.28, env: 1.1, vc: true });
  const accent = xm ? new THREE.Color('#2a7bff') : new THREE.Color('#19d2e8');
  const trim = xm ? black(0.45) : carbon();

  // ---- кузов по частям: щель между панелями 8 мм
  const g = 0.0015;
  const cut = xm ? [-2.472, -1.8, -0.2, 0.75, 1.75, 2.472] : [-2.378, -1.7, -0.2, 0.55, 1.5, 2.378];
  const names = xm ? ['задний бампер', 'задние крылья', 'корпус', 'капот', 'передний бампер'] : ['хвост', 'задние крылья', 'корпус', 'капот', 'нос'];
  const fromV = [[-10, 3, 0], [-9, 5, 1], [0, 7, 0], [9, 4, -1], [10, 3, 0]];
  const hv = [0.4, 0.5, 1.0, 0.6, 0.45];
  const arches = [[wb, R], [-wb, RR]].map(([ax, r]) => ({ x: ax, y: r, r: r + 0.06, zmin: 0.55, inner: 0.5 }));
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(loftP(S, { x0: cut[i] + (i ? g : 0), x1: cut[i + 1] - (i < 4 ? g : 0), steps: Math.ceil((cut[i + 1] - cut[i]) / 0.025), half: 34, arches, cap0: i === 0, cap1: i === 4 }), paintMat); m.material.side = THREE.DoubleSide;
    add(m, names[i], { delay: [1.9, 1.5, 0.6, 3.5, 3.1][i], dur: 1.1, from: fromV[i], heavy: hv[i], vzPart: 'кузов' });
  }
  // нижняя панель (днище/сплиттер/диффузор)
  const under = new THREE.Mesh(new RoundedBoxGeometry(cut[5] - cut[0] - 0.3, 0.05, 1.7, 2, 0.02), black(0.7)); under.position.set((cut[5] + cut[0]) / 2, (xm ? 0.12 : 0.1) + 0.02, 0);
  add(under, 'днище', { delay: 0.0, dur: 0.7, from: [0, -4, 0], heavy: 0.2, vzPart: 'днище' });
  // сплиттер и диффузор
  const front = S[S.length - 1].x, rear = S[0].x;
  const split = new THREE.Mesh(new RoundedBoxGeometry(xm ? 0.3 : 0.3, 0.022, xm ? 1.85 : 1.45, 2, 0.008), carbon()); split.position.set(front - (xm ? 0.2 : 0.3), xm ? 0.12 : 0.085, 0);
  add(split, 'сплиттер', { delay: 4.0, dur: 0.6, from: [4, 0, 0], heavy: 0.1 });
  const diff = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.05, xm ? 1.6 : 1.7, 2, 0.01), carbon()); diff.position.set(rear + 0.25, xm ? 0.2 : 0.17, 0); diff.rotation.z = -0.12;
  add(diff, 'диффузор', { delay: 2.4, dur: 0.6, from: [-4, 0, 0], heavy: 0.1 });
  if (!xm) for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.012), carbon()); f.position.set(rear + 0.28, 0.24, -0.62 + i * 0.205); diff.userData.f = 1; add(f, 'ребро диффузора', { delay: 2.5 + i * 0.03, dur: 0.4, from: [0, 2, 0], heavy: 0.05 }); }

  // ---- кабина: стекла, крыша, стойки
  const cab = new THREE.Mesh(loft(C, { steps: 30, M: 40 }), glass()); cab.renderOrder = 2;
  add(cab, 'стёкла', { delay: 4.8, dur: 0.9, from: [0, 7, 0], heavy: 0.3, vzPart: 'стёкла' });
  const roofX0 = xm ? -1.3 : -0.95, roofX1 = xm ? 0.35 : 0.35;
  const roofS = C.map((c) => ({ ...c, yb: c.yt - 0.055, yt: c.yt + 0.006, w: c.w - 0.075 }));
  const roof = new THREE.Mesh(loft(roofS, { x0: roofX0, x1: roofX1, steps: 22, M: 32, a0: 0.15, a1: Math.PI - 0.15 }), xm ? paint(0x0b0b0d, { metal: 0, r: 0.3 }) : carbon());
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
  }
  // линия окна по бокам: тонкая хромированная окантовка у XM, чёрная у AMG
  // ---- двери: накладные панели на корпусе (3 мм над поверхностью)
  const doorSlice = (x0, x1, nm, dly, zs) => {
    const m = new THREE.Mesh(loftP(S, { x0, x1, steps: 24, half: 34, u0: zs > 0 ? 0.07 : 0.69, u1: zs > 0 ? 0.31 : 0.93, inset: 0.003 }), paintMat);
    add(m, nm, { delay: dly, dur: 0.7, from: [0, 1.2, zs * 5], heavy: 0.3, vzPart: 'двери' });
  };
  // двери: швы-линии вместо накладных панелей
  const seamMat = black(0.6);
  for (const zs of [1, -1]) for (const xs of (xm ? [-0.78, 0.74] : [-0.62, 0.86])) {
    const yb0 = sample(S, 'yb', xs) + 0.08, ys0 = sample(S, 'ys', xs) - 0.03, wz = sample(S, 'w', xs) + 0.002;
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.006, ys0 - yb0, 0.004), seamMat); seam.position.set(xs, (yb0 + ys0) / 2, zs * wz);
    add(seam, 'шов двери', { delay: 4.2, dur: 0.3, from: [0, 0, zs * 2], heavy: 0, vzPart: 'двери' });
  }

  // ---- решётка, фары, огни
  if (xm) {
    // BMW M6 GT3: две «ноздри», хищные фары с кольцами, огромный нижний воздухозаборник с сеткой, крыло на стойках
    const meshMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texMesh(), roughness: 0.6, metalness: 0.0, transparent: false });
    for (const z of [-1, 1]) {
      // ноздря: скруглённая рамка + вертикальные ламели
      const fr = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.24, 0.4, 4, 0.06), steel(0x2a2b30, 0.18)); fr.position.set(2.43, 0.52, z * 0.235); fr.rotation.z = -0.5;
      add(fr, 'ноздря решётки', { delay: 5.9, dur: 0.6, from: [3, 0, 0], heavy: 0.05, vzPart: 'решётка' });
      for (let i = 0; i < 8; i++) { const sl = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.2, 0.018, 2, 0.005), black(0.2)); sl.position.set(2.465, 0.52, z * (0.08 + i * 0.044)); sl.rotation.z = -0.5; add(sl, 'ламель', { delay: 6.0 + i * 0.02, dur: 0.35, from: [2, 0, 0], heavy: 0, vzPart: 'решётка' }); }
      // фара: тёмный корпус-клин + два кольца-«глаза» + светодиодная бровь
      const hb = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.1, 0.36, 3, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x0a0c10, roughness: 0.05, clearcoat: 1 })); hb.position.set(2.18, 0.6, z * 0.62); hb.rotation.y = z * -0.42; hb.rotation.z = -0.34;
      add(hb, 'корпус фары', { delay: 6.2, dur: 0.4, from: [2, 0, 0], heavy: 0.02, vzPart: 'фары' });
      for (const k of [0, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.008, 8, 32), emis('#dfeaff', 0)); ring.rotation.y = Math.PI / 2 + z * -0.42; ring.position.set(2.31 - k * 0.07, 0.635, z * (0.56 + k * 0.13));
        add(ring, 'кольцо фары', { delay: 6.4, dur: 0.3, from: [1, 0, 0], heavy: 0, vzPart: 'фары' }); (body.userData.lens ||= []).push(ring.material); }
      const brow = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.01, 0.26, 2, 0.004), emis('#ffffff', 0)); brow.position.set(2.27, 0.668, z * 0.63); brow.rotation.y = z * -0.42; brow.rotation.z = -0.34;
      add(brow, 'светодиодная бровь', { delay: 6.5, dur: 0.3, from: [1, 0, 0], heavy: 0, vzPart: 'фары' }); (body.userData.drl ||= []).push(brow.material);
      // боковые воздухозаборники бампера
      const si = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.16, 0.24, 2, 0.02), meshMat); si.position.set(2.42, 0.3, z * 0.76); si.rotation.y = z * -0.35;
      add(si, 'боковая сетка', { delay: 6.0, dur: 0.4, from: [2, 0, 0], heavy: 0, vzPart: 'воздухозаборник' });
      // жабры за передним колесом
      for (let i = 0; i < 3; i++) { const g1 = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.025, 0.02, 2, 0.008), black(0.4)); g1.position.set(0.86 - i * 0.03, 0.52 + i * 0.06, z * 1.0); g1.rotation.z = 0.5;
        add(g1, 'жабры', { delay: 5.6, dur: 0.4, from: [0, 0, z * 2], heavy: 0, vzPart: 'жабры' }); }
      // зеркала на стойке, задние огни-«L», выхлоп сбоку под порогом
      const mir = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.09, 0.2, 3, 0.03), camoPaint()); mir.position.set(0.68, 0.98, z * 0.98); add(mir, 'зеркало', { delay: 5.6, dur: 0.4, from: [0, 1, z * 2], heavy: 0.05, vzPart: 'зеркала' });
      const tl = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.06, 0.42, 2, 0.015), emis('#ff1010', 0)); tl.position.set(-2.4, 0.82, z * 0.62); tl.rotation.y = z * 0.4;
      add(tl, 'задний огонь', { delay: 3.3, dur: 0.4, from: [-2, 0, 0], heavy: 0, vzPart: 'задние огни' }); (body.userData.tail ||= []).push(tl.material);
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.3, 28, 1, true), steel(0x6a5a48, 0.35)); ex.material.side = THREE.DoubleSide; ex.rotation.x = Math.PI / 2; ex.position.set(-0.4, 0.16, z * 1.0);
      add(ex, 'боковой выхлоп', { delay: 2.6, dur: 0.4, from: [0, -1, z * 2], heavy: 0.05, vzPart: 'выхлоп' }); (body.userData.exhaust ||= []).push([-0.4, 0.16, z * 1.18]);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 8, 28), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, emissive: new THREE.Color('#ff3b12'), emissiveIntensity: 0, roughness: 0.3, metalness: 1 })); ring.position.set(-0.4, 0.16, z * 1.15);
      add(ring, 'горячий срез', { delay: 2.7, dur: 0.3, from: [0, 0, 0], heavy: 0, vzPart: 'выхлоп' }); (body.userData.exhaustHot ||= []).push(ring.material);
      // стойки крыла («лебединая шея»)
      const st = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.36, 0.025, 2, 0.01), carbon()); st.position.set(-2.1, 1.0, z * 0.42); st.rotation.z = -0.35;
      add(st, 'стойка крыла', { delay: 6.5, dur: 0.4, from: [0, -3, 0], heavy: 0.02, vzPart: 'крыло' });
      const ep = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.2, 0.02, 2, 0.008), carbon()); ep.position.set(-2.3, 1.15, z * 0.97); add(ep, 'торцевая шайба', { delay: 6.9, dur: 0.4, from: [0, 3, z * 2], heavy: 0.02, vzPart: 'крыло' });
    }
    // нижний воздухозаборник: большая трапеция с сеткой и вертикальной перегородкой
    const ish = new THREE.Shape(); ish.moveTo(-0.66, -0.1); ish.lineTo(0.66, -0.1); ish.lineTo(0.56, 0.13); ish.lineTo(-0.56, 0.13); ish.closePath();
    const intake = new THREE.Mesh(new THREE.ShapeGeometry(ish), meshMat); intake.rotation.y = Math.PI / 2; intake.position.set(2.475, 0.28, 0);
    add(intake, 'нижний воздухозаборник', { delay: 6.0, dur: 0.5, from: [2, 0, 0], heavy: 0.02, vzPart: 'воздухозаборник' });
    const div = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.015), black(0.3)); div.position.set(2.48, 0.29, 0); add(div, 'перегородка', { delay: 6.1, dur: 0.3, from: [1, 0, 0], heavy: 0, vzPart: 'воздухозаборник' });
    // вентиляция капота
    for (const z of [-1, 1]) { const hv = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.03, 0.2, 2, 0.012), black(0.5)); hv.position.set(1.6, 0.795, z * 0.34); hv.rotation.z = -0.12; add(hv, 'вентиляция капота', { delay: 3.7, dur: 0.4, from: [0, 2, 0], heavy: 0, vzPart: 'капот' }); }
    // крыло
    const wing = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.035, 1.92, 3, 0.012), carbon()); wing.position.set(-2.3, 1.18, 0); wing.rotation.z = 0.12;
    add(wing, 'заднее крыло', { delay: 6.6, dur: 0.8, from: [-4, 5, 0], heavy: 0.3, vzPart: 'крыло' });
    // солнцезащитная полоса на стекле (без надписей)
    const band = new THREE.Mesh(loft(C, { x0: 0.38, x1: 0.62, steps: 6, M: 20, a0: 0.4, a1: Math.PI - 0.4, closed: false, inset: -0.004 }), black(0.3)); add(band, 'полоса на стекле', { delay: 5.1, dur: 0.3, from: [0, 2, 0], heavy: 0, vzPart: 'стёкла' });
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
      const vent = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.1, 0.02, 2, 0.008), carbon()); vent.position.set(-0.45, 0.5, z * (sample(S, 'w', -0.45) + 0.004));
      add(vent, 'боковой воздуховод', { delay: 5.6, dur: 0.5, from: [0, 1, z * 2], heavy: 0.05, vzPart: 'воздуховоды' });
      const mir = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.07, 0.16, 3, 0.025), carbon()); mir.position.set(0.75, 0.98, z * 1.0); add(mir, 'зеркало', { delay: 5.6, dur: 0.4, from: [0, 1, z * 2], heavy: 0.05, vzPart: 'зеркала' });
      const cy = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.012, 0.02), emis('#19d2e8', 1.2)); cy.position.set(0.55, 0.3, z * (sample(S, 'w', 0.55) + 0.006));
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
    const sx = xm ? -0.35 : -0.22, sy = xm ? 0.36 : 0.38;
    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.12, 0.5, 3, 0.05), seatMat); seat.position.set(sx, sy, z * 0.38);
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.62, 0.5, 3, 0.04), seatMat); back.position.set(sx - 0.28, sy + 0.33, z * 0.38); back.rotation.z = -0.2;
    add(seat, 'сиденье', { delay: 3.9, dur: 0.4, from: [0, 3, 0], heavy: 0.02, vzPart: 'салон' }); add(back, 'спинка сиденья', { delay: 3.95, dur: 0.4, from: [0, 3, 0], heavy: 0.02, vzPart: 'салон' });
  }
  const wheelS = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 10, 40), black(0.5)); wheelS.position.set(xm ? 0.35 : 0.5, xm ? 0.7 : 0.62, xm ? -0.38 : -0.32); wheelS.rotation.y = Math.PI / 2; wheelS.rotation.x = 0.35;
  add(wheelS, 'руль', { delay: 4.0, dur: 0.4, from: [0, 3, 0], heavy: 0, vzPart: 'салон' });
  const dash = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.14, 1.5, 3, 0.04), seatMat); dash.position.set(xm ? 0.75 : 0.95, xm ? 0.8 : 0.76, 0);
  add(dash, 'панель приборов', { delay: 3.9, dur: 0.4, from: [0, 3, 0], heavy: 0, vzPart: 'салон' });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), emis(xm ? '#e11b22' : '#19d2e8', 0.4)); screen.position.set(xm ? 0.6 : 0.8, xm ? 0.84 : 0.8, 0); screen.rotation.y = Math.PI / 2 * -1 + Math.PI; screen.rotation.y = -Math.PI / 2;
  add(screen, 'экран', { delay: 4.0, dur: 0.3, from: [0, 3, 0], heavy: 0, vzPart: 'салон' }); body.userData.screen = screen.material;

  // ---- колёса
  const wheels = [];
  const rimMat = xm ? new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 1, roughness: 0.4 }) : steel(0xb7bcc4, 0.22);
  const caliperMat = new THREE.MeshStandardMaterial({ color: xm ? 0xd01820 : 0xe6b34a, metalness: 0.2, roughness: 0.35 });
  const archMat = new THREE.MeshBasicMaterial({ color: 0x020203, side: THREE.DoubleSide });
  for (const [axle, ax, Rw, Ww] of [['перед', wb, R, xm ? 0.31 : 0.29], ['зад', -wb, RR, xm ? 0.33 : 0.34]]) {
    for (const z of [-1, 1]) {
      const w = makeWheel(Rw, Ww, { rim: xm ? 0.68 : 0.72, rimMat, caliperMat, spokes: xm ? 6 : 15, spokeW: xm ? 0.06 : 0.03, twin: !xm, lipMat: xm ? black(0.4) : steel(0x2a2d31, 0.3), hubMat: xm ? steel(0xc9a24a, 0.3) : steel(0x2a2d31, 0.3) });
      const hw = sample(S, 'w', ax);
      const zc = hw - Ww * 0.5 - 0.012;
      w.position.set(ax, Rw, z * zc);
      if (z < 0) w.rotation.y = Math.PI;
      w.userData.name = `колесо ${axle}`; w.userData.dir = z;
      w.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      root.add(w); wheels.push(w);
      w.userData.fromY = 0;
    }
  }
  // сборка колёс: прилёт сбоку
  const wheelDelay = [0.2, 0.3, 0.4, 0.5];
  wheels.forEach((w, i) => { w.userData.delay = 0.15 + i * 0.22; w.userData.dur = 0.8; w.userData.from = [0, 3, w.userData.dir * 5]; w.userData.final = w.position.clone(); });

  // ---- подвеска: контрольная точка силы крена/приседания
  const car = { root, body, parts, wheels, S, L: xm ? 4.944 : 4.756, W: xm ? 2.046 : 2.01, H: xm ? 1.24 : 1.261, wb, R, RR, front, rear, accent, kind, lightMats: body.userData };
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
