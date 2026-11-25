import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Lights, Cam, mat, basic, spr, radialTex, canvasTex } from '../three/core';
import { shotById } from '../lib/tl';
import { camK, lerp, rng, smoother, clamp, easeIn, easeOut, kick } from '../lib/anim';
import { PStage } from '../coins/look';
import { Boston, Wave, Rivets, WINTER, SUMMER, DUSK, Inked } from './world';
import { Card, CamCtx } from './cast';

// «Сладкая волна» — 2D cards in a 3D 1919 Boston. Every shot: glide + slow push + gentle float, no static holds.
const useShot = (id: string) => {
  const f = useCurrentFrame();
  const s = shotById(id) ?? { dur: 120, from: 0 };
  return { f, dur: s.dur as number, p: f / Math.max(1, s.dur) };
};
type C = { pos: number[]; look: number[]; fov?: number; roll?: number };
/** stage with light + floating camera; children see the camera via CamCtx */
const Shot: React.FC<{ f: number; c: C; look?: any; center?: number[]; size?: number; shake?: number; children: React.ReactNode }> = ({ f, c, look = WINTER, center = [0, 0, 0], size = 40, shake = 0, children }) => {
  const fl = [Math.sin(f * 0.023) * 0.08, Math.sin(f * 0.019 + 1) * 0.05, Math.cos(f * 0.015) * 0.06];
  const sh = shake ? [(Math.sin(f * 2.1) * 0.5) * shake, (Math.cos(f * 2.7) * 0.5) * shake, 0] : [0, 0, 0];
  const pos = c.pos.map((v, i) => v + fl[i] + sh[i]);
  return (
    <PStage>
      <CamCtx.Provider value={pos}>
        <Lights look={look} center={center} size={size} frame={f} />
        <Cam pos={pos} look={c.look} fov={c.fov ?? 45} roll={(c.roll ?? 0) + Math.sin(f * 0.012) * 0.9} />
        {children}
      </CamCtx.Provider>
    </PStage>
  );
};
const runPose = (f: number, k = 0) => ({ walk: f * 0.45 + k, stride: 1, armL: 40 + Math.sin(f * 0.45 + k) * 30, armR: 40 - Math.sin(f * 0.45 + k) * 30, expr: 'scream' as const });

