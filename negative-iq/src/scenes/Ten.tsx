import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic, textTex, Blob } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walkPath, walk, Crowd, Agent, Pose } from '../three/person';
import { Car, CAR_COLORS } from '../three/vehicles';
import { QMark, Stars, Lamp, Bin, Shelf, Room, rbox, Glow } from '../three/props';
import { Traffic } from './Morning';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, smoother, kick, clamp, pop, wobble, backOut } from '../lib/anim';

const L10 = { ...LOOKS.day, top: '#4a86d6', hor: '#c8d8ee' };

// «Люди начинают...» — walks straight into a lamp post
export const A1Pole: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('a1_pole');
  const hit = k.cue('pole_bonk');
  const look = useMemo(() => randomLook(201, { shirt: '#f3a712', hairStyle: 'short', hair: '#2b1d16', tie: '#2e4057' }), []);
  const speed = 1.4;
  const zHit = -0.42;
  const z = f < hit ? zHit - ((hit - f) / 30) * speed : zHit - 0.35 * easeOut((f - hit) / 6);
  const recoil = f >= hit ? wobble(f, hit, 0.7, 0.15) : 0;
  const pose: Pose = f < hit ? walk(((z - zHit) / 0.72) * Math.PI, 1) : { body: [-0.25 * easeOut((f - hit) / 4) + recoil * 0.1, 0, recoil * 0.12], head: [-0.2, 0, recoil * 0.3], armL: [0.6, 0.5, 0.4], armR: [0.6, 0.5, 0.4], squash: f - hit < 4 ? 0.12 * (1 - (f - hit) / 4) : 0 };
  const c = camK(f, [{ f: 0, p: [3.9, 1.25, -0.7], l: [8.6, 1.15, -0.55], fov: 48 }, { f: k.dur, p: [4.6, 1.3, -0.5], l: [8.6, 1.2, -0.5], fov: 44 }], (t) => t);
  const sh = kick(f, hit, 7) * 0.05;
  return (
    <Stage>
      <Lights look={L10} center={[8.6, 0, 0]} size={12} />
      <Cam pos={[c.pos[0] + sh, c.pos[1] + sh, c.pos[2]]} look={c.look} fov={c.fov} />
      <City seed={7} near={3} far={6} />
      <Lamp pos={[8.6, 0.16, 0.05]} rotY={Math.PI} />
      <Person look={look} pos={[8.6, 0.16, z]} rotY={0} pose={merge(idle(f, 2), pose, f >= hit ? EXPR.dumb2 : { ...EXPR.dumb, mouth: 'smile' })} propR={f < hit ? <mesh position={[0, 0, 0.06]} rotation={[0.3, 0, 0]} material={mat('#111', { r: 0.3 })}><boxGeometry args={[0.08, 0.16, 0.012]} /></mesh> : null} />
      {f >= hit && <Stars f={f} pos={[8.6, 2.05, z]} r={0.32} />}
      <Traffic f={f + 400} n={10} seed={21} axis="z" />
    </Stage>
  );
};

