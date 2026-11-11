import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic, textTex } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walk } from '../three/person';
import { Car } from '../three/vehicles';
import { QMark, Smoke, Birds, Glow, rbox } from '../three/props';
import { Earth, StarField } from '../three/earth';
import { StuckCars } from './Hour';
import { lonRot } from './Hook';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, easeIn, kick, clamp, pop, smoother, wobble } from '../lib/anim';

// «Большинство городов перестаёт функционировать как раньше.» — day 7 dusk
export const E1Dusk: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('e1_dusk');
  const c = camK(f, [{ f: 0, p: [3, 14, 70], l: [0, 6, -20], fov: 44 }, { f: k.dur, p: [-2, 10, 46], l: [0, 6, -30], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.dusk} center={[0, 0, 20]} size={60} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} night={1} lit={0.18} trash={1} traffic="blink" f={f} />
      <StuckCars seed={71} n={40} f={f} area={240} />
      <Smoke pos={[30, 10, -80]} f={f} h={90} s={18} seed={7} color="#3d3a3a" o={0.6} />
      <Smoke pos={[-40, 10, -140]} f={f + 50} h={100} s={20} seed={8} color="#3d3a3a" o={0.5} />
    </Stage>
  );
};

// «Люди начинают понимать, что мир, который казался таким привычным,» — alone on a curb
export const E2Curb: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('e2_curb');
  const look = useMemo(() => randomLook(610, { shirt: '#5c80bc', hairStyle: 'short', hair: '#4a2f1d' }), []);
  const ang = lerp(-0.9, 0.5, smoother(f / k.dur));
  const R = lerp(3.6, 4.4, f / k.dur);
  const papers = useMemo(() => { const r = rng(3); return Array.from({ length: 6 }).map(() => [r() * 6 - 3, r() * 4, r() * 6.28]); }, []);
  return (
    <Stage>
      <Lights look={LOOKS.dusk} center={[8.5, 0, 0]} size={16} frame={f} />
      <Cam pos={[4.3 + Math.sin(ang) * 0.6, 1.15, 1.9 + Math.cos(ang) * 0.8]} look={[7.3, 0.8, -0.3]} fov={44} />
      <City seed={7} near={3} far={8} night={1} lit={0.15} trash={0.5} traffic="blink" f={f} />
      <group position={[0, 0, -40]}><StuckCars seed={72} n={14} f={f} area={60} axis="z" jitter={0.6} /></group>
      <Person look={look} pos={[7.25, 0.0, 0]} rotY={-Math.PI / 2} pose={merge(EXPR.sad, { legL: 1.4, legR: 1.4, kneeL: 1.1, kneeR: 1.1, y: -0.42, body: [0.35, 0, 0], armL: [0.9, 0.1, 1.5], armR: [0.9, 0.1, 1.5], head: [0.15, Math.sin(f * 0.03) * 0.25, 0], blink: f % 80 < 4 ? 1 : 0 })} />
      {papers.map(([x, z, ph], i) => <mesh key={i} position={[4 + x + ((f * 0.06 + ph) % 6), 0.1 + Math.abs(Math.sin(f * 0.1 + ph)) * 0.6, z - 2]} rotation={[f * 0.1 + ph, f * 0.07, ph]} material={mat('#efece4', { r: 0.9, side: THREE.DoubleSide })}><planeGeometry args={[0.3, 0.22]} /></mesh>)}
    </Stage>
  );
};

