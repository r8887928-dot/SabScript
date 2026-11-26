import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Lights, Cam, mat, basic, spr, radialTex } from '../three/core';
import { shotById } from '../lib/tl';
import { camK, lerp, rng, smoother, clamp, easeOut, kick } from '../lib/anim';
import { PStage } from '../coins/look';
import { Boston, WINTER } from '../molasses/world';
import { Card, Dog, CamCtx } from '../molasses/cast';

// «Снеговик мстит» — wordless comedy: 2D kid + dog cards, a 3D snowman, snowy 1919-style street (reused world).
// Snowman spot S = (0.6, 0, 6); kid's door on the left block at (−7.9, 0, 9.2); the dog runs off along −z.
const useShot = (id: string) => {
  const f = useCurrentFrame();
  const s = shotById(id) ?? { dur: 90, from: 0 };
  return { f, dur: s.dur as number, p: f / Math.max(1, s.dur) };
};
const SNOWY = { ...WINTER, sunAz: 210, sunEl: 14, sun: '#ffc98e', sunI: 2.6, top: '#5a6fb5', hor: '#f3c9a0', fog: '#d9d3e6', fogNear: 18, fogFar: 160, hemiSky: '#c9d3f4', hemiI: 1.15 };
type C = { pos: number[]; look: number[]; fov?: number; roll?: number };
const SX = 0.6, SZ = 6;

const Flakes: React.FC<{ f: number; c: number[] }> = ({ f, c }) => {
  const pts = useMemo(() => { const r = rng(4); return Array.from({ length: 220 }).map(() => [(r() - 0.5) * 24, r() * 10, (r() - 0.5) * 24, 0.04 + r() * 0.05, r() * 6]); }, []);
  const m = useMemo(() => spr('#ffffff', { map: radialTex('puff'), t: 0.9 }), []);
  return <>{pts.map(([x, y, z, s, ph], i) => <sprite key={i} position={[c[0] + x + Math.sin(f * 0.03 + ph) * 0.3, ((y - f * 0.03 + 100) % 10), c[2] + z]} scale={[s, s, 1]} material={m} />)}</>;
};
const Shot: React.FC<{ f: number; c: C; shake?: number; children: React.ReactNode }> = ({ f, c, shake = 0, children }) => {
  const fl = [Math.sin(f * 0.023) * 0.05, Math.sin(f * 0.019 + 1) * 0.035, Math.cos(f * 0.015) * 0.04];
  const sh = shake ? [Math.sin(f * 2.3) * shake, Math.cos(f * 2.9) * shake, 0] : [0, 0, 0];
  const pos = c.pos.map((v, i) => v + fl[i] + sh[i]);
  return (
    <PStage>
      <CamCtx.Provider value={pos}>
        <Lights look={SNOWY} center={[c.look[0], 0, c.look[2]]} size={24} frame={f} />
        <Cam pos={pos} look={c.look} fov={c.fov ?? 45} roll={(c.roll ?? 0) + Math.sin(f * 0.012) * 0.8} />
        <Boston f={f} noTank snow={1} />
        <Flakes f={f} c={pos} />
        {children}
      </CamCtx.Provider>
    </PStage>
  );
};

