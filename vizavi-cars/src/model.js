// Готовая 3D-модель (.glb/.gltf/.fbx/.obj) → «машина» в том же формате, что и машины кодом:
// приведение к реальной длине, нос по +x, колёса на земле, детали для сборки, колёса для вращения.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export async function loadModel(url) {
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  if (ext === 'fbx') return new FBXLoader().loadAsync(url);
  if (ext === 'obj') return new OBJLoader().loadAsync(url);
  const l = new GLTFLoader(); const d = new DRACOLoader(); d.setDecoderPath('./three/addons/libs/draco/'); l.setDRACOLoader(d);
  return (await l.loadAsync(url)).scene;
}
const WHEEL_RE = /wheel|tire|tyre|rim|brake_dis|disc|caliper|колес|шин|диск/i;
const STATIC_RE = /caliper|суппорт/i, HIDE_RE = /blurred/i;

/**
 * obj: загруженная сцена; o: { length, yaw (поворот, чтобы нос смотрел в +x), kind, name }
 * Возвращает объект как buildCar(): { root, body, parts, wheels, front, rear, L, R, lightMats, kind }
 */
const PART_RU = [[/tyre|tire/i, 'шины'], [/rim/i, 'диски'], [/brake_disk|disc/i, 'тормозные диски'], [/caliper/i, 'суппорты'], [/glass/i, 'стёкла'], [/carpaint|body|paint|coloured/i, 'кузов'], [/grille/i, 'решётка'], [/light|tail|blinker/i, 'фары'], [/int_|interior|seat|leather|steer/i, 'салон'], [/carbon|carb/i, 'карбон'], [/chrome/i, 'хром'], [/badge|logo/i, 'эмблемы'], [/engine/i, 'двигатель'], [/undercarriage|chassis/i, 'днище']];
const partName = (n) => { for (const [re, ru] of PART_RU) if (re.test(n || '')) return ru; return 'детали'; };
function upgradeMaterials(obj, o) {
  const seen = new Map();
  obj.traverse((m) => {
    if (!m.isMesh) return;
    if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
    const conv = (mt) => {
      if (!mt || seen.has(mt)) return seen.get(mt) || mt;
      let out = mt; const n = mt.name || '';
      const tb = o.matTable && o.matTable[n];
      if (tb) { out = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(tb.c), map: mt.map || null, metalness: tb.m ?? 0, roughness: tb.r ?? 0.5, clearcoat: tb.cc ?? 0, clearcoatRoughness: 0.08, envMapIntensity: tb.env ?? 1, name: n }); out.flatShading = false; out.side = mt.side; seen.set(mt, out); return out; }
      if (/carpaint|^paint$|_paint|body_?paint/i.test(n) && !/trim|carbon/i.test(n)) {
        out = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(o.paint || mt.color), map: o.paint ? null : mt.map, metalness: o.paintMetal ?? 0.9, roughness: o.paintRough ?? 0.3, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: o.paintEnv ?? 1.1, name: n });
        out.userData.vzPaint = true;
      } else if (/glass|skl/i.test(n)) {
        out = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0x0b1016), metalness: 0, roughness: 0.03, transparent: true, opacity: 0.55, clearcoat: 1, envMapIntensity: 1.5, name: n, depthWrite: false });
      } else if (/^tires?$|tyre/i.test(n)) { out = new THREE.MeshStandardMaterial({ color: 0x111113, map: mt.map, normalMap: mt.normalMap, roughness: 0.88, metalness: 0, name: n });
      } else if (/chrome/i.test(n)) { mt.metalness = 1; mt.roughness = Math.min(mt.roughness ?? 0.2, 0.12); }
      out.flatShading = false; out.side = mt.side; seen.set(mt, out); return out;
    };
    m.material = Array.isArray(m.material) ? m.material.map(conv) : conv(m.material);
  });
}
export function carFromModel(obj, o) {
  upgradeMaterials(obj, o);
  obj.updateMatrixWorld(true);
  const root = new THREE.Group(); root.userData.vz = o.name;
  const body = new THREE.Group(); root.add(body);
  const holder = new THREE.Group(); holder.rotation.y = o.yaw || 0; holder.add(obj); holder.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(holder);
  const size = box.getSize(new THREE.Vector3());
  const k = o.length / Math.max(size.x, 1e-6);
  holder.scale.setScalar(k); holder.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(holder); const c = box.getCenter(new THREE.Vector3());
  holder.position.set(-c.x, -box.min.y, -c.z); holder.updateMatrixWorld(true);
  // каждую сетку переносим в body с запечённой мировой матрицей, чтобы двигать детали по отдельности
  const meshes = []; holder.traverse((m) => { if (m.isMesh) meshes.push(m); });
  const parts = [], wheels = [], lightMats = { drl: [], lens: [], tail: [], exhaust: [] };
  const fin = new THREE.Box3().setFromObject(holder);
  const L = fin.max.x - fin.min.x, Hh = fin.max.y - fin.min.y;
  const wheelBits = []; // {geo (мировые координаты), material, name, static}
  meshes.forEach((m, i) => {
    const mw = m.matrixWorld.clone();
    let g = m.geometry.clone(); g.applyMatrix4(mw);
    const nm = (m.name + ' ' + (m.parent?.name || '')).toLowerCase();
    if (HIDE_RE.test(nm)) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mt) => { if (mt && /blinker/i.test(mt.name)) { mt.emissive.set(0x000000); } if (mt && mt.emissive && mt.emissive.getHex()) { mt.userData.baseEI = mt.emissiveIntensity; (/tail|rear/i.test(mt.name) ? lightMats.tail : lightMats.lens).push(mt); } });
    if (WHEEL_RE.test(nm)) { wheelBits.push({ geo: g.index ? g.toNonIndexed() : g, material: m.material, name: m.name, static: STATIC_RE.test(nm), tyre: /tyre|tire|шин/i.test(nm) }); return; }
    const bb = new THREE.Box3().setFromBufferAttribute(g.attributes.position); const cc = bb.getCenter(new THREE.Vector3()); const sz = bb.getSize(new THREE.Vector3());
    g.translate(-cc.x, -cc.y, -cc.z);
    const mesh = new THREE.Mesh(g, m.material); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.vzPart = partName(m.name) || `деталь ${i + 1}`;
    mesh.position.copy(cc); body.add(mesh);
    const vol = sz.x * sz.y * sz.z; const dir = cc.clone().setY(0); if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1); dir.normalize();
    const heavy = Math.min(1, vol / 2.0);
    parts.push({ obj: mesh, base: cc.clone(), baseR: new THREE.Euler(), name: mesh.userData.vzPart, delay: 0.6 + (1 - heavy) * 5.5 + (i % 7) * 0.05, dur: 0.6 + heavy * 0.6, from: [dir.x * 6, 4 + heavy * 3, dir.z * 6], rot: [0, 0, 0], heavy });
  });
  // колёса: делим общие сетки (шины, диски, тормоза) на четыре по четвертям
  const quads = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const cx0 = (fin.max.x + fin.min.x) / 2;
  for (const [sx, sz] of quads) {
    const pieces = [];
    for (const wb of wheelBits) {
      const pa = wb.geo.attributes.position, keep = [];
      for (let t = 0; t < pa.count; t += 3) { const x = (pa.getX(t) + pa.getX(t + 1) + pa.getX(t + 2)) / 3, z = (pa.getZ(t) + pa.getZ(t + 1) + pa.getZ(t + 2)) / 3; if (Math.sign(x - cx0) === sx && Math.sign(z) === sz) keep.push(t); }
      if (!keep.length) continue;
      const ng = new THREE.BufferGeometry();
      for (const key of Object.keys(wb.geo.attributes)) { const A = wb.geo.attributes[key], it = A.itemSize, arr = new A.array.constructor(keep.length * 3 * it); keep.forEach((t, k) => { for (let v = 0; v < 3; v++) for (let c = 0; c < it; c++) arr[(k * 3 + v) * it + c] = A.array[(t + v) * it + c]; }); ng.setAttribute(key, new THREE.BufferAttribute(arr, it, A.normalized)); }
      pieces.push({ ...wb, geo: ng });
    }
    if (!pieces.length) continue;
    const tb = new THREE.Box3(); pieces.filter((q) => q.tyre).forEach((q) => tb.union(new THREE.Box3().setFromBufferAttribute(q.geo.attributes.position)));
    if (tb.isEmpty()) pieces.forEach((q) => tb.union(new THREE.Box3().setFromBufferAttribute(q.geo.attributes.position)));
    const wc = tb.getCenter(new THREE.Vector3()), ws = tb.getSize(new THREE.Vector3());
    const w = new THREE.Group(); w.position.copy(wc); const spin = new THREE.Group(); w.add(spin);
    for (const q of pieces) { q.geo.translate(-wc.x, -wc.y, -wc.z); const mm = new THREE.Mesh(q.geo, q.material); mm.castShadow = true; mm.receiveShadow = true; mm.userData.vzPart = partName(q.name); (q.static ? w : spin).add(mm); }
    w.userData = { spin, R: ws.y / 2, dir: 1, delay: 0.15 + wheels.length * 0.22, dur: 0.8, from: [0, 3, sz * 5], final: wc.clone(), spinAxis: 'z' };
    w.userData.name = (sx > 0 ? 'переднее' : 'заднее') + ' колесо'; root.add(w); wheels.push(w);
  }
  // колёса по одной для вращения: если колесо одним мешем без явной оси — ось z
  const front = fin.max.x, rear = fin.min.x;
  return { root, body, parts, wheels, front, rear, L, H: Hh, R: wheels[0]?.userData.R || 0.34, lightMats, kind: o.kind, accent: new THREE.Color(o.kind === 'amg' ? '#19d2e8' : '#2a7bff'), fromModel: true };
}
