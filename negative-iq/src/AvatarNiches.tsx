import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { AbsoluteFill, useDelayRender } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import '@fontsource/montserrat/900.css';
import { Lights, Cam, LOOKS, mat, basic, spr, radialTex } from './three/core';
import { Person, randomLook, EXPR, merge, Pose, LookP } from './three/person';
import { Earth, StarField, SunGlow } from './three/earth';
import { rng } from './lib/anim';

const S = 1080;
export type Niche = 'space' | 'money' | 'gaming' | 'horror' | 'facts' | 'ai';
export const NICHES: { id: Niche; name: string }[] = [
  { id: 'space', name: '«Что если?» · космос и наука' },
  { id: 'money', name: 'Деньги и бизнес' },
  { id: 'gaming', name: 'Игры' },
  { id: 'horror', name: 'Страшные истории и мистика' },
  { id: 'facts', name: 'Факты и психология' },
  { id: 'ai', name: 'ИИ и технологии' },
];

// ------------------------------------------------------------------ head accessories (head-centre coordinates)
const Sunglasses: React.FC = () => {
  const lens = mat('#0b0b10', { r: 0.12, m: 0.6 });
  const gold = mat('#d4a52a', { r: 0.25, m: 0.9 });
  return (
    <group position={[0, 0.04, 0.2]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.085, 0, 0.02]}>
          <mesh material={lens} scale={[1, 0.72, 0.3]}><sphereGeometry args={[0.075, 24, 16]} /></mesh>
          <mesh material={gold} rotation={[0, 0, 0]} scale={[1, 0.72, 1]}><torusGeometry args={[0.075, 0.008, 8, 32]} /></mesh>
        </group>
      ))}
      <mesh material={gold} position={[0, 0.02, 0.02]}><boxGeometry args={[0.04, 0.012, 0.012]} /></mesh>
      {[-1, 1].map((s) => <mesh key={'t' + s} material={gold} position={[s * 0.18, 0.01, -0.09]} rotation={[0, s * 0.35, 0]}><boxGeometry args={[0.012, 0.012, 0.2]} /></mesh>)}
      <mesh position={[-0.105, 0.025, 0.045]} material={basic('#ffffff', { t: 0.55 })} rotation={[0, 0, 0.5]}><planeGeometry args={[0.05, 0.012]} /></mesh>
    </group>
  );
};
const Helmet: React.FC = () => {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.16, roughness: 0.03, metalness: 0.3, depthWrite: false }), []);
  return (
    <group position={[0, -0.02, 0]}>
      <mesh material={glass} renderOrder={5}><sphereGeometry args={[0.36, 48, 32]} /></mesh>
      <mesh material={basic('#ffffff', { t: 0.55 })} position={[-0.17, 0.17, 0.27]} rotation={[0, -0.5, 0.6]}><planeGeometry args={[0.13, 0.035]} /></mesh>
      <mesh material={mat('#b9c2cf', { r: 0.25, m: 0.8 })} position={[0, -0.31, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.235, 0.028, 16, 48]} /></mesh>
    </group>
  );
};
const Headset: React.FC = () => {
  const shell = mat('#1c1c26', { r: 0.35, m: 0.4 });
  return (
    <group>
      <mesh material={shell} position={[0, 0.02, -0.01]} rotation={[0, 0, 0]}><torusGeometry args={[0.238, 0.03, 12, 40, Math.PI]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.225, 0.0, 0]} rotation={[0, 0, s * Math.PI / 2]}>
          <mesh material={shell}><cylinderGeometry args={[0.085, 0.085, 0.07, 24]} /></mesh>
          <mesh material={basic(s < 0 ? '#ff2bd6' : '#21f0ff')} position={[0, s * -0.037 * 0 + -0.037, 0]}><cylinderGeometry args={[0.062, 0.062, 0.01, 24]} /></mesh>
        </group>
      ))}
      <mesh material={shell} position={[-0.17, -0.11, 0.13]} rotation={[0.9, 0.6, 0.2]}><cylinderGeometry args={[0.012, 0.012, 0.24, 8]} /></mesh>
      <mesh material={mat('#333', { r: 0.6 })} position={[-0.09, -0.15, 0.21]}><sphereGeometry args={[0.025, 12, 10]} /></mesh>
    </group>
  );
};
const Visor: React.FC = () => (
  <group position={[0, 0.035, 0]}>
    <mesh material={basic('#2ef2ff', { t: 0.82, side: THREE.DoubleSide })} rotation={[0, -0.85, 0]}><cylinderGeometry args={[0.218, 0.218, 0.085, 40, 1, true, 0, 1.7]} /></mesh>
    <mesh material={mat('#20283a', { r: 0.3, m: 0.6 })} rotation={[0, -0.95, 0]}><cylinderGeometry args={[0.212, 0.212, 0.11, 40, 1, true, 0, 1.9]} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} material={mat('#9aa6b8', { r: 0.25, m: 0.8 })} position={[s * 0.205, 0, 0.0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.03, 16]} /></mesh>)}
  </group>
);

