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
const WHEEL_RE = /wheel|tire|tyre|rim|disc|brake|колес|шин|диск/i;

/**
 * obj: загруженная сцена; o: { length, yaw (поворот, чтобы нос смотрел в +x), kind, name }
 * Возвращает объект как buildCar(): { root, body, parts, wheels, front, rear, L, R, lightMats, kind }
 */
export function carFromModel(obj, o) {
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
  meshes.forEach((m, i) => {
    const mw = m.matrixWorld.clone();
    const g = m.geometry.clone(); g.applyMatrix4(mw);
    const bb = new THREE.Box3().setFromBufferAttribute(g.attributes.position); const cc = bb.getCenter(new THREE.Vector3()); const sz = bb.getSize(new THREE.Vector3());
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mt) => { if (mt && mt.emissive && mt.emissiveIntensity > 0 && mt.emissive.getHex()) (cc.x > 0 ? lightMats.lens : lightMats.tail).push(mt); });
    const nm = (m.name + ' ' + (m.parent?.name || '')).toLowerCase();
    const isWheel = WHEEL_RE.test(nm) || (cc.y < Hh * 0.4 && Math.abs(sz.x - sz.y) < 0.12 * Math.max(sz.x, sz.y) && sz.z < sz.x * 0.75 && sz.x > 0.4 && sz.x < 1.0 && Math.abs(cc.z) > 0.4);
    g.translate(-cc.x, -cc.y, -cc.z);
    const mesh = new THREE.Mesh(g, m.material); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.vzPart = m.name || `деталь ${i + 1}`;
    if (isWheel) {
      const w = new THREE.Group(); w.position.copy(cc); const spin = new THREE.Group(); spin.add(mesh); w.add(spin);
      spin.rotation.order = 'ZYX'; w.userData = { spin, R: Math.max(sz.x, sz.y) / 2, dir: 1, delay: 0.15 + wheels.length * 0.2, dur: 0.8, from: [0, 3, Math.sign(cc.z) * 5], final: cc.clone(), spinAxis: 'z' };
      root.add(w); wheels.push(w); return;
    }
    mesh.position.copy(cc); body.add(mesh);
    // направление разлёта: от центра машины наружу и вверх; тяжёлые (большие) детали прилетают первыми
    const vol = sz.x * sz.y * sz.z; const dir = cc.clone().setY(0); if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1); dir.normalize();
    const heavy = Math.min(1, vol / 2.0);
    parts.push({ obj: mesh, base: cc.clone(), baseR: new THREE.Euler(), name: mesh.userData.vzPart, delay: 0.6 + (1 - heavy) * 5.5 + (i % 7) * 0.05, dur: 0.6 + heavy * 0.6, from: [dir.x * 6, 4 + heavy * 3, dir.z * 6], rot: [0, 0, 0], heavy });
  });
  // колёса по одной для вращения: если колесо одним мешем без явной оси — ось z
  const front = fin.max.x, rear = fin.min.x;
  return { root, body, parts, wheels, front, rear, L, H: Hh, R: wheels[0]?.userData.R || 0.34, lightMats, kind: o.kind, accent: new THREE.Color(o.kind === 'amg' ? '#19d2e8' : '#2a7bff'), fromModel: true };
}
