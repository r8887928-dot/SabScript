import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mat, basic, spr, radialTex, canvasTex } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, merge, EXPR, idle, walk, Pose } from '../three/person';
import { rbox, Glow, Smoke } from '../three/props';
import { StarField } from '../three/earth';
import { shotById } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, smoother, kick, clamp, hash } from '../lib/anim';
import { Text3D } from '../club/kit';
import { Headset, BigHeadset, VRPlayer, VR_LOOKS, glove, rifle, blaster, dance, Coin, Penguin, CowboyHat, Log, Palm, Star, gridTex, MAG, CYAN, VIO } from './props';

const useShot = (id: string) => {
  const f = useCurrentFrame();
  const s = shotById(id) ?? { dur: 90, from: 0, beats: [] };
  const beat = (i: number) => (s.beats && s.beats[i] !== undefined ? Math.round(s.beats[i] * 30) - s.from : 1e9);
  return { f, dur: s.dur as number, p: f / Math.max(1, s.dur), beat };
};
const NEON = { ...LOOKS.studio, top: '#0a0518', hor: '#2a0d4a', bot: '#05030c', fog: '#12071f', fogNear: 8, fogFar: 40, hemiSky: '#a78bfa', hemiGround: '#120a20', hemiI: 0.7, sunI: 0.9, env: 0.4 };

