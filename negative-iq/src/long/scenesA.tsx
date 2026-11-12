// Long-form (16:9) scenes, part A: hook → day 2
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic, spr, textTex, radialTex, canvasTex } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walkPath, walk, run, Pose } from '../three/person';
import { Car, CAR_COLORS } from '../three/vehicles';
import { Glow, Room, Shelf, rbox, Bin, Birds, Smoke, useScreen, Screen } from '../three/props';
import { Earth, StarField } from '../three/earth';
import { Traffic } from '../scenes/Morning';
import { ShopFront } from '../scenes/Ten';
import { Classroom } from '../scenes/Hour';
import { HERO, MOM, DAY, Label, Exclaim, HPBar, Wire, Bedroom, LyingHero, Blanket, Fridge, Kitchen, Floppy, RedButton, synth } from '../game/scenes';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, easeIn, smoother, kick, clamp, pop, wobble, backOut } from '../lib/anim';

export const DAD = () => randomLook(905, { skin: '#e8b48f', hair: '#4a2f1d', hairStyle: 'short', shirt: '#5c80bc', glasses: true, tie: '#2e4057' });
export const P2 = () => randomLook(907, { skin: '#c98d66', hair: '#151515', hairStyle: 'cap', hat: '#ff8c42', shirt: '#ff8c42', pants: '#2d3436' });

// ------------------------------------------------------------------ helpers
export const Dog: React.FC<{ pos: number[]; rotY?: number; ph?: number; color?: string }> = ({ pos, rotY = 0, ph = 0, color = '#a0522d' }) => {
  const m = mat(color, { r: 0.85 });
  const s = Math.sin(ph);
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} material={m} castShadow><capsuleGeometry args={[0.14, 0.42, 6, 12]} /></mesh>
      <group position={[0, 0.6, 0.34]}>
        <mesh material={m} castShadow><sphereGeometry args={[0.13, 16, 12]} /></mesh>
        <mesh position={[0, -0.03, 0.12]} material={mat('#8b4513', { r: 0.8 })}><sphereGeometry args={[0.07, 12, 8]} /></mesh>
        <mesh position={[0, 0.0, 0.19]} material={mat('#111', { r: 0.3 })}><sphereGeometry args={[0.025, 8, 6]} /></mesh>
        {[-1, 1].map((k) => <mesh key={k} position={[k * 0.1, 0.1, -0.02]} rotation={[0, 0, k * 0.5]} material={mat('#6b3410', { r: 0.8 })}><boxGeometry args={[0.06, 0.14, 0.04]} /></mesh>)}
        {[-1, 1].map((k) => <mesh key={'e' + k} position={[k * 0.05, 0.04, 0.11]} material={mat('#111', { r: 0.3 })}><sphereGeometry args={[0.018, 8, 6]} /></mesh>)}
      </group>
      {[[-0.09, 0.2], [0.09, 0.2], [-0.09, -0.2], [0.09, -0.2]].map(([x, z], i) => (
        <group key={i} position={[x, 0.32, z]} rotation={[(i % 2 ? s : -s) * 0.5, 0, 0]}>
          <mesh position={[0, -0.15, 0]} material={m}><cylinderGeometry args={[0.035, 0.03, 0.3, 8]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.55, -0.32]} rotation={[0.8 + s * 0.3, 0, 0]} material={m}><cylinderGeometry args={[0.02, 0.03, 0.22, 6]} /></mesh>
    </group>
  );
};
/** generic garden/yard set: fence, grass, garages */
export const Garages: React.FC<{ n?: number; pos?: number[] }> = ({ n = 5, pos = [0, 0, 0] }) => (
  <group position={pos as any}>
    {Array.from({ length: n }).map((_, i) => (
      <group key={i} position={[(i - (n - 1) / 2) * 3.4, 0, 0]}>
        <mesh position={[0, 1.3, 0]} material={mat(['#8a8f96', '#9aa0a8', '#7f868e'][i % 3], { r: 0.7, m: 0.3 })} castShadow receiveShadow><boxGeometry args={[3.3, 2.6, 6]} /></mesh>
        <mesh position={[0, 1.05, 3.01]} material={mat(['#3f6e9e', '#9e3f3f', '#3f9e6e', '#9e8a3f'][i % 4], { r: 0.5, m: 0.4 })}><planeGeometry args={[2.6, 2.1]} /></mesh>
        {Array.from({ length: 6 }).map((__, j) => <mesh key={j} position={[0, 0.2 + j * 0.34, 3.02]} material={mat('#000', { r: 0.6, t: 0.25 })}><planeGeometry args={[2.6, 0.03]} /></mesh>)}
        <mesh position={[0, 2.66, 0]} material={mat('#555b62', { r: 0.6, m: 0.4 })}><boxGeometry args={[3.4, 0.12, 6.2]} /></mesh>
      </group>
    ))}
  </group>
);
const Grass: React.FC<{ size?: number; color?: string }> = ({ size = 80, color = '#6f9a45' }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat(color, { r: 0.95 })}><planeGeometry args={[size, size]} /></mesh>
);