// ------------------------------------------------------------------ 3D props around the hero
const Coins: React.FC = () => {
  const r = rng(11);
  const items = useMemo(() => Array.from({ length: 16 }).map(() => [(r() - 0.5) * 2.4, 0.6 + r() * 1.9, -0.6 - r() * 1.2, r() * 6, r() * 6, r()]), []);
  return (
    <group>
      {items.map(([x, y, z, a, b, k], i) => k < 0.55
        ? <mesh key={i} position={[x, y, z]} rotation={[a, b, 0]} material={mat('#f5c542', { r: 0.25, m: 0.9 })} castShadow><cylinderGeometry args={[0.1, 0.1, 0.022, 28]} /></mesh>
        : <mesh key={i} position={[x, y, z]} rotation={[a * 0.3, b, a * 0.2]} material={mat('#3fbf6f', { r: 0.6 })} castShadow><boxGeometry args={[0.32, 0.005, 0.15]} /></mesh>)}
    </group>
  );
};
const Bulb: React.FC = () => (
  <group position={[0.02, 0.08, 0]}>
    <mesh material={mat('#fff3b0', { r: 0.1, e: '#ffd23f', ei: 1.6 })}><sphereGeometry args={[0.13, 32, 24]} /></mesh>
    <mesh material={mat('#b8bcc4', { r: 0.3, m: 0.8 })} position={[0, -0.15, 0]}><cylinderGeometry args={[0.06, 0.055, 0.09, 20]} /></mesh>
    {[0, 1, 2].map((i) => <mesh key={i} material={mat('#8a8f98', { r: 0.4, m: 0.8 })} position={[0, -0.12 - i * 0.025, 0]}><torusGeometry args={[0.06, 0.008, 6, 20]} /></mesh>)}
    <sprite scale={[0.9, 0.9, 1]} material={spr('#ffe066', { map: radialTex('glow'), add: true, t: 0.9 })} />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return <mesh key={'r' + i} material={basic('#fff7c2')} position={[Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0]} rotation={[0, 0, a - Math.PI / 2]}><boxGeometry args={[0.022, 0.1, 0.01]} /></mesh>;
    })}
  </group>
);
const HoloRings: React.FC = () => (
  <group position={[0, 1.62, 0]}>
    <mesh rotation={[1.25, 0.2, 0]} material={basic('#2ef2ff', { add: true, t: 0.7, side: THREE.DoubleSide })}><torusGeometry args={[0.42, 0.006, 8, 96]} /></mesh>
    <mesh rotation={[1.4, -0.35, 0.3]} material={basic('#7b5cff', { add: true, t: 0.6, side: THREE.DoubleSide })}><torusGeometry args={[0.48, 0.004, 8, 96]} /></mesh>
    {[0, 1, 2, 3].map((i) => { const a = i * 1.6 + 0.4; return <mesh key={i} position={[Math.cos(a) * 0.42, Math.sin(a) * 0.12, Math.sin(a) * 0.4]} material={basic('#bffaff')}><sphereGeometry args={[0.012, 8, 6]} /></mesh>; })}
  </group>
);
const Flashlight: React.FC = () => (
  <group rotation={[Math.PI / 2 - 0.2, 0, 0]}>
    <mesh material={mat('#2b2b2b', { r: 0.35, m: 0.6 })} position={[0, 0.08, 0]}><cylinderGeometry args={[0.03, 0.03, 0.22, 16]} /></mesh>
    <mesh material={mat('#3a3a3a', { r: 0.3, m: 0.7 })} position={[0, 0.21, 0]}><cylinderGeometry args={[0.05, 0.035, 0.07, 16]} /></mesh>
    <mesh material={basic('#fff6d0')} position={[0, 0.247, 0]}><cylinderGeometry args={[0.045, 0.045, 0.005, 16]} /></mesh>
  </group>
);

