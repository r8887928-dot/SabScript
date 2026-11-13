import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mat, basic, spr, radialTex } from '../three/core';
import { useScreen } from '../three/props';
import { Person, merge, EXPR, idle, walk, run, randomLook, Pose } from '../three/person';
import { tl, shotById } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, easeIn, smoother, kick, clamp, hash } from '../lib/anim';
import { Hall, Station } from '../liberty/kit';
import { DesertMap } from './map';
import { HERO, ToyRifle, RifleOnGround, BombPack, Grenade, enemyLook, EnemyHelmet, aimPose, crouch, kneel, fall, Puffs, SmokeCloud, MuzzleFlash, Tracer, Stars, Confetti, ScreenArm } from './actors';

const B = () => tl.beats as Record<string, number>;
const useShot = (id: string) => {
  const f = useCurrentFrame();
  const s = shotById(id) ?? { dur: 90, from: 0 };
  /** local frame of a global beat (seconds) */
  const at = (sec: number) => Math.round(sec * 30) - s.from;
  return { f, dur: s.dur as number, at };
};
const DAY = { ...LOOKS.day, sunAz: 60, sunEl: 48, sun: '#fff1d6', sunI: 3.4, hemiI: 1.0, fog: '#f3dfb6', fogNear: 40, fogFar: 160, top: '#3b8be0', hor: '#f6e3bd' };
const CLUB = { ...LOOKS.studio, top: '#07050f', hor: '#140c26', bot: '#05040a', fog: '#0c0818', fogNear: 7, fogFar: 30, hemiSky: '#7c6cf7', hemiGround: '#100a20', hemiI: 0.6, sunI: 0.7, env: 0.35 };
const seated = (extra: Pose = {}): Pose => merge({ legL: 1.4, legR: 1.4, kneeL: 1.45, kneeR: 1.45 }, extra);

// ------------------------------------------------------------------ the monitor game (canvas)
const gameView = (f: number, glow: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#5fa8e8'); sky.addColorStop(0.55, '#f6e3bd'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#d9b77e'; g.fillRect(0, h * 0.25, w * 0.28, h * 0.5); g.fillRect(w * 0.72, h * 0.3, w * 0.28, h * 0.45);
  g.fillStyle = '#2f7f86'; g.fillRect(w * 0.42, h * 0.38, w * 0.16, h * 0.3);
  g.fillStyle = '#e3c48f'; g.fillRect(0, h * 0.68, w, h * 0.32);
  g.fillStyle = '#c2410c'; const ex = w * (0.45 + Math.sin(f * 0.05) * 0.05); g.fillRect(ex, h * 0.46, w * 0.03, h * 0.14); g.beginPath(); g.arc(ex + w * 0.015, h * 0.44, w * 0.018, 0, 7); g.fill();
  g.fillStyle = '#334155'; g.beginPath(); g.moveTo(w * 0.62, h); g.lineTo(w * 0.74, h * 0.72); g.lineTo(w * 0.8, h * 0.74); g.lineTo(w * 0.72, h); g.fill();
  g.strokeStyle = '#4ade80'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 - 12, h / 2); g.lineTo(w / 2 + 12, h / 2); g.moveTo(w / 2, h / 2 - 12); g.lineTo(w / 2, h / 2 + 12); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(10, h - 34, 120, 26); g.fillStyle = '#fff'; g.font = '900 20px Montserrat'; g.fillText('+ 100', 20, h - 14);
  if (glow > 0) { g.fillStyle = `rgba(255,255,255,${glow * 0.9})`; g.fillRect(0, 0, w, h); }
};
/** the hero's desk in the club, front row; screen at (0, 1.19, 2.0) facing +z */
const ClubSet: React.FC<{ f: number; tex: THREE.Texture; cheer?: number; hallPlayers?: number }> = ({ f, tex, cheer = 0, hallPlayers = 7 }) => (
  <group>
    <Hall f={f} zones={['vip', 'main', 'pro']} rows={3} cols={5} players={hallPlayers} cheer={cheer} />
    <mesh position={[0, 0.74, 2.12]} material={mat('#121218', { r: 0.4, m: 0.3 })} castShadow receiveShadow><boxGeometry args={[1.4, 0.05, 0.75]} /></mesh>
    <Station pos={[0, 0, 2.3]} zone="vip" tex={tex} big chair={false} seed={2} />
  </group>
);
const RIPPLE = (pos: number[], f: number, s = 0.6, o = 1) => (
  <>{[0, 1, 2].map((i) => { const t = ((f / 18 + i / 3) % 1); return <sprite key={i} position={pos as any} scale={[s * t * 2, s * t * 2, 1]} material={spr('#bff8ff', { map: radialTex('ring_soft', 'rgba(255,255,255,0)', 'rgba(255,255,255,1)', 0.75), add: true, t: o * (1 - t) })} />; })}</>
);