// ------------------------------------------------------------------ the snowman (3D)
const INKM = new THREE.MeshBasicMaterial({ color: '#0b0a0c', side: THREE.BackSide });
const Ball: React.FC<{ r: number; y: number; rot?: number }> = ({ r, y, rot = 0 }) => (
  <group position={[0, y, 0]} rotation={[rot, 0, 0]}>
    <mesh material={mat('#f6f8fc', { r: 0.7, e: '#8f9ab8', ei: 0.45 })} castShadow receiveShadow><sphereGeometry args={[r, 32, 24]} /></mesh>
    <mesh material={INKM} scale={[1.05, 1.05, 1.05]}><sphereGeometry args={[r, 24, 16]} /></mesh>
  </group>
);
type SnowPose = { nose?: boolean; blink?: number; angry?: number; wink?: number; hop?: number; armL?: number; armR?: number; parts?: number; base?: number; yaw?: number; lean?: number };
export const Snowman: React.FC<{ pos: number[]; p?: SnowPose }> = ({ pos, p = {} }) => {
  const parts = p.parts ?? 3, base = p.base ?? 0.55, hop = p.hop ?? 0, ang = p.angry ?? 0, bl = p.blink ?? 0, wk = p.wink ?? 0;
  const coal = mat('#141018', { r: 0.6 });
  const sq = 1 - Math.max(0, -hop) * 0.15;
  const eye = (x: number, closed: number) => (
    <group position={[x, 0.06, 0.27]}>
      <mesh material={coal} scale={[1, Math.max(0.12, 1 - closed), 1]}><sphereGeometry args={[0.045, 12, 10]} /></mesh>
      {ang > 0 && <mesh position={[0, 0.09, 0.01]} rotation={[0, 0, (x < 0 ? -1 : 1) * 0.5 * ang]} material={coal}><boxGeometry args={[0.13, 0.03, 0.03]} /></mesh>}
    </group>
  );
  return (
    <group position={[pos[0], pos[1] + Math.max(0, hop), pos[2]]} rotation={[p.lean ?? 0, p.yaw ?? 0, 0]} scale={[1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015 - Math.max(0, hop), 0]} material={basic('#2a2a3a', { t: 0.25 / (1 + hop * 2) })}><circleGeometry args={[base * 1.1, 24]} /></mesh>
      <Ball r={base} y={base * 0.92} />
      {parts > 1 && <Ball r={0.4} y={base * 1.75 + 0.3} />}
      {parts > 1 && [0.22, 0.04].map((y, i) => <mesh key={i} position={[0, base * 1.75 + 0.3 + y, 0.39]} material={coal}><sphereGeometry args={[0.04, 10, 8]} /></mesh>)}
      {parts > 1 && [-1, 1].map((s) => (
        <group key={s} position={[s * 0.36, base * 1.75 + 0.42, 0]} rotation={[0, 0, s * -(((s < 0 ? p.armL : p.armR) ?? 0.6))]}>
          <mesh position={[s * 0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('#5a3a22')} castShadow><cylinderGeometry args={[0.025, 0.035, 0.62, 6]} /></mesh>
          <mesh position={[s * 0.56, 0.08, 0]} rotation={[0, 0, s * -0.7]} material={mat('#5a3a22')}><cylinderGeometry args={[0.015, 0.02, 0.2, 5]} /></mesh>
        </group>
      ))}
      {parts > 1 && <mesh position={[0, base * 1.75 + 0.62, 0]} rotation={[Math.PI / 2 - 0.1, 0, 0]} material={mat('#d8332b', { r: 0.9 })}><torusGeometry args={[0.27, 0.07, 10, 28]} /></mesh>}
      {parts > 2 && (
        <group position={[0, base * 1.75 + 0.95, 0]}>
          <Ball r={0.3} y={0} />
          {eye(-0.11, Math.max(bl, 0))}{eye(0.11, Math.max(bl, wk))}
          {p.nose !== false && <mesh position={[0, -0.02, 0.42]} rotation={[Math.PI / 2, 0, 0]} material={mat('#f07a1a', { r: 0.6 })} castShadow><coneGeometry args={[0.05, 0.3, 14]} /></mesh>}
          {[-2, -1, 0, 1, 2].map((i) => <mesh key={i} position={[i * 0.05, -0.13 - (ang > 0.5 ? -Math.abs(i) * 0.012 : Math.abs(i) * 0.012) + 0.02 * ang, 0.26]} material={coal}><sphereGeometry args={[0.022, 8, 6]} /></mesh>)}
          <group position={[0, 0.26, 0]}><mesh material={mat('#1d1d22', { r: 0.6 })} castShadow><cylinderGeometry args={[0.17, 0.2, 0.26, 20]} /></mesh><mesh position={[0, -0.13, 0]} material={mat('#1d1d22')}><cylinderGeometry args={[0.28, 0.28, 0.03, 24]} /></mesh></group>
        </group>
      )}
    </group>
  );
};
const Carrot: React.FC<{ pos: number[]; rot?: number[] }> = ({ pos, rot = [Math.PI / 2, 0, 0] }) => <mesh position={pos as any} rotation={rot as any} material={mat('#f07a1a', { r: 0.6 })} castShadow><coneGeometry args={[0.05, 0.3, 14]} /></mesh>;
const FACE_Y = 0.55 * 1.75 + 0.95;
const walkTo = (f: number, a: number[], b: number[], f0: number, f1: number) => { const t = clamp((f - f0) / (f1 - f0)); return [lerp(a[0], b[0], t), 0, lerp(a[2], b[2], t), t]; };

// ------------------------------------------------------------------ shots
export const SBuild: React.FC = () => {
  const { f, dur } = useShot('s_build');
  const r = lerp(0.18, 0.55, smoother(clamp(f / dur)));
  const z = lerp(10, SZ, smoother(clamp(f / dur)));
  const c = camK(f, [{ f: 0, p: [4, 1.6, 14], l: [0.6, 0.5, 9], fov: 44 }, { f: dur, p: [3.2, 1.5, 10.5], l: [0.6, 0.6, 6], fov: 42 }]);
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, z]} p={{ parts: 1, base: r }} />
      <Card role="kid" pos={[SX - 0.2, 0, z + r + 0.55]} pose={{ expr: 'happy', walk: f * 0.25, stride: 0.6, armL: 70, armR: 70 }} f={f} />
    </Shot>
  );
};
export const SNose: React.FC = () => {
  const { f, dur } = useShot('s_nose');
  const t = smoother(clamp((f - 20) / 28));
  const c = camK(f, [{ f: 0, p: [1.8, 1.9, 9.2], l: [SX, 1.6, SZ], fov: 40 }, { f: dur, p: [1.4, 1.95, 8.6], l: [SX, 1.75, SZ], fov: 36 }]);
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, SZ]} p={{ nose: f > 48 }} />
      <Card role="kid" pos={[SX + 0.65, 0, SZ + 0.9]} pose={{ expr: 'focus', armR: lerp(60, 140, t), armL: 20 }} f={f} />
      {f <= 48 && <Carrot pos={[lerp(SX + 1.0, SX, t), lerp(1.2, FACE_Y - 0.02, t), lerp(SZ + 0.9, SZ + 0.42, t)]} rot={[Math.PI / 2, 0, lerp(-1.2, 0, t)]} />}
    </Shot>
  );
};
export const SProud: React.FC = () => {
  const { f, dur } = useShot('s_proud');
  const c = camK(f, [{ f: 0, p: [-1.4, 0.7, 10.5], l: [SX, 1.4, SZ], fov: 44 }, { f: dur, p: [-0.8, 0.65, 9.6], l: [SX, 1.5, SZ], fov: 42 }]);
  const jump = Math.abs(Math.sin(f * 0.25)) * 0.15;
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, SZ]} />
      <Card role="kid" pos={[SX - 0.9, jump, SZ + 0.5]} pose={{ expr: 'happy', armL: 160, armR: 160 }} f={f} />
    </Shot>
  );
};
export const SLeave: React.FC = () => {
  const { f, dur } = useShot('s_leave');
  const [x, , z, t] = walkTo(f, [SX - 0.9, 0, SZ + 0.5], [-7.6, 0, 9.2], 0, dur - 10);
  const c = camK(f, [{ f: 0, p: [2.4, 1.4, 9.5], l: [-3, 1.2, 7.5], fov: 46 }, { f: dur, p: [2.6, 1.4, 9.8], l: [-5, 1.2, 8.5], fov: 46 }]);
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, SZ]} />
      {t < 1 && <Card role="kid" pos={[x, 0, z]} pose={{ expr: 'happy', walk: f * 0.3, stride: 0.6 }} f={f} />}
    </Shot>
  );
};
export const SDog: React.FC = () => {
  const { f, dur } = useShot('s_dog');
  const [x, , z] = walkTo(f, [6, 0, 8], [SX + 1.35, 0, SZ + 0.9], 0, dur - 20);
  const c = camK(f, [{ f: 0, p: [SX - 1.2, 0.6, SZ + 4.2], l: [SX + 1.5, 0.7, SZ + 0.5], fov: 44 }, { f: dur, p: [SX - 0.8, 0.6, SZ + 3.4], l: [SX + 0.8, 0.8, SZ + 0.4], fov: 42 }]);
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, SZ]} />
      <Dog pos={[x, 0, z]} dir={-1} pose={{ expr: 'sly', run: f < dur - 20 ? f * 0.25 : undefined }} f={f} />
    </Shot>
  );
};
export const SSteal: React.FC = () => {
  const { f, dur } = useShot('s_steal');
  const jt = clamp((f - 28) / 22);
  const jump = Math.sin(jt * Math.PI) * 1.0;
  const got = f > 40;
  const c = camK(f, [{ f: 0, p: [SX + 2.6, 1.3, SZ + 3.4], l: [SX + 0.3, 1.2, SZ], fov: 44 }, { f: dur, p: [SX + 2.2, 1.4, SZ + 2.9], l: [SX + 0.3, 1.4, SZ], fov: 42 }]);
  return (
    <Shot f={f} c={c} shake={f > 38 && f < 46 ? 0.03 : 0}>
      <Snowman pos={[SX, 0, SZ]} p={{ nose: !got }} />
      <Dog pos={[SX + 1.35 - jt * 0.75, jump, SZ + 0.9]} dir={-1} pose={{ expr: got ? 'happy' : 'sly', carrot: got }} f={f} />
    </Shot>
  );
};
export const SRun: React.FC = () => {
  const { f, dur } = useShot('s_run');
  const z = lerp(SZ + 0.6, SZ - 12, f / dur);
  const c = camK(f, [{ f: 0, p: [SX + 1.5, 0.9, SZ + 3], l: [SX, 0.6, SZ - 2], fov: 46 }, { f: dur, p: [SX + 1.5, 0.9, SZ + 3], l: [SX, 0.6, SZ - 8], fov: 40 }]);
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, SZ]} p={{ nose: false }} />
      <Dog pos={[SX + 0.2, Math.abs(Math.sin(f * 0.4)) * 0.15, z]} dir={1} pose={{ expr: 'happy', carrot: true, run: f * 0.5 }} f={f} />
    </Shot>
  );
};
export const SWake: React.FC = () => {
  const { f, dur } = useShot('s_wake');
  const c = camK(f, [{ f: 0, p: [SX + 0.1, FACE_Y, SZ + 2.4], l: [SX, FACE_Y, SZ], fov: 36 }, { f: dur, p: [SX + 0.05, FACE_Y, SZ + 1.6], l: [SX, FACE_Y, SZ], fov: 34 }]);
  const blink = f < 30 ? 1 : f < 44 ? 1 - (f - 30) / 14 : (f > 58 && f < 64) ? 1 : 0;
  return <Shot f={f} c={c}><Snowman pos={[SX, 0, SZ]} p={{ nose: false, blink, yaw: Math.sin(f * 0.05) * 0.15 * clamp((f - 60) / 20) }} /></Shot>;
};
export const SAngry: React.FC = () => {
  const { f } = useShot('s_angry');
  const a = easeOut(clamp(f / 8));
  const k = kick(f, 6, 7);
  const c = { pos: [SX + k * 0.03, FACE_Y + 0.05, SZ + 1.25], look: [SX, FACE_Y, SZ], fov: 34 };
  return <Shot f={f} c={c}><Snowman pos={[SX, 0, SZ]} p={{ nose: false, angry: a }} /></Shot>;
};
export const SChase: React.FC = () => {
  const { f, dur } = useShot('s_chase');
  const z = lerp(SZ, SZ - 22, f / dur);
  const hop = Math.abs(Math.sin(f * 0.2)) * 0.8 - 0.05;
  const c = { pos: [SX - 3.6, 1.5, z + 3.2], look: [SX, 1.0, z - 1.8], fov: 52 };
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, z]} p={{ nose: false, angry: 1, hop, lean: -0.15, armL: 1.6, armR: 1.6 }} />
      <Dog pos={[SX + 0.4, Math.abs(Math.sin(f * 0.4)) * 0.15, z - 4.5]} dir={1} pose={{ expr: 'happy', carrot: true, run: f * 0.5 }} f={f} />
    </Shot>
  );
};
export const SLook: React.FC = () => {
  const { f, dur } = useShot('s_look');
  const z = SZ - 22 - f * 0.05;
  const c = camK(f, [{ f: 0, p: [SX + 0.5, 0.7, z - 7.8], l: [SX + 0.4, 0.8, z - 4.5], fov: 40 }, { f: dur, p: [SX + 0.5, 0.75, z - 7.2], l: [SX + 0.4, 0.9, z - 3], fov: 44 }]);
  const sz = lerp(z + 2.5, z - 2.0, f / dur);
  return (
    <Shot f={f} c={c}>
      <Dog pos={[SX + 0.4, 0, z - 4.5]} dir={1} pose={{ expr: 'shock', carrot: true, run: f * 0.5 }} f={f} />
      <Snowman pos={[SX - 0.2, 0, sz]} p={{ nose: false, angry: 1, hop: Math.abs(Math.sin(f * 0.25)) * 0.7, armL: 1.6, armR: 1.6, yaw: Math.PI }} />
    </Shot>
  );
};
export const SCatch: React.FC = () => {
  const { f, dur } = useShot('s_catch');
  const z0 = SZ - 27;
  const land = 40;
  const t = clamp(f / land);
  const sz = lerp(z0 + 4, z0 - 1.2, t), hop = Math.sin(t * Math.PI) * 2.2;
  const k = kick(f, land, 8);
  const c = camK(f, [{ f: 0, p: [SX + 3.4, 1.4, z0 + 4.2], l: [SX, 1.0, z0 - 0.3], fov: 48 }, { f: dur, p: [SX + 3.0, 1.3, z0 + 3.6], l: [SX, 1.0, z0 - 0.4], fov: 46 }]);
  return (
    <Shot f={f} c={{ ...c, pos: [c.pos[0], c.pos[1] + k * 0.1, c.pos[2]] }}>
      <Snowman pos={[SX, 0, sz]} p={{ nose: false, angry: 1, hop: f < land ? hop : 0, armL: 1.6, armR: 1.6, yaw: Math.PI }} />
      <Dog pos={[SX + 0.3, 0, z0 + 0.6]} dir={-1} pose={{ expr: 'shock', carrot: true }} f={f} />
    </Shot>
  );
};
export const SBack: React.FC = () => {
  const { f, dur } = useShot('s_back');
  const z0 = SZ - 27;
  const t = smoother(clamp((f - 18) / 26));
  const c = camK(f, [{ f: 0, p: [SX + 2.2, 0.9, z0 + 2.5], l: [SX, 0.9, z0 - 0.3], fov: 42 }, { f: dur, p: [SX + 1.8, 0.9, z0 + 2.1], l: [SX, 1.0, z0 - 0.4], fov: 40 }]);
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, z0 - 1.2]} p={{ nose: t >= 1, angry: lerp(1, 0.3, t), armL: 1.6, armR: lerp(1.6, 0.6, t), yaw: Math.PI }} />
      <Dog pos={[SX + 0.3, 0, z0 + 0.6]} dir={-1} pose={{ expr: 'sad', carrot: f < 18 }} f={f} />
      {f >= 18 && t < 1 && <Carrot pos={[lerp(SX + 0.1, SX, t), lerp(0.75, FACE_Y - 0.02, t), lerp(z0 + 0.6, z0 - 1.62, t)]} rot={[-Math.PI / 2, 0, 0]} />}
    </Shot>
  );
};
export const SReturn: React.FC = () => {
  const { f, dur } = useShot('s_return');
  const home = 48;
  const t = clamp(f / home);
  const kidOut = clamp((f - 66) / 30);
  const c = camK(f, [{ f: 0, p: [-2.5, 1.5, SZ + 7], l: [SX, 1.0, SZ - 2], fov: 46 }, { f: dur, p: [-2, 1.5, SZ + 5.6], l: [SX - 1, 1.1, SZ], fov: 44 }]);
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, lerp(SZ - 8, SZ, t)]} p={{ hop: t < 1 ? Math.abs(Math.sin(f * 0.25)) * 0.6 : 0 }} />
      <Dog pos={[SX + 1.0, 0, f < home ? lerp(SZ - 7, SZ + 0.4, t) : SZ + 0.4]} dir={-1} pose={{ expr: 'happy', scarf: f > home, run: f < home ? f * 0.5 : undefined }} f={f} />
      {kidOut > 0 && <Card role="kid" pos={[lerp(-7.6, -4.0, kidOut), 0, lerp(9.2, 8.2, kidOut)]} pose={{ expr: kidOut < 1 ? 'happy' : 'shock', walk: kidOut < 1 ? f * 0.3 : 0, stride: kidOut < 1 ? 0.6 : 0 }} f={f} />}
    </Shot>
  );
};
export const SWink: React.FC = () => {
  const { f, dur } = useShot('s_wink');
  const c = camK(f, [{ f: 0, p: [SX + 0.6, FACE_Y - 0.1, SZ + 2.6], l: [SX, FACE_Y - 0.2, SZ], fov: 38 }, { f: dur, p: [SX + 0.3, FACE_Y - 0.05, SZ + 1.7], l: [SX, FACE_Y - 0.15, SZ], fov: 36 }]);
  const wink = f > 30 && f < 48 ? 1 : 0;
  return (
    <Shot f={f} c={c}>
      <Snowman pos={[SX, 0, SZ]} p={{ wink, yaw: 0.25 }} />
      <Dog pos={[SX + 1.25, 0, SZ + 0.7]} dir={-1} pose={{ expr: 'happy', scarf: true }} f={f} h={0.8} />
    </Shot>
  );
};

export const SNOW_SCENES: Record<string, React.FC> = {
  s_build: SBuild, s_nose: SNose, s_proud: SProud, s_leave: SLeave, s_dog: SDog, s_steal: SSteal, s_run: SRun, s_wake: SWake, s_angry: SAngry,
  s_chase: SChase, s_look: SLook, s_catch: SCatch, s_back: SBack, s_return: SReturn, s_wink: SWink,
};