// ------------------------------------------------------------------ 2D backgrounds
const svgBg = (inner: string, defs = '') => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1080' viewBox='0 0 1080 1080'><defs>${defs}</defs>${inner}</svg>`)}")`;
function synthwave() {
  let grid = '';
  for (let i = -12; i <= 12; i++) grid += `<line x1='${540 + i * 26}' y1='640' x2='${540 + i * 210}' y2='1080' stroke='#ff3df2' stroke-width='3' opacity='0.8'/>`;
  for (let k = 0; k < 9; k++) { const y = 640 + Math.pow(k / 8, 1.8) * 440; grid += `<line x1='0' y1='${y}' x2='1080' y2='${y}' stroke='#ff3df2' stroke-width='${2 + k * 0.4}' opacity='0.85'/>`; }
  let cuts = '';
  for (let k = 0; k < 6; k++) cuts += `<rect x='300' y='${470 + k * 30}' width='480' height='${4 + k * 3}' fill='#2a0845'/>`;
  return svgBg(`<rect width='1080' height='1080' fill='url(#sky)'/><circle cx='540' cy='470' r='240' fill='url(#sun)'/>${cuts}<rect y='640' width='1080' height='440' fill='#12002b'/>${grid}`,
    `<linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#140033'/><stop offset='0.55' stop-color='#6a0dad'/><stop offset='0.6' stop-color='#ff4fb3'/></linearGradient><linearGradient id='sun' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffe259'/><stop offset='1' stop-color='#ff2f8e'/></linearGradient>`);
}
function horrorBg() {
  let trees = '';
  const r = rng(5);
  for (let i = 0; i < 9; i++) {
    const x = i * 135 + r() * 60 - 30, h = 380 + r() * 260, w = 18 + r() * 16;
    trees += `<path d='M${x} 1080 L${x + w * 0.3} ${1080 - h} L${x + w} 1080 Z' fill='#05070d'/>`;
    for (let b = 0; b < 4; b++) { const y = 1080 - h * (0.45 + b * 0.13), s = (b % 2 ? 1 : -1); trees += `<path d='M${x + w * 0.4} ${y} L${x + w * 0.4 + s * (60 + r() * 50)} ${y - 50 - r() * 40}' stroke='#05070d' stroke-width='${6 - b}' stroke-linecap='round'/>`; }
  }
  return svgBg(`<rect width='1080' height='1080' fill='url(#bg)'/><circle cx='790' cy='260' r='150' fill='url(#moon)'/><circle cx='790' cy='260' r='260' fill='url(#halo)'/>${trees}<rect y='760' width='1080' height='320' fill='url(#fog)'/>`,
    `<linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#120814'/><stop offset='1' stop-color='#2a0d14'/></linearGradient><radialGradient id='moon'><stop offset='0' stop-color='#ffd0c2'/><stop offset='0.7' stop-color='#e2553f'/><stop offset='1' stop-color='#a3241f'/></radialGradient><radialGradient id='halo'><stop offset='0.55' stop-color='#ff5a3c' stop-opacity='0.35'/><stop offset='1' stop-color='#ff5a3c' stop-opacity='0'/></radialGradient><linearGradient id='fog' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6b5a6e' stop-opacity='0'/><stop offset='1' stop-color='#6b5a6e' stop-opacity='0.55'/></linearGradient>`);
}
function circuitBg() {
  const r = rng(9);
  let p = '';
  for (let i = 0; i < 46; i++) {
    let x = Math.round(r() * 27) * 40, y = Math.round(r() * 27) * 40;
    let d = `M${x} ${y}`;
    for (let s = 0; s < 4; s++) { if (r() < 0.5) x += (r() < 0.5 ? -1 : 1) * 80; else y += (r() < 0.5 ? -1 : 1) * 80; d += ` L${x} ${y}`; }
    p += `<path d='${d}' stroke='${r() < 0.7 ? '#2ef2ff' : '#7b5cff'}' stroke-width='3' fill='none' opacity='0.55'/><circle cx='${x}' cy='${y}' r='7' fill='#2ef2ff' opacity='0.8'/>`;
  }
  return svgBg(`<rect width='1080' height='1080' fill='url(#bg)'/>${p}<rect width='1080' height='1080' fill='url(#vg)'/>`,
    `<radialGradient id='bg' cx='0.5' cy='0.4'><stop offset='0' stop-color='#123a66'/><stop offset='1' stop-color='#050a18'/></radialGradient><radialGradient id='vg' cx='0.5' cy='0.42'><stop offset='0.25' stop-color='#050a18' stop-opacity='0.85'/><stop offset='0.5' stop-color='#050a18' stop-opacity='0'/></radialGradient>`);
}

