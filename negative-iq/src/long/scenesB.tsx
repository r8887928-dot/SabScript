// Long-form (16:9) scenes, part B: day 3 → finale, chapter aerials, end screen
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic, canvasTex, radialTex, spr } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walkPath, walk, run } from '../three/person';
import { Car } from '../three/vehicles';
import { Glow, Room, rbox, Birds, Smoke, useScreen, Screen, Bench, Lamp } from '../three/props';
import { Earth, StarField, earthDay } from '../three/earth';
import { Traffic } from '../scenes/Morning';
import { Classroom } from '../scenes/Hour';
import { Headset } from '../AvatarNiches';
import { HERO, DAY, Label, Exclaim, Wire, Bedroom, LyingHero, Blanket, Kitchen, Floppy, RedButton, synth } from '../game/scenes';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, easeIn, smoother, kick, clamp, pop, backOut, hash } from '../lib/anim';
import { P2, Garages, Grass } from './scenesA';

const ANGRY = { mouth: 'frown', brows: [-0.5, 0.5, -0.01], eyeA: [0, 0], eyeB: [0, 0] } as any;
const step = (f: number, n: number) => Math.floor(f / n) * n;
const STREET_PPL = (seed: number, n: number) => Array.from({ length: n }).map((_, i) => ({ look: randomLook(seed + i), a: [8.8 + (i % 3) * 1.25, -30 + i * 3.4], sp: 1.0 + (i % 4) * 0.13 }));

// ------------------------------------------------------------------ DAY 3: lag
export const L36Lag: React.FC = () => {
  const f = useCurrentFrame();
  const tf = step(f, 7) + (f % 7 > 5 ? 3 : 0);
  const ppl = useMemo(() => STREET_PPL(830, 9), []);
  const c = camK(tf, [{ f: 0, p: [7.6, 1.9, 13], l: [10, 1.6, -6], fov: 44 }, { f: 51, p: [7.7, 1.8, 11], l: [10.2, 1.7, -6], fov: 42 }], (t) => t);
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
export const L37Freeze: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L37_freeze');
  const ang = lerp(-0.7, 0.8, smoother(f / k.dur));
  const birdsF = k.w(468);
  const ppl = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ look: randomLook(970 + i), x: -27.5 + (i % 3) * 1.6, z: -13 - i * 1.5, ph: i * 1.3 })), []);
  const mannequin = k.w(472);
  return (
    <Stage>
      <Lights look={DAY} center={[-25, 0, -19]} size={20} />
      <Cam pos={[-25.5 + Math.sin(ang) * 9, 2.3, -19 + Math.cos(ang) * 9]} look={[-25.5, 1.5, -19.5]} fov={44} />
      <City seed={7} near={3} far={6} />
      {ppl.map((p, i) => <Person key={i} look={p.look} pos={[p.x, 0.16, p.z]} rotY={i % 2 ? 0 : Math.PI} pose={i === 4 && f >= mannequin - 4 ? { armL: [0, 1.57, 0], armR: [0, 1.57, 0], mouth: 'flat' } : merge(walk(p.ph, 1), EXPR.neutral)} />)}
      <Birds f={Math.min(f, birdsF)} center={[-25, 5.5, -20]} n={7} spread={7} speed={0.2} />
      {f >= mannequin && <Label text="T-POSE" pos={[-27.5 + 1.6, 2.5, -13 - 4 * 1.5]} h={0.16 * pop(f, mannequin, 7)} bg="rgba(160,20,30,0.85)" />}
    </Stage>
  );
};
export const L38Fall: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L38_fall');
  const blink = k.w(480) + 2, fall = k.w(483) - 3;
  const t = Math.max(0, (f - fall) / 30);
  const y = 0.16 - 4.9 * t * t * 1.4;
  const camY = f < fall ? 1.7 : Math.min(1.7, y + 1.5);
  return (
    <Stage>
      <Lights look={{ ...DAY, bot: '#5f87b8' }} center={[8.6, 0, 0]} size={30} frame={f} />
      <Cam pos={[8.6 + (f < fall ? 0 : 0.6), camY + (f > fall ? 0.4 : 0), 2.6]} look={[8.6, f < fall ? 1.45 : y + 0.7, 0]} fov={f < fall ? 36 : 52} roll={f > fall ? Math.sin(f * 0.2) * 5 : 0} />
      <City seed={7} near={3} far={6} />
      <Person look={HERO()} pos={[8.6, y, 0]} rotY={0} pose={merge(f > fall ? { ...EXPR.shock, armL: [2.6, 0.6, 0.2], armR: [2.6, 0.6, 0.2], legL: 0.3, legR: -0.3 } : EXPR.neutral, { blink: f >= blink && f < blink + 5 ? 1 : 0 })} />
    </Stage>
  );
};
/** under the map: blue void, the city hangs upside-down overhead */
export const L39Under: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L39_under');
  const drop = easeOut(clamp(f / 40));
  const hy = lerp(14, 2.0, drop) + Math.sin(f * 0.05) * 0.15;
  const c = camK(f, [{ f: 0, p: [6.8, 1.6, 7.5], l: [8.6, 3.5, 0], fov: 48 }, { f: 70, p: [6.6, 1.2, 8], l: [8.6, 2.6, 0], fov: 48 }, { f: k.dur, p: [5.5, 0.0, 10.5], l: [8.6, 14, -6], fov: 56 }]);
  return (
    <Stage bg="#2d6fd6">
      <Lights look={{ ...DAY, hemiI: 1.2 }} center={[8, 0, 0]} size={30} shadow={false} noSky noFog />
      <directionalLight position={[30, -60, 20]} intensity={2.4} color="#dfe9ff" />
      <hemisphereLight args={['#8fb8ff', '#ffffff', 1.1]} />
      <Cam {...c} />
      <mesh scale={[900, 900, 900]} material={useMemo(() => new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: 'varying vec3 vP; void main(){ float t = normalize(vP).y*0.5+0.5; gl_FragColor = vec4(mix(vec3(0.03,0.07,0.25), vec3(0.25,0.55,1.0), t), 1.0); }' }), [])} />
      <group position={[0, 70, 0]} scale={[1, -1, 1]}><City seed={7} near={3} far={6} /></group>
      <Person look={HERO()} pos={[8.6, hy, 0]} rotY={0.4 + f * 0.01} pose={merge(EXPR.shock, { armL: [2.3, 0.7, 0.4], armR: [2.3, 0.7, 0.4], legL: 0.2, legR: -0.3, head: [-0.4, 0, 0] })} />
      {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} position={[8.6 + Math.cos(i * 1.7) * 6, 4 + i * 2 + Math.sin(f * 0.03 + i) * 0.3, -4 + Math.sin(i * 2.3) * 6]} rotation={[f * 0.01 + i, i, 0]} material={mat(['#9aa0a8', '#c0392b', '#6f9a45'][i % 3], { r: 0.8 })}><boxGeometry args={[0.5, 0.5, 0.5]} /></mesh>)}
    </Stage>
  );
};
export const L40Respawn: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L40_respawn');
  const open = k.w(509);
  const c = camK(f, [{ f: 0, p: [-0.8, 1.75, -1.25], l: [-0.9, 0.9, -1.72], fov: 34 }, { f: k.dur, p: [-0.4, 2.0, -0.6], l: [-0.9, 0.9, -1.6], fov: 42 }], (t) => t);
  const flash = f < 12 ? 1 - f / 12 : 0;
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={5} noSky />
      <Cam {...c} />
      <Bedroom />
      <LyingHero pose={merge(f >= open ? EXPR.shock : EXPR.neutral, { blink: f < open ? 1 : 0, eyeA: [0, 0.02], eyeB: [0, 0.02] })} />
      <Blanket />
      {flash > 0 && <Glow pos={[-0.9, 1.1, -1.5]} s={4 * flash} color="#7dffb0" />}
    </Stage>
  );
};
/** fact: lag = the world can't keep up with you. The hero runs smoothly, the world updates in steps. */
export const L41LagFact: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L41_lagfact');
  const tf = step(f, 9);
  const z = 14 - f * 0.12;
  const ppl = useMemo(() => STREET_PPL(840, 10), []);
  const ghost = step(f, 18);
  return (
    <Stage>
      <Lights look={DAY} center={[8, 0, z]} size={26} frame={tf} />
      <Cam pos={[7.3, 1.7, z + 5.2]} look={[9.8, 1.2, z - 2.5]} fov={46} />
      <City seed={7} near={3} far={6} f={tf} />
      <Traffic f={tf + 60} n={12} seed={19} axis="z" />
      {ppl.map((p, i) => { const w = walkPath(tf + 200 - i * 12, [11.2, p.a[1] - 10], [11.2, p.a[1] + 50], p.sp, 0, i); return <Person key={i} look={p.look} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(tf, i), w.pose)} />; })}
      <Person look={HERO()} pos={[9.6, 0.16, z]} rotY={Math.PI} pose={merge(run((f / 30) * 8), EXPR.grin)} />
      <Person look={HERO()} pos={[9.6, 0.16, 14 - ghost * 0.12]} rotY={Math.PI} pose={merge(run((ghost / 30) * 8), EXPR.neutral)} ol={false} />
    </Stage>
  );
};

