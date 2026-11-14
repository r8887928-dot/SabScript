import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic, spr, radialTex } from '../three/core';
import { City } from '../three/city';
import { Person, merge, EXPR, idle } from '../three/person';
import { Room, rbox, useScreen, Screen, Glow, Lamp } from '../three/props';
import { HERO } from '../game/scenes';
import { shotById } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, smoother, kick, clamp, hash } from '../lib/anim';
import { Hall, Station, Player, Text3D, ZONES, Zone, useGameTex } from '../club/kit';
import { Facade } from './facade';

const CLUB = { ...LOOKS.studio, top: '#07050f', hor: '#140c26', bot: '#05040a', fog: '#0c0818', fogNear: 7, fogFar: 30, hemiSky: '#7c6cf7', hemiGround: '#100a20', hemiI: 0.6, sunI: 0.7, env: 0.35 };
/** shot-relative clock that works in both versions (full / short) */
const useShot = (id: string) => {
  const f = useCurrentFrame();
  const s = shotById(id) ?? { dur: 90, from: 0, beats: [] };
  const beat = (i: number) => (s.beats && s.beats[i] !== undefined ? Math.round(s.beats[i] * 30) - s.from : 1e9);
  return { f, dur: s.dur as number, p: f / Math.max(1, s.dur), beat };
};

