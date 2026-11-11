import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walkPath } from '../three/person';
import { QMark, Glow, IQTag, Birds } from '../three/props';
import { Earth, StarField, SunGlow } from '../three/earth';
import { StuckCars } from './Hour';
import { Traffic } from './Morning';
import { lonRot } from './Hook';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, easeOut, easeIn, smoother, pop, clamp } from '../lib/anim';

// BEAT1 + «И самое страшное.» — darkness, one figure, a red rim
export const G1Dark: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('g1_dark');
  const look = useMemo(() => randomLook(800, { shirt: '#3b3b3b', hairStyle: 'short', hair: '#151515' }), []);
  const beat = Math.exp(-((f % 26) / 4)) + 0.6 * Math.exp(-(((f + 18) % 26) / 4));
  const c = camK(f, [{ f: 0, p: [0, 1.5, 6], l: [0, 1.3, 0], fov: 36 }, { f: k.dur, p: [0.2, 1.55, 3.4], l: [0, 1.4, 0], fov: 34 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.red, sunI: 0.6, hemiI: 0.25 }} center={[0, 1, 0]} size={5} frame={f} noSky />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#140608', { r: 0.9 })}><circleGeometry args={[30, 48]} /></mesh>
      <spotLight position={[0, 6, 1]} angle={0.35} penumbra={0.6} intensity={60 + beat * 40} distance={14} color="#ff3a3a" castShadow />
      <pointLight position={[-1.5, 1.8, -1.5]} intensity={8 + beat * 10} distance={5} color="#ff2020" />
      <Person look={look} pos={[0, 0, 0]} rotY={0} pose={merge(EXPR.sad, { legL: 1.5, legR: 1.5, kneeL: 1.5, kneeR: 1.5, y: -0.38, body: [0.3, 0, 0], armL: [1.0, 0.1, 1.4], armR: [1.0, 0.1, 1.4], head: [0.25, 0, 0], blink: f > k.dur - 30 ? 0 : 0.6 })} />
      <mesh position={[0, 0.2, 0]} material={mat('#2a1a1a', { r: 0.8 })} castShadow><boxGeometry args={[0.8, 0.4, 0.8]} /></mesh>
    </Stage>
  );
};

// «Никто даже не понимает, что человечество потеряло.» — happy in the ruins, huge pull-back
export const G2Ruins: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('g2_ruins');
  const look = useMemo(() => randomLook(810, { shirt: '#7a6a4a', hairStyle: 'curly', hair: '#4a2f1d' }), []);
  const p = smoother(f / k.dur);
  const pos = [lerp(9.6, 30, p), lerp(1.4, 95, easeIn(p) * 0.6 + p * 0.4), lerp(2.6, 90, p)];
  const look_at = [lerp(8.6, 0, p), lerp(1.2, 0, p), lerp(0, -20, p)];
  return (
    <Stage>
      <Lights look={LOOKS.overgrown} center={[lerp(8, 0, p), 0, 0]} size={lerp(10, 120, p)} frame={f} />
      <Cam pos={pos} look={look_at} fov={lerp(40, 46, p)} />
      <City seed={7} near={3} far={8} overgrowth={1} trash={1} traffic="off" />
      <StuckCars seed={91} n={36} f={f} area={240} rust={0.9} jitter={0.9} />
      <Person look={look} pos={[8.6, 0.16, 0]} rotY={-0.4} pose={merge(EXPR.grin, { legL: 1.5, legR: 1.5, kneeL: 1.4, kneeR: 1.4, y: -0.42, armL: [1.2 + Math.sin(f * 0.3) * 0.3, 0.2, 0.6], armR: [1.2 - Math.sin(f * 0.3) * 0.3, 0.2, 0.6], head: [0.2, Math.sin(f * 0.1) * 0.2, 0.1] })} />
      {[0, 1, 2].map((i) => <mesh key={i} position={[8.6 + Math.cos(i * 2.1) * 0.5, 0.2 + i * 0.12, 0.45 + Math.sin(i * 2.1) * 0.2]} material={mat(['#e74c3c', '#f1c40f', '#3498db'][i], { r: 0.4, m: 0.4 })} castShadow><cylinderGeometry args={[0.07, 0.07, 0.04, 16]} /></mesh>)}
      <Birds f={f} center={[-10, 40, -30]} n={10} speed={0.3} />
    </Stage>
  );
};