const BG: Record<Niche, () => React.ReactNode> = {
  space: () => <AbsoluteFill style={{ background: 'radial-gradient(circle at 25% 30%, #3b1d6e 0%, #120a2e 45%, #03030a 100%)' }} />,
  money: () => (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 42%, #2ee07a 0%, #0f9b58 38%, #053b23 100%)' }}>
      <AbsoluteFill style={{ background: 'repeating-conic-gradient(from 0deg at 50% 42%, rgba(255,230,120,0.18) 0deg 9deg, rgba(255,230,120,0) 9deg 22deg)' }} />
    </AbsoluteFill>
  ),
  gaming: () => <AbsoluteFill style={{ backgroundImage: synthwave(), backgroundSize: 'cover' }} />,
  horror: () => <AbsoluteFill style={{ backgroundImage: horrorBg(), backgroundSize: 'cover' }} />,
  facts: () => (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #fff3a3 0%, #ffcc1f 40%, #ff8a00 100%)' }}>
      <AbsoluteFill style={{ background: 'repeating-conic-gradient(from 0deg at 50% 40%, rgba(255,255,255,0.28) 0deg 8deg, rgba(255,255,255,0) 8deg 20deg)' }} />
    </AbsoluteFill>
  ),
  ai: () => <AbsoluteFill style={{ backgroundImage: circuitBg(), backgroundSize: 'cover' }} />,
};

// rim / key colours and poses per niche
const CFG: Record<Niche, { rimA: string; rimB: string; key: string; keyI: number; pose: Pose; look?: Partial<LookP> }> = {
  space: { rimA: '#9a7bff', rimB: '#4fc3ff', key: '#ffffff', keyI: 2.4, pose: merge(EXPR.shock, { mouth: 'O', brows: [0.3, -0.3, 0.035], eyeA: [0.008, 0.012], eyeB: [0.008, 0.012] }), look: { shirt: '#e9edf2' } },
  money: { rimA: '#ffe066', rimB: '#7dffb0', key: '#fff4dc', keyI: 2.6, pose: merge(EXPR.happy, { head: [0.0, -0.12, 0.12], brows: [0.25, -0.05, 0.02] }), look: { shirt: '#111318', tie: '#d4a52a' } },
  gaming: { rimA: '#ff2bd6', rimB: '#21f0ff', key: '#f0e6ff', keyI: 2.2, pose: merge(EXPR.happy, { head: [0.02, 0.1, -0.08], eyeA: [-0.006, 0.004], eyeB: [-0.006, 0.004], brows: [0.2, -0.2, 0.02] }), look: { shirt: '#7b2ff7' } },
  horror: { rimA: '#ff4a3a', rimB: '#5a6cff', key: '#ffd9a0', keyI: 0.5, pose: merge(EXPR.shock, { brows: [-0.3, 0.3, 0.03], head: [0.08, 0.05, 0.05], armR: [1.15, -0.25, 1.75] }), look: { shirt: '#2d3436' } },
  facts: { rimA: '#ffffff', rimB: '#fff1b0', key: '#fffaf0', keyI: 2.6, pose: merge(EXPR.happy, { armR: [2.9, -0.1, 0.25], head: [0.02, -0.1, 0.06] }), look: { glasses: true } },
  ai: { rimA: '#2ef2ff', rimB: '#7b5cff', key: '#dff6ff', keyI: 1.8, pose: merge(EXPR.happy, { head: [0.02, -0.06, 0.04] }), look: { shirt: '#1f2a44' } },
};