// ------------------------------------------------------------------ 1. the headset
export const VHeadset: React.FC = () => {
  const { f, dur, beat } = useShot('v_headset');
  const off = Math.min(beat(1), dur - 12);
  const glow = f < off ? ramp(f, 4, 24) : clamp(1 - (f - off) / 8);
  const c = camK(f, [{ f: 0, p: [2.4, 0.9, 7.2], l: [0, 0, 0], fov: 40 }, { f: dur, p: [0.9, 0.35, 5.4], l: [0, 0, 0], fov: 40 }]);
  return (
    <Stage>
      <Lights look={NEON} center={[0, 0, 0]} size={6} noSky noFog />
      <Cam {...c} />
      <group rotation={[0.1, -0.35 + f * 0.006, 0]} scale={[0.72, 0.72, 0.72]}><BigHeadset glow={glow} /></group>
      <pointLight position={[-3, 2, 2]} intensity={60} distance={12} color={MAG} />
      <pointLight position={[3, -1, 2]} intensity={60} distance={12} color={CYAN} />
      <pointLight position={[0, 3, 4]} intensity={30} distance={12} color="#ffffff" />
      <directionalLight position={[2, 4, 6]} intensity={2.5} color="#ffffff" />
      {Array.from({ length: 40 }).map((_, i) => { const r = rng(i + 3); return <sprite key={i} position={[(r() - 0.5) * 8, (r() - 0.5) * 6, -2 - r() * 4]} scale={[0.06, 0.06, 1]} material={spr(i % 2 ? MAG : CYAN, { map: radialTex('glow'), add: true, t: 0.6 * glow })} />; })}
    </Stage>
  );
};
// 2. warp tunnel into the game
export const VTunnel: React.FC = () => {
  const { f, dur } = useShot('v_tunnel');
  const z = -f * 1.4;
  return (
    <Stage>
      <Lights look={NEON} center={[0, 0, -20]} size={10} noSky noFog />
      <Cam pos={[0, 0, z]} look={[0, 0, z - 10]} fov={70} roll={f * 1.2} />
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={i} position={[0, 0, -i * 2.2]} rotation={[0, 0, i * 0.3]} material={basic(i % 3 === 0 ? MAG : i % 3 === 1 ? CYAN : VIO, { add: true, t: 0.9 })}>
          <torusGeometry args={[3.2, 0.04, 6, i % 2 ? 6 : 40]} />
        </mesh>
      ))}
      {Array.from({ length: 80 }).map((_, i) => { const r = rng(i + 50); const a = r() * Math.PI * 2, rr = 1 + r() * 2.5; return <mesh key={'s' + i} position={[Math.cos(a) * rr, Math.sin(a) * rr, -r() * 80]} material={basic('#ffffff', { add: true, t: 0.7 })}><boxGeometry args={[0.02, 0.02, 1.5]} /></mesh>; })}
      <sprite position={[0, 0, z - 60]} scale={[30, 30, 1]} material={spr('#ffffff', { map: radialTex('glow'), add: true, t: clamp(f / dur) })} />
    </Stage>
  );
};
/** the VR arena (real world): dark room, glowing floor grid, players in headsets */
const Arena: React.FC<{ f: number; players: { look: any; pos: number[]; rotY?: number; pose?: Pose }[]; col?: string }> = ({ f, players, col = CYAN }) => {
  const tex = useMemo(() => { const t = gridTex(col).clone(); t.repeat.set(6, 6); t.needsUpdate = true; return t; }, [col]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.3, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: 0.6 }), [tex])}><planeGeometry args={[12, 12]} /></mesh>
      {[[0, -6, 0], [-6, 0, Math.PI / 2], [6, 0, -Math.PI / 2]].map(([x, z, ry], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, ry, 0]}>
          <mesh position={[0, 2, 0]} material={mat('#0d0a1a', { r: 0.9 })}><planeGeometry args={[12, 4]} /></mesh>
          {[0.3, 3.6].map((y) => <mesh key={y} position={[0, y, 0.01]} material={basic(i === 0 ? MAG : col, { t: 0.95 })}><planeGeometry args={[12, 0.06]} /></mesh>)}
          {[-4, -2, 0, 2, 4].map((xx) => <mesh key={xx} position={[xx, 2, 0.01]} material={basic(VIO, { t: 0.5 })}><planeGeometry args={[0.04, 3.2]} /></mesh>)}
        </group>
      ))}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={basic(MAG, { t: 0.9 })}><ringGeometry args={[3.9, 4.0, 64]} /></mesh>
      {players.map((p, i) => <VRPlayer key={i} look={p.look} pos={p.pos} rotY={p.rotY ?? 0} pose={p.pose ?? merge(idle(f, i), EXPR.grin)} />)}
      <pointLight position={[0, 3.5, 2]} intensity={12} distance={12} color={VIO} />
      <pointLight position={[-3, 2, -3]} intensity={8} distance={8} color={MAG} />
      <pointLight position={[3, 2, -3]} intensity={8} distance={8} color={col} />
    </group>
  );
};
// 3. logo over the arena
export const VLogo: React.FC = () => {
  const { f, dur } = useShot('v_logo');
  const rise = easeOut(ramp(f, 2, 18));
  const c = camK(f, [{ f: 0, p: [0, 2.6, 8.5], l: [0, 2.4, 0], fov: 50 }, { f: dur, p: [0.8, 2.2, 7], l: [0, 2.5, 0], fov: 48 }]);
  const ppl = [0, 1, 2].map((i) => ({ look: VR_LOOKS[i], pos: [(i - 1) * 1.6, 0, -1 - (i % 2)], rotY: (i - 1) * -0.3, pose: merge(idle(f, i), EXPR.grin, { armL: [1.7 + Math.sin(f * 0.15 + i) * 0.5, 0.5, 0.5], armR: [1.2 - Math.sin(f * 0.15 + i) * 0.4, 0.4, 0.8] }) }));
  return (
    <Stage>
      <Lights look={NEON} center={[0, 1, 0]} size={10} noSky />
      <Cam {...c} />
      <Arena f={f} players={ppl} />
      <Text3D text="GAME" size={0.55} depth={0.18} color="#ffffff" glow={MAG} pos={[0, lerp(1.5, 3.55, rise), 0.6]} />
      <Text3D text="VR ZONE" size={0.55} depth={0.18} color="#ffffff" glow={CYAN} pos={[0, lerp(1.2, 2.8, rise), 0.6]} />
    </Stage>
  );
};
// 4. reality: a player in the arena
export const VReal: React.FC = () => {
  const { f, dur } = useShot('v_real');
  const c = camK(f, [{ f: 0, p: [2.2, 1.8, 3.6], l: [0, 1.3, 0], fov: 44 }, { f: dur, p: [1.6, 1.7, 2.8], l: [0, 1.35, 0], fov: 42 }]);
  const pose = merge(idle(f, 2), EXPR.grin, { armL: [1.5, 0.35, 0.7], armR: [1.9 + Math.sin(f * 0.3) * 0.3, 0.55, 0.5], body: [0.05, Math.sin(f * 0.1) * 0.2, 0] });
  return (
    <Stage>
      <Lights look={NEON} center={[0, 1, 0]} size={8} noSky />
      <Cam {...c} />
      <Arena f={f} players={[{ look: VR_LOOKS[0], pos: [0, 0, 0], pose }]} />
    </Stage>
  );
};
/** a dreamy virtual world: floating islands, crystals, clouds */
const DreamWorld: React.FC<{ f: number }> = ({ f }) => {
  const isl = useMemo(() => { const r = rng(12); return Array.from({ length: 9 }).map(() => [(r() - 0.5) * 30, -1 + r() * 10, -6 - r() * 30, 1 + r() * 3]); }, []);
  return (
    <group>
      <mesh position={[0, -0.3, 0]} material={mat('#4ade80', { r: 0.8 })} receiveShadow><cylinderGeometry args={[4, 2.5, 0.6, 32]} /></mesh>
      <mesh position={[0, -1.4, 0]} material={mat('#7c4a2a', { r: 0.9 })}><coneGeometry args={[2.6, 2.2, 24]} /></mesh>
      {isl.map(([x, y, z, s], i) => (
        <group key={i} position={[x, y + Math.sin(f * 0.03 + i) * 0.3, z]} scale={[s, s, s]}>
          <mesh material={mat('#4ade80', { r: 0.8 })}><cylinderGeometry args={[1, 0.6, 0.3, 16]} /></mesh>
          <mesh position={[0, -0.6, 0]} material={mat('#7c4a2a', { r: 0.9 })}><coneGeometry args={[0.65, 1, 12]} /></mesh>
          {i % 2 === 0 && <mesh position={[0.2, 0.55, 0]} material={mat(i % 4 ? MAG : CYAN, { r: 0.1, e: i % 4 ? MAG : CYAN, ei: 0.8 })}><octahedronGeometry args={[0.35, 0]} /></mesh>}
        </group>
      ))}
      {[[-1.6, 0], [1.8, -0.6]].map(([x, z], i) => <mesh key={i} position={[x, 0.7, z]} rotation={[0, f * 0.02, 0]} material={mat(i ? CYAN : MAG, { r: 0.1, e: i ? CYAN : MAG, ei: 0.9 })}><octahedronGeometry args={[0.4, 0]} /></mesh>)}
      <pointLight position={[0, 3, 3]} intensity={10} distance={15} color="#fff1d6" />
    </group>
  );
};
const SKY = { ...LOOKS.morning, top: '#3b82f6', hor: '#f9a8d4', bot: '#a78bfa', fog: '#f5d0fe', fogNear: 20, fogFar: 120, hemiSky: '#e0e7ff', hemiI: 1.0 };
// 5. «Ты в ней живёшь» — the same player inside the game
export const VVirtual: React.FC = () => {
  const { f, dur } = useShot('v_virtual');
  const c = camK(f, [{ f: 0, p: [1.6, 1.7, 2.8], l: [0, 1.35, 0], fov: 42 }, { f: dur, p: [3.4, 2.6, 5.4], l: [0, 1.2, -2], fov: 50 }]);
  const pose = merge(idle(f, 2), EXPR.grin, { armL: [0.25, 2.5, 0.1], armR: [0.25, 2.5, 0.1] });
  return (
    <Stage>
      <Lights look={SKY} center={[0, 1, 0]} size={12} frame={f} />
      <Cam {...c} />
      <DreamWorld f={f} />
      <VRPlayer look={VR_LOOKS[0]} pos={[0, 0, 0]} pose={pose} />
    </Stage>
  );
};
// 6. world select: the dream world behind the cards
export const VSelect: React.FC = () => {
  const { f } = useShot('v_select');
  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'blur(6px) brightness(0.6)', transform: 'scale(1.05)' }}>
      <Stage>
        <Lights look={SKY} center={[0, 1, 0]} size={12} frame={f} />
        <Cam pos={[Math.sin(f * 0.02) * 4, 3, 8]} look={[0, 1, -6]} fov={55} />
        <DreamWorld f={f} />
      </Stage>
    </div>
  );
};