// BEAT2 + «А теперь представьте, если бы это произошло прямо сейчас,» — rewind to today
export const G3Rewind: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('g3_rewind');
  const rw = clamp(f / 40);
  const back = smoother(rw);
  const now = k.w(230);
  const glitch = f >= now - 2 && f < now + 14;
  const look = mixLook(LOOKS.overgrown, LOOKS.morning, back);
  const ppl = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({ look: randomLook(830 + i), a: [8 + (i % 3) * 1.3, -26 + i * 3.2], sp: 1.1 + (i % 4) * 0.12 })), []);
  const c = f < 40
    ? camK(f, [{ f: 0, p: [30, 60, 80], l: [0, 0, -10], fov: 46 }, { f: 40, p: [6.5, 1.9, 14], l: [9, 1.6, -6], fov: 44 }])
    : camK(f, [{ f: 40, p: [6.5, 1.9, 14], l: [9, 1.6, -6], fov: 44 }, { f: k.dur, p: [6.9, 1.8, 9.5], l: [9.2, 1.7, -6], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={look} center={[8, 0, 0]} size={lerp(100, 30, back)} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} overgrowth={1 - back} trash={1 - back} traffic={back > 0.9 ? 'normal' : 'off'} f={f} />
      {back < 0.5 && <StuckCars seed={91} n={36} f={f} area={240} rust={0.9} jitter={0.9} />}
      {back > 0.5 && <Traffic f={f + 100} n={16} seed={17} axis="z" />}
      {back > 0.8 && ppl.map((p, i) => {
        const w = walkPath(f + 120 - i * 10, p.a, [p.a[0], p.a[1] + 60], p.sp, 0, i);
        return (
          <Person key={i} look={p.look} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, i), w.pose, glitch ? EXPR.dumb : EXPR.happy)}
            above={f >= now - 2 ? <IQTag value={glitch ? (f % 4 < 2 ? -40 : 100) : 100} s={0.55} glitch={glitch ? 1 : 0} pos={[0, -0.05, 0]} /> : null} />
        );
      })}
    </Stage>
  );
};

// «смогли бы мы когда-нибудь вернуть прежний мир?» — the planet, lights flickering back
export const G4Earth: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('g4_earth');
  const off = 0.9 - 0.6 * smoother(f / k.dur);
  const c = camK(f, [{ f: 0, p: [0, 2, 40], l: [0, 1, 0], fov: 40 }, { f: k.dur, p: [3, 4, 54], l: [0, 2.5, 0], fov: 40 }], (t) => t);
  const qs = pop(f, k.w(239) - 2, 10);
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam {...c} />
      <StarField />
      <SunGlow pos={[500, 80, -400]} s={240} />
      <Earth rot={lonRot(40) + f * 0.004} sun={[0.6, 0.15, -0.6]} off={off} r={10} night={1.2} />
      {f >= k.w(239) - 2 && <QMark pos={[0, 13, 0]} s={2.8 * qs} rotY={Math.sin(f * 0.05) * 0.4} color="#ffd23f" />}
    </Stage>
  );
};

// outro — calm planet behind the end card
export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam pos={[0, -14 + f * 0.01, 26]} look={[0, -16, 0]} fov={40} />
      <StarField />
      <Earth rot={lonRot(40) + f * 0.003} sun={[0.8, 0.4, 0.4]} r={10} pos={[0, -26, 0]} night={1} />
    </Stage>
  );
};
export { Glow, basic, ramp, easeOut };
