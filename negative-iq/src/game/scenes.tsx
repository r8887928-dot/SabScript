import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic, spr, textTex, radialTex, canvasTex, Blob, Q } from '../three/core';
import { City, C } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walkPath, walk, run, Crowd, Agent, Pose } from '../three/person';
import { Car, CAR_COLORS } from '../three/vehicles';
import { QMark, Glow, Room, Shelf, rbox, Bin, Lamp, Birds, Smoke, Stars } from '../three/props';
import { Earth, StarField } from '../three/earth';
import { Traffic } from '../scenes/Morning';
import { ShopFront } from '../scenes/Ten';
import { Classroom, StuckCars } from '../scenes/Hour';
import { Headset } from '../AvatarNiches';
import { shotClock, W, H } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, easeIn, smoother, kick, clamp, pop, wobble, backOut } from '../lib/anim';

const HERO = () => randomLook(3, { skin: '#f0c4a0', hair: '#3a2416', hairStyle: 'short', shirt: '#3f88c5' });
const MOM = () => randomLook(901, { skin: '#f2c7a5', hair: '#7a3b22', hairStyle: 'bun', shirt: '#e86f8a', skirt: true, pants: '#6a4c93' });
const DAY = { ...LOOKS.day, top: '#4a86d6', hor: '#c8d8ee' };

// ------------------------------------------------------------------ small helpers
/** camera-facing text label (sprite) */
const Label: React.FC<{ text: string; pos: number[]; h?: number; bg?: string; fg?: string; s?: number; w?: number }> = ({ text, pos, h = 0.22, bg = 'rgba(10,14,30,0.85)', fg = '#ffffff', s = 1, w }) => {
  const lines = text.split('\n');
  const longest = Math.max(...lines.map((l) => l.length));
  const pxW = Math.max(256, Math.min(1400, longest * 58 + 90)), pxH = 120 * lines.length + 20;
  const tex = textTex(text, { w: pxW, h: pxH, bg, fg, radius: 40, size: 84 });
  const aspect = pxW / pxH;
  const hh = h * lines.length * s;
  return <sprite position={pos as any} scale={[(w ?? hh * aspect), hh, 1]} material={spr('#ffffff', { map: tex })} />;
};
const Exclaim: React.FC<{ pos: number[]; s?: number; color?: string }> = ({ pos, s = 1, color = '#ffd23f' }) => (
  <group position={pos as any} scale={[s, s, s]}>
    <mesh position={[0, 0.12, 0]} material={mat(color, { r: 0.3, e: color, ei: 0.35 })}><capsuleGeometry args={[0.06, 0.2, 6, 12]} /></mesh>
    <mesh position={[0, -0.14, 0]} material={mat(color, { r: 0.3, e: color, ei: 0.35 })}><sphereGeometry args={[0.065, 14, 10]} /></mesh>
    <sprite scale={[0.9, 0.9, 1]} material={spr(color, { map: radialTex('glow'), add: true, t: 0.45 })} />
  </group>
);
/** floating health bar (sprite) */
const HPBar: React.FC<{ pos: number[]; hp?: number; s?: number }> = ({ pos, hp = 1, s = 1 }) => {
  const tex = canvasTex('hpbar' + Math.round(hp * 10), 640, 160, (g, w, h) => {
    g.fillStyle = 'rgba(8,12,24,0.85)'; (g as any).roundRect(4, 20, w - 8, h - 40, 30); g.fill();
    g.fillStyle = '#ff2a4a'; g.beginPath(); g.moveTo(80, 128); g.bezierCurveTo(20, 90, 20, 40, 60, 40); g.bezierCurveTo(78, 40, 80, 55, 80, 60); g.bezierCurveTo(80, 55, 82, 40, 100, 40); g.bezierCurveTo(140, 40, 140, 90, 80, 128); g.fill();
    for (let i = 0; i < 5; i++) { g.fillStyle = i < Math.round(hp * 5) ? '#3cff6e' : '#24402c'; (g as any).roundRect(160 + i * 92, 48, 80, 64, 12); g.fill(); }
  });
  return <sprite position={pos as any} scale={[1.0 * s, 0.25 * s, 1]} material={spr('#ffffff', { map: tex })} />;
};
const Wire: React.FC<{ on: boolean; color?: string }> = ({ on, color = '#2ef2ff' }) => {
  const { scene } = useThree();
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.85, fog: false }), [color]);
  scene.overrideMaterial = on ? m : null;
  return null;
};

/** bedroom set (bed along -z, window behind) */
const Bedroom: React.FC = () => (
  <group>
    <group position={[0, 0, -1]}><Room w={6} d={6} h={3} wall="#cfe0ef" floor="wood" windows="back" light={0.8} /></group>
    <pointLight position={[-1.5, 2.2, -2.5]} intensity={18} distance={8} color="#ffd9a8" />
    <group position={[-0.9, 0, -0.9]}>
      <mesh position={[0, 0.25, 0]} material={mat('#7b5537', { r: 0.8 })} castShadow receiveShadow><boxGeometry args={[1.6, 0.5, 2.2]} /></mesh>
      <mesh geometry={rbox(1.5, 0.22, 2.1, 0.08)} position={[0, 0.6, 0]} material={mat('#f4f1ea', { r: 0.9 })} castShadow receiveShadow />
      <mesh geometry={rbox(0.7, 0.16, 0.42, 0.08)} position={[0, 0.78, -0.8]} material={mat('#ffffff', { r: 0.9 })} castShadow />
      <mesh position={[0, 0.9, -1.12]} material={mat('#7b5537', { r: 0.8 })} castShadow><boxGeometry args={[1.6, 1.0, 0.08]} /></mesh>
    </group>
    <group position={[0.45, 0, -1.6]}>
      <mesh geometry={rbox(0.6, 0.6, 0.5, 0.04)} position={[0, 0.3, 0]} material={mat('#c99a6b', { r: 0.7 })} castShadow receiveShadow />
      <mesh position={[0, 0.75, 0]} material={mat('#f0e6d0', { r: 0.6 })}><cylinderGeometry args={[0.08, 0.12, 0.25, 16]} /></mesh>
    </group>
  </group>
);
/** hero lying in bed: person rotated onto its back; blanket over the body */
const LyingHero: React.FC<{ pose: Pose }> = ({ pose }) => (
  <group position={[-0.9, 0.72, -1.55]} rotation={[-Math.PI / 2, 0, 0]}>
    <Person look={HERO()} blob={false} pos={[0, -1.47, 0]} pose={merge({ armL: [0, 0.15, 0], armR: [0, 0.15, 0] }, pose)} />
  </group>
);
const Blanket: React.FC = () => <mesh geometry={rbox(1.56, 0.18, 1.45, 0.08)} position={[-0.9, 0.86, -0.38]} material={mat('#5a8fd6', { r: 0.9 })} castShadow receiveShadow />;