// ------------------------------------------------------------------ chapter aerials
type LCfg = { a: any; b: any; night: [number, number]; lag?: boolean; ang: number; lamps: number; load?: [number, number] };
const LCFG: Record<string, LCfg> = {
  C1: { a: LOOKS.morning, b: DAY, night: [0, 0], ang: 0.4, lamps: 0 },
  C2: { a: DAY, b: { ...DAY, sunAz: 200 }, night: [0, 0], ang: 1.5, lamps: 0, load: [30, 160] },
  C3: { a: LOOKS.night, b: LOOKS.morning, night: [1, 0], ang: 2.6, lamps: 0.8 },
  C4: { a: LOOKS.dusk, b: DAY, night: [0.8, 0], ang: 3.6, lamps: 0.6 },
  C5: { a: DAY, b: LOOKS.golden, night: [0, 0.1], ang: 4.4, lamps: 0, lag: true },
  C6: { a: LOOKS.night, b: DAY, night: [1, 0], ang: 5.3, lamps: 0.8 },
  C7: { a: LOOKS.golden, b: LOOKS.morning, night: [0.3, 0], ang: 0.9, lamps: 0.4 },
  C8: { a: LOOKS.night, b: LOOKS.morning, night: [1, 0], ang: 2.0, lamps: 0.8 },
  C9: { a: LOOKS.dusk, b: DAY, night: [0.7, 0], ang: 3.1, lamps: 0.5 },
  C10: { a: DAY, b: LOOKS.dusk, night: [0, 0.8], ang: 4.9, lamps: 0.6 },
};
const makeLI = (id: string): React.FC => () => {
  const f0 = useCurrentFrame();
  const k = shotClock(id);
  const cfg = LCFG[id];
  const f = cfg.lag ? step(f0, 6) : f0;
  const p = f / k.dur;
  const t2 = smoother(Math.min(1, f / (k.dur * 0.92)));
  const look = mixLook(cfg.a, cfg.b, t2);
  look.sunAz = lerp(cfg.a.sunAz - 40, cfg.b.sunAz + 30, p);
  const ang = cfg.ang + p * 0.6;
  const R = lerp(200, 160, smoother(p)), Y = lerp(120, 95, smoother(p));
  const ld = cfg.load ? lerp(cfg.load[0], cfg.load[1], t2) : 1e5;
  return (
    <Stage>
      <Lights look={look} center={[0, 0, 0]} size={150} frame={f * 6} />
      <Cam pos={[Math.sin(ang) * R, Y, Math.cos(ang) * R]} look={[0, 4, 0]} fov={44} />
      <City seed={7} near={3} far={8} night={lerp(cfg.night[0], cfg.night[1], t2)} lamps={cfg.lamps * (cfg.night[1] > cfg.night[0] ? t2 : 1 - t2)} f={f * 4} load={[0, 0, ld]} />
      <Traffic f={f * 3} n={40} seed={13} span={300} lights={cfg.night[0] > 0.5 || cfg.night[1] > 0.5 ? 1 : 0} />
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 5: second player
export const L42Stranger: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L42_stranger');
  const clone = useMemo(() => randomLook(950, { shirt: '#9aa0a8', pants: '#4a4e69', hairStyle: 'short', hair: '#151515' }), []);
  const R = 5, cx = -26, cz = -20;
  const zz = (t: number) => ({ x: cx - 2 + Math.sin(t * 2.2) * 3.2, z: cz + 7 - t * 3.2 });
  const t = f / 30;
  const jumpAt = k.w(546) - 4;
  const p = zz(Math.min(t, (jumpAt) / 30));
  const onBench = f >= jumpAt;
  const jt = clamp((f - jumpAt) / 14);
  const bx = cx - 3.2, bz = cz - 2;
  const px = onBench ? lerp(p.x, bx, jt) : p.x, pz = onBench ? lerp(p.z, bz, jt) : p.z;
  const py = onBench ? 0.16 + Math.sin(jt * Math.PI) * 0.9 + jt * 0.45 : 0.16;
  const dir = Math.atan2(zz(t + 0.05).x - p.x, zz(t + 0.05).z - p.z);
  const c = camK(f, [{ f: 0, p: [-18, 3.4, -9.5], l: [-26.5, 1.0, -19.5], fov: 40 }, { f: k.dur, p: [-19.5, 3.0, -11.5], l: [-27.5, 1.1, -20.5], fov: 38 }], (t2) => t2);
  return (
    <Stage>
      <Lights look={DAY} center={[-26, 0, -20]} size={18} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Bench pos={[bx, 0.16, bz]} rotY={Math.PI / 2} />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (f / 30) * (1.25 / R) + (i / 6) * Math.PI * 2;
        return <Person key={i} look={clone} pos={[cx + Math.cos(a) * R, 0.16, cz + Math.sin(a) * R]} rotY={Math.atan2(-Math.sin(a), Math.cos(a))} pose={merge(walk((f / 30) * 1.25 / 0.72 * Math.PI, 1), EXPR.neutral)} />;
      })}
      <Person look={P2()} pos={[px, py, pz]} rotY={onBench ? (jt < 1 ? dir : 0.8) : dir} pose={merge(onBench && jt >= 1 ? merge(idle(f, 3), { head: [0, Math.sin(f * 0.15) * 0.6, 0] }) : run(t * 9), EXPR.grin)} />
      <Person look={HERO()} pos={[-20.5, 0.16, -13]} rotY={-2.3} pose={merge(idle(f, 5), EXPR.confused)} />
    </Stage>
  );
};
export const L43Chat: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L43_chat');
  const msg = k.w(556) - 3;
  const c = camK(f, [{ f: 0, p: [-28.4, 2.0, -18.6], l: [-29.2, 2.0, -22], fov: 40 }, { f: k.dur, p: [-28.6, 2.1, -19.4], l: [-29.2, 2.2, -22], fov: 36 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[-29, 0, -22]} size={12} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Bench pos={[-29.2, 0.16, -22]} rotY={Math.PI / 2} />
      <Person look={P2()} pos={[-29.2, 0.61, -22]} rotY={0.25} pose={merge(idle(f, 3), f >= msg ? EXPR.grin : EXPR.happy, { armR: f >= msg ? [2.6 + Math.sin(f * 0.4) * 0.2, -0.2, 0.3] : [0.2, 0.1, 0.2] })} />
      {f >= msg && <Label text="Эй! Ты тоже настоящий?" pos={[-29.2, 3.05, -22]} h={0.2 * pop(f, msg, 7)} bg="rgba(20,24,60,0.92)" fg="#7dffb0" />}
    </Stage>
  );
};
export const L44Players: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L44_players');
  const pull = k.w(578);
  const ppl = useMemo(() => Array.from({ length: 14 }).map((_, i) => ({ look: randomLook(1200 + i), a: [-34 + (i % 4) * 2.2, -36 + i * 2.6], sp: 0.9 + (i % 3) * 0.15, q: i % 5 === 2 })), []);
  const c = f < pull
    ? camK(f, [{ f: 0, p: [-23.5, 1.7, -17.2], l: [-25.2, 1.55, -19.6], fov: 36 }, { f: pull, p: [-23.2, 1.75, -17.8], l: [-25.2, 1.6, -19.6], fov: 34 }], (t) => t)
    : camK(f - pull, [{ f: 0, p: [-23.2, 1.75, -17.8], l: [-25.2, 1.6, -19.6], fov: 34 }, { f: k.dur - pull, p: [-12, 14, -2], l: [-28, 0.5, -24], fov: 44 }]);
  const qOn = k.w(587);
  return (
    <Stage>
      <Lights look={DAY} center={[-26, 0, -20]} size={30} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Person look={P2()} pos={[-25.6, 0.16, -20.2]} rotY={0.7} pose={merge(idle(f, 3), EXPR.grin, { armR: [0.9, 0.3, 0.9 + Math.sin(f * 0.2) * 0.3] })} />
      <Person look={HERO()} pos={[-24.4, 0.16, -19.0]} rotY={-2.4} pose={merge(idle(f, 5), f > k.w(575) ? EXPR.shock : EXPR.confused)} />
      <Label text="ИГРОК 2" pos={[-25.6, 2.35, -20.2]} h={0.12 * pop(f, k.w(566), 7)} bg="rgba(20,120,60,0.9)" />
      <Label text="ИГРОК 1 (ТЫ)" pos={[-24.4, 2.35, -19.0]} h={0.12 * pop(f, k.w(566) + 8, 7)} bg="rgba(30,80,170,0.9)" />
      {f >= pull && ppl.map((p, i) => {
        const w = walkPath(f + 40 - i * 8, p.a, [p.a[0] + 3, p.a[1] + 40], p.sp, 0, i);
        return (
          <group key={i}>
            <Person look={p.look} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, i), w.pose)} />
            {p.q && f >= qOn && <Label text="?" pos={[w.pos[0], 2.4, w.pos[2]]} h={0.35 * pop(f, qOn + i, 7)} bg="rgba(20,24,60,0.85)" fg="#ffd23f" />}
          </group>
        );
      })}
    </Stage>
  );
};
export const L45Jump: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L45_jump');
  const jump = k.w(599), dead = k.w(605), back = k.w(611) - 2;
  const t = Math.max(0, (f - jump) / 30);
  const p2y = f < jump ? 2.72 : Math.max(0, 2.72 + 2.6 * t - 4.9 * t * t);
  const p2z = f < jump ? 1.5 : 1.5 + Math.min(t, 0.85) * 3.6;
  const landed = f >= jump && p2y <= 0.001;
  const gone = f >= dead && f < back;
  const c = camK(f, [{ f: 0, p: [4.5, 1.8, 12], l: [0, 2.0, 2], fov: 44 }, { f: jump, p: [4.0, 1.7, 11.5], l: [0, 2.2, 2], fov: 42 }, { f: back, p: [3.4, 1.65, 10.4], l: [0.2, 1.4, 4], fov: 42 }, { f: k.dur, p: [2.4, 1.6, 9.0], l: [0.4, 1.4, 5], fov: 38 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 2]} size={16} />
      <Cam {...c} />
      <Grass />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5]} receiveShadow material={mat('#8a8f96', { r: 0.95 })}><planeGeometry args={[30, 5]} /></mesh>
      <Garages n={5} pos={[0, 0, 0]} />
      {!gone && f < back && <Person look={P2()} pos={[0, landed ? 0 : p2y, p2z]} rotY={0} pose={landed ? merge(EXPR.dumb2, { body: [1.2, 0, 0], y: -0.6, armL: [0.6, 1.2, 0], armR: [0.6, 1.2, 0] }) : merge(f < jump ? merge(idle(f, 3), EXPR.grin) : { ...EXPR.shock, armL: [2.8, 0.5, 0.2], armR: [2.8, 0.5, 0.2], legL: 0.4, legR: -0.2 })} />}
      {f >= dead && f < dead + 18 && <Smoke pos={[0, 0.2, p2z]} f={f - dead} n={10} h={2} s={1.2} color="#ffffff" o={0.8} seed={3} />}
      {f >= back && (
        <group>
          <Person look={P2()} pos={[1.4, 0, 5.6]} rotY={0.6} pose={merge(idle(f, 3), ANGRY, { armL: [0.5, 0.2, -0.6], armR: [0.5, 0.2, -0.6] })} />
          <Smoke pos={[1.4, 2.0, 5.6]} f={f - back} n={8} h={1.4} s={0.6} color="#ffffff" o={0.6} seed={9} />
          {f < back + 14 && <Glow pos={[1.4, 1.0, 5.6]} s={3 * (1 - (f - back) / 14)} color="#7dffb0" />}
        </group>
      )}
      <Person look={HERO()} pos={[2.6, 0, 6.2]} rotY={-0.9} pose={merge(idle(f, 5), f >= dead && f < back ? EXPR.shock : f >= back ? EXPR.confused : EXPR.neutral, { head: [f < jump ? -0.35 : 0, 0, 0] })} />
    </Stage>
  );
};
export const L46Lives: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L46_lives');
  const q = k.w(626);
  const c = camK(f, [{ f: 0, p: [2.4, 1.6, 9.0], l: [1.8, 1.4, 5.6], fov: 40 }, { f: k.dur, p: [3.6, 2.4, 12.5], l: [1.8, 1.6, 5.6], fov: 44 }]);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 4]} size={16} />
      <Cam {...c} />
      <Grass />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5]} receiveShadow material={mat('#8a8f96', { r: 0.95 })}><planeGeometry args={[30, 5]} /></mesh>
      <Garages n={5} pos={[0, 0, 0]} />
      <Person look={P2()} pos={[1.4, 0, 5.6]} rotY={0.6} pose={merge(idle(f, 3), EXPR.confused, { armR: [1.0, 0.2, 1.4] })} />
      <Person look={HERO()} pos={[2.6, 0, 6.2]} rotY={-0.9} pose={merge(idle(f, 5), EXPR.confused, { head: [0, 0, 0.12] })} />
      {f >= q && <Label text="ЖИЗНИ: ?" pos={[2.0, 2.6, 5.9]} h={0.3 * pop(f, q, 8)} bg="rgba(120,10,30,0.9)" fg="#ffffff" />}
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 7: saves
export const L47Save: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L47_save');
  const fl = k.w(641) - 3;
  const c = camK(f, [{ f: 0, p: [0.6, 1.6, 3.6], l: [0.2, 1.45, 0], fov: 40 }, { f: k.dur, p: [0.4, 1.6, 2.7], l: [0.3, 1.5, 0], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 1, 0]} size={8} />
      <Cam {...c} />
      <group position={[20, -0.16, 30]}><City seed={7} near={3} far={6} /></group>
      <Person look={HERO()} pos={[0, 0, 0]} rotY={0.2} pose={merge(idle(f, 2), f >= fl ? EXPR.grin : EXPR.confused, { armR: f >= fl ? [0.9, 0.6, 1.3] : [0.2, 0.1, 0.2], armL: [0.1, 0.1, 0.2] })} />
      {f >= fl && <Floppy pos={[0.85, 1.7 + Math.sin(f * 0.1) * 0.05, 0.2]} s={0.75 * pop(f, fl, 9)} rot={f * 0.05} />}
      {f >= fl && <Glow pos={[0.85, 1.7, 0.2]} s={1.6} color="#7db8ff" o={0.4} />}
    </Stage>
  );
};
export const L48Mug: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L48_mug');
  const load = k.cue('load1');
  const dropAt = 4;
  const tt = f < load ? f : Math.max(dropAt, load - (f - load) * 2.2);
  const t = Math.max(0, (tt - dropAt) / 30);
  const y = Math.max(0.06, 1.05 - 4.9 * t * t);
  const broken = y <= 0.07;
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={6} noSky />
      <Cam pos={[1.0, 1.35, 1.9]} look={[0, 0.9, 0]} fov={42} />
      <group position={[0, 0, 2.3]}><Kitchen f={f} /></group>
      <Person look={HERO()} pos={[-0.25, 0, -0.2]} rotY={0.4} pose={merge(broken ? EXPR.shock : EXPR.happy, { armR: [tt < dropAt ? 1.0 : 0.6, 0.2, 0.6] })} />
      {broken
        ? [0, 1, 2, 3].map((i) => <mesh key={i} position={[0.15 + Math.cos(i * 1.7) * 0.15, 0.04, 0.35 + Math.sin(i * 1.7) * 0.15]} rotation={[i, i * 2, 0]} material={mat('#e74c3c', { r: 0.4 })}><boxGeometry args={[0.07, 0.03, 0.05]} /></mesh>)
        : <mesh position={[0.15, y, 0.35]} rotation={[t * 4, 0, t * 2]} material={mat('#e74c3c', { r: 0.4 })} castShadow><cylinderGeometry args={[0.06, 0.05, 0.12, 16]} /></mesh>}
    </Stage>
  );
};
export const L49Bus: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L49_bus');
  const load = k.cue('load2');
  const tt = f < load ? f : Math.max(0, load - (f - load) * 2.5);
  const bx = 2 + Math.max(0, tt - 2) * Math.max(0, tt - 2) * 0.014;
  const hx = -6 + tt * 0.09;
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 0]} size={20} />
      <Cam pos={[-2, 2.2, 13]} look={[0.5, 1.4, 1]} fov={46} />
      <group position={[0, -0.16, -9]}><City seed={7} near={3} far={6} /></group>
      <Car kind="bus" color="#e74c3c" pos={[bx, 0, 1.75]} rotY={Math.PI / 2} dist={bx} />
      <Person look={HERO()} pos={[hx, 0, 4.4]} rotY={Math.PI / 2} pose={merge(run((tt / 30) * 9), f < load ? EXPR.shock : EXPR.happy, { armR: [2.4, 0.2, 0.2] })} />
    </Stage>
  );
};
export const L50Exam: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L50_exam');
  const sv = k.w(649) - 3;
  const board = useScreen(768, 576, 'exam', (g, w, h) => {
    g.fillStyle = '#2f4f3a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4f4ec'; g.font = '800 92px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('ЭКЗАМЕН', w / 2, h / 2 - 50); g.font = '700 56px Montserrat'; g.fillText('Вариант 1', w / 2, h / 2 + 60);
  });
  const c = camK(f, [{ f: 0, p: [1.8, 1.5, 0.6], l: [-0.2, 1.2, -3.2], fov: 46 }, { f: k.dur, p: [1.5, 1.45, 0.2], l: [0, 1.2, -3.2], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, hemiI: 0.6 }} center={[0, 1, -3]} size={8} noSky />
      <Cam {...c} />
      <Classroom f={f} boardTex={board} qFrom={1e9} />
      <Person look={HERO()} pos={[0.2, 0, -1.2]} rotY={Math.PI - 0.6} pose={merge(idle(f, 3), f >= sv ? EXPR.grin : EXPR.confused, { armR: f >= sv ? [0.9, 0.6, 1.3] : [0.2, 0.1, 0.2] })} />
      {f >= sv && <Floppy pos={[0.85, 1.8, -1.0]} s={0.6 * pop(f, sv, 9)} rot={f * 0.05} />}
    </Stage>
  );
};
export const L51Best: React.FC = () => {
  const f = useCurrentFrame();
  const coins = useMemo(() => { const r = rng(8); return Array.from({ length: 26 }).map(() => [(r() - 0.5) * 1.2, r() * 0.4, (r() - 0.5) * 1.0 + 0.4, r() * 6]); }, []);
  const c = camK(f, [{ f: 0, p: [1.9, 1.4, 4.6], l: [0.4, 1.0, 0], fov: 42 }, { f: 74, p: [1.5, 1.45, 3.9], l: [0.4, 1.05, 0], fov: 40 }], (t) => t);
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
/** fact: average reaction ≈ 0.25 s */
export const L52Reaction: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L52_reaction');
  const go = k.w(659) - 6, press = go + 8, replay = k.w(668);
  const state = f < go ? 0 : f < press ? 1 : f < replay ? 2 : 3;
  const scr = useScreen(800, 450, 'react' + state, (g, w, h) => {
    g.fillStyle = ['#b3122a', '#18a84a', '#13203f', '#1d3f8f'][state]; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 120px Montserrat';
    g.fillText(['ЖДИ…', 'ЖМИ!', '0,25 с', '↺ ЕЩЁ РАЗ'][state], w / 2, h / 2 - (state === 2 ? 30 : 0));
    if (state === 2) { g.font = '700 44px Montserrat'; g.fillText('средняя реакция человека', w / 2, h / 2 + 80); }
  });
  const pr = f >= press - 3 && f < press + 6 ? 1 : 0;
  const c = camK(f, [{ f: 0, p: [0.9, 1.6, 3.0], l: [-0.9, 1.45, -1.2], fov: 46 }, { f: k.dur, p: [0.6, 1.55, 2.3], l: [-0.8, 1.5, -1.2], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, hor: '#2c3e6b', top: '#0f1530' }} center={[0, 1, 0]} size={6} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#1d2442', { r: 0.9 })}><circleGeometry args={[20, 48]} /></mesh>
      <Screen tex={scr} w={2.4} h={1.35} pos={[0, 2.0, -1.6]} frame="#111" />
      <mesh position={[0.35, 0.5, 0.15]} material={mat('#2d3436', { r: 0.5 })} castShadow><cylinderGeometry args={[0.18, 0.24, 1.0, 20]} /></mesh>
      <group position={[0.35, 1.02, 0.15]}><RedButton s={0.32} press={pr} /></group>
      <Person look={HERO()} pos={[-0.15, 0, 0.5]} rotY={Math.PI - 0.3} pose={merge(idle(f, 3), state === 1 || state === 2 ? EXPR.shock : state === 3 ? EXPR.grin : EXPR.confused, { armR: pr ? [1.3, -0.2, 0.3] : [0.7, -0.1, 0.5] })} />
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 14: patch
const CleanStreet: React.FC<{ f: number; look?: any; n?: number }> = ({ f, look = LOOKS.morning, n = 12 }) => {
  const ppl = useMemo(() => STREET_PPL(1300, n), [n]);
  return (
    <>
      <City seed={7} near={3} far={8} f={f} />
      <Traffic f={f + 100} n={16} seed={17} axis="z" />
      {ppl.map((p, i) => { const w = walkPath(f + 120 - i * 10, p.a, [p.a[0], p.a[1] + 60], p.sp, 0, i); return <Person key={i} look={p.look} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, i), w.pose, EXPR.happy)} />; })}
    </>
  );
};
export const L53Fixed: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L53_fixed');
  const c = camK(f, [{ f: 0, p: [7.6, 2.2, 16], l: [9.6, 1.6, -6], fov: 46 }, { f: k.dur, p: [7.7, 1.9, 10.5], l: [9.8, 1.6, -6], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.morning, sunEl: 26 }} center={[8, 0, 0]} size={30} frame={f} />
      <Cam {...c} />
      <CleanStreet f={f} />
      <Birds f={f} center={[8, 20, -20]} n={7} speed={0.2} />
    </Stage>
  );
};
const patchTex = () => canvasTex('patch11', 2048, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a0f5c'); gr.addColorStop(1, '#0f3a6b');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#21f0ff'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = '#ffd23f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 170px Montserrat';
  g.fillText('ОБНОВЛЕНИЕ 1.1', w / 2, h / 2 - 70);
  g.fillStyle = '#ffffff'; g.font = '800 110px Montserrat'; g.fillText('Исправлены ошибки', w / 2, h / 2 + 110);
});
export const L54Patch: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L54_patch');
  const show = k.w(696) - 8;
  const tex = patchTex();
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, fog: false }), [tex]);
  m.opacity = clamp((f - show) / 12);
  const c = camK(f, [{ f: 0, p: [7.6, 1.6, 6], l: [8.6, 1.6, 0], fov: 42 }, { f: show, p: [7.2, 1.4, 7], l: [3, 30, -60], fov: 52 }, { f: k.dur, p: [7.0, 1.3, 7.5], l: [1.5, 42, -70], fov: 54 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.morning, sunEl: 28 }} center={[8, 0, 0]} size={30} frame={f} />
      <Cam {...c} />
      <CleanStreet f={f} n={6} />
      <Person look={HERO()} pos={[8.6, 0.16, 0]} rotY={Math.PI - 0.3} pose={merge(idle(f, 2), f > show ? EXPR.shock : EXPR.happy, { head: [f > show ? -0.45 : 0, 0, 0] })} />
      <mesh position={[0, 62 + Math.sin(f * 0.03) * 0.6, -90]} rotation={[0.45, 0, 0]} material={m} scale={[1 + 0.03 * pop(f, show, 10), 1, 1]}><planeGeometry args={[52, 13]} /></mesh>
      {f >= show && <Glow pos={[0, 62, -92]} s={90} color="#7b5cff" o={0.25 * m.opacity} />}
    </Stage>
  );
};
export const L55NoLoad: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L55_noload');
  const face = k.w(716) - 2;
  if (f < face) {
    return (
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(8px) brightness(0.5)', transform: 'scale(1.06)' }}>
        <Stage>
          <Lights look={LOOKS.morning} center={[0, 0, 0]} size={60} frame={f} />
          <Cam pos={[3, 14, 70 - f * 0.03]} look={[0, 6, -20]} fov={44} />
          <City seed={7} near={3} far={8} />
        </Stage>
      </div>
    );
  }
  const g = f - face;
  return (
    <Stage>
      <Lights look={{ ...LOOKS.morning, sunEl: 28 }} center={[8, 0, 0]} size={10} frame={f} />
      <Cam pos={[8.75, 1.62, 1.3 - g * 0.002]} look={[8.6, 1.75, 0]} fov={34} />
      <City seed={7} near={3} far={6} />
      <Person look={HERO()} pos={[8.6, 0.16, 0]} rotY={0} pose={merge(EXPR.shock, { head: [-0.25, 0, 0], eyeA: [0, 0.025], eyeB: [0, 0.025], brows: [-0.2, 0.2, 0.02] })} />
    </Stage>
  );
};
/** fact: games get updates for years — patch notes on a floating screen */
export const L56Updates: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L56_updates');
  const lines = [
    ['v1.0', 'Мир запущен', '#ffffff'],
    ['v1.1', '✓ Машины не застревают в стенах', '#7dffb0'],
    ['v1.1', '✓ Прохожие больше не ходят по кругу', '#7dffb0'],
    ['v1.2', '+ Новые квесты и магазины', '#21f0ff'],
    ['v1.3', '+ Погода и времена года', '#21f0ff'],
    ['v1.4', '− Удалено: сохранения', '#ff6b6b'],
    ['v1.4', '− Удалено: кнопка «Загрузить»', '#ff6b6b'],
  ];
  const shown = Math.min(lines.length, Math.floor(f / (k.dur / (lines.length + 1))) + 1);
  const scr = useScreen(1024, 640, 'notes' + shown, (g, w, h) => {
    g.fillStyle = '#0d1430'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd23f'; g.font = '900 54px Montserrat'; g.fillText('СПИСОК ИЗМЕНЕНИЙ', 40, 72);
    g.fillStyle = '#21f0ff'; g.fillRect(40, 92, w - 80, 4);
    lines.slice(0, shown).forEach(([v, t, c], i) => {
      g.fillStyle = '#7b8bbf'; g.font = '700 34px Montserrat'; g.fillText(v, 40, 160 + i * 66);
      g.fillStyle = c; g.font = '800 38px Montserrat'; g.fillText(t, 150, 160 + i * 66);
    });
  });
  const c = camK(f, [{ f: 0, p: [-0.4, 1.8, 5.0], l: [0.3, 1.8, 0], fov: 42 }, { f: k.dur, p: [0.9, 1.85, 4.2], l: [0.4, 1.85, 0], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, hor: '#2c3e6b', top: '#0f1530' }} center={[0, 1, 0]} size={6} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#1d2442', { r: 0.9 })}><circleGeometry args={[20, 48]} /></mesh>
      <Screen tex={scr} w={3.2} h={2.0} pos={[1.3, 2.0 + Math.sin(f * 0.04) * 0.04, 0]} frame="#111" />
      <Glow pos={[1.3, 2.0, -0.2]} s={6} color="#21f0ff" o={0.18} />
      <Person look={HERO()} pos={[-0.9, 0, 1.3]} rotY={0.7} pose={merge(idle(f, 3), shown >= 6 ? EXPR.sad : EXPR.confused, { head: [-0.1, 0, 0] })} />
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 21: cheaters
export const L57Flyer: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L57_flyer');
  const flyer = useMemo(() => randomLook(1400, { shirt: '#e74c3c', pants: '#2d3436', hairStyle: 'short' }), []);
  const x = lerp(-55, 45, f / k.dur);
  return (
    <Stage>
      <Lights look={DAY} center={[8, 0, 0]} size={40} frame={f} />
      <Cam pos={[8.6, 1.5, 8]} look={[lerp(-14, 12, f / k.dur), 12, -8]} fov={52} />
      <CleanStreet f={f} n={6} />
      <group position={[x * 0.5, 13 + Math.sin(f * 0.08) * 0.5, -8]} rotation={[0, Math.PI / 2, 0]} scale={[2.6, 2.6, 2.6]}>
        <group rotation={[Math.PI / 2 * 0.92, 0, 0]} position={[0, -0.9, 0]}>
          <Person look={flyer} blob={false} pose={merge(EXPR.grin, { armL: [2.9, 0.1, 0.3], armR: [0.3, 0.1, 0.4], legL: 0.1, legR: -0.1, head: [-1.0, 0, 0] })} />
        </group>
      </group>
      <Person look={HERO()} pos={[8.6, 0.16, 2]} rotY={Math.PI} pose={merge(idle(f, 2), EXPR.shock, { head: [-0.5, 0, 0] })} />
    </Stage>
  );
};
export const L58Money: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L58_money');
  const rich = useMemo(() => randomLook(1410, { shirt: '#f5c542', pants: '#2d3436', hairStyle: 'curly', glasses: true }), []);
  const tag = k.w(763) - 2;
  const ppl = useMemo(() => [0, 1, 2, 3].map((i) => ({ look: randomLook(1420 + i), a: -1.2 + i * 0.8 })), []);
  const coins = useMemo(() => { const r = rng(14); return Array.from({ length: 40 }).map(() => [r() * 6.28, 2.5 + r() * 2.5, r() * 30, r()]); }, []);
  const c = camK(f, [{ f: 0, p: [3.5, 2.0, 7], l: [8.6, 1.4, -3], fov: 44 }, { f: k.dur, p: [4.8, 2.2, 4.2], l: [8.6, 1.6, -3], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[8, 0, -3]} size={16} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <Person look={rich} pos={[8.6, 0.16, -3]} rotY={-0.6} pose={merge(EXPR.grin, { armL: [1.8 + Math.sin(f * 0.3) * 0.3, 0.5, 0.6], armR: [1.8 + Math.cos(f * 0.3) * 0.3, 0.5, 0.6] })} />
      {coins.map(([a, v, off, s], i) => {
        const t = (((f + off) % 30) / 30);
        const x = 8.6 + Math.cos(a) * t * 2.2, y = 1.6 + v * t - 4.9 * t * t, z = -3 + Math.sin(a) * t * 2.2;
        return y > 0.18 ? <mesh key={i} position={[x, y, z]} rotation={[f * 0.3 + s * 6, s, 0]} material={mat('#f5c542', { r: 0.25, m: 0.9, e: '#7a5a00', ei: 0.3 })}><cylinderGeometry args={[0.07, 0.07, 0.016, 16]} /></mesh> : null;
      })}
      <Glow pos={[8.6, 1.8, -3]} s={3.5} color="#ffd23f" o={0.35} />
      {ppl.map((p, i) => <Person key={i} look={p.look} pos={[8.6 + Math.cos(p.a + 1.8) * 2.2, 0.16, -3 + Math.sin(p.a + 1.8) * 2.2]} rotY={Math.atan2(-Math.cos(p.a + 1.8), -Math.sin(p.a + 1.8))} pose={merge(idle(f, i), EXPR.happy, { armR: [1.8 + Math.sin(f * 0.2 + i) * 0.3, 0.2, 0.4] })} />)}
      {f >= tag && <Label text="ЧИТЕР" pos={[8.6, 2.5, -3]} h={0.24 * pop(f, tag, 7)} bg="rgba(190,10,30,0.92)" />}
    </Stage>
  );
};
const boardTex = () => canvasTex('banboard', 1024, 768, (g, w, h) => {
  g.fillStyle = '#b8895a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f7f3e8'; g.save(); g.translate(w / 2, h / 2); g.rotate(-0.02); g.fillRect(-420, -320, 840, 640);
  g.fillStyle = '#b3122a'; g.textAlign = 'center'; g.font = '900 70px Montserrat'; g.fillText('НАРУШИТЕЛИ', 0, -210); g.fillText('ЗАБЛОКИРОВАНЫ', 0, -130);
  [-190, 190].forEach((x, i) => {
    g.fillStyle = '#d9d4c7'; g.fillRect(x - 130, -70, 260, 300);
    g.fillStyle = '#6b6b6b'; g.beginPath(); g.arc(x, 20, 60, 0, Math.PI * 2); g.fill(); g.fillRect(x - 90, 90, 180, 140);
    g.strokeStyle = '#b3122a'; g.lineWidth = 18; g.beginPath(); g.moveTo(x - 120, -60); g.lineTo(x + 120, 220); g.moveTo(x + 120, -60); g.lineTo(x - 120, 220); g.stroke();
    g.fillStyle = '#222'; g.font = '800 36px Montserrat'; g.fillText(i ? 'богатый' : 'летающий', x, 280);
  });
  g.restore();
});
export const L60Banned: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L60_banned');
  const tex = boardTex();
  const bm = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  const push = k.w(784);
  const c = f < push
    ? camK(f, [{ f: 0, p: [3.0, 2.4, 14], l: [9, 1.6, -4], fov: 44 }, { f: push, p: [3.6, 2.2, 12], l: [9, 1.6, -4], fov: 42 }], (t) => t)
    : camK(f - push, [{ f: 0, p: [8.0, 1.7, 1.6], l: [9.6, 1.6, -1.0], fov: 40 }, { f: k.dur - push, p: [8.6, 1.65, 0.3], l: [9.7, 1.6, -1.0], fov: 36 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.morning, sunEl: 22 }} center={[8, 0, -2]} size={20} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={6} />
      <group position={[9.8, 0.16, -1.0]} rotation={[0, -0.9, 0]}>
        {[-0.75, 0.75].map((x) => <mesh key={x} position={[x, 0.9, 0]} material={mat('#4a3020', { r: 0.8 })} castShadow><boxGeometry args={[0.08, 1.8, 0.08]} /></mesh>)}
        <mesh position={[0, 1.55, 0.05]} material={bm} castShadow><boxGeometry args={[1.6, 1.2, 0.04]} /></mesh>
      </group>
      <Person look={HERO()} pos={[7.6, 0.16, 0.6]} rotY={-2.1} pose={merge(idle(f, 2), f > k.w(792) ? EXPR.shock : EXPR.confused, { head: [f > k.w(796) ? -0.35 : 0, f > k.w(796) ? 0.3 : 0, 0] })} />
    </Stage>
  );
};
export const L61Clip: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L61_clip');
  const through = k.w(817);
  const ang = 0.35;
  const sp = 0.035;
  const d = f * sp;
  const x = -4 + d * Math.cos(ang), z = 2.2 - d * Math.sin(ang) * (f < through ? 1 : 1.0);
  const inside = z < 0.35 && z > -0.35;
  const glitch = inside ? (hash(f) > 0.5 ? 0.06 : -0.06) : 0;
  const c = camK(f, [{ f: 0, p: [-1.0, 1.8, 7.5], l: [-1.0, 1.1, 0], fov: 46 }, { f: k.dur, p: [1.0, 1.8, 6.5], l: [0.6, 1.1, 0], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, 0]} size={14} />
      <Cam {...c} />
      <Grass />
      <mesh position={[0, 1.25, 0]} material={mat('#b9b4aa', { r: 0.9 })} castShadow receiveShadow><boxGeometry args={[24, 2.5, 0.25]} /></mesh>
      {Array.from({ length: 12 }).map((_, i) => <mesh key={i} position={[-11 + i * 2, 1.25, 0.13]} material={mat('#a39e94', { r: 0.9 })}><boxGeometry args={[0.06, 2.5, 0.01]} /></mesh>)}
      <group position={[0, -0.16, -40]}><City seed={7} near={2} far={5} /></group>
      <Person look={HERO()} pos={[x + glitch, 0, z]} rotY={Math.PI / 2 + ang} pose={merge(walk((f / 30) * 1.0 / 0.72 * Math.PI, 1), f >= through ? EXPR.shock : EXPR.confused)} />
      {inside && <Glow pos={[x, 1.0, 0.15]} s={2.2} color="#ff2bd6" o={0.5} />}
    </Stage>
  );
};
export const L62Speedrun: React.FC = () => {
  const f = useCurrentFrame();
  const z = 70 - f * 0.48;
  const ph = (f / 30) * 16;
  return (
    <Stage>
      <Lights look={DAY} center={[0, 0, z]} size={30} frame={f} />
      <Cam pos={[-3.0, 1.4, z + 4.2]} look={[0.6, 1.0, z - 4]} fov={56} />
      <City seed={7} near={3} far={7} />
      <Traffic f={f + 60} n={14} seed={23} axis="x" />
      <Person look={HERO()} pos={[0.6, 0.16, z]} rotY={Math.PI} pose={merge(run(ph), EXPR.grin, { body: [0.35, 0, 0] })} />
      {[1, 2, 3].map((i) => <mesh key={i} position={[0.6, 1.0, z + i * 0.9]} material={basic('#21f0ff', { t: 0.12 / i, add: true })}><boxGeometry args={[0.5, 1.5, 0.6]} /></mesh>)}
    </Stage>
  );
};

