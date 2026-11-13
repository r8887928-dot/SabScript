import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mat, basic, spr, radialTex, canvasTex } from '../three/core';
import { rbox, Glow } from '../three/props';
import { Person, randomLook, merge, EXPR, idle, walk, LookP, Pose } from '../three/person';
import { rng, hash } from '../lib/anim';

export const MAG = '#ff2bd6', CYAN = '#22d3ee', VIO = '#8b5cf6';

// ------------------------------------------------------------------ VR gear
/** VR headset on a Person's head (head-centre coordinates) */
export const Headset: React.FC<{ col?: string }> = ({ col = CYAN }) => (
  <group>
    <mesh geometry={rbox(0.3, 0.15, 0.13, 0.04)} position={[0, 0.04, 0.2]} material={mat('#16161e', { r: 0.25, m: 0.5 })} castShadow />
    <mesh position={[0, 0.04, 0.268]} material={mat('#0a0a10', { r: 0.08, m: 0.6 })}><boxGeometry args={[0.27, 0.12, 0.004]} /></mesh>
    <mesh position={[0, -0.03, 0.27]} material={basic(col)}><boxGeometry args={[0.24, 0.008, 0.004]} /></mesh>
    <mesh position={[0, 0.04, -0.01]} rotation={[Math.PI / 2, 0, 0]} material={mat('#22222a', { r: 0.6 })}><torusGeometry args={[0.215, 0.022, 8, 40]} /></mesh>
    <mesh position={[0, 0.16, 0.0]} rotation={[0, Math.PI / 2, 0]} material={mat('#22222a', { r: 0.6 })}><torusGeometry args={[0.2, 0.018, 8, 30, Math.PI]} /></mesh>
  </group>
);
/** hand controller (Person hand prop) */
export const Controller: React.FC<{ col?: string }> = ({ col = CYAN }) => (
  <group rotation={[0.4, 0, 0]}>
    <mesh position={[0, -0.04, 0]} material={mat('#16161e', { r: 0.3, m: 0.4 })}><cylinderGeometry args={[0.022, 0.026, 0.12, 12]} /></mesh>
    <mesh position={[0, 0.04, 0.02]} rotation={[0.6, 0, 0]} material={mat('#16161e', { r: 0.3, m: 0.4 })}><torusGeometry args={[0.05, 0.01, 8, 24]} /></mesh>
    <mesh position={[0, 0.04, 0.02]} rotation={[0.6, 0, 0]} material={basic(col)}><torusGeometry args={[0.05, 0.003, 6, 24]} /></mesh>
  </group>
);
/** a big hero headset for close-ups (front faces +z) */
export const BigHeadset: React.FC<{ glow: number; col?: string }> = ({ glow, col = CYAN }) => (
  <group>
    <mesh geometry={rbox(2.4, 1.2, 1.0, 0.32)} material={new THREE.MeshPhysicalMaterial({ color: '#0d0d14', roughness: 0.15, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08 })} castShadow />
    <mesh position={[0, 0, 0.505]} material={new THREE.MeshPhysicalMaterial({ color: '#05050a', roughness: 0.04, metalness: 0.8, clearcoat: 1 })}><boxGeometry args={[2.1, 0.95, 0.01]} /></mesh>
    <mesh position={[0, -0.55, 0.48]} material={basic(col, { t: 0.4 + 0.6 * glow })}><boxGeometry args={[1.9, 0.04, 0.02]} /></mesh>
    {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 1.21, 0, 0]} material={basic(sd < 0 ? MAG : col, { t: 0.4 + 0.6 * glow })}><boxGeometry args={[0.02, 0.5, 0.6]} /></mesh>)}
    {/* strap */}
    <mesh position={[0, 0, -0.9]} rotation={[Math.PI / 2, 0, 0]} material={mat('#23232c', { r: 0.6 })} scale={[1.25, 1, 1]}><torusGeometry args={[1.0, 0.09, 10, 48, Math.PI]} /></mesh>
    {/* lenses (seen from behind the face, visible through the visor as glow) */}
    {[-0.55, 0.55].map((x) => <sprite key={x} position={[x, 0, 0.52]} scale={[0.9 * glow, 0.9 * glow, 1]} material={spr(col, { map: radialTex('glow'), add: true, t: 0.7 * glow })} />)}
  </group>
);

