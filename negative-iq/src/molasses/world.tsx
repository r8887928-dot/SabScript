import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mat, basic, canvasTex, spr, radialTex, LOOKS } from '../three/core';
import { rng } from '../lib/anim';

// North End harbour street, January 1919 (own cartoon reconstruction). Street runs along z; the tank stands at the
// harbour end (0, 0, −24); the elevated railway runs along x = 4.5 on steel columns; brick blocks line both sides.
export const WINTER = { ...LOOKS.day, sunAz: 30, sunEl: 26, sun: '#ffe6c4', sunI: 3.0, hemiSky: '#c4d8f4', hemiGround: '#8a7a6a', hemiI: 1.0, top: '#4f86cf', hor: '#cfe0f2', bot: '#9fb2c4', fog: '#cfe0f2', fogNear: 30, fogFar: 260, env: 0.5 };
export const SUMMER = { ...LOOKS.day, sunAz: 50, sunEl: 55, sun: '#fff4dc', sunI: 3.2, hemiSky: '#cfe3ff', hemiGround: '#7d8a5c', hemiI: 0.95, top: '#2f7fe0', hor: '#b8d8f6', fog: '#bcd8f2', fogNear: 40, fogFar: 300 };
export const DUSK = { ...LOOKS.golden, sunAz: 200, sunEl: 8, top: '#4b5aa8', hor: '#ffb877', fog: '#e9a880', fogNear: 30, fogFar: 220 };

const INKM = new THREE.MeshBasicMaterial({ color: '#0b0a0c', side: THREE.BackSide });
/** inverted-hull ink: a slightly bigger back-face copy of the geometry */
export const Inked: React.FC<{ geo: React.ReactElement; material: THREE.Material; pos?: number[]; rot?: number[]; k?: number; cast?: boolean }> = ({ geo, material, pos = [0, 0, 0], rot = [0, 0, 0], k = 0.06, cast = true }) => (
  <group position={pos as any} rotation={rot as any}>
    <mesh material={material} castShadow={cast} receiveShadow>{geo}</mesh>
    <mesh material={INKM} scale={[1 + k, 1 + k * 0.5, 1 + k]}>{geo}</mesh>
  </group>
);