// ------------------------------------------------------------------ DAY 30: menu
export const L63Menu: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'blur(8px) brightness(0.5)', transform: 'scale(1.06)' }}>
      <Stage>
        <Lights look={LOOKS.dusk} center={[0, 0, 0]} size={60} frame={f} />
        <Cam pos={[3, 14, 70 - f * 0.03]} look={[0, 6, -20]} fov={44} />
        <City seed={7} near={3} far={8} night={0.8} lamps={1} />
      </Stage>
    </div>
  );
};
export const L64Confirm: React.FC = () => {
  const f = useCurrentFrame();
  const c = camK(f, [{ f: 0, p: [0.1, 1.68, 1.25], l: [0, 1.62, 0], fov: 36 }, { f: 121, p: [0.05, 1.66, 0.95], l: [0, 1.62, 0], fov: 34 }], (t) => t);
  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'brightness(0.7)' }}>
      <Stage>
        <Lights look={LOOKS.dusk} center={[0, 1, 0]} size={6} frame={f} />
        <Cam {...c} />
        <group position={[-8.6, -0.16, -10]}><City seed={7} near={3} far={6} night={0.8} lamps={1} /></group>
        <Person look={HERO()} pose={merge(EXPR.confused, { head: [0.05, Math.sin(f * 0.05) * 0.15, 0.08], eyeA: [-0.02, -0.01], eyeB: [-0.02, -0.01], armR: [1.4, -0.1, 1.0] })} />
      </Stage>
    </div>
  );
};

