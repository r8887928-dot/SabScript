import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic, textTex, Blob, spr, radialTex } from '../three/core';
import { City, C } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walkPath, walk, Crowd, Agent } from '../three/person';
import { Car, CAR_COLORS } from '../three/vehicles';
import { IQTag, Birds, Ring, QMark, Glow, Room, rbox } from '../three/props';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, smoother, kick, clamp, pop, backOut, wobble } from '../lib/anim';

/** cars on the x-axis avenue (z = 0) and the z-axis avenue (x = 0) */
export const Traffic: React.FC<{ f: number; n?: number; seed?: number; speed?: number; stopAt?: number; axis?: 'x' | 'z' | 'both'; span?: number; lights?: number; offset?: number }> = ({ f, n = 10, seed = 3, speed = 9, stopAt = 1e9, axis = 'both', span = 220, lights = 0, offset = 0 }) => {
  const cars = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: n }).map((_, i) => ({ dir: r() < 0.5 ? 1 : -1, lane: r() < 0.5 ? 1.75 : 5.25, s0: r() * span, ax: axis === 'both' ? (r() < 0.5 ? 'x' : 'z') : axis, kind: r() < 0.15 ? 'taxi' : r() < 0.08 ? 'bus' : r() < 0.15 ? 'van' : 'sedan', col: CAR_COLORS[Math.floor(r() * CAR_COLORS.length)], v: speed * (0.75 + r() * 0.5) }));
  }, [n, seed, axis, span, speed]);
  const tf = Math.min(f, stopAt);
  return (
    <>
      {cars.map((c, i) => {
        const s = ((c.s0 + (tf / 30) * c.v + offset) % span) - span / 2;
        const along = c.dir * s;
        const lat = c.dir * c.lane;
        const pos = c.ax === 'x' ? [along, 0, lat] : [-lat, 0, along];
        const rotY = c.ax === 'x' ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.dir > 0 ? 0 : Math.PI);
        return <Car key={i} kind={c.kind as any} color={c.col} pos={pos} rotY={rotY} dist={(tf / 30) * c.v} lights={lights} />;
      })}
    </>
  );
};

// «Обычное утро.» — sunrise over the city
export const M1Sunrise: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('m1_sunrise');
  const c = camK(f, [{ f: 0, p: [-120, 62, 2], l: [60, 6, 0], fov: 44 }, { f: k.dur, p: [-104, 44, 2], l: [60, 9, 0], fov: 42 }], (t) => t);
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

// alarm clock (two bells), facing +z
const AlarmClock: React.FC<{ f: number; ring: boolean }> = ({ f, ring }) => {
  const sh = ring ? Math.sin(f * 2.4) * 0.08 : 0;
  const face = useMemo(() => textTex('', { w: 256, h: 256 }), []);
  void face;
  const dial = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const g = cv.getContext('2d', { willReadFrequently: true })!;
    g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
    g.fillStyle = '#222'; g.font = '700 34px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); }
    g.strokeStyle = '#222'; g.lineCap = 'round'; g.lineWidth = 10; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(-Math.PI / 2 + 7 / 12 * Math.PI * 2) * 50, 128 + Math.sin(-Math.PI / 2 + 7 / 12 * Math.PI * 2) * 50); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 40); g.stroke();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const red = mat('#d63031', { r: 0.3, m: 0.3 });
  return (
    <group rotation={[0, 0, sh]}>
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} material={red} castShadow><cylinderGeometry args={[0.13, 0.13, 0.08, 32]} /></mesh>
      <mesh position={[0, 0.16, 0.041]} material={new THREE.MeshBasicMaterial({ map: dial })}><circleGeometry args={[0.115, 32]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.09, 0.3, 0]} rotation={[0, 0, -s * 0.5 + (ring ? Math.sin(f * 3 + s) * 0.25 : 0)]}>
          <mesh material={mat('#f5c542', { r: 0.25, m: 0.6 })} castShadow><sphereGeometry args={[0.055, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.33, 0]} material={mat('#888', { r: 0.4, m: 0.6 })}><sphereGeometry args={[0.02, 8, 6]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.08, 0.04, 0]} rotation={[0, 0, s * 0.4]} material={red}><cylinderGeometry args={[0.012, 0.012, 0.1, 6]} /></mesh>)}
      {ring && [0, 1, 2].map((i) => <mesh key={i} position={[0.24 + i * 0.05, 0.3 + i * 0.05, 0]} rotation={[0, 0, -0.8]} material={basic('#ffffff')}><boxGeometry args={[0.012, 0.08 + ((f + i * 3) % 6) * 0.01, 0.01]} /></mesh>)}
      {ring && [0, 1, 2].map((i) => <mesh key={'b' + i} position={[-0.24 - i * 0.05, 0.3 + i * 0.05, 0]} rotation={[0, 0, 0.8]} material={basic('#ffffff')}><boxGeometry args={[0.012, 0.08 + ((f + i * 4) % 6) * 0.01, 0.01]} /></mesh>)}
    </group>
  );
};

