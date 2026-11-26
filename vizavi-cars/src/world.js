// Мир: ночная авиабаза. Ангар (48×32×14, ворота в торце x = 24) и взлётная полоса вдоль +x.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { hash } from './cars.js';
import { buildGarage } from './garage.js';

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
    for (let i = 0; i < 220; i++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, 'rgba(10,10,10,0.95)'); gr.addColorStop(0.7, 'rgba(10,10,10,0.7)'); gr.addColorStop(1, 'rgba(10,10,10,0)'); g.save(); g.translate(rnd(i + 50) * w, rnd(i + 60) * h); g.scale(6 + rnd(i + 70) * 22, 3 + rnd(i + 80) * 9); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); }
  }, false, [30, 2]);
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
  buildGarage(scene, W);

  // ---------------- полоса
  const S = W.strip; scene.add(S);
  const am = asphaltMaps();
  const asphalt = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: am.col, roughnessMap: am.rough, roughness: 0.75, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.08, clearcoatRoughnessMap: am.rough });
  const runway = new THREE.Mesh(new THREE.PlaneGeometry(1400, 44, 1, 1), asphalt); runway.rotation.x = -Math.PI / 2; runway.position.set(15 + 700, 0.0, 0); runway.receiveShadow = true; S.add(name(runway, 'Мокрый асфальт'));
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), asphalt); apron.rotation.x = -Math.PI / 2; apron.position.set(44, -0.01, 0); apron.receiveShadow = true; S.add(apron);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: 0x050805, roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.set(600, -0.03, 0); S.add(name(grass, 'Поле'));
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
  // линии старта и финиша (шахматка)
  for (const [x, nmL] of [[60, 'Линия старта'], [460, 'Линия финиша']]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 20), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.5 })); l.rotation.x = -Math.PI / 2; l.rotation.z = Math.PI / 2; l.position.set(x, 0.006, 0); l.receiveShadow = true; S.add(l); l.userData.vz = nmL; }
  // финишная арка со светом
  const arch = new THREE.Group(); arch.position.set(460, 0, 0);
  for (const z of [-12, 12]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 0.5), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 1 })); p.position.set(0, 3.5, z); arch.add(p); }
  const beamA = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 24.5), new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.5, metalness: 1 })); beamA.position.y = 7; arch.add(beamA);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(5), fog: false })); strip.position.y = 6.55; arch.add(strip);
  S.add(arch); arch.userData.vz = 'Финишная арка';
  // прожекторные мачты каждые 60 м по обе стороны; свет «прилипает» к ближайшим мачтам у машин
  W.towers = [];
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.6, metalness: 1 });
  for (let x = 40; x < 1300; x += 60) { const side = (Math.round(x / 60) % 2) ? 1 : -1, z = side * 27;
    const t = new THREE.Group(); t.position.set(x, 0, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 16, 12), towerMat); pole.position.y = 8; t.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.3), towerMat); head.position.set(0, 16.2, -side * 0.3); t.add(head);
    for (let i = 0; i < 4; i++) { const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff1d6').multiplyScalar(8), fog: false, side: THREE.DoubleSide })); lamp.position.set(-0.55 + i * 0.37, 16.2, -side * 0.47); t.add(lamp); }
    const gl = glowSprite('#ffe3b0', 6, 0.5); gl.position.set(0, 16.2, -side * 0.6); t.add(gl);
    S.add(t); t.userData.vz = 'Прожекторная мачта'; W.towers.push({ x, z }); }
  W.flood = [0, 1, 2].map(() => { const l = new THREE.SpotLight(0xffe7c4, 0, 120, 0.55, 0.7, 1.2); l.castShadow = false; S.add(l, l.target); return l; });
  const moon = new THREE.DirectionalLight(0x9fb4ff, 0.0); moon.position.set(200, 120, -300); moon.target.position.set(300, 0, 0); S.add(moon, moon.target); W.lights.moon = moon;
  // небо: градиент, звёзды, рассвет через uniform
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { dawn: { value: 0 } },
    vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float dawn; varying vec3 p; void main(){ vec3 d = normalize(p); float h = max(d.y, 0.0);
      vec3 nightTop = vec3(0.004,0.008,0.025), nightHor = vec3(0.03,0.05,0.11), dawnTop = vec3(0.08,0.14,0.32), dawnHor = vec3(1.1,0.55,0.32);
      float east = smoothstep(-0.2, 1.0, d.x);
      vec3 top = mix(nightTop, dawnTop, dawn), hor = mix(nightHor, mix(nightHor, dawnHor, east), dawn);
      vec3 c = mix(hor, top, pow(h, 0.45)); c += vec3(1.6,0.8,0.4) * dawn * pow(max(0.0, 1.0 - abs(d.y) * 6.0), 3.0) * pow(east, 3.0);
      gl_FragColor = vec4(c, 1.0); }` });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), skyMat); sky.userData.vz = 'Небо'; scene.add(sky); W.sky = sky; W.skyMat = skyMat;
  const sg = new THREE.BufferGeometry(); const sp = []; for (let i = 0; i < 2500; i++) { const u = rnd(i + 7e3) * 2 - 1, th = rnd(i + 8e3) * 6.283, yy = Math.abs(u) * 0.9 + 0.08; const r = Math.sqrt(1 - yy * yy); sp.push(Math.cos(th) * r * 1700, yy * 1700, Math.sin(th) * r * 1700); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0xcfd8ff, transparent: true, opacity: 0.85, fog: false, depthWrite: false })); stars.userData.vz = 'Звёзды'; scene.add(stars); W.stars = stars;
  // огни города на горизонте и диспетчерская вышка
  for (let i = 0; i < 260; i++) { const x = 300 + rnd(i) * 1300, z = (rnd(i + 1) > 0.5 ? 1 : -1) * (300 + rnd(i + 2) * 500); const g2 = glowSprite(rnd(i + 3) > 0.3 ? '#ffb46a' : '#cfe0ff', 3 + rnd(i + 4) * 5, 0.7); g2.position.set(x, 2 + rnd(i + 5) * 8, z); S.add(g2); }
  const tw = new THREE.Group(); tw.position.set(260, 0, -90);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 32, 16), new THREE.MeshStandardMaterial({ color: 0x2a2e35, roughness: 0.8 })); shaft.position.y = 16; tw.add(shaft);
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(5, 4, 4, 16), new THREE.MeshStandardMaterial({ color: 0x111317, emissive: new THREE.Color('#7fa8ff'), emissiveIntensity: 0.9, roughness: 0.2 })); cab.position.y = 34; tw.add(cab);
  const beacon = glowSprite('#ff3b2f', 5, 0.9); beacon.position.y = 37.5; tw.add(beacon); W.beacon = beacon;
  S.add(tw); tw.userData.vz = 'Диспетчерская вышка';
  return W;
}
const steel = (c = 0x9a9ea5, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: r });
export { canvasTex };
