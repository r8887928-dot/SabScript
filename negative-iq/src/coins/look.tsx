import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Q, mat, basic, canvasTex, spr, radialTex } from '../three/core';
import { rng } from '../lib/anim';

// Look layer for the coin puzzle (cartoon-3d-short skill rules): post chain bloom (HDR emissives only) → DOF on the subject
// → vignette + light grade; flat 2D billboard character with plum ink; a warm evening street with real depth.

/** canvas + post effects. focus: world distance to keep sharp; blur 0 = off (wides) */
export const PStage: React.FC<{ children: React.ReactNode; focus?: number; blur?: number }> = ({ children }) => {
  const vc = useVideoConfig();
  const w = Math.round(vc.width * Q.res), h = Math.round(vc.height * Q.res);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden', filter: 'saturate(1.12) contrast(1.06)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${vc.width / w})`, transformOrigin: '0 0' }}>
        <ThreeCanvas width={w} height={h} shadows gl={{ antialias: true, powerPreference: 'high-performance' }} camera={{ fov: 45, near: 0.1, far: 400, position: [0, 2, 10] }}>
          {children}
        </ThreeCanvas>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(30,10,0,0.55) 100%)' }} />
    </div>
  );
};

// ------------------------------------------------------------------ the 2D character card
export type Face = 'sly' | 'grin' | 'think' | 'wow' | 'talk';
const INK = '#241726';
function drawSage(g: CanvasRenderingContext2D, w: number, h: number, face: Face, mouthOpen: number, arm: number) {
  g.clearRect(0, 0, w, h);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const cx = w / 2;
  // legs
  g.strokeStyle = INK; g.lineWidth = 14;
  g.beginPath(); g.moveTo(cx - 40, 690); g.lineTo(cx - 48, 960); g.moveTo(cx + 40, 690); g.lineTo(cx + 50, 960); g.stroke();
  g.fillStyle = INK; for (const x of [cx - 48, cx + 50]) { g.beginPath(); g.ellipse(x + 14, 966, 34, 14, 0, 0, 7); g.fill(); }
  // body: vest bean
  g.fillStyle = '#7a3e1d'; g.strokeStyle = INK; g.lineWidth = 12;
  g.beginPath(); g.ellipse(cx, 590, 150, 165, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#f4efe2'; g.beginPath(); g.moveTo(cx - 55, 440); g.lineTo(cx, 560); g.lineTo(cx + 55, 440); g.closePath(); g.fill();
  g.fillStyle = '#2e8b57'; g.beginPath(); g.moveTo(cx - 34, 452); g.lineTo(cx, 470); g.lineTo(cx - 34, 488); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cx + 34, 452); g.lineTo(cx, 470); g.lineTo(cx + 34, 488); g.closePath(); g.fill();
  g.fillStyle = '#e7b52c'; for (const y of [580, 630, 680]) { g.beginPath(); g.arc(cx, y, 9, 0, 7); g.fill(); }
  // arms (stick)
  g.lineWidth = 12; g.beginPath(); g.moveTo(cx - 140, 560); g.lineTo(cx - 190, 720); g.stroke();
  const ax = cx + 140, ay = 540, ex = ax + 70 + arm * 10, ey = ay - arm * 150 + 120;
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(ex, ey); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(cx - 190, 722, 14, 0, 7); g.fill(); g.beginPath(); g.arc(ex, ey, 14, 0, 7); g.fill();
  // head: big bean, slightly narrower chin
  g.fillStyle = '#f7f3ec'; g.lineWidth = 13;
  g.beginPath(); g.moveTo(cx, 40); g.bezierCurveTo(cx + 250, 40, cx + 245, 400, cx + 30, 430); g.bezierCurveTo(cx - 40, 438, cx - 245, 410, cx - 240, 220); g.bezierCurveTo(cx - 236, 80, cx - 120, 40, cx, 40); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(160,120,110,0.18)'; g.beginPath(); g.ellipse(cx + 120, 300, 90, 120, 0.3, 0, 7); g.fill();
  // eyes + glasses
  const sly = face === 'sly' || face === 'grin';
  for (const [x, s] of [[cx - 80, -1], [cx + 70, 1]] as const) {
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, 230, 44, sly ? 22 : 40, 0, 0, 7); g.fill();
    g.fillStyle = INK; g.beginPath(); g.arc(x + (face === 'think' ? -12 : 8), sly ? 234 : 232, sly ? 14 : 17, 0, 7); g.fill();
    g.strokeStyle = '#5a3a1a'; g.lineWidth = 9; g.beginPath(); g.arc(x, 230, 56, 0, 7); g.stroke();
    // brows
    g.strokeStyle = INK; g.lineWidth = 13; g.beginPath();
    const tilt = face === 'sly' ? s * 18 : face === 'think' ? -s * 10 : face === 'wow' ? 0 : s * 6;
    g.moveTo(x - 46, 160 - tilt - (face === 'wow' ? 20 : 0)); g.lineTo(x + 46, 160 + tilt - (face === 'wow' ? 20 : 0)); g.stroke();
  }
  g.strokeStyle = '#5a3a1a'; g.lineWidth = 8; g.beginPath(); g.moveTo(cx - 24, 226); g.quadraticCurveTo(cx - 5, 214, cx + 14, 226); g.stroke();
  // mouth
  g.strokeStyle = INK; g.lineWidth = 11; g.fillStyle = '#5a1f2a';
  if (face === 'grin' || face === 'sly') {
    g.beginPath(); g.moveTo(cx - 70, 335); g.quadraticCurveTo(cx, 360 + mouthOpen * 40, cx + 75, 320); g.stroke();
    if (face === 'grin') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx - 60, 336); g.quadraticCurveTo(cx, 372, cx + 66, 324); g.lineTo(cx + 60, 312); g.quadraticCurveTo(cx, 345, cx - 56, 325); g.fill(); g.stroke(); }
  } else if (face === 'wow' || mouthOpen > 0.3) {
    g.beginPath(); g.ellipse(cx, 345, 30, 20 + mouthOpen * 18, 0, 0, 7); g.fill(); g.stroke();
  } else {
    g.beginPath(); g.moveTo(cx - 40, 345); g.quadraticCurveTo(cx, 335 + (face === 'think' ? 10 : -6), cx + 40, 345); g.stroke();
  }
}
/** the narrator as a camera-facing flat card (600×1000 design canvas, soles at y 975) */
export const Sage: React.FC<{ pos: number[]; h?: number; face?: Face; talk?: number; arm?: number; f: number }> = ({ pos, h = 1.75, face = 'sly', talk = 0, arm = 0, f }) => {
  const blink = (f % 71) < 3;
  const mo = talk > 0 ? Math.max(0, Math.sin(f * 0.9)) * talk : 0;
  const key = `sage_${face}_${Math.round(mo * 4)}_${Math.round(arm * 4)}_${blink ? 1 : 0}`;
  const tex = canvasTex(key, 600, 1000, (g, w, hh) => { drawSage(g, w, hh, face, mo, arm); if (blink) { g.fillStyle = '#f7f3ec'; g.fillRect(w / 2 - 140, 186, 290, 70); g.strokeStyle = INK; g.lineWidth = 9; for (const x of [w / 2 - 80, w / 2 + 70]) { g.beginPath(); g.moveTo(x - 40, 232); g.lineTo(x + 40, 232); g.stroke(); g.strokeStyle = '#5a3a1a'; g.beginPath(); g.arc(x, 230, 56, 0, 7); g.stroke(); g.strokeStyle = INK; } } });
  const w = h * 0.6;
  const m = useMemo(() => new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.5, roughness: 0.9, side: THREE.DoubleSide }), []);
  m.map = tex; m.needsUpdate = true;
  return (
    <group position={pos as any}>
      <mesh position={[0, h / 2 - h * 0.025, 0]} material={m} castShadow><planeGeometry args={[w, h]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={basic('#1a0e08', { t: 0.35 })}><circleGeometry args={[w * 0.35, 24]} /></mesh>
    </group>
  );
};

// ------------------------------------------------------------------ the evening street
const plaster = (key: string, base: string) => canvasTex(key, 512, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(key.length * 7);
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,60,40' : '255,240,220'},${r() * 0.07})`; g.fillRect(r() * w, r() * h, 2 + r() * 8, 2 + r() * 8); }
  for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h; g.fillStyle = 'rgba(150,80,50,0.35)'; g.fillRect(x, y, 60, 30); g.strokeStyle = 'rgba(80,40,25,0.4)'; g.lineWidth = 2; for (let k = 0; k < 3; k++) g.strokeRect(x + (k % 2) * 30, y + k * 10, 30, 10); }
}, { repeat: true });
const cobble = () => canvasTex('coin_cobble', 512, 512, (g, w, h) => {
  g.fillStyle = '#3c3433'; g.fillRect(0, 0, w, h);
  const r = rng(5);
  for (let j = 0; j < 12; j++) for (let i = -1; i < 9; i++) {
    const x = i * 64 + (j % 2) * 32, y = j * 43;
    g.fillStyle = `hsl(${20 + r() * 20}, ${8 + r() * 10}%, ${38 + r() * 14}%)`; g.beginPath(); (g as any).roundRect(x + 3, y + 3, 58, 37, 12); g.fill();
    g.fillStyle = 'rgba(255,230,200,0.12)'; g.fillRect(x + 10, y + 6, 40, 4);
  }
}, { repeat: true });
const House: React.FC<{ pos: number[]; w: number; h: number; col: string; rotY?: number; seed: number; awning?: string }> = ({ pos, w, h, col, rotY = 0, seed, awning }) => {
  const m = useMemo(() => { const t = plaster('coin_pl_' + col, col).clone(); t.repeat.set(w / 3, h / 3); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 }); }, [col, w, h]);
  const r = rng(seed);
  const cols = Math.max(1, Math.floor(w / 1.6)), rows = Math.max(1, Math.floor((h - 1) / 2.2));
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, -1.5]} material={m} castShadow receiveShadow><boxGeometry args={[w, h, 3]} /></mesh>
      <mesh position={[0, h + 0.12, -1.5]} material={mat('#5a2e1c', { r: 0.9 })} castShadow><boxGeometry args={[w + 0.3, 0.24, 3.3]} /></mesh>
      <mesh position={[0, 0.3, 0.01]} material={mat('#4a3328', { r: 0.95 })}><boxGeometry args={[w, 0.6, 0.06]} /></mesh>
      {Array.from({ length: rows }).map((_, j) => Array.from({ length: cols }).map((_, i) => {
        const x = (i - (cols - 1) / 2) * (w / cols), y = 1.9 + j * 2.2; const lit = r() < 0.55;
        return (
          <group key={j + '_' + i} position={[x, y, 0.02]}>
            <mesh material={mat('#3a2418', { r: 0.8 })}><boxGeometry args={[0.95, 1.35, 0.06]} /></mesh>
            <mesh position={[0, 0, 0.035]} material={lit ? basic('#ffcf7a') : mat('#1f2a3a', { r: 0.3 })}><planeGeometry args={[0.75, 1.15]} /></mesh>
            {lit && <mesh position={[0, 0, 0.04]} material={basic('#ffefc2', { t: 0.0 })}><planeGeometry args={[0.1, 0.1]} /></mesh>}
            <mesh position={[0, 0, 0.045]} material={mat('#3a2418')}><boxGeometry args={[0.05, 1.15, 0.02]} /></mesh>
            <mesh position={[0, -0.78, 0.12]} material={mat('#6b4124')}><boxGeometry args={[1.1, 0.1, 0.3]} /></mesh>
            {r() < 0.6 && [-0.3, 0, 0.3].map((k) => <mesh key={k} position={[k, -0.64, 0.14]} material={mat(['#e84a5f', '#f5c242', '#9b59b6'][Math.floor(r() * 3)], { flat: true })}><icosahedronGeometry args={[0.11, 0]} /></mesh>)}
          </group>
        );
      }))}
      <mesh position={[w * 0.28, 1.15, 0.03]} material={mat('#5a3a22', { r: 0.8 })}><boxGeometry args={[1.1, 2.3, 0.08]} /></mesh>
      {awning && <mesh position={[-w * 0.2, 2.9, 0.6]} rotation={[0.45, 0, 0]} material={mat(awning, { r: 0.9, side: THREE.DoubleSide })} castShadow><planeGeometry args={[2.4, 1.4]} /></mesh>}
      <group position={[w * 0.28 + 0.9, 2.7, 0.25]}>
        <mesh material={mat('#222', { m: 0.6, r: 0.4 })}><boxGeometry args={[0.04, 0.04, 0.5]} /></mesh>
        <mesh position={[0, -0.2, 0.25]} material={basic('#ffd27a')}><sphereGeometry args={[0.1, 12, 10]} /></mesh>
        <sprite position={[0, -0.2, 0.3]} scale={[0.9, 0.9, 1]} material={spr('#ffb64a', { map: radialTex('glow'), add: true, t: 0.8 })} />
        <pointLight position={[0, -0.3, 0.5]} intensity={5} distance={6} color="#ffb35c" />
      </group>
    </group>
  );
};
const Bulbs: React.FC<{ a: number[]; b: number[]; n?: number; f: number }> = ({ a, b, n = 14, f }) => {
  const g = useMemo(() => { const pts = Array.from({ length: 20 }).map((_, i) => { const t = i / 19; return new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 0.7, a[2] + (b[2] - a[2]) * t); }); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.012, 4, false); }, [a.join(), b.join()]);
  return (
    <group>
      <mesh geometry={g} material={mat('#1a1a1a')} />
      {Array.from({ length: n }).map((_, i) => { const t = (i + 0.5) / n; const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 0.7 - 0.08, a[2] + (b[2] - a[2]) * t]; return <group key={i} position={p as any}><mesh material={basic('#ffe4a0')}><sphereGeometry args={[0.05, 8, 6]} /></mesh><sprite scale={[0.35, 0.35, 1]} material={spr('#ffc060', { map: radialTex('glow'), add: true, t: 0.7 + 0.2 * Math.sin(f * 0.1 + i) })} /></group>; })}
    </group>
  );
};
/** street runs along x; the market stall at the origin faces +z; houses line z = −4 (behind) and z = +9 (front, rarely seen) */
export const Street: React.FC<{ f: number }> = ({ f }) => {
  const ground = useMemo(() => { const t = cobble().clone(); t.repeat.set(70, 70); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }); }, []);
  const HOUSES = [[-11, 6.5, 8, '#c98a5a', '#2e6f9e'], [-3.8, 6.2, 9.5, '#d7a86e', '#b3262e'], [3.6, 6.8, 7.5, '#b8735a', undefined], [10.6, 6, 9, '#d9b37a', '#2e8b57'], [17.5, 5, 7.5, '#c2805a', undefined], [-18, 5.5, 8, '#cf9a66', '#b3262e']] as const;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={ground} receiveShadow><planeGeometry args={[120, 120]} /></mesh>
      {HOUSES.map(([x, w, h, c, aw], i) => <House key={i} pos={[x, 0, -4]} w={w} h={h} col={c} seed={i + 3} awning={aw} />)}
      {HOUSES.map(([x, w, h, c], i) => <House key={'f' + i} pos={[x + 2, 0, 13]} w={w} h={h * 0.9} col={c} seed={i + 30} rotY={Math.PI} />)}
      <Bulbs a={[-8, 5.5, -4]} b={[-1, 5.2, 9]} f={f} /><Bulbs a={[-1, 5.6, -4]} b={[6, 5.1, 9]} f={f} /><Bulbs a={[6, 5.4, -4]} b={[13, 5.2, 9]} f={f} />
      {[[-6.5, -2.6], [7.5, -2.8]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><mesh position={[0, 0.35, 0]} material={mat('#8a4a2a')}><cylinderGeometry args={[0.35, 0.28, 0.7, 14]} /></mesh><mesh position={[0, 1.4, 0]} scale={[1, 1.6, 1]} material={mat('#3f7d2a', { flat: true })} castShadow><icosahedronGeometry args={[0.7, 1]} /></mesh></group>)}
      {[[-4.5, -2.5], [5, -2.5]].map(([x, z], i) => <group key={'b' + i} position={[x, 0, z]}><mesh position={[0, 0.45, 0]} material={mat('#6b4124')} castShadow><cylinderGeometry args={[0.35, 0.35, 0.9, 14]} /></mesh>{[0.15, 0.75].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat('#2a2a2a', { m: 0.5 })}><torusGeometry args={[0.355, 0.02, 6, 24]} /></mesh>)}</group>)}
    </group>
  );
};
