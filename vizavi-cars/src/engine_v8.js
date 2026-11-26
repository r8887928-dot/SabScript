// V8 битурбо кодом (для модели без двигателя): блок, две головки под 90°, крышки клапанов,
// впуск, выпускные коллекторы, две улитки турбин, шкивы и ремень, поддон, катушки. ~0,75×0,8×0,65 м.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildV8(o = {}) {
  const g = new THREE.Group(); g.userData.vz = o.name || 'Двигатель V8';
  const alu = new THREE.MeshStandardMaterial({ color: new THREE.Color(o.alu || '#8b8f95'), roughness: 0.5, metalness: 1 });
  const cast = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.7, metalness: 0.8 });
  const cover = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(o.cover || '#14151a'), roughness: 0.35, metalness: 0.2, clearcoat: 0.8 });
  const steelM = new THREE.MeshStandardMaterial({ color: 0xc4c8ce, roughness: 0.25, metalness: 1 });
  const hot = new THREE.MeshStandardMaterial({ color: 0x5b4a3c, roughness: 0.45, metalness: 1, emissive: new THREE.Color('#ff4a12'), emissiveIntensity: 0 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.85 });
  const red = new THREE.MeshStandardMaterial({ color: new THREE.Color(o.coil || '#c0151b'), roughness: 0.4, metalness: 0.3 });
  const add = (m, part) => { m.castShadow = true; m.receiveShadow = true; m.userData.vzPart = part; g.add(m); return m; };
  // блок
  add(new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.32, 0.42, 3, 0.03), cast), 'блок цилиндров').position.y = 0.26;
  add(new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.12, 0.36, 3, 0.03), alu), 'поддон').position.y = 0.06;
  for (let i = 0; i < 6; i++) add(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.08, 0.34), cast), 'рёбра поддона').position.set(-0.24 + i * 0.096, 0.03, 0);
  // две головки и крышки клапанов (развал 90°)
  for (const s of [-1, 1]) {
    const bank = new THREE.Group(); bank.position.set(0, 0.42, s * 0.16); bank.rotation.x = s * -0.78;
    const head = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.12, 0.2, 3, 0.025), alu); head.position.y = 0.08; bank.add(head);
    const vc = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.07, 0.17, 4, 0.03), cover); vc.position.y = 0.17; bank.add(vc);
    for (let i = 0; i < 4; i++) { const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 12), red); coil.position.set(-0.2 + i * 0.135, 0.22, 0); bank.add(coil); }
    for (let i = 0; i < 8; i++) { const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 6), steelM); bolt.position.set(-0.27 + (i % 4) * 0.18, 0.21, (i < 4 ? -1 : 1) * 0.07); bank.add(bolt); }
    bank.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.vzPart = 'головка и крышка клапанов'; } }); g.add(bank);
    // выпускной коллектор: 4 трубки к турбине (hotV — в развал сверху, иначе — сбоку)
    const tz = o.hotV ? s * 0.09 : s * 0.36, ty = o.hotV ? 0.66 : 0.32;
    for (let i = 0; i < 4; i++) {
      const pts = o.hotV ? [new THREE.Vector3(-0.21 + i * 0.14, 0.5, s * 0.1), new THREE.Vector3(-0.21 + i * 0.14, 0.6, s * 0.08), new THREE.Vector3(0.0, ty, tz)] : [new THREE.Vector3(-0.21 + i * 0.14, 0.4, s * 0.27), new THREE.Vector3(-0.21 + i * 0.14, 0.34, s * 0.34), new THREE.Vector3(0.02, ty + 0.02, tz)];
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.017, 8), hot); tube.castShadow = true; tube.userData.vzPart = 'выпускной коллектор'; g.add(tube);
    }
    // турбина: улитка + корпус компрессора
    const tg = new THREE.Group(); tg.position.set(0.05, ty, tz + s * 0.03);
    const snail = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.035, 12, 32, 5.2), hot); snail.rotation.x = Math.PI / 2; tg.add(snail);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 20), steelM); core.rotation.z = Math.PI / 2; core.position.x = 0.07; tg.add(core);
    const comp = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.03, 12, 32, 5.4), alu); comp.rotation.x = Math.PI / 2; comp.position.x = 0.13; tg.add(comp);
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.06, 20, 1, true), steelM); inlet.rotation.z = Math.PI / 2; inlet.position.x = 0.19; tg.add(inlet);
    tg.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.vzPart = 'турбина'; } }); g.add(tg);
    g.userData.hot ||= []; g.userData.hot.push(hot);
  }
  // впуск: у hotV — два коллектора снаружи рядов, иначе — один между рядами
  if (o.hotV) { for (const s of [-1, 1]) add(new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.07, 0.1, 4, 0.03), alu), 'впускной коллектор').position.set(0, 0.5, s * 0.33); }
  else add(new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.08, 0.14, 4, 0.03), alu), 'впускной коллектор').position.set(0, 0.56, 0);
  // навесное: генератор, компрессор кондиционера, масляный фильтр, проводка
  const alt = add(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.13, 24), alu), 'генератор'); alt.rotation.z = Math.PI / 2; alt.position.set(0.26, 0.42, -0.2);
  const acc = add(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.15, 24), cast), 'компрессор кондиционера'); acc.rotation.z = Math.PI / 2; acc.position.set(0.24, 0.2, 0.2);
  const filt = add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 20), red), 'масляный фильтр'); filt.position.set(-0.1, 0.13, 0.24); filt.rotation.x = 0.4;
  for (let i = 0; i < 4; i++) { const pts2 = [new THREE.Vector3(-0.25 + i * 0.15, 0.62, 0), new THREE.Vector3(-0.2 + i * 0.12, 0.66, 0.12 * (i % 2 ? 1 : -1)), new THREE.Vector3(0.3, 0.6, 0.05)]; add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 20, 0.006, 6), rubber), 'проводка'); }
  const tb = add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 24), steelM), 'дроссель'); tb.rotation.z = Math.PI / 2; tb.position.set(0.3, 0.56, 0);
  for (const s of [-1, 1]) { const pipe = add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.34, 0.56, 0), new THREE.Vector3(0.38, 0.5, s * 0.15), new THREE.Vector3(0.24, 0.34, s * 0.4)]), 20, 0.028, 10), rubber), 'патрубки'); }
  // шкивы и ремень спереди (+x)
  const fr = 0.33;
  for (const [y, z, r] of [[0.14, 0, 0.08], [0.38, -0.13, 0.05], [0.38, 0.13, 0.05], [0.26, -0.2, 0.04], [0.5, 0, 0.045]]) { const p = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 28), steelM), 'шкивы'); p.rotation.z = Math.PI / 2; p.position.set(fr, y, z); }
  const belt = add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 6, 48), rubber), 'ремень'); belt.rotation.y = Math.PI / 2; belt.scale.set(1, 1.05, 0.9); belt.position.set(fr + 0.01, 0.32, 0);
  // табличка
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x2 = c.getContext('2d'); x2.fillStyle = '#1b1c20'; x2.fillRect(0, 0, 512, 128); x2.fillStyle = '#d9dde2'; x2.font = '800 64px Inter, Arial, sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(o.plate || 'V8 BITURBO', 256, 66);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const plate = add(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.075), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.5 })), 'табличка'); plate.position.set(0, 0.605, 0); plate.rotation.x = -Math.PI / 2; plate.rotation.z = Math.PI / 2;
  const s0 = o.scale || 1; g.scale.setScalar(s0);
  return g;
}