// ------------------------------------------------------------------ people
export const VR_LOOKS = [
  randomLook(2001, { hairStyle: 'short', shirt: '#7c3aed' }), randomLook(2002, { hairStyle: 'long', shirt: '#ec4899' }), randomLook(2003, { hairStyle: 'cap', hat: '#22d3ee', shirt: '#0ea5e9' }),
  randomLook(2004, { hairStyle: 'curly', shirt: '#f59e0b' }), randomLook(2005, { hairStyle: 'bun', shirt: '#10b981' }), randomLook(2006, { hairStyle: 'short', shirt: '#ef4444', kid: true }),
  randomLook(2007, { hairStyle: 'long', shirt: '#a855f7', kid: true }),
];
/** a player in VR: headset + two controllers */
export const VRPlayer: React.FC<{ look: LookP; pos: number[]; rotY?: number; pose?: Pose; col?: string; ctrl?: boolean }> = ({ look, pos, rotY = 0, pose = {}, col = CYAN, ctrl = true }) => (
  <Person look={look} pos={pos} rotY={rotY} pose={pose} onHead={<Headset col={col} />} propL={ctrl ? <Controller col={col} /> : null} propR={ctrl ? <Controller col={MAG} /> : null} />
);
export const glove = (col = '#e11d48') => (
  <group position={[0, -0.03, 0.02]}>
    <mesh scale={[1, 1.15, 1.1]} material={mat(col, { r: 0.35 })} castShadow><sphereGeometry args={[0.085, 18, 14]} /></mesh>
    <mesh position={[0, 0.08, 0]} material={mat('#f8fafc', { r: 0.5 })}><cylinderGeometry args={[0.06, 0.065, 0.06, 14]} /></mesh>
  </group>
);
export const rifle = () => (
  <group rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0.12]}>
    <mesh material={mat('#1f2937', { r: 0.4, m: 0.6 })}><boxGeometry args={[0.05, 0.6, 0.08]} /></mesh>
    <mesh position={[0, 0.34, 0]} material={mat('#111827', { r: 0.3, m: 0.7 })}><cylinderGeometry args={[0.012, 0.012, 0.2, 8]} /></mesh>
    <mesh position={[0, 0.05, 0.06]} material={mat('#111827', { r: 0.4 })}><boxGeometry args={[0.03, 0.12, 0.05]} /></mesh>
  </group>
);
export const blaster = (col = '#22d3ee') => (
  <group rotation={[Math.PI / 2, 0, 0]} position={[0, -0.04, 0.1]}>
    <mesh material={mat('#e5e7eb', { r: 0.3, m: 0.4 })}><boxGeometry args={[0.06, 0.32, 0.09]} /></mesh>
    <mesh position={[0, 0.19, 0]} material={basic(col)}><cylinderGeometry args={[0.018, 0.018, 0.06, 10]} /></mesh>
  </group>
);
/** dancing pose, `ph` in radians, `style` 0..2 */
export const dance = (ph: number, style = 0): Pose => {
  const s = Math.sin(ph), c = Math.cos(ph);
  if (style === 1) return { armL: [2.6 + s * 0.3, -0.4, 0.4], armR: [0.4 - s * 0.3, 0.6, 1.2], body: [0, s * 0.25, s * 0.08], legL: Math.max(0, s) * 0.5, kneeL: Math.max(0, s) * 0.6, bob: Math.abs(s) * 0.05, head: [0, s * 0.3, 0] };
  if (style === 2) return { armL: [1.2 + c * 0.6, -0.9, 0.6], armR: [1.2 - c * 0.6, 0.9, 0.6], body: [0.05, 0, s * 0.12], legR: Math.max(0, -s) * 0.5, kneeR: Math.max(0, -s) * 0.6, bob: Math.abs(c) * 0.06 };
  return { armL: [2.9, -0.2 - s * 0.3, 0.2], armR: [2.9, 0.2 + s * 0.3, 0.2], body: [0, c * 0.2, s * 0.1], bob: Math.abs(s) * 0.07, legL: Math.max(0, c) * 0.35, kneeL: Math.max(0, c) * 0.4 };
};