// ------------------------------------------------------------------ 1. hook: the wave towers over the street
export const MHook: React.FC = () => {
  const { f, dur } = useShot('m_hook');
  const front = lerp(-2, 13, f / dur);
  const c = camK(f, [{ f: 0, p: [1.2, 1.6, 34], l: [0, 5.0, 4], fov: 52, roll: -3 }, { f: dur, p: [0.6, 1.5, 30], l: [0, 5.5, 8], fov: 54, roll: 3 }]);
  return (
    <Shot f={f} c={c} center={[0, 0, 10]} shake={0.04}>
      <Boston f={f} burst={1} bend={(i) => (front > -14 + i * 6 ? 1 : 0)} />
      <Wave front={front} h={8.5} d={3} f={f} />
      <Card role="runner" pos={[-1.2, 0, front + 4 + f * 0.04]} pose={runPose(f)} f={f} />
      <Card role="lady" pos={[1.8, 0, front + 5.5 + f * 0.04]} pose={runPose(f, 1.5)} f={f} />
      <Card role="kid" pos={[-2.8, 0, front + 6.5 + f * 0.05]} pose={runPose(f, 0.7)} f={f} />
    </Shot>
  );
};
// 2. not water — molasses: close on the glossy surface
export const MNotWater: React.FC = () => {
  const { f, dur } = useShot('m_notwater');
  const c = camK(f, [{ f: 0, p: [3.0, 6.5, 9], l: [0, 1.5, -2], fov: 46 }, { f: dur, p: [2.2, 5.2, 6.5], l: [0, 1.5, -1], fov: 42 }]);
  return (
    <Shot f={f} c={c} center={[0, 0, 0]}>
      <Boston f={f} burst={1} bend={() => 1} />
      <Wave front={lerp(0, 1.5, f / dur)} h={3.2} d={1.6} f={f} />
      <sprite position={[0.8, 3.0, 1.2]} scale={[2.5, 1.2, 1]} material={spr('#ffe2b0', { map: radialTex('glow'), add: true, t: 0.4 })} />
    </Shot>
  );
};
// 3. the tank in the port (still grey, leaking)
export const MTank: React.FC = () => {
  const { f, dur } = useShot('m_tank');
  const c = camK(f, [{ f: 0, p: [1.5, 10, 22], l: [0, 7, -24], fov: 50 }, { f: dur, p: [0.8, 5, 8], l: [0, 8, -24], fov: 50 }]);
  return (
    <Shot f={f} c={c} center={[0, 0, -10]} size={60}>
      <Boston f={f} paint={0} />
      <Card role="worker" pos={[3, 0, -9]} pose={{ walk: f * 0.25, stride: 0.6, expr: 'neutral' }} f={f} />
      <Card role="worker" pos={[-4, 0, -6]} pose={{ expr: 'happy', armR: 60 }} f={f} />
      <Card role="cop" pos={[1, 0, 2]} pose={{ expr: 'neutral' }} f={f} />
      {Array.from({ length: 6 }).map((_, i) => <sprite key={i} position={[-8 + i * 3, 18 + Math.sin(f * 0.05 + i) * 0.5, -40 - i * 4]} scale={[0.5, 0.2, 1]} material={spr('#ffffff', { t: 1 })} />)}
    </Shot>
  );
};
const Drips: React.FC<{ f: number; z?: number }> = ({ f, z = -14.85 }) => (
  <>{Array.from({ length: 7 }).map((_, i) => { const r = rng(i + 3); const x = -3 + i; const t = ((f * 0.03 + r()) % 1); return <mesh key={i} position={[x + (r() - 0.5) * 0.4, 3.2 - t * 3.2, z]} scale={[1, 1.4, 1]} material={mat('#4a2108', { r: 0.15, m: 0.1 })}><sphereGeometry args={[0.07, 8, 6]} /></mesh>; })}
    {[-2.4, -0.6, 1.2].map((x, i) => <mesh key={'p' + i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z + 0.6]} material={mat('#4a2108', { r: 0.15, m: 0.1 })}><circleGeometry args={[0.45 + i * 0.1, 18]} /></mesh>)}</>
);
// 4. leaking from day one; kids collect drops on sticks
export const MLeak: React.FC = () => {
  const { f, dur } = useShot('m_leak');
  const c = camK(f, [{ f: 0, p: [4.2, 1.5, -8.5], l: [0, 1.4, -15], fov: 46 }, { f: dur, p: [2.6, 1.3, -10.2], l: [0, 1.4, -15], fov: 42 }]);
  const lick = Math.sin(f * 0.15);
  return (
    <Shot f={f} c={c} center={[0, 0, -14]} size={20}>
      <Boston f={f} paint={0} />
      <Drips f={f} />
      <Card role="kid" pos={[-1.6, 0, -13.6]} pose={{ expr: 'happy', armR: 150 + lick * 10, prop: 'stick' }} f={f} />
      <Card role="girl" pos={[0.6, 0, -13.4]} pose={{ expr: 'happy', armR: 100 + lick * 30, prop: 'stick' }} f={f} />
      <Card role="kid" pos={[2.0, 0, -12.6]} pose={{ expr: 'sly', armR: 40, armL: 20, prop: 'stick', walk: f * 0.3, stride: 0.5 }} f={f} />
    </Shot>
  );
};
// 5. the owners paint the tank brown
export const MPaint: React.FC = () => {
  const { f, dur } = useShot('m_paint');
  const c = camK(f, [{ f: 0, p: [5.5, 2.4, -8], l: [0, 3, -15], fov: 46 }, { f: dur, p: [3.6, 2.0, -9.5], l: [0, 2.6, -15], fov: 42 }]);
  const paint = smoother(clamp((f - 20) / (dur - 40)));
  const swing = Math.sin(f * 0.3);
  return (
    <Shot f={f} c={c} center={[0, 0, -14]} size={20}>
      <Boston f={f} paint={paint} />
      <Card role="owner" pos={[0.4, 0, -13.7]} pose={{ expr: 'sly', armR: 130 + swing * 25, prop: 'brush' }} f={f} />
      <Card role="worker" pos={[-2.2, 0, -13.5]} pose={{ expr: 'neutral', armR: 150 + swing * 20, prop: 'brush' }} f={f} />
      <Inked geo={<cylinderGeometry args={[0.3, 0.28, 0.45, 16]} />} material={mat('#5a3417', { r: 0.4 })} pos={[1.4, 0.22, -13.3]} k={0.05} />
    </Shot>
  );
};
const Thermo: React.FC<{ t: number }> = ({ t }) => {
  const v = Math.round(lerp(-17, 5, t));
  const tex = canvasTex('mol_thermo_' + v, 256, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#f4efe2'; g.strokeStyle = '#241726'; g.lineWidth = 12; g.beginPath(); (g as any).roundRect(60, 20, 136, 860, 60); g.fill(); g.stroke();
    g.beginPath(); g.arc(128, 900, 100, 0, 7); g.fillStyle = '#d8332b'; g.fill(); g.stroke();
    const y0 = 820, y1 = 120, lvl = y0 - (y0 - y1) * ((v + 25) / 40);
    g.fillStyle = '#d8332b'; g.fillRect(108, lvl, 40, 900 - lvl);
    g.fillStyle = '#241726'; for (let k = -20; k <= 15; k += 5) { const y = y0 - (y0 - y1) * ((k + 25) / 40); g.fillRect(70, y, k === 0 ? 50 : 30, 6); }
    g.font = '900 60px Montserrat'; g.textAlign = 'center'; g.fillStyle = v < 0 ? '#2e6fd8' : '#d8332b'; g.fillText((v > 0 ? '+' : '') + v + '°', 128, 90);
  });
  return <mesh position={[-4.2, 4.8, 3]} material={useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false }), [])}><planeGeometry args={[1.4, 5.6]} /><meshBasicMaterial map={tex} transparent toneMapped={false} /></mesh>;
};
// 6. warming: thermometer climbs, the tank groans and bubbles
export const MWarm: React.FC = () => {
  const { f, dur } = useShot('m_warm');
  const c = camK(f, [{ f: 0, p: [-2.5, 4, 12], l: [-1.5, 7, -20], fov: 56 }, { f: dur, p: [-2, 4.5, 8], l: [-1, 8, -22], fov: 54 }]);
  const t = smoother(clamp(f / (dur * 0.55)));
  const shake = clamp((f - dur * 0.5) / (dur * 0.5));
  return (
    <Shot f={f} c={c} center={[0, 0, -16]} size={40}>
      <Boston f={f} paint={1} shake={shake} snow={1 - t * 0.6} />
      <Thermo t={t} />
      {Array.from({ length: 10 }).map((_, i) => { const r = rng(i + 9); const k = ((f * 0.02 + r()) % 1); return <sprite key={i} position={[(r() - 0.5) * 10, 16 + k * 3, -24 + (r() - 0.5) * 8]} scale={[0.8 * (1 - k), 0.8 * (1 - k), 1]} material={spr('#ffffff', { map: radialTex('puff'), t: 0.5 * shake })} />; })}
    </Shot>
  );
};
// 7. rivets fly like bullets; the tank bursts
export const MBurst: React.FC = () => {
  const { f, dur } = useShot('m_burst');
  const at = 30;
  const b = f < at ? 0 : easeOut(clamp((f - at) / 40));
  const c = camK(f, [{ f: 0, p: [-3.5, 4, 6], l: [0, 6.5, -24], fov: 54 }, { f: dur, p: [-4.5, 5, 12], l: [0, 5, -22], fov: 58 }]);
  const k = kick(f, at, 8);
  return (
    <Shot f={f} c={{ ...c, pos: [c.pos[0] + k * 0.3, c.pos[1] + k * 0.2, c.pos[2]] }} center={[0, 0, -16]} size={50} shake={f < at ? 0.05 : 0.02}>
      <Boston f={f} paint={1} burst={b} shake={f < at ? 1 : 0} />
      <Rivets t={f < at - 12 ? 0 : (f - at + 12) * 0.6} />
      {f >= at && <Wave front={lerp(-14, -4, clamp((f - at) / 60))} h={lerp(10, 8, clamp((f - at) / 60))} d={3} f={f} from={-34} />}
    </Shot>
  );
};
// 8. the wave races down the street, bending the railway columns
export const MWave: React.FC = () => {
  const { f, dur } = useShot('m_wave');
  const front = lerp(-10, 30, f / dur);
  const c = { pos: [-4.5, 6.5, front + 19], look: [1, 3, front - 2], fov: 56 };
  return (
    <Shot f={f} c={c} center={[0, 0, front]} size={40} shake={0.03}>
      <Boston f={f} burst={1} bend={(i) => clamp((front - (-14 + i * 6)) / 4)} />
      <Wave front={front} h={7.5} d={2.6} f={f} />
      <Card role="cop" pos={[1, 0, front + 6 + f * 0.02]} pose={runPose(f, 0.3)} f={f} />
      <Card role="worker" pos={[-2, 0, front + 8 + f * 0.02]} pose={runPose(f, 1.1)} f={f} />
    </Shot>
  );
};
// 9. "you could just run" — a man runs, wave behind
export const MRun: React.FC = () => {
  const { f, dur } = useShot('m_run');
  const front = lerp(8, 12, f / dur);
  const c = camK(f, [{ f: 0, p: [1.4, 1.6, front + 9], l: [0, 1.6, front + 3], fov: 44 }, { f: dur, p: [1.2, 1.6, front + 7.5], l: [0, 1.7, front + 3], fov: 42 }]);
  return (
    <Shot f={f} c={c} center={[0, 0, front]} size={30}>
      <Boston f={f} burst={1} bend={() => 1} />
      <Wave front={front} h={6} d={2} f={f} />
      <Card role="runner" pos={[0, 0, front + 3.2]} pose={{ ...runPose(f), expr: 'shock' }} f={f} />
    </Shot>
  );
};
// 10. stuck: the cold molasses holds like honey
export const MStuck: React.FC = () => {
  const { f, dur } = useShot('m_stuck');
  const c = camK(f, [{ f: 0, p: [1.4, 1.7, 5.2], l: [0, 1.2, 0], fov: 40 }, { f: dur, p: [0.6, 1.5, 3.4], l: [0, 1.2, 0], fov: 36 }]);
  const stuck = lerp(0.45, 0.75, smoother(clamp(f / dur)));
  const flail = Math.sin(f * 0.5);
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2108', roughness: 0.14, metalness: 0.12, emissive: '#1a0700' }), []);
  return (
    <Shot f={f} c={c} center={[0, 0, 0]} size={20}>
      <Boston f={f} burst={1} bend={() => 1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.75, 0]} material={m} receiveShadow><planeGeometry args={[80, 80, 1, 1]} /></mesh>
      <Card role="runner" pos={[0, 0, 0]} pose={{ expr: 'scream', armL: 120 + flail * 30, armR: 140 - flail * 30, stuck }} f={f} shadow={false} />
      <Card role="lady" pos={[-3, 0, -3]} pose={{ expr: 'shock', armL: 150, armR: 100 + flail * 20, stuck: stuck + 0.1 }} f={f} shadow={false} />
      {[0, 1, 2].map((i) => { const t = ((f / 40 + i / 3) % 1); return <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.77, 0]} material={basic('#d9a36a', { t: 0.4 * (1 - t) })}><ringGeometry args={[0.4 + t * 1.6, 0.45 + t * 1.6, 32]} /></mesh>; })}
    </Shot>
  );
};
// 11. aftermath: dusk, brown street, rescuers hose with sea water
export const MAfter: React.FC = () => {
  const { f, dur } = useShot('m_after');
  const c = camK(f, [{ f: 0, p: [-3, 7, 26], l: [0, 2, 0], fov: 46 }, { f: dur, p: [-2, 6, 22], l: [0, 2, -2], fov: 46 }]);
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a1a06', roughness: 0.2, metalness: 0.1 }), []);
  return (
    <Shot f={f} c={c} look={DUSK} center={[0, 0, 5]} size={40}>
      <Boston f={f} burst={0.3} bend={() => 0.35} snow={0} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]} material={m}><planeGeometry args={[24, 80]} /></mesh>
      <Card role="cop" pos={[-1.5, 0, 12]} pose={{ expr: 'sad', armR: 70 }} f={f} />
      <Card role="worker" pos={[1.2, 0, 10]} pose={{ expr: 'sad', armR: 80, armL: 70 }} f={f} />
      {Array.from({ length: 18 }).map((_, i) => { const t = ((f * 0.03 + i / 18) % 1); return <sprite key={i} position={[1.5 + t * 0.4, 1.3 + Math.sin(t * Math.PI) * 1.2, 9.6 - t * 4]} scale={[0.25, 0.25, 1]} material={spr('#cfe6ff', { map: radialTex('puff'), t: 0.6 })} />; })}
    </Shot>
  );
};
const Blueprint: React.FC<{ signed: number }> = ({ signed }) => {
  const s = signed > 0.5 ? 1 : 0;
  const tex = canvasTex('mol_bp_' + s, 1024, 768, (g, w, h) => {
    g.fillStyle = '#1f4f8a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#e8f1ff'; g.lineWidth = 5; g.strokeRect(200, 160, 300, 420); g.beginPath(); g.ellipse(350, 160, 150, 30, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(350, 580, 150, 30, 0, 0, Math.PI); g.stroke();
    g.fillStyle = '#e8f1ff'; g.font = '700 34px Montserrat'; g.fillText('H = 15 m   Ø = 27 m', 560, 220); g.fillText('σ = P·r / t', 560, 290); g.fillText('t ≥ 20 mm', 560, 360); g.fillText('×3 запас', 560, 430);
    if (s) { g.save(); g.translate(760, 600); g.rotate(-0.18); g.strokeStyle = '#ff5a4a'; g.lineWidth = 10; g.strokeRect(-180, -60, 360, 120); g.fillStyle = '#ff5a4a'; g.font = '900 52px Montserrat'; g.textAlign = 'center'; g.fillText('ИНЖЕНЕР ✓', 0, 18); g.restore(); }
  });
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.93, 0]}><planeGeometry args={[1.6, 1.2]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>;
};
// 12. new rule: an engineer must sign every calculation
export const MRule: React.FC = () => {
  const { f, dur } = useShot('m_rule');
  const c = camK(f, [{ f: 0, p: [0.8, 2.4, 2.2], l: [0, 0.9, 0], fov: 44 }, { f: dur, p: [1.6, 2.0, 3.0], l: [0.2, 1.2, 0], fov: 44 }]);
  const signed = clamp((f - 70) / 10);
  return (
    <Shot f={f} c={c} look={SUMMER} center={[0, 0, 0]} size={16}>
      <Boston f={f} paint={0.15} snow={0} />
      <Inked geo={<boxGeometry args={[2.2, 0.08, 1.5]} />} material={mat('#6b4124', { r: 0.7 })} pos={[0, 0.88, 0]} k={0.02} />
      {[[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]].map(([x, z], i) => <mesh key={i} position={[x, 0.42, z]} material={mat('#3f2512')}><boxGeometry args={[0.08, 0.84, 0.08]} /></mesh>)}
      <Blueprint signed={signed} />
      <Card role="engineer" pos={[0.3, 0, -1.1]} pose={{ expr: f < 70 ? 'focus' : 'happy', armR: f < 70 ? 70 + Math.sin(f * 0.6) * 8 : 120, prop: 'pen' }} f={f} />
    </Shot>
  );
};
// 13. today: a sunny park on the same spot; does it still smell of molasses?
export const MToday: React.FC = () => {
  const { f, dur } = useShot('m_today');
  const c = camK(f, [{ f: 0, p: [2.4, 1.7, 9], l: [0, 1.5, 2], fov: 42 }, { f: dur, p: [1.4, 1.6, 6.5], l: [0, 1.55, 2], fov: 38 }]);
  const sniff = f > 40 ? 'sniff' : 'neutral';
  return (
    <Shot f={f} c={c} look={SUMMER} center={[0, 0, 2]} size={30}>
      <Boston f={f} noTank snow={0} summer />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -18]} material={mat('#5a9a3a', { r: 0.95 })}><planeGeometry args={[26, 22]} /></mesh>
      <Card role="tourist" pos={[0, 0, 2]} pose={{ expr: sniff as any, armR: f > 80 ? 30 : 12 }} f={f} />
      <Card role="girl" pos={[-2.4, 0, -1]} pose={{ expr: 'happy', walk: f * 0.25, stride: 0.5 }} f={f} />
      {Array.from({ length: 5 }).map((_, i) => { const t = ((f / 60 + i / 5) % 1); return <mesh key={i} position={[0.3 + Math.sin(t * 6 + i) * 0.25, 1.2 + t * 1.2, 2.3]} material={basic('#8a4a1a', { t: 0.5 * (1 - t) })}><torusGeometry args={[0.08 + t * 0.08, 0.012, 6, 16, Math.PI]} /></mesh>; })}
    </Shot>
  );
};

export const MOL_SCENES: Record<string, React.FC> = {
  m_hook: MHook, m_notwater: MNotWater, m_tank: MTank, m_leak: MLeak, m_paint: MPaint, m_warm: MWarm, m_burst: MBurst,
  m_wave: MWave, m_run: MRun, m_stuck: MStuck, m_after: MAfter, m_rule: MRule, m_today: MToday,
};
void easeIn;