// ------------------------------------------------------------------ HOOK
export const GH1Wake: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gh1_wake');
  const open = k.w(5) - 1;
  const c = camK(f, [{ f: 0, p: [-0.75, 1.95, -1.25], l: [-0.9, 0.9, -1.72], fov: 34, roll: 8 }, { f: k.dur, p: [-0.82, 1.62, -1.42], l: [-0.9, 0.9, -1.72], fov: 34, roll: 2 }], (t) => t);
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
export const GH2World: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gh2_world');
  const c = camK(f, [{ f: 0, p: [10, 14, 40], l: [0, 8, -20], fov: 44 }, { f: k.dur, p: [30, 70, 110], l: [0, 0, -10], fov: 46 }]);
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
/** the world pixelates — rendered at shrinking resolution, upscaled with hard pixels */
export const GH3Pixel: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gh3_pixel');
  const steps = [0.66, 0.66, 0.3, 0.15, 0.08, 0.05];
  const p = steps[Math.min(steps.length - 1, Math.floor((f / k.dur) * steps.length * 1.3))];
  const w = Math.max(16, Math.round(W * p)), h = Math.max(28, Math.round(H * p));
  const c = camK(f, [{ f: 0, p: [30, 70, 110], l: [0, 0, -10], fov: 46 }, { f: k.dur, p: [36, 82, 124], l: [0, 0, -10], fov: 46 }]);
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
/** title / loading backgrounds: synthwave + blurred city */
export const TitleBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#140033' }}>
      <div style={{ position: 'absolute', inset: -80, backgroundImage: synth(), backgroundSize: 'cover', transform: `scale(${1 + f * 0.0015})` }} />
    </div>
  );
};
function synth() {
  const hz = 1180;
  let grid = '';
  for (let i = -14; i <= 14; i++) grid += `<line x1='${540 + i * 30}' y1='${hz}' x2='${540 + i * 240}' y2='1920' stroke='#ff3df2' stroke-width='3' opacity='0.8'/>`;
  for (let k = 0; k < 10; k++) { const y = hz + Math.pow(k / 9, 1.8) * (1920 - hz); grid += `<line x1='0' y1='${y}' x2='1080' y2='${y}' stroke='#ff3df2' stroke-width='${2 + k * 0.5}' opacity='0.85'/>`; }
  let cuts = '';
  for (let k = 0; k < 6; k++) cuts += `<rect x='240' y='${hz - 170 + k * 28}' width='600' height='${4 + k * 3}' fill='#3d0a78'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920' viewBox='0 0 1080 1920'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0b0020'/><stop offset='0.5' stop-color='#3d0a78'/><stop offset='0.62' stop-color='#ff4fb3'/></linearGradient><linearGradient id='u' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffe259'/><stop offset='1' stop-color='#ff2f8e'/></linearGradient></defs><rect width='1080' height='1920' fill='url(#s)'/><circle cx='540' cy='${hz - 60}' r='300' fill='url(#u)'/>${cuts}<rect y='${hz}' width='1080' height='${1920 - hz}' fill='#12002b'/>${grid}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}
export const LoadingBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(10px) brightness(0.55) saturate(1.2)', transform: 'scale(1.08)' }}>
        <Stage>
          <Lights look={LOOKS.morning} center={[0, 0, 0]} size={100} shadow={false} frame={f} />
          <Cam pos={[Math.sin(f * 0.004) * 140, 90, Math.cos(f * 0.004) * 140]} look={[0, 0, 0]} fov={46} />
          <City seed={7} near={3} far={7} />
        </Stage>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ MORNING
export const GM1Bed: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gm1_bed');
  const open = k.w(17);
  const c = camK(f, [{ f: 0, p: [0.5, 2.4, 0.9], l: [-0.9, 0.85, -1.55], fov: 40 }, { f: k.dur, p: [0.1, 2.1, 0.2], l: [-0.9, 0.9, -1.65], fov: 38 }], (t) => t);
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
export const GM2HPBar: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gm2_hpbar');
  const appear = k.w(23) - 2;
  const sit = ramp(f, 0, 14);
  const bar = pop(f, appear, 9);
  const c = camK(f, [{ f: 0, p: [0.9, 1.5, 1.6], l: [-0.85, 1.3, -1.0], fov: 42 }, { f: k.dur, p: [0.7, 1.6, 1.3], l: [-0.85, 1.55, -1.0], fov: 40 }], (t) => t);
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
export const GM3Level: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gm3_level');
  const c = camK(f, [{ f: 0, p: [0.1, 1.62, 1.1], l: [-0.1, 1.55, 0], fov: 36 }, { f: k.dur, p: [0.0, 1.6, 0.85], l: [-0.1, 1.58, 0], fov: 34 }], (t) => t);
  const look = k.w(25);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={4} noSky />
      <Cam {...c} />
      <group position={[0, 0, -2]}><Room w={6} d={6} h={3} wall="#cfe0ef" floor="wood" windows="back" light={0.8} /></group>
      <Person look={HERO()} pose={merge(f > look ? EXPR.shock : EXPR.neutral, { head: [f > look ? -0.2 : 0, f > look ? 0.35 : 0, 0], eyeA: f > look ? [-0.022, 0.024] : [0, 0], eyeB: f > look ? [-0.022, 0.024] : [0, 0] })} />
      <HPBar pos={[0, 2.25, 0]} s={0.6} />
    </Stage>
  );
};

// ------------------------------------------------------------------ KITCHEN
const Fridge: React.FC<{ glow: number; f: number; pos: number[] }> = ({ glow, f, pos }) => {
  const body = rbox(0.8, 1.9, 0.7, 0.06);
  const gm = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  gm.opacity = glow * (0.55 + 0.35 * Math.sin(f * 0.35));
  return (
    <group position={pos as any}>
      <mesh geometry={body} position={[0, 0.95, 0]} material={mat('#eef1f4', { r: 0.3, m: 0.15 })} castShadow receiveShadow />
      <mesh position={[0, 1.3, 0.352]} material={mat('#c9ced6', { r: 0.4 })}><boxGeometry args={[0.78, 0.015, 0.01]} /></mesh>
      <mesh position={[0.3, 1.55, 0.37]} material={mat('#9aa3ad', { r: 0.2, m: 0.8 })}><boxGeometry args={[0.03, 0.3, 0.04]} /></mesh>
      <mesh position={[0.3, 0.95, 0.37]} material={mat('#9aa3ad', { r: 0.2, m: 0.8 })}><boxGeometry args={[0.03, 0.4, 0.04]} /></mesh>
      {glow > 0 && <mesh geometry={body} position={[0, 0.95, 0]} scale={[1.06, 1.03, 1.08]} material={gm} />}
      {glow > 0 && <sprite position={[0, 1.0, 0.4]} scale={[2.4 * glow, 3.2 * glow, 1]} material={spr('#ffd23f', { map: radialTex('glow'), add: true, t: 0.35 })} />}
    </group>
  );
};
const Kitchen: React.FC<{ f: number; glow?: number }> = ({ f, glow = 0 }) => (
  <group>
    <group position={[0, 0, -1]}><Room w={7} d={7} h={3} wall="#f3e6cf" floor="tile" windows="back" light={1.0} /></group>
    <mesh geometry={rbox(3.6, 0.9, 0.6, 0.02)} position={[-1.0, 0.45, -4.15]} material={mat('#8fb8a8', { r: 0.6 })} castShadow receiveShadow />
    <mesh position={[-1.0, 0.92, -4.15]} material={mat('#e8e2d6', { r: 0.4 })}><boxGeometry args={[3.7, 0.05, 0.65]} /></mesh>
    <mesh position={[-1.6, 0.951, -4.12]} material={mat('#222', { r: 0.4 })}><boxGeometry args={[0.6, 0.01, 0.5]} /></mesh>
    <mesh geometry={rbox(3.6, 0.7, 0.35, 0.02)} position={[-1.0, 2.15, -4.28]} material={mat('#8fb8a8', { r: 0.6 })} castShadow />
    <Fridge glow={glow} f={f} pos={[1.6, 0, -4.05]} />
    <mesh position={[0.2, 0.75, -1.3]} material={mat('#c99a6b', { r: 0.6 })} castShadow receiveShadow><boxGeometry args={[1.4, 0.06, 0.9]} /></mesh>
    {[[-0.45, -1.65], [0.85, -1.65], [-0.45, -0.95], [0.85, -0.95]].map(([x, z], i) => <mesh key={i} position={[x, 0.37, z]} material={mat('#8b5a3c', { r: 0.7 })}><boxGeometry args={[0.06, 0.74, 0.06]} /></mesh>)}
  </group>
);
export const GA1Fridge: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('ga1_fridge');
  const glowOn = k.w(39) - 2, prompt = k.w(44) - 2;
  const w = walkPath(f, [-1.8, 0.4], [1.0, -2.8], 1.0, 0);
  const glow = ramp(f, glowOn, glowOn + 6);
  const c = camK(f, [{ f: 0, p: [-0.4, 1.75, 2.6], l: [0.2, 1.2, -2.6], fov: 46 }, { f: k.dur, p: [0.4, 1.7, 1.2], l: [1.3, 1.2, -3.6], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam {...c} />
      <Kitchen f={f} glow={glow} />
      <Person look={HERO()} pos={[w.pos[0], 0, w.pos[2]]} rotY={w.done ? 2.6 : w.rotY} pose={merge(idle(f, 2), w.pose, f > glowOn ? { ...EXPR.shock, head: [0, w.done ? 0.3 : 0.5, 0] } : EXPR.neutral)} />
      {f >= prompt && <Label text="[E]  ВЗЯТЬ" pos={[1.6, 2.25 + Math.sin(f * 0.2) * 0.02, -3.7]} h={0.22 * pop(f, prompt, 7)} bg="rgba(10,14,30,0.85)" fg="#ffd23f" />}
    </Stage>
  );
};
const BUBBLE = 'Доброе утро, солнышко!';
export const GA2Mom: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('ga2_mom');
  const says = [k.w(46) - 3, k.w(53) - 3, k.w(55) - 3];
  let last = -1; for (const s of says) if (f >= s) last = s;
  const loopF = last >= 0 ? f - last : 0; // identical animation on every repeat
  const gesture = last >= 0 && loopF < 24 ? Math.sin((loopF / 24) * Math.PI) : 0;
  const c = camK(f, [{ f: 0, p: [0.9, 1.6, 2.2], l: [-0.6, 1.45, -2.8], fov: 40 }, { f: k.dur, p: [0.5, 1.6, 1.4], l: [-0.6, 1.5, -2.8], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam {...c} />
      <Kitchen f={f} />
      <Person look={MOM()} pos={[-0.6, 0, -3.2]} rotY={0.25} pose={merge(EXPR.happy, { armR: [0.6 + gesture * 1.6, 0.4, 0.5 + gesture * 0.6], head: [0, 0.15 * gesture, 0.12 * gesture], blink: loopF > 30 && loopF < 34 ? 1 : 0 })}
        propL={<mesh rotation={[0.3, 0, 0]} position={[0, -0.05, 0.05]} material={mat('#c0c4cc', { r: 0.3, m: 0.7 })}><cylinderGeometry args={[0.03, 0.05, 0.25, 8]} /></mesh>} />
      <mesh position={[-0.6, 0.85, -3.02]} rotation={[0, 0.25, 0]} material={mat('#ffffff', { r: 0.8 })}><boxGeometry args={[0.36, 0.5, 0.02]} /></mesh>
      <Person look={HERO()} pos={[0.6, 0, -1.4]} rotY={-2.3} pose={merge(idle(f, 4), EXPR.confused, { head: [0, 0, 0.1] })} />
      {last >= 0 && <Label text={BUBBLE} pos={[-0.55, 2.35, -3.0]} h={0.17 * pop(f, last, 6)} bg="rgba(255,255,255,0.95)" fg="#222" />}
    </Stage>
  );
};
export const GA3NPC: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('ga3_npc');
  const tag = k.w(60) - 2;
  const c = camK(f, [{ f: 0, p: [-0.1, 1.95, -0.6], l: [-0.6, 2.0, -3.2], fov: 38 }, { f: k.dur, p: [-0.2, 1.95, -0.95], l: [-0.6, 2.05, -3.2], fov: 36 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam {...c} />
      <Kitchen f={f} />
      <Person look={MOM()} pos={[-0.6, 0, -3.2]} rotY={0.25} pose={merge(EXPR.happy, { blink: (f % 40) < 4 ? 1 : 0, head: [0, 0, 0] })} />
      <Exclaim pos={[-0.6, 2.62 + Math.sin(f * 0.18) * 0.03, -3.2]} s={0.8} />
      {f >= tag && <Label text={'МАМА   [NPC]'} pos={[-0.6, 2.25, -3.15]} h={0.13 * pop(f, tag, 7)} bg="rgba(20,120,60,0.9)" fg="#ffffff" />}
    </Stage>
  );
};

// ------------------------------------------------------------------ HOUR
export const GB1Loops: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gb1_loops');
  const clone = useMemo(() => randomLook(950, { shirt: '#9aa0a8', pants: '#4a4e69', hairStyle: 'short', hair: '#151515' }), []);
  const R = 6, cx = -28, cz = -22;
  const dots = useMemo(() => Array.from({ length: 48 }).map((_, i) => [cx + Math.cos((i / 48) * 6.283) * R, cz + Math.sin((i / 48) * 6.283) * R]), []);
  const c = camK(f, [{ f: 0, p: [-22, 9, -6], l: [-28, 0.8, -22], fov: 44 }, { f: k.dur, p: [-20, 11, -8], l: [-28, 0.6, -22], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[-28, 0, -22]} size={16} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      {dots.map(([x, z], i) => <mesh key={i} position={[x, 0.18, z]} rotation={[-Math.PI / 2, 0, 0]} material={basic('#ffd23f', { t: 0.75 })}><circleGeometry args={[0.12, 10]} /></mesh>)}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (f / 30) * (1.25 / R) + (i / 8) * Math.PI * 2;
        const x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R;
        return <Person key={i} look={clone} pos={[x, 0.16, z]} rotY={Math.atan2(-Math.sin(a), Math.cos(a))} pose={merge(walk((f / 30) * 1.25 / 0.72 * Math.PI, 1), EXPR.neutral)} />;
      })}
    </Stage>
  );
};
export const GB2Cars: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gb2_cars');
  const j = (s: number) => (Math.sin(f * 3.7 + s) * 0.03);
  const c = camK(f, [{ f: 0, p: [3.5, 1.6, 9], l: [11, 1.5, -2], fov: 44 }, { f: k.dur, p: [4.3, 1.7, 7.5], l: [11, 1.6, -2], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[10, 0, 0]} size={18} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Car kind="sedan" color="#d63031" pos={[13.6 + j(1), 0.16, -3 + j(2)]} rotY={Math.PI / 2 + 0.15} tilt={[0, j(3)]} />
      <Car kind="taxi" color="#f1c40f" pos={[5.2, -0.45 + j(4), -9]} rotY={0.4} tilt={[0.12, 0.05]} />
      <Car kind="van" color="#2e86de" pos={[9.6 + j(5), 1.2, -15]} rotY={Math.PI / 2} tilt={[0, Math.PI / 2 - 0.2]} />
      {f % 8 < 4 && <Glow pos={[13.0, 1.0, -3]} s={2.0} color="#ff2bd6" o={0.5} />}
    </Stage>
  );
};
export const GB3LOD: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gb3_lod');
  const texT = k.w(86);
  const R = f < texT ? -10 : (f - texT) * 4;
  const c = camK(f, [{ f: 0, p: [-9.4, 1.7, -14], l: [30, 20, -70], fov: 50 }, { f: k.dur, p: [-9.2, 1.7, -16], l: [30, 22, -70], fov: 48 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[10, 0, -10]} size={40} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} load={[-9, -20, R]} />
      <Person look={HERO()} pos={[-8.4, 0.16, -21.2]} rotY={1.9} pose={merge(idle(f, 2), EXPR.shock, { head: [-0.3, 0, 0] })} />
    </Stage>
  );
};
export const GB4Teeth: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gb4_teeth');
  const brush = Math.sin(f * 0.9) * 0.06;
  const xp = k.w(97);
  const c = camK(f, [{ f: 0, p: [1.05, 1.62, -2.3], l: [0, 1.45, -1.3], fov: 50 }, { f: k.dur, p: [0.95, 1.62, -2.32], l: [0, 1.5, -1.3], fov: 48 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={5} noSky />
      <Cam {...c} />
      <group position={[0, 0, -0.5]}><Room w={4} d={4} h={2.8} wall="#cfe9f2" floor="tile" ceilingLights={1} /></group>
      <mesh position={[0, 1.4, 1.48]} rotation={[0, Math.PI, 0]} material={mat('#cfe9f2', { r: 0.9 })}><planeGeometry args={[4, 2.8]} /></mesh>
      <mesh position={[0.6, 1.1, 1.46]} rotation={[0, Math.PI, 0]} material={mat('#b9d6e3', { r: 0.8 })}><boxGeometry args={[0.9, 2.1, 0.04]} /></mesh>
      <mesh geometry={rbox(1.0, 0.85, 0.5, 0.03)} position={[0, 0.42, -2.2]} material={mat('#ffffff', { r: 0.3 })} castShadow receiveShadow />
      <mesh position={[0, 0.86, -2.15]} material={mat('#dfe6e9', { r: 0.15, m: 0.2 })}><cylinderGeometry args={[0.3, 0.22, 0.08, 24]} /></mesh>
      <mesh position={[0, 1.75, -2.46]} material={mat('#bcd6e6', { r: 0.05, m: 0.6 })}><planeGeometry args={[0.9, 1.0]} /></mesh>
      <mesh position={[0, 1.75, -2.47]} material={mat('#ffffff', { r: 0.4 })}><boxGeometry args={[1.0, 1.1, 0.02]} /></mesh>
      <Person look={HERO()} pos={[0, 0, -1.4]} rotY={Math.PI} pose={merge(idle(f, 3), f > xp ? EXPR.grin : EXPR.neutral, { armR: [1.25, -0.35, 2.05 + brush * 2] })}
        propR={<group rotation={[0, 0, Math.PI / 2]}><mesh material={mat('#2e86de', { r: 0.4 })} position={[0, 0.08, 0]}><boxGeometry args={[0.02, 0.2, 0.015]} /></mesh><mesh material={mat('#ffffff', { r: 0.9 })} position={[0, 0.19, 0.012]}><boxGeometry args={[0.025, 0.04, 0.02]} /></mesh></group>} />
      
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 1
export const GC1Quests: React.FC = () => {
  const f = useCurrentFrame();
  const c = camK(f, [{ f: 0, p: [8.5, 1.7, 9], l: [11, 2.2, -6], fov: 46 }, { f: 47, p: [8.6, 1.8, 7.4], l: [11, 2.4, -6], fov: 44 }], (t) => t);
  const ppl = [[10.3, -2], [11.2, -6], [9.4, -9]];
  return (
    <Stage>
      <Lights look={DAY} center={[10, 0, -4]} size={16} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      {ppl.map(([x, z], i) => (
        <group key={i}>
          <Person look={randomLook(960 + i)} pos={[x, 0.16, z]} rotY={-0.6} pose={merge(idle(f, i), EXPR.happy)} />
          <Exclaim pos={[x, 2.55 + Math.sin(f * 0.2 + i) * 0.04, z]} s={0.75 * pop(f, i * 5, 8)} />
        </group>
      ))}
      <Person look={HERO()} pos={[9.2, 0.16, 4.5]} rotY={Math.PI - 0.2} pose={merge(idle(f, 9), EXPR.shock)} />
    </Stage>
  );
};
export const GC2Bread: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gc2_bread');
  const coinsAt = k.w(108) - 2;
  const w = walkPath(f + 8, [0, 0.5], [0.4, 2.6], 0.9, 0);
  const coins = useMemo(() => { const r = rng(4); return Array.from({ length: 14 }).map(() => [r() * 6.28, 1.5 + r() * 2.5, r() * 6]); }, []);
  const c = camK(f, [{ f: 0, p: [2.2, 1.7, 4.8], l: [0, 1.3, 0.8], fov: 44 }, { f: k.dur, p: [1.8, 1.7, 4.2], l: [0.2, 1.4, 1.4], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 1, 0]} size={8} />
      <Cam {...c} />
      <group position={[0, 0, -30]}><City seed={7} near={2} far={5} /></group>
      <ShopFront rattle={0} sign="ПЕКАРНЯ" signColor="#d68910" />
      <Person look={HERO()} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, 2), w.pose, EXPR.grin, { armR: [1.0, 0.1, 1.2] })}
        propR={<group rotation={[0.2, 0, 1.2]}><mesh material={mat('#d9a066', { r: 0.7 })}><capsuleGeometry args={[0.05, 0.42, 6, 12]} /></mesh></group>} />
      {f >= coinsAt && coins.map(([a, v, s], i) => {
        const t = (f - coinsAt) / 30;
        const x = w.pos[0] + Math.cos(a) * t * v * 0.5, y = 1.8 + t * v - 4.9 * t * t, z = w.pos[2] + Math.sin(a) * t * v * 0.5;
        return y > 0.1 ? <mesh key={i} position={[x, y, z]} rotation={[f * 0.3 + s, s, 0]} material={mat('#f5c542', { r: 0.25, m: 0.9 })} castShadow><cylinderGeometry args={[0.08, 0.08, 0.018, 20]} /></mesh> : null;
      })}
    </Stage>
  );
};
export const GC3Boss: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gc3_boss');
  const grow = ramp(f, k.w(113), k.w(113) + 14);
  const teacher = useMemo(() => randomLook(340, { glasses: true, hairStyle: 'bun', hair: '#6b6b6b', shirt: '#7d4fb3', skirt: true }), []);
  const c = camK(f, [{ f: 0, p: [2.0, 1.2, 1.4], l: [-0.2, 2.2, -4.6], fov: 50 }, { f: k.w(113), p: [1.9, 1.15, 1.2], l: [-0.2, 2.5, -4.6], fov: 50 }, { f: k.dur, p: [1.7, 1.1, 0.9], l: [-0.2, 3.1, -4.6], fov: 52, roll: -3 }]);
  const sc = 1 + grow * 0.7;
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, hemiI: 0.6 }} center={[0, 1, -3]} size={8} noSky />
      <Cam {...c} />
      <Classroom f={f} qFrom={1e9} />
      <group position={[0, 0, -4.7]} scale={[sc, sc, sc]}>
        <Person look={teacher} pose={merge(idle(f, 9), grow > 0.5 ? { ...EXPR.dumb2, mouth: 'O', brows: [-0.45, 0.45, 0] } : EXPR.neutral, { armL: [0.4 + grow, 0.7 * grow, 0.3], armR: [0.4 + grow, 0.7 * grow, 0.3] })} />
      </group>
      {grow > 0 && <Glow pos={[0, 1.6 * sc, -4.9]} s={4 * grow} color="#ff2a3a" o={0.55} />}
      {grow > 0 && <pointLight position={[0, 1.5, -3.6]} intensity={20 * grow} distance={6} color="#ff3030" />}
      <Person look={HERO()} pos={[-1.3, 0, -2.2]} rotY={Math.PI - 0.5} pose={merge(idle(f, 3), EXPR.shock)} />
    </Stage>
  );
};
export const GC4Wall: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gc4_wall');
  const hit = k.cue('wall_hit');
  const wallX = 260;
  const x = f < hit ? wallX - 2.4 - ((hit - f) / 30) * 14 : wallX - 2.4 - 1.6 * easeOut((f - hit) / 10);
  const flash = f >= hit ? Math.max(0, 1 - (f - hit) / 22) : 0;
  const hex = useMemo(() => {
    const t = canvasTex('hexwall', 512, 512, (g, w, h) => {
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
  const camX = Math.min(x, wallX - 2.4) - 7.5;
  const c = { pos: [camX, 2.3, 0.6], look: [wallX + 4, 1.3, -1.75], fov: 46 };
  return (
    <Stage>
      <Lights look={{ ...LOOKS.golden, sunAz: 250 }} center={[wallX - 8, 0, 0]} size={30} frame={f} />
      <Cam pos={[c.pos[0] + sh, c.pos[1] + sh * 0.5, c.pos[2]]} look={c.look} fov={c.fov} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#7f9a55', { r: 0.95 })}><planeGeometry args={[3000, 3000]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[100, 0.02, 0]} receiveShadow material={mat('#55585e', { r: 0.9 })}><planeGeometry args={[600, 8]} /></mesh>
      {Array.from({ length: 40 }).map((_, i) => <mesh key={i} position={[wallX - 300 + i * 9, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#f2f2ee', { r: 0.6 })}><planeGeometry args={[4, 0.18]} /></mesh>)}
      <group position={[-60, 0, -80]}><City seed={7} near={2} far={4} /></group>
      <Car kind="sedan" color="#3f88c5" pos={[x, 0, -1.75]} rotY={Math.PI / 2} dist={x} tilt={[f >= hit && f < hit + 8 ? -0.06 : 0, 0]} />
      <mesh position={[wallX, 6, 0]} rotation={[0, Math.PI / 2, 0]} material={wm}><planeGeometry args={[60, 14]} /></mesh>
      <mesh position={[wallX + 0.05, 6, 0]} rotation={[0, Math.PI / 2, 0]} material={basic('#5ef0ff', { add: true, t: 0.25 * flash, side: THREE.DoubleSide })}><planeGeometry args={[60, 14]} /></mesh>
      {flash > 0 && <Glow pos={[wallX - 0.2, 1.0, -1.75]} s={8 * flash} color="#5ef0ff" />}
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 3
export const GD1Lag: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gd1_lag');
  const tf = Math.floor(f / 7) * 7 + (f % 7 > 5 ? 3 : 0);
  const c = camK(tf, [{ f: 0, p: [6.5, 1.9, 14], l: [9, 1.6, -6], fov: 44 }, { f: k.dur, p: [6.9, 1.8, 10], l: [9.2, 1.7, -6], fov: 40 }], (t) => t);
  const ppl = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ look: randomLook(830 + i), a: [8 + (i % 3) * 1.3, -26 + i * 3.2], sp: 1.1 + (i % 4) * 0.12 })), []);
  return (
    <Stage>
      <Lights look={DAY} center={[8, 0, 0]} size={30} frame={tf} />
      <Cam {...c} />
      <City seed={7} near={3} far={7} f={tf} />
      <Traffic f={tf + 100} n={14} seed={17} axis="z" />
      {ppl.map((p, i) => { const w = walkPath(tf + 120 - i * 10, p.a, [p.a[0], p.a[1] + 60], p.sp, 0, i); return <Person key={i} look={p.look} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(tf, i), w.pose)} />; })}
    </Stage>
  );
};
export const GD2Freeze: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gd2_freeze');
  const ang = lerp(-0.6, 0.7, smoother(f / k.dur));
  const ppl = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({ look: randomLook(970 + i), x: -27 + (i % 3) * 1.6, z: -14 - i * 1.6, ph: i * 1.3 })), []);
  return (
    <Stage>
      <Lights look={DAY} center={[-25, 0, -19]} size={20} />
      <Cam pos={[-25.5 + Math.sin(ang) * 9, 2.2, -19 + Math.cos(ang) * 9]} look={[-25.5, 1.3, -19.5]} fov={44} />
      <City seed={7} near={3} far={6} />
      {ppl.map((p, i) => <Person key={i} look={p.look} pos={[p.x, 0.16, p.z]} rotY={0} pose={i === 3 ? { armL: [0, 1.57, 0], armR: [0, 1.57, 0], mouth: 'flat' } : merge(walk(p.ph, 1), EXPR.neutral)} />)}
      <Birds f={k.w(137)} center={[-25, 6, -20]} n={7} spread={8} speed={0.0} />
    </Stage>
  );
};
export const GD3Fall: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gd3_fall');
  const blink = k.w(142), fall = k.w(144) - 2;
  const t = Math.max(0, (f - fall) / 30);
  const y = 0.16 - 4.9 * t * t * 1.4;
  const camY = f < fall ? 1.7 : Math.min(1.7, y + 1.5);
  const look = HERO();
  return (
    <Stage>
      <Lights look={{ ...DAY, bot: '#5f87b8' }} center={[8.6, 0, 0]} size={30} frame={f} />
      <Cam pos={[8.6, camY + (f > fall ? 0.4 : 0), 2.6]} look={[8.6, f < fall ? 1.45 : y + 0.7, 0]} fov={f < fall ? 38 : 50} roll={f > fall ? Math.sin(f * 0.2) * 4 : 0} />
      <City seed={7} near={3} far={6} />
      <Person look={look} pos={[8.6, y, 0]} rotY={0} pose={merge(f > fall ? { ...EXPR.shock, armL: [2.6, 0.6, 0.2], armR: [2.6, 0.6, 0.2], legL: 0.3, legR: -0.3 } : EXPR.neutral, { blink: f >= blink && f < blink + 5 ? 1 : 0 })} />
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 7
const Floppy: React.FC<{ pos: number[]; s?: number; rot?: number }> = ({ pos, s = 1, rot = 0 }) => (
  <group position={pos as any} scale={[s, s, s]} rotation={[0.2, rot, 0.1]}>
    <mesh geometry={rbox(0.6, 0.6, 0.06, 0.02)} material={mat('#2d3e8f', { r: 0.4 })} castShadow />
    <mesh position={[0.05, 0.19, 0.035]} material={mat('#c9ced6', { r: 0.25, m: 0.8 })}><boxGeometry args={[0.3, 0.2, 0.01]} /></mesh>
    <mesh position={[0, -0.12, 0.034]} material={mat('#f4f4f4', { r: 0.6 })}><boxGeometry args={[0.46, 0.28, 0.01]} /></mesh>
  </group>
);
export const GE1Save: React.FC = () => {
  const f = useCurrentFrame();
  const c = camK(f, [{ f: 0, p: [0.5, 1.6, 3.4], l: [0.2, 1.45, 0], fov: 40 }, { f: 104, p: [0.3, 1.6, 2.6], l: [0.2, 1.5, 0], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 1, 0]} size={8} />
      <Cam {...c} />
      <group position={[20, -0.16, 30]}><City seed={7} near={3} far={6} /></group>
      <Person look={HERO()} pos={[0, 0, 0]} rotY={0.2} pose={merge(idle(f, 2), EXPR.grin, { armR: [0.9, 0.6, 1.3], armL: [0.1, 0.1, 0.2] })} />
      <Floppy pos={[0.85, 1.7 + Math.sin(f * 0.1) * 0.05, 0.2]} s={0.75 * pop(f, 6, 9)} rot={f * 0.05} />
      <Glow pos={[0.85, 1.7, 0.2]} s={1.6} color="#7db8ff" o={0.4} />
    </Stage>
  );
};
export const GE2Mug: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('ge2_mug');
  const load = k.cue('load1');
  const dropAt = 6;
  const fwd = Math.min(f, load) ;
  const tt = f < load ? fwd : Math.max(dropAt, load - (f - load) * 2.2);
  const t = Math.max(0, (tt - dropAt) / 30);
  const y = Math.max(0.06, 1.05 - 4.9 * t * t);
  const broken = y <= 0.07;
  const c = camK(f, [{ f: 0, p: [0.9, 1.4, 2.0], l: [0, 1.0, 0], fov: 42 }, { f: k.dur, p: [0.8, 1.35, 1.7], l: [0, 0.95, 0], fov: 40 }], (t2) => t2);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam {...c} />
      <group position={[0, 0, 2.3]}><Kitchen f={f} /></group>
      <Person look={HERO()} pos={[-0.25, 0, -0.2]} rotY={0.4} pose={merge(broken ? EXPR.shock : EXPR.happy, { armR: [tt < dropAt ? 1.0 : 0.6, 0.2, 0.6] })} />
      {broken
        ? [0, 1, 2, 3].map((i) => <mesh key={i} position={[0.15 + Math.cos(i * 1.7) * 0.15, 0.04, 0.35 + Math.sin(i * 1.7) * 0.15]} rotation={[i, i * 2, 0]} material={mat('#e74c3c', { r: 0.4 })}><boxGeometry args={[0.07, 0.03, 0.05]} /></mesh>)
        : <mesh position={[0.15, y, 0.35]} rotation={[t * 4, 0, t * 2]} material={mat('#e74c3c', { r: 0.4 })} castShadow><cylinderGeometry args={[0.06, 0.05, 0.12, 16]} /></mesh>}
    </Stage>
  );
};
export const GE3Bus: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('ge3_bus');
  const load = k.cue('load2');
  const tt = f < load ? f : Math.max(0, load - (f - load) * 2.5);
  const bx = 2 + Math.max(0, tt - 4) * Math.max(0, tt - 4) * 0.012;
  const rr = run((tt / 30) * 9);
  const hx = -6 + tt * 0.09;
  const c = camK(f, [{ f: 0, p: [-2, 2.2, 13], l: [0, 1.4, 1], fov: 46 }, { f: k.dur, p: [-1, 2.2, 12], l: [1, 1.4, 1], fov: 46 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 0]} size={20} />
      <Cam {...c} />
      <group position={[0, -0.16, -9]}><City seed={7} near={3} far={6} /></group>
      <Car kind="bus" color="#e74c3c" pos={[bx, 0, 1.75]} rotY={Math.PI / 2} dist={bx} />
      <Person look={HERO()} pos={[hx, 0, 4.4]} rotY={Math.PI / 2} pose={merge(rr, f < load ? EXPR.shock : EXPR.happy, { armR: [2.4, 0.2, 0.2] })} />
    </Stage>
  );
};
export const GE4Best: React.FC = () => {
  const f = useCurrentFrame();
  const c = camK(f, [{ f: 0, p: [1.6, 1.4, 4.4], l: [0.4, 1.0, 0], fov: 42 }, { f: 87, p: [1.3, 1.45, 3.8], l: [0.4, 1.05, 0], fov: 40 }], (t) => t);
  const coins = useMemo(() => { const r = rng(8); return Array.from({ length: 26 }).map(() => [(r() - 0.5) * 1.2, r() * 0.4, (r() - 0.5) * 1.0 + 0.4, r() * 6]); }, []);
  return (
    <Stage>
      <Lights look={LOOKS.golden} center={[0, 0, 0]} size={10} frame={f} />
      <Cam {...c} />
      <group position={[20, -0.16, 30]}><City seed={7} near={3} far={6} /></group>
      <Person look={HERO()} pos={[0, 0, -0.2]} rotY={0.25} pose={merge(EXPR.grin, { body: [-0.06, 0, 0], armL: [2.7, 0.7, 2.2], armR: [2.7, 0.7, 2.2], head: [-0.05, 0.15, 0.1] })}
        onHead={<group position={[0, 0.04, 0.2]}>{[-1, 1].map((s) => <mesh key={s} position={[s * 0.085, 0, 0.02]} scale={[1, 0.72, 0.3]} material={mat('#0b0b10', { r: 0.12, m: 0.6 })}><sphereGeometry args={[0.075, 20, 14]} /></mesh>)}</group>} />
      {coins.map(([x, y, z, r2], i) => <mesh key={i} position={[x + 0.9, y + 0.02, z]} rotation={[Math.PI / 2 * (i % 2), r2, 0]} material={mat('#f5c542', { r: 0.25, m: 0.9 })} castShadow><cylinderGeometry args={[0.08, 0.08, 0.02, 18]} /></mesh>)}
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 30
export const GF1Menu: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'blur(8px) brightness(0.55)', transform: 'scale(1.06)' }}>
      <Stage>
        <Lights look={LOOKS.dusk} center={[0, 0, 0]} size={60} frame={f} />
        <Cam pos={[3, 14, 70 - f * 0.03]} look={[0, 6, -20]} fov={44} />
        <City seed={7} near={3} far={8} night={0.8} lit={0.7} lamps={1} />
      </Stage>
    </div>
  );
};
export const GF2Confirm: React.FC = () => {
  const f = useCurrentFrame();
  const c = camK(f, [{ f: 0, p: [0.1, 1.68, 1.25], l: [0, 1.62, 0], fov: 36 }, { f: 135, p: [0.05, 1.66, 0.95], l: [0, 1.62, 0], fov: 34 }], (t) => t);
  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'brightness(0.8)' }}>
      <Stage>
        <Lights look={LOOKS.dusk} center={[0, 1, 0]} size={6} frame={f} />
        <Cam {...c} />
        <group position={[-8.6, -0.16, -10]}><City seed={7} near={3} far={6} night={0.8} lit={0.7} lamps={1} /></group>
        <Person look={HERO()} pose={merge(EXPR.confused, { head: [0.05, Math.sin(f * 0.05) * 0.15, 0.08], eyeA: [-0.02, -0.01], eyeB: [-0.02, -0.01], armR: [1.4, -0.1, 1.0] })} />
      </Stage>
    </div>
  );
};

// ------------------------------------------------------------------ FINAL
export const GG1Lab: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gg1_lab');
  const sci = useMemo(() => [0, 1, 2].map((i) => randomLook(1000 + i, { coat: 'lab', glasses: i !== 1 })), []);
  const c = camK(f, [{ f: 0, p: [0.4, 2.3, 6.2], l: [0, 1.3, 0], fov: 44 }, { f: k.dur, p: [1.6, 2.1, 5.0], l: [0, 1.35, 0], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, sunI: 0.8, hemiI: 0.4, hor: '#0f2a4a', top: '#050a18' }} center={[0, 1, 0]} size={6} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#141c2b', { r: 0.8 })}><circleGeometry args={[12, 48]} /></mesh>
      <mesh position={[0, 0.45, 0]} material={mat('#2a3550', { r: 0.4, m: 0.4 })} castShadow><cylinderGeometry args={[1.0, 1.1, 0.9, 32]} /></mesh>
      <mesh position={[0, 0.91, 0]} material={basic('#2ef2ff', { t: 0.6 })}><cylinderGeometry args={[0.95, 0.95, 0.02, 32]} /></mesh>
      <group position={[0, 1.75, 0]} rotation={[0.3, f * 0.012, 0]}>
        <mesh material={new THREE.MeshBasicMaterial({ color: '#2ef2ff', wireframe: true, transparent: true, opacity: 0.6 })}><sphereGeometry args={[0.62, 20, 14]} /></mesh>
      </group>
      <group position={[0, 1.75, 0]}><Earth rot={f * 0.012} r={0.55} sun={[1, 0.3, 0.5]} night={0} /></group>
      <Glow pos={[0, 1.75, 0]} s={1.8} color="#2ef2ff" o={0.35} />
      <pointLight position={[0, 1.7, 0]} intensity={12} distance={5} color="#5ef0ff" />
      {sci.map((l, i) => { const a = -0.9 + i * 0.9 + Math.PI; return <Person key={i} look={l} pos={[Math.sin(a) * 1.7, 0, Math.cos(a) * 1.7 + (i === 1 ? 0 : 0.2)]} rotY={a + Math.PI} pose={merge(idle(f, i), EXPR.confused, { armR: [1.1 + Math.sin(f * 0.1 + i) * 0.3, 0.2, 0.8] })} />; })}
    </Stage>
  );
};
export const GG2Sim: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gg2_sim');
  const wire = ramp(f, 4, 30);
  const c = camK(f, [{ f: 0, p: [20, 30, 60], l: [0, 2, 0], fov: 44 }, { f: k.dur, p: [60, 110, 170], l: [0, 0, 0], fov: 46 }]);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#02040a' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - wire }}>
        <Stage>
          <Lights look={LOOKS.day} center={[0, 0, 0]} size={100} frame={f} />
          <Cam {...c} />
          <City seed={7} near={3} far={7} />
        </Stage>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: wire }}>
        <Stage bg="#02040a">
          <Wire on />
          <Lights look={{ ...LOOKS.space }} center={[0, 0, 0]} size={100} shadow={false} noSky noFog />
          <Cam {...c} />
          <City seed={7} near={3} far={6} noGround />
        </Stage>
      </div>
    </div>
  );
};
const RedButton: React.FC<{ s: number; press?: number }> = ({ s, press = 0 }) => (
  <group scale={[s, s, s]}>
    <mesh position={[0, 0, 0]} material={mat('#2d3436', { r: 0.4, m: 0.5 })} castShadow><cylinderGeometry args={[0.55, 0.62, 0.22, 40]} /></mesh>
    <mesh position={[0, 0.17 - press * 0.08, 0]} material={mat('#e3122b', { r: 0.25, e: '#ff1a3a', ei: 0.5 })} castShadow><cylinderGeometry args={[0.42, 0.44, 0.16, 40]} /></mesh>
    <mesh position={[0, 0.25 - press * 0.08, 0]} scale={[1, 0.25, 1]} material={mat('#ff2a40', { r: 0.2, e: '#ff1a3a', ei: 0.5 })}><sphereGeometry args={[0.42, 32, 16]} /></mesh>
    <sprite position={[0, 0.3, 0]} scale={[2.6, 2.6, 1]} material={spr('#ff2a3a', { map: radialTex('glow'), add: true, t: 0.55 })} />
  </group>
);
export const GG3Button: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gg3_button');
  const back = smoother(clamp(f / 40));
  const appear = k.w(219) - 4;
  const bs = backOut((f - appear) / 14, 1.6);
  const ppl = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({ look: randomLook(1100 + i), a: [8 + (i % 3) * 1.3, -26 + i * 3.2], sp: 1.1 + (i % 4) * 0.12 })), []);
  const look = mixLook(LOOKS.dusk, LOOKS.morning, back);
  const c = f < 40 ? camK(f, [{ f: 0, p: [30, 60, 80], l: [0, 0, -10], fov: 46 }, { f: 40, p: [5.3, 1.9, 14], l: [9, 1.6, -6], fov: 44 }])
    : camK(f, [{ f: 40, p: [5.3, 1.9, 14], l: [9, 1.6, -6], fov: 44 }, { f: k.dur, p: [5.9, 1.8, 10.5], l: [9.2, 1.6, -6], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={look} center={[8, 0, 0]} size={lerp(100, 30, back)} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} f={f} />
      {back > 0.5 && <Traffic f={f + 100} n={16} seed={17} axis="z" />}
      {back > 0.8 && ppl.map((p, i) => { const w = walkPath(f + 120 - i * 10, p.a, [p.a[0], p.a[1] + 60], p.sp, 0, i); return <Person key={i} look={p.look} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, i), w.pose, EXPR.happy)} />; })}
      {f >= appear && (
        <group position={[6.9, 1.25 + Math.sin(f * 0.08) * 0.04, 5.2]} rotation={[0.9, 0.1, 0]}>
          <RedButton s={0.75 * bs} />
        </group>
      )}
    </Stage>
  );
};
export const GG4Press: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('gg4_press');
  const reach = easeOut(f / k.dur);
  return (
    <Stage>
      <Lights look={LOOKS.morning} center={[0, 0, 0]} size={4} frame={f} />
      <Cam pos={[0, 1.15, 1.4]} look={[0, 0.25, 0]} fov={40} />
      <group position={[-9.2, -0.16, -12]}><City seed={7} near={3} far={6} /></group>
      <group position={[0, 0.2, 0]} rotation={[0.25, 0, 0]}><RedButton s={0.7} /></group>
      <group position={[0.35 - reach * 0.32, 1.0 - reach * 0.42, 0.9 - reach * 0.55]} rotation={[0.9, 0, 0.3]}>
        <mesh material={mat('#f0c4a0', { r: 0.65 })}><capsuleGeometry args={[0.06, 0.5, 8, 14]} /></mesh>
        <mesh position={[0, -0.36, 0]} material={mat('#f0c4a0', { r: 0.65 })}><sphereGeometry args={[0.075, 16, 12]} /></mesh>
        <mesh position={[0, 0.5, 0]} material={mat('#3f88c5', { r: 0.85 })}><capsuleGeometry args={[0.075, 0.5, 8, 14]} /></mesh>
      </group>
    </Stage>
  );
};

// ------------------------------------------------------------------ OUTRO: hero with headset on synthwave
export const GOutro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TitleBg />
      <div style={{ position: 'absolute', left: 140, top: 900, width: 800, height: 800 }}>
        <ThreeCanvas width={800} height={800} gl={{ antialias: true, alpha: true }} camera={{ fov: 30, near: 0.05, far: 100 }}>
          <Lights look={{ ...LOOKS.morning, sunAz: 30, sunEl: 32, sun: '#f0e6ff', sunI: 2.2, hemiI: 1.0, env: 0.6 }} center={[0, 1.4, 0]} size={3} noSky noFog />
          <directionalLight position={[-2.6, 2.6, -2.6]} intensity={3.2} color="#ff2bd6" />
          <directionalLight position={[2.6, 2.4, -2.4]} intensity={2.6} color="#21f0ff" />
          <Cam pos={[0.1, 1.55, 3.2]} look={[0, 1.4, 0]} fov={30} />
          <Person look={randomLook(3, { skin: '#f0c4a0', hair: '#3a2416', hairStyle: 'short', shirt: '#7b2ff7' })} blob={false} olWidth={0.008} onHead={<Headset />}
            pose={merge(EXPR.happy, { head: [0.04, Math.sin(f * 0.05) * 0.15, -0.06], armL: [0.1, 0.12, 0.2], armR: [2.7 + Math.sin(f * 0.3) * 0.15, -0.2, 0.3], blink: (f % 70) < 4 ? 1 : 0 })} />
        </ThreeCanvas>
      </div>
    </div>
  );
};

export const GAME_SCENES: Record<string, React.FC> = {
  gh1_wake: GH1Wake, gh2_world: GH2World, gh3_pixel: GH3Pixel, title: TitleBg, loading: LoadingBg,
  gm1_bed: GM1Bed, gm2_hpbar: GM2HPBar, gm3_level: GM3Level,
  ga1_fridge: GA1Fridge, ga2_mom: GA2Mom, ga3_npc: GA3NPC,
  gb1_loops: GB1Loops, gb2_cars: GB2Cars, gb3_lod: GB3LOD, gb4_teeth: GB4Teeth,
  gc1_quests: GC1Quests, gc2_bread: GC2Bread, gc3_boss: GC3Boss, gc4_wall: GC4Wall,
  gd1_lag: GD1Lag, gd2_freeze: GD2Freeze, gd3_fall: GD3Fall,
  ge1_save: GE1Save, ge2_mug: GE2Mug, ge3_bus: GE3Bus, ge4_best: GE4Best,
  gf1_menu: GF1Menu, gf2_confirm: GF2Confirm,
  gg1_lab: GG1Lab, gg2_sim: GG2Sim, gg3_button: GG3Button, gg4_press: GG4Press, outro: GOutro,
};
export { C, Crowd, Q, Blob, Shelf, Bin, Lamp, Smoke, Stars, QMark, StuckCars, CAR_COLORS, StarField, easeIn, wobble };
export type { Agent };

// ------------------------------------------------------------------ chapter interludes (time-lapse aerials, game flavoured)
type ICfg = { a: any; b: any; night: [number, number]; load: [number, number]; lag: boolean; ang: number; lamps: number };
const ICFG: Record<string, ICfg> = {
  I1: { a: LOOKS.day, b: { ...LOOKS.day, sunAz: 160, sunEl: 40 }, night: [0, 0], load: [1e5, 1e5], lag: false, ang: 0.4, lamps: 0 },
  I2: { a: LOOKS.day, b: LOOKS.golden, night: [0, 0.2], load: [20, 140], lag: false, ang: 1.6, lamps: 0 },
  I3: { a: LOOKS.golden, b: LOOKS.dusk, night: [0.2, 0.9], load: [1e5, 1e5], lag: false, ang: 2.8, lamps: 0.6 },
  I4: { a: LOOKS.dusk, b: LOOKS.night, night: [0.9, 1], load: [1e5, 1e5], lag: true, ang: 4.0, lamps: 0.8 },
  I5: { a: LOOKS.night, b: LOOKS.day, night: [1, 0], load: [1e5, 1e5], lag: false, ang: 5.2, lamps: 0 },
  I6: { a: LOOKS.day, b: LOOKS.dusk, night: [0, 0.8], load: [1e5, 1e5], lag: false, ang: 0.9, lamps: 0.6 },
};
const makeGI = (id: string): React.FC => () => {
  const f0 = useCurrentFrame();
  const k = shotClock(id);
  const cfg = ICFG[id];
  const f = cfg.lag ? Math.floor(f0 / 6) * 6 : f0;
  const p = f / k.dur;
  const tl2 = smoother(Math.min(1, f / (k.dur * 0.92)));
  const look = mixLook(cfg.a, cfg.b, tl2);
  look.sunAz = lerp(cfg.a.sunAz - 40, cfg.b.sunAz + 30, p);
  const ang = cfg.ang + p * 0.7;
  const R = lerp(190, 150, smoother(p)), Y = lerp(150, 110, smoother(p));
  return (
    <Stage>
      <Lights look={look} center={[0, 0, 0]} size={140} frame={f * 6} />
      <Cam pos={[Math.sin(ang) * R, Y, Math.cos(ang) * R]} look={[0, 0, 0]} fov={46} />
      <City seed={7} near={3} far={8} night={lerp(cfg.night[0], cfg.night[1], tl2)} lamps={cfg.lamps * ramp(f, 0, 30)} f={f * 4} load={[0, 0, lerp(cfg.load[0], cfg.load[1], tl2)]} />
      <Traffic f={f * 3} n={40} seed={13} span={300} lights={cfg.night[1] > 0.5 ? 1 : 0} />
    </Stage>
  );
};
Object.assign(GAME_SCENES, { I1: makeGI('I1'), I2: makeGI('I2'), I3: makeGI('I3'), I4: makeGI('I4'), I5: makeGI('I5'), I6: makeGI('I6') });