// ------------------------------------------------------------------ HOOK: the old laptop lags
const lagScreen = (f: number, crack: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  const ft = Math.floor(f / 9) * 9; // stutters: one frame in nine
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#1b2a44'); sky.addColorStop(1, '#3d5a80'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2b2d42'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.35, h * 0.35); g.lineTo(w * 0.35, h * 0.7); g.lineTo(0, h); g.fill();
  g.beginPath(); g.moveTo(w, 0); g.lineTo(w * 0.65, h * 0.35); g.lineTo(w * 0.65, h * 0.7); g.lineTo(w, h); g.fill();
  g.fillStyle = '#ffb703'; g.fillRect(w * 0.45 + Math.sin(ft * 0.07) * w * 0.08, h * 0.44, w * 0.04, h * 0.14);
  // pixelated blocks (low settings)
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${0.15 + hash(i) * 0.2})`; g.fillRect(hash(i * 3) * w, hash(i * 7) * h, 40, 40); }
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(14, 14, 190, 54); g.fillStyle = '#ff3b3b'; g.font = '900 38px Montserrat'; g.fillText('FPS 9', 28, 55);
  g.save(); g.translate(w / 2, h / 2); g.rotate(f * 0.25); for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(255,255,255,${0.12 + i * 0.08})`; g.beginPath(); g.arc(Math.cos(i * 0.63) * 34, Math.sin(i * 0.63) * 34, 7, 0, 7); g.fill(); } g.restore();
  if (crack > 0) {
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3; const r = rng(4);
    const cx = w * 0.55, cy = h * 0.45;
    for (let k = 0; k < 14 * crack; k++) { g.beginPath(); g.moveTo(cx, cy); let x = cx, y = cy; const a = r() * Math.PI * 2; for (let j = 0; j < 5; j++) { x += Math.cos(a + (r() - 0.5)) * 50; y += Math.sin(a + (r() - 0.5)) * 50; g.lineTo(x, y); } g.stroke(); }
  }
};
const HomeDesk: React.FC<{ tex: THREE.Texture }> = ({ tex }) => (
  <>
    <group position={[0, 0, 0.8]}><Room w={4} d={4} h={2.7} wall="#3b3f52" floor="wood" light={0.25} /></group>
    <mesh geometry={rbox(1.4, 0.05, 0.7, 0.02)} position={[0, 0.74, -0.3]} material={mat('#6b4a30', { r: 0.6 })} castShadow receiveShadow />
    {[-0.62, 0.62].map((x) => <mesh key={x} position={[x, 0.37, -0.3]} material={mat('#4a3324', { r: 0.6 })}><boxGeometry args={[0.05, 0.74, 0.6]} /></mesh>)}
    <group position={[0, 0.765, -0.35]}>
      <mesh geometry={rbox(0.5, 0.02, 0.34, 0.01)} position={[0, 0.01, 0.05]} material={mat('#8a8f99', { r: 0.4, m: 0.6 })} />
      <group position={[0, 0.02, -0.12]} rotation={[-0.25, 0, 0]}>
        <mesh geometry={rbox(0.5, 0.32, 0.015, 0.01)} position={[0, 0.16, 0]} material={mat('#8a8f99', { r: 0.4, m: 0.6 })} />
        <Screen tex={tex} w={0.44} h={0.26} pos={[0, 0.16, 0.009]} frame="#111" depth={0.004} />
      </group>
    </group>
    <Lamp pos={[0.9, 0.76, -0.45]} on={0.4} />
  </>
);
export const LLag: React.FC = () => {
  const { f, dur } = useShot('l_lag');
  const tex = useScreen(512, 300, 'lag' + Math.floor(f / 3), lagScreen(f, 0));
  const c = camK(f, [{ f: 0, p: [1.45, 1.4, 0.35], l: [0.0, 1.05, -0.2], fov: 42 }, { f: dur, p: [1.15, 1.35, 0.15], l: [0.0, 1.05, -0.25], fov: 40 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.night, hemiI: 0.4 }} center={[0, 1, 0]} size={4} noSky />
      <Cam {...c} />
      <HomeDesk tex={tex} />
      <Person look={HERO()} pos={[0.05, -0.3, 0.25]} rotY={Math.PI} blob={false} pose={merge(idle(f, 2), EXPR.sad, { legL: 1.4, legR: 1.4, kneeL: 1.45, kneeR: 1.45, armL: [1.0, -0.1, 0.9], armR: [1.0, 0.1, 0.9], head: [0.15, 0, 0.1] })} />
      <pointLight position={[0, 1.1, 0.1]} intensity={2} distance={2} color="#8fb4ff" />
    </Stage>
  );
};
export const LCrack: React.FC = () => {
  const { f, dur } = useShot('l_crack');
  const crack = ramp(f, dur * 0.45, dur * 0.75);
  const tex = useScreen(512, 300, 'crack' + Math.floor(f / 3) + Math.round(crack * 6), lagScreen(f + 60, crack));
  const c = camK(f, [{ f: 0, p: [0.08, 1.1, 0.35], l: [0, 0.98, -0.5], fov: 40 }, { f: dur, p: [0.03, 1.03, 0.05], l: [0, 0.98, -0.5], fov: 36 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.night, hemiI: 0.4 }} center={[0, 1, 0]} size={4} noSky />
      <Cam pos={[c.pos[0] + kick(f, Math.round(dur * 0.5), 8) * 0.01, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <HomeDesk tex={tex} />
    </Stage>
  );
};

// ------------------------------------------------------------------ the club: fly in, rows light up
const ALL: Zone[] = ['main', 'vip', 'pro', 'prime'];
export const LFly: React.FC = () => {
  const { f, dur } = useShot('l_fly');
  const c = camK(f, [{ f: 0, p: [0, 2.4, 6.5], l: [0, 1.2, -6], fov: 50 }, { f: dur, p: [0, 1.75, 1.6], l: [0, 1.1, -8], fov: 48 }]);
  return (
    <Stage>
      <Lights look={CLUB} center={[0, 1, -4]} size={12} noSky />
      <Cam {...c} />
      <Hall f={f} zones={ALL} rows={5} cols={6} players={9} on={(r) => (f > 4 + r * 6 ? 1 : 0)} />
    </Stage>
  );
};
export const LLogo: React.FC = () => {
  const { f, dur } = useShot('l_logo');
  const rise = easeOut(ramp(f, 0, 14));
  const c = camK(f, [{ f: 0, p: [0, 2.0, 4.0], l: [0, 2.4, -4], fov: 50 }, { f: dur, p: [0.6, 2.2, 3.2], l: [0, 2.5, -4], fov: 48 }]);
  return (
    <Stage>
      <Lights look={CLUB} center={[0, 1, -4]} size={12} noSky />
      <Cam {...c} />
      <Hall f={f} zones={ALL} rows={5} cols={6} players={9} />
      <Text3D text="LIBERTY" size={0.4} depth={0.14} color="#ffffff" glow="#a855f7" pos={[0, lerp(1.2, 2.2, rise), -1.6]} rot={[0, Math.sin(f * 0.03) * 0.12, 0]} />
      <Text3D text="COMPUTER CLUB" size={0.11} depth={0.04} color="#ffffff" glow="#22d3ee" pos={[0, lerp(0.9, 1.82, rise), -1.5]} />
    </Stage>
  );
};
// «на Достык, 55» — night city, a beam over the club
export const LMap: React.FC = () => {
  const { f, dur } = useShot('l_map');
  const c = camK(f, [{ f: 0, p: [24, 150, 70], l: [9, 4, -9], fov: 46 }, { f: dur, p: [18, 100, 44], l: [9, 6, -9], fov: 46 }]);
  return (
    <Stage>
      <Lights look={LOOKS.night} center={[0, 0, 0]} size={120} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={7} night={1} lamps={1} f={f} />
      <mesh position={[9, 40, -9]} material={basic('#a855f7', { add: true, t: 0.35 })}><cylinderGeometry args={[1, 3, 80, 24, 1, true]} /></mesh>
      <group position={[9, 30 + Math.sin(f * 0.15) * 1.2, -9]} scale={[3, 3, 3]}>
        <mesh position={[0, -2, 0]} rotation={[Math.PI, 0, 0]} material={mat('#a855f7', { r: 0.3, e: '#a855f7', ei: 1 })}><coneGeometry args={[1.6, 3.2, 24]} /></mesh>
        <mesh material={mat('#ffffff', { r: 0.3, e: '#ffffff', ei: 0.6 })}><sphereGeometry args={[1.7, 24, 16]} /></mesh>
      </group>
      <Glow pos={[9, 30, -9]} s={50} color="#a855f7" o={0.7} />
    </Stage>
  );
};
// «Здесь не бывает закрыто…» — the facade, day → night, the neon comes on
export const LDoor: React.FC = () => {
  const { f, dur } = useShot('l_door');
  const t = smoother(ramp(f, 0, dur * 0.8));
  const look = t < 0.5 ? mixLook(LOOKS.day, LOOKS.dusk, t * 2) : mixLook(LOOKS.dusk, LOOKS.night, (t - 0.5) * 2);
  const c = camK(f, [{ f: 0, p: [2.2, 2.2, 13], l: [0, 5.2, 0], fov: 50 }, { f: dur, p: [-1.2, 2.0, 11], l: [0, 5.3, 0], fov: 50 }]);
  return (
    <Stage>
      <Lights look={look} center={[0, 3, 0]} size={20} frame={f * 4} />
      <Cam {...c} />
      <group position={[-30, 0, -20]}><City seed={9} near={2} far={5} night={t} lamps={t} clear={[[30, 20, 12]]} /></group>
      <Facade f={f} neon={ramp(f, dur * 0.3, dur * 0.45)} />
    </Stage>
  );
};
// «После учёбы, после работы или в три часа ночи — двери открыты.»
export const LNight: React.FC = () => {
  const { f, dur, beat } = useShot('l_night');
  const open = smoother(ramp(f, Math.min(beat(1), dur - 30), Math.min(beat(1), dur - 30) + 18));
  const c = camK(f, [{ f: 0, p: [0.6, 2.0, 15], l: [0, 4.9, 0], fov: 50 }, { f: dur * 0.6, p: [0.3, 1.8, 9], l: [0, 3.6, 0], fov: 50 }, { f: dur, p: [0, 1.6, 4.2], l: [0, 1.6, -2], fov: 50 }]);
  return (
    <Stage>
      <Lights look={LOOKS.night} center={[0, 3, 0]} size={20} frame={f} />
      <Cam {...c} />
      <group position={[-30, 0, -20]}><City seed={9} near={2} far={5} night={1} lamps={1} clear={[[30, 20, 12]]} /></group>
      <Facade f={f} neon={1} open={open} />
    </Stage>
  );
};
/** blurred club behind 2D UI */
const ClubBlur: React.FC<{ id: string; zones?: Zone[] }> = ({ id, zones = ALL }) => {
  const { f } = useShot(id);
  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'blur(8px) brightness(0.55)', transform: 'scale(1.06)' }}>
      <Stage>
        <Lights look={CLUB} center={[0, 1, -4]} size={12} noSky />
        <Cam pos={[Math.sin(f * 0.01) * 1.2, 2.2, 4]} look={[0, 1.3, -5]} fov={52} />
        <Hall f={f} zones={zones} rows={5} cols={6} players={9} />
      </Stage>
    </div>
  );
};
export const LSelect: React.FC = () => <ClubBlur id="l_select" />;