const brickTex = (key: string, base: string) => canvasTex(key, 512, 512, (g, w, h) => {
  g.fillStyle = '#6a4a3a'; g.fillRect(0, 0, w, h);
  const r = rng(key.length * 11);
  const bh = 16, bw = 46;
  for (let y = 0, row = 0; y < h; y += bh, row++) for (let x = -(row % 2) * bw / 2; x < w; x += bw) {
    const c = new THREE.Color(base).offsetHSL((r() - 0.5) * 0.02, (r() - 0.5) * 0.08, (r() - 0.5) * 0.08);
    g.fillStyle = c.getStyle(); g.fillRect(x + 2, y + 2, bw - 3, bh - 3);
  }
  for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(40,25,20,${r() * 0.12})`; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 30, 0, 0, 7); g.fill(); }
}, { repeat: true });
const cobbleTex = () => canvasTex('mol_cobble', 512, 512, (g, w, h) => {
  g.fillStyle = '#4a4440'; g.fillRect(0, 0, w, h);
  const r = rng(5);
  for (let j = 0; j < 14; j++) for (let i = -1; i < 10; i++) {
    const x = i * 56 + (j % 2) * 28, y = j * 37;
    g.fillStyle = `hsl(${25 + r() * 20}, ${6 + r() * 8}%, ${44 + r() * 14}%)`; g.beginPath(); (g as any).roundRect(x + 3, y + 3, 50, 31, 10); g.fill();
    g.fillStyle = 'rgba(255,240,220,0.12)'; g.fillRect(x + 9, y + 6, 34, 4);
  }
}, { repeat: true });

const Brick: React.FC<{ pos: number[]; w: number; h: number; d?: number; col: string; face: 1 | -1; seed: number; snow?: number; lit?: number }> = ({ pos, w, h, d = 8, col, face, seed, snow = 1, lit = 0.3 }) => {
  const m = useMemo(() => { const t = brickTex('mol_b_' + col, col).clone(); t.repeat.set(d / 4, h / 4); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); }, [col, d, h]);
  const r = rng(seed);
  const rows = Math.floor((h - 1.5) / 3), cols = Math.max(2, Math.floor(d / 2.6));
  // building is a box w (x) × h × d (z); its street face points along +x·face
  return (
    <group position={pos as any}>
      <Inked geo={<boxGeometry args={[w, h, d]} />} material={m} pos={[0, h / 2, 0]} k={0.012} />
      <mesh position={[0, h + 0.25, 0]} material={mat('#3b2a24', { r: 0.9 })} castShadow><boxGeometry args={[w + 0.5, 0.5, d + 0.5]} /></mesh>
      {snow > 0 && <mesh position={[0, h + 0.52, 0]} material={mat('#f4f7fb', { r: 0.95 })}><boxGeometry args={[w + 0.4, 0.06, d + 0.4]} /></mesh>}
      {[-d * 0.3, d * 0.25].map((z, i) => <group key={i} position={[(r() - 0.5) * w * 0.4, h + 1, z]}><mesh material={mat('#5a3a2e')} castShadow><boxGeometry args={[0.8, 2, 0.8]} /></mesh>{snow > 0 && <mesh position={[0, 1.03, 0]} material={mat('#f4f7fb')}><boxGeometry args={[0.85, 0.08, 0.85]} /></mesh>}</group>)}
      {Array.from({ length: rows }).map((_, j) => Array.from({ length: cols }).map((_, i) => {
        const z = (i - (cols - 1) / 2) * (d / cols), y = 2.6 + j * 3; const on = r() < lit;
        return (
          <group key={j + '_' + i} position={[face * (w / 2 + 0.01), y, z]} rotation={[0, face * Math.PI / 2, 0]}>
            <mesh material={mat('#e9dcc6', { r: 0.9 })}><boxGeometry args={[1.25, 1.85, 0.08]} /></mesh>
            <mesh position={[0, 0, 0.05]} material={on ? basic('#ffd88a') : mat('#24324a', { r: 0.25, m: 0.2 })}><planeGeometry args={[1.0, 1.6]} /></mesh>
            <mesh position={[0, 0, 0.07]} material={mat('#e9dcc6')}><boxGeometry args={[0.06, 1.6, 0.02]} /></mesh>
            <mesh position={[0, 0.2, 0.07]} material={mat('#e9dcc6')}><boxGeometry args={[1.0, 0.06, 0.02]} /></mesh>
            {snow > 0 && <mesh position={[0, -0.95, 0.12]} material={mat('#f4f7fb')}><boxGeometry args={[1.3, 0.07, 0.24]} /></mesh>}
          </group>
        );
      }))}
      <group position={[face * (w / 2 + 0.02), 0, d * 0.28]} rotation={[0, face * Math.PI / 2, 0]}>
        <mesh position={[0, 1.2, 0]} material={mat('#3a2418')}><boxGeometry args={[1.3, 2.4, 0.08]} /></mesh>
        <mesh position={[0, 2.7, 0.1]} material={mat(['#2e5a3a', '#7a1f1f', '#1f3a6e'][seed % 3], { r: 0.9 })}><boxGeometry args={[2.6, 0.55, 0.2]} /></mesh>
      </group>
    </group>
  );
};

/** elevated railway: columns every 6 m along x = 4.5; bend[i] 0..1 bends column i */
export const ElRail: React.FC<{ bend?: (i: number) => number; z0?: number; z1?: number }> = ({ bend = () => 0, z0 = -14, z1 = 50 }) => {
  const steel = useMemo(() => mat('#3d4a52', { r: 0.55, m: 0.55 }), []);
  const n = Math.floor((z1 - z0) / 6);
  return (
    <group position={[4.5, 0, 0]}>
      {Array.from({ length: n + 1 }).map((_, i) => {
        const z = z0 + i * 6, b = bend(i);
        return (
          <group key={i} position={[0, 0, z]}>
            <group rotation={[b * 0.5, 0, -b * 0.25]}>
              <Inked geo={<boxGeometry args={[0.35, 6.4, 0.35]} />} material={steel} pos={[-1.2, 3.2, 0]} k={0.05} />
              <Inked geo={<boxGeometry args={[0.35, 6.4, 0.35]} />} material={steel} pos={[1.2, 3.2, 0]} k={0.05} />
              <mesh position={[0, 6.3, 0]} material={steel} castShadow><boxGeometry args={[3.2, 0.4, 0.4]} /></mesh>
              {[-1, 1].map((s) => <mesh key={s} position={[s * 0.6, 4.8, 0]} rotation={[0, 0, s * 0.9]} material={steel}><boxGeometry args={[0.12, 2.6, 0.12]} /></mesh>)}
            </group>
          </group>
        );
      })}
      <Inked geo={<boxGeometry args={[3.4, 0.6, z1 - z0]} />} material={steel} pos={[0, 6.8, (z0 + z1) / 2]} k={0.01} />
      {[-0.7, 0.7].map((x) => <mesh key={x} position={[x, 7.15, (z0 + z1) / 2]} material={mat('#6b6b6b', { m: 0.7, r: 0.4 })}><boxGeometry args={[0.12, 0.12, z1 - z0]} /></mesh>)}
      <mesh position={[0, 7.13, (z0 + z1) / 2]} material={mat('#f4f7fb')}><boxGeometry args={[3.0, 0.04, z1 - z0]} /></mesh>
    </group>
  );
};

/** the giant tank. paint 0 grey + leaks → 1 brown. burst 0..1 throws the wall panels outward */
export const Tank: React.FC<{ paint?: number; burst?: number; shake?: number; f?: number }> = ({ paint = 1, burst = 0, shake = 0, f = 0 }) => {
  const R = 9, H = 14.6, N = 16;
  const tex = useMemo(() => canvasTex('mol_tank_' + Math.round(paint * 4), 1024, 512, (g, w, h) => {
    const base = new THREE.Color('#8a8f94').lerp(new THREE.Color('#5a3417'), paint);
    g.fillStyle = base.getStyle(); g.fillRect(0, 0, w, h);
    for (let y = 40; y < h; y += 64) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, y, w, 3); for (let x = 8; x < w; x += 22) { g.fillStyle = 'rgba(30,20,10,0.6)'; g.beginPath(); g.arc(x, y - 8, 3, 0, 7); g.fill(); g.beginPath(); g.arc(x, y + 10, 3, 0, 7); g.fill(); } }
    for (let x = 0; x < w; x += w / 16) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, 0, 3, h); }
    const r = rng(9);
    for (let i = 0; i < 26; i++) { const x = r() * w, y = 60 + r() * h * 0.6; const a = 1 - paint * 0.92; g.fillStyle = `rgba(70,30,8,${0.75 * a})`; g.beginPath(); g.moveTo(x - 4, y); g.quadraticCurveTo(x, y + 80 + r() * 120, x + 4, y); g.fill(); g.beginPath(); g.ellipse(x, y + 100 + r() * 100, 7, 10, 0, 0, 7); g.fill(); }
  }), [paint]);
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.35 }), [tex]);
  const sx = shake ? Math.sin(f * 2.3) * 0.06 * shake : 0;
  if (burst <= 0) {
    return (
      <group position={[sx, 0, -24]}>
        <Inked geo={<cylinderGeometry args={[R, R, H, 48, 1, true]} />} material={m} pos={[0, H / 2, 0]} k={0.01} />
        <Inked geo={<coneGeometry args={[R + 0.2, 2.4, 48]} />} material={mat('#4a4f54', { r: 0.6, m: 0.4 })} pos={[0, H + 1.2, 0]} k={0.02} />
        <mesh position={[0, H + 1.25, 0]} material={mat('#f4f7fb')}><coneGeometry args={[R * 0.75, 1.9, 48]} /></mesh>
        {Array.from({ length: 10 }).map((_, i) => <mesh key={i} position={[R + 0.15, 1 + i * 1.4, 0]} rotation={[0, 0, 0]} material={mat('#2b2b2b', { m: 0.6 })}><boxGeometry args={[0.08, 0.08, 0.9]} /></mesh>)}
      </group>
    );
  }
  return (
    <group position={[0, 0, -24]}>
      {Array.from({ length: N }).map((_, i) => {
        const a = (i / N) * Math.PI * 2, out = burst * (6 + (i % 3) * 3), up = burst * (i % 2 ? 2.5 : 0.8) - burst * burst * 2;
        return (
          <group key={i} position={[Math.sin(a) * (R + out), H / 2 + Math.max(-H / 2 + 0.5, up), Math.cos(a) * (R + out)]} rotation={[burst * (i % 2 ? 0.6 : -0.4), a, burst * (i % 3 - 1) * 0.5]}>
            <mesh material={m} castShadow><boxGeometry args={[(2 * Math.PI * R) / N + 0.05, H, 0.25]} /></mesh>
          </group>
        );
      })}
    </group>
  );
};

/** flying rivets (bullets) from the tank seam at t (frames since burst) */
export const Rivets: React.FC<{ t: number }> = ({ t }) => (
  <group position={[0, 0, -24]}>{t > 0 && Array.from({ length: 30 }).map((_, i) => { const r = rng(i + 7); const a = (r() - 0.5) * 2.6, el = r() * 0.6; const d = t * (0.9 + r() * 0.8); return (
    <group key={i} position={[Math.sin(a) * (9 + d), 2 + r() * 11 + el * d * 0.3 - d * d * 0.002, Math.cos(a) * (9 + d)]}>
      <mesh material={mat('#2b2b2b', { m: 0.7 })}><sphereGeometry args={[0.12, 6, 5]} /></mesh>
      <mesh position={[-Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6]} rotation={[0, a, Math.PI / 2]} material={basic('#ffffff', { t: 0.5 })}><cylinderGeometry args={[0.03, 0.01, 1.2, 4]} /></mesh>
    </group>); })}</group>
);

/** the molasses wave: front at z = front (moving +z), crest height h; behind it a flood at depth d */
export const Wave: React.FC<{ front: number; h: number; d?: number; f: number; width?: number; from?: number }> = ({ front, h, d = 1.2, f, width = 22, from = -30 }) => {
  const len = Math.max(1, front - from + 4);
  const geo = useMemo(() => new THREE.PlaneGeometry(width, 1, 60, 120), [width]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = (i % 61) / 60, v = Math.floor(i / 61) / 120;
    const x = (u - 0.5) * width;
    const z = from + v * len;
    const dz = front - z;
    let y: number;
    if (dz < 0) y = Math.max(0, h * Math.exp(-dz * dz * 0.6) - (-dz) * 0.4); // the steep front
    else y = d + (h - d) * Math.exp(-dz * 0.35);
    y += Math.sin(x * 0.9 + f * 0.25 + z * 0.4) * 0.12 * Math.min(1, y) + Math.sin(z * 1.3 - f * 0.3) * 0.08;
    const curl = dz < 0 && dz > -2 ? (2 + dz) * 0.6 * (y / Math.max(0.1, h)) : 0;
    pos.setXYZ(i, x, Math.max(0.03, y), z + curl);
  }
  pos.needsUpdate = true; geo.computeVertexNormals();
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2108', roughness: 0.16, metalness: 0.12, emissive: '#1a0700', side: THREE.DoubleSide }), []);
  return (
    <group>
      <mesh geometry={geo} material={m} castShadow receiveShadow />
      {Array.from({ length: 14 }).map((_, i) => { const r = rng(i + 31); return <sprite key={i} position={[(r() - 0.5) * width * 0.8, h * (0.7 + r() * 0.3), front + 0.4]} scale={[1.4, 0.5, 1]} material={spr('#ffd9a0', { map: radialTex('glow'), add: true, t: 0.35 })} />; })}
    </group>
  );
};

const Snow: React.FC = () => {
  const patches = useMemo(() => { const r = rng(77); return Array.from({ length: 40 }).map(() => [(r() - 0.5) * 30, (r() - 0.5) * 80 + 10, 0.6 + r() * 2.4, r() * 3]); }, []);
  return <>{patches.map(([x, z, s, a], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, a]} position={[x, 0.015, z]} material={mat('#f2f6fa', { r: 0.95 })} receiveShadow><circleGeometry args={[s, 9]} /></mesh>)}</>;
};
const Harbour: React.FC<{ f: number }> = ({ f }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, -80]} material={mat('#2f5f86', { r: 0.25, m: 0.25 })}><planeGeometry args={[400, 90]} /></mesh>
    {[[-30, -70, 1], [25, -85, 1.3], [-8, -110, 0.9]].map(([x, z, s], i) => (
      <group key={i} position={[x, -0.3 + Math.sin(f * 0.03 + i) * 0.1, z]} scale={[s, s, s]}>
        <mesh position={[0, 1.2, 0]} material={mat('#3a2a2a')}><boxGeometry args={[14, 2.4, 4]} /></mesh>
        <mesh position={[1, 3.4, 0]} material={mat('#e9dcc6')}><boxGeometry args={[6, 2, 3]} /></mesh>
        <mesh position={[1.5, 6, 0]} material={mat('#b3262e')}><cylinderGeometry args={[0.6, 0.6, 3.5, 12]} /></mesh>
      </group>
    ))}
    {Array.from({ length: 16 }).map((_, i) => { const r = rng(i + 50); return <mesh key={'s' + i} position={[-120 + i * 16, 6 + r() * 14, -150]} material={mat('#8a9ab8', { r: 1 })}><boxGeometry args={[12, 12 + r() * 28, 6]} /></mesh>; })}
  </group>
);
/** the whole street. paint: tank colour; mode 'winter' | 'summer' */
export const Boston: React.FC<{ f: number; paint?: number; burst?: number; shake?: number; bend?: (i: number) => number; snow?: number; noTank?: boolean; summer?: boolean }> = ({ f, paint = 1, burst = 0, shake = 0, bend, snow = 1, noTank, summer }) => {
  const ground = useMemo(() => { const t = cobbleTex().clone(); t.repeat.set(30, 60); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }); }, []);
  const BL = [[-12, -6, 14, '#9a4a36'], [-12, 6, 11, '#8a3f2e'], [-12, 18, 16, '#a35a40'], [-12, 30, 12, '#7f3a2c'], [-12, 42, 15, '#9a4a36']] as const;
  const BR = [[14, -2, 12, '#a35a40'], [14, 10, 15, '#8a3f2e'], [14, 22, 11, '#9a4a36'], [14, 34, 14, '#7f3a2c']] as const;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 10]} material={ground} receiveShadow><planeGeometry args={[60, 120]} /></mesh>
      {snow > 0 && <Snow />}
      {BL.map(([x, z, h, c], i) => <Brick key={'l' + i} pos={[x, 0, z]} w={8} h={h} d={11.5} col={c} face={1} seed={i + 1} snow={snow} />)}
      {BR.map(([x, z, h, c], i) => <Brick key={'r' + i} pos={[x, 0, z]} w={8} h={h} d={11.5} col={c} face={-1} seed={i + 11} snow={snow} />)}
      <ElRail bend={bend} />
      {!noTank && <Tank paint={paint} burst={burst} shake={shake} f={f} />}
      <Harbour f={f} />
      {summer && [-6, 6, 18, 30].map((z, i) => <group key={i} position={[-6.5, 0, z]}><mesh position={[0, 1.5, 0]} material={mat('#5a3a22')}><cylinderGeometry args={[0.15, 0.22, 3, 8]} /></mesh><mesh position={[0, 3.6, 0]} material={mat('#4f9a3a', { flat: true })} castShadow><icosahedronGeometry args={[1.6, 1]} /></mesh></group>)}
    </group>
  );
};