export const AvatarNiche: React.FC<{ niche?: Niche }> = ({ niche = 'space' }) => {
  const [ready, setReady] = useState(false);
  const { delayRender, continueRender } = useDelayRender();
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => { document.fonts.load('900 40px Montserrat').then(() => { setReady(true); continueRender(h); }); }, []);
  const c = CFG[niche];
  const look = useMemo(() => randomLook(3, { skin: '#f0c4a0', hair: '#3a2416', hairStyle: 'short', shirt: '#3f88c5', ...(c.look || {}) }), [niche]);
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const onHead = niche === 'money' ? <Sunglasses /> : niche === 'space' ? <Helmet /> : niche === 'gaming' ? <Headset /> : niche === 'ai' ? <Visor /> : null;
  return (
    <AbsoluteFill>
      {BG[niche]()}
      {niche === 'space' && (
        <AbsoluteFill>
          <ThreeCanvas width={S} height={S} gl={{ antialias: true, alpha: true }} camera={{ fov: 40, near: 0.1, far: 4000 }}>
            <Lights look={LOOKS.space} shadow={false} noSky noFog />
            <Cam pos={[0, 0, 40]} look={[0, 0, 0]} fov={40} />
            <StarField n={1800} />
            <SunGlow pos={[-300, 260, -500]} s={260} />
            <Earth rot={-1.2} sun={[-0.8, 0.6, 0.5]} r={10} pos={[11, -12, 0]} night={1} />
          </ThreeCanvas>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 44%, ${niche === 'horror' ? 'rgba(255,90,60,0.18)' : 'rgba(255,255,255,0.22)'} 0%, rgba(255,255,255,0) 40%)` }} />
      <AbsoluteFill>
        <ThreeCanvas width={S} height={S} gl={{ antialias: true, alpha: true }} shadows camera={{ fov: 30, near: 0.05, far: 100 }}>
          <Lights look={{ ...LOOKS.morning, sunAz: 30, sunEl: 32, sun: c.key, sunI: c.keyI, hemiI: niche === 'horror' ? 0.12 : 1.0, env: niche === 'horror' ? 0.06 : 0.6 }} center={[0, 1.5, 0]} size={3} noSky noFog />
          <directionalLight position={[-2.6, 2.6, -2.6]} intensity={3.0} color={c.rimA} />
          <directionalLight position={[2.6, 2.4, -2.4]} intensity={2.4} color={c.rimB} />
          {niche !== 'horror' && <pointLight position={[0, 1.7, 1.6]} intensity={1.5} distance={4} color="#ffffff" />}
          {niche === 'horror' && <pointLight position={[0.05, 1.2, 0.4]} intensity={10} distance={1.4} decay={1.2} color="#fff1c4" />}
          <Cam pos={niche === 'facts' ? [0.14, 1.78, 2.45] : [0.14, 1.64, 1.95]} look={niche === 'facts' ? [0, 1.72, 0] : [0, 1.55, 0]} fov={30} />
          {niche === 'money' && <Coins />}
          {niche === 'ai' && <HoloRings />}
          <Person look={look} blob={false} olWidth={0.008} pose={merge({ body: [0.02, 0.1, 0], armL: [0.05, 0.12, 0.15], armR: [0.05, 0.12, 0.15], blink: 0 }, c.pose)}
            onHead={onHead}
            above={niche === 'facts' ? <Bulb /> : null}
            propR={niche === 'horror' ? <Flashlight /> : null} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.32) 100%)' }} />
    </AbsoluteFill>
  );
};