// «Миллиарды людей просыпаются,» — bedroom, alarm clock, stretch
export const M2Alarm: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('m2_alarm');
  const slap = k.cue('alarm_slap');
  const ring = f < slap;
  const look = useMemo(() => randomLook(21, { hairStyle: 'curly', shirt: '#9fc3e6', pants: '#5b6b8a' }), []);
  const st = ramp(f, slap - 6, slap + 14);
  const c = camK(f, [{ f: 0, p: [0.62, 0.86, 1.15], l: [0.45, 0.76, 0], fov: 34 }, { f: Math.max(8, slap - 10), p: [0.6, 0.92, 1.35], l: [0.42, 0.8, -0.1], fov: 34 }, { f: slap + 6, p: [0.5, 1.15, 2.3], l: [-0.75, 1.05, -0.7], fov: 40 }, { f: k.dur, p: [0.42, 1.18, 2.45], l: [-0.85, 1.1, -0.75], fov: 40 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={5} noSky />
      <Cam {...c} />
      <group position={[0, 0, -1]}>
        <Room w={6} d={6} h={3} wall="#cfe0ef" floor="wood" windows="back" light={0.8} />
      </group>
      <pointLight position={[-1.5, 2.2, -2.5]} intensity={18} distance={8} color="#ffd9a8" />
      {/* bed */}
      <group position={[-0.9, 0, -0.9]}>
        <mesh position={[0, 0.25, 0]} material={mat('#7b5537', { r: 0.8 })} castShadow receiveShadow><boxGeometry args={[1.6, 0.5, 2.2]} /></mesh>
        <mesh geometry={rbox(1.5, 0.22, 2.1, 0.08)} position={[0, 0.6, 0]} material={mat('#f4f1ea', { r: 0.9 })} castShadow receiveShadow />
        <mesh geometry={rbox(1.52, 0.16, 1.3, 0.07)} position={[0, 0.72, 0.38]} material={mat('#5a8fd6', { r: 0.9 })} castShadow receiveShadow />
        <mesh geometry={rbox(0.7, 0.16, 0.42, 0.08)} position={[-0.32, 0.78, -0.8]} material={mat('#ffffff', { r: 0.9 })} castShadow />
        <mesh position={[0, 0.9, -1.12]} material={mat('#7b5537', { r: 0.8 })} castShadow><boxGeometry args={[1.6, 1.0, 0.08]} /></mesh>
      </group>
      <group position={[-0.95, 0.62, -0.75]}>
        <Person look={look} blob={false} pose={merge(idle(f, 5), {
          body: [lerp(-0.25, 0.05, st), 0, 0], legL: 1.5, legR: 1.5, kneeL: 1.45, kneeR: 1.45,
          armL: [lerp(0.2, 2.9, st), lerp(0.2, 0.35, st), lerp(0.3, 0.1, st)], armR: [lerp(0.2, 2.9, st), lerp(0.2, 0.35, st), lerp(0.3, 0.1, st)],
          mouth: st > 0.2 && st < 0.95 ? 'O' : 'smile', blink: st < 0.3 ? 1 : 0, head: [0.05, 0.3, 0],
        })} rotY={0.5} pos={[0, -0.8 + 0.0, 0]} />
      </group>
      {/* nightstand + clock */}
      <group position={[0.45, 0, -0.1]}>
        <mesh geometry={rbox(0.6, 0.6, 0.5, 0.04)} position={[0, 0.3, 0]} material={mat('#c99a6b', { r: 0.7 })} castShadow receiveShadow />
        <group position={[0, 0.6, 0.02]}><AlarmClock f={f} ring={ring} /></group>
        <mesh position={[-0.18, 0.75, -0.1]} material={mat('#f0e6d0', { r: 0.6 })}><cylinderGeometry args={[0.08, 0.12, 0.25, 16]} /></mesh>
      </group>
    </Stage>
  );
};

// «идут на работу,» — sidewalk tracking with commuters
export const M3Commute: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('m3_commute');
  const people = useMemo(() => [
    { x: 9.0, z0: -6, seed: 31, o: { tie: '#c0392b', shirt: '#f4f4f4', pants: '#2d3436', hairStyle: 'short' } },
    { x: 10.6, z0: -9, seed: 32, o: { shirt: '#8e44ad', hairStyle: 'bun' } },
    { x: 8.2, z0: -13, seed: 33, o: { shirt: '#2e86de', tie: '#1e272e', hairStyle: 'short' } },
    { x: 10.2, z0: -17, seed: 34, o: { shirt: '#e67e22', hairStyle: 'long' } },
    { x: 8.8, z0: -21, seed: 35, o: { shirt: '#16a085', hairStyle: 'cap', hat: '#2c3e50' } },
    { x: 10.8, z0: 2, seed: 36, o: { shirt: '#d35400', hairStyle: 'curly' } },
  ], []);
  const c = camK(f, [{ f: 0, p: [7.6, 1.5, 4], l: [9.8, 1.4, -8], fov: 40 }, { f: k.dur, p: [7.6, 1.5, 6.5], l: [9.8, 1.45, -6], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.morning} center={[9, 0, -6]} size={20} />
      <Cam {...c} />
      <City seed={7} near={3} far={7} />
      <Traffic f={f + 300} n={14} seed={5} axis="z" span={180} />
      {people.map((p, i) => {
        const w = walkPath(f + 30, [p.x, p.z0], [p.x, p.z0 + 30], 1.5, 0, i);
        return <Person key={i} look={randomLook(p.seed, p.o as any)} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, i), w.pose, EXPR.happy)} />;
      })}
    </Stage>
  );
};

