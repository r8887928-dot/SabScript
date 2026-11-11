import React, { useMemo } from 'react';
import * as THREE from 'three';
import { canvasTex, basic, radialTex, spr } from './core';
import { rng } from '../lib/anim';

// rough continent outlines (lon, lat) — stylised, cartoon-globe accuracy
const LAND: number[][][] = [
  // North America
  [[-168, 66], [-162, 70], [-156, 71], [-140, 70], [-128, 70], [-115, 68], [-100, 68], [-95, 72], [-85, 70], [-80, 73], [-70, 68], [-62, 60], [-56, 52], [-60, 47], [-66, 44], [-70, 41], [-75, 38], [-76, 35], [-81, 31], [-80, 26], [-82, 25], [-83, 29], [-89, 30], [-94, 29], [-97, 26], [-97, 21], [-92, 18], [-88, 21], [-87, 16], [-83, 10], [-79, 8], [-82, 8], [-86, 12], [-92, 15], [-100, 17], [-106, 23], [-110, 24], [-112, 29], [-115, 30], [-117, 33], [-121, 35], [-124, 40], [-124, 46], [-127, 50], [-133, 55], [-140, 59], [-150, 60], [-155, 57], [-163, 55], [-158, 58], [-162, 60], [-166, 62]],
  // Greenland
  [[-73, 78], [-60, 82], [-40, 83], [-22, 82], [-18, 76], [-22, 70], [-32, 68], [-42, 60], [-50, 64], [-55, 70], [-60, 76]],
  // Baffin
  [[-80, 73], [-68, 70], [-62, 66], [-65, 63], [-72, 64], [-78, 64], [-85, 68]],
  // South America
  [[-80, 9], [-75, 11], [-71, 12], [-63, 11], [-60, 8], [-52, 5], [-50, 0], [-44, -2], [-35, -5], [-35, -9], [-39, -15], [-40, -22], [-48, -26], [-52, -33], [-58, -38], [-62, -39], [-65, -42], [-67, -46], [-69, -52], [-74, -53], [-75, -48], [-73, -40], [-71, -30], [-70, -20], [-75, -15], [-81, -6], [-80, -2], [-80, 2], [-77, 4], [-78, 8]],
  // Africa
  [[-17, 21], [-16, 15], [-17, 13], [-12, 8], [-8, 4], [-2, 5], [5, 6], [9, 4], [10, 1], [9, -2], [12, -6], [13, -12], [12, -17], [15, -27], [18, -33], [20, -35], [26, -34], [31, -29], [35, -24], [35, -20], [40, -15], [40, -10], [39, -5], [42, 0], [46, 3], [51, 11], [44, 11], [43, 13], [39, 17], [37, 22], [35, 28], [32, 31], [25, 32], [20, 31], [15, 32], [10, 34], [11, 37], [5, 37], [-2, 35], [-6, 36], [-9, 32], [-10, 29], [-13, 27], [-15, 24]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  // Eurasia
  [[-9, 37], [-9, 43], [-2, 43.5], [-1, 46], [-4, 48], [-1, 49.5], [2, 51], [5, 53], [8, 54], [8.5, 57], [10.5, 57.5], [11, 56], [12.5, 54.5], [14, 54], [19, 54.5], [21, 57], [24, 59], [29, 60], [23, 60], [21, 61], [22, 64], [25, 65.5], [22, 66], [18, 63], [17, 61], [19, 60], [18, 59], [16, 56], [13, 55.5], [11, 59], [6, 58], [5, 62], [10, 64], [14, 67], [17, 69], [22, 70.5], [28, 71], [33, 70], [41, 67], [44, 68], [54, 68.5], [60, 69], [68, 72], [73, 68], [80, 73], [90, 75.5], [100, 77], [105, 78], [113, 74], [122, 73], [130, 71], [140, 72], [150, 71], [160, 70], [170, 70], [180, 69], [180, 65], [178, 62], [170, 60], [163, 60], [160, 55], [156, 51], [156, 57], [160, 61], [155, 59], [143, 59], [140, 54], [141, 48], [136, 43], [131, 43], [129, 40], [126, 37], [127, 35], [126, 34], [122, 37], [121, 40], [118, 39], [119, 37], [122, 31], [121, 28], [117, 24], [110, 21], [106, 19], [108, 16], [109, 12], [105, 9], [103, 10], [100, 13], [99, 10], [102, 6], [104, 1], [101, 3], [98, 8], [98, 15], [94, 16], [92, 22], [90, 22], [87, 21], [80, 16], [80, 10], [77, 8], [73, 16], [73, 21], [69, 22], [66, 25], [62, 25], [57, 26], [56, 24], [59, 22], [57, 18], [52, 16], [45, 13], [43, 15], [39, 21], [35, 28], [34, 31], [35, 36], [31, 36.5], [27, 37], [26, 40], [28, 41], [29, 41.2], [27, 40.5], [23, 40], [23, 38], [22, 37], [21, 39], [19, 42], [15, 45], [13, 45.7], [12, 44], [14, 42], [16, 40], [16, 38.5], [15.6, 38], [12, 41.5], [10, 44], [7, 43.5], [3, 43], [3, 42], [0, 39], [-1, 37], [-6, 36]],
  [[-5, 50], [1, 51], [1.7, 52.7], [0, 53.5], [-2, 56], [-2, 57.6], [-3.3, 58.6], [-5, 58.6], [-6, 56.5], [-5, 55], [-3, 54.5], [-4.5, 53.3], [-4.5, 51.7]],
  [[-10, 51.6], [-6, 52], [-6, 54], [-8, 55.2], [-10, 54]],
  [[-24, 65], [-22, 66.5], [-15, 66.5], [-13.5, 65], [-18, 63.5]],
  [[130, 31], [132, 34], [135, 34], [140, 35], [141, 38], [142, 40], [141.5, 42], [145, 43.5], [141, 45.5], [140, 41], [139.5, 38], [137, 37], [135, 35.5], [131, 34.5]],
  [[95, 5.5], [98, 3.5], [104, -2], [106, -6], [102, -4], [97, 1]],
  [[109, 1], [111, -3], [116, -4], [119, 1], [117, 7], [113, 3]],
  [[105, -6], [114, -7], [114, -8.5], [106, -7]],
  [[131, -1], [141, -2.5], [150, -10], [143, -9], [138, -8], [132, -4]],
  [[120, 18], [122, 18.5], [126, 7], [125, 6], [122, 8], [120, 14]],
  [[-85, 22], [-80, 23.2], [-74, 20], [-77.5, 19.8], [-81, 21.7]],
  // Australia
  [[113, -22], [114, -26], [115, -34], [118, -35], [124, -34], [129, -32], [135, -34.5], [138, -35], [140, -38], [146, -39], [150, -37.5], [153, -31], [153, -25], [149, -20], [145, -15], [142, -11], [141, -13], [141, -17], [136, -15], [136, -12], [132, -11], [129, -15], [126, -14], [122, -17], [119, -20]],
  [[172.7, -34.5], [178.5, -37.7], [176, -41.5], [174.5, -41.7], [172, -40.5], [171, -42], [168, -46.5], [166.5, -46], [170.5, -43], [173, -41], [174.5, -38]],
];
const WATER: number[][][] = [
  [[28, 41.5], [28, 44], [30, 46], [33, 46], [37, 47], [39, 45], [41, 42], [36, 41.5], [32, 41.5]],
  [[47, 45], [50, 47], [53, 46], [54, 42], [53, 38], [51, 37], [49, 38], [49, 41]],
  [[-95, 59], [-92, 57], [-85, 55], [-80, 55], [-77, 60], [-78, 62.5], [-85, 64], [-90, 63.5], [-94, 61]],
];
const CITIES: number[][] = [[-74, 40.7, 1.5], [-118, 34, 1.3], [-87.6, 41.9, 1.1], [-95, 29.8, 1], [-79, 43.7, 0.9], [-99, 19.4, 1.3], [-46.6, -23.5, 1.4], [-43, -22.9, 1.1], [-58.4, -34.6, 1.1], [-77, -12, 0.9], [-74, 4.7, 0.9], [-0.1, 51.5, 1.3], [2.35, 48.85, 1.2], [-3.7, 40.4, 1], [13.4, 52.5, 1], [12.5, 41.9, 0.9], [37.6, 55.75, 1.4], [30.3, 59.9, 1.1], [29, 41, 1.2], [31.2, 30, 1.3], [3.4, 6.5, 1.1], [28, -26.2, 1], [36.8, -1.3, 0.8], [55.3, 25.2, 1], [51.4, 35.7, 1.1], [67, 24.9, 1.2], [77.2, 28.6, 1.5], [72.8, 19, 1.4], [88.4, 22.6, 1.2], [77.6, 13, 1.1], [90.4, 23.8, 1.2], [100.5, 13.75, 1.1], [106.8, -6.2, 1.2], [121, 14.6, 1.1], [116.4, 39.9, 1.5], [121.5, 31.2, 1.5], [113.3, 23.1, 1.4], [127, 37.5, 1.3], [139.7, 35.7, 1.6], [135.5, 34.7, 1.2], [151.2, -33.9, 1], [145, -37.8, 0.9], [82.9, 55, 0.8], [60.6, 56.8, 0.8], [49.1, 55.8, 0.8], [30.5, 50.45, 1], [21, 52.2, 0.9], [76.9, 43.2, 0.7], [69.2, 41.3, 0.8], [-122.4, 37.8, 1.1], [-80.2, 25.8, 1], [-84.4, 33.7, 0.9], [-71, 42.4, 0.9], [-123, 49.3, 0.7], [-73.6, 45.5, 0.8], [8.7, 50.1, 0.9], [4.9, 52.4, 0.9], [16.4, 48.2, 0.8], [44.5, 40.2, 0.6], [39.7, 47.2, 0.7], [104, 30.7, 1.2], [108.9, 34.3, 1.1], [114.3, 30.6, 1.2], [126.6, 45.8, 0.9], [103.8, 1.35, 1]];

const W = 2048, H = 1024;
const P = (lon: number, lat: number) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
function landPath(g: CanvasRenderingContext2D) {
  g.beginPath();
  for (const poly of LAND) poly.forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? g.lineTo(x, y) : g.moveTo(x, y); });
}
export const earthDay = () => canvasTex('earthDay', W, H, (g) => {
  const r = rng(21);
  const oc = g.createLinearGradient(0, 0, 0, H); oc.addColorStop(0, '#1d4f8f'); oc.addColorStop(0.5, '#1f63ad'); oc.addColorStop(1, '#1d4f8f');
  g.fillStyle = oc; g.fillRect(0, 0, W, H);
  // shallow water rim
  g.save(); landPath(g); g.strokeStyle = '#3d8fd0'; g.lineWidth = 16; g.lineJoin = 'round'; g.stroke(); g.lineWidth = 7; g.strokeStyle = '#5aa7dc'; g.stroke(); g.restore();
  g.save(); landPath(g); g.fillStyle = '#5c9a45'; g.fill(); g.clip();
  // vegetation / desert variation
  const blob = (lo: number, la: number, rad: number, col: string) => { const [x, y] = P(lo, la); const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
  [[10, 23, 170], [25, 25, 150], [45, 22, 110], [55, 24, 90], [133, -25, 120], [105, 42, 110], [-113, 33, 60], [-70, -24, 40], [65, 40, 80], [18, -24, 70]].forEach(([lo, la, rd]) => blob(lo, la, rd, 'rgba(222,190,125,0.95)'));
  [[20, 0, 120], [-60, -5, 150], [105, 5, 90], [-80, 45, 120], [90, 60, 200], [30, 58, 150]].forEach(([lo, la, rd]) => blob(lo, la, rd, 'rgba(46,110,52,0.75)'));
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '30,70,30' : '140,150,80'},${0.08 + r() * 0.1})`; const rd = 4 + r() * 18; g.beginPath(); g.arc(r() * W, r() * H, rd, 0, 7); g.fill(); }
  g.restore();
  // ice
  g.fillStyle = '#f2f6fa'; g.fillRect(0, H - (20 / 180) * H, W, H); g.fillRect(0, 0, W, (10 / 180) * H);
  g.save(); g.beginPath(); LAND[1].forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.fillStyle = '#eef3f7'; g.fill(); g.restore();
  for (let x = 0; x < W; x += 6) { const y = H - (20 / 180) * H - (Math.sin(x * 0.02) * 6 + Math.sin(x * 0.007) * 12 + 8); g.fillStyle = '#f2f6fa'; g.fillRect(x, y, 6, 40); }
  for (const poly of WATER) { g.beginPath(); poly.forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.fillStyle = '#2468b0'; g.fill(); }
});
export const earthNight = () => canvasTex('earthNight', W, H, (g) => {
  const r = rng(33);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.save(); landPath(g); g.clip();
  for (const [lo, la, wgt] of CITIES) {
    const [x, y] = P(lo, la);
    const n = Math.floor(70 * wgt);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.28, d = Math.pow(r(), 1.6) * 40 * wgt;
      g.fillStyle = `rgba(255,${190 + Math.floor(r() * 50)},${110 + Math.floor(r() * 50)},${0.35 + r() * 0.6})`;
      g.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 2 + r() * 2, 2 + r() * 2);
    }
    const gr = g.createRadialGradient(x, y, 0, x, y, 22 * wgt); gr.addColorStop(0, 'rgba(255,210,140,0.9)'); gr.addColorStop(1, 'rgba(255,180,90,0)');
    g.fillStyle = gr; g.fillRect(x - 30 * wgt, y - 30 * wgt, 60 * wgt, 60 * wgt);
  }
  for (let i = 0; i < 9000; i++) { // scattered towns, denser in the northern mid-latitudes
    const lo = r() * 360 - 180, la = -40 + r() * 100;
    if (la > 62 && r() < 0.85) continue;
    const [x, y] = P(lo, la);
    g.fillStyle = `rgba(255,200,130,${0.15 + r() * 0.35})`; g.fillRect(x, y, 1.6, 1.6);
  }
  g.restore();
});
export const cloudsTex = () => canvasTex('earthClouds', 1024, 512, (g, w, h) => {
  const r = rng(44);
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 520; i++) {
    const la = (r() - 0.5) * 150, x = r() * w, y = ((90 - la) / 180) * h, rad = 6 + r() * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rad * 2.2, rad, (r() - 0.5) * 0.6, 0, 7); g.fill();
  }
});

const vert = `varying vec3 vN; varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal); vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.0); }`;
const frag = `uniform sampler2D uDay; uniform sampler2D uNight; uniform vec3 uSun; uniform float uOff; uniform float uRed; uniform float uNightK; uniform float uDayK; varying vec3 vN; varying vec2 vUv; varying vec3 vW;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){ vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
 float l = dot(N, normalize(uSun)); float day = smoothstep(-0.12, 0.25, l) * uDayK;
 vec3 base = texture2D(uDay, vUv).rgb;
 vec3 col = base * (0.035 + 1.05*max(l,0.0)*uDayK);
 vec3 sp = vec3(1.0,0.95,0.85)*pow(max(dot(reflect(-normalize(uSun),N),V),0.0),40.0)*0.35*step(base.b, base.g*1.6+0.05)*0.0;
 vec2 cell = floor(vUv*vec2(18.0,9.0)); float region = h(cell);
 float on = 1.0 - smoothstep(region-0.03, region+0.03, uOff);
 vec3 lights = texture2D(uNight, vUv).rgb * (1.0 - day) * on * uNightK * 1.6;
 col += lights + sp;
 float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);
 col += vec3(0.35,0.6,1.0) * fr * (0.15 + 0.85*smoothstep(-0.3,0.4,l)) * 0.9;
 col = mix(col, col*vec3(1.5,0.35,0.35) + vec3(0.12,0.0,0.01)*(0.4+fr), uRed);
 gl_FragColor = vec4(col,1.0);
 #include <colorspace_fragment>
}`;

export const Earth: React.FC<{ rot?: number; tilt?: number; sun?: number[]; off?: number; red?: number; night?: number; day?: number; clouds?: number; r?: number; pos?: number[] }> = ({ rot = 0, tilt = 0.41, sun = [1, 0.3, 0.6], off = 0, red = 0, night = 1, day = 1, clouds = 1, r = 10, pos = [0, 0, 0] }) => {
  const m = useMemo(() => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { uDay: { value: earthDay() }, uNight: { value: earthNight() }, uSun: { value: new THREE.Vector3() }, uOff: { value: 0 }, uRed: { value: 0 }, uNightK: { value: 1 }, uDayK: { value: 1 } } }), []);
  m.uniforms.uSun.value.set(sun[0], sun[1], sun[2]); m.uniforms.uOff.value = off; m.uniforms.uRed.value = red; m.uniforms.uNightK.value = night; m.uniforms.uDayK.value = day;
  const cm = useMemo(() => new THREE.MeshStandardMaterial({ map: cloudsTex(), transparent: true, depthWrite: false, roughness: 1 }), []);
  cm.opacity = clouds * (1 - red * 0.6);
  const atm = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color('#5aa0ff') } }, transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.0);} `,
    fragmentShader: `uniform vec3 uC; varying vec3 vN; varying vec3 vW; void main(){ vec3 V = normalize(cameraPosition - vW); float f = pow(max(0.0, 0.72 - abs(dot(normalize(vN), V))) / 0.72, 2.2); gl_FragColor = vec4(uC*f*1.3, f); }`,
  }), []);
  atm.uniforms.uC.value.set(red > 0.5 ? '#ff4a4a' : '#5aa0ff');
  return (
    <group position={pos as any} rotation={[0, 0, tilt]}>
      <group rotation={[0, rot, 0]}>
        <mesh material={m}><sphereGeometry args={[r, 96, 64]} /></mesh>
        <mesh material={cm} scale={[1.012, 1.012, 1.012]} rotation={[0, rot * 0.3, 0]}><sphereGeometry args={[r, 64, 48]} /></mesh>
      </group>
      <mesh material={atm} scale={[1.09, 1.09, 1.09]}><sphereGeometry args={[r, 64, 48]} /></mesh>
    </group>
  );
};