// ------------------------------------------------------------------ props for the game worlds
export const Coin: React.FC<{ pos: number[]; rot?: number[]; s?: number }> = ({ pos, rot = [0, 0, 0], s = 1 }) => (
  <mesh position={pos as any} rotation={rot as any} scale={[s, s, s]} material={mat('#facc15', { r: 0.2, m: 0.95, e: '#7a5a00', ei: 0.3 })} castShadow><cylinderGeometry args={[0.1, 0.1, 0.02, 20]} /></mesh>
);
export const Penguin: React.FC<{ pos: number[]; rotY?: number; ph?: number }> = ({ pos, rotY = 0, ph = 0 }) => (
  <group position={pos as any} rotation={[0, rotY, Math.sin(ph) * 0.12]}>
    <mesh position={[0, 0.3, 0]} scale={[1, 1.25, 0.9]} material={mat('#111827', { r: 0.5 })} castShadow><sphereGeometry args={[0.22, 18, 14]} /></mesh>
    <mesh position={[0, 0.28, 0.11]} scale={[0.85, 1.1, 0.6]} material={mat('#f8fafc', { r: 0.6 })}><sphereGeometry args={[0.2, 18, 14]} /></mesh>
    <mesh position={[0, 0.58, 0]} material={mat('#111827', { r: 0.5 })}><sphereGeometry args={[0.15, 16, 12]} /></mesh>
    <mesh position={[0, 0.56, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={mat('#f97316', { r: 0.4 })}><coneGeometry args={[0.04, 0.1, 10]} /></mesh>
    {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.06, 0.62, 0.12]} material={basic('#ffffff')}><sphereGeometry args={[0.025, 8, 6]} /></mesh>)}
    {[-1, 1].map((sd) => <mesh key={'f' + sd} position={[sd * 0.08, 0.02, 0.06]} material={mat('#f97316', { r: 0.4 })}><boxGeometry args={[0.08, 0.02, 0.12]} /></mesh>)}
  </group>
);
export const CowboyHat: React.FC<{ pos: number[]; rot?: number[]; s?: number }> = ({ pos, rot = [0, 0, 0], s = 1 }) => (
  <group position={pos as any} rotation={rot as any} scale={[s, s, s]}>
    <mesh material={mat('#8b5a2b', { r: 0.7 })}><cylinderGeometry args={[0.32, 0.32, 0.02, 24]} /></mesh>
    <mesh position={[0, 0.1, 0]} material={mat('#8b5a2b', { r: 0.7 })}><cylinderGeometry args={[0.15, 0.17, 0.2, 18]} /></mesh>
    <mesh position={[0, 0.03, 0]} material={mat('#3b2412', { r: 0.6 })}><cylinderGeometry args={[0.172, 0.172, 0.04, 18]} /></mesh>
  </group>
);
export const Log: React.FC<{ pos: number[]; rot?: number[]; len?: number }> = ({ pos, rot = [0, 0, Math.PI / 2], len = 1.2 }) => {
  const end = useMemo(() => canvasTex('logEnd', 128, 128, (g, w, h) => { g.fillStyle = '#d4a373'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a0703c'; g.lineWidth = 3; for (let r = 8; r < 64; r += 9) { g.beginPath(); g.arc(64, 64, r, 0, 7); g.stroke(); } }), []);
  const bark = mat('#6b4423', { r: 0.9 });
  const endM = useMemo(() => new THREE.MeshStandardMaterial({ map: end, roughness: 0.8 }), [end]);
  return <mesh position={pos as any} rotation={rot as any} material={[bark, endM, endM]} castShadow><cylinderGeometry args={[0.16, 0.16, len, 16]} /></mesh>;
};
export const Palm: React.FC<{ pos: number[]; s?: number; seed?: number }> = ({ pos, s = 1, seed = 1 }) => {
  const r = rng(seed);
  const lean = (r() - 0.5) * 0.3;
  return (
    <group position={pos as any} scale={[s, s, s]} rotation={[0, r() * 6, lean]}>
      <mesh position={[0, 1.6, 0]} material={mat('#8b6b3d', { r: 0.9 })}><cylinderGeometry args={[0.09, 0.14, 3.2, 8]} /></mesh>
      {Array.from({ length: 7 }).map((_, i) => <mesh key={i} position={[0, 3.2, 0]} rotation={[0, (i / 7) * Math.PI * 2, 0.9]} material={mat('#16a34a', { r: 0.7, side: THREE.DoubleSide })}><planeGeometry args={[0.35, 1.8]} /></mesh>)}
    </group>
  );
};
/** extruded star */
export const Star: React.FC<{ pos: number[]; s?: number; col?: string; rotZ?: number }> = ({ pos, s = 1, col = '#facc15', rotZ = 0 }) => {
  const g = useMemo(() => {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 0.45 : 1; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
    sh.closePath();
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 }); eg.center(); return eg;
  }, []);
  return <mesh geometry={g} position={pos as any} rotation={[0, 0, rotZ]} scale={[s, s, s]} material={mat(col, { r: 0.25, m: 0.5, e: col, ei: 0.6 })} />;
};
/** neon floor grid texture */
export const gridTex = (col = CYAN, key = 'vrgrid') => canvasTex(key + col, 512, 512, (g, w, h) => {
  g.fillStyle = '#07060f'; g.fillRect(0, 0, w, h);
  g.strokeStyle = col; g.globalAlpha = 0.85; g.lineWidth = 3;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
}, { repeat: true });
export { Glow, hash, merge, EXPR, idle, walk, randomLook };