/** school building */
export const School: React.FC<{ pos?: number[] }> = ({ pos = [0, 0, 0] }) => (
  <group position={pos as any}>
    <mesh position={[0, 6, 0]} material={mat('#f2c38b', { r: 0.85 })} castShadow receiveShadow><boxGeometry args={[34, 12, 10]} /></mesh>
    {Array.from({ length: 3 }).flatMap((_, fl) => Array.from({ length: 10 }).map((__, i) => (
      <mesh key={fl + '_' + i} position={[-15 + i * 3.3, 2.4 + fl * 3.5, 5.01]} material={mat('#5d84ad', { r: 0.2, m: 0.3 })}><planeGeometry args={[2.0, 2.0]} /></mesh>
    )))}
    <mesh position={[0, 12.2, 0]} material={mat('#9b4b3a', { r: 0.8 })} castShadow><boxGeometry args={[35, 0.6, 11]} /></mesh>
    <mesh position={[0, 1.6, 5.4]} material={mat('#6b3e26', { r: 0.6 })}><boxGeometry args={[3, 3.2, 0.3]} /></mesh>
    <mesh position={[0, 10.3, 5.06]} material={basic('#ffffff', { map: textTex('ШКОЛА', { w: 1024, h: 256, bg: '#1f4e8c', fg: '#fff', radius: 30 }) })}><planeGeometry args={[9, 2.2]} /></mesh>
    <mesh position={[0, 0.12, 9]} material={mat('#d9d2c3', { r: 0.9 })} receiveShadow><boxGeometry args={[12, 0.25, 8]} /></mesh>
  </group>
);

