// Мир: ночная авиабаза. Ангар (48×32×14, ворота в торце x = 24) и взлётная полоса вдоль +x.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { hash } from './cars.js';

const rnd = (i) => hash(i * 13.37 + 1.1);
function canvasTex(w, h, draw, srgb = true, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t;
}
// бетон: пятна, швы плит, потёртости; шероховатость: пятна блестящие (полировка) и матовые
function concreteMaps() {
  const col = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#7b7d80'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const x = rnd(i) * w, y = rnd(i + 9e3) * h, r = 2 + rnd(i + 3e3) * 40; g.fillStyle = `rgba(${rnd(i + 5) > 0.5 ? '40,40,44' : '160,160,160'},${0.03 + rnd(i + 7) * 0.05})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(20,20,20,${0.08 + rnd(i + 77) * 0.1})`; g.lineWidth = 1 + rnd(i) * 3; g.beginPath(); let x = rnd(i + 1) * w, y = rnd(i + 2) * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd(i * 7 + k) - 0.5) * 140; y += (rnd(i * 5 + k) - 0.5) * 140; g.lineTo(x, y); } g.stroke(); } // следы шин
    g.strokeStyle = 'rgba(25,25,28,0.55)'; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * w / 4, 0); g.lineTo(k * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, k * h / 4); g.lineTo(w, k * h / 4); g.stroke(); }
  }, true, [6, 4]);
  const rough = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const x = rnd(i + 11) * w, y = rnd(i + 22) * h, r = 6 + rnd(i + 33) * 50; g.fillStyle = `rgba(${rnd(i) > 0.4 ? '20,20,20' : '200,200,200'},${0.08 + rnd(i + 44) * 0.12})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  }, false, [6, 4]);
  return { col, rough };
}
function asphaltMaps() {
  const col = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#2c2d30'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40000; i++) { const v = 30 + rnd(i) * 60; g.fillStyle = `rgba(${v},${v},${v + 3},0.5)`; g.fillRect(rnd(i + 1e5) * w, rnd(i + 2e5) * h, 1.5, 1.5); }
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(10,10,12,${0.15 + rnd(i) * 0.2})`; g.beginPath(); g.ellipse(rnd(i + 3) * w, rnd(i + 4) * h, 20 + rnd(i + 5) * 90, 10 + rnd(i + 6) * 40, rnd(i + 7) * 3, 0, 7); g.fill(); }
  }, true, [40, 2]);
  // лужи: тёмные гладкие пятна в карте шероховатости
  const rough = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#b4b4b4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, 'rgba(10,10,10,0.95)'); gr.addColorStop(0.7, 'rgba(10,10,10,0.7)'); gr.addColorStop(1, 'rgba(10,10,10,0)'); g.save(); g.translate(rnd(i + 50) * w, rnd(i + 60) * h); g.scale(20 + rnd(i + 70) * 70, 8 + rnd(i + 80) * 26); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); }
  }, false, [10, 1]);
  return { col, rough };
}
export function glowTex() {
  return canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); }, false);
}
const GLOW = { t: null };
export function glowSprite(color, size, opacity = 1) {
  GLOW.t ||= glowTex();
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW.t, color: new THREE.Color(color), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.set(size, size, 1); return s;
}
/** конус света в дымке (луч) */
export function beam(color, len, r0, r1, opacity) {
  const g = new THREE.CylinderGeometry(r0, r1, len, 32, 1, true); g.translate(0, -len / 2, 0);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { c: { value: new THREE.Color(color) }, o: { value: opacity }, len: { value: len } },
    vertexShader: 'varying float vy; varying vec3 vN; varying vec3 vV; void main(){ vy = -position.y; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; uniform float o, len; varying float vy; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN, vV)), 1.6); float a = o * f * (1.0 - smoothstep(0.0, len, vy)) * smoothstep(0.0, 0.6, vy); gl_FragColor = vec4(c * a, a); }' });
  return new THREE.Mesh(g, m);
}