// ------------------------------------------------------------------ zones
const zoneHall = (zone: Zone, f: number, cheer = 0, force: string[] = []) => {
  const big = zone === 'prime' || zone === 'vip';
  return <Hall f={f} zones={[zone]} rows={zone === 'prime' ? 3 : 4} cols={zone === 'prime' ? 4 : zone === 'vip' ? 5 : 6} players={zone === 'prime' ? 4 : 6} big={big} gap={zone === 'prime' ? 2.8 : 2.3} cheer={cheer} force={force} />;
};
const zoneLook = (zone: Zone) => ({ ...CLUB, hor: new THREE.Color(ZONES[zone].col2).multiplyScalar(0.35).getStyle(), fog: new THREE.Color(ZONES[zone].col2).multiplyScalar(0.18).getStyle() });
/** LEVEL N: fly over the zone, its name in 3D */
export const makeLevel = (zone: Zone, id: string): React.FC => () => {
  const { f, dur } = useShot(id);
  const Z = ZONES[zone];
  const rise = easeOut(ramp(f, 4, 20));
  const c = camK(f, [{ f: 0, p: [0, 3.2, 6], l: [0, 1.4, -5], fov: 52 }, { f: dur, p: [0.8, 2.1, 3], l: [0, 1.6, -5], fov: 50 }]);
  return (
    <Stage>
      <Lights look={zoneLook(zone)} center={[0, 1, -4]} size={12} noSky />
      <Cam {...c} />
      {zoneHall(zone, f)}
      <Text3D text={Z.name} size={0.8 * Math.min(1, 3.4 / Z.name.length)} depth={0.25} color="#ffffff" glow={Z.col} pos={[0, lerp(0.6, 2.2, rise), -2.4]} rot={[0, Math.sin(f * 0.04) * 0.15, 0]} />
    </Stage>
  );
};
/** close-up of one station: orbit around the monitor and the tower */
export const makeSpec = (zone: Zone, id: string): React.FC => () => {
  const { f, dur } = useShot(id);
  const tex = useGameTex(f);
  const big = zone === 'prime' || zone === 'vip';
  const a = lerp(-0.55, 0.35, smoother(f / dur));
  const R = 1.45;
  return (
    <Stage>
      <Lights look={zoneLook(zone)} center={[0, 1, 0]} size={6} noSky />
      <Cam pos={[Math.sin(a) * R + 0.15, 1.5, Math.cos(a) * R - 0.1]} look={[0.15, 1.0, -0.3]} fov={46} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({ color: '#0b0b12', roughness: 0.2, metalness: 0.4 })} receiveShadow><planeGeometry args={[20, 20]} /></mesh>
      <mesh geometry={rbox(1.4, 0.05, 0.75, 0.02)} position={[0.15, 0.74, -0.18]} material={mat('#121218', { r: 0.4, m: 0.3 })} castShadow receiveShadow />
      <Station pos={[0, 0, 0]} zone={zone} tex={tex[ZONES[zone].lvl % 4]} big={big} seed={3} chair={false} />
      <mesh position={[0, 1.6, -1.6]} material={basic(ZONES[zone].col, { t: 0.9 })}><boxGeometry args={[6, 0.04, 0.02]} /></mesh>
      <pointLight position={[0.8, 1.8, 0.8]} intensity={4} distance={5} color={ZONES[zone].col} />
      <pointLight position={[-1, 1.5, 1]} intensity={2} distance={5} color="#ffffff" />
    </Stage>
  );
};
/** monitor close-up with a fast object: refresh rate */
const hzScreen = (f: number, col: string) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#070b1d'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 8; k++) { const x = w / 2 + Math.sin((f - k * 0.8) * 0.16) * w * 0.38; g.fillStyle = col; g.globalAlpha = 1 - k / 8; g.beginPath(); g.arc(x, h / 2 + Math.sin((f - k) * 0.2) * 40, 34, 0, 7); g.fill(); }
  g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,0.15)'; for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
};
export const makeHz = (zone: Zone, id: string): React.FC => () => {
  const { f, dur } = useShot(id);
  const tex = useScreen(512, 288, 'hz' + zone + f, hzScreen(f, ZONES[zone].col));
  const c = camK(f, [{ f: 0, p: [0.35, 1.25, 0.55], l: [0, 1.22, -0.3], fov: 44 }, { f: dur, p: [0.1, 1.22, 0.42], l: [0, 1.22, -0.3], fov: 42 }]);
  return (
    <Stage>
      <Lights look={zoneLook(zone)} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <mesh geometry={rbox(1.4, 0.05, 0.75, 0.02)} position={[0.15, 0.74, -0.18]} material={mat('#121218', { r: 0.4, m: 0.3 })} />
      <Station pos={[0, 0, 0]} zone={zone} tex={tex} big seed={5} chair={false} />
      <pointLight position={[0.5, 1.6, 0.6]} intensity={3} distance={4} color={ZONES[zone].col} />
    </Stage>
  );
};
/** a player in the zone, over the shoulder */
export const makePlay = (zone: Zone, id: string): React.FC => () => {
  const { f, dur } = useShot(id);
  const c = camK(f, [{ f: 0, p: [2.0, 2.7, 3.6], l: [0.2, 0.95, -1.2], fov: 46 }, { f: dur, p: [1.5, 2.4, 2.8], l: [0.2, 1.0, -1.2], fov: 44 }]);
  return (
    <Stage>
      <Lights look={zoneLook(zone)} center={[0, 1, -2]} size={10} noSky />
      <Cam {...c} />
      {zoneHall(zone, f, 0, zone === 'vip' ? ['0_2', '0_3', '1_2'] : ['0_2', '0_3', '1_3'])}
    </Stage>
  );
};
// «Это максимум.» — Prime: slow orbit, gold
export const MaxPrime: React.FC = () => {
  const { f, dur } = useShot('max_prime');
  const a = lerp(-0.5, 0.5, smoother(f / dur));
  return (
    <Stage>
      <Lights look={zoneLook('prime')} center={[0, 1, -3]} size={12} noSky />
      <Cam pos={[Math.sin(a) * 6, 2.6, Math.cos(a) * 6 - 2]} look={[0, 1.6, -2.5]} fov={50} />
      {zoneHall('prime', f)}
      <Text3D text="MAX" size={0.8} depth={0.3} color="#fff7d6" glow="#facc15" pos={[0, 1.75 + Math.sin(f * 0.08) * 0.05, -2.6]} rot={[0, -a * 0.6, 0]} />
    </Stage>
  );
};
// «Приходи один или собирай команду» — friends celebrating at a row
export const LTeam: React.FC = () => {
  const { f, dur, beat } = useShot('l_team');
  const tex = useGameTex(f);
  const cheerAt = Math.min(beat(0), dur - 30);
  const cheer = f >= cheerAt ? 1 : 0;
  const c = camK(f, [{ f: 0, p: [2.6, 1.9, 3.0], l: [0, 1.1, -0.4], fov: 46 }, { f: dur, p: [1.6, 1.7, 2.3], l: [0, 1.2, -0.4], fov: 44 }]);
  return (
    <Stage>
      <Lights look={zoneLook('vip')} center={[0, 1, 0]} size={8} noSky />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({ color: '#0b0b12', roughness: 0.2, metalness: 0.4 })} receiveShadow><planeGeometry args={[30, 30]} /></mesh>
      <mesh position={[0, 1.6, -2.2]} material={mat('#0e0c18', { r: 0.9 })}><planeGeometry args={[12, 3.2]} /></mesh>
      <mesh position={[0, 2.6, -2.18]} material={basic('#a855f7', { t: 0.9 })}><planeGeometry args={[12, 0.05]} /></mesh>
      <mesh geometry={rbox(5.4, 0.05, 0.75, 0.02)} position={[0, 0.74, -0.18]} material={mat('#121218', { r: 0.4, m: 0.3 })} castShadow receiveShadow />
      {[0, 1, 2, 3, 4].map((i) => {
        const x = (i - 2) * 1.05;
        return (
          <group key={i}>
            <Station pos={[x, 0, 0]} zone={i % 2 ? 'vip' : 'main'} tex={tex[i % 4]} chair={false} seed={i} />
            <Player pos={[x, 0, 0]} seed={40 + i} f={f} cheer={cheer && (i + Math.floor(f / 6)) % 2 === 0 ? 1 : cheer * 0.5 > 0 && i !== 2 ? 1 : 0} rotY={cheer ? (i - 2) * 0.15 : 0} />
          </group>
        );
      })}
      <pointLight position={[0, 2.4, 1]} intensity={6} distance={7} color="#a855f7" />
    </Stage>
  );
};
// «Катка с друзьями…» — the whole club, busy, crane up
export const LTeam2: React.FC = () => {
  const { f, dur } = useShot('l_team2');
  const c = camK(f, [{ f: 0, p: [-2.2, 1.6, 3], l: [0, 1.2, -5], fov: 50 }, { f: dur, p: [1.5, 4.4, 5], l: [0, 0.8, -6], fov: 52 }]);
  return (
    <Stage>
      <Lights look={CLUB} center={[0, 1, -4]} size={12} noSky />
      <Cam {...c} />
      <Hall f={f} zones={ALL} rows={5} cols={6} players={22} />
    </Stage>
  );
};
// final card backgrounds
export const LFinal: React.FC = () => <ClubBlur id="l_final" zones={['vip', 'main']} />;
export const LCall: React.FC = () => <ClubBlur id="l_call" />;
export const LSave: React.FC = () => <ClubBlur id="l_save" zones={['prime', 'vip']} />;

export const LIB_SCENES: Record<string, React.FC> = {
  l_lag: LLag, l_crack: LCrack, l_fly: LFly, l_logo: LLogo, l_map: LMap, l_door: LDoor, l_night: LNight, l_select: LSelect,
  lv_main: makeLevel('main', 'lv_main'), lv_vip: makeLevel('vip', 'lv_vip'), lv_pro: makeLevel('pro', 'lv_pro'), lv_prime: makeLevel('prime', 'lv_prime'),
  spec_main: makeSpec('main', 'spec_main'), spec_vip: makeSpec('vip', 'spec_vip'), spec_pro: makeSpec('pro', 'spec_pro'), spec_prime: makeSpec('prime', 'spec_prime'),
  hz_vip: makeHz('vip', 'hz_vip'), hz_prime: makeHz('prime', 'hz_prime'),
  play_main: makePlay('main', 'play_main'), play_vip: makePlay('vip', 'play_vip'), play_pro: makePlay('pro', 'play_pro'),
  max_prime: MaxPrime, l_team: LTeam, l_team2: LTeam2, l_final: LFinal, l_call: LCall, l_save: LSave,
};
void spr; void radialTex; void clamp; void Player;