// «...совершать совершенно нелогичные поступки.» — absurd behaviour on a square
export const A2Absurd: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('a2_absurd');
  const L = useMemo(() => [randomLook(211, { hairStyle: 'long', shirt: '#ef476f' }), randomLook(212, { shirt: '#26a69a' }), randomLook(213, { shirt: '#5c80bc' }), randomLook(214, { shirt: '#ff8c42', hairStyle: 'bald' }), randomLook(215, { kid: true, backpack: '#f1c40f' })], []);
  const c = camK(f, [{ f: 0, p: [-19.6, 1.7, -9.6], l: [-20.1, 1.1, -21], fov: 48 }, { f: k.dur, p: [-20.4, 1.75, -10.8], l: [-20.2, 1.15, -21], fov: 46 }], (t) => t);
  // 1: walks backwards
  const b = walkPath(f + 20, [-21.6, -17], [-21.6, -12], 0.8, 0);
  const back = merge(walk(-((f + 20) / 30) * 1.0 / 0.72 * Math.PI, 1), { head: [0.1, 0, 0] });
  // 2: spinning with arms out
  const spin = f * 0.25;
  // 3: bin on the head, bumping into a bench
  const w3 = walkPath(f, [-22.5, -18.5], [-20, -20.5], 0.7, 0);
  return (
    <Stage>
      <Lights look={L10} center={[-20, 0, -14]} size={16} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Person look={L[0]} pos={[-21.6, 0.16, b.pos[2]]} rotY={Math.PI} pose={merge(back, EXPR.happy)} />
      <Person look={L[1]} pos={[-18.8, 0.16, -16.5]} rotY={spin} pose={merge({ armL: [0, 1.5, 0], armR: [0, 1.5, 0] }, EXPR.dumb, { bob: Math.abs(Math.sin(f * 0.25)) * 0.05 })} />
      <Person look={L[2]} pos={[w3.pos[0], 0.16, w3.pos[2]]} rotY={w3.rotY} pose={merge(w3.pose, { armL: [1.4, 0.2, 0.2], armR: [1.4, 0.2, 0.2] })} above={<group position={[0, -0.75, 0]}><Bin pos={[0, -0.05, 0]} /></group>} />
      <group position={[-18.6, 0.16, -23]}>
        <mesh position={[0, 1.6, 0]} material={mat('#6b4a33', { r: 0.9 })} castShadow><cylinderGeometry args={[0.18, 0.24, 3.2, 8]} /></mesh>
        <mesh position={[0, 4, 0]} material={mat('#4f8a3c', { r: 0.9, flat: true })} castShadow><icosahedronGeometry args={[1.7, 1]} /></mesh>
        <Person look={L[3]} pos={[0, 0, 0.42]} rotY={Math.PI} pose={merge(EXPR.happy, { armL: [1.2, -0.3, 1.2], armR: [1.2, -0.3, 1.2], head: [0, 0.6, 0.1], blink: 1 })} />
      </group>
      <Person look={L[4]} pos={[-21.2, 0.16 + Math.abs(Math.sin(f * 0.3)) * 0.4, -25]} rotY={0.4} pose={merge(EXPR.grin, { armL: [2.8, 0.3, 0], armR: [2.8, 0.3, 0], legL: 0.3, legR: -0.3 })} />
    </Stage>
  );
};

/** shop front with a glass door and a «НА СЕБЯ» sign; door hinge on the left */
export const ShopFront: React.FC<{ rattle: number; sign?: string; signColor?: string }> = ({ rattle, sign = 'ПРОДУКТЫ', signColor = '#2e9e5b' }) => {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1 }), []);
  return (
    <group>
      <mesh position={[-3.375, 2.5, -0.25]} material={mat('#e9dcc4', { r: 0.85 })} receiveShadow castShadow><boxGeometry args={[5.25, 5, 0.5]} /></mesh>
      <mesh position={[3.375, 2.5, -0.25]} material={mat('#e9dcc4', { r: 0.85 })} receiveShadow castShadow><boxGeometry args={[5.25, 5, 0.5]} /></mesh>
      <mesh position={[0, 3.85, -0.25]} material={mat('#e9dcc4', { r: 0.85 })} receiveShadow castShadow><boxGeometry args={[1.5, 2.3, 0.5]} /></mesh>
      <mesh position={[0, 4.15, 0.06]} material={basic('#ffffff', { map: textTex(sign, { w: 1024, h: 200, bg: signColor, fg: '#fff', radius: 24 }) })}><planeGeometry args={[5, 0.98]} /></mesh>
      {[-3.6, 3.6].map((x) => <mesh key={x} position={[x, 1.6, 0.02]} material={glass}><planeGeometry args={[2.6, 2.4]} /></mesh>)}
      {[-0.72, 0.72].map((x) => <mesh key={x} position={[x, 1.35, 0.0]} material={mat('#3a3a3a', { r: 0.4, m: 0.5 })}><boxGeometry args={[0.08, 2.7, 0.55]} /></mesh>)}
      <group position={[-0.65, 0, 0.06]} rotation={[0, rattle, 0]}>
        {[[0.03, 1.3, 0.07, 2.5], [1.27, 1.3, 0.07, 2.5], [0.65, 2.52, 1.3, 0.07], [0.65, 0.08, 1.3, 0.12]].map(([x, y, w, h], j) => <mesh key={j} position={[x, y, 0]} material={mat('#555', { r: 0.4, m: 0.6 })}><boxGeometry args={[w, h, 0.06]} /></mesh>)}
        <mesh position={[0.65, 1.3, 0.03]} material={glass}><planeGeometry args={[1.12, 2.3]} /></mesh>
        <mesh position={[0.65, 1.55, 0.035]} material={basic('#ffffff', { map: textTex('НА СЕБЯ', { w: 512, h: 160, bg: '#ffffff', fg: '#d63031', radius: 16 }) })}><planeGeometry args={[0.8, 0.25]} /></mesh>
        <mesh position={[0.65, 1.3, 0.036]} material={basic('#ffffff', { map: textTex('←', { w: 256, h: 128, fg: '#d63031', size: 110 }) })}><planeGeometry args={[0.4, 0.2]} /></mesh>
        <mesh position={[1.15, 1.15, 0.12]} material={mat('#c9ced6', { r: 0.2, m: 0.8 })}><boxGeometry args={[0.04, 0.5, 0.04]} /></mesh>
        {[1.38, 0.92].map((y) => <mesh key={y} position={[1.15, y, 0.07]} material={mat('#c9ced6', { r: 0.2, m: 0.8 })}><boxGeometry args={[0.03, 0.03, 0.1]} /></mesh>)}
      </group>
      <mesh position={[0, 0.08, 1.5]} material={mat('#bdb8ae', { r: 0.9 })} receiveShadow><boxGeometry args={[14, 0.16, 3]} /></mesh>
    </group>
  );
};
const bumpState = (f: number, bumps: number[]) => {
  let off = 0.65, sq = 0, rat = 0;
  for (const b of bumps) {
    const d = f - b;
    if (d >= -8 && d < 0) off = Math.min(off, 0.65 - (1 - -d / 8) * 0.62);
    if (d >= 0 && d < 10) { off = Math.min(off, 0.03 + easeOut(d / 10) * 0.62); sq = Math.max(sq, d < 4 ? 0.14 * (1 - d / 4) : 0); rat = Math.max(rat, wobble(f, b, 1.4, 0.3) * 0.05); }
  }
  return { off, sq, rat };
};