// «учебу» — kids with backpacks walk to school
export const M4School: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('m4_school');
  const kids = useMemo(() => [0, 1, 2, 3, 4].map((i) => ({ x: -31 + i * 1.5, z: -10 - (i % 2) * 1.6, look: randomLook(50 + i, { kid: true, backpack: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#9b59b6'][i] }) })), []);
  const c = camK(f, [{ f: 0, p: [-27, 1.0, -2], l: [-28, 3.5, -40], fov: 46 }, { f: k.dur, p: [-27.5, 1.2, -4.5], l: [-28, 4, -40], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.morning} center={[-28, 0, -25]} size={30} />
      <Cam {...c} />
      <City seed={7} near={3} far={7} />
      <School pos={[-28, 0.16, -46]} />
      {kids.map((kd, i) => {
        const w = walkPath(f + 20, [kd.x, kd.z], [kd.x * 0.98, kd.z - 30], 1.4, 0, i * 1.3);
        return <Person key={i} look={kd.look} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, i + 10), w.pose)} />;
      })}
    </Stage>
  );
};

// «и занимаются своими делами.» — orderly intersection from above
export const M5Cross: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('m5_cross');
  const peds = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({ x: -5 + (i % 6) * 2, dir: i < 6 ? 1 : -1, look: randomLook(70 + i), z: i < 6 ? 8.5 : 11 })), []);
  const c = camK(f, [{ f: 0, p: [2, 30, 44], l: [0, 0, 6], fov: 40 }, { f: k.dur, p: [5, 25, 40], l: [0, 0, 7], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.day} center={[0, 0, 0]} size={40} />
      <Cam {...c} />
      <City seed={7} near={3} far={7} traffic="normal" f={200} />
      <Traffic f={f + 100} n={10} seed={9} axis="x" />
      {[[-1.75, 16], [-5.25, 20], [1.75, -16]].map(([x, z], i) => <Car key={i} pos={[x, 0, z]} rotY={z > 0 ? Math.PI : 0} color={CAR_COLORS[i + 2]} />)}
      {peds.map((p, i) => {
        const w = walkPath(f + i * 3, [p.dir > 0 ? -12 + (i % 6) * 0.9 : 12 - (i % 6) * 0.9, p.z + (i % 3) * 0.4], [p.dir > 0 ? 14 : -14, p.z + (i % 3) * 0.4], 1.25, 0, i);
        return <Person key={i} look={p.look} pos={[w.pos[0], 0.02, w.pos[2]]} rotY={w.rotY} pose={merge(idle(f, i), w.pose)} />;
      })}
    </Stage>
  );
};

// «Но внезапно происходит нечто невозможное.» — the world stops, a pulse sweeps
export const T1Freeze: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('t1_freeze');
  const freezeAt = k.w(25) + 4;
  const wave = k.cue('shockwave');
  const sky = ramp(f, freezeAt - 4, wave);
  const look = mixLook(LOOKS.day, { ...LOOKS.studio, sunI: 2.0, fogNear: 30, fogFar: 300, hor: '#7b4fd6', top: '#1a0f3d' }, sky * 0.85);
  const tf = f < freezeAt ? f : freezeAt + (f - freezeAt) * Math.max(0, 1 - (f - freezeAt) / 8) * 0.3;
  const people = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ look: randomLook(90 + i), a: [8 + (i % 3) * 1.3, -14 + i * 3], b: [8 + (i % 3) * 1.3, 20 + i * 3], sp: 1.1 + (i % 4) * 0.15 })), []);
  const rr = Math.max(0, (f - wave) * 6);
  const c = camK(f, [{ f: 0, p: [5.2, 0.6, 9], l: [10, 2.2, -6], fov: 50 }, { f: k.dur, p: [5.9, 0.8, 5.5], l: [10, 3.5, -6], fov: 44, roll: -4 }], (t) => t);
  return (
    <Stage>
      <Lights look={look} center={[8, 0, 0]} size={30} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={7} f={tf} />
      <Traffic f={tf + 200} n={12} seed={11} axis="z" />
      {people.map((p, i) => {
        const w = walkPath(tf, p.a, p.b, p.sp, -i * 25, i);
        const looking = f > freezeAt + 6 ? { head: [-0.35, 0.3 * Math.sin(i), 0] } : {};
        return <Person key={i} look={p.look} pos={[w.pos[0], 0.16, w.pos[2]]} rotY={w.rotY} pose={merge(idle(tf, i), w.pose, looking, f > freezeAt + 6 ? EXPR.shock : {})} />;
      })}
      {f >= wave && (
        <group position={[10, 0, -40]}>
          <mesh scale={[rr, rr, rr]} material={basic('#b48bff', { add: true, t: Math.max(0, 0.45 - (f - wave) * 0.02), side: THREE.BackSide })}><sphereGeometry args={[1, 32, 16]} /></mesh>
          <Ring r={rr} w={6} color="#c9a6ff" o={Math.max(0, 0.9 - (f - wave) * 0.03)} y={0.4} />
        </group>
      )}
      {f >= freezeAt - 10 && <Glow pos={[10, 60, -120]} s={lerp(0, 160, ramp(f, freezeAt - 10, wave))} color="#c9a6ff" o={0.9} />}
    </Stage>
  );
};