export const StarField: React.FC<{ n?: number; r?: number }> = ({ n = 2500, r = 900 }) => {
  const g = useMemo(() => {
    const rr = rng(5); const p = new Float32Array(n * 3); const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rr() * 2 - 1, a = rr() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      p[i * 3] = Math.cos(a) * s * r; p[i * 3 + 1] = u * r; p[i * 3 + 2] = Math.sin(a) * s * r;
      const b = 0.4 + rr() * 0.6; const t = rr();
      c[i * 3] = b * (t < 0.2 ? 0.8 : 1); c[i * 3 + 1] = b * 0.95; c[i * 3 + 2] = b * (t > 0.8 ? 0.8 : 1);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return geo;
  }, [n, r]);
  return <points geometry={g} material={useMemo(() => new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, toneMapped: false, fog: false }), [])} />;
};
export const SunGlow: React.FC<{ pos: number[]; s?: number }> = ({ pos, s = 200 }) => (
  <>
    <sprite position={pos as any} scale={[s, s, 1]} material={spr('#fff1d6', { map: radialTex('sunglow', 'rgba(255,255,255,1)', 'rgba(255,255,255,0)', 0.02), add: true })} />
    <sprite position={pos as any} scale={[s * 0.18, s * 0.18, 1]} material={spr('#ffffff', { map: radialTex('sundisc', 'rgba(255,255,255,1)', 'rgba(255,255,255,0)', 0.6), add: true })} />
  </>
);