export function buildWorld(scene) {
  const W = { hangar: new THREE.Group(), strip: new THREE.Group(), anim: [], lights: {} };
  const name = (o, n) => { o.userData.vz = n; return o; };
  // ---------------- ангар
  const H = W.hangar; scene.add(H);
  const cm = concreteMaps();
  const floorMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: cm.col, roughnessMap: cm.rough, roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.25 });
  const floor = name(new THREE.Mesh(new THREE.PlaneGeometry(48, 32), floorMat), 'Бетонный пол'); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; H.add(floor);
  // разметка
  const paintY = new THREE.MeshStandardMaterial({ color: 0xd8b01e, roughness: 0.7 });
  for (const z of [-5.2, 0, 5.2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.12), paintY); m.rotation.x = -Math.PI / 2; m.position.set(-1, 0.003, z); m.receiveShadow = true; H.add(name(m, 'Разметка')); }
  for (const z of [-2.6, 2.6]) { // круглые подиумы под машинами
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.7, 0.08, 96), new THREE.MeshPhysicalMaterial({ color: 0x1b1c20, roughness: 0.25, metalness: 1, clearcoat: 0.6 })); disk.position.set(0, 0.04, z * 0 + z); disk.scale.z = 0.62; disk.receiveShadow = true; disk.castShadow = false; H.add(name(disk, 'Подиум'));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.62, 0.02, 8, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color(z < 0 ? '#3a7bff' : '#19d2e8').multiplyScalar(2.5), fog: false })); ring.rotation.x = Math.PI / 2; ring.scale.y = 0.62; ring.position.set(0, 0.085, z); H.add(name(ring, 'Подсветка подиума'));
    W.anim.push({ kind: 'ring', obj: ring, z });
  }
  // стены: гофрированный металл (ряды тонких панелей), бетонный цоколь
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a4f57, roughness: 0.55, metalness: 1 });
  const sockle = new THREE.MeshStandardMaterial({ color: 0x55575b, roughness: 0.9 });
  const ribGeo = new THREE.BoxGeometry(0.08, 12, 0.5);
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(48, 14, 0.2), wallMat); wall.position.set(0, 7, side * 16); H.add(name(wall, 'Стена ангара'));
    const base = new THREE.Mesh(new THREE.BoxGeometry(48, 1.2, 0.3), sockle); base.position.set(0, 0.6, side * 15.9); H.add(name(base, 'Цоколь'));
    for (let x = -23.5; x <= 23.5; x += 0.5) { const r = new THREE.Mesh(ribGeo, wallMat); r.position.set(x, 7.6, side * (15.85)); H.add(r); }
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.2, 14, 32), wallMat); back.position.set(-24, 7, 0); H.add(name(back, 'Задняя стена'));
  // торцевая стена с проёмом ворот (x = 24): проём 17×10
  for (const z of [-12.25, 12.25]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 14, 7.5), wallMat); p.position.set(24, 7, z); H.add(name(p, 'Стена ангара')); }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 17), wallMat); lintel.position.set(24, 12, 0); H.add(name(lintel, 'Стена ангара'));
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5b6068, roughness: 0.5, metalness: 1 });
  W.doors = [];
  for (const z of [-1, 1]) {
    const d = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.25, 10, 8.5), doorMat); leaf.position.y = 5; leaf.castShadow = true; d.add(leaf);
    for (let k = 0; k < 9; k++) { const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 8.5), doorMat); rib.position.set(-0.15, 0.6 + k * 1.1, 0); d.add(rib); }
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 8.5), new THREE.MeshStandardMaterial({ color: 0xd8b01e, roughness: 0.6 })); stripe.position.set(-0.14, 1.2, 0); d.add(stripe);
    d.position.set(24, 0, z * 4.25); H.add(name(d, 'Ворота')); W.doors.push(d);
  }
  // крыша и фермы
  const roof = new THREE.Mesh(new THREE.BoxGeometry(48, 0.3, 32), new THREE.MeshStandardMaterial({ color: 0x24272c, roughness: 0.8 })); roof.position.y = 14.2; H.add(name(roof, 'Крыша'));
  const truss = new THREE.MeshStandardMaterial({ color: 0x2f3237, roughness: 0.6, metalness: 1 });
  for (let x = -20; x <= 20; x += 5) {
    const beamM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 32), truss); beamM.position.set(x, 13, 0); H.add(name(beamM, 'Ферма'));
    const low = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 32), truss); low.position.set(x, 11.6, 0); H.add(name(low, 'Ферма'));
    for (let z = -15; z <= 15; z += 2) { const dg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.7, 0.08), truss); dg.position.set(x, 12.3, z); dg.rotation.x = (z / 2) % 2 ? 0.7 : -0.7; H.add(dg); }
  }
  // длинные лампы (светящиеся) + свечение
  W.lamps = [];
  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#d9e6ff').multiplyScalar(6), fog: false });
  for (let x = -17.5; x <= 17.5; x += 5) for (const z of [-7, 0, 7]) {
    const g = new THREE.Group(); g.position.set(x, 11.2, z);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 3.2), lampMat); g.add(lamp);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 3.4), truss); hood.position.y = 0.1; g.add(hood);
    for (const c of [-0.6, 0.6]) { const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.4), truss); cable.position.set(0, 0.75, c * 2); g.add(cable); }
    H.add(name(g, 'Лампа')); W.lamps.push({ g, lamp, on: 0, i: W.lamps.length });
  }
  // главный свет: верхний тёплый прожектор сбоку (≈45°), холодная заливка, контровой
  const key = new THREE.SpotLight(0xffd6a8, 900, 60, 0.55, 0.6, 1.6); key.position.set(-10, 13, -11); key.target.position.set(0, 0.5, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002; key.shadow.normalBias = 0.02; key.shadow.camera.near = 4; key.shadow.camera.far = 50;
  H.add(key, key.target); W.lights.key = key;
  const rim = new THREE.SpotLight(0x9fc0ff, 500, 60, 0.6, 0.7, 1.6); rim.position.set(12, 9, 10); rim.target.position.set(0, 0.6, 0); H.add(rim, rim.target); W.lights.rim = rim;
  const fill = new THREE.HemisphereLight(0x6f86b8, 0x2a2622, 0.35); scene.add(fill); W.lights.fill = fill;
  // лучи в пыли от ламп и ключевого прожектора
  W.beams = [];
  const kb = beam('#ffcf9a', 22, 0.4, 5.5, 0.08); kb.position.copy(key.position); kb.lookAt(0, 0.5, 0); kb.rotateX(Math.PI / 2); H.add(kb); W.beams.push(kb);
  // стеллажи, ящики, тележки, кабели, роботы-манипуляторы
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x2d5a9a, roughness: 0.6, metalness: 0.5 });
  const boxMat = (i) => new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.08 + rnd(i) * 0.05, 0.35, 0.25 + rnd(i + 1) * 0.15), roughness: 0.85 });
  for (let k = 0; k < 6; k++) {
    const rx = -20 + k * 6.5, rz = -14.6;
    const rack = new THREE.Group(); rack.position.set(rx, 0, rz);
    for (const px of [-1.4, 1.4]) for (const pz of [-0.5, 0.5]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4, 0.08), rackMat); post.position.set(px, 2, pz); rack.add(post); }
    for (const y of [0.4, 1.6, 2.8, 3.9]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.06, 1.05), rackMat); sh.position.y = y; rack.add(sh);
      for (let b = 0; b < 3; b++) { if (rnd(k * 31 + y * 7 + b) < 0.35) continue; const bx = new THREE.Mesh(new RoundedBoxGeometry(0.6 + rnd(b + k) * 0.3, 0.4 + rnd(b * 3 + k) * 0.4, 0.7, 2, 0.02), boxMat(k * 10 + b)); bx.position.set(-0.9 + b * 0.9, y + 0.25, 0); bx.rotation.y = (rnd(b * 5 + k) - 0.5) * 0.2; bx.castShadow = true; rack.add(bx); } }
    H.add(name(rack, 'Стеллаж'));
  }
  const cartMat = new THREE.MeshStandardMaterial({ color: 0xb8261f, roughness: 0.45, metalness: 0.3 });
  for (const [x, z, r] of [[-9, -8.5, 0.3], [7.5, 8.6, -0.4], [-12, 7.8, 0.9]]) {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = r;
    const bx = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.9, 0.6, 3, 0.04), cartMat); bx.position.y = 0.6; bx.castShadow = true; c.add(bx);
    for (let i = 0; i < 4; i++) { const dr = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.012, 0.01), steel()); dr.position.set(0, 0.35 + i * 0.2, 0.305); c.add(dr); }
    for (const [wx, wz] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })); wh.rotation.x = Math.PI / 2; wh.position.set(wx, 0.07, wz); c.add(wh); }
    H.add(name(c, 'Тележка с инструментом'));
  }
  // кабели по полу
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.5 });
  for (let k = 0; k < 5; k++) {
    const pts = []; let x = -22 + k * 3, z = 15.5 - k * 0.4; for (let i = 0; i < 9; i++) { pts.push(new THREE.Vector3(x, 0.025, z)); x += 1.6 + rnd(k * 9 + i) * 1.4; z -= 0.6 + rnd(k * 7 + i) * 1.3; }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.022, 6), cableMat); tube.receiveShadow = true; H.add(name(tube, 'Кабели'));
  }
  // роботы-манипуляторы (сборка): основание, плечо, предплечье, кисть со светом
  W.robots = [];
  const robMat = new THREE.MeshStandardMaterial({ color: 0xe0a321, roughness: 0.45, metalness: 0.2 });
  for (const [x, z, car] of [[-2.6, -7.6, 'bmw'], [2.6, -7.6, 'bmw'], [-2.6, 7.6, 'amg'], [2.6, 7.6, 'amg']]) {
    const base = new THREE.Group(); base.position.set(x, 0, z);
    const b0 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.5, metalness: 1 })); b0.position.y = 0.25; base.add(b0);
    const yaw = new THREE.Group(); yaw.position.y = 0.5; base.add(yaw);
    const t0 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.5, 32), robMat); t0.position.y = 0.25; yaw.add(t0);
    const sh = new THREE.Group(); sh.position.y = 0.55; yaw.add(sh);
    const a1 = new THREE.Mesh(new RoundedBoxGeometry(0.28, 1.6, 0.3, 3, 0.06), robMat); a1.position.y = 0.8; a1.userData.vzPart = 'плечо'; sh.add(a1);
    const el = new THREE.Group(); el.position.y = 1.6; sh.add(el);
    const a2 = new THREE.Mesh(new RoundedBoxGeometry(0.22, 1.3, 0.24, 3, 0.05), robMat); a2.position.y = 0.65; el.add(a2);
    const wr = new THREE.Group(); wr.position.y = 1.3; el.add(wr);
    const tool = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.3, 16), steel(0x9a9ea5, 0.3)); tool.position.y = 0.15; wr.add(tool);
    const tip = glowSprite('#9fd0ff', 0.0); tip.position.y = 0.32; wr.add(tip);
    base.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    H.add(name(base, 'Робот-манипулятор'));
    W.robots.push({ base, yaw, sh, el, wr, tip, car, side: Math.sign(z), x });
  }
  // пыль в воздухе ангара
  W.dust = [];
  const dustMat = new THREE.PointsMaterial({ size: 0.035, color: 0xfff1dd, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, map: (GLOW.t ||= glowTex()), fog: false });
  const dg = new THREE.BufferGeometry(); const dp = []; for (let i = 0; i < 2500; i++) dp.push((rnd(i) - 0.5) * 40, rnd(i + 1e3) * 11, (rnd(i + 2e3) - 0.5) * 28);
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); const dust = new THREE.Points(dg, dustMat); H.add(name(dust, 'Пыль в воздухе')); W.dustPts = dust; W.dustBase = dp;

  // ---------------- полоса
  const S = W.strip; scene.add(S);
  const am = asphaltMaps();
  const asphalt = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: am.col, roughnessMap: am.rough, roughness: 0.75, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.08, clearcoatRoughnessMap: am.rough });
  const runway = new THREE.Mesh(new THREE.PlaneGeometry(1400, 44, 1, 1), asphalt); runway.rotation.x = -Math.PI / 2; runway.position.set(24 + 700, 0.0, 0); runway.receiveShadow = true; S.add(name(runway, 'Мокрый асфальт'));
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), asphalt); apron.rotation.x = -Math.PI / 2; apron.position.set(30, -0.01, 0); apron.receiveShadow = true; S.add(apron);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: 0x0d120c, roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.set(600, -0.03, 0); S.add(name(grass, 'Поле'));
  const white = new THREE.MeshStandardMaterial({ color: 0xc9c9c4, roughness: 0.6, emissive: 0x111111 });
  for (let x = 40; x < 1300; x += 30) { const d = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.35), white); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.004, 0); S.add(d); }
  for (const z of [-21, 21]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(1300, 0.4), white); e.rotation.x = -Math.PI / 2; e.position.set(24 + 650, 0.004, z); S.add(e); }
  // бортовые огни (янтарь/белые) — меш + свечение
  W.edge = [];
  const lightHousing = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 1 });
  for (let x = 30; x < 1300; x += 15) for (const z of [-22.5, 22.5]) {
    const col = x > 380 && x < 560 ? '#ffb347' : '#fff2d6';
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 10), lightHousing); post.position.set(x, 0.17, z); S.add(post);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(8), fog: false })); bulb.position.set(x, 0.38, z); S.add(bulb);
    const gl = glowSprite(col, 1.4, 0.8); gl.position.set(x, 0.4, z); S.add(gl); W.edge.push(gl);
  }
  // стартовая и финишная линии, стартовый светофор
  const lineM = new THREE.MeshStandardMaterial({ color: 0xe8e8e2, roughness: 0.5 });
  const chk = canvasTex(256, 64, (g, w, h) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#eee'; g.fillRect(i * 16, j * 16, 16, 16); } }, true);
  W.lines = {};
  return W;
}
const steel = (c = 0x9a9ea5, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: r });
export { canvasTex };
