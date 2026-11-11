import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { canvasTex, mat, basic, radialTex, textTex, spr } from './core';
import { rng } from '../lib/anim';

export const C = 56; // road centre to road centre
export const ROAD = 7; // half road width
export const WALK = 12; // sidewalk outer edge (from road centre)
const TW = 20, TH = 24; // facade tile = 8 windows x 8 floors
const GF = 4.5; // ground floor height

// ------------------------------------------------------------------ painted textures
type Style = { wall: string; frame: string; kind: 'plaster' | 'brick' | 'glass' | 'panel' };
const STYLES: Style[] = [
  { wall: '#efe3cf', frame: '#ffffff', kind: 'plaster' },
  { wall: '#a9573f', frame: '#efe6da', kind: 'brick' },
  { wall: '#5d86b3', frame: '#c9d6e3', kind: 'glass' },
  { wall: '#c9c6bd', frame: '#f2f2ee', kind: 'panel' },
  { wall: '#e6b47c', frame: '#fff5e6', kind: 'plaster' },
  { wall: '#d8d2c6', frame: '#ffffff', kind: 'panel' },
];
function paintFacade(si: number, emissive: boolean) {
  const st = STYLES[si];
  return canvasTex(`fac${si}${emissive}`, 1024, 1024, (g, w, h) => {
    const r = rng(si * 17 + 3);
    const cw = w / 8, ch = h / 8;
    if (emissive) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
    else {
      g.fillStyle = st.wall; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { // plaster / brick grain
        g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.025 + r() * 0.03})`;
        if (st.kind === 'brick') g.fillRect(Math.floor(r() * 64) * 16 + ((Math.floor(r() * 128) % 2) * 8), Math.floor(r() * 128) * 8, 15, 7);
        else g.fillRect(r() * w, r() * h, 2 + r() * 10, 2 + r() * 6);
      }
      if (st.kind === 'brick') { g.strokeStyle = 'rgba(255,240,225,0.12)'; g.lineWidth = 1.2; for (let y = 0; y < h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }
      if (st.kind === 'panel') { g.strokeStyle = 'rgba(40,40,40,0.35)'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * ch); g.lineTo(w, i * ch); g.stroke(); } for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * cw * 2, 0); g.lineTo(i * cw * 2, h); g.stroke(); } }
      if (st.kind !== 'glass') { g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 8; i++) g.fillRect(0, i * ch + ch - 6, w, 6); }
    }
    for (let fy = 0; fy < 8; fy++) for (let fx = 0; fx < 8; fx++) {
      const x0 = fx * cw, y0 = fy * ch;
      const lit = r() < 0.42, warm = r();
      if (st.kind === 'glass') {
        const gx = x0 + 3, gy = y0 + 3, gw = cw - 6, gh = ch - 22;
        if (emissive) { if (lit) { g.fillStyle = warm < 0.7 ? 'rgba(220,235,255,1)' : 'rgba(255,214,150,1)'; g.fillRect(gx, gy, gw, gh); } continue; }
        const gr = g.createLinearGradient(0, gy, 0, gy + gh); gr.addColorStop(0, '#9cc3ea'); gr.addColorStop(0.55, '#4a77a8'); gr.addColorStop(1, '#2c4d74');
        g.fillStyle = gr; g.fillRect(gx, gy, gw, gh);
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(gx + gw * 0.15, gy + gh); g.lineTo(gx + gw * 0.55, gy); g.lineTo(gx + gw * 0.75, gy); g.lineTo(gx + gw * 0.35, gy + gh); g.fill();
        g.fillStyle = st.frame; g.fillRect(x0, y0 + ch - 20, cw, 20);
        continue;
      }
      const ww = cw * 0.56, wh = ch * 0.56, wx = x0 + (cw - ww) / 2, wy = y0 + ch * 0.2;
      if (emissive) {
        if (lit) { g.fillStyle = warm < 0.75 ? `rgb(255,${190 + Math.floor(warm * 50)},${110 + Math.floor(warm * 60)})` : 'rgb(200,220,255)'; g.fillRect(wx + 4, wy + 4, ww - 8, wh - 8); }
        continue;
      }
      if (st.kind === 'panel' && fx % 2 === 1 && fy > 0) { // balcony
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x0 + 6, wy + wh * 0.55 + 8, cw - 8, ch * 0.32);
        g.fillStyle = '#e9e6de'; g.fillRect(x0 + 2, wy + wh * 0.55, cw - 6, ch * 0.3);
        g.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 6; k++) g.fillRect(x0 + 6 + k * 20, wy + wh * 0.55, 3, ch * 0.3);
      }
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(wx - 3, wy - 3, ww + 10, wh + 10);
      g.fillStyle = st.frame; g.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
      const gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#a9c7e6'); gr.addColorStop(0.5, '#56789c'); gr.addColorStop(1, '#2f4560');
      g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
      if (r() < 0.5) { g.fillStyle = ['#e8d9b8', '#d9b9a3', '#c6d4c0', '#f2e6d0', '#b8c7dc'][Math.floor(r() * 5)]; const cwid = ww * (0.2 + r() * 0.3); g.fillRect(wx, wy, cwid, wh); if (r() < 0.6) g.fillRect(wx + ww - cwid * 0.8, wy, cwid * 0.8, wh); }
      g.fillStyle = st.frame; g.fillRect(wx + ww / 2 - 2, wy, 4, wh); g.fillRect(wx, wy + wh * 0.32, ww, 4);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(wx - 8, wy + wh + 4, ww + 16, 7);
    }
  }, { repeat: true });
}
function paintShops(si: number, emissive: boolean) {
  return canvasTex(`shop${si}${emissive}`, 1024, 256, (g, w, h) => {
    const r = rng(si * 31 + 7);
    const names = [['ПРОДУКТЫ', '#2e9e5b'], ['АПТЕКА', '#20a4c9'], ['КАФЕ', '#c0392b'], ['ЦВЕТЫ', '#d1477a'], ['БАНК', '#2c3e8f'], ['ОПТИКА', '#7d4fb3'], ['ПЕКАРНЯ', '#d68910'], ['СВЯЗЬ', '#e74c3c']];
    if (emissive) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
    else { g.fillStyle = '#4a4744'; g.fillRect(0, 0, w, h); g.fillStyle = '#5b5753'; g.fillRect(0, h * 0.86, w, h * 0.14); }
    for (let k = 0; k < 3; k++) {
      const x0 = k * (w / 3) + 12, sw = w / 3 - 24;
      const [nm, col] = names[(si * 3 + k) % names.length];
      if (emissive) {
        g.fillStyle = 'rgba(255,225,170,1)'; g.fillRect(x0 + 8, h * 0.36, sw - 16, h * 0.48);
        g.fillStyle = '#fff'; g.font = '900 34px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm, x0 + sw / 2, h * 0.17);
        continue;
      }
      g.fillStyle = col; g.fillRect(x0, 8, sw, h * 0.2);
      g.fillStyle = '#fff'; g.font = '900 34px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm, x0 + sw / 2, 8 + h * 0.1);
      const gr = g.createLinearGradient(0, h * 0.34, 0, h * 0.86); gr.addColorStop(0, '#8fb1cf'); gr.addColorStop(1, '#2d3f52');
      g.fillStyle = gr; g.fillRect(x0 + 8, h * 0.34, sw - 16, h * 0.52);
      for (let s = 0; s < 3; s++) { g.fillStyle = `rgba(${150 + r() * 100},${120 + r() * 100},${90 + r() * 100},0.55)`; g.fillRect(x0 + 20, h * (0.5 + s * 0.11), sw - 40 - r() * 60, h * 0.05); }
      g.fillStyle = '#d9d4cc'; g.fillRect(x0 + sw / 2 - 2, h * 0.34, 4, h * 0.52);
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.moveTo(x0 + 30, h * 0.86); g.lineTo(x0 + 90, h * 0.34); g.lineTo(x0 + 130, h * 0.34); g.lineTo(x0 + 70, h * 0.86); g.fill();
    }
  }, { repeat: true });
}
const asphaltTex = () => canvasTex('asphalt', 512, 512, (g, w, h) => {
  const r = rng(5); g.fillStyle = '#5a5d63'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const v = Math.floor(70 + r() * 60); g.fillStyle = `rgba(${v},${v},${v + 4},0.35)`; g.fillRect(r() * w, r() * h, 2, 2); }
  for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(30,30,34,0.12)'; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 40, r() * 3, 0, 7); g.fill(); }
}, { repeat: true });
const pavingTex = () => canvasTex('paving', 512, 512, (g, w, h) => {
  const r = rng(9); g.fillStyle = '#bdb8ae'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = 175 + Math.floor(r() * 30); g.fillStyle = `rgb(${v},${v - 4},${v - 12})`; g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30); }
}, { repeat: true });
const roofTex = () => canvasTex('roof', 256, 256, (g, w, h) => {
  const r = rng(13); g.fillStyle = '#6d6a66'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3000; i++) { const v = 80 + Math.floor(r() * 50); g.fillStyle = `rgba(${v},${v},${v},0.5)`; g.fillRect(r() * w, r() * h, 2, 2); }
}, { repeat: true });

// ------------------------------------------------------------------ geometry builder with world-space UVs
class GB {
  pos: number[] = []; nrm: number[] = []; uv: number[] = []; ab: number[] = []; idx: number[] = []; col: number[] = [];
  quad(p: number[][], n: number[], uv: number[][], b: number[], c?: number[]) {
    const o = this.pos.length / 3;
    for (let i = 0; i < 4; i++) { this.pos.push(...p[i]); this.nrm.push(...n); this.uv.push(...uv[i]); this.ab.push(...b); if (c) this.col.push(...c); }
    this.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  /** side walls of an axis-aligned box; u in tiles of tw metres from the face corner, v from y0 in tiles of th */
  walls(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, tw: number, th: number, b: number[]) {
    const V = (y: number) => (y - y0) / th;
    this.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [[0, V(y0)], [(x1 - x0) / tw, V(y0)], [(x1 - x0) / tw, V(y1)], [0, V(y1)]], b);
    this.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], [[0, V(y0)], [(x1 - x0) / tw, V(y0)], [(x1 - x0) / tw, V(y1)], [0, V(y1)]], b);
    this.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], [[0, V(y0)], [(z1 - z0) / tw, V(y0)], [(z1 - z0) / tw, V(y1)], [0, V(y1)]], b);
    this.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], [[0, V(y0)], [(z1 - z0) / tw, V(y0)], [(z1 - z0) / tw, V(y1)], [0, V(y1)]], b);
  }
  top(x0: number, x1: number, y: number, z0: number, z1: number, t: number, b: number[] = [0, 0, 0]) {
    this.quad([[x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]], [0, 1, 0], [[x0 / t, z1 / t], [x1 / t, z1 / t], [x1 / t, z0 / t], [x0 / t, z0 / t]], b);
  }
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, t = 4, b: number[] = [0, 0, 0]) {
    this.walls(x0, x1, y0, y1, z0, z1, t, t, b); this.top(x0, x1, y1, z0, z1, t, b);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aB', new THREE.Float32BufferAttribute(this.ab, 3));
    if (this.col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

// ------------------------------------------------------------------ building material with "lights" control
export type CityUniforms = { uLit: { value: number }; uWave: { value: THREE.Vector3 }; uNight: { value: number } };
function facadeMat(si: number, shops: boolean, U: CityUniforms) {
  const st = STYLES[si];
  const opts: any = { map: shops ? paintShops(si, false) : paintFacade(si, false), emissive: new THREE.Color('#ffffff'), emissiveMap: shops ? paintShops(si, true) : paintFacade(si, true), emissiveIntensity: 1 };
  const m: THREE.Material = st.kind === 'glass' && !shops ? new THREE.MeshStandardMaterial({ ...opts, roughness: 0.25, metalness: 0.35 }) : new THREE.MeshLambertMaterial(opts);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLit = U.uLit; sh.uniforms.uWave = U.uWave; sh.uniforms.uNight = U.uNight;
    sh.vertexShader = 'attribute vec3 aB; varying vec3 vB;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vB = aB;');
    sh.fragmentShader = 'uniform float uLit; uniform vec3 uWave; uniform float uNight; varying vec3 vB;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n float on = step(vB.z, uLit) * smoothstep(uWave.z - 4.0, uWave.z + 4.0, length(vB.xy - uWave.xy));\n totalEmissiveRadiance *= on * uNight;');
  };
  m.customProgramCacheKey = () => 'facade' + m.type;
  return m;
}

// ------------------------------------------------------------------ city build (cached)
type Built = { [k: string]: any };
const cache = new Map<string, Built>();
export type Lot = { x0: number; x1: number; z0: number; z1: number; h: number; si: number };

function buildCity(seed: number, near: number, far: number, clear: number[][] = []): Built {
  const key = `${seed}_${near}_${far}_${JSON.stringify(clear)}`;
  if (cache.has(key)) return cache.get(key)!;
  const r = rng(seed);
  const U: CityUniforms = { uLit: { value: 1 }, uWave: { value: new THREE.Vector3(0, 0, -1) }, uNight: { value: 0 } };
  const body = STYLES.map(() => new GB());
  const shops = STYLES.map(() => new GB());
  const roofs = new GB(), walks = new GB(), curbs = new GB(), marks = new GB(), rooftop = new GB();
  const lots: Lot[] = [];
  const snap = (v: number, s: number) => Math.max(s, Math.round(v / s) * s);
  for (let i = -far; i < far; i++) for (let j = -far; j < far; j++) {
    const cx0 = i * C, cz0 = j * C;
    const isNear = Math.abs(i + 0.5) < near && Math.abs(j + 0.5) < near;
    // sidewalk slab for the whole block
    walks.box(cx0 + ROAD, cx0 + C - ROAD, 0, 0.16, cz0 + ROAD, cz0 + C - ROAD, 6);
    if (i === -1 && j === -1) continue; // the plaza
    const dist = Math.hypot(i + 0.5, j + 0.5);
    const split = r() < 0.75 ? 2 : 1;
    const inner = C - 2 * WALK;
    for (let a = 0; a < split; a++) for (let b = 0; b < split; b++) {
      const lw = inner / split;
      let x0 = cx0 + WALK + a * lw + 0.5, x1 = x0 + lw - 1, z0 = cz0 + WALK + b * lw + 0.5, z1 = z0 + lw - 1;
      const bw = snap(x1 - x0 - r() * 3, 2.5), bd = snap(z1 - z0 - r() * 3, 2.5);
      // keep the face toward the nearest street on the lot edge
      x0 = a === 0 ? x0 : x1 - bw; x1 = x0 + bw; z0 = b === 0 ? z0 : z1 - bd; z1 = z0 + bd;
      let floors = Math.round(4 + r() * 8 + (dist > 3 ? r() * 10 : 0));
      if (r() < 0.12) floors += 10;
      const si = Math.floor(r() * STYLES.length);
      const rndA = r(), rndB = r(), rndC = r(), rndD = r(), rndE = r();
      const blocked = clear.some(([cx, cz, cr]) => { const qx = Math.max(x0, Math.min(cx, x1)), qz = Math.max(z0, Math.min(cz, z1)); return Math.hypot(qx - cx, qz - cz) < cr; });
      if (blocked) continue;
      const h = GF + floors * 3;
      const rnd = rndA;
      const B = [(x0 + x1) / 2, (z0 + z1) / 2, rnd];
      shops[si].walls(x0, x1, 0, GF, z0, z1, TW, 5, B);
      body[si].walls(x0 + 0.01, x1 - 0.01, GF, h, z0 + 0.01, z1 - 0.01, TW, TH, B);
      roofs.top(x0, x1, h, z0, z1, 8, B);
      roofs.walls(x0 - 0.25, x1 + 0.25, h - 0.3, h + 0.5, z0 - 0.25, z1 + 0.25, 8, 8, B); // parapet
      if (isNear || rndB < 0.4) { // rooftop units
        const ux = x0 + 2 + rndC * (bw - 6), uz = z0 + 2 + rndD * (bd - 6);
        rooftop.box(ux, ux + 2 + rndE * 2, h, h + 1.6 + rndE * 2, uz, uz + 2 + rndD * 2, 2);
      }
      lots.push({ x0, x1, z0, z1, h, si });
    }
  }
  // roads: markings (near only)
  for (let k = -near; k <= near; k++) {
    const p = k * C;
    for (let s = -near * C; s < near * C; s += 6) {
      const inter = ((s % C) + C) % C;
      if (inter < WALK + 2 || inter > C - WALK - 2) continue;
      // dashed lane lines on roads along z (x = p) and along x (z = p)
      for (const off of [-3.5, 3.5]) { marks.top(p + off - 0.08, p + off + 0.08, 0.02, s, s + 3, 4); marks.top(s, s + 3, 0.02, p + off - 0.08, p + off + 0.08, 4); }
      marks.top(p - 0.22, p - 0.08, 0.02, s, s + 6, 4); marks.top(p + 0.08, p + 0.22, 0.02, s, s + 6, 4);
      marks.top(s, s + 6, 0.02, p - 0.22, p - 0.08, 4); marks.top(s, s + 6, 0.02, p + 0.08, p + 0.22, 4);
    }
  }
  // zebra crossings around every near intersection
  for (let i = -near + 1; i < near; i++) for (let j = -near + 1; j < near; j++) {
    const X = i * C, Z = j * C;
    for (let k = -6; k < 6; k++) {
      const a = k * 1.15 + 0.3;
      marks.top(X + a, X + a + 0.6, 0.021, Z + WALK - 4.5, Z + WALK - 0.8, 4); marks.top(X + a, X + a + 0.6, 0.021, Z - WALK + 0.8, Z - WALK + 4.5, 4);
      marks.top(X + WALK - 4.5, X + WALK - 0.8, 0.021, Z + a, Z + a + 0.6, 4); marks.top(X - WALK + 0.8, X - WALK + 4.5, 0.021, Z + a, Z + a + 0.6, 4);
    }
  }
  // street lamps + trees (near only)
  const lampG: THREE.BufferGeometry[] = [], headG: THREE.BufferGeometry[] = [], trunkG: THREE.BufferGeometry[] = [], leafG: THREE.BufferGeometry[] = [];
  const lampPts: number[][] = [];
  const treePts: number[][] = [];
  for (let k = -near; k <= near; k++) {
    const p = k * C;
    for (let s = -near * C + 4; s < near * C; s += 18) {
      const inter = ((s % C) + C) % C;
      if (inter < WALK + 3 || inter > C - WALK - 3) continue;
      for (const sd of [-1, 1]) { lampPts.push([p + sd * (ROAD + 0.8), s, -sd, 0]); lampPts.push([s, p + sd * (ROAD + 0.8), -sd, 1]); }
      for (const sd of [-1, 1]) { treePts.push([p + sd * (ROAD + 2.6), s + 9]); treePts.push([s + 9, p + sd * (ROAD + 2.6)]); }
    }
  }
  for (const [x, z, sd, ax] of lampPts) {
    const pole = new THREE.CylinderGeometry(0.09, 0.13, 8, 8); pole.translate(x, 4, z); lampG.push(pole);
    const arm = new THREE.BoxGeometry(ax ? 0.12 : 2.2, 0.12, ax ? 2.2 : 0.12); arm.translate(x + (ax ? 0 : sd * 1.0), 7.9, z + (ax ? sd * 1.0 : 0)); lampG.push(arm);
    const head = new THREE.BoxGeometry(ax ? 0.5 : 0.9, 0.18, ax ? 0.9 : 0.5); head.translate(x + (ax ? 0 : sd * 2.0), 7.78, z + (ax ? sd * 2.0 : 0)); headG.push(head);
  }
  const leafColors = ['#4f8a3c', '#5e9a3f', '#3f7a3a', '#6aa346', '#4c8f4a'];
  treePts.forEach(([x, z], i) => {
    const tr = new THREE.CylinderGeometry(0.16, 0.24, 3.2, 7); tr.translate(x, 1.6, z); trunkG.push(tr);
    const n = 2 + (i % 2);
    for (let q = 0; q < n; q++) {
      const lf = new THREE.IcosahedronGeometry(1.6 + ((i * 7 + q * 3) % 5) * 0.18, 1);
      lf.translate(x + (q - 1) * 0.6, 4.1 + q * 0.7, z + ((q * 13 + i) % 3 - 1) * 0.5);
      const col = new THREE.Color(leafColors[(i + q) % leafColors.length]);
      const cols = new Float32Array(lf.attributes.position.count * 3).map((_, idx) => [col.r, col.g, col.b][idx % 3]);
      lf.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      leafG.push(lf.toNonIndexed ? lf : lf);
    }
  });
  const fix = (arr: THREE.BufferGeometry[]) => arr.map((g) => (g.index ? g.toNonIndexed() : g));
  const built: Built = {
    U, lots, lampPts, treePts,
    body: body.map((b) => b.build()), shops: shops.map((b) => b.build()),
    bodyMat: STYLES.map((_, i) => facadeMat(i, false, U)), shopMat: STYLES.map((_, i) => facadeMat(i, true, U)),
    roofs: roofs.build(), walks: walks.build(), marks: marks.build(), rooftop: rooftop.build(),
    lamps: lampG.length ? mergeGeometries(fix(lampG)) : null, heads: headG.length ? mergeGeometries(fix(headG)) : null,
    trunks: trunkG.length ? mergeGeometries(fix(trunkG)) : null, leaves: leafG.length ? mergeGeometries(fix(leafG)) : null,
    roofMat: new THREE.MeshLambertMaterial({ map: roofTex() }),
    walkMat: new THREE.MeshLambertMaterial({ map: pavingTex() }),
    roadMat: (() => { const t = asphaltTex().clone(); t.repeat.set(250, 250); t.needsUpdate = true; return new THREE.MeshLambertMaterial({ map: t }); })(),
  };
  cache.set(key, built);
  return built;
}

// ------------------------------------------------------------------ overgrowth / trash (instanced, scale animated)
function scatter(seed: number, lots: Lot[], n: number, kind: 'vine' | 'grass' | 'trash' | 'paper', near: number) {
  const r = rng(seed);
  const out: number[][] = [];
  const lim = near * C;
  for (let i = 0; i < n; i++) {
    if (kind === 'vine') {
      const L = lots[Math.floor(r() * lots.length)];
      if (Math.abs((L.x0 + L.x1) / 2) > lim || Math.abs((L.z0 + L.z1) / 2) > lim) continue;
      const side = Math.floor(r() * 4), y = r() < 0.3 ? L.h : r() * Math.min(L.h, 30);
      let x = L.x0 + r() * (L.x1 - L.x0), z = L.z0 + r() * (L.z1 - L.z0);
      if (side === 0) z = L.z1; if (side === 1) z = L.z0; if (side === 2) x = L.x1; if (side === 3) x = L.x0;
      out.push([x, y, z, 1.0 + r() * 2.6]);
    } else {
      const along = (r() * 2 - 1) * lim, k = Math.round((r() * 2 - 1) * near) * C, sd = r() < 0.5 ? -1 : 1;
      const off = kind === 'grass' ? (r() * 2 - 1) * ROAD : sd * (ROAD + 1 + r() * 4);
      const ax = r() < 0.5;
      const sc = kind === 'grass' ? 1.2 + r() * 2.2 : 0.6 + r() * 1.4;
      out.push(ax ? [k + off, 0, along, sc] : [along, 0, k + off, sc]);
    }
  }
  return out;
}
const Scatter: React.FC<{ pts: number[][]; geo: THREE.BufferGeometry; material: THREE.Material; amount: number; squashY?: number; seed?: number }> = ({ pts, geo, material, amount, squashY = 1, seed = 1 }) => {
  const im = useMemo(() => { const m = new THREE.InstancedMesh(geo, material, pts.length); m.castShadow = true; m.receiveShadow = true; return m; }, [pts, geo, material]);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  pts.forEach((p, i) => {
    const s = p[3] * Math.max(0.0001, Math.min(1, amount * 1.6 - (i % 7) * 0.08));
    e.set(0, (i * 1.7 + seed) % 6.28, 0); q.setFromEuler(e);
    M.compose(new THREE.Vector3(p[0], p[1] + (squashY < 1 ? 0.05 : 0), p[2]), q, new THREE.Vector3(s, s * squashY, s));
    im.setMatrixAt(i, M);
  });
  im.instanceMatrix.needsUpdate = true;
  return <primitive object={im} />;
};

// ------------------------------------------------------------------ traffic light
export const TrafficLight: React.FC<{ pos: number[]; rotY: number; state: 'red' | 'yellow' | 'green' | 'off' | 'blink' | 'all'; f?: number }> = ({ pos, rotY, state, f = 0 }) => {
  const blinkOn = Math.floor(f / 12) % 2 === 0;
  const on = (c: string) => state === 'all' || (state === 'blink' ? c === 'yellow' && blinkOn : state === c);
  const lamp = (c: string, hex: string, y: number) => (
    <group position={[0, y, 0.22]}>
      <mesh material={on(c) ? basic(hex) : mat('#2a2a2a', { r: 0.4 })}><sphereGeometry args={[0.16, 14, 10]} /></mesh>
      {on(c) && <sprite scale={[1.3, 1.3, 1]} material={spr(hex, { map: radialTex('glow'), add: true })} />}
    </group>
  );
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh position={[0, 2.2, 0]} material={mat('#3b3f45', { r: 0.5, m: 0.4 })} castShadow><cylinderGeometry args={[0.08, 0.1, 4.4, 8]} /></mesh>
      <mesh position={[0, 4.2, 0.05]} material={mat('#23262b', { r: 0.6 })} castShadow><boxGeometry args={[0.5, 1.3, 0.35]} /></mesh>
      {lamp('red', '#ff3b30', 4.62)}
      {lamp('yellow', '#ffcc00', 4.2)}
      {lamp('green', '#34c759', 3.78)}
    </group>
  );
};

// ------------------------------------------------------------------ the city component
export type CityProps = {
  seed?: number; near?: number; far?: number; night?: number; lit?: number; wave?: number[]; overgrowth?: number; trash?: number;
  lamps?: number; traffic?: 'normal' | 'blink' | 'off' | 'chaos'; f?: number; noPlaza?: boolean; clear?: number[][]; noGround?: boolean;
};
export const City: React.FC<CityProps> = ({ seed = 7, near = 3, far = 7, night = 0, lit = 1, wave = [0, 0, -1], overgrowth = 0, trash = 0, lamps = 0, traffic = 'normal', f = 0, clear = [], noGround = false }) => {
  const ck = JSON.stringify(clear);
  const B = useMemo(() => buildCity(seed, near, far, clear), [seed, near, far, ck]);
  B.U.uNight.value = night; B.U.uLit.value = lit; B.U.uWave.value.set(wave[0], wave[1], wave[2]);
  const vines = useMemo(() => scatter(seed + 1, B.lots, 2600, 'vine', near), [B]);
  const grass = useMemo(() => scatter(seed + 2, B.lots, 900, 'grass', near), [B]);
  const trashP = useMemo(() => scatter(seed + 3, B.lots, 260, 'trash', near), [B]);
  const papers = useMemo(() => scatter(seed + 4, B.lots, 300, 'paper', near), [B]);
  const vineGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const bagGeo = useMemo(() => new THREE.SphereGeometry(0.45, 10, 8), []);
  const paperGeo = useMemo(() => new THREE.BoxGeometry(0.5, 0.02, 0.35), []);
  const leafMat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), []);
  const vineMat = mat('#4e8a35', { r: 0.85, flat: true });
  const grassMat = mat('#6b9a3a', { r: 0.9, flat: true });
  const tl = traffic === 'off' ? 'off' : traffic === 'blink' ? 'blink' : traffic === 'chaos' ? (['red', 'yellow', 'green', 'all'] as const)[Math.floor(f / 5) % 4] : (['green', 'yellow', 'red'] as const)[Math.floor(f / 90) % 3];
  return (
    <group>
      {noGround ? <mesh rotation={[-Math.PI / 2, 0, 0]} material={B.roadMat} receiveShadow><circleGeometry args={[near * C * 1.05, 48]} /></mesh> : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={B.roadMat} receiveShadow>
          <planeGeometry args={[2000, 2000]} />
        </mesh>
      )}
      <mesh geometry={B.walks} material={B.walkMat} receiveShadow />
      <mesh geometry={B.marks} material={mat('#f2f2ee', { r: 0.6 })} receiveShadow />
      {B.body.map((g: THREE.BufferGeometry, i: number) => <mesh key={'b' + i} geometry={g} material={B.bodyMat[i]} castShadow receiveShadow />)}
      {B.shops.map((g: THREE.BufferGeometry, i: number) => <mesh key={'s' + i} geometry={g} material={B.shopMat[i]} castShadow receiveShadow />)}
      <mesh geometry={B.roofs} material={B.roofMat} castShadow receiveShadow />
      <mesh geometry={B.rooftop} material={mat('#9a9893', { r: 0.7 })} castShadow receiveShadow />
      {B.lamps && <mesh geometry={B.lamps} material={mat('#3b3f45', { r: 0.5, m: 0.3 })} castShadow />}
      {B.heads && <mesh geometry={B.heads} material={lamps > 0 ? basic('#ffe2a8') : mat('#d8d8d0', { r: 0.3 })} />}
      {B.trunks && <mesh geometry={B.trunks} material={mat('#6b4a33', { r: 0.9 })} castShadow />}
      {B.leaves && <mesh geometry={B.leaves} material={leafMat} castShadow receiveShadow scale={[1, 1, 1]} />}
      {lamps > 0 && B.lampPts.map((p: number[], i: number) => (
        <sprite key={'lg' + i} position={[p[0] + (p[3] ? 0 : p[2] * 2), 7.5, p[1] + (p[3] ? p[2] * 2 : 0)]} scale={[5 * lamps, 5 * lamps, 1]} material={spr('#ffcf87', { map: radialTex('glow'), add: true, t: 0.7 })} />
      ))}
      {/* plaza */}
      <group position={[-C / 2, 0.16, -C / 2]}>
        <mesh position={[0, 0.25, 0]} material={mat('#cfc9bd', { r: 0.8 })} receiveShadow castShadow><cylinderGeometry args={[4.5, 4.8, 0.5, 32]} /></mesh>
        <mesh position={[0, 0.52, 0]} material={mat('#5fa7d9', { r: 0.15, m: 0.2 })}><cylinderGeometry args={[4.0, 4.0, 0.06, 32]} /></mesh>
        <mesh position={[0, 1.3, 0]} material={mat('#cfc9bd', { r: 0.8 })} castShadow><cylinderGeometry args={[0.5, 0.8, 1.8, 16]} /></mesh>
      </group>
      {/* traffic lights at the central intersection */}
      <TrafficLight pos={[ROAD + 0.8, 0, ROAD + 0.8]} rotY={0} state={tl} f={f} />
      <TrafficLight pos={[-ROAD - 0.8, 0, -ROAD - 0.8]} rotY={Math.PI} state={tl} f={f} />
      <TrafficLight pos={[ROAD + 0.8, 0, -ROAD - 0.8]} rotY={Math.PI / 2} state={tl === 'green' ? 'red' : tl === 'red' ? 'green' : tl} f={f} />
      <TrafficLight pos={[-ROAD - 0.8, 0, ROAD + 0.8]} rotY={-Math.PI / 2} state={tl === 'green' ? 'red' : tl === 'red' ? 'green' : tl} f={f} />
      {overgrowth > 0 && (
        <>
          <Scatter pts={vines} geo={vineGeo} material={vineMat} amount={overgrowth} />
          <Scatter pts={grass} geo={vineGeo} material={grassMat} amount={overgrowth} squashY={0.35} seed={3} />
        </>
      )}
      {trash > 0 && (
        <>
          <Scatter pts={trashP} geo={bagGeo} material={mat('#26282c', { r: 0.35 })} amount={trash} squashY={0.75} />
          <Scatter pts={papers} geo={paperGeo} material={mat('#efece4', { r: 0.9 })} amount={trash} seed={5} />
        </>
      )}
    </group>
  );
};

/** a 3D sign (plane with text), e.g. on a facade */
export const Sign: React.FC<{ text: string; pos: number[]; rotY?: number; w?: number; h?: number; bg?: string; fg?: string; glow?: boolean }> = ({ text, pos, rotY = 0, w = 6, h = 1.3, bg = '#c0392b', fg = '#fff', glow }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0, -0.08]} material={mat('#222', { r: 0.6 })}><boxGeometry args={[w + 0.2, h + 0.2, 0.12]} /></mesh>
    <mesh material={glow ? basic('#ffffff', { map: textTex(text, { w: 1024, h: Math.round((1024 * h) / w), bg, fg, radius: 12 }) }) : new THREE.MeshStandardMaterial({ map: textTex(text, { w: 1024, h: Math.round((1024 * h) / w), bg, fg, radius: 12 }), roughness: 0.5, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.25, emissiveMap: textTex(text, { w: 1024, h: Math.round((1024 * h) / w), bg, fg, radius: 12 }) })}>
      <planeGeometry args={[w, h]} />
    </mesh>
  </group>
);