// «Кто-то пытается открыть дверь,» — pushing a «pull» door
export const A3Door: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('a3_door');
  const bumps = ['door_bump1', 'door_bump2', 'door_bump3', 'door_bump4'].map((n) => k.cue(n));
  const look = useMemo(() => randomLook(221, { shirt: '#8e5ec7', hairStyle: 'cap', hat: '#e4572e' }), []);
  const s = bumpState(f, bumps);
  const c = camK(f, [{ f: 0, p: [2.6, 1.7, 3.8], l: [0, 1.4, 0.3], fov: 40 }, { f: k.dur, p: [2.1, 1.65, 3.0], l: [0, 1.45, 0.3], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={L10} center={[0, 1, 0]} size={8} />
      <Cam {...c} />
      <group position={[0, 0, -30]}><City seed={7} near={2} far={5} /></group>
      <ShopFront rattle={s.rat} />
      <Person look={look} pos={[0, 0.16, 0.36 + s.off]} rotY={Math.PI} pose={merge(idle(f, 4), EXPR.dumb, { armL: [1.4, 0.15, 0.4], armR: [1.4, 0.15, 0.4], squash: s.sq, body: [0.12, 0, 0] })} />
    </Stage>
  );
};

// «толкая её не в ту сторону.» — the sign and the squashed face against the glass
export const A4Glass: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('a4_glass');
  const bumps = ['door_bump3', 'door_bump4'].map((n) => k.cue(n)).concat([k.dur + 5]);
  const look = useMemo(() => randomLook(221, { shirt: '#8e5ec7', hairStyle: 'cap', hat: '#e4572e' }), []);
  const s = bumpState(f, bumps);
  const c = camK(f, [{ f: 0, p: [0.9, 1.6, -1.6], l: [0.0, 1.55, 0.2], fov: 36 }, { f: k.dur, p: [0.75, 1.62, -1.35], l: [0.0, 1.58, 0.2], fov: 34 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunAz: 200 }} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <group position={[0, 0, -4]}><Room w={12} d={8} h={4} wall="#f2efe8" floor="tile" ceilingLights={2} /></group>
      <ShopFront rattle={s.rat} />
      <Person look={look} pos={[0.1, 0.16, 0.36 + s.off]} rotY={Math.PI} pose={merge(EXPR.dumb2, { armL: [1.4, 0.15, 0.4], armR: [1.4, 0.15, 0.4], squash: s.sq * 1.4, head: [0, 0.2, 0.15] })} />
      <mesh position={[0, 2.5, 9]} rotation={[0, Math.PI, 0]} material={basic('#cfe6ff')}><planeGeometry args={[40, 16]} /></mesh>
      <group position={[0, 0, 40]} rotation={[0, Math.PI, 0]}><City seed={7} near={2} far={4} /></group>
    </Stage>
  );
};