/** three glowing pillars hold a little world */
export const E3Pillars: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('e3_pillars');
  const on = [k.w(183), k.w(184), k.w(186)];
  const crack = k.cue('crumble');
  const names = ['ЗНАНИЯ', 'ЛОГИКА', 'СОТРУДНИЧЕСТВО'];
  const cols = ['#2ae8ff', '#ffd23f', '#7bff6b'];
  const fall = f > crack ? easeIn((f - crack) / 26) : 0;
  const c = camK(f, [{ f: 0, p: [0, 2.5, 9.0], l: [0, 2.3, 0], fov: 46 }, { f: crack, p: [1.6, 2.9, 8.4], l: [0, 2.2, 0], fov: 46 }, { f: k.dur, p: [2.0, 2.6, 8.0], l: [0, 1.4, 0], fov: 48 }]);
  const sh = f > crack ? kick(f, crack, 10) * 0.08 : 0;
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, hor: '#2c2559', top: '#0b0d1f' }} center={[0, 2, 0]} size={8} frame={f} />
      <Cam pos={[c.pos[0] + sh, c.pos[1] + sh, c.pos[2]]} look={c.look} fov={c.fov} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#1c2038', { r: 0.9 })}><circleGeometry args={[20, 48]} /></mesh>
      <group position={[0, 3.35 - fall * 3.0, 0]} rotation={[fall * 0.5, f * 0.004, fall * -0.35]}>
        <mesh material={mat('#cfc9bd', { r: 0.8 })} castShadow receiveShadow><cylinderGeometry args={[2.1, 2.1, 0.3, 48]} /></mesh>
        <group position={[0, 0.15, 0]} scale={[0.018, 0.018, 0.018]}><City seed={7} near={1} far={1} noGround /></group>
      </group>
      {[-1.3, 0, 1.3].map((x, i) => {
        const lit = f >= on[i] - 1;
        const p = pop(f, on[i] - 1, 8);
        const broken = fall > 0;
        return (
          <group key={i} position={[x, 0, i === 1 ? -0.5 : 0.4]}>
            <group rotation={[broken ? fall * (i - 1) * 0.9 : 0, 0, broken ? fall * (i === 1 ? 0.6 : -0.7) * (i ? 1 : -1) : 0]}>
              <mesh position={[0, 1.6, 0]} material={lit ? mat(cols[i], { r: 0.3, e: cols[i], ei: 0.8 }) : mat('#9aa0a8', { r: 0.6 })} castShadow><cylinderGeometry args={[0.26, 0.32, 3.2, 24]} /></mesh>
              {lit && <Glow pos={[0, 1.6, 0]} s={2.6 * p} color={cols[i]} o={0.6} />}
              {lit && (
                <mesh position={[0, 0.45 + i * 0.42, 0.55]} scale={[p, p, p]} material={basic('#ffffff', { map: textTex(names[i], { w: 1024, h: 200, bg: 'rgba(10,12,30,0.85)', fg: cols[i], radius: 30, size: names[i].length > 8 ? 92 : 120 }) })}><planeGeometry args={[1.25, 0.245]} /></mesh>
              )}
            </group>
          </group>
        );
      })}
    </Stage>
  );
};

// day 30 — the overgrown city
export const F1Overgrown: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('f1_overgrown');
  const c = camK(f, [{ f: 0, p: [-1, 3.0, 40], l: [0, 6, -10], fov: 46 }, { f: k.dur, p: [1, 5.5, 30], l: [0, 7, -12], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.overgrown} center={[0, 0, 10]} size={50} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={7} overgrowth={1} trash={0.7} traffic="off" />
      <StuckCars seed={81} n={24} f={f} area={180} rust={0.8} axis="z" jitter={0.8} />
      <Birds f={f} center={[-10, 22, -10]} n={8} speed={0.25} />
    </Stage>
  );
};