// «IQ каждого человека на Земле» — a line of people, the counters fall
export const T2Heads: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('t2_heads');
  const ppl = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({ look: randomLook(120 + i, i === 2 ? { kid: true } : {}), x: i * 1.25 })), []);
  const look = { ...LOOKS.studio, hor: '#5b3fa6', top: '#140b30', fog: '#2a1d55', fogNear: 15, fogFar: 140 };
  const c = camK(f, [{ f: 0, p: [-1.2, 1.9, 3.6], l: [0.6, 1.9, 0], fov: 40 }, { f: k.dur, p: [5.4, 1.9, 3.4], l: [5.0, 1.95, 0], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={look} center={[3, 0, 0]} size={12} frame={f} />
      <Cam {...c} />
      <group position={[-8, 0, -10]}><City seed={7} near={2} far={5} /></group>
      {ppl.map((p, i) => {
        const t0 = 4 + i * 7;
        const val = f < t0 ? 100 : Math.round(lerp(100, -(12 + i * 9), easeOut((f - t0) / 22)));
        const gl = f > t0 && f < t0 + 22 ? 1 : 0;
        const shocked = f > t0 + 12;
        return (
          <group key={i}>
            <Person look={p.look} pos={[p.x, 0.16, 0]} pose={merge(idle(f, i), shocked ? (i % 2 ? EXPR.dumb : EXPR.dumb2) : EXPR.neutral, { head: [0.04, (i % 2 ? 0.2 : -0.2) * (shocked ? 1 : 0), shocked ? 0.15 * (i % 2 ? 1 : -1) : 0] })} />
            <IQTag value={val} pos={[p.x, p.look.kid ? 1.75 : 2.35, 0]} s={0.75} glitch={gl} />
          </group>
        );
      })}
    </Stage>
  );
};

// «становится отрицательным.» — close-up, the eyes go wild, a «?» pops
export const T3Face: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('t3_face');
  const flip = k.w(35);
  const look = useMemo(() => randomLook(140, { skin: '#f2c7a5', hairStyle: 'short', hair: '#4a2f1d', shirt: '#e4572e' }), []);
  const val = f < 6 ? 100 : Math.round(lerp(100, -27, easeOut((f - 6) / (flip - 6))));
  const dumb = f >= flip;
  const qs = pop(f, flip + 4, 9);
  const c = camK(f, [{ f: 0, p: [0.0, 1.95, 2.6], l: [0, 1.95, 0], fov: 38 }, { f: flip, p: [0.05, 1.85, 1.45], l: [0, 1.82, 0], fov: 38 }, { f: k.dur, p: [0.1, 1.86, 1.25], l: [0, 1.82, 0], fov: 36, roll: 3 }]);
  const tilt = dumb ? 0.22 + wobble(f, flip, 0.5, 0.12) * 0.15 : 0;
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, hor: '#6a3fb5', top: '#1a0d38' }} center={[0, 1, 0]} size={5} frame={f} />
      <Cam {...c} />
      <group position={[-8, 0, -14]}><City seed={7} near={2} far={5} /></group>
      <Person look={look} pos={[0, 0.16, 0]} pose={merge(idle(f, 3), dumb ? EXPR.dumb : EXPR.shock, { head: [0, 0, tilt], eyeA: dumb ? [0.026 * Math.cos(f * 0.5), 0.02 * Math.sin(f * 0.5)] : [0, 0], eyeB: dumb ? [-0.026 * Math.cos(f * 0.45), -0.02 * Math.sin(f * 0.45)] : [0, 0] })} />
      <IQTag value={val} pos={[0.55, 2.35, 0]} s={0.6} glitch={f > flip - 10 && f < flip + 4 ? 1 : 0} />
      {f >= flip + 4 && <QMark pos={[-0.45, 2.35 + Math.sin(f * 0.2) * 0.03, 0]} s={0.42 * qs} rotY={Math.sin(f * 0.1) * 0.4} />}
    </Stage>
  );
};
export { C, Crowd, spr, radialTex, Blob, kick, clamp, backOut, smoother, walk };
export type { Agent };