// «Кто-то забывает, зачем пришёл в магазин.» — a confused shopper
export const A5Shop: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('a5_shop');
  const look = useMemo(() => randomLook(231, { hairStyle: 'bun', shirt: '#f3a712', skirt: true }), []);
  const forget = k.w(58);
  const putHat = k.w(62);
  const qs = pop(f, forget, 9);
  const headLook = Math.sin(f * 0.09) * 0.7;
  const hatP = ramp(f, putHat - 6, putHat + 4);
  const c = camK(f, [{ f: 0, p: [0, 1.5, 5.2], l: [0, 1.4, 0], fov: 42 }, { f: k.dur, p: [0.3, 1.7, 3.4], l: [0, 1.6, 0], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={8} noSky />
      <Cam {...c} />
      <group position={[0, 0, 0]}><Room w={8} d={14} h={3.6} wall="#eef1f4" floor="tile" ceilingLights={4} light={1.2} /></group>
      <Shelf pos={[-1.8, 0, -1]} rotY={Math.PI / 2} len={8} seed={3} />
      <Shelf pos={[1.8, 0, -1]} rotY={-Math.PI / 2} len={8} seed={5} />
      <Person look={look} pos={[0, 0, 0]} rotY={0} pose={merge(idle(f, 7), f > forget ? EXPR.confused : EXPR.neutral, { head: [0.0, f > forget ? headLook : 0, 0], armL: [0.3, 0.1, 1.3], armR: f > putHat - 8 ? [lerp(0.3, 2.9, hatP), 0.25, lerp(0.6, 1.5, hatP)] : [0.2, 0.15, 0.3] })}
        propL={<group position={[0, -0.02, 0.12]}><mesh material={mat('#d63031', { r: 0.5 })}><boxGeometry args={[0.36, 0.2, 0.26]} /></mesh></group>}
        above={hatP > 0.9 ? <mesh position={[0, -0.45, 0]} material={mat('#f1c40f', { r: 0.5 })} castShadow><boxGeometry args={[0.28, 0.32, 0.2]} /></mesh> : null} />
      {f >= forget && (
        <group position={[0.55, 2.55 + Math.sin(f * 0.15) * 0.04, 0]}>
          <mesh position={[-0.35, -0.42, 0]} material={mat('#ffffff', { r: 0.4 })}><sphereGeometry args={[0.06 * qs, 12, 8]} /></mesh>
          <mesh position={[-0.2, -0.26, 0]} material={mat('#ffffff', { r: 0.4 })}><sphereGeometry args={[0.09 * qs, 12, 8]} /></mesh>
          <mesh scale={[1.25 * qs, 0.95 * qs, 0.5 * qs]} material={mat('#ffffff', { r: 0.4 })}><sphereGeometry args={[0.45, 24, 16]} /></mesh>
          <QMark pos={[0, -0.05, 0.25]} s={0.42 * qs} />
        </group>
      )}
    </Stage>
  );
};

// «Водители путают педали...» — a car reversing into a bin
export const A6Reverse: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('a6_reverse');
  const hit = k.cue('car_crash1');
  const zc = f < hit ? lerp(-26, -3.4, (f / hit) ** 1.3) : -3.4 + 0.4 * easeOut((f - hit) / 6);
  const sway = Math.sin(f * 0.18) * 0.18;
  const binT = f < hit ? 0 : easeOut((f - hit) / 14);
  const sh = kick(f, hit, 8) * 0.12;
  const c = camK(f, [{ f: 0, p: [-8.2, 1.0, 6], l: [-4, 1.0, -8], fov: 44 }, { f: k.dur, p: [-8.6, 1.1, 4.5], l: [-4.5, 1.0, -3], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={L10} center={[-4, 0, -5]} size={18} />
      <Cam pos={[c.pos[0] + sh, c.pos[1] + sh * 0.5, c.pos[2]]} look={c.look} fov={c.fov} />
      <City seed={7} near={3} far={6} />
      <Car kind="sedan" color="#2e86de" pos={[-3.5 + sway * 2, 0, zc]} rotY={Math.PI + sway} dist={-zc} reverse brake={false} tilt={[f >= hit && f < hit + 6 ? -0.04 : 0, 0]} />
      <Bin pos={[-6.2 + binT * -1.2, 0.16 + Math.sin(binT * Math.PI) * 0.8, 0.5 + binT * 2.5]} tip={binT * 1.6} />
      <Person look={randomLook(241)} pos={[-9.2, 0.16, -2]} rotY={Math.PI / 2} pose={merge(idle(f, 1), f > hit ? EXPR.shock : EXPR.neutral, f > hit ? { armL: [2.5, 0.4, 0.3], armR: [2.5, 0.4, 0.3] } : {})} />
    </Stage>
  );
};

// «...и направление движения.» — chaos at the intersection from above
export const A7Inter: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('a7_inter');
  const crash = k.cue('car_crash2');
  const cars = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ col: CAR_COLORS[i % CAR_COLORS.length], kind: i === 3 ? 'taxi' : i === 6 ? 'bus' : 'sedan' })), []);
  const ang = f * 0.12;
  const meet = clamp(f / crash);
  const c = camK(f, [{ f: 0, p: [1, 52, 14], l: [0, 0, 0], fov: 38 }, { f: k.dur, p: [-3, 44, 11], l: [0, 0, 0], fov: 38, roll: 8 }], (t) => t);
  return (
    <Stage>
      <Lights look={L10} center={[0, 0, 0]} size={36} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} traffic="chaos" f={f} />
      <Car kind="taxi" color="#f1c40f" pos={[Math.cos(ang) * 4, 0, Math.sin(ang) * 4]} rotY={-ang} dist={f * 0.4} />
      <Car color={cars[0].col} pos={[lerp(-30, -2.6, meet), 0, -1.75]} rotY={Math.PI / 2 + (f > crash ? 0.5 : 0)} dist={f * 0.3} />
      <Car color={cars[1].col} pos={[lerp(26, 2.4, meet), 0, -1.75]} rotY={-Math.PI / 2 - (f > crash ? 0.4 : 0)} dist={f * 0.3} />
      <Car color={cars[2].col} pos={[5.25, 0, lerp(28, 12, clamp(f / 40))]} rotY={Math.PI} dist={f * 0.2} reverse />
      <Car color={cars[4].col} pos={[-1.75, 0, lerp(-10, 18, clamp(f / 42))]} rotY={0.3 * Math.sin(f * 0.2)} dist={f * 0.25} />
      <Car kind="bus" color="#e74c3c" pos={[lerp(-40, -14, clamp(f / 42)), 0, 5.25]} rotY={Math.PI / 2 + 0.6} dist={f * 0.2} />
      <Car color={cars[5].col} pos={[8.5, 0.16, -15]} rotY={0.9} />
      {f >= crash && f < crash + 10 && <Glow pos={[0, 1.2, -1.75]} s={8 * (1 - (f - crash) / 10)} color="#fff3c4" />}
    </Stage>
  );
};

