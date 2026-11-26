// Детальный гараж-мастерская 30×20×7 м (x −15…15, z −10…10), подъёмные ворота в торце x = 15.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { hash } from './cars.js';

const rnd = (i) => hash(i * 7.31 + 0.7);
const std = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
function ctex(w, h, draw, rep = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t;
}
const shadowAll = (o) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
const nm = (o, n) => { o.userData.vz = n; return o; };

export function buildGarage(scene, W) {
  const G = new THREE.Group(); scene.add(G); W.hangar = G;
  const X0 = -15, X1 = 15, Z0 = -10, Z1 = 10, HT = 7;
  // ---------------- пол: наливной глянцевый, плитка 60 см, следы шин, лёгкая грязь у стен
  const floorCol = ctex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#2a2c30'; g.fillRect(0, 0, w, h);
    const n = 16, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = (i + j) % 2 ? 40 : 34; const d = (rnd(i * 31 + j) - 0.5) * 6; g.fillStyle = `rgb(${v + d},${v + d + 1},${v + d + 4})`; g.fillRect(i * s + 1, j * s + 1, s - 2, s - 2); }
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
    for (let k = 0; k < 18; k++) { g.strokeStyle = `rgba(8,8,8,${0.06 + rnd(k) * 0.08})`; g.lineWidth = 10 + rnd(k + 3) * 14; g.beginPath(); let x = rnd(k + 5) * w, y = rnd(k + 9) * h; g.moveTo(x, y); for (let q = 0; q < 5; q++) { x += (rnd(k * 3 + q) - 0.5) * 300; y += (rnd(k * 7 + q) - 0.5) * 300; g.lineTo(x, y); } g.stroke(); }
  }, [3, 2]);
  const floorRough = ctex(512, 512, (g, w, h) => { g.fillStyle = '#3a3a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? '200,200,200' : '10,10,10'},${0.05 + rnd(i + 1) * 0.1})`; g.beginPath(); g.arc(rnd(i + 2) * w, rnd(i + 3) * h, 5 + rnd(i + 4) * 40, 0, 7); g.fill(); } }, [3, 2], false);
  const floor = nm(new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: floorCol, roughnessMap: floorRough, roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.05, envMapIntensity: 0.6 })), 'Наливной пол');
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; G.add(floor);
  // ---------------- стены: тёмно-серая покраска, нижняя панель, белая полоса, окна под потолком
  const wallTex = ctex(512, 512, (g, w, h) => { g.fillStyle = '#5a6068'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,255,255,${rnd(i) * 0.025})`; g.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 2, 2); } for (let y = 0; y < h; y += 64) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y, w, 2); } for (let x = 0; x < w; x += 128) for (let y = 0; y < h; y += 64) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + ((y / 64) % 2) * 64, y, 2, 64); } }, [6, 2]);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85 });
  const wain = std(0x1d1f23, 0.5, 0.3), stripe = new THREE.MeshStandardMaterial({ color: 0xd9dde2, roughness: 0.5 });
  const wall = (w, h, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat); m.position.set(x, h / 2, z); m.rotation.y = ry; m.receiveShadow = true; G.add(nm(m, 'Стена гаража')); };
  wall(X1 - X0, HT, 0, Z0, 0); wall(X1 - X0, HT, 0, Z1, Math.PI); wall(Z1 - Z0, HT, X0, 0, Math.PI / 2);
  for (const [len, x, z, ry] of [[X1 - X0, 0, Z0 + 0.03, 0], [X1 - X0, 0, Z1 - 0.03, Math.PI], [Z1 - Z0, X0 + 0.03, 0, Math.PI / 2]]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(len, 1.1, 0.04), wain); p.position.set(x, 0.55, z); p.rotation.y = ry; G.add(nm(p, 'Нижняя панель'));
    const s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.05), stripe); s.position.set(x, 1.15, z); s.rotation.y = ry; G.add(s);
  }
  // торец с воротами: простенки и перемычка; проём 8×4,6 по центру
  for (const z of [-7, 7]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, HT, 6), wallMat); m.position.set(X1, HT / 2, z); G.add(nm(m, 'Стена гаража')); }
  const lin = new THREE.Mesh(new THREE.BoxGeometry(0.3, HT - 4.6, 8), wallMat); lin.position.set(X1, 4.6 + (HT - 4.6) / 2, 0); G.add(nm(lin, 'Стена гаража'));
  // подъёмные ворота: 12 ламелей, поднимаются по одной
  W.rollSlats = [];
  const slatMat = new THREE.MeshStandardMaterial({ color: 0x6d737b, roughness: 0.55, metalness: 1 });
  for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 8), slatMat); s.position.set(X1 - 0.05, 0.19 + i * 0.383, 0); s.castShadow = true; G.add(nm(s, 'Подъёмные ворота')); W.rollSlats.push(s); }
  const winMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0f18, roughness: 0.05, metalness: 0, clearcoat: 1, emissive: new THREE.Color('#1a2a55'), emissiveIntensity: 0.6 });
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 1.2), winMat); w.position.set(X1 - 0.1, 2.6, -2.4 + i * 1.6); G.add(nm(w, 'Окна ворот')); }
  // ---------------- потолок: тёмный, шестиугольная светодиодная решётка над машинами
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), std(0x15171a, 0.9)); ceil.rotation.x = Math.PI / 2; ceil.position.y = HT; G.add(nm(ceil, 'Потолок'));
  const hexMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#f2f6ff').multiplyScalar(4), fog: false }); W.hexMat = hexMat;
  const R = 1.15, edges = new Map();
  for (let q = -7; q <= 7; q++) for (let r = -5; r <= 5; r++) {
    const cx = R * 1.5 * q, cz = R * Math.sqrt(3) * (r + q / 2);
    if (Math.abs(cx) > 11.5 || Math.abs(cz) > 7.2) continue;
    for (let k = 0; k < 6; k++) {
      const a0 = (Math.PI / 3) * k, a1 = a0 + Math.PI / 3;
      const p0 = [cx + R * Math.cos(a0), cz + R * Math.sin(a0)], p1 = [cx + R * Math.cos(a1), cz + R * Math.sin(a1)];
      const key = [((p0[0] + p1[0]) / 2).toFixed(2), ((p0[1] + p1[1]) / 2).toFixed(2)].join(',');
      if (!edges.has(key)) edges.set(key, [p0, p1]);
    }
  }
  const hexI = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.05, 0.075), hexMat, edges.size);
  const dm = new THREE.Object3D(); let ii = 0;
  for (const [p0, p1] of edges.values()) { dm.position.set((p0[0] + p1[0]) / 2, HT - 0.35, (p0[1] + p1[1]) / 2); dm.rotation.set(0, -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 0); dm.scale.set(R * 0.93, 1, 1); dm.updateMatrix(); hexI.setMatrixAt(ii++, dm.matrix); }
  G.add(nm(hexI, 'Шестиугольная подсветка'));
  const hexFrame = new THREE.Mesh(new THREE.BoxGeometry(24, 0.02, 15.5), std(0x0d0e10, 0.8)); hexFrame.position.y = HT - 0.31; G.add(hexFrame);
  // ---------------- свет: главный — тёплый прожектор сверху-сбоку; заливка холодная; контровой
  const key = new THREE.SpotLight(0xffe2c0, 520, 40, 0.75, 0.6, 1.5); key.position.set(-7, 6.6, -7); key.target.position.set(0, 0.5, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002; key.shadow.normalBias = 0.02; key.shadow.camera.near = 2; key.shadow.camera.far = 30;
  G.add(key, key.target); W.lights.key = key;
  const top = new THREE.RectAreaLight ? null : null;
  const fillTop = new THREE.SpotLight(0xdfe8ff, 260, 30, 1.2, 1.0, 1.4); fillTop.position.set(0, 6.6, 0); fillTop.target.position.set(0, 0, 0); G.add(fillTop, fillTop.target); W.lights.top = fillTop;
  const rim = new THREE.SpotLight(0x8fb4ff, 300, 40, 0.7, 0.8, 1.5); rim.position.set(9, 4.5, 7); rim.target.position.set(0, 0.7, 0); G.add(rim, rim.target); W.lights.rim = rim;
  const fill = new THREE.HemisphereLight(0x6f86b8, 0x241f1c, 0.4); scene.add(fill); W.lights.fill = fill;
  // ---------------- стена инструментов (задняя, x = −15): перфопанель + силуэты + инструменты
  const peg = ctex(512, 256, (g, w, h) => { g.fillStyle = '#c8ccd2'; g.fillRect(0, 0, w, h); g.fillStyle = '#5b6068'; for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); } }, [3, 1]);
  const pegMat = new THREE.MeshStandardMaterial({ map: peg, roughness: 0.6, metalness: 0.4 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 9), pegMat); board.position.set(X0 + 0.06, 2.6, -1.5); G.add(nm(board, 'Перфопанель'));
  const toolMats = [std(0xb8bec6, 0.3, 1), std(0xd02a24, 0.45), std(0x1a1a1c, 0.5), std(0xe0a521, 0.45)];
  let ti = 0;
  for (let row = 0; row < 3; row++) for (let k = 0; k < 16; k++) {
    const z = -5.6 + k * 0.53, y = 3.35 - row * 0.62, kind = (row * 16 + k) % 4, tg = new THREE.Group(); tg.position.set(X0 + 0.11, y, z);
    if (kind === 0) { // гаечный ключ
      const L = 0.22 + rnd(ti) * 0.18; const sh = new THREE.Mesh(new RoundedBoxGeometry(0.012, L, 0.028, 2, 0.005), toolMats[0]); tg.add(sh);
      const h1 = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 6, 16), toolMats[0]); h1.rotation.y = Math.PI / 2; h1.position.y = L / 2; tg.add(h1);
      const h2 = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.008, 6, 16, 4.2), toolMats[0]); h2.rotation.y = Math.PI / 2; h2.position.y = -L / 2; tg.add(h2);
    } else if (kind === 1) { // отвёртка
      const hnd = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.11, 10), toolMats[1 + (k % 2) * 2]); hnd.position.y = 0.07; tg.add(hnd);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6), toolMats[0]); sh.position.y = -0.06; tg.add(sh);
    } else if (kind === 2) { // молоток / киянка
      const hnd = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), toolMats[2]); tg.add(hnd);
      const hd = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.05, 0.12, 2, 0.008), toolMats[0]); hd.position.y = 0.15; tg.add(hd);
    } else { // пассатижи
      for (const s of [-1, 1]) { const a = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.2, 0.02, 2, 0.005), toolMats[3]); a.position.set(0, -0.04, s * 0.012); a.rotation.x = s * 0.12; tg.add(a); }
      const j = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.07, 0.03, 2, 0.006), toolMats[0]); j.position.y = 0.09; tg.add(j);
    }
    tg.rotation.x = (rnd(ti + 5) - 0.5) * 0.08; ti++; G.add(nm(tg, 'Инструменты'));
  }
  // ---------------- красные инструментальные шкафы с ящиками (вдоль задней стены)
  const red = new THREE.MeshPhysicalMaterial({ color: 0xb4161b, roughness: 0.32, metalness: 0.3, clearcoat: 0.6 });
  const chrome = std(0xd4d8dd, 0.15, 1), rubber = std(0x0b0b0c, 0.9);
  const chest = (x, z, ry, w, h) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry;
    const b = new THREE.Mesh(new RoundedBoxGeometry(0.75, h, w, 3, 0.02), red); b.position.y = 0.12 + h / 2; c.add(b);
    const nd = Math.round(h / 0.13);
    for (let i = 0; i < nd; i++) { const dy = 0.12 + 0.05 + i * (h - 0.1) / nd; const gap = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.006, w - 0.06), std(0x2a0507, 0.8)); gap.position.set(0.377, dy, 0); c.add(gap);
      const hd = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.022, w * 0.7, 2, 0.008), chrome); hd.position.set(0.39, dy + 0.045, 0); c.add(hd); }
    const top2 = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.04, w + 0.03, 2, 0.01), rubber); top2.position.y = 0.14 + h; c.add(top2);
    for (const [px, pz] of [[-0.3, -w / 2 + 0.08], [0.3, -w / 2 + 0.08], [-0.3, w / 2 - 0.08], [0.3, w / 2 - 0.08]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 16), rubber); wh.rotation.x = Math.PI / 2; wh.position.set(px, 0.055, pz); c.add(wh); }
    // мелочь сверху: ключи-трещотки, банка, тряпка
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16), std(0x2e6bd1, 0.4, 0.3)); can.position.set(0.1, 0.24 + h, w * 0.3); c.add(can);
    const rag = new THREE.Mesh(new RoundedBoxGeometry(0.25, 0.03, 0.2, 2, 0.01), std(0xd9c9a3, 1)); rag.position.set(-0.15, 0.18 + h, -w * 0.2); rag.rotation.y = 0.4; c.add(rag);
    shadowAll(c); G.add(nm(c, 'Инструментальный шкаф'));
  };
  chest(X0 + 0.45, -4.2, 0, 2.0, 1.05); chest(X0 + 0.45, -1.8, 0, 2.0, 1.05); chest(X0 + 0.45, 1.4, 0, 1.4, 1.5);
  // ---------------- стопки шин
  const tireGeo = new THREE.TorusGeometry(0.31, 0.12, 14, 40); tireGeo.rotateX(Math.PI / 2); tireGeo.scale(1, 1.3, 1);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x101011, roughness: 0.85 });
  for (const [x, z, n] of [[X0 + 1.0, 6.8, 5], [X0 + 1.9, 7.7, 4], [X0 + 0.9, 8.6, 6], [11.5, -8.8, 5], [12.5, -8.9, 3], [11.9, -7.9, 4]]) for (let i = 0; i < n; i++) { const t = new THREE.Mesh(tireGeo, tireMat); t.position.set(x + (rnd(x + i) - 0.5) * 0.05, 0.16 + i * 0.31, z + (rnd(z + i) - 0.5) * 0.05); t.rotation.y = rnd(i) * 3; t.castShadow = t.receiveShadow = true; G.add(nm(t, 'Стопка шин')); }
  // ---------------- двухстоечный подъёмник (у правой стены)
  const liftMat = std(0x1d4fa8, 0.45, 0.4);
  const lift = new THREE.Group(); lift.position.set(-6, 0, 8.4);
  for (const x of [-1.6, 1.6]) { const col = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.2, 0.35), liftMat); col.position.set(x, 2.1, 0); lift.add(col); const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.7), std(0x222428, 0.6, 1)); base.position.set(x, 0.02, 0); lift.add(base);
    for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 1.3), std(0x2a2d31, 0.5, 1)); arm.position.set(x - Math.sign(x) * 0.3, 0.42, s * 0.6 - 0.6); arm.rotation.y = s * 0.35 * Math.sign(x); lift.add(arm); } }
  const beamTop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 0.25), liftMat); beamTop.position.y = 4.25; lift.add(beamTop);
  const warn = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.5, 0.36), new THREE.MeshStandardMaterial({ color: 0xd8b01e, roughness: 0.6 })); warn.position.set(1.6, 1.0, 0); lift.add(warn);
  shadowAll(lift); G.add(nm(lift, 'Подъёмник'));
  // ---------------- верстак с тисками и лампой
  const bench = new THREE.Group(); bench.position.set(3.5, 0, Z0 + 0.5);
  const topW = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.06, 0.8), std(0x6b4a2b, 0.7)); topW.position.y = 0.92; bench.add(topW);
  for (const x of [-1.4, 1.4]) for (const z of [-0.35, 0.35]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), std(0x2a2d31, 0.5, 1)); lg.position.set(x, 0.45, z); bench.add(lg); }
  const shelfB = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.03, 0.7), std(0x2a2d31, 0.6, 1)); shelfB.position.y = 0.25; bench.add(shelfB);
  const vise = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.16, 0.18, 2, 0.02), std(0x2f5a3a, 0.5, 0.5)); vise.position.set(-1.1, 1.03, 0.25); bench.add(vise);
  const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6), chrome); lampArm.position.set(1.1, 1.25, -0.2); lampArm.rotation.z = 0.5; bench.add(lampArm);
  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 20, 1, true), std(0x111111, 0.4)); lampHead.position.set(0.95, 1.5, -0.2); lampHead.rotation.z = 2.2; bench.add(lampHead);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(6) })); bulb.position.set(0.92, 1.46, -0.2); bench.add(bulb);
  const bl = new THREE.PointLight(0xffc98a, 6, 4, 2); bl.position.set(0.9, 1.4, -0.1); bench.add(bl);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new RoundedBoxGeometry(0.1 + rnd(i) * 0.15, 0.04 + rnd(i + 1) * 0.08, 0.08 + rnd(i + 2) * 0.12, 2, 0.01), [chrome, std(0x333333, 0.5, 1), red][i % 3]); p.position.set(-0.6 + i * 0.3, 0.97 + 0.03, (rnd(i + 3) - 0.5) * 0.4); p.rotation.y = rnd(i + 4) * 3; bench.add(p); }
  shadowAll(bench); G.add(nm(bench, 'Верстак'));
  // ---------------- бочки, компрессор, огнетушитель, шланг на катушке
  const drumMats = [std(0x1b4c8a, 0.45, 0.4), std(0xb01d1d, 0.45, 0.4), std(0x202224, 0.5, 0.4)];
  for (const [x, z, k] of [[10.2, 8.8, 0], [11.0, 8.9, 1], [10.6, 8.1, 2], [-12.5, -8.8, 1]]) { const d = new THREE.Group(); d.position.set(x, 0, z); const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.88, 32), drumMats[k]); cyl.position.y = 0.44; d.add(cyl); for (const y of [0.2, 0.68]) { const rib = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.012, 6, 32), drumMats[k]); rib.rotation.x = Math.PI / 2; rib.position.y = y; d.add(rib); } shadowAll(d); G.add(nm(d, 'Бочка масла')); }
  const comp = new THREE.Group(); comp.position.set(8.0, 0, Z0 + 0.6);
  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 8, 24), std(0xc81f1f, 0.35, 0.3)); tank.rotation.z = Math.PI / 2; tank.position.y = 0.4; comp.add(tank);
  const motor = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.3, 0.3, 2, 0.03), std(0x222428, 0.5, 0.6)); motor.position.set(-0.2, 0.8, 0); comp.add(motor);
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333 })); gauge.rotation.x = Math.PI / 2; gauge.position.set(0.3, 0.8, 0.16); comp.add(gauge);
  shadowAll(comp); G.add(nm(comp, 'Компрессор'));
  const ext = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.4, 6, 16), std(0xd0201a, 0.35)); ext.position.set(X1 - 0.3, 1.0, -5.0); G.add(nm(ext, 'Огнетушитель'));
  const reel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 10, 32), std(0xe0a521, 0.5)); reel.position.set(X0 + 0.15, 4.2, 5.5); reel.rotation.y = Math.PI / 2; G.add(nm(reel, 'Катушка шланга'));
  // ---------------- стеллажи с запчастями (левая стена)
  const rackMat = std(0x2b2e33, 0.55, 0.8);
  for (let k = 0; k < 3; k++) {
    const r = new THREE.Group(); r.position.set(-9 + k * 4.2, 0, Z0 + 0.5);
    for (const px of [-1.3, 1.3]) for (const pz of [-0.35, 0.35]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.8, 0.06), rackMat); p.position.set(px, 1.4, pz); r.add(p); }
    for (const y of [0.3, 1.1, 1.9, 2.7]) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.04, 0.76), rackMat); s.position.y = y; r.add(s);
      for (let b = 0; b < 4; b++) { if (rnd(k * 40 + y * 9 + b) < 0.25) continue; const kind = Math.floor(rnd(k * 13 + b + y) * 3);
        let m;
        if (kind === 0) m = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.35, 0.5, 2, 0.02), std(new THREE.Color().setHSL(0.07, 0.4, 0.3 + rnd(b + k) * 0.15), 0.85));
        else if (kind === 1) { m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 28), std(0x6a6d72, 0.4, 1)); m.rotation.z = Math.PI / 2; m.position.y = 0.17; } // тормозной диск
        else m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.28, 16), std([0x1b4c8a, 0xc8a02a, 0x2a2a2a][b % 3], 0.4, 0.3)); // канистра
        m.position.x = -1.0 + b * 0.65; m.position.y += y + 0.2; r.add(m); } }
    shadowAll(r); G.add(nm(r, 'Стеллаж с запчастями'));
  }
  // ---------------- неоновая вывеска и номер бокса
  const neon = ctex(1024, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.font = '900 150px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ff3355'; g.shadowBlur = 30; g.fillStyle = '#ff5c7a'; g.fillText('GARAGE 05', w / 2, h / 2); g.shadowBlur = 0; g.fillStyle = '#ffe5ea'; g.fillText('GARAGE 05', w / 2, h / 2); }, [1, 1]);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: neon, transparent: true, color: new THREE.Color(3, 3, 3), depthWrite: false, fog: false })); sign.position.set(X0 + 0.08, 5.0, -1.5); sign.rotation.y = Math.PI / 2; G.add(nm(sign, 'Неоновая вывеска'));
  const nl = new THREE.PointLight(0xff3355, 18, 7, 2); nl.position.set(X0 + 0.8, 5.0, -1.5); G.add(nl);
  const boxNo = ctex(512, 512, (g, w, h) => { g.fillStyle = '#e9e9e9'; g.font = '900 360px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('05', w / 2, h / 2 + 10); }, [1, 1]);
  const bn = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshStandardMaterial({ map: boxNo, transparent: true, roughness: 0.8 })); bn.position.set(0, 4.4, Z0 + 0.04); G.add(nm(bn, 'Номер бокса'));
  // вентиляционный короб и вытяжка
  const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 28, 24, 1, true), std(0x9aa0a8, 0.35, 1)); duct.rotation.z = Math.PI / 2; duct.position.set(0, HT - 0.6, -8.6); G.add(nm(duct, 'Вентиляция'));
  for (let x = -12; x <= 12; x += 3) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.02, 6, 24), std(0x6a6d72, 0.4, 1)); ring.rotation.y = Math.PI / 2; ring.position.set(x, HT - 0.6, -8.6); G.add(ring); }
  // кабели по полу
  const cableMat = std(0x0d0d0e, 0.5);
  for (let k = 0; k < 4; k++) { const pts = []; let x = X0 + 0.5, z = -6 + k * 1.1; for (let i = 0; i < 7; i++) { pts.push(new THREE.Vector3(x, 0.02, z)); x += 1.2 + rnd(k * 9 + i); z += (rnd(k * 5 + i) - 0.5) * 1.2; } const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.018, 6), cableMat); tube.receiveShadow = true; G.add(nm(tube, 'Кабели')); }
  // пыль в воздухе в лучах
  const dustMat = new THREE.PointsMaterial({ size: 0.012, color: 0xfff1dd, transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const dg = new THREE.BufferGeometry(); const dp = []; for (let i = 0; i < 700; i++) dp.push((rnd(i) - 0.5) * 18, 0.3 + rnd(i + 1e3) * 3.2, (rnd(i + 2e3) - 0.5) * 12);
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); const dust = new THREE.Points(dg, dustMat); G.add(nm(dust, 'Пыль в воздухе')); W.dustPts = dust; W.dustBase = dp;
  // ---------------- верх стен: окна под потолком, настенные светильники, светодиодная лента, фермы, постеры
  const winHi = new THREE.MeshStandardMaterial({ color: 0x0a1020, emissive: new THREE.Color('#2a4a8a'), emissiveIntensity: 1.2, roughness: 0.1 });
  const frameM = std(0x1c1f24, 0.5, 1);
  for (const [z, ry] of [[Z0 + 0.06, 0], [Z1 - 0.06, Math.PI]]) for (let x = -12; x <= 12; x += 4) {
    const wn = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.9), winHi); wn.position.set(x, 5.7, z); wn.rotation.y = ry; G.add(nm(wn, 'Окна под потолком'));
    for (let k = 1; k < 4; k++) { const mul = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.04), frameM); mul.position.set(x - 1.5 + k * 0.75, 5.7, z); G.add(mul); }
    const lampBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.18), frameM); lampBox.position.set(x + 2, 4.3, z + (ry ? -0.1 : 0.1)); G.add(nm(lampBox, 'Настенный светильник'));
    const lampFace = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.03, 0.14), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe2b8').multiplyScalar(5) })); lampFace.position.set(x + 2, 4.23, z + (ry ? -0.1 : 0.1)); G.add(lampFace);
  }
  for (const z of [Z0 + 0.1, Z1 - 0.1]) { const strip = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 1, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: new THREE.Color('#9fc4ff').multiplyScalar(3) })); strip.position.set(0, 1.22, z); G.add(nm(strip, 'Светодиодная лента')); }
  for (const z of [Z0 + 0.5, Z1 - 0.5]) { const wl = new THREE.PointLight(0xffd9b0, 16, 9, 2); wl.position.set(0, 4.0, z); G.add(wl); }
  for (let x = -13; x <= 13; x += 6.5) { const tr = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, Z1 - Z0), std(0x2b2e33, 0.6, 1)); tr.position.set(x, HT - 0.25, 0); G.add(nm(tr, 'Ферма потолка')); }
  const poster = (txt, sub, col, x, z, ry) => { const t = ctex(512, 720, (gg, w, h) => { gg.fillStyle = col; gg.fillRect(0, 0, w, h); gg.fillStyle = 'rgba(0,0,0,0.35)'; gg.fillRect(0, h * 0.62, w, h * 0.38); gg.fillStyle = '#fff'; gg.font = '900 120px Inter, Arial, sans-serif'; gg.textAlign = 'center'; gg.fillText(txt, w / 2, h * 0.45); gg.font = '700 44px Inter, Arial, sans-serif'; gg.fillText(sub, w / 2, h * 0.8); gg.strokeStyle = '#fff'; gg.lineWidth = 10; gg.strokeRect(20, 20, w - 40, h - 40); });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.7), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 })); p.position.set(x, 2.9, z); p.rotation.y = ry; G.add(nm(p, 'Постер')); };
  poster('V8', 'BITURBO POWER', '#8a1c22', -6, Z1 - 0.05, Math.PI); poster('400 M', 'DRAG NIGHT', '#1d3f8a', -3.6, Z1 - 0.05, Math.PI); poster('PIT', 'SERVICE ZONE', '#2a2d33', 9, Z0 + 0.05, 0);
  // правая стена: второй щит с инструментом и стеллаж с колёсами
  const board2 = new THREE.Mesh(new THREE.BoxGeometry(5, 1.8, 0.05), pegMat); board2.position.set(4, 2.6, Z1 - 0.06); G.add(nm(board2, 'Перфопанель'));
  for (let k = 0; k < 14; k++) { const tool = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.3 + rnd(k + 90) * 0.2, 0.05, 2, 0.01), toolMats[k % 4]); tool.position.set(1.8 + k * 0.32, 2.7 + (rnd(k + 91) - 0.5) * 0.5, Z1 - 0.11); G.add(tool); }
  const wheelRack = new THREE.Group(); wheelRack.position.set(10.5, 0, Z1 - 0.6);
  for (let k = 0; k < 4; k++) { const wr = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.12, 14, 36), tireMat); wr.position.set(-1.2 + k * 0.8, 1.0, 0); wr.castShadow = true; wheelRack.add(wr); const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 24), std(0xb8bec6, 0.25, 1)); rim.rotation.x = Math.PI / 2; rim.position.set(-1.2 + k * 0.8, 1.0, 0); wheelRack.add(rim); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 0.06), rackMat); bar.position.y = 0.62; wheelRack.add(bar); G.add(nm(wheelRack, 'Стеллаж с колёсами'));
  W.lamps = [{ lamp: { material: hexMat, visible: true }, i: 0 }];
  W.robots = []; W.doors = null;
  return G;
}