// ------------------------------------------------------------------ the games
const scoreTex = (a: number, b: number) => canvasTex(`score${a}${b}`, 256, 96, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#facc15'; g.font = '900 72px Montserrat'; g.textAlign = 'center'; g.fillText(`${a} : ${b}`, w / 2, 74); });
// Кибербокс — rooftop boxing
export const VCyberbox: React.FC = () => {
  const { f, dur, beat } = useShot('v_cyberbox');
  const hit = Math.min(beat(1), dur - 20);
  const swing = Math.sin(f * 0.5);
  const bagA = (f >= hit ? Math.sin((f - hit) * 0.4) * Math.exp(-(f - hit) * 0.06) * 0.5 : 0) + Math.sin(f * 0.1) * 0.05;
  const c = camK(f, [{ f: 0, p: [2.6, 2.3, 3.4], l: [0, 1.3, -0.5], fov: 48 }, { f: dur, p: [1.8, 1.9, 2.6], l: [0, 1.4, -0.5], fov: 46 }]);
  return (
    <Stage>
      <Lights look={LOOKS.day} center={[0, 1, 0]} size={12} frame={f} />
      <Cam pos={[c.pos[0] + kick(f, hit, 6) * 0.05, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <group position={[-60, -110, -80]}><City seed={7} near={3} far={7} /></group>
      <mesh position={[0, -0.25, 0]} material={mat('#475569', { r: 0.8 })} receiveShadow><boxGeometry args={[9, 0.5, 9]} /></mesh>
      {[[0, -4.4, 0], [-4.4, 0, Math.PI / 2], [4.4, 0, Math.PI / 2]].map(([x, z, r], i) => <mesh key={i} position={[x, 0.5, z]} rotation={[0, r, 0]} material={basic(i ? CYAN : MAG, { t: 0.9 })}><boxGeometry args={[9, 0.05, 0.05]} /></mesh>)}
      <group position={[0, 2.6, -1.4]} rotation={[bagA * 0.6, 0, bagA * 0.3]}>
        <mesh position={[0, -0.3, 0]} material={mat('#888', { r: 0.4, m: 0.8 })}><cylinderGeometry args={[0.01, 0.01, 0.6, 6]} /></mesh>
        <mesh position={[0, -1.1, 0]} material={mat('#dc2626', { r: 0.4 })} castShadow><capsuleGeometry args={[0.28, 0.9, 8, 16]} /></mesh>
        <mesh position={[0, -1.1, 0.27]} material={basic(CYAN, { t: 0.9 })}><boxGeometry args={[0.3, 0.04, 0.02]} /></mesh>
      </group>
      <mesh position={[0, 3.3, -3.5]} material={mat('#222', { r: 0.4 })}><boxGeometry args={[1.6, 0.6, 0.1]} /></mesh>
      <mesh position={[0, 3.3, -3.44]} material={basic('#ffffff', { map: scoreTex(f >= hit ? 3 : 2, 3) })}><planeGeometry args={[1.5, 0.52]} /></mesh>
      <Person look={VR_LOOKS[3]} pos={[0.1, 0, 0]} rotY={Math.PI} onHead={<Headset />} pose={merge(EXPR.grin, { armL: [1.15 + Math.max(0, swing) * 0.4, 0.2, 1.6 - Math.max(0, swing) * 1.5], armR: [1.15 + Math.max(0, -swing) * 0.4, 0.2, 1.6 - Math.max(0, -swing) * 1.5], body: [0.1, swing * 0.15, 0], legL: 0.3, kneeL: 0.2 })} propL={glove('#e11d48')} propR={glove('#2563eb')} />
    </Stage>
  );
};
// Dance Battle — stage with a star arch
export const VDance: React.FC = () => {
  const { f, dur } = useShot('v_dance');
  const ph = f * 0.42;
  const looks = [VR_LOOKS[1], VR_LOOKS[4], VR_LOOKS[2]];
  const c = camK(f, [{ f: 0, p: [0, 1.6, 6.5], l: [0, 1.6, 0], fov: 48 }, { f: dur, p: [1.2, 1.9, 5.2], l: [0, 1.7, 0], fov: 46 }]);
  return (
    <Stage>
      <Lights look={NEON} center={[0, 1, 0]} size={10} noSky />
      <Cam {...c} />
      {Array.from({ length: 49 }).map((_, i) => { const x = (i % 7) - 3, z = Math.floor(i / 7) - 3; const on = hash(i * 3 + Math.floor(f / 8)) > 0.5; return <mesh key={i} position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]} material={basic(on ? [MAG, CYAN, '#facc15', VIO][i % 4] : '#140a24', { t: 0.95 })}><planeGeometry args={[0.95, 0.95]} /></mesh>; })}
      <group position={[0, 0, -3.2]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} material={basic(MAG, { t: 0.95 })}><torusGeometry args={[3.2, 0.08, 8, 48, Math.PI]} /></mesh>
        <mesh position={[0, 0, -0.1]} material={basic('#facc15', { t: 0.9 })}><torusGeometry args={[2.9, 0.05, 8, 48, Math.PI]} /></mesh>
        <Star pos={[0, 3.4, 0.2]} s={0.7} rotZ={Math.sin(f * 0.05) * 0.1} />
        <mesh position={[0, 2, -0.6]} material={mat('#1e0b3a', { r: 0.9 })}><planeGeometry args={[12, 6]} /></mesh>
      </group>
      {[-1, 0, 1].map((k) => <mesh key={k} position={[k * 2.5, 4, 1]} rotation={[0.3, 0, k * 0.4 + Math.sin(f * 0.05 + k) * 0.3]} material={basic(k ? CYAN : MAG, { add: true, t: 0.12 })}><coneGeometry args={[1.2, 5, 24, 1, true]} /></mesh>)}
      {looks.map((l, i) => <Person key={i} look={l} pos={[(i - 1) * 1.5, 0, -0.5 - (i === 1 ? 0.8 : 0)]} rotY={(i - 1) * -0.25} pose={merge(dance(ph + i * 0.0, i === 1 ? 0 : (i % 2) + 1), EXPR.grin)} onHead={i === 1 ? null : undefined} />)}
      <pointLight position={[0, 3, 3]} intensity={14} distance={12} color="#ffffff" />
    </Stage>
  );
};
// Золотая лихорадка — a cave full of coins
export const VGold: React.FC = () => {
  const { f, dur, beat } = useShot('v_gold');
  const coins = useMemo(() => { const r = rng(21); return Array.from({ length: 140 }).map(() => [(r() - 0.5) * 7, r() * 0.06, (r() - 0.5) * 5 - 1, r() * 3, r() * 3]); }, []);
  const cave = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2f1d', roughness: 1, side: THREE.BackSide }), []);
  const fly = Math.min(beat(1), dur - 30);
  const c = camK(f, [{ f: 0, p: [2.2, 1.6, 4], l: [0, 0.8, -1], fov: 50 }, { f: dur, p: [1.2, 1.3, 2.8], l: [0, 0.9, -1], fov: 48 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.3, hemiI: 0.3, hemiSky: '#ffb347' }} center={[0, 1, -1]} size={8} noSky />
      <Cam {...c} />
      <mesh position={[0, 2, -1]} scale={[6, 3.2, 6]} material={cave}><sphereGeometry args={[1, 24, 16]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#3a2617', { r: 1 })} receiveShadow><planeGeometry args={[14, 14]} /></mesh>
      {coins.map((cn, i) => <Coin key={i} pos={[cn[0], cn[1] + 0.01, cn[2]]} rot={[cn[3], 0, cn[4]]} />)}
      {[-1.6, 1.8].map((x, i) => <group key={i} position={[x, 0, -2.6]}><mesh position={[0, 1.6, 0]} material={mat('#5c3a1e', { r: 0.9 })}><cylinderGeometry args={[0.05, 0.05, 0.5, 6]} /></mesh><Glow pos={[0, 1.95, 0]} s={1.2} color="#ffb347" /><pointLight position={[0, 1.9, 0.2]} intensity={8} distance={6} color="#ffb347" /></group>)}
      {[0, 1].map((i) => {
        const wp = { pos: [(i ? 0.9 : -0.8), 0, -0.6 + i * 0.4], ph: f * 0.25 + i * 2 };
        return <VRPlayer key={i} look={VR_LOOKS[i + 2]} pos={wp.pos} rotY={i ? -0.6 : 0.5} ctrl={false} pose={merge(i ? walk(wp.ph, 0.6) : idle(f, i), EXPR.grin, { armL: [0.9, 0.25, 0.8], armR: [0.4, 0.2, 0.4] })} />;
      })}
      <mesh position={[0.95, 0.75, -0.25]} scale={[1, 1.2, 1]} material={mat('#8b6b3d', { r: 0.9 })} castShadow><sphereGeometry args={[0.25, 16, 12]} /></mesh>
      {f >= fly && Array.from({ length: 12 }).map((_, i) => { const t = clamp((f - fly - i * 2) / 14); if (t <= 0 || t >= 1) return null; return <Coin key={'fc' + i} pos={[lerp(-0.6 + (i % 3) * 0.3, 0.95, t), 0.3 + Math.sin(t * Math.PI) * 1.2, lerp(-1.2, -0.25, t)]} rot={[t * 8, 0, t * 5]} s={1.2} />; })}
      <pointLight position={[0, 0.6, 0]} intensity={6} distance={5} color="#facc15" />
    </Stage>
  );
};
// quick montage worlds
const Quick: React.FC<{ id: string; look: any; cam: { p: number[]; l: number[] }; children: React.ReactNode }> = ({ id, look, cam, children }) => {
  const { f, dur } = useShot(id);
  const c = camK(f, [{ f: 0, p: cam.p, l: cam.l, fov: 50 }, { f: dur, p: [cam.p[0] * 0.85, cam.p[1], cam.p[2] * 0.85], l: cam.l, fov: 48 }]);
  return (
    <Stage>
      <Lights look={look} center={[0, 1, 0]} size={10} frame={f} />
      <Cam {...c} />
      {children}
    </Stage>
  );
};
export const VPaint: React.FC = () => {
  const { f } = useShot('v_paint');
  const sp = useMemo(() => { const r = rng(31); return Array.from({ length: 30 }).map(() => [(r() - 0.5) * 8, (r() - 0.5) * 8, 0.3 + r() * 0.8, Math.floor(r() * 4)]); }, []);
  const cols = ['#ec4899', '#22d3ee', '#facc15', '#a855f7'];
  return (
    <Quick id="v_paint" look={LOOKS.day} cam={{ p: [3, 3, 5], l: [0, 0.6, 0] }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#e5e7eb', { r: 0.8 })} receiveShadow><planeGeometry args={[14, 14]} /></mesh>
      {sp.map((s, i) => <mesh key={i} position={[s[0], 0.01 + i * 0.0005, s[1]]} rotation={[-Math.PI / 2, 0, 0]} scale={[Math.min(1, f / 10 + (i % 5) * 0.1), Math.min(1, f / 10 + (i % 5) * 0.1), 1]} material={basic(cols[s[3]])}><circleGeometry args={[s[2], 20]} /></mesh>)}
      <Palm pos={[-3, 0, -3]} seed={2} /><Palm pos={[3.5, 0, -2.5]} seed={3} />
      <Person look={VR_LOOKS[1]} pos={[-0.8, 0, 0]} rotY={0.6} pose={merge(walk(f * 0.3), EXPR.grin, { armR: [1.5, 0.1, 0.1] })} propR={blaster('#ec4899')} />
      <Person look={VR_LOOKS[2]} pos={[1.2, 0, -1]} rotY={-0.8} pose={merge(walk(f * 0.3 + 2), EXPR.grin, { armR: [1.5, 0.1, 0.1] })} propR={blaster('#22d3ee')} />
    </Quick>
  );
};
export const VPenguins: React.FC = () => {
  const { f } = useShot('v_penguins');
  const floes = useMemo(() => { const r = rng(41); return Array.from({ length: 8 }).map(() => [(r() - 0.5) * 9, (r() - 0.5) * 7, 0.8 + r() * 1.2]); }, []);
  return (
    <Quick id="v_penguins" look={{ ...LOOKS.day, top: '#60a5fa', hor: '#e0f2fe' }} cam={{ p: [2, 4.5, 6], l: [0, 0, 0] }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#1d4ed8', { r: 0.2, m: 0.3 })}><planeGeometry args={[30, 30]} /></mesh>
      {floes.map((fl, i) => <group key={i} position={[fl[0], 0, fl[1]]}><mesh material={mat('#f8fafc', { r: 0.4 })} receiveShadow><cylinderGeometry args={[fl[2], fl[2] * 0.9, 0.25, 7]} /></mesh>
        {[0, 1].map((k) => <Penguin key={k} pos={[(k - 0.5) * 0.5, 0.12, 0]} rotY={i + k} ph={f * 0.3 + i + k} />)}</group>)}
    </Quick>
  );
};
export const VJetbox: React.FC = () => {
  const { f, dur } = useShot('v_jetbox');
  const t = clamp(f / (dur * 0.7));
  return (
    <Quick id="v_jetbox" look={LOOKS.day} cam={{ p: [0.2, 1.6, 4.2], l: [0.1, 1.3, -0.7] }}>
      <group position={[-60, -0.01, -80]}><City seed={11} near={2} far={5} /></group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#64748b', { r: 0.8 })} receiveShadow><planeGeometry args={[14, 14]} /></mesh>
      <Person look={VR_LOOKS[3]} pos={[-0.85, 0, 0.4]} rotY={2.6} pose={merge(EXPR.grin, { armR: [1.6, 0.2, 0.1] })} propR={glove('#dc2626')} />
      <group position={[lerp(-0.6, 0.9, t), 1.35, lerp(0.2, -1.5, t)]} scale={[2.2, 2.2, 2.2]}>{glove('#dc2626')}<sprite position={[-0.15, 0.02, 0]} scale={[0.5, 0.2, 1]} material={spr('#ffb347', { map: radialTex('glow'), add: true, t: 0.8 })} /></group>
      <Person look={VR_LOOKS[4]} pos={[1.0, 0, -1.7]} rotY={-0.6} pose={merge(t > 0.95 ? EXPR.shock : EXPR.neutral, { body: [t > 0.95 ? -0.3 : 0, 0, 0] })} />
    </Quick>
  );
};
export const VWood: React.FC = () => {
  const { f } = useShot('v_wood');
  const chop = Math.abs(Math.sin(f * 0.4));
  return (
    <Quick id="v_wood" look={{ ...LOOKS.day, top: '#4ade80', hor: '#dcfce7' }} cam={{ p: [2.6, 1.8, 3.4], l: [0, 0.9, 0] }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#65a30d', { r: 0.9 })} receiveShadow><planeGeometry args={[20, 20]} /></mesh>
      {[[-2, -3], [2.5, -3.5], [-3.5, -1], [3.2, -1.2]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><mesh position={[0, 1.5, 0]} material={mat('#6b4423', { r: 0.9 })}><cylinderGeometry args={[0.18, 0.22, 3, 8]} /></mesh><mesh position={[0, 3.3, 0]} material={mat('#15803d', { r: 0.8, flat: true })}><icosahedronGeometry args={[1.1, 0]} /></mesh></group>)}
      {[0, 1, 2].map((k) => <Log key={k} pos={[0.6, 0.16 + k * 0.3, -0.3 + (k % 2) * 0.15]} rot={[0, 0.3, Math.PI / 2]} />)}
      <Person look={VR_LOOKS[5]} pos={[-0.6, 0, 0.3]} rotY={0.8} pose={merge(EXPR.grin, { armR: [2.5 - chop * 1.5, 0.25, 0.2], armL: [2.4 - chop * 1.4, 0.25, 0.25] })}
        propR={<group rotation={[1.6, 0, 0]}><mesh position={[0, 0.2, 0]} material={mat('#8b5a2b', { r: 0.8 })}><cylinderGeometry args={[0.02, 0.02, 0.5, 8]} /></mesh><mesh position={[0.05, 0.42, 0]} material={mat('#94a3b8', { r: 0.3, m: 0.9 })}><boxGeometry args={[0.14, 0.1, 0.02]} /></mesh></group>} />
    </Quick>
  );
};
export const VWest: React.FC = () => {
  const { f, dur } = useShot('v_west');
  const t = clamp(f / dur);
  return (
    <Quick id="v_west" look={LOOKS.golden} cam={{ p: [0.2, 1.6, 4.4], l: [0.1, 1.4, -0.8] }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#d9a066', { r: 1 })} receiveShadow><planeGeometry args={[30, 30]} /></mesh>
      <mesh position={[0, 2, -4]} material={mat('#8b5a2b', { r: 0.9 })}><boxGeometry args={[6, 4, 0.3]} /></mesh>
      <mesh position={[0, 3.2, -3.8]} material={mat('#5c3a1e', { r: 0.9 })}><boxGeometry args={[2, 0.5, 0.1]} /></mesh>
      <Person look={VR_LOOKS[1]} pos={[-0.75, 0, 0.6]} rotY={2.5} pose={merge(EXPR.grin, { armR: [1.6, 0.1, 0.05] })} propR={blaster('#facc15')} />
      <Person look={randomLook(2101, { shirt: '#7c2d12' })} pos={[0.75, 0, -1.8]} rotY={-0.5} pose={merge(EXPR.shock, { head: [-0.2, 0, 0] })} onHead={t < 0.4 ? <group position={[0, 0.2, 0]}><CowboyHat pos={[0, 0, 0]} s={1.3} /></group> : null} />
      {t >= 0.4 && <CowboyHat pos={[0.75 + (t - 0.4) * 2, 2.1 + (t - 0.4) * 2 - (t - 0.4) ** 2 * 6, -1.8 + (t - 0.4)]} rot={[t * 8, 0, t * 6]} s={1.3} />}
    </Quick>
  );
};
export const VPhoto: React.FC = () => {
  const { f, dur } = useShot('v_photo');
  const flash = f > dur * 0.5 && f < dur * 0.5 + 4;
  return (
    <Quick id="v_photo" look={{ ...LOOKS.golden, sunAz: 40, sunEl: 25, fogNear: 40, fogFar: 260 }} cam={{ p: [1.4, 1.6, 3.4], l: [0.2, 1.2, -1.8] }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#e7c58a', { r: 1 })} receiveShadow><planeGeometry args={[30, 30]} /></mesh>
      {[[-2.5, -3], [2.6, -2.8], [-1, -4.5], [3.8, -4.6], [-3.6, -1.2]].map(([x, z], i) => <Palm key={i} pos={[x, 0, z]} seed={i + 5} s={1.1} />)}
      <Elephant pos={[-0.1, 0, -2.4]} rotY={-1.15} f={f} />
      <Person look={VR_LOOKS[6]} pos={[-0.6, 0, 0.6]} rotY={2.6} pose={merge(EXPR.happy, { armL: [1.35, 0.05, 0.9], armR: [1.35, 0.05, 0.9] })}
        propR={<group rotation={[1.5, 0, 0]}><mesh material={mat('#111', { r: 0.4 })}><boxGeometry args={[0.16, 0.1, 0.06]} /></mesh></group>} />
      {flash && <Glow pos={[-0.55, 1.35, 0.25]} s={2.5} color="#ffffff" />}
    </Quick>
  );
};
/** a cartoon elephant: ears, eyes, tusks, curled trunk */
const Elephant: React.FC<{ pos: number[]; rotY?: number; f: number }> = ({ pos, rotY = 0, f }) => {
  const skin = mat('#a7adbb', { r: 0.75 });
  const trunk = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, -0.25, 0.05), new THREE.Vector3(0.2, -0.55, 0.12), new THREE.Vector3(0.32, -0.7, 0.3)]), 20, 0.07, 10, false), []);
  const ear = Math.sin(f * 0.2) * 0.15;
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.0, 0]} scale={[1.35, 0.95, 0.85]} material={skin} castShadow><sphereGeometry args={[0.62, 24, 18]} /></mesh>
      {[[-0.45, 0.28], [0.45, 0.28], [-0.45, -0.28], [0.45, -0.28]].map(([x, z], i) => <mesh key={i} position={[x, 0.35, z]} material={skin} castShadow><cylinderGeometry args={[0.15, 0.17, 0.7, 12]} /></mesh>)}
      <group position={[0.85, 1.3, 0]}>
        <mesh material={skin} castShadow><sphereGeometry args={[0.38, 20, 16]} /></mesh>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[-0.12, 0.05, sd * 0.33]} rotation={[sd * (0.25 + ear), 0, 0]}>
            <mesh scale={[0.9, 1.1, 0.12]} material={skin}><sphereGeometry args={[0.34, 18, 12]} /></mesh>
            <mesh position={[0.02, 0, sd * 0.03]} scale={[0.7, 0.85, 0.08]} material={mat('#e7b7c5', { r: 0.8 })}><sphereGeometry args={[0.34, 16, 10]} /></mesh>
          </group>
        ))}
        {[-1, 1].map((sd) => <group key={'e' + sd} position={[0.28, 0.1, sd * 0.17]}><mesh material={basic('#ffffff')}><sphereGeometry args={[0.06, 12, 10]} /></mesh><mesh position={[0.04, 0.01, 0]} material={basic('#111111')}><sphereGeometry args={[0.035, 10, 8]} /></mesh><mesh position={[0.06, 0.025, 0.01]} material={basic('#ffffff')}><sphereGeometry args={[0.01, 6, 6]} /></mesh></group>)}
        {[-1, 1].map((sd) => <mesh key={'t' + sd} position={[0.3, -0.2, sd * 0.13]} rotation={[0, 0, -2.1]} material={mat('#f5f0e1', { r: 0.4 })}><coneGeometry args={[0.035, 0.32, 10]} /></mesh>)}
        <mesh geometry={trunk} position={[0.32, -0.05, 0]} rotation={[0, 0, Math.sin(f * 0.12) * 0.15]} material={skin} />
      </group>
      <mesh position={[-0.85, 1.1, 0]} rotation={[0, 0, 0.8 + Math.sin(f * 0.3) * 0.2]} material={skin}><cylinderGeometry args={[0.02, 0.03, 0.45, 6]} /></mesh>
    </group>
  );
};
// «весёлые командные игры для всех от семи лет» — family in the arena
export const VFamily: React.FC = () => {
  const { f, dur } = useShot('v_family');
  const ppl = [5, 6, 0, 4].map((li, i) => ({ look: VR_LOOKS[li], pos: [(i - 1.5) * 1.1, 0, -0.5 - (i % 2) * 0.5], rotY: (1.5 - i) * 0.15, pose: merge(idle(f, i), EXPR.grin, { armL: [1.8 + Math.sin(f * 0.25 + i) * 0.6, 0.7, 0.3], armR: [1.4 + Math.cos(f * 0.25 + i) * 0.5, 0.6, 0.5], bob: Math.abs(Math.sin(f * 0.25 + i)) * 0.05 }) }));
  const c = camK(f, [{ f: 0, p: [0.5, 1.5, 4.2], l: [0, 1.1, -0.5], fov: 48 }, { f: dur, p: [-0.4, 1.4, 3.4], l: [0, 1.1, -0.5], fov: 46 }]);
  return (
    <Stage>
      <Lights look={NEON} center={[0, 1, 0]} size={10} noSky />
      <Cam {...c} />
      <Arena f={f} players={ppl} col={MAG} />
    </Stage>
  );
};
// Zombies — dark forest, the horde, laser blasters
export const VZombies: React.FC = () => {
  const { f, dur } = useShot('v_zombies');
  const zs = useMemo(() => { const r = rng(61); return Array.from({ length: 8 }).map((_, i) => ({ x: (r() - 0.5) * 6, z0: -6 - r() * 8, sp: 0.4 + r() * 0.3, look: randomLook(2200 + i, { skin: '#86a86a', shirt: ['#4b5563', '#57534e', '#3f3f46'][i % 3], pants: '#292524', hairStyle: 'bald' }) })); }, []);
  const shotsOn = Math.floor(f / 6) % 2 === 0;
  const c = camK(f, [{ f: 0, p: [2.4, 1.9, 2.8], l: [-0.6, 1.1, -4], fov: 50 }, { f: dur, p: [2.0, 1.8, 2.2], l: [-0.6, 1.1, -4], fov: 48 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.night, fog: '#0f2a1a', fogNear: 3, fogFar: 22, hemiSky: '#4ade80', hemiI: 0.45 }} center={[0, 1, -3]} size={12} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#1f2a1c', { r: 1 })} receiveShadow><planeGeometry args={[40, 40]} /></mesh>
      {Array.from({ length: 14 }).map((_, i) => { const r = rng(i + 80); const x = (r() - 0.5) * 16, z = -4 - r() * 14; return <group key={i} position={[x, 0, z]} rotation={[0, r() * 6, (r() - 0.5) * 0.3]}><mesh position={[0, 2, 0]} material={mat('#1c1917', { r: 1 })}><cylinderGeometry args={[0.08, 0.2, 4, 6]} /></mesh>{[0, 1, 2].map((k) => <mesh key={k} position={[0.4 * (k - 1), 3 + k * 0.3, 0]} rotation={[0, 0, (k - 1) * 0.8]} material={mat('#1c1917', { r: 1 })}><cylinderGeometry args={[0.02, 0.05, 1.4, 5]} /></mesh>)}</group>; })}
      <Smoke pos={[0, 0, -6]} f={f} n={10} h={2} s={4} color="#3f6b4a" o={0.35} />
      {zs.map((z, i) => { const zz = Math.min(z.z0 + (f / 30) * z.sp, -2.2); return <Person key={i} look={z.look} pos={[z.x, 0, zz]} rotY={0} pose={merge(walk(f * 0.15 + i, 0.5), EXPR.dumb, { armL: [1.5, 0.1, 0.1], armR: [1.4, 0.1, 0.2], head: [0.2, 0, 0.2] })} />; })}
      {[[-0.6, 0.6], [0.7, 0.4]].map(([x, z], i) => (
        <group key={i}>
          <Person look={VR_LOOKS[i]} pos={[x, 0, z]} rotY={Math.PI + (i ? -0.2 : 0.2)} pose={merge(EXPR.grin, { armR: [1.55, 0.05, 0.05], armL: [1.45, -0.3, 0.6] })} propR={blaster('#facc15')} onHead={<group />} />
          {shotsOn && <mesh position={[x + (i ? -0.2 : 0.2), 1.35, z - 3]} rotation={[Math.PI / 2, 0, 0]} material={basic('#facc15', { add: true, t: 0.9 })}><cylinderGeometry args={[0.02, 0.02, 6, 6]} /></mesh>}
        </group>
      ))}
      <pointLight position={[0, 2, 1]} intensity={4} distance={8} color="#facc15" />
    </Stage>
  );
};
// Tactics — corridor, operators, laser sights
export const VTactics: React.FC = () => {
  const { f, dur } = useShot('v_tactics');
  const op = (seed: number) => randomLook(2300 + seed, { shirt: '#3f4d2a', pants: '#2f3a21', hairStyle: 'bald', skin: '#c58c5f' });
  const helmet = <group><mesh position={[0, 0.08, -0.01]} material={mat('#3f4d2a', { r: 0.6 })}><sphereGeometry args={[0.235, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh><mesh position={[0, 0.04, 0.2]} material={mat('#0b0b0f', { r: 0.1, m: 0.7 })}><boxGeometry args={[0.26, 0.08, 0.04]} /></mesh></group>;
  const c = camK(f, [{ f: 0, p: [0.5, 1.3, 2.4], l: [0, 1.35, -2], fov: 48 }, { f: dur, p: [0.3, 1.25, 1.6], l: [0, 1.4, -2], fov: 46 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.2, hemiI: 0.25, hemiSky: '#ffb347', fog: '#1a1208', fogNear: 3, fogFar: 18 }} center={[0, 1, -3]} size={10} noSky />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#2b2620', { r: 0.9 })} receiveShadow><planeGeometry args={[6, 30]} /></mesh>
      {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 2, 1.6, -5]} rotation={[0, -sd * Math.PI / 2, 0]} material={mat('#4a3f33', { r: 0.9 })}><planeGeometry args={[30, 3.2]} /></mesh>)}
      {[-2, -5, -8, -11].map((z, i) => <group key={i}><mesh position={[0, 3, z]} material={basic('#ffb347', { t: hash(i + Math.floor(f / 5)) > 0.2 ? 0.95 : 0.3 })}><boxGeometry args={[0.8, 0.05, 0.2]} /></mesh><pointLight position={[0, 2.8, z]} intensity={4} distance={5} color="#ffb347" /></group>)}
      {[[-0.6, -0.6], [0.6, -1.4], [-0.3, -2.4]].map(([x, z], i) => (
        <group key={i}>
          <Person look={op(i)} pos={[x, 0, z + (f / 30) * 0.35 - 0.8]} rotY={0} onHead={helmet} pose={merge(walk(f * 0.2 + i, 0.4), EXPR.neutral, { armR: [1.5, 0.05, 0.1], armL: [1.4, -0.35, 0.7], body: [0.12, 0, 0] })} propR={rifle()} />
          
        </group>
      ))}
      <Smoke pos={[0, 0, -9]} f={f} n={8} h={2.5} s={3} color="#5a4a3a" o={0.4} />
    </Stage>
  );
};
// Battle — sci-fi armour in a neon world
export const VBattle: React.FC = () => {
  const { f, dur } = useShot('v_battle');
  const armour = (seed: number, col: string) => randomLook(2400 + seed, { shirt: col, pants: '#1f2937', hairStyle: 'bald', skin: '#9ca3af' });
  const helm = (col: string) => <group><mesh position={[0, 0.02, 0]} material={mat('#e5e7eb', { r: 0.3, m: 0.6 })}><sphereGeometry args={[0.24, 18, 14]} /></mesh><mesh position={[0, 0.04, 0.2]} material={basic(col)}><boxGeometry args={[0.28, 0.07, 0.06]} /></mesh></group>;
  const a = lerp(-0.6, 0.6, smoother(f / dur));
  return (
    <Stage>
      <Lights look={{ ...NEON, hor: '#3b0d0d', fog: '#1a0505' }} center={[0, 1, -2]} size={12} noSky />
      <Cam pos={[Math.sin(a) * 4, 1.6, Math.cos(a) * 4]} look={[0, 1.3, -1.5]} fov={50} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({ color: '#0f0f16', roughness: 0.25, metalness: 0.6 })} receiveShadow><planeGeometry args={[30, 30]} /></mesh>
      {[-3, -1, 1, 3].map((x, i) => <mesh key={i} position={[x, 2, -5]} material={basic(i % 2 ? '#ef4444' : CYAN, { t: 0.9 })}><boxGeometry args={[0.15, 4, 0.15]} /></mesh>)}
      {[['#f97316', -1.2, -1.2], ['#3b82f6', 0, -2], ['#22c55e', 1.2, -1.2], ['#eab308', 0.2, -0.4]].map(([col, x, z], i) => (
        <Person key={i} look={armour(i, col as string)} pos={[x as number, 0, z as number]} rotY={(i - 1.5) * 0.3} onHead={helm(i === 1 ? '#ef4444' : CYAN)} pose={merge(idle(f, i), { armR: [1.5, 0.05, 0.05], armL: [1.4, -0.3, 0.6], legL: 0.15, kneeL: 0.1 })} propR={i === 2 ? <mesh material={mat('#ef4444', { r: 0.5 })} position={[0, -0.05, 0.05]}><boxGeometry args={[0.18, 0.14, 0.08]} /></mesh> : rifle()} />
      ))}
      <pointLight position={[0, 3, 2]} intensity={10} distance={10} color="#ef4444" />
      <pointLight position={[-2, 2, 2]} intensity={8} distance={8} color={CYAN} />
    </Stage>
  );
};
// features / friends: the arena again
export const VFeatures: React.FC = () => {
  const { f, dur } = useShot('v_features');
  const ppl = [0, 1, 2, 3].map((li, i) => ({ look: VR_LOOKS[li], pos: [(i - 1.5) * 1.3, 0, -1 - (i % 2) * 0.6], rotY: (1.5 - i) * 0.2, pose: merge(idle(f, i), EXPR.grin, { armL: [1.4 + Math.sin(f * 0.2 + i) * 0.4, 0.45, 0.6], armR: [1.6 + Math.cos(f * 0.2 + i) * 0.4, 0.45, 0.5] }) }));
  const c = camK(f, [{ f: 0, p: [3.5, 4.5, 6.5], l: [0, 0.8, -1], fov: 50 }, { f: dur, p: [-2.5, 3.5, 6], l: [0, 1, -1], fov: 50 }]);
  return (
    <Stage>
      <Lights look={NEON} center={[0, 1, 0]} size={10} noSky />
      <Cam {...c} />
      <Arena f={f} players={ppl} />
    </Stage>
  );
};
export const VFriends: React.FC = () => {
  const { f, dur } = useShot('v_friends');
  const jump = Math.abs(Math.sin(f * 0.2));
  const ppl = [0, 2, 4, 5].map((li, i) => ({ look: VR_LOOKS[li], pos: [(i - 1.5) * 1.05, 0, -0.4], rotY: (1.5 - i) * 0.25, pose: merge(EXPR.grin, { armL: [0.3, 2.45, 0.15], armR: [0.3, 2.45, 0.15], y: jump * 0.15 * ((i % 2) ? 1 : 0.6), legL: jump * 0.3, kneeL: jump * 0.5 }) }));
  const c = camK(f, [{ f: 0, p: [0, 1.4, 3.6], l: [0, 1.4, -0.4], fov: 46 }, { f: dur, p: [0.5, 1.3, 3.0], l: [0, 1.45, -0.4], fov: 44 }]);
  return (
    <Stage>
      <Lights look={NEON} center={[0, 1, 0]} size={10} noSky />
      <Cam {...c} />
      <Arena f={f} players={ppl} col={MAG} />
    </Stage>
  );
};
export const VFinal: React.FC = () => {
  const { f } = useShot('v_final');
  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'blur(5px) brightness(0.55)', transform: 'scale(1.05)' }}>
      <Stage>
        <Lights look={NEON} center={[0, 1, 0]} size={10} noSky />
        <Cam pos={[Math.sin(f * 0.01) * 3, 2.5, 6.5]} look={[0, 1.2, -1]} fov={50} />
        <Arena f={f} players={[0, 1, 2].map((i) => ({ look: VR_LOOKS[i], pos: [(i - 1) * 1.5, 0, -1], pose: merge(idle(f, i), EXPR.grin) }))} />
      </Stage>
    </div>
  );
};

export const VR_SCENES: Record<string, React.FC> = {
  v_headset: VHeadset, v_tunnel: VTunnel, v_logo: VLogo, v_real: VReal, v_virtual: VVirtual, v_select: VSelect,
  v_cyberbox: VCyberbox, v_dance: VDance, v_gold: VGold, v_paint: VPaint, v_penguins: VPenguins, v_jetbox: VJetbox, v_wood: VWood, v_west: VWest, v_photo: VPhoto,
  v_family: VFamily, v_zombies: VZombies, v_tactics: VTactics, v_battle: VBattle, v_features: VFeatures, v_friends: VFriends, v_final: VFinal,
};
void StarField; void rbox;