// 1. the club: the hero plays
export const CClub: React.FC = () => {
  const { f, dur } = useShot('c_club');
  const tex = useScreen(512, 288, 'cs_game' + Math.floor(f / 2), gameView(f, 0));
  const c = camK(f, [{ f: 0, p: [1.1, 1.85, 4.6], l: [0, 1.15, 1.9], fov: 44 }, { f: dur, p: [0.55, 1.6, 3.55], l: [0, 1.18, 1.95], fov: 42 }]);
  const typing = Math.sin(f * 0.9) * 0.06;
  return (
    <Stage>
      <Lights look={CLUB} center={[0, 1, 0]} size={10} noSky />
      <Cam {...c} />
      <ClubSet f={f} tex={tex} />
      <Person look={HERO()} pos={[0, -0.3, 2.62]} rotY={Math.PI} pose={seated(merge(idle(f, 1), EXPR.grin, { armL: [1.15 + typing, 0.1, 0.95], armR: [1.15 - typing, 0.1, 0.95] }))} />
      <pointLight position={[0, 1.25, 2.3]} intensity={3} distance={2} color="#9fd8ff" />
    </Stage>
  );
};
// 2. a hand comes out of the monitor and grabs him
export const CHand: React.FC = () => {
  const { f, dur, at } = useShot('c_hand');
  const tex = useScreen(512, 288, 'cs_game' + Math.floor(f / 2) + 'g', gameView(f + 114, ramp(f, 0, 14) * 0.3));
  const grab = at(B().grab);
  const len = easeOut(ramp(f, 4, grab));
  const grip = ramp(f, grab - 2, grab + 4);
  const tug = f > grab ? ramp(f, grab + 4, dur) * 0.18 : 0;
  const c = camK(f, [{ f: 0, p: [2.3, 1.5, 2.15], l: [0, 1.2, 2.3], fov: 44 }, { f: dur, p: [2.0, 1.45, 2.1], l: [0, 1.22, 2.3], fov: 42 }]);
  return (
    <Stage>
      <Lights look={CLUB} center={[0, 1, 0]} size={10} noSky />
      <Cam pos={[c.pos[0] + kick(f, grab, 6) * 0.03, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <ClubSet f={f} tex={tex} />
      {RIPPLE([0, 1.19, 2.03], f, 0.7)}
      <ScreenArm pos={[0, 1.19, 2.0]} len={len * 0.85 - tug * 2} grip={grip} />
      <Person look={HERO()} pos={[0, -0.3, 2.62 - tug]} rotY={Math.PI} pose={seated(merge(f > grab ? EXPR.shock : EXPR.grin, { armL: f > grab ? [1.6, 0.6, 0.4] : [1.15, 0.1, 0.95], armR: f > grab ? [1.6, 0.6, 0.4] : [1.15, 0.1, 0.95], body: [f > grab ? 0.25 : 0.05, 0, 0] }))} />
      <pointLight position={[0, 1.25, 2.4]} intensity={4 + len * 6} distance={2.5} color="#bff8ff" />
    </Stage>
  );
};
// 3. pulled into the screen
export const CPull: React.FC = () => {
  const { f, dur } = useShot('c_pull');
  const p = easeIn(ramp(f, 0, dur - 6));
  const tex = useScreen(512, 288, 'cs_pull' + Math.floor(f / 2), gameView(f + 200, 0.2 + p * 0.8));
  const c = camK(f, [{ f: 0, p: [0.9, 1.45, 3.7], l: [0, 1.2, 2.0], fov: 42 }, { f: dur, p: [0.05, 1.22, 2.35], l: [0, 1.19, 2.0], fov: 40 }]);
  const s = 1 - p * 0.92;
  return (
    <Stage>
      <Lights look={CLUB} center={[0, 1, 0]} size={10} noSky />
      <Cam {...c} />
      <ClubSet f={f} tex={tex} />
      {RIPPLE([0, 1.19, 2.03], f, 0.9, 1)}
      <group position={[0, lerp(0, 1.1, p), lerp(2.62, 2.05, p)]} rotation={[0, Math.PI + p * 6, p * 1.5]} scale={[s, s, s]}>
        <Person look={HERO()} pos={[0, -0.3 - lerp(0, 1.1, p) * 0, 0]} pose={merge(EXPR.shock, fall(f))} />
      </group>
      <pointLight position={[0, 1.25, 2.4]} intensity={10 + p * 30} distance={3} color="#ffffff" />
    </Stage>
  );
};
// 4. falling from the sky over the map
export const CFall: React.FC = () => {
  const { f, dur } = useShot('c_fall');
  const p = f / dur;
  const clouds = useMemo(() => { const q = rng(5); return Array.from({ length: 26 }).map(() => [(q() - 0.5) * 30, q() * 60, (q() - 0.5) * 30 - 10, 4 + q() * 6]); }, []);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 0]} size={60} frame={f} />
      <Cam pos={[2.6, 1.2, 5.5]} look={[0, -0.6, 0]} fov={52} roll={Math.sin(f * 0.2) * 3} />
      <group position={[-1, lerp(-140, -35, easeIn(p)), -6]}><DesertMap /></group>
      {clouds.map(([x, y, z, s], i) => <sprite key={i} position={[x, ((y + f * 1.6) % 60) - 30, z]} scale={[s, s * 0.6, 1]} material={spr('#ffffff', { map: radialTex('puff', 'rgba(255,255,255,1)', 'rgba(255,255,255,0)', 0.35), t: 0.85 })} />)}
      <group rotation={[0.3 + Math.sin(f * 0.1) * 0.2, f * 0.03, Math.sin(f * 0.13) * 0.3]}>
        <Person look={HERO()} pos={[0, -0.9, 0]} pose={merge(EXPR.shock, fall(f))} />
      </group>
      {Array.from({ length: 12 }).map((_, i) => { const q = rng(i + 3); return <mesh key={'l' + i} position={[(q() - 0.5) * 6, ((q() * 10 + f * 0.9) % 10) - 5, (q() - 0.5) * 4]} material={basic('#ffffff', { t: 0.5 })}><boxGeometry args={[0.02, 1.4, 0.02]} /></mesh>; })}
    </Stage>
  );
};
// 5. landing in a cloud of dust
export const CLand: React.FC = () => {
  const { f, dur, at } = useShot('c_land');
  const land = at(B().land);
  const y = f < land ? lerp(9, 0, easeIn(f / land)) : 0;
  const sq = f >= land ? Math.exp(-(f - land) * 0.25) * Math.sin((f - land) * 0.9) * 0.25 : 0;
  const c = { pos: [2.6 + kick(f, land, 10) * 0.12, 1.5 + kick(f, land, 10) * 0.12, 13], look: [0, 1.0, 8], fov: 46 };
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 6]} size={30} frame={f} />
      <Cam {...c} />
      <DesertMap />
      <group position={[0, y, 8]} scale={[1 + sq * 0.6, 1 - sq, 1 + sq * 0.6]}>
        <Person look={HERO()} pos={[0, 0, 0]} pose={f < land ? merge(EXPR.shock, fall(f)) : merge(EXPR.dumb, crouch({ y: -0.3 * Math.exp(-(f - land) * 0.15) }))} />
      </group>
      <Puffs pos={[0, 0, 8]} t={f >= land ? (f - land) / 40 : 0} n={22} r={2.6} col="#e8d3a8" o={0.95} s={1.4} />
    </Stage>
  );
};
// 6. «Где я?.. как интересно»
export const CWhere: React.FC = () => {
  const { f, dur, at } = useShot('c_where');
  const curious = at(tl.at.H1 + 1.4);
  const yaw = Math.sin(f * 0.06) * 0.6;
  const c = camK(f, [{ f: 0, p: [0.35, 1.62, 10.0], l: [0, 1.55, 8], fov: 34 }, { f: dur, p: [0.25, 1.6, 9.6], l: [0, 1.56, 8], fov: 34 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 6]} size={30} frame={f} />
      <Cam {...c} />
      <DesertMap />
      <Person look={HERO()} pos={[0, 0, 8]} pose={merge(idle(f, 2), f < curious ? EXPR.confused : EXPR.happy, { head: [0.0, yaw, f < curious ? 0.12 : -0.05], armR: f > curious ? [1.9, 0.2, 1.9] : [0.1, 0.1, 0.2] })} />
      <Puffs pos={[0, 0, 8]} t={0.55 + f / 300} n={10} r={3} col="#e8d3a8" o={0.6} s={1.6} />
    </Stage>
  );
};
// 7. the team is falling one by one (aerial of the map)
export const CTeam1: React.FC = () => {
  const { f, dur } = useShot('c_team1');
  const c = camK(f, [{ f: 0, p: [0, 22, 26], l: [0, 0, 2], fov: 46 }, { f: dur, p: [7, 16, 18], l: [0, 0, 3], fov: 46 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 0]} size={40} frame={f} />
      <Cam {...c} />
      <DesertMap />
      <Person look={HERO()} pos={[0, 0, 8]} rotY={Math.sin(f * 0.03) * 0.8} pose={merge(idle(f, 3), EXPR.confused)} />
      <sprite position={[0, 2.6, 8]} scale={[1.2, 1.2, 1]} material={spr('#22d3ee', { map: radialTex('glow'), add: true, t: 0.6 })} />
    </Stage>
  );
};
// 8. «Ты один остался. Давай, удиви нас» — sad, then a grin
export const CTeam2: React.FC = () => {
  const { f, dur } = useShot('c_team2');
  const turn = Math.round(dur * 0.7);
  const c = camK(f, [{ f: 0, p: [0.6, 1.55, 10.6], l: [0, 1.35, 8], fov: 40 }, { f: dur, p: [0.4, 1.55, 9.8], l: [0, 1.45, 8], fov: 38 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 6]} size={30} frame={f} />
      <Cam {...c} />
      <DesertMap />
      <Person look={HERO()} pos={[0, 0, 8]} pose={merge(idle(f, 4), f < turn ? EXPR.sad : EXPR.grin, { head: [f < turn ? 0.3 : -0.05, 0, 0], armR: f < turn ? [0.1, 0.1, 0.2] : [0.3, 2.3, 0.3] })} />
    </Stage>
  );
};
// 9. the rifle and the bomb on the ground; he picks them up
export const CLoot: React.FC = () => {
  const { f, dur, at } = useShot('c_loot');
  const pick = at(B().pickup);
  const wp = clamp(f / Math.max(1, pick - 10));
  const z = lerp(7.8, 5.0, wp);
  const has = f >= pick;
  const c = camK(f, [{ f: 0, p: [2.4, 1.6, 1.2], l: [0, 0.5, 4.9], fov: 46 }, { f: dur, p: [2.0, 1.7, 1.6], l: [0, 0.9, 4.9], fov: 46 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 4]} size={30} frame={f} />
      <Cam {...c} />
      <DesertMap />
      {!has && <RifleOnGround pos={[0.6, 0.06, 4.2]} rotY={0.4} glow={0.6 + 0.4 * Math.sin(f * 0.3)} />}
      {!has && <BombPack pos={[-0.7, 0, 4.0]} rot={[0, 0.5, 0]} s={1.3} />}
      {!has && <sprite position={[-0.7, 0.35, 4.0]} scale={[1.2, 1.2, 1]} material={spr('#ffe14a', { map: radialTex('glow'), add: true, t: 0.45 })} />}
      <Person look={HERO()} pos={[0, 0, z]} rotY={Math.PI} pose={merge(wp < 1 ? walk(f * 0.35) : idle(f, 2), EXPR.grin, has ? aimPose({ armR: [1.0, 0.1, 0.6], armL: [0.6, -0.1, 0.8] }) : {}, !has && wp >= 1 ? { body: [0.6, 0, 0], armR: [1.2, 0.1, 0.2], armL: [1.2, 0.1, 0.2] } : {})} propR={has ? <ToyRifle /> : null} />
      {has && <BombPack pos={[0, 1.15, z + 0.22]} rot={[Math.PI / 2, 0, 0]} s={1.1} />}
      {f >= pick && f < pick + 12 && <sprite position={[0, 1, 4.5]} scale={[2.4, 2.4, 1]} material={spr('#ffffff', { map: radialTex('glow'), add: true, t: 1 - (f - pick) / 12 })} />}
    </Stage>
  );
};
// 10. the gate: an enemy comes in — headshot
export const CGate: React.FC = () => {
  const { f, dur, at } = useShot('c_gate');
  const open = at(B().enemy_in), hs = at(B().headshot);
  const gate = smoother(ramp(f, open - 6, open + 10));
  const ez = f < open ? -2 : lerp(-1.6, 0.4, clamp((f - open) / (hs - open)));
  const dead = f >= hs;
  const fallT = clamp((f - hs) / 12);
  const helm = dead ? [0.0 + (f - hs) * 0.02, 1.7 + (f - hs) * 0.09 - ((f - hs) ** 2) * 0.0035, 0.4 - (f - hs) * 0.03] : [0, 0, 0];
  const c = camK(f, [{ f: 0, p: [1.05, 1.72, 4.9], l: [0, 1.35, -1], fov: 42 }, { f: dur, p: [0.95, 1.7, 4.5], l: [0, 1.4, -1], fov: 40 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 2]} size={30} frame={f} />
      <Cam pos={[c.pos[0] + kick(f, hs, 5) * 0.04, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <DesertMap gate={gate} />
      <Person look={HERO()} pos={[0.45, 0, 3.4]} rotY={Math.PI} pose={merge(EXPR.neutral, aimPose())} propR={<ToyRifle />} />
      <BombPack pos={[0.45, 1.15, 3.62]} rot={[Math.PI / 2, 0, 0]} s={1.1} />
      {f < hs + 18 && f >= open - 4 && (
        <group position={[0, 0, ez]} rotation={[-fallT * 1.2, 0, 0]}>
          <Person look={enemyLook(1)} pos={[0, 0, 0]} pose={merge(dead ? EXPR.dumb : walk(f * 0.3, 0.6), EXPR.neutral, dead ? EXPR.dumb : {}, aimPose({ armR: [1.2, 0.05, 0.4] }))} onHead={dead ? null : <EnemyHelmet />} propR={<ToyRifle />} />
        </group>
      )}
      {dead && f < hs + 26 && <group position={helm as any} rotation={[(f - hs) * 0.4, (f - hs) * 0.3, 0]}><EnemyHelmet /></group>}
      {dead && f < hs + 30 && <Stars pos={[0, 1.9, 0.4]} f={f} o={clamp((hs + 30 - f) / 10)} />}
      <MuzzleFlash pos={[0.36, 1.38, 2.75]} on={f >= hs && f < hs + 2} />
      <Tracer a={[0.36, 1.38, 2.75]} b={[0, 1.62, 0.4]} on={f >= hs && f < hs + 2} />
      <Puffs pos={[0, 0.6, 0.4]} t={f >= hs + 12 ? (f - hs - 12) / 26 : 0} n={14} r={0.9} col="#d6d3d1" o={0.95} s={1.2} seed={3} />
    </Stage>
  );
};
// 11. running to site A
export const CRun: React.FC = () => {
  const { f, dur } = useShot('c_run');
  const z = lerp(2.4, -10.5, f / dur);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, z]} size={30} frame={f} />
      <Cam pos={[0.9, 2.0, z + 3.6]} look={[0, 1.2, z - 4]} fov={48} />
      <DesertMap gate={1} />
      <Person look={HERO()} pos={[0, 0, z]} rotY={Math.PI} pose={merge(run(f * 0.55), EXPR.grin, { armR: [1.2, 0.1, 0.6] })} propR={<ToyRifle />} />
      <BombPack pos={[0, 1.15, z + 0.22]} rot={[Math.PI / 2, 0, 0]} s={1.1} />
      <Puffs pos={[0, 0, z + 0.6]} t={(f % 12) / 12} n={4} r={0.4} col="#e8d3a8" o={0.6} s={0.5} seed={f % 5} />
    </Stage>
  );
};
// 12. planting the bomb under the letter
export const CPlant: React.FC = () => {
  const { f, dur, at } = useShot('c_plant');
  const p0 = at(B().plant0), p1 = at(B().plant1);
  const placed = f >= p0;
  const c = camK(f, [{ f: 0, p: [2.0, 1.4, -11.4], l: [0, 0.8, -14.8], fov: 44 }, { f: dur, p: [1.3, 1.2, -12.2], l: [0, 0.7, -14.8], fov: 42 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, -14]} size={30} frame={f} />
      <Cam {...c} />
      <DesertMap gate={1} />
      <Person look={HERO()} pos={[0, 0, -14.1]} rotY={Math.PI} pose={merge(kneel(), EXPR.neutral, { armL: [1.0, 0.1, 0.9 + Math.sin(f * 0.8) * 0.15 * (f > p0 && f < p1 ? 1 : 0)], armR: [0.9, 0.1, 0.9] })} propR={f < p0 ? null : null} />
      {placed && <BombPack pos={[0, 0, -14.75]} s={1.3} armed={f >= p1} f={f} />}
      {f >= p1 && <sprite position={[0.17, 0.25, -14.85]} scale={[1.2 + 0.4 * Math.sin(f * 0.4), 1.2 + 0.4 * Math.sin(f * 0.4), 1]} material={spr('#ff3030', { map: radialTex('glow'), add: true, t: Math.floor(f / 15) % 2 ? 0.2 : 0.7 })} />}
    </Stage>
  );
};
/** an enemy walking along a path that dies at `die` (local frame) with a poof */
const Enemy: React.FC<{ f: number; seed: number; from: number[]; to: number[]; start: number; die: number; speed?: number }> = ({ f, seed, from, to, start, die, speed = 1.5 }) => {
  if (f < start || f > die + 20) return null;
  const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const s = Math.min(d, ((Math.min(f, die) - start) / 30) * speed);
  const pos = [from[0] + ((to[0] - from[0]) * s) / d, 0, from[1] + ((to[1] - from[1]) * s) / d];
  const rotY = Math.atan2(to[0] - from[0], to[1] - from[1]);
  const dead = f >= die;
  return (
    <group>
      {f < die + 10 && (
        <group position={pos as any} rotation={[0, rotY, 0]}>
          <group rotation={[-clamp((f - die) / 10) * 1.3, 0, 0]}>
            <Person look={enemyLook(seed)} pos={[0, 0, 0]} pose={merge(dead ? EXPR.dumb : walk(f * 0.3 + seed, 0.6), aimPose({ armR: [1.25, 0.05, 0.4] }))} onHead={<EnemyHelmet />} propR={<ToyRifle />} />
          </group>
        </group>
      )}
      {dead && <Stars pos={[pos[0], 1.9, pos[2]]} f={f} o={clamp((die + 20 - f) / 10)} />}
      <Puffs pos={[pos[0], 0.6, pos[2]]} t={f >= die + 8 ? (f - die - 8) / 18 : 0} n={12} r={0.8} col="#d6d3d1" o={0.95} s={1.1} seed={seed} />
    </group>
  );
};
// 13. three come out of the tunnel
export const CTunnel: React.FC = () => {
  const { f, dur, at } = useShot('c_tunnel');
  const k = [at(B().k1), at(B().k2), at(B().k3)];
  const firing = k.some((x) => f >= x - 4 && f <= x && (f % 2 === 0));
  const hit = at(B().hp1);
  const c = camK(f, [{ f: 0, p: [4.3, 1.85, -10.6], l: [-5, 1.25, -15], fov: 44 }, { f: dur, p: [4.0, 1.8, -11.0], l: [-5, 1.25, -15], fov: 42 }]);
  const muzzle = [1.75, 1.38, -12.85];
  const tgt = k.findIndex((x) => f >= x - 4 && f <= x);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, -14]} size={30} frame={f} />
      <Cam pos={[c.pos[0] + (firing ? (hash(f) - 0.5) * 0.04 : 0) + kick(f, hit, 8) * 0.06, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <DesertMap gate={1} />
      <BombPack pos={[0, 0, -14.75]} s={1.3} armed f={f} />
      <Person look={HERO()} pos={[2.5, 0, -12.6]} rotY={-Math.PI / 2 - 0.25} pose={merge(f >= hit ? EXPR.shock : EXPR.neutral, aimPose(), f >= hit && f < hit + 8 ? { body: [-0.2, 0, 0] } : {})} propR={<ToyRifle />} />
      <Enemy f={f} seed={2} from={[-7.6, -15]} to={[-2.5, -14.2]} start={8} die={k[0]} />
      <Enemy f={f} seed={3} from={[-7.6, -15.4]} to={[-3.0, -15.6]} start={24} die={k[1]} />
      <Enemy f={f} seed={4} from={[-7.6, -14.6]} to={[-2.0, -13.4]} start={40} die={k[2]} />
      <MuzzleFlash pos={muzzle} on={firing} />
      {tgt >= 0 && <Tracer a={muzzle} b={[-3, 1.5, -14.6]} on={firing} />}
      {[k[0] - 12, k[1] - 10, hit - 6].map((x, i) => <MuzzleFlash key={'e' + i} pos={[-3.5, 1.4, -14.8 + i * 0.6]} on={f >= x && f < x + 2} s={0.4} />)}
    </Stage>
  );
};
// 14. one hp left — catching breath behind the crates
export const CLowHp: React.FC = () => {
  const { f, dur } = useShot('c_lowhp');
  const c = camK(f, [{ f: 0, p: [-2.0, 1.0, -6.2], l: [-3.2, 0.8, -8.0], fov: 44 }, { f: dur, p: [-2.3, 0.95, -6.6], l: [-3.2, 0.8, -8.0], fov: 42 }]);
  const breath = Math.sin(f * 0.35) * 0.04;
  return (
    <Stage>
      <Lights look={{ ...DAY, sunI: 2.6 }} center={[0, 0, -12]} size={30} frame={f} />
      <Cam {...c} />
      <DesertMap gate={1} />
      <Person look={HERO()} pos={[-3.2, 0, -8.0]} rotY={0.5} pose={merge(crouch({ y: -0.42 + breath }), EXPR.sad, { armL: [0.9, 0.2, 1.3], armR: [1.0, 0.1, 0.5], head: [0.15 + breath, 0, 0] })} propR={<ToyRifle />} />
      <pointLight position={[-2.6, 1.4, -6.9]} intensity={3} distance={4} color="#ff3030" />
    </Stage>
  );
};
// 15. smoke on the bomb
export const CSmoke: React.FC = () => {
  const { f, dur, at } = useShot('c_smoke');
  const th = at(B().throw), sm = at(B().smoke);
  const gt = clamp((f - th) / (sm - th));
  const gpos = [lerp(4.0, 0, gt), 1.6 + Math.sin(gt * Math.PI) * 2.2 - gt * 1.5, lerp(-8.8, -14.6, gt)];
  const c = camK(f, [{ f: 0, p: [6.8, 2.4, -5.2], l: [1.6, 1.0, -13], fov: 46 }, { f: dur, p: [6.4, 2.3, -5.6], l: [1.2, 1.2, -13.5], fov: 46 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, -12]} size={30} frame={f} />
      <Cam {...c} />
      <DesertMap gate={1} />
      <BombPack pos={[0, 0, -14.75]} s={1.3} armed f={f} />
      <Person look={HERO()} pos={[4.0, 0, -8.6]} rotY={Math.PI + 0.5} pose={merge(EXPR.grin, { armL: f < th ? [2.6 - ramp(f, th - 10, th) * 1.8, 0.4, 0.5] : [0.8, 0.3, 0.4], armR: [0.6, 0.1, 0.8] })} propR={<ToyRifle />} />
      {f >= th && f < sm && <Grenade pos={gpos} rot={f * 0.5} />}
      <SmokeCloud pos={[0, 0, -14.6]} t={f >= sm ? (f - sm) / 30 : 0} f={f} />
    </Stage>
  );
};
// 16. waiting behind the car; the last one walks into the smoke and starts to defuse
export const CCar: React.FC = () => {
  const { f, dur, at } = useShot('c_car');
  const ein = at(B().enemy2_in), def = at(B().defuse0);
  const c = camK(f, [{ f: 0, p: [7.0, 3.3, -4.8], l: [0.4, 0.7, -14.4], fov: 46 }, { f: dur, p: [6.6, 3.1, -5.3], l: [0.1, 0.7, -14.5], fov: 42 }]);
  const walking = f >= ein && f < def;
  const ep = clamp((f - ein) / Math.max(1, def - ein));
  const epos = [lerp(-6.8, -0.3, ep), 0, lerp(-15.2, -14.6, ep)];
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, -12]} size={30} frame={f} />
      <Cam {...c} />
      <DesertMap gate={1} />
      <BombPack pos={[0, 0, -14.75]} s={1.3} armed f={f} />
      <SmokeCloud pos={[0, 0, -14.6]} t={1} f={f + 66} o={0.13} />
      {f >= ein && <Person look={enemyLook(5)} pos={epos} rotY={walking ? Math.PI / 2 : Math.PI / 2} pose={merge(walking ? walk(f * 0.3, 0.5) : kneel(), EXPR.neutral, walking ? aimPose({ armR: [1.2, 0.05, 0.4] }) : { armL: [1.0, 0.1, 0.9], armR: [1.0, 0.1, 0.9] })} onHead={<EnemyHelmet />} />}
      <Person look={HERO()} pos={[4.7, 0, -8.5]} rotY={Math.PI - 0.4} pose={merge(crouch(), EXPR.neutral, { armR: [1.1, 0.1, 0.6], armL: [1.0, -0.2, 0.7], head: [-0.1, 0, 0] })} propR={<ToyRifle />} />
    </Stage>
  );
};
// 17. he pops up and takes the shot
export const CKill: React.FC = () => {
  const { f, at } = useShot('c_kill');
  const k = at(B().kill_last);
  const muzzle = [4.3, 1.45, -9.4];
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, -12]} size={30} frame={f} />
      <Cam pos={[6.9 + kick(f, k, 6) * 0.05, 2.9, -5.2]} look={[0.4, 0.9, -14.4]} fov={42} />
      <DesertMap gate={1} />
      <BombPack pos={[0, 0, -14.75]} s={1.3} armed f={f} />
      <SmokeCloud pos={[0, 0, -14.6]} t={1} f={f + 200} o={0.13} />
      <Person look={HERO()} pos={[4.7, 0, -8.6]} rotY={Math.PI - 0.55} pose={merge(EXPR.grin, aimPose())} propR={<ToyRifle />} />
      <MuzzleFlash pos={muzzle} on={f >= k && f < k + 2} s={0.8} />
      <Tracer a={muzzle} b={[-0.3, 1.0, -14.6]} on={f >= k && f < k + 2} />
      <Puffs pos={[-0.3, 0.8, -14.6]} t={f >= k + 4 ? (f - k - 4) / 20 : 0} n={12} r={1} col="#ffe14a" o={0.9} s={0.6} seed={8} />
    </Stage>
  );
};
// 18. clutch won
export const CWin: React.FC = () => {
  const { f, dur } = useShot('c_win');
  const a = lerp(-0.6, 0.6, smoother(f / dur));
  const jump = Math.abs(Math.sin(f * 0.2));
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, -13]} size={30} frame={f} />
      <Cam pos={[Math.sin(a) * 5.5, 1.8, -10.5 + Math.cos(a) * 5.5]} look={[0, 1.4, -11]} fov={44} />
      <DesertMap gate={1} />
      <SmokeCloud pos={[0, 0, -14.6]} t={1} f={f + 260} o={Math.max(0, 0.35 - f / 120)} />
      <Person look={HERO()} pos={[0, 0, -11]} pose={merge(EXPR.grin, { armL: [0.3, 2.45, 0.15], armR: [0.3, 2.45, 0.15], y: jump * 0.25, legL: jump * 0.3, kneeL: jump * 0.5 })} />
      <Confetti f={f} t0={0} center={[0, 0, -11.2]} />
    </Stage>
  );
};
// 19. back in the club, friends cheering
export const CBack: React.FC = () => {
  const { f, dur } = useShot('c_back');
  const tex = useScreen(512, 288, 'cs_win', (g, w, h) => { const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1e3a8a'); bg.addColorStop(1, '#7c3aed'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = '#facc15'; g.font = '900 64px Montserrat'; g.textAlign = 'center'; g.fillText('ПОБЕДА!', w / 2, h / 2 + 10); g.fillStyle = '#fff'; g.font = '800 30px Montserrat'; g.fillText('КЛАТЧ 1 vs 5', w / 2, h / 2 + 60); });
  const c = camK(f, [{ f: 0, p: [0.8, 1.9, 7.8], l: [0, 1.2, 2.8], fov: 46 }, { f: dur, p: [0.3, 1.8, 7.0], l: [0, 1.25, 2.8], fov: 44 }]);
  const jump = (i: number) => Math.abs(Math.sin(f * 0.22 + i));
  const friends = [[-0.95, 3.2, 1], [0.95, 3.25, 2], [0.4, 3.75, 3], [-0.5, 3.8, 4]];
  return (
    <Stage>
      <Lights look={CLUB} center={[0, 1, 2]} size={10} noSky />
      <Cam {...c} />
      <ClubSet f={f} tex={tex} cheer={1} hallPlayers={5} />
      <Person look={HERO()} pos={[0, -0.3, 2.62]} rotY={0.2} pose={seated(merge(EXPR.grin, { armL: [0.3, 2.45, 0.15], armR: [0.3, 2.45, 0.15] }))} />
      {friends.map(([x, z, s], i) => <Person key={i} look={randomLook(3300 + (s as number), { hairStyle: i % 2 ? 'cap' : 'short', hat: '#22d3ee' })} pos={[x, 0, z]} rotY={Math.atan2(-x, 2.6 - z) + Math.PI} pose={merge(EXPR.grin, { armL: [0.3, 2.3 + Math.sin(f * 0.3 + i) * 0.2, 0.2], armR: [0.3, 2.3 + Math.cos(f * 0.3 + i) * 0.2, 0.2], y: jump(i) * 0.15 })} />)}
      <pointLight position={[0, 2.2, 3.6]} intensity={8} distance={6} color="#ffd9a8" />
    </Stage>
  );
};
// 20. end card background
export const CEnd: React.FC = () => {
  const { f } = useShot('c_end');
  const tex = useScreen(512, 288, 'cs_game_end' + Math.floor(f / 4), gameView(f, 0));
  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'blur(7px) brightness(0.5)', transform: 'scale(1.06)' }}>
      <Stage>
        <Lights look={CLUB} center={[0, 1, 0]} size={10} noSky />
        <Cam pos={[Math.sin(f * 0.01) * 1.2, 2.2, 6]} look={[0, 1.2, -1]} fov={50} />
        <ClubSet f={f} tex={tex} hallPlayers={9} />
      </Stage>
    </div>
  );
};

export const CS_SCENES: Record<string, React.FC> = {
  c_club: CClub, c_hand: CHand, c_pull: CPull, c_fall: CFall, c_land: CLand, c_where: CWhere, c_team1: CTeam1, c_team2: CTeam2,
  c_loot: CLoot, c_gate: CGate, c_run: CRun, c_plant: CPlant, c_tunnel: CTunnel, c_lowhp: CLowHp, c_smoke: CSmoke, c_car: CCar,
  c_kill: CKill, c_win: CWin, c_back: CBack, c_end: CEnd,
};
void hash; void basic;