// ------------------------------------------------------------------ simulation
export const L65Lab: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L65_lab');
  const sci = useMemo(() => [0, 1, 2].map((i) => randomLook(1000 + i, { coat: 'lab', glasses: i !== 1 })), []);
  const c = camK(f, [{ f: 0, p: [0.4, 2.3, 6.4], l: [0, 1.3, 0], fov: 40 }, { f: k.dur, p: [2.0, 2.1, 4.8], l: [0, 1.35, 0], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, sunI: 0.8, hemiI: 0.4, hor: '#0f2a4a', top: '#050a18' }} center={[0, 1, 0]} size={6} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#141c2b', { r: 0.8 })}><circleGeometry args={[12, 48]} /></mesh>
      <mesh position={[0, 0.45, 0]} material={mat('#2a3550', { r: 0.4, m: 0.4 })} castShadow><cylinderGeometry args={[1.0, 1.1, 0.9, 32]} /></mesh>
      <mesh position={[0, 0.91, 0]} material={basic('#2ef2ff', { t: 0.6 })}><cylinderGeometry args={[0.95, 0.95, 0.02, 32]} /></mesh>
      <group position={[0, 1.75, 0]} rotation={[0.3, f * 0.012, 0]}>
        <mesh material={useMemo(() => new THREE.MeshBasicMaterial({ color: '#2ef2ff', wireframe: true, transparent: true, opacity: 0.6 }), [])}><sphereGeometry args={[0.62, 20, 14]} /></mesh>
      </group>
      <group position={[0, 1.75, 0]}><Earth rot={f * 0.012} r={0.55} sun={[1, 0.3, 0.5]} night={0} /></group>
      <Glow pos={[0, 1.75, 0]} s={1.8} color="#2ef2ff" o={0.35} />
      <pointLight position={[0, 1.7, 0]} intensity={12} distance={5} color="#5ef0ff" />
      {sci.map((l, i) => { const a = -0.9 + i * 0.9 + Math.PI; return <Person key={i} look={l} pos={[Math.sin(a) * 1.7, 0, Math.cos(a) * 1.7 + (i === 1 ? 0 : 0.2)]} rotY={a + Math.PI} pose={merge(idle(f, i), EXPR.confused, { armR: [1.1 + Math.sin(f * 0.1 + i) * 0.3, 0.2, 0.8] })} />; })}
    </Stage>
  );
};
export const L66Sim: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L66_sim');
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
export const L67Bostrom: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L67_bostrom');
  const stage = f < k.w(890) - 4 ? 0 : 1;
  const board = useScreen(1024, 768, 'bost' + stage, (g, w, h) => {
    g.fillStyle = '#23352b'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 30; i++) g.fillRect((i * 97) % w, (i * 53) % h, 200, 3);
    g.fillStyle = '#f4f4ec'; g.textAlign = 'center'; g.font = '900 210px Montserrat'; g.fillText('2003', w / 2, 290);
    if (stage) { g.font = '800 64px Montserrat'; g.fillText('АРГУМЕНТ', w / 2, 450); g.fillText('О СИМУЛЯЦИИ', w / 2, 530); g.font = '700 46px Montserrat'; g.fillStyle = '#ffd23f'; g.fillText('если → то → значит?', w / 2, 650); }
  });
  const bm = useMemo(() => new THREE.MeshBasicMaterial({ map: board, toneMapped: false }), [board]);
  const thinker = useMemo(() => randomLook(1500, { shirt: '#5a4632', pants: '#2d3436', hairStyle: 'short', hair: '#8a7a6a', glasses: true }), []);
  const write = Math.sin(f * 0.35) * 0.15;
  const c = camK(f, [{ f: 0, p: [0.8, 1.7, 3.6], l: [0.2, 1.7, -1.2], fov: 44 }, { f: k.dur, p: [0.6, 1.75, 2.9], l: [0.2, 1.8, -1.2], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.6, hemiI: 0.45, hor: '#3b2f2a' }} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <group position={[0, 0, 0.5]}><Room w={8} d={6} h={3.2} wall="#5c4a3d" floor="wood" light={0.8} /></group>
      <mesh position={[0.9, 1.8, -1.6]} material={bm}><planeGeometry args={[3.0, 2.25]} /></mesh>
      <mesh position={[0.9, 0.66, -1.5]} material={mat('#6b4a33', { r: 0.8 })}><boxGeometry args={[3.1, 0.06, 0.15]} /></mesh>
      <Person look={thinker} pos={[-0.3, 0, -0.7]} rotY={Math.PI - 0.35} pose={merge(idle(f, 3), EXPR.neutral, { armR: [1.9 + write, 0.1, 0.6] })} />
    </Stage>
  );
};
/** many simulated worlds; one real one in the centre */
const miniMat = () => new THREE.MeshLambertMaterial({ map: earthDay() });
let _mm: THREE.Material | null = null;
const MINI = () => (_mm ||= miniMat());
const WORLD_POS = (() => {
  const out: number[][] = [];
  for (let x = -9; x <= 9; x++) for (let y = -6; y <= 6; y++) if (x || y) out.push([x * 2.6, y * 2.6, (hash(x * 31 + y) - 0.5) * 2]);
  out.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
  return out;
})();
const Worlds: React.FC<{ f: number; n: number; grow0?: number; hl?: number }> = ({ f, n, hl = -1 }) => (
  <>
    <StarField n={1500} r={700} />
    <directionalLight position={[5, 3, 6]} intensity={2.6} />
    <ambientLight intensity={0.25} />
    <group position={[0, 0, 0]}><Earth rot={f * 0.01} r={1.0} sun={[1, 0.4, 0.8]} night={0.3} /></group>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={basic('#ffd23f', { t: 0.9 })}><torusGeometry args={[1.35, 0.04, 8, 64]} /></mesh>
    {WORLD_POS.slice(0, n).map((p, i) => (
      <mesh key={i} position={p as any} rotation={[0.4, f * 0.01 + i, 0]} material={MINI()} scale={[0.85, 0.85, 0.85]}><sphereGeometry args={[1, 24, 16]} /></mesh>
    ))}
    {hl >= 0 && hl < n && <mesh position={WORLD_POS[hl] as any} rotation={[Math.PI / 2, 0, 0]} material={basic('#ff2bd6', { t: 0.9 })}><torusGeometry args={[1.15, 0.05, 8, 48]} /></mesh>}
  </>
);
export const L68Worlds: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L68_worlds');
  const g0 = k.w(901) - 8;
  const n = f < g0 ? 0 : Math.min(WORLD_POS.length, Math.floor(Math.pow((f - g0) / 6, 1.7)));
  const d = lerp(4.5, 42, smoother(clamp((f - g0 + 10) / (k.dur - g0))));
  return (
    <Stage bg="#02040a">
      <Lights look={LOOKS.space} center={[0, 0, 0]} size={30} shadow={false} noSky noFog />
      <Cam pos={[d * 0.18, d * 0.12, d]} look={[0, 0, 0]} fov={42} />
      <Worlds f={f} n={n} />
      {f >= k.w(911) && <Label text="НАСТОЯЩИЙ" pos={[0, 1.75, 0]} h={0.38 * pop(f, k.w(911), 8) * (d / 20)} bg="rgba(120,90,0,0.9)" fg="#ffffff" />}
    </Stage>
  );
};
export const L69Chance: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L69_chance');
  const hops = [3, 40, 17, 88, 61, 125, 9];
  const hi = Math.min(hops.length - 1, Math.floor(f / 22));
  const hl = hops[hi];
  const tgt = WORLD_POS[hl], prev = hi ? WORLD_POS[hops[hi - 1]] : [0, 0, 0];
  const u = smoother(clamp((f - hi * 22) / 12));
  const t = smoother(clamp(f / k.dur));
  const look = [lerp(prev[0], tgt[0], u), lerp(prev[1], tgt[1], u), 0];
  return (
    <Stage bg="#02040a">
      <Lights look={LOOKS.space} center={[0, 0, 0]} size={30} shadow={false} noSky noFog />
      <Cam pos={[look[0] + 2, look[1] + 1.2, lerp(15, 10, t)]} look={look} fov={42} />
      <Worlds f={f} n={WORLD_POS.length} hl={hl} />
      {u > 0.6 && <Label text="МЫ ЗДЕСЬ?" pos={[tgt[0], tgt[1] + 1.5, tgt[2]]} h={0.5 * pop(f, hi * 22 + 8, 6)} bg="rgba(150,10,120,0.9)" />}
    </Stage>
  );
};
/** fact: Planck length — a "pixel" of the universe: an apple turns into voxels as we zoom */
export const L70Pixels: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L70_pixels');
  const vx = k.w(944) - 4;
  const vox = useMemo(() => {
    const R = 1, s = 0.125, pts: number[][] = [];
    for (let x = -R; x <= R; x += s) for (let y = -R; y <= R; y += s) for (let z = -R; z <= R; z += s) {
      const d = Math.hypot(x, y * 1.08, z);
      if (d <= R && d > R - s * 1.8) pts.push([x, y, z]);
    }
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(s * 0.94, s * 0.94, s * 0.94), new THREE.MeshLambertMaterial({ color: '#d42a2a' }), pts.length);
    const o = new THREE.Object3D(); const col = new THREE.Color();
    pts.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.updateMatrix(); m.setMatrixAt(i, o.matrix); col.set(hash(i) > 0.8 ? '#ff5a4a' : hash(i * 3) > 0.85 ? '#a81818' : '#d42a2a'); m.setColorAt(i, col); });
    m.castShadow = true;
    return m;
  }, []);
  const zoom = smoother(clamp(f / k.dur));
  const camD = lerp(6, 1.9, zoom);
  const grid = clamp((f - vx - 30) / 30);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, hor: '#1a2240', top: '#070a18' }} center={[0, 1, 0]} size={4} frame={f} />
      <Cam pos={[camD * 0.5, 1.2 + camD * 0.15, camD]} look={[0, 1.1, 0]} fov={40} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#1d2442', { r: 0.9 })}><circleGeometry args={[20, 48]} /></mesh>
      <mesh position={[0, 0.06, 0]} material={mat('#e8e4dc', { r: 0.6 })} receiveShadow><cylinderGeometry args={[1.6, 1.6, 0.06, 40]} /></mesh>
      <group position={[0, 1.1, 0]} rotation={[0, f * 0.006, 0]}>
        {f < vx ? (
          <>
            <mesh material={mat('#d42a2a', { r: 0.45 })} castShadow scale={[1, 0.93, 1]}><sphereGeometry args={[1, 48, 32]} /></mesh>
            <mesh position={[0, 0.95, 0]} rotation={[0, 0, 0.2]} material={mat('#5a3a1a', { r: 0.8 })}><cylinderGeometry args={[0.03, 0.04, 0.3, 8]} /></mesh>
          </>
        ) : (
          <>
            <primitive object={vox} />
            <mesh position={[0, 0.95, 0]} rotation={[0, 0, 0.2]} material={mat('#5a3a1a', { r: 0.8 })}><boxGeometry args={[0.1, 0.3, 0.1]} /></mesh>
          </>
        )}
      </group>
      {grid > 0 && <gridHelper args={[4, 32, '#21f0ff', '#21f0ff']} position={[0, 1.1, 0.9]} rotation={[Math.PI / 2, 0, 0]} />}
      {f >= vx && f < vx + 10 && <Glow pos={[0, 1.1, 0.5]} s={4 * (1 - (f - vx) / 10)} color="#21f0ff" />}
    </Stage>
  );
};
export const L71Dev: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L71_dev');
  const reveal = (f - k.w(965) + 4) * 1.4;
  const log = [
    ['#7b8bbf', '[INFO]  мир v1.4 запущен'],
    ['#7b8bbf', '[INFO]  игроков онлайн: 8 000 000 000'],
    ['#ffd23f', '[WARN]  игрок_1 нашёл проход сквозь стену'],
    ['#ff6b6b', '[ERROR] игрок_1 подозревает, что мир — игра'],
    ['#ff6b6b', '[ERROR] игрок_1 смотрит видео про симуляцию'],
  ];
  let budget = Math.max(0, Math.floor(reveal));
  const vis = log.map(([c, t]) => { const n = Math.min(t.length, budget); budget -= n; return [c, t.slice(0, n)]; });
  const scr = useScreen(1024, 576, 'log' + Math.max(0, Math.floor(reveal)) + (Math.floor(f / 15) % 2), (g, w, h) => {
    g.fillStyle = '#05080f'; g.fillRect(0, 0, w, h);
    g.font = '700 34px monospace';
    vis.forEach(([c, t], i) => { g.fillStyle = c; g.fillText(t, 24, 80 + i * 60); });
    if (Math.floor(f / 15) % 2) { const last = vis.findIndex((v) => v[1].length === 0); const li = last < 0 ? vis.length - 1 : Math.max(0, last - 1); g.fillStyle = '#7dffb0'; g.fillRect(24 + g.measureText(vis[li][1]).width + 6, 52 + li * 60, 18, 34); }
  });
  const dev = useMemo(() => randomLook(1600, { shirt: '#2d3436', pants: '#2d3436', hairStyle: 'curly', hair: '#2a1a10', glasses: true }), []);
  const push = k.w(976) - 4;
  const c = f < push
    ? camK(f, [{ f: 0, p: [-1.4, 1.6, -0.1], l: [0.25, 1.15, -0.9], fov: 44 }, { f: push, p: [-1.2, 1.55, -0.25], l: [0.25, 1.18, -0.9], fov: 42 }], (t) => t)
    : camK(f - push, [{ f: 0, p: [-0.4, 1.4, -0.15], l: [0.25, 1.25, -0.95], fov: 40 }, { f: k.dur - push, p: [-0.15, 1.33, -0.3], l: [0.25, 1.25, -0.95], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.15, hemiI: 0.3, env: 0.15, hor: '#1a2240' }} center={[0, 1, 0]} size={4} noSky />
      <pointLight position={[-1.2, 2.2, 0.8]} intensity={1.6} distance={5} color="#8fa8ff" />
      <Cam {...c} />
      <group position={[0, 0, 0.5]}><Room w={6} d={5} h={2.8} wall="#2a3350" floor="dark" light={0.35} /></group>
      <mesh geometry={rbox(1.8, 0.05, 0.8, 0.02)} position={[0.2, 0.75, -0.8]} material={mat('#2a2a30', { r: 0.6 })} receiveShadow />
      <Screen tex={scr} w={0.9} h={0.5} pos={[0.25, 1.25, -0.95]} rot={[-0.05, 0, 0]} frame="#111" />
      <pointLight position={[0.25, 1.3, -0.5]} intensity={5} distance={3} color="#7db8ff" />
      <Person look={dev} pos={[0.25, 0, 0.0]} rotY={Math.PI} pose={merge(EXPR.neutral, { legL: 1.5, legR: 1.5, kneeL: 1.5, kneeR: 1.5, y: -0.32, armL: [1.2, 0.2, 0.3 + Math.sin(f * 0.9) * 0.05], armR: [1.2, 0.2, 0.3 + Math.cos(f * 0.9) * 0.05], head: [0.05, 0, 0] })} />
      <mesh position={[0.25, 0.45, 0.05]} material={mat('#1a1a1f', { r: 0.6 })}><boxGeometry args={[0.5, 0.06, 0.5]} /></mesh>
    </Stage>
  );
};
export const L72Button: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L72_button');
  const back = smoother(clamp(f / 40));
  const appear = k.w(988) - 4;
  const bs = backOut((f - appear) / 14, 1.6);
  const ppl = useMemo(() => STREET_PPL(1100, 10), []);
  const look = mixLook(LOOKS.dusk, LOOKS.morning, back);
  const c = f < 40 ? camK(f, [{ f: 0, p: [30, 60, 80], l: [0, 0, -10], fov: 46 }, { f: 40, p: [7.6, 1.9, 14], l: [9.6, 1.6, -6], fov: 44 }])
    : camK(f, [{ f: 40, p: [7.6, 1.9, 14], l: [9.6, 1.6, -6], fov: 44 }, { f: k.dur, p: [7.7, 1.8, 10.5], l: [7.6, 1.4, 4], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={look} center={[8, 0, 0]} size={lerp(100, 30, back)} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} f={f} />
      {back > 0.5 && <Traffic f={f + 100} n={16} seed={17} axis="z" />}
      {back > 0.8 && ppl.map((p, i) => { const w = walkPath(f + 120 - i * 10, p.a, [p.a[0], p.a[1] + 60], p.sp, 0, i); return <Person key={i} look={p.look} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, i), w.pose, EXPR.happy)} />; })}
      {f >= appear && <group position={[7.7, 1.25 + Math.sin(f * 0.08) * 0.04, 5.2]} rotation={[0.9, 0.1, 0]}><RedButton s={0.75 * bs} /></group>}
    </Stage>
  );
};
export const L73Press: React.FC = () => {
  const f = useCurrentFrame();
  const reach = easeOut(f / 29);
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

// ------------------------------------------------------------------ CTA + end screen (synthwave + hero with headset)
const SynthBg: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: 'absolute', left: 0, top: -560, width: 1920, height: 3413, backgroundImage: synth(), backgroundSize: 'cover', transform: `scale(${1 + f * 0.0004})` }} />
);
const HeadsetHero: React.FC<{ f: number; w: number; h: number; wave?: boolean }> = ({ f, w, h, wave = true }) => (
  <ThreeCanvas width={w} height={h} gl={{ antialias: true, alpha: true }} camera={{ fov: 30, near: 0.05, far: 100 }}>
    <Lights look={{ ...LOOKS.morning, sunAz: 30, sunEl: 32, sun: '#f0e6ff', sunI: 2.2, hemiI: 1.0, env: 0.6 }} center={[0, 1.4, 0]} size={3} noSky noFog shadow={false} />
    <directionalLight position={[-2.6, 2.6, -2.6]} intensity={3.2} color="#ff2bd6" />
    <directionalLight position={[2.6, 2.4, -2.4]} intensity={2.6} color="#21f0ff" />
    <Cam pos={[0.1, 1.45, 3.4]} look={[0, 1.3, 0]} fov={30} />
    <Person look={randomLook(3, { skin: '#f0c4a0', hair: '#3a2416', hairStyle: 'short', shirt: '#7b2ff7' })} blob={false} olWidth={0.008} onHead={<Headset />}
      pose={merge(EXPR.happy, { head: [0.04, Math.sin(f * 0.05) * 0.15, -0.06], armL: [0.1, 0.12, 0.2], armR: wave ? [2.7 + Math.sin(f * 0.3) * 0.15, -0.2, 0.3] : [0.2, 0.1, 0.2], blink: (f % 70) < 4 ? 1 : 0 })} />
  </ThreeCanvas>
);
export const L74CTA: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('L74_cta');
  const net = k.w(1009) - 4;
  if (f >= net) {
    const g = f - net;
    const off = clamp(g / 60);
    return (
      <Stage bg="#02040a">
        <Lights look={LOOKS.space} center={[0, 0, 0]} size={30} shadow={false} noSky noFog />
        <StarField />
        <Cam pos={[0, 2, lerp(34, 29, smoother(clamp(g / (k.dur - net))))]} look={[0, 0, 0]} fov={42} />
        <Earth rot={1.2 + g * 0.004} r={10} sun={[-0.6, 0.15, -1]} off={off} night={1} />
      </Stage>
    );
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#140033' }}>
      <SynthBg f={f} />
      <div style={{ position: 'absolute', left: 1020, top: 60, width: 900, height: 1020 }}><HeadsetHero f={f} w={900} h={1020} /></div>
    </div>
  );
};
export const EndL: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#140033' }}>
      <SynthBg f={f} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,0,30,0.35)' }} />
      <div style={{ position: 'absolute', left: -40, top: 120, width: 760, height: 960 }}><HeadsetHero f={f} w={760} h={960} /></div>
    </div>
  );
};

