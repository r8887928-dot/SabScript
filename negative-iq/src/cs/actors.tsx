import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mat, basic, spr, radialTex, canvasTex } from '../three/core';
import { rbox } from '../three/props';
import { Person, randomLook, merge, EXPR, Pose, LookP } from '../three/person';
import { HERO } from '../game/scenes';
import { rng, clamp, lerp, hash } from '../lib/anim';

export { HERO };
/** cartoon toy rifle held in the right hand: barrel along the forearm (−y), orange safety tip */
export const ToyRifle: React.FC = () => (
  <group position={[0, -0.14, 0.04]}>
    <mesh material={mat('#334155', { r: 0.4, m: 0.4 })} castShadow><boxGeometry args={[0.06, 0.5, 0.1]} /></mesh>
    <mesh position={[0, 0.3, -0.02]} material={mat('#b45309', { r: 0.6 })} castShadow><boxGeometry args={[0.055, 0.18, 0.13]} /></mesh>
    <mesh position={[0, -0.16, 0.005]} material={mat('#b45309', { r: 0.6 })}><boxGeometry args={[0.07, 0.16, 0.08]} /></mesh>
    <mesh position={[0, -0.36, 0.02]} material={mat('#1f2937', { r: 0.3, m: 0.6 })}><cylinderGeometry args={[0.016, 0.016, 0.24, 10]} /></mesh>
    <mesh position={[0, -0.49, 0.02]} material={mat('#f97316', { r: 0.4, e: '#f97316', ei: 0.3 })}><cylinderGeometry args={[0.024, 0.024, 0.04, 12]} /></mesh>
    <mesh position={[0, 0.0, -0.08]} rotation={[0.35, 0, 0]} material={mat('#1f2937', { r: 0.5 })}><boxGeometry args={[0.04, 0.08, 0.14]} /></mesh>
  </group>
);
/** the same rifle lying on the ground (world object) */
export const RifleOnGround: React.FC<{ pos: number[]; rotY?: number; glow?: number }> = ({ pos, rotY = 0, glow = 0 }) => (
  <group position={pos as any} rotation={[Math.PI / 2, 0, rotY]} scale={[1.4, 1.4, 1.4]}>
    <group position={[0, 0, -0.06]}><ToyRifle /></group>
    {glow > 0 && <sprite position={[0, -0.1, -0.1]} scale={[1.4 * glow, 1.4 * glow, 1]} material={spr('#ffe14a', { map: radialTex('glow'), add: true, t: 0.5 * glow })} />}
  </group>
);
/** the bomb pack: a box with tape, a small screen and a blinking light */
export const BombPack: React.FC<{ pos?: number[]; rot?: number[]; s?: number; armed?: boolean; f?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], s = 1, armed, f = 0 }) => {
  const scr = useMemo(() => canvasTex('cs_bombscr' + (armed ? 1 : 0), 128, 64, (g, w, h) => { g.fillStyle = '#0b2a12'; g.fillRect(0, 0, w, h); g.fillStyle = armed ? '#ff4444' : '#5dff8a'; g.font = '900 34px "Courier New", monospace'; g.textAlign = 'center'; g.fillText(armed ? '*****' : '7355', w / 2, 44); }), [armed]);
  const on = armed && Math.floor(f / 15) % 2 === 0;
  return (
    <group position={pos as any} rotation={rot as any} scale={[s, s, s]}>
      <mesh geometry={rbox(0.36, 0.14, 0.24, 0.02)} position={[0, 0.07, 0]} material={mat('#6b4423', { r: 0.7 })} castShadow />
      {[-0.1, 0.1].map((x) => <mesh key={x} position={[x, 0.07, 0]} material={mat('#facc15', { r: 0.6 })}><boxGeometry args={[0.04, 0.145, 0.245]} /></mesh>)}
      <mesh position={[0, 0.142, 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={basic('#ffffff', { map: scr })}><planeGeometry args={[0.16, 0.08]} /></mesh>
      <mesh position={[0.13, 0.15, -0.08]} material={basic(on ? '#ff2020' : '#4a0b0b')}><sphereGeometry args={[0.018, 10, 8]} /></mesh>
      {on && <sprite position={[0.13, 0.17, -0.08]} scale={[0.5, 0.5, 1]} material={spr('#ff3030', { map: radialTex('glow'), add: true, t: 0.9 })} />}
      <mesh position={[-0.05, 0.15, -0.07]} rotation={[0, 0, Math.PI / 2]} material={mat('#ef4444', { r: 0.5 })}><cylinderGeometry args={[0.008, 0.008, 0.18, 6]} /></mesh>
    </group>
  );
};
export const Grenade: React.FC<{ pos: number[]; rot?: number }> = ({ pos, rot = 0 }) => (
  <group position={pos as any} rotation={[rot, rot * 0.7, 0]}>
    <mesh material={mat('#9ca3af', { r: 0.4, m: 0.5 })} castShadow><cylinderGeometry args={[0.05, 0.05, 0.14, 12]} /></mesh>
    <mesh position={[0, 0.08, 0]} material={mat('#e5e7eb', { r: 0.3, m: 0.6 })}><cylinderGeometry args={[0.02, 0.03, 0.03, 10]} /></mesh>
  </group>
);

// ------------------------------------------------------------------ characters
const ENEMY_SKIN = ['#c98d66', '#e8b48f', '#8d5a3b', '#f2c7a5', '#b5774f'];
export const enemyLook = (i: number): LookP => randomLook(3100 + i, { skin: ENEMY_SKIN[i % 5], shirt: '#c2410c', pants: '#3f3f46', shoes: '#2a2a2a', hairStyle: 'bald' });
/** enemy headgear: helmet + orange bandana (head-centre coordinates) */
export const EnemyHelmet: React.FC = () => (
  <group>
    <mesh position={[0, 0.07, -0.01]} material={mat('#57534e', { r: 0.6 })} castShadow><sphereGeometry args={[0.235, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
    <mesh position={[0, 0.06, -0.01]} rotation={[Math.PI / 2, 0, 0]} material={mat('#44403c', { r: 0.6 })}><torusGeometry args={[0.235, 0.025, 8, 32]} /></mesh>
    <mesh position={[0, -0.12, 0.14]} rotation={[0.3, 0, 0]} material={mat('#f97316', { r: 0.8 })}><boxGeometry args={[0.36, 0.1, 0.14]} /></mesh>
  </group>
);
/** the hero's earpiece + vest look comes from the HERO look; give him a cap of hair only */
export const aimPose = (extra: Pose = {}): Pose => merge({ armR: [1.55, 0.05, 0.05], armL: [1.45, -0.25, 0.65], body: [0.06, 0, 0] }, extra);
export const crouch = (extra: Pose = {}): Pose => merge({ legL: 1.2, legR: 0.9, kneeL: 1.9, kneeR: 1.7, y: -0.42, body: [0.25, 0, 0] }, extra);
export const kneel = (extra: Pose = {}): Pose => merge({ legL: 1.4, legR: 0.1, kneeL: 1.4, kneeR: 1.6, y: -0.38, body: [0.35, 0, 0] }, extra);
/** sitting flat on the ground (landed on the butt), hands behind for support */
export const sitGround = (extra: Pose = {}): Pose => merge({ legL: 1.5, legR: 1.35, kneeL: 0.2, kneeR: 0.45, y: -0.62, body: [-0.12, 0, 0], armL: [-0.55, 0.45, 0.15], armR: [-0.55, 0.45, 0.15] }, extra);
export const fall = (f: number): Pose => ({ armL: [0.4, 2.2 + Math.sin(f * 0.6) * 0.4, 0.4], armR: [0.4, 2.2 + Math.cos(f * 0.6) * 0.4, 0.4], legL: Math.sin(f * 0.5) * 0.6, legR: -Math.sin(f * 0.5) * 0.6, kneeL: 0.5, kneeR: 0.5 });

// ------------------------------------------------------------------ effects
/** expanding puffs (dust, poof, smoke) — t: 0..1 progress */
export const Puffs: React.FC<{ pos: number[]; t: number; n?: number; r?: number; col?: string; o?: number; up?: number; seed?: number; s?: number }> = ({ pos, t, n = 14, r = 1.6, col = '#e8d3a8', o = 0.85, up = 0.6, seed = 1, s = 1.1 }) => {
  const pts = useMemo(() => { const q = rng(seed); return Array.from({ length: n }).map(() => [q() * Math.PI * 2, 0.4 + q() * 0.6, q()]); }, [n, seed]);
  if (t <= 0 || t >= 1) return null;
  const e = 1 - Math.pow(1 - t, 3);
  return <>{pts.map(([a, d, k], i) => <sprite key={i} position={[pos[0] + Math.cos(a) * d * r * e, pos[1] + 0.2 + k * up * e, pos[2] + Math.sin(a) * d * r * e]} scale={[s * (0.6 + e), s * (0.6 + e), 1]} material={spr(col, { map: radialTex('puff', 'rgba(255,255,255,1)', 'rgba(255,255,255,0)', 0.35), t: o * (1 - t) })} />)}</>;
};
/** a dense smoke cloud that grows and stays */
export const SmokeCloud: React.FC<{ pos: number[]; t: number; f: number; o?: number }> = ({ pos, t, f, o = 0.75 }) => {
  const pts = useMemo(() => { const q = rng(19); return Array.from({ length: 40 }).map(() => [(q() - 0.5) * 2, q(), (q() - 0.5) * 2, q() * 6]); }, []);
  if (t <= 0) return null;
  const g = Math.min(1, t);
  return <>{pts.map(([x, y, z, ph], i) => <sprite key={i} position={[pos[0] + x * 2.6 * g + Math.sin(f * 0.02 + ph) * 0.2, pos[1] + 0.4 + y * 2.6 * g, pos[2] + z * 2.6 * g]} scale={[2.4 * g + 0.4, 2.4 * g + 0.4, 1]} material={spr('#f1f5f9', { map: radialTex('puff', 'rgba(255,255,255,1)', 'rgba(255,255,255,0)', 0.35), t: o })} />)}</>;
};
export const MuzzleFlash: React.FC<{ pos: number[]; on: boolean; s?: number }> = ({ pos, on, s = 0.6 }) => on ? (
  <>
    <sprite position={pos as any} scale={[s, s, 1]} material={spr('#ffd27a', { map: radialTex('glow'), add: true, t: 1 })} />
    <sprite position={pos as any} scale={[s * 0.4, s * 0.4, 1]} material={spr('#ffffff', { map: radialTex('glow'), add: true, t: 1 })} />
    <pointLight position={pos as any} intensity={6} distance={4} color="#ffb347" />
  </>
) : null;
export const Tracer: React.FC<{ a: number[]; b: number[]; on: boolean }> = ({ a, b, on }) => {
  if (!on) return null;
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b);
  const d = Bv.clone().sub(A); const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <mesh position={A.clone().add(d.multiplyScalar(0.5))} quaternion={q} material={basic('#fff3b0', { add: true, t: 0.9 })}><cylinderGeometry args={[0.012, 0.012, len, 6]} /></mesh>;
};
/** little stars circling (headshot) */
export const Stars: React.FC<{ pos: number[]; f: number; o?: number }> = ({ pos, f, o = 1 }) => (
  <>{Array.from({ length: 5 }).map((_, i) => { const a = f * 0.25 + (i / 5) * Math.PI * 2; return <sprite key={i} position={[pos[0] + Math.cos(a) * 0.35, pos[1] + Math.sin(f * 0.3 + i) * 0.05, pos[2] + Math.sin(a) * 0.35]} scale={[0.16, 0.16, 1]} material={spr('#ffe14a', { map: radialTex('glow'), add: true, t: o })} />; })}</>
);
export const Confetti: React.FC<{ f: number; t0: number; center?: number[] }> = ({ f, t0, center = [0, 0, 0] }) => {
  const pts = useMemo(() => { const q = rng(9); return Array.from({ length: 70 }).map(() => [(q() - 0.5) * 6, 4 + q() * 3, (q() - 0.5) * 4, q() * 6, Math.floor(q() * 5)]); }, []);
  const l = f - t0; if (l < 0) return null;
  const cols = ['#ff2bd6', '#22d3ee', '#facc15', '#4ade80', '#f97316'];
  return <>{pts.map(([x, y, z, ph, c], i) => <mesh key={i} position={[center[0] + x + Math.sin(l * 0.1 + ph) * 0.3, center[1] + y - l * 0.05 * (1 + (i % 3) * 0.3), center[2] + z]} rotation={[l * 0.2 + ph, l * 0.15, ph]} material={basic(cols[c], { side: THREE.DoubleSide })}><planeGeometry args={[0.12, 0.08]} /></mesh>)}</>;
};

/** a cartoon arm reaching out of a screen: `len` 0..1 how far it is out, `grip` 0..1 fingers closed */
export const ScreenArm: React.FC<{ len: number; grip: number; pos: number[]; dir?: number[] }> = ({ len, grip, pos }) => {
  const skin = mat('#e8b48f', { r: 0.65 });
  const sleeve = mat('#1f2937', { r: 0.8 });
  const L = 0.9 * len;
  return (
    <group position={pos as any}>
      {L > 0.02 && <mesh position={[0, 0, L / 2]} rotation={[Math.PI / 2, 0, 0]} material={sleeve} castShadow><capsuleGeometry args={[0.07, Math.max(0.01, L - 0.14), 6, 12]} /></mesh>}
      {L > 0.15 && <group position={[0, 0, L + 0.04]}>
        <mesh scale={[1, 0.6, 1.1]} material={skin} castShadow><sphereGeometry args={[0.08, 16, 12]} /></mesh>
        {[-0.045, -0.015, 0.015, 0.045].map((x, i) => <mesh key={i} position={[x, 0.01, 0.07]} rotation={[0.3 + grip * 1.4, 0, 0]} material={skin}><capsuleGeometry args={[0.016, 0.07, 4, 8]} /></mesh>)}
        <mesh position={[-0.08, -0.02, 0.03]} rotation={[0.2, 0.6, 0.8]} material={skin}><capsuleGeometry args={[0.018, 0.06, 4, 8]} /></mesh>
      </group>}
    </group>
  );
};
export { Person, EXPR, merge, clamp, lerp, hash };