// ------------------------------------------------------------------ HOOK
export const L01Wake: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L01_wake');
  const open = k.w(5) - 1;
  const c = camK(f, [{ f: 0, p: [-0.7, 1.95, -1.2], l: [-0.9, 0.9, -1.72], fov: 34, roll: 8 }, { f: k.dur, p: [-0.8, 1.62, -1.4], l: [-0.9, 0.9, -1.72], fov: 34, roll: 2 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={5} noSky />
      <Cam {...c} />
      <Bedroom />
      <LyingHero pose={merge(f >= open ? EXPR.shock : EXPR.neutral, { blink: f < open ? 1 : 0, eyeA: [0, 0.01], eyeB: [0, 0.01] })} />
      <Blanket />
    </Stage>
  );
};
export const L02World: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L02_world');
  const c = camK(f, [{ f: 0, p: [10, 14, 40], l: [0, 8, -20], fov: 40 }, { f: k.dur, p: [30, 70, 110], l: [0, 0, -10], fov: 42 }]);
  return (
    <Stage>
      <Lights look={LOOKS.morning} center={[0, 0, 0]} size={110} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} />
      <Traffic f={f + 50} n={24} seed={4} />
      <Birds f={f} center={[5, 30, 10]} n={9} speed={0.2} />
    </Stage>
  );
};
export const L03Pixel: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L03_pixel');
  const { width: W, height: H } = useVideoConfig();
  const steps = [0.66, 0.66, 0.3, 0.15, 0.08, 0.04];
  const p = steps[Math.min(steps.length - 1, Math.floor((f / k.dur) * steps.length * 1.3))];
  const w = Math.max(16, Math.round(W * p)), h = Math.max(16, Math.round(H * p));
  const c = camK(f, [{ f: 0, p: [30, 70, 110], l: [0, 0, -10], fov: 42 }, { f: k.dur, p: [36, 82, 124], l: [0, 0, -10], fov: 42 }]);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${W / w})`, transformOrigin: '0 0', imageRendering: 'pixelated' }}>
        <ThreeCanvas width={w} height={h} gl={{ antialias: false }} camera={{ fov: 45, near: 0.1, far: 4000 }} style={{ imageRendering: 'pixelated' }}>
          <Lights look={LOOKS.morning} center={[0, 0, 0]} size={110} shadow={false} frame={f} />
          <Cam {...c} />
          <City seed={7} near={3} far={8} />
        </ThreeCanvas>
      </div>
    </div>
  );
};
export const L04NotDream: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L04_notdream');
  const slap = Math.max(0, Math.sin((f / k.dur) * Math.PI * 3));
  const c = camK(f, [{ f: 0, p: [0.6, 1.4, 1.2], l: [-0.85, 1.25, -1.0], fov: 40 }, { f: k.dur, p: [0.4, 1.45, 0.9], l: [-0.85, 1.3, -1.0], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={5} noSky />
      <Cam {...c} />
      <Bedroom />
      <group position={[-0.95, 0.62, -0.95]}>
        <Person look={HERO()} blob={false} rotY={0.5} pos={[0, -0.8, 0]} pose={merge(EXPR.shock, { legL: 1.5, legR: 1.5, kneeL: 1.45, kneeR: 1.45, armL: [1.9, -0.2, 2.2 + slap * 0.2], armR: [1.9, -0.2, 2.2 + slap * 0.2], head: [0, Math.sin(f * 0.5) * 0.15 * slap, 0] })} />
      </group>
      <Blanket />
    </Stage>
  );
};
export const L05GameWorld: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L05_gameworld');
  const t0 = k.w(20), t1 = k.w(22), t2 = k.w(24);
  const c = camK(f, [{ f: 0, p: [4.5, 1.7, 12], l: [9, 2.2, -4], fov: 46 }, { f: k.dur, p: [5.5, 3.2, 9], l: [9, 2.8, -4], fov: 46 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[9, 0, -2]} size={20} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Person look={HERO()} pos={[8.6, 0.16, 2]} rotY={Math.PI} pose={merge(idle(f, 2), EXPR.shock, { head: [-0.3, 0, 0] })} />
      {f >= t0 && <Label text="УР. 1" pos={[7.3, 4.2, -3]} h={0.6 * pop(f, t0, 8)} bg="rgba(10,14,30,0.85)" fg="#ffd23f" />}
      {f >= t1 && [[10.3, -2], [11.5, -6], [9.2, -8]].map(([x, z], i) => <Exclaim key={i} pos={[x, 3.0 + Math.sin(f * 0.2 + i) * 0.05, z]} s={pop(f, t1 + i * 3, 8)} />)}
      {f >= t2 && <group position={[10.5, 3.6, -1]} rotation={[1.0, -0.4, 0]}><RedButton s={0.8 * backOut((f - t2) / 12, 1.6)} /></group>}
    </Stage>
  );
};
export const L06Teaser: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L06_teaser');
  const sci = useMemo(() => [0, 1, 2].map((i) => randomLook(1000 + i, { coat: 'lab', glasses: i !== 1 })), []);
  const c = camK(f, [{ f: 0, p: [0, 1.9, 7.5], l: [0, 1.6, 0], fov: 38 }, { f: k.dur, p: [1.6, 2.0, 4.6], l: [0, 1.5, 0], fov: 38 }], (t) => t);
  const vis = ramp(f, k.w(34) - 6, k.w(35));
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, sunI: 0.6 * vis + 0.1, hemiI: 0.3, hor: '#0f2a4a', top: '#050a18' }} center={[0, 1, 0]} size={6} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#141c2b', { r: 0.8 })}><circleGeometry args={[12, 48]} /></mesh>
      <mesh position={[0, 0.45, 0]} material={mat('#2a3550', { r: 0.4, m: 0.4 })} castShadow><cylinderGeometry args={[1.0, 1.1, 0.9, 32]} /></mesh>
      <group position={[0, 1.75, 0]}><Earth rot={f * 0.012} r={0.55} sun={[1, 0.3, 0.5]} night={0} /></group>
      <Glow pos={[0, 1.75, 0]} s={1.8} color="#2ef2ff" o={0.4} />
      <pointLight position={[0, 1.7, 0]} intensity={12} distance={5} color="#5ef0ff" />
      {sci.map((l, i) => { const a = -0.9 + i * 0.9 + Math.PI; return <Person key={i} look={l} pos={[Math.sin(a) * 1.7, 0, Math.cos(a) * 1.7]} rotY={a + Math.PI} pose={merge(idle(f, i), EXPR.confused, { armR: [1.1 + Math.sin(f * 0.1 + i) * 0.3, 0.2, 0.8] })} />; })}
    </Stage>
  );
};
export const TitleL: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#140033' }}>
      <div style={{ position: 'absolute', left: 0, top: -560, width: 1920, height: 3413, backgroundImage: synth(), backgroundSize: 'cover', transform: `scale(${1 + f * 0.0015})` }} />
    </div>
  );
};

// ------------------------------------------------------------------ MORNING
export const L07Sunrise: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L07_sunrise');
  const c = camK(f, [{ f: 0, p: [-120, 58, 2], l: [60, 8, 0], fov: 40 }, { f: k.dur, p: [-108, 46, 2], l: [60, 10, 0], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.morning} center={[-20, 0, 0]} size={110} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} lamps={0.3} night={0.15} clear={[[-112, 2, 14]]} />
      <Traffic f={f + 40} n={18} seed={4} />
      <Birds f={f} center={[-30, 34, 8]} n={9} spread={14} speed={0.18} />
    </Stage>
  );
};
export const L08Eyes: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L08_eyes');
  const open = k.w(46);
  const c = camK(f, [{ f: 0, p: [-0.8, 1.7, -1.35], l: [-0.9, 0.9, -1.72], fov: 32 }, { f: k.dur, p: [-0.85, 1.55, -1.45], l: [-0.9, 0.9, -1.72], fov: 32 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={5} noSky />
      <Cam {...c} />
      <Bedroom />
      <LyingHero pose={merge(EXPR.neutral, { blink: f < open ? 1 : f < open + 4 ? 0.5 : 0, eyeA: [0, 0.02], eyeB: [0, 0.02] })} />
      <Blanket />
    </Stage>
  );
};
export const L09HPBar: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L09_hpbar');
  const appear = k.w(52) - 2;
  const sit = ramp(f, 0, 14);
  const bar = pop(f, appear, 9);
  const c = camK(f, [{ f: 0, p: [1.0, 1.5, 1.6], l: [-0.85, 1.35, -1.0], fov: 40 }, { f: k.dur, p: [0.8, 1.6, 1.3], l: [-0.85, 1.6, -1.0], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={5} noSky />
      <Cam {...c} />
      <Bedroom />
      <group position={[-0.95, 0.62, -0.95]}>
        <Person look={HERO()} blob={false} rotY={0.5} pos={[0, -0.8, 0]} pose={merge(f > appear + 6 ? EXPR.shock : EXPR.neutral, {
          body: [lerp(-0.3, 0.05, sit), 0, 0], legL: 1.5, legR: 1.5, kneeL: 1.45, kneeR: 1.45, head: [f > appear ? -0.35 : 0.05, 0.1, 0], eyeA: f > appear ? [0, 0.028] : [0, 0], eyeB: f > appear ? [0, 0.028] : [0, 0],
          armL: [0.3, 0.2, 0.4], armR: [0.3, 0.2, 0.4],
        })} />
        {f >= appear && <HPBar pos={[0.25, 1.65 + Math.sin(f * 0.15) * 0.02, 0.2]} s={0.75 * bar} />}
      </group>
      <Blanket />
    </Stage>
  );
};
export const L10Level: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L10_level');
  const blink = k.w(61);
  const look = k.w(55);
  const c = camK(f, [{ f: 0, p: [0.15, 1.62, 1.25], l: [-0.1, 1.55, 0], fov: 36 }, { f: k.dur, p: [0.0, 1.6, 0.95], l: [-0.1, 1.58, 0], fov: 34 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={4} noSky />
      <Cam {...c} />
      <group position={[0, 0, -2]}><Room w={7} d={6} h={3} wall="#cfe0ef" floor="wood" windows="back" light={0.8} /></group>
      <Person look={HERO()} pose={merge(f > look ? EXPR.shock : EXPR.neutral, { head: [f > look ? -0.2 : 0, f > look ? 0.35 : 0, 0], blink: f >= blink && f < blink + 5 ? 1 : 0, eyeA: f > look ? [-0.022, 0.024] : [0, 0], eyeB: f > look ? [-0.022, 0.024] : [0, 0] })} />
      <HPBar pos={[0, 2.25, 0]} s={0.6} />
    </Stage>
  );
};
export const L11Tutorial: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L11_tutorial');
  const stand = ramp(f, 0, 20);
  const walkStart = k.w(76);
  const w = walkPath(f, [-0.6, -0.6], [0.8, 0.6], 0.7, walkStart);
  const dead = k.w(79);
  const c = camK(f, [{ f: 0, p: [1.8, 1.6, 2.4], l: [-0.4, 1.0, -0.8], fov: 44 }, { f: dead, p: [1.6, 1.55, 2.2], l: [0.4, 1.3, 0.2], fov: 40 }, { f: k.dur, p: [1.1, 1.65, 1.9], l: [0.6, 1.55, 0.4], fov: 34 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={5} noSky />
      <Cam {...c} />
      <Bedroom />
      <Person look={HERO()} pos={[w.pos[0], lerp(-0.2, 0, stand), w.pos[2]]} rotY={f > dead ? 0.9 : w.rotY} pose={merge(idle(f, 2), f < walkStart ? { body: [lerp(0.5, 0.05, stand), 0, 0] } : w.pose, f > dead ? { ...EXPR.neutral, brows: [0.25, 0.25, -0.01], blink: 0.45, mouth: 'flat' } : EXPR.confused)} />
    </Stage>
  );
};
export const L12Inventory: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L12_inventory');
  const ang = lerp(-0.35, 0.35, smoother(f / k.dur));
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={5} noSky />
      <Cam pos={[0.4 + Math.sin(ang) * 2.4, 1.55, 0.4 + Math.cos(ang) * 2.4]} look={[0.4, 1.4, 0.2]} fov={40} />
      <Bedroom />
      <Person look={HERO()} pos={[0.4, 0, 0.2]} rotY={0.1} pose={merge(idle(f, 4), f > k.w(93) ? EXPR.shock : EXPR.confused, { armL: [0.7, 0.3, 1.2], armR: [0.7, 0.3, 1.2], head: [0.15, 0, 0] })} />
    </Stage>
  );
};

// ------------------------------------------------------------------ 10 MINUTES (kitchen)
export const L13Fridge: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L13_fridge');
  const glowOn = k.w(119) - 2, prompt = k.w(123) - 2;
  const w = walkPath(f, [-1.8, 0.4], [1.0, -2.8], 1.0, 0);
  const glow = ramp(f, glowOn, glowOn + 6);
  const c = camK(f, [{ f: 0, p: [-0.4, 1.75, 2.6], l: [0.2, 1.2, -2.6], fov: 44 }, { f: k.dur, p: [0.4, 1.7, 1.2], l: [1.3, 1.2, -3.6], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam {...c} />
      <Kitchen f={f} glow={glow} />
      <Person look={HERO()} pos={[w.pos[0], 0, w.pos[2]]} rotY={w.done ? 2.6 : w.rotY} pose={merge(idle(f, 2), w.pose, f > glowOn ? { ...EXPR.shock, head: [0, w.done ? 0.3 : 0.5, 0] } : EXPR.neutral)} />
      {f >= prompt && <Label text="[E]  ВЗЯТЬ" pos={[1.6, 2.25 + Math.sin(f * 0.2) * 0.02, -3.7]} h={0.22 * pop(f, prompt, 7)} fg="#ffd23f" />}
    </Stage>
  );
};
export const L14Mom: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L14_mom');
  const says = [k.w(125) - 3, k.w(132) - 3, k.w(134) - 3, k.w(137) - 3];
  let last = -1; for (const s of says) if (f >= s) last = s;
  const loopF = last >= 0 ? f - last : 0;
  const gesture = last >= 0 && loopF < 24 ? Math.sin((loopF / 24) * Math.PI) : 0;
  const c = camK(f, [{ f: 0, p: [1.2, 1.6, 2.4], l: [-0.6, 1.45, -2.8], fov: 40 }, { f: k.dur, p: [0.6, 1.6, 1.3], l: [-0.6, 1.5, -2.8], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam {...c} />
      <Kitchen f={f} />
      <Person look={MOM()} pos={[-0.6, 0, -3.2]} rotY={0.25} pose={merge(EXPR.happy, { armR: [0.6 + gesture * 1.6, 0.4, 0.5 + gesture * 0.6], head: [0, 0.15 * gesture, 0.12 * gesture], blink: loopF > 30 && loopF < 34 ? 1 : 0 })} />
      <Person look={HERO()} pos={[0.7, 0, -1.4]} rotY={-2.3} pose={merge(idle(f, 4), EXPR.confused, { head: [0, 0, 0.1] })} />
      {last >= 0 && <Label text="Доброе утро, солнышко!" pos={[-0.55, 2.35, -3.0]} h={0.17 * pop(f, last, 6)} bg="rgba(255,255,255,0.95)" fg="#222" />}
    </Stage>
  );
};
export const L15NPC: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L15_npc');
  const tag = k.w(142) - 2;
  const c = camK(f, [{ f: 0, p: [-0.1, 1.95, -0.6], l: [-0.6, 2.0, -3.2], fov: 38 }, { f: k.dur, p: [-0.2, 1.95, -0.95], l: [-0.6, 2.05, -3.2], fov: 36 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam {...c} />
      <Kitchen f={f} />
      <Person look={MOM()} pos={[-0.6, 0, -3.2]} rotY={0.25} pose={merge(EXPR.happy, { blink: (f % 40) < 4 ? 1 : 0 })} />
      <Exclaim pos={[-0.6, 2.62 + Math.sin(f * 0.18) * 0.03, -3.2]} s={0.8} color="#9aa0a8" />
      {f >= tag && <Label text={'МАМА   [NPC]'} pos={[-0.6, 2.25, -3.15]} h={0.13 * pop(f, tag, 7)} bg="rgba(20,120,60,0.9)" />}
    </Stage>
  );
};
export const L16Dad: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L16_dad');
  const lift = ramp(f, k.w(146), k.w(147) + 6);
  const ex = k.w(153) - 2, quest = k.w(157) - 2;
  const c = camK(f, [{ f: 0, p: [1.6, 1.5, 0.9], l: [0.2, 1.2, -1.6], fov: 42 }, { f: k.dur, p: [1.2, 1.55, 0.5], l: [0.2, 1.45, -1.7], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam {...c} />
      <Kitchen f={f} />
      <mesh position={[0.2, 0.45, -1.95]} material={mat('#8b5a3c', { r: 0.7 })} castShadow><boxGeometry args={[0.5, 0.06, 0.45]} /></mesh>
      <Person look={DAD()} pos={[0.2, 0, -1.95]} rotY={0} pose={merge(f > ex ? EXPR.happy : EXPR.neutral, { legL: 1.5, legR: 1.5, kneeL: 1.5, kneeR: 1.5, y: -0.32, armL: [1.3 - lift * 0.5, 0.2, 0.9], armR: [1.3 - lift * 0.5, 0.2, 0.9], head: [lerp(0.45, -0.05, lift), 0, 0] })}
        propL={<mesh position={[0.2, 0.05, 0.05]} rotation={[0.3, 0, 0]} material={mat('#efece4', { r: 0.9 })}><boxGeometry args={[0.5, 0.36, 0.01]} /></mesh>} />
      {f >= ex && <Exclaim pos={[0.2, 1.72 + Math.sin(f * 0.2) * 0.03, -1.95]} s={0.6 * pop(f, ex, 8)} />}
      {f >= quest && <Label text="КВЕСТ: ВЫНЕСИ МУСОР" pos={[0.2, 2.02, -1.9]} h={0.13 * pop(f, quest, 7)} fg="#ffd23f" />}
    </Stage>
  );
};
export const L17Trash: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L17_trash');
  const drop = k.w(161);
  const w = walkPath(f, [-24, -9.5], [-21.2, -9.5], 1.0, 0);
  const bagY = f < drop ? 0 : -Math.min(0.6, ((f - drop) / 10) ** 2);
  const c = camK(f, [{ f: 0, p: [-22, 1.7, -4], l: [-21.5, 1.0, -9.5], fov: 42 }, { f: k.dur, p: [-21.2, 1.75, -5.2], l: [-21.2, 1.1, -9.5], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[-21, 0, -9]} size={12} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Bin pos={[-20.6, 0.16, -9.9]} />
      <Person look={HERO()} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.done ? 0.3 : w.rotY} pose={merge(idle(f, 2), w.pose, f > k.w(164) ? EXPR.grin : EXPR.neutral, f < drop + 6 ? { armR: [0.5, 0.25, 0.3] } : {})}
        propR={f < drop ? <mesh position={[0, -0.12 + bagY, 0]} material={mat('#26282c', { r: 0.35 })} castShadow><sphereGeometry args={[0.2, 12, 10]} /></mesh> : null} />
    </Stage>
  );
};
export const L18Choice: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L18_choice');
  const c = camK(f, [{ f: 0, p: [1.5, 1.6, 1.2], l: [-0.5, 1.45, -2.6], fov: 42 }, { f: k.dur, p: [0.9, 1.65, 0.3], l: [-0.4, 1.55, -2.6], fov: 38 }], (t) => t);
  const think = f > k.w(194);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam {...c} />
      <Kitchen f={f} />
      <Person look={MOM()} pos={[-0.6, 0, -3.2]} rotY={0.4} pose={merge(EXPR.happy, { armR: [0.6, 0.4, 0.5], head: [0, 0.3, 0] })} />
      <Person look={HERO()} pos={[0.6, 0, -1.6]} rotY={-2.4} pose={merge(idle(f, 4), think ? EXPR.confused : EXPR.neutral, { head: [0.05, think ? Math.sin(f * 0.06) * 0.3 : 0, 0] })} />
    </Stage>
  );
};

// ------------------------------------------------------------------ 1 HOUR (street)
export const L19Loops: React.FC = () => {
  const f = useCurrentFrame();
  const clone = useMemo(() => randomLook(950, { shirt: '#9aa0a8', pants: '#4a4e69', hairStyle: 'short', hair: '#151515' }), []);
  const R = 6, cx = -28, cz = -22;
  const dots = useMemo(() => Array.from({ length: 48 }).map((_, i) => [cx + Math.cos((i / 48) * 6.283) * R, cz + Math.sin((i / 48) * 6.283) * R]), []);
  const c = camK(f, [{ f: 0, p: [-20, 8, -8], l: [-28, 0.8, -22], fov: 42 }, { f: 138, p: [-18, 10, -10], l: [-28, 0.6, -22], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[-28, 0, -22]} size={16} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      {dots.map(([x, z], i) => <mesh key={i} position={[x, 0.18, z]} rotation={[-Math.PI / 2, 0, 0]} material={basic('#ffd23f', { t: 0.75 })}><circleGeometry args={[0.12, 10]} /></mesh>)}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (f / 30) * (1.25 / R) + (i / 8) * Math.PI * 2;
        return <Person key={i} look={clone} pos={[cx + Math.cos(a) * R, 0.16, cz + Math.sin(a) * R]} rotY={Math.atan2(-Math.sin(a), Math.cos(a))} pose={merge(walk((f / 30) * 1.25 / 0.72 * Math.PI, 1), EXPR.neutral)} />;
      })}
    </Stage>
  );
};
export const L20Dog: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L20_dog');
  const man = useMemo(() => randomLook(960, { shirt: '#6a994e', hairStyle: 'bald', glasses: true }), []);
  const z = lerp(-14, 6, f / k.dur);
  const ph = ((f / 30) * 1.3 / 0.72) * Math.PI;
  const c = camK(f, [{ f: 0, p: [5.6, 1.4, 2], l: [9, 1.0, -4], fov: 42 }, { f: k.dur, p: [5.6, 1.4, 1.2], l: [9, 1.0, 1], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[9, 0, 0]} size={16} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Person look={man} pos={[9.2, 0.16, z]} rotY={0} pose={merge(walk(ph, 0.9), EXPR.neutral, { armR: [0.5, 0.2, 0.3] })} />
      <Dog pos={[8.3, 0.16, z + 1.0]} ph={f * 0.5} />
      <mesh position={[8.75, 0.75, z + 0.6]} rotation={[0.6, 0, 0.9]} material={mat('#c0392b', { r: 0.6 })}><cylinderGeometry args={[0.008, 0.008, 1.0, 4]} /></mesh>
      <Person look={HERO()} pos={[10.6, 0.16, -1]} rotY={-1.9} pose={merge(idle(f, 5), EXPR.confused, { head: [0, -0.3 + (z + 1) * 0.06, 0] })} />
    </Stage>
  );
};
export const L21Cars: React.FC = () => {
  const f = useCurrentFrame();
  const j = (s: number) => Math.sin(f * 3.7 + s) * 0.03;
  const c = camK(f, [{ f: 0, p: [3.5, 1.6, 9], l: [11, 1.5, -2], fov: 42 }, { f: 128, p: [4.3, 1.7, 7.5], l: [11, 1.6, -2], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[10, 0, 0]} size={18} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <mesh position={[13.6, 3, -3]} material={mat('#c98f6a', { r: 0.9 })} castShadow receiveShadow><boxGeometry args={[2.0, 6, 9]} /></mesh>
      <Car kind="sedan" color="#d63031" pos={[12.9 + j(1), 0.16, -3 + j(2)]} rotY={Math.PI / 2 + 0.15} tilt={[0, j(3)]} />
      {f % 8 < 4 && <Glow pos={[12.5, 1.0, -3]} s={2.0} color="#ff2bd6" o={0.5} />}
      <Car kind="taxi" color="#f1c40f" pos={[5.2, -0.45 + j(4), -9]} rotY={0.4} tilt={[0.12, 0.05]} />
      <Car kind="van" color="#2e86de" pos={[9.6 + j(5), 1.2, -15]} rotY={Math.PI / 2} tilt={[0, Math.PI / 2 - 0.2]} />
    </Stage>
  );
};
export const L22LOD: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L22_lod');
  const texT = k.w(248);
  const R = f < texT ? -10 : (f - texT) * 4;
  const c = camK(f, [{ f: 0, p: [-9.4, 1.7, -14], l: [30, 18, -70], fov: 46 }, { f: k.dur, p: [-9.2, 1.7, -16], l: [30, 20, -70], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[10, 0, -20]} size={40} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} load={[-9, -20, R]} />
    </Stage>
  );
};
/** fact: level of detail — the same house at three detail levels, then a city that greys out with distance */
export const L23LODFact: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L23_lodfact');
  const cut = k.w(263) - 2;
  if (f < cut) {
    const c = camK(f, [{ f: 0, p: [0, 3.2, 13], l: [0, 2.2, 0], fov: 40 }, { f: cut, p: [1.5, 3.0, 11], l: [0, 2.2, 0], fov: 40 }], (t) => t);
    const tri = (segs: number) => geoCache(segs);
    return (
      <Stage>
        <Lights look={{ ...LOOKS.studio, hor: '#2c3e6b', top: '#0f1530' }} center={[0, 1, 0]} size={10} frame={f} />
        <Cam {...c} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#1d2442', { r: 0.9 })}><circleGeometry args={[30, 48]} /></mesh>
        {[[-4.2, 48, 'БЛИЗКО'], [0, 12, 'СРЕДНЕ'], [4.2, 5, 'ДАЛЕКО']].map(([x, segs, lab]: any, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh geometry={tri(segs)} position={[0, 1.6, 0]} material={mat(i === 2 ? '#9aa0a8' : '#4f8a3c', { r: 0.8, flat: true })} castShadow />
            <mesh position={[0, 0.5, 0]} material={mat('#6b4a33', { r: 0.9 })} castShadow><cylinderGeometry args={[0.15, 0.22, 1.0, Math.max(4, segs / 3)]} /></mesh>
            <Label text={lab as string} pos={[0, 3.4, 0]} h={0.35} fg={['#7dffb0', '#ffd23f', '#ff8a8a'][i]} />
          </group>
        ))}
      </Stage>
    );
  }
  const g = f - cut;
  const c = camK(g, [{ f: 0, p: [0, 40, 90], l: [0, 0, -60], fov: 44 }, { f: k.dur - cut, p: [0, 36, 70], l: [0, 0, -80], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 0]} size={100} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} load={[0, 70, lerp(160, 110, smoother(g / 60))]} />
    </Stage>
  );
};
const _geo: Record<number, THREE.BufferGeometry> = {};
const geoCache = (segs: number) => (_geo[segs] ||= new THREE.SphereGeometry(1.3, segs, Math.max(3, Math.round(segs / 2))));
export const L24Saving: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L24_saving');
  const c = camK(f, [{ f: 0, p: [9.5, 2.0, 6], l: [8.6, 1.3, 0], fov: 40 }, { f: k.dur, p: [16, 46, 24], l: [8.6, 0, -4], fov: 46 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[8, 0, 0]} size={lerp(12, 70, smoother(f / k.dur))} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} load={[8.6, 0, 18]} />
      <Person look={HERO()} pos={[8.6, 0.16, 0]} rotY={0.4} pose={merge(idle(f, 3), EXPR.confused, { head: [-0.2, 0.3, 0] })} />
    </Stage>
  );
};
export const L25Teeth: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L25_teeth');
  const brush = Math.sin(f * 0.9) * 0.06;
  const xp = k.w(289);
  const c = camK(f, [{ f: 0, p: [1.05, 1.62, -2.3], l: [0, 1.45, -1.3], fov: 48 }, { f: k.dur, p: [0.95, 1.62, -2.32], l: [0, 1.5, -1.3], fov: 46 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={5} noSky />
      <Cam {...c} />
      <group position={[0, 0, -0.5]}><Room w={4} d={4} h={2.8} wall="#cfe9f2" floor="tile" ceilingLights={1} /></group>
      <mesh position={[0, 1.4, 1.48]} rotation={[0, Math.PI, 0]} material={mat('#cfe9f2', { r: 0.9 })}><planeGeometry args={[4, 2.8]} /></mesh>
      <mesh position={[0.6, 1.1, 1.46]} rotation={[0, Math.PI, 0]} material={mat('#b9d6e3', { r: 0.8 })}><boxGeometry args={[0.9, 2.1, 0.04]} /></mesh>
      <mesh geometry={rbox(1.0, 0.85, 0.5, 0.03)} position={[0, 0.42, -2.2]} material={mat('#ffffff', { r: 0.3 })} castShadow receiveShadow />
      <Person look={HERO()} pos={[0, 0, -1.4]} rotY={Math.PI} pose={merge(idle(f, 3), f > xp ? EXPR.grin : EXPR.neutral, { armR: [1.25, -0.35, 2.05 + brush * 2] })}
        propR={<group rotation={[0, 0, Math.PI / 2]}><mesh material={mat('#2e86de', { r: 0.4 })} position={[0, 0.08, 0]}><boxGeometry args={[0.02, 0.2, 0.015]} /></mesh><mesh material={mat('#ffffff', { r: 0.9 })} position={[0, 0.19, 0.012]}><boxGeometry args={[0.025, 0.04, 0.02]} /></mesh></group>} />
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 1
export const L26Quests: React.FC = () => {
  const f = useCurrentFrame();
  const c = camK(f, [{ f: 0, p: [8.5, 1.7, 9], l: [11, 2.2, -6], fov: 44 }, { f: 47, p: [8.6, 1.8, 7.4], l: [11, 2.4, -6], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[10, 0, -4]} size={16} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      {[[10.3, -2], [11.2, -6], [9.4, -9]].map(([x, z], i) => (
        <group key={i}>
          <Person look={randomLook(960 + i)} pos={[x, 0.16, z]} rotY={-0.6} pose={merge(idle(f, i), EXPR.happy)} />
          <Exclaim pos={[x, 2.55 + Math.sin(f * 0.2 + i) * 0.04, z]} s={0.75 * pop(f, i * 5, 8)} />
        </group>
      ))}
      <Person look={HERO()} pos={[9.2, 0.16, 4.5]} rotY={Math.PI - 0.2} pose={merge(idle(f, 9), EXPR.shock)} />
    </Stage>
  );
};
export const L27Bread: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L27_bread');
  const coinsAt = k.w(304) - 2, pocket = k.w(310);
  const w = walkPath(f + 8, [0, 0.5], [0.4, 2.6], 0.9, 0);
  const coins = useMemo(() => { const r = rng(4); return Array.from({ length: 14 }).map(() => [r() * 6.28, 1.5 + r() * 2.5, r() * 6]); }, []);
  const c = camK(f, [{ f: 0, p: [2.2, 1.7, 4.8], l: [0, 1.3, 0.8], fov: 42 }, { f: k.dur, p: [1.6, 1.5, 4.4], l: [0.3, 1.1, 2.2], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 1, 0]} size={8} />
      <Cam {...c} />
      <group position={[0, 0, -30]}><City seed={7} near={2} far={5} /></group>
      <ShopFront rattle={0} sign="ПЕКАРНЯ" signColor="#d68910" />
      <Person look={HERO()} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, 2), w.pose, EXPR.grin, { armR: [1.0, 0.1, 1.2] })}
        propR={<group rotation={[0.2, 0, 1.2]}><mesh material={mat('#d9a066', { r: 0.7 })}><capsuleGeometry args={[0.05, 0.42, 6, 12]} /></mesh></group>} />
      {f >= coinsAt && f < pocket && coins.map(([a, v, s], i) => {
        const t = (f - coinsAt) / 30;
        const x = w.pos[0] + Math.cos(a) * t * v * 0.5, y = 1.8 + t * v - 4.9 * t * t, z = w.pos[2] + Math.sin(a) * t * v * 0.5;
        return y > 0.1 ? <mesh key={i} position={[x, y, z]} rotation={[f * 0.3 + s, s, 0]} material={mat('#f5c542', { r: 0.25, m: 0.9 })} castShadow><cylinderGeometry args={[0.08, 0.08, 0.018, 20]} /></mesh> : null;
      })}
      {f >= pocket && coins.map(([a, v, s], i) => {
        const t = clamp((f - pocket - i * 1.2) / 10);
        if (t >= 1) return null;
        const sx = w.pos[0] + Math.cos(a) * 1.2, sy = 2.2 + (i % 3) * 0.3, sz = w.pos[2] + Math.sin(a) * 1.2;
        return <mesh key={'p' + i} position={[lerp(sx, w.pos[0] + 0.15, easeIn(t)), lerp(sy, 0.85, easeIn(t)), lerp(sz, w.pos[2] + 0.1, easeIn(t))]} rotation={[f * 0.4 + s, s, 0]} material={mat('#f5c542', { r: 0.25, m: 0.9 })}><cylinderGeometry args={[0.07, 0.07, 0.018, 18]} /></mesh>;
      })}
    </Stage>
  );
};
export const L28Boss: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L28_boss');
  const grow = ramp(f, k.w(320), k.w(320) + 14);
  const testAt = k.w(333) - 4;
  const teacher = useMemo(() => randomLook(340, { glasses: true, hairStyle: 'bun', hair: '#6b6b6b', shirt: '#7d4fb3', skirt: true }), []);
  const board = useScreen(768, 576, 'eq' + (f >= testAt ? 1 : 0), (g, w, h) => {
    g.fillStyle = '#2f4f3a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4f4ec'; g.font = '700 54px Montserrat'; g.textBaseline = 'top';
    const lines = f >= testAt ? ['∫ ∂x·∑(√π)^∞ dx = ?', 'lim (x→?) ½·∜x² = ¿', '2 + 2 = 5 ⇔ ∅ ⊂ ∞', 'РЕШИТЕ ЗА 3 МИНУТЫ'] : ['КОНТРОЛЬНАЯ', '', 'Вариант ∞'];
    lines.forEach((l, i) => g.fillText(l, 40, 40 + i * 120));
  });
  const boardMat = useMemo(() => new THREE.MeshBasicMaterial({ map: board, toneMapped: false }), [board]);
  const c = camK(f, [{ f: 0, p: [2.0, 1.2, 1.4], l: [-0.2, 2.2, -4.6], fov: 48 }, { f: testAt, p: [1.9, 1.15, 1.0], l: [-0.2, 2.8, -4.6], fov: 50 }, { f: k.dur, p: [0.9, 1.9, -2.6], l: [0.3, 1.8, -6], fov: 44 }]);
  const sc = 1 + grow * 0.7;
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, hemiI: 0.6 }} center={[0, 1, -3]} size={8} noSky />
      <Cam {...c} />
      <Classroom f={f} qFrom={1e9} />
      <mesh position={[0.6, 1.75, -5.94]} material={boardMat}><planeGeometry args={[2.6, 1.95]} /></mesh>
      <group position={[-0.9, 0, -4.7]} scale={[sc, sc, sc]}>
        <Person look={teacher} pose={merge(idle(f, 9), grow > 0.5 ? { ...EXPR.dumb2, mouth: 'O', brows: [-0.45, 0.45, 0] } : EXPR.neutral, { armL: [0.4 + grow, 0.7 * grow, 0.3], armR: [0.4 + grow, 0.7 * grow, 0.3] })} />
      </group>
      {grow > 0 && <Glow pos={[-0.9, 1.6 * sc, -4.9]} s={4 * grow} color="#ff2a3a" o={0.55} />}
      <Person look={HERO()} pos={[1.5, 0, -2.4]} rotY={Math.PI - 0.5} pose={merge(idle(f, 3), EXPR.shock)} />
    </Stage>
  );
};
export const L29Wall: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L29_wall');
  const hit = k.cue('wall_hit');
  const wallX = 260;
  const x = f < hit ? wallX - 2.4 - ((hit - f) / 30) * 14 : wallX - 2.4 - 1.6 * easeOut((f - hit) / 10);
  const flash = f >= hit ? Math.max(0, 1 - (f - hit) / 30) : 0;
  const hex = useMemo(() => {
    const t = canvasTex('hexwall', 512, 512, (g) => {
      g.strokeStyle = 'rgba(80,240,255,1)'; g.lineWidth = 4;
      const r = 32;
      for (let yy = 0; yy < 12; yy++) for (let xx = 0; xx < 10; xx++) {
        const cx = xx * r * 1.75 + (yy % 2) * r * 0.87, cy = yy * r * 1.5;
        g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; i ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.stroke();
      }
    }, { repeat: true }).clone();
    t.repeat.set(6, 3); t.needsUpdate = true; return t;
  }, []);
  const wm = useMemo(() => new THREE.MeshBasicMaterial({ map: hex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), [hex]);
  wm.opacity = flash;
  const sh = kick(f, hit, 9) * 0.25;
  const aerialEnd = k.w(348) - 2;
  const c = f < aerialEnd
    ? camK(f, [{ f: 0, p: [x - 40, 30, 30], l: [x + 20, 0, -1.75], fov: 42 }, { f: aerialEnd, p: [x - 20, 12, 14], l: [x + 30, 0, -1.75], fov: 42 }])
    : f < hit + 20 ? { pos: [Math.min(x, wallX - 2.4) - 7.5, 2.3, 0.6], look: [wallX + 4, 1.3, -1.75], fov: 46 }
      : camK(f - hit - 20, [{ f: 0, p: [wallX - 6, 2.0, 7], l: [wallX - 2, 2.0, -1.75], fov: 44 }, { f: k.dur - hit, p: [wallX - 7, 2.6, 8], l: [wallX - 1, 2.4, -1.75], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.golden, sunAz: 250 }} center={[x, 0, 0]} size={30} frame={f} />
      <Cam pos={[c.pos[0] + sh, c.pos[1] + sh * 0.5, c.pos[2]]} look={c.look} fov={c.fov} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#7f9a55', { r: 0.95 })}><planeGeometry args={[3000, 3000]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[100, 0.02, 0]} receiveShadow material={mat('#55585e', { r: 0.9 })}><planeGeometry args={[600, 8]} /></mesh>
      {Array.from({ length: 50 }).map((_, i) => <mesh key={i} position={[wallX - 400 + i * 9, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#f2f2ee', { r: 0.6 })}><planeGeometry args={[4, 0.18]} /></mesh>)}
      <group position={[-60, 0, -80]}><City seed={7} near={2} far={4} /></group>
      <Car kind="sedan" color="#3f88c5" pos={[x, 0, -1.75]} rotY={Math.PI / 2} dist={x} tilt={[f >= hit && f < hit + 8 ? -0.06 : 0, 0]} lights={1} />
      <mesh position={[wallX, 6, 0]} rotation={[0, Math.PI / 2, 0]} material={wm}><planeGeometry args={[60, 14]} /></mesh>
      <mesh position={[wallX + 0.05, 6, 0]} rotation={[0, Math.PI / 2, 0]} material={basic('#5ef0ff', { add: true, t: 0.25 * flash, side: THREE.DoubleSide })}><planeGeometry args={[60, 14]} /></mesh>
      {flash > 0 && <Glow pos={[wallX - 0.2, 1.0, -1.75]} s={8 * flash} color="#5ef0ff" />}
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 2
const Counter: React.FC<{ f: number; screen: string; err?: boolean }> = ({ f, screen, err }) => {
  const tex = useScreen(512, 320, screen + Math.floor(f / 6), (g, w, h) => {
    g.fillStyle = err ? '#7a0000' : '#0d3b66'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 52px Montserrat';
    screen.split('\n').forEach((l, i) => g.fillText(l, w / 2, h / 2 - 30 + i * 70));
  });
  return (
    <group>
      <mesh geometry={rbox(1.0, 0.9, 3.4, 0.04)} position={[0, 0.45, -0.6]} material={mat('#dfe6e9', { r: 0.4 })} castShadow receiveShadow />
      <group position={[0, 0.9, -1.2]} rotation={[0, 0.5, 0]}>
        <mesh geometry={rbox(0.7, 0.25, 0.5, 0.04)} position={[0, 0.12, 0]} material={mat('#2d3436', { r: 0.5 })} />
        <Screen tex={tex} w={0.62} h={0.39} pos={[0, 0.6, 0]} rot={[-0.15, 0, 0]} />
      </group>
    </group>
  );
};
export const L30Pay: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L30_pay');
  const pay = k.w(380) - 4;
  const c = camK(f, [{ f: 0, p: [1.9, 1.75, 3.2], l: [-0.2, 1.2, -0.6], fov: 42 }, { f: k.dur, p: [1.4, 1.6, 2.4], l: [-0.1, 1.1, -0.6], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={8} noSky />
      <Cam {...c} />
      <group position={[0, 0, -2]}><Room w={10} d={10} h={3.6} wall="#eef1f4" floor="tile" ceilingLights={3} light={1.2} /></group>
      <Shelf pos={[-2.2, 0, -5]} len={4} seed={8} />
      <Counter f={f} screen={f >= pay ? 'ОПЛАТА:\n30 МОНЕТ ✓' : 'К ОПЛАТЕ:\n30 МОНЕТ'} />
      <Person look={randomLook(302, { shirt: '#c0392b', hairStyle: 'bun' })} pos={[-1.0, 0, -1.2]} rotY={Math.PI / 2} pose={merge(idle(f, 2), EXPR.happy)} />
      <Person look={HERO()} pos={[0.9, 0, 0.2]} rotY={-Math.PI / 2 - 0.4} pose={merge(idle(f, 3), EXPR.happy, { armR: [1.2, 0.1, 0.5] })} />
      {f >= pay && Array.from({ length: 6 }).map((_, i) => <mesh key={i} position={[0.1 + (i % 3) * 0.12, 0.92 + Math.floor(i / 3) * 0.02 + Math.max(0, (pay + 8 + i * 2 - f) * 0.05), 0.1 + Math.floor(i / 3) * 0.1]} material={mat('#f5c542', { r: 0.25, m: 0.9 })}><cylinderGeometry args={[0.06, 0.06, 0.015, 16]} /></mesh>)}
    </Stage>
  );
};
export const L31Discount: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L31_discount');
  const talks = [k.w(383), k.w(386), k.w(387)];
  const disc = k.w(390) - 2;
  let n = 0; talks.forEach((t) => { if (f >= t) n++; });
  const c = camK(f, [{ f: 0, p: [0.3, 1.7, 1.6], l: [-0.6, 1.6, -1.2], fov: 40 }, { f: k.dur, p: [0.2, 1.7, 1.2], l: [-0.6, 1.7, -1.2], fov: 36 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={8} noSky />
      <Cam {...c} />
      <group position={[0, 0, -2]}><Room w={10} d={10} h={3.6} wall="#eef1f4" floor="tile" ceilingLights={3} light={1.2} /></group>
      <Counter f={f} screen={f >= disc ? 'СКИДКА\n-30%' : 'К ОПЛАТЕ:\n30 МОНЕТ'} />
      <Person look={randomLook(302, { shirt: '#c0392b', hairStyle: 'bun' })} pos={[-1.0, 0, -1.2]} rotY={Math.PI / 2 + 0.5} pose={merge(idle(f, 2), f >= disc ? EXPR.grin : EXPR.happy)} />
      {n > 0 && <Label text={['Привет!', 'Привет!!', 'ПРИВЕТ!!!'][n - 1]} pos={[-1.0, 2.35, -1.1]} h={0.14 * pop(f, talks[n - 1], 6)} bg="rgba(255,255,255,0.95)" fg="#222" />}
      {f >= disc && <Label text="-30%" pos={[-0.3, 2.05, -0.6]} h={0.4 * pop(f, disc, 8)} bg="#d63031" fg="#ffffff" />}
    </Stage>
  );
};
export const L32Garages: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L32_garages');
  const w = walkPath(f, [-5, 6], [4.6, 4.2], 1.6, 0);
  const c = camK(f, [{ f: 0, p: [-2, 2.4, 13], l: [1, 1.4, 2], fov: 44 }, { f: k.dur, p: [1, 2.2, 12], l: [4, 1.4, 2], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 0]} size={16} />
      <Cam {...c} />
      <Grass />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5]} receiveShadow material={mat('#8a8f96', { r: 0.95 })}><planeGeometry args={[30, 5]} /></mesh>
      <Garages n={5} pos={[0, 0, 0]} />
      <mesh position={[8.2, 1.0, 0]} rotation={[0, -Math.PI / 2, 0]} material={basic('#ffe9a8')}><planeGeometry args={[0.9, 1.9]} /></mesh>
      <Glow pos={[8.3, 1.0, 0]} s={3 * (0.7 + 0.3 * Math.sin(f * 0.2))} color="#ffd23f" o={0.6} />
      <Person look={HERO()} pos={[w.pos[0], 0, w.pos[2]]} rotY={w.rotY} pose={merge(w.pose, EXPR.shock)} />
    </Stage>
  );
};
const SecretRoom: React.FC<{ f: number; lit?: number }> = ({ f, lit = 1 }) => {
  const nameTex = canvasTex('secretname', 1024, 384, (g, w, h) => {
    g.fillStyle = '#3a2f2a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,240,200,0.9)'; g.font = '700 64px Montserrat'; g.textAlign = 'center';
    g.fillText('ЗДЕСЬ БЫЛ', w / 2, 120);
    g.fillStyle = '#111'; g.fillRect(170, 170, 680, 110);
    g.fillStyle = 'rgba(255,240,200,0.5)'; g.font = '700 40px Montserrat'; g.fillText('v 0.9 · build 1979', w / 2, 340);
  });
  return (
    <group>
      <group position={[0, 0, -1]}><Room w={4} d={4} h={2.6} wall="#4a3d36" floor="dark" light={0.25 * lit} /></group>
      <mesh position={[0, 1.6, -2.98]} material={useMemo(() => new THREE.MeshBasicMaterial({ map: nameTex, toneMapped: false }), [nameTex])}><planeGeometry args={[2.4, 0.9]} /></mesh>
      <pointLight position={[0, 2.3, -1.2]} intensity={6 * lit + Math.sin(f * 0.7) * 0.6} distance={5} color="#ffcf87" />
      <mesh position={[0, 2.45, -1.2]} material={basic('#ffe2a8')}><sphereGeometry args={[0.06, 10, 8]} /></mesh>
      <Glow pos={[0, 2.45, -1.2]} s={1.2} color="#ffcf87" o={0.7} />
    </group>
  );
};
export const L33Room: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L33_room');
  const c = camK(f, [{ f: 0, p: [0.8, 1.6, 1.2], l: [0, 1.5, -2.5], fov: 44 }, { f: k.dur, p: [0.3, 1.6, -0.2], l: [0, 1.6, -3], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.1, hemiI: 0.15, env: 0.1 }} center={[0, 1, -1]} size={4} noSky />
      <Cam {...c} />
      <SecretRoom f={f} />
      <Person look={HERO()} pos={[-0.6, 0, -0.6]} rotY={Math.PI - 0.3} pose={merge(idle(f, 2), EXPR.shock, { head: [-0.1, 0, 0] })} />
    </Stage>
  );
};
/** fact: one of the first famous easter eggs (1979) — a generic retro TV with a pixel maze and a secret room */
export const L34Egg: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L34_egg');
  const cut = k.w(428) - 2;
  const scr = useScreen(320, 240, 'crt' + Math.floor(f / 3) + (f >= cut ? 'r' : ''), (g, w, h) => {
    g.fillStyle = '#101820'; g.fillRect(0, 0, w, h);
    const cell = 16;
    const r = rng(3);
    for (let y = 0; y < h / cell; y++) for (let x = 0; x < w / cell; x++) if (r() < 0.32 && !(x > 8 && x < 12 && y > 5 && y < 9)) { g.fillStyle = '#d4a52a'; g.fillRect(x * cell, y * cell, cell, cell); }
    const px = 4 + (Math.floor(f / 6) % 8), py = 7;
    g.fillStyle = '#e74c3c'; g.fillRect(px * cell, py * cell, cell, cell);
    if (f >= cut) { g.fillStyle = '#ffffff'; g.fillRect(9 * cell, 6 * cell, cell * 3, cell * 3); g.fillStyle = '#000'; g.font = '700 12px Montserrat'; g.fillText('SECRET', 9 * cell + 2, 7.4 * cell); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  });
  scr.magFilter = THREE.NearestFilter; scr.minFilter = THREE.NearestFilter;
  const c = f < cut
    ? camK(f, [{ f: 0, p: [1.6, 1.4, 2.6], l: [0, 1.0, 0], fov: 40 }, { f: cut, p: [0.6, 1.2, 1.6], l: [0, 1.0, 0], fov: 38 }], (t) => t)
    : camK(f - cut, [{ f: 0, p: [0.0, 1.05, 0.85], l: [0, 1.0, 0], fov: 34 }, { f: k.dur - cut, p: [0.0, 1.03, 0.62], l: [0, 1.0, 0], fov: 32 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.5, hemiI: 0.45, env: 0.3, hor: '#3b2f2a' }} center={[0, 1, 0]} size={4} noSky />
      <Cam {...c} />
      <group position={[0, 0, -1]}><Room w={6} d={6} h={3} wall="#6b4f3a" floor="wood" light={0.6} /></group>
      <mesh geometry={rbox(1.6, 0.6, 0.8, 0.04)} position={[0, 0.3, -0.2]} material={mat('#7b5537', { r: 0.7 })} castShadow receiveShadow />
      <group position={[0, 1.0, -0.2]}>
        <mesh geometry={rbox(0.95, 0.75, 0.7, 0.08)} material={mat('#3a3a3a', { r: 0.5 })} castShadow />
        <Screen tex={scr} w={0.68} h={0.51} pos={[-0.08, 0.02, 0.352]} frame="#222" depth={0.02} />
        {[0.3, 0.38].map((x, i) => <mesh key={i} position={[x, -0.1 + i * 0.12, 0.36]} rotation={[Math.PI / 2, 0, 0]} material={mat('#999', { r: 0.4, m: 0.6 })}><cylinderGeometry args={[0.03, 0.03, 0.03, 12]} /></mesh>)}
      </group>
      <Glow pos={[0, 1.0, 0.2]} s={1.4} color="#ffd36b" o={0.25} />
    </Stage>
  );
};
export const L35Name: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L35_name');
  const c = camK(f, [{ f: 0, p: [0.0, 1.6, 0.4], l: [0, 1.6, -3], fov: 40 }, { f: k.dur, p: [0.0, 1.55, -1.7], l: [0, 1.5, -3], fov: 36 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.1, hemiI: 0.12, env: 0.1 }} center={[0, 1, -1]} size={4} noSky />
      <Cam {...c} />
      <SecretRoom f={f} lit={0.7 + 0.3 * (Math.floor(f / 7) % 2)} />
    </Stage>
  );
};
export { Grass };