export const SCENES_B: Record<string, React.FC> = {
  L36_lag: L36Lag, L37_freeze: L37Freeze, L38_fall: L38Fall, L39_under: L39Under, L40_respawn: L40Respawn, L41_lagfact: L41LagFact,
  L42_stranger: L42Stranger, L43_chat: L43Chat, L44_players: L44Players, L45_jump: L45Jump, L46_lives: L46Lives,
  L47_save: L47Save, L48_mug: L48Mug, L49_bus: L49Bus, L50_exam: L50Exam, L51_best: L51Best, L52_reaction: L52Reaction,
  L53_fixed: L53Fixed, L54_patch: L54Patch, L55_noload: L55NoLoad, L56_updates: L56Updates,
  L57_flyer: L57Flyer, L58_money: L58Money, L60_banned: L60Banned, L61_clip: L61Clip, L62_speedrun: L62Speedrun,
  L63_menu: L63Menu, L64_confirm: L64Confirm, L65_lab: L65Lab, L66_sim: L66Sim, L67_bostrom: L67Bostrom, L68_worlds: L68Worlds,
  L69_chance: L69Chance, L70_pixels: L70Pixels, L71_dev: L71Dev, L72_button: L72Button, L73_press: L73Press, L74_cta: L74CTA, END: EndL,
  ...Object.fromEntries(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'].map((id) => [id, makeLI(id)])),
};