// «Никто не понимает, что происходит.» — question marks over a crowd
export const A8CrowdQ: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('a8_crowdq');
  const q0 = k.w(70);
  const ppl = useMemo(() => {
    const r = rng(250);
    return Array.from({ length: 16 }).map((_, i) => ({ look: randomLook(260 + i, i % 6 === 0 ? { kid: true } : {}), x: -28 + (r() - 0.5) * 12, z: -20 + (r() - 0.5) * 9 - (i % 4) * 1.5, rot: (r() - 0.5) * 2.5, t: q0 + Math.floor(r() * 26) }));
  }, []);
  const agents = useMemo<Agent[]>(() => { const r = rng(9); return Array.from({ length: 260 }).map((_, i) => { const a = r() * 6.28, d = 7 + Math.sqrt(r()) * 20; return { x: -28 + Math.cos(a) * d, z: -30 + Math.sin(a) * d * 0.8, rot: r() * 6, seed: i }; }); }, []);
  const c = camK(f, [{ f: 0, p: [-27, 1.6, -10], l: [-28, 1.8, -24], fov: 46 }, { f: k.dur, p: [-26, 9, -5], l: [-28, 1.2, -26], fov: 46 }]);
  return (
    <Stage>
      <Lights look={L10} center={[-28, 0, -22]} size={22} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Crowd agents={agents} />
      {ppl.map((p, i) => {
        const qs = pop(f, p.t, 8);
        return (
          <Person key={i} look={p.look} pos={[p.x, 0.16, p.z]} rotY={p.rot} pose={merge(idle(f, i), f > p.t ? (i % 2 ? EXPR.confused : EXPR.dumb) : EXPR.neutral, { head: [0, Math.sin(f * 0.08 + i) * 0.8, 0.1 * Math.sin(f * 0.05 + i)] }, f > p.t && i % 3 === 0 ? { armR: [2.6, 0.2, 1.8] } : {})}
            above={f >= p.t ? <QMark pos={[0, 0.05, 0]} s={0.4 * qs} rotY={Math.sin(f * 0.1 + i) * 0.5} /> : null} />
        );
      })}
    </Stage>
  );
};
export { Blob, Glow, mixLook, smoother, backOut, rbox };