// «Современная цивилизация больше не функционирует...» — the night side goes dark
export const F2EarthNight: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('f2_earthnight');
  const off = lerp(0, 0.92, ramp(f, k.w(196), k.w(201) + 10, (t) => t));
  const c = camK(f, [{ f: 0, p: [0, 3, 50], l: [0, 0, 0], fov: 40 }, { f: k.dur, p: [-8, 6, 42], l: [0, 0, 0], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam {...c} />
      <StarField />
      <Earth rot={lonRot(60) + f * 0.003} sun={[-1, 0.2, -0.4]} off={off} r={10} night={1.2} />
    </Stage>
  );
};

/** smartphone artifact on a stone */
const PhoneArtifact: React.FC<{ glow: number }> = ({ glow }) => (
  <group>
    <mesh geometry={rbox(1.2, 0.7, 0.9, 0.2)} position={[0, 0.35, 0]} material={mat('#8a8578', { r: 0.95 })} castShadow receiveShadow />
    <group position={[0, 0.72, 0]} rotation={[-Math.PI / 2 + 0.25, 0, 0.2]}>
      <mesh geometry={rbox(0.32, 0.62, 0.035, 0.03)} material={mat('#111', { r: 0.25, m: 0.6 })} castShadow />
      <mesh position={[0, 0, 0.019]} material={basic(glow > 0 ? '#9fd3ff' : '#0b0f17')}><planeGeometry args={[0.28, 0.56]} /></mesh>
    </group>
    {glow > 0 && <Glow pos={[0, 0.9, 0]} s={1.5 * glow} color="#9fd3ff" />}
  </group>
);
// «Миллиарды людей живут без понимания того,» — poking a phone with a stick
export const F3Artifact: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('f3_artifact');
  const poke = k.cue('poke');
  const ppl = useMemo(() => [0, 1, 2, 3].map((i) => randomLook(700 + i, { shirt: ['#7a6a4a', '#5b6b4a', '#8a5a3a', '#6a5a7a'][i] })), []);
  const pk = f >= poke - 8 && f < poke + 10 ? Math.sin(((f - poke + 8) / 18) * Math.PI) : 0;
  const jump = f >= poke && f < poke + 14 ? Math.sin(((f - poke) / 14) * Math.PI) * 0.35 : 0;
  const glow = f >= poke ? Math.max(0, 1 - (f - poke) / 30) : 0;
  const c = camK(f, [{ f: 0, p: [0.3, 1.9, 5.6], l: [0, 0.9, 0], fov: 46 }, { f: k.dur, p: [0.8, 1.9, 4.8], l: [0, 0.95, 0], fov: 44 }], (t) => t);
  const pos = [[-1.4, 0.2], [1.4, 0.0], [-0.8, -1.3], [0.9, -1.2]];
  return (
    <Stage>
      <Lights look={LOOKS.overgrown} center={[0, 0, 0]} size={8} frame={f} />
      <Cam {...c} />
      <group position={[-8.5, -0.16, 10]}><City seed={7} near={3} far={6} overgrowth={1} trash={0.6} traffic="off" /></group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow material={mat('#6f8f3e', { r: 0.95 })}><circleGeometry args={[5, 32]} /></mesh>
      <PhoneArtifact glow={glow} />
      {ppl.map((l, i) => (
        <Person key={i} look={l} pos={[pos[i][0], i === 0 ? 0 : jump, pos[i][1]]} rotY={Math.atan2(-pos[i][0], -pos[i][1])}
          pose={merge(idle(f, i), f >= poke ? EXPR.shock : EXPR.dumb, i === 0 ? { armR: [1.2 + pk * 0.5, 0.1, 0.2], body: [0.2 + pk * 0.15, 0, 0] } : f >= poke ? { armL: [2.6, 0.5, 0.2], armR: [2.6, 0.5, 0.2] } : { body: [0.25, 0, 0] })}
          propR={i === 0 ? <group rotation={[Math.PI / 2 - 0.3, 0, 0]}><mesh position={[0, 0.5, 0]} material={mat('#6b4a33', { r: 0.9 })}><cylinderGeometry args={[0.02, 0.025, 1.2, 6]} /></mesh></group> : null}
          above={i === 2 && f > poke + 6 ? <QMark s={0.32 * pop(f, poke + 6, 8)} /> : null} />
      ))}
    </Stage>
  );
};

// «...как устроены окружающие их технологии.» — pulling a car like a cart
export const F4Rope: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('f4_rope');
  const A = useMemo(() => randomLook(720, { shirt: '#7a6a4a', hairStyle: 'long' }), []);
  const B = useMemo(() => randomLook(721, { shirt: '#5b6b4a' }), []);
  const x = -2 + (f / 30) * 0.35;
  const c = camK(f, [{ f: 0, p: [-1.2, 2.2, 13.5], l: [-1.2, 1.0, 0], fov: 46 }, { f: k.dur, p: [0.0, 2.0, 12.5], l: [-0.6, 1.0, 0], fov: 46 }], (t) => t);
  const ropeLen = 1.8;
  const strain = (ph: number) => merge(walk(f * 0.12 + ph, 0.5), { body: [0.45, 0, 0] });
  return (
    <Stage>
      <Lights look={LOOKS.overgrown} center={[0, 0, 0]} size={12} frame={f} />
      <Cam {...c} />
      <group position={[0, -0.16, -9]}><City seed={7} near={3} far={6} overgrowth={1} trash={0.6} traffic="off" /></group>
      <Car kind="sedan" color="#8d99a6" pos={[x, 0, 0]} rotY={Math.PI / 2} rust={0.75} dist={x} />
      <mesh position={[x + 2.15 + ropeLen / 2, 0.65, 0]} rotation={[0, 0, Math.PI / 2 + 0.08]} material={mat('#c9a66b', { r: 0.9 })}><cylinderGeometry args={[0.025, 0.025, ropeLen, 6]} /></mesh>
      <Person look={A} pos={[x + 2.15 + ropeLen + 0.2, 0, 0]} rotY={Math.PI / 2} pose={merge(strain(0), EXPR.dumb, { armL: [-0.6, 0.1, 0.3], armR: [-0.6, 0.1, 0.3] })} />
      <Person look={B} pos={[x - 2.55, 0, 0.2]} rotY={Math.PI / 2} pose={merge(strain(1.7), EXPR.happy, { armL: [1.5, 0.1, 0.2], armR: [1.5, 0.1, 0.2] })} />
      <Birds f={f} center={[-6, 14, -6]} n={5} speed={0.2} />
    </Stage>
  );
};
export { mixLook, Car, wobble, clamp };
