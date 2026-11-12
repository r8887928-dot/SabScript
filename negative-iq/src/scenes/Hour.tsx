import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mat, basic } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walkPath, run, Crowd, Agent } from '../three/person';
import { Car, CAR_COLORS } from '../three/vehicles';
import { QMark, Smoke, Room, Shelf, rbox, Glow, useScreen, Screen } from '../three/props';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, kick, clamp, pop, wobble } from '../lib/anim';

export const LCHAOS = LOOKS.chaos;

/** cars scattered at odd angles (jams / abandoned) */
export const StuckCars: React.FC<{ seed: number; n: number; f: number; area?: number; rust?: number; police?: number; axis?: 'x' | 'z' | 'both'; jitter?: number; dense?: number }> = ({ seed, n, f, area = 150, rust = 0, police = 0, axis = 'both', jitter = 0.5, dense = 7 }) => {
  const cars = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: n }).map((_, i) => {
      const ax = axis === 'both' ? (r() < 0.5 ? 'x' : 'z') : axis;
      const k = Math.round((r() - 0.5) * 4) * 56;
      const along = axis === 'both' ? (r() - 0.5) * area : -area / 2 + (i / n) * area + r() * 2;
      const lane = [-5.25, -1.75, 1.75, 5.25][Math.floor(r() * 4)];
      const rot = (r() - 0.5) * 2 * jitter + (r() < 0.5 ? 0 : Math.PI) + (r() < 0.08 ? Math.PI / 2 : 0);
      return { pos: ax === 'x' ? [along, 0, (axis === 'both' ? k : 0) + lane] : [(axis === 'both' ? k : 0) + lane, 0, along], rot: rot + (ax === 'x' ? Math.PI / 2 : 0), col: CAR_COLORS[Math.floor(r() * CAR_COLORS.length)], kind: i < police ? 'police' : r() < 0.12 ? 'taxi' : r() < 0.06 ? 'bus' : r() < 0.12 ? 'van' : 'sedan' };
    });
  }, [seed, n, area, axis, jitter]);
  void dense;
  return <>{cars.map((c, i) => <Car key={i} kind={c.kind as any} color={c.col} pos={c.pos} rotY={c.rot} rust={rust} flash={c.kind === 'police' ? f + i * 3 : -1} brake={i % 3 === 0} />)}</>;
};

// «Города начинают погружаться в хаос.» — smoke, sirens, running people
export const B1Chaos: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('b1_chaos');
  const agents = useMemo<Agent[]>(() => { const r = rng(31); return Array.from({ length: 300 }).map((_, i) => ({ x: (r() - 0.5) * 200, z: (r() < 0.5 ? -1 : 1) * (8 + r() * 3) + Math.round((r() - 0.5) * 4) * 56, rot: r() * 6, seed: i, vx: (r() - 0.5) * 8 })); }, []);
  const moved = agents.map((a: any) => ({ ...a, x: a.x + (f / 30) * a.vx, rot: a.vx > 0 ? Math.PI / 2 : -Math.PI / 2, bob: Math.abs(Math.sin(f * 0.6 + a.seed)) * 0.12 }));
  const c = camK(f, [{ f: 0, p: [-30, 62, 96], l: [10, 0, -10], fov: 44 }, { f: k.dur, p: [-20, 52, 74], l: [10, 0, -14], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={LCHAOS} center={[0, 0, 0]} size={110} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={7} traffic="chaos" f={f} trash={0.3} />
      <StuckCars seed={5} n={34} f={f} area={260} police={5} />
      <Crowd agents={moved} />
      <Smoke pos={[30, 10, -40]} f={f} h={90} s={18} seed={1} />
      <Smoke pos={[-60, 15, -90]} f={f + 30} h={110} s={22} seed={2} color="#4a4644" />
      <Smoke pos={[70, 8, 30]} f={f + 60} h={80} s={16} seed={3} />
    </Stage>
  );
};

// «На дорогах образуются огромные пробки.» — an endless jam
export const B2Jam: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('b2_jam');
  const c = camK(f, [{ f: 0, p: [10, 9, 30], l: [0, 1, 10], fov: 44 }, { f: k.dur, p: [24, 66, 70], l: [0, 0, -30], fov: 46 }]);
  const honk = (f % 20) < 6;
  return (
    <Stage>
      <Lights look={LCHAOS} center={[0, 0, 0]} size={90} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={7} traffic="blink" f={f} clear={[[10, 30, 8]]} />
      <StuckCars seed={8} n={70} f={f} area={330} axis="z" jitter={0.35} />
      <StuckCars seed={9} n={34} f={f} area={240} axis="x" jitter={0.4} />
      {honk && <Glow pos={[-1.75, 1.2, 16]} s={3} color="#fff3c4" />}
    </Stage>
  );
};

/** cash register with a live screen */
const Register: React.FC<{ err: boolean; f: number; pos: number[]; rotY?: number }> = ({ err, f, pos, rotY = 0 }) => {
  const blink = err && Math.floor(f / 5) % 2 === 0;
  const tex = useScreen(512, 320, `${err}_${blink}`, (g, w, h) => {
    g.fillStyle = err ? (blink ? '#d50000' : '#7a0000') : '#0d3b66'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (err) { g.font = '900 96px Montserrat'; g.fillText('ОШИБКА', w / 2, h / 2 - 30); g.font = '700 40px Montserrat'; g.fillText('товар не найден', w / 2, h / 2 + 60); }
    else { g.font = '800 54px Montserrat'; g.fillText('ИТОГО: 0 ₽', w / 2, h / 2 - 20); g.font = '600 34px Montserrat'; g.fillText('сканируйте товар', w / 2, h / 2 + 50); }
  });
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh geometry={rbox(0.7, 0.25, 0.5, 0.04)} position={[0, 0.12, 0]} material={mat('#2d3436', { r: 0.5 })} castShadow />
      <mesh position={[0, 0.45, -0.05]} material={mat('#2d3436', { r: 0.5 })}><boxGeometry args={[0.06, 0.5, 0.06]} /></mesh>
      <Screen tex={tex} w={0.62} h={0.39} pos={[0, 0.78, 0]} rot={[-0.15, 0, 0]} frame="#222" />
      {err && <Glow pos={[0, 0.8, 0.2]} s={1.6} color="#ff2a2a" o={blink ? 0.9 : 0.4} />}
    </group>
  );
};

// «В магазинах люди не понимают, как пользоваться кассами.»
export const B3Checkout: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('b3_checkout');
  const beep = k.cue('scan_beep'), err1 = k.cue('scan_err1'), bang = k.cue('register_bang');
  const cust = useMemo(() => randomLook(301, { shirt: '#4caf50', hairStyle: 'short', hair: '#7a3b22' }), []);
  const cashier = useMemo(() => randomLook(302, { shirt: '#c0392b', hairStyle: 'bun', hat: '#c0392b' }), []);
  const err = f >= err1;
  const bangA = f >= bang - 6 && f < bang + 8 ? (f < bang ? lerp(0.5, 2.6, (f - bang + 6) / 6) : lerp(2.6, 0.8, (f - bang) / 8)) : 0.5;
  const sh = kick(f, bang, 7) * 0.03;
  const c = camK(f, [{ f: 0, p: [0.4, 1.35, 1.0], l: [0.0, 1.0, -0.6], fov: 40 }, { f: Math.min(36, k.dur - 30), p: [1.4, 1.65, 2.6], l: [0, 1.25, -0.6], fov: 42 }, { f: k.dur, p: [1.9, 1.75, 3.2], l: [-0.2, 1.3, -0.6], fov: 42 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={8} noSky />
      <Cam pos={[c.pos[0] + sh, c.pos[1] + sh, c.pos[2]]} look={c.look} fov={c.fov} />
      <group position={[0, 0, -2]}><Room w={10} d={10} h={3.6} wall="#eef1f4" floor="tile" ceilingLights={3} light={1.2} /></group>
      <Shelf pos={[-2.2, 0, -5]} len={4} seed={8} />
      <Shelf pos={[2.4, 0, -5]} len={4} seed={9} />
      {/* counter */}
      <mesh geometry={rbox(1.0, 0.9, 3.4, 0.04)} position={[0, 0.45, -0.6]} material={mat('#dfe6e9', { r: 0.4 })} castShadow receiveShadow />
      <mesh position={[0, 0.91, -0.6]} material={mat('#2d3436', { r: 0.6 })}><boxGeometry args={[0.8, 0.02, 3.2]} /></mesh>
      <Register err={err} f={f} pos={[0, 0.9, -1.2]} rotY={0.5} />
      {[[-0.1, 0.0], [0.15, 0.3], [-0.2, 0.6]].map(([x, z], i) => <mesh key={i} position={[x, 1.0, z]} material={mat(['#f1c40f', '#e74c3c', '#3498db'][i], { r: 0.5 })} castShadow><boxGeometry args={[0.18, 0.16, 0.14]} /></mesh>)}
      <Person look={cashier} pos={[-1.0, 0, -1.2]} rotY={Math.PI / 2} pose={merge(idle(f, 2), err ? EXPR.dumb2 : EXPR.neutral, { armR: [bangA, 0.1, 0.3], head: [0, err ? 0.4 : 0, 0] })} />
      <Person look={cust} pos={[0.9, 0, 0.2]} rotY={-Math.PI / 2 - 0.4} pose={merge(idle(f, 3), f >= beep ? EXPR.dumb : EXPR.neutral, { armR: [2.4, 0.1, 2.1], head: [0.1, 0, 0.1] })}
        propR={<group rotation={[1.2, 0, 0]}><mesh material={mat('#333', { r: 0.5 })}><boxGeometry args={[0.08, 0.22, 0.12]} /></mesh>{f >= beep && f < beep + 10 && <Glow pos={[0, -0.1, 0.12]} s={0.5} color="#ff2a2a" />}</group>} />
      {f >= beep && f < beep + 8 && <mesh position={[0.62, 1.82, 0.12]} rotation={[0, -0.4, 0]} material={basic('#ff2a2a', { add: true, t: 0.8 })}><planeGeometry args={[0.02, 0.3]} /></mesh>}
    </Stage>
  );
};

/** classroom set: board on the back wall, desks with kids */
export const Classroom: React.FC<{ f: number; boardTex?: THREE.Texture; qFrom?: number }> = ({ f, boardTex, qFrom = 1e9 }) => {
  const boardMat = useMemo(() => (boardTex ? new THREE.MeshBasicMaterial({ map: boardTex, toneMapped: false }) : mat('#2f4f3a', { r: 0.9 })), [boardTex]);
  const kids = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ look: randomLook(320 + i, { kid: true }), x: -2.4 + (i % 3) * 2.4, z: -0.5 + Math.floor(i / 3) * 1.8 })), []);
  return (
    <group>
      <group position={[0, 0, -1]}><Room w={10} d={10} h={3.4} wall="#e7dcc2" floor="wood" windows="left" light={1.1} /></group>
      <mesh position={[0, 1.75, -5.95]} material={boardMat}><planeGeometry args={[2.6, 1.95]} /></mesh>
      <mesh position={[0, 1.75, -5.98]} material={mat('#7b5537', { r: 0.7 })}><boxGeometry args={[2.8, 2.15, 0.04]} /></mesh>
      <mesh geometry={rbox(1.6, 0.8, 0.7, 0.03)} position={[2.6, 0.4, -4.6]} material={mat('#9c6b45', { r: 0.7 })} castShadow receiveShadow />
      {kids.map((kd, i) => (
        <group key={i} position={[kd.x, 0, kd.z]}>
          <mesh geometry={rbox(1.0, 0.06, 0.55, 0.02)} position={[0, 0.72, -0.35]} material={mat('#c99a6b', { r: 0.6 })} castShadow receiveShadow />
          {[[-0.45, -0.55], [0.45, -0.55], [-0.45, -0.15], [0.45, -0.15]].map(([x, z], j) => <mesh key={j} position={[x, 0.36, z]} material={mat('#555', { r: 0.5, m: 0.4 })}><boxGeometry args={[0.04, 0.72, 0.04]} /></mesh>)}
          <mesh position={[0, 0.42, 0.25]} material={mat('#5d84ad', { r: 0.6 })} castShadow><boxGeometry args={[0.45, 0.05, 0.4]} /></mesh>
          <Person look={kd.look} pos={[0, 0.0, 0.25]} rotY={Math.PI} pose={merge(idle(f, i), f > qFrom + i * 2 ? (i % 2 ? EXPR.confused : EXPR.dumb) : EXPR.neutral, { legL: 1.4, legR: 1.4, kneeL: 1.45, kneeR: 1.45, y: -0.25, head: [0, f > qFrom ? Math.sin(f * 0.07 + i) * 0.4 : 0, 0] })}
            above={f > qFrom + i * 2 && i % 2 === 0 ? <QMark pos={[0, -0.05, 0]} s={0.35 * pop(f, qFrom + i * 2, 8)} /> : null} />
        </group>
      ))}
    </group>
  );
};

// «Учителя приходят в классы,»
export const B4Class: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('b4_class');
  const t = useMemo(() => randomLook(340, { glasses: true, hairStyle: 'bun', hair: '#6b6b6b', shirt: '#7d4fb3', skirt: true }), []);
  const w = walkPath(f + 10, [4.2, -3.5], [1.2, -4.6], 1.0, 0);
  const c = camK(f, [{ f: 0, p: [-2.2, 3.0, 7.6], l: [0.6, 0.9, -3.0], fov: 50 }, { f: k.dur, p: [-1.8, 2.8, 6.8], l: [0.8, 1.0, -3.2], fov: 48 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={8} noSky />
      <Cam {...c} />
      <Classroom f={f} qFrom={20} />
      <Person look={t} pos={[w.pos[0], 0, w.pos[2]]} rotY={w.done ? 0.3 : w.rotY} pose={merge(idle(f, 9), w.pose, EXPR.happy)} propL={<mesh position={[0, 0, 0.1]} material={mat('#c0392b', { r: 0.6 })}><boxGeometry args={[0.25, 0.32, 0.05]} /></mesh>} />
    </Stage>
  );
};

// «...но не могут объяснить даже простейшие вещи.» — 2 + 2 = 🐟
export const B5Board: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('b5_board');
  const p1 = clamp((f - 4) / 18), p2 = clamp((f - k.w(101)) / 14), p3 = clamp((f - k.w(103)) / 20);
  const key = [Math.round(p1 * 20), Math.round(p2 * 20), Math.round(p3 * 20)].join('_');
  const tex = useScreen(768, 576, key, (g, w, h) => {
    g.fillStyle = '#2f4f3a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + (i % 7) * 0.004})`; g.fillRect((i * 97) % w, (i * 53) % h, 30, 2); }
    g.font = '700 150px Montserrat'; g.textBaseline = 'middle'; g.fillStyle = '#f4f4ec';
    g.save(); g.beginPath(); g.rect(0, 0, 60 + 600 * p1, 260); g.clip(); g.fillText('2 + 2 =', 60, 150); g.restore();
    if (p2 > 0) { g.save(); g.beginPath(); g.rect(80, 260, 360 * p2, 300); g.clip(); g.fillText('22?', 110, 400); g.restore(); }
    if (p3 > 0) {
      g.strokeStyle = '#f4f4ec'; g.lineWidth = 14; g.lineCap = 'round';
      g.beginPath(); g.moveTo(90, 330); g.lineTo(90 + 320 * Math.min(1, p3 * 2), 470); g.stroke();
      if (p3 > 0.5) { const q = (p3 - 0.5) * 2; g.strokeStyle = '#ffd36b'; g.lineWidth = 12; g.beginPath(); g.ellipse(560, 400, 95 * q, 50 * q, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(655, 400); g.lineTo(720, 355); g.lineTo(720, 445); g.closePath(); g.stroke(); g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(515, 388, 9, 0, 7); g.fill(); }
    }
  });
  const t = useMemo(() => randomLook(340, { glasses: true, hairStyle: 'bun', hair: '#6b6b6b', shirt: '#7d4fb3', skirt: true }), []);
  const writing = (p1 > 0 && p1 < 1) || (p2 > 0 && p2 < 1) || (p3 > 0 && p3 < 1);
  const c = camK(f, [{ f: 0, p: [0.5, 1.65, -0.6], l: [0.0, 1.55, -6], fov: 50 }, { f: k.dur, p: [0.6, 1.65, -1.3], l: [0.0, 1.6, -6], fov: 48 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -3]} size={8} noSky />
      <Cam {...c} />
      <Classroom f={f} boardTex={tex} qFrom={1e9} />
      <Person look={t} pos={[-1.15, 0, -4.7]} rotY={f > k.w(103) + 12 ? 0.9 : Math.PI - 0.5} pose={merge(idle(f, 9), f > k.w(103) + 12 ? EXPR.dumb : EXPR.neutral, { armR: writing ? [2.2 + Math.sin(f * 1.3) * 0.1, 0.3, 0.6] : [0.3, 0.1, 0.4] })} />
    </Stage>
  );
};

// «Никто не способен нормально решать проблемы.» — the square peg
export const B6Peg: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('b6_peg');
  const hits = ['peg_hit1', 'peg_hit2', 'peg_hit3'].map((n) => k.cue(n));
  const look = useMemo(() => randomLook(360, { shirt: '#26a69a', hairStyle: 'curly', hair: '#151515' }), []);
  let arm = 0.6, sq = 0, bounce = 0, shake = 0;
  for (const h of hits) {
    const d = f - h;
    if (d >= -8 && d < 0) arm = lerp(0.6, 2.9, (d + 8) / 8);
    if (d >= 0 && d < 3) arm = lerp(2.9, 0.4, d / 3);
    if (d >= 0 && d < 12) { bounce = Math.max(bounce, Math.sin((d / 12) * Math.PI) * 0.12); shake = Math.max(shake, wobble(f, h, 1.6, 0.25) * 0.04); sq = d < 3 ? 0.2 : sq; }
  }
  const qs = pop(f, hits[2] + 6, 9);
  const c = camK(f, [{ f: 0, p: [1.6, 1.3, 3.2], l: [0.3, 0.8, 0], fov: 40 }, { f: k.dur, p: [1.2, 1.2, 2.2], l: [0.3, 0.85, 0], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, hor: '#3c4f8f', top: '#141a33' }} center={[0, 0, 0]} size={6} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#2a2f4a', { r: 0.9 })}><circleGeometry args={[12, 48]} /></mesh>
      <group position={[0.5, 0, 0]} rotation={[0, 0, shake]}>
        <mesh geometry={rbox(1.4, 0.35, 1.0, 0.05)} position={[0, 0.175, 0]} material={mat('#e0a458', { r: 0.6 })} castShadow receiveShadow />
        <mesh position={[0, 0.351, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#3a2412', { r: 0.9 })}><circleGeometry args={[0.2, 32]} /></mesh>
        <mesh position={[-0.45, 0.351, 0.25]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#3a2412', { r: 0.9 })}><circleGeometry args={[0.12, 3]} /></mesh>
        <mesh geometry={rbox(0.36, 0.36, 0.36, 0.03)} position={[0, 0.53 + bounce, 0]} rotation={[0, 0.3, 0]} scale={[1 + sq * 0.3, 1 - sq, 1 + sq * 0.3]} material={mat('#e74c3c', { r: 0.45 })} castShadow />
        <mesh position={[0.45, 0.45, 0.25]} material={mat('#3498db', { r: 0.45 })} castShadow><cylinderGeometry args={[0.15, 0.15, 0.2, 24]} /></mesh>
      </group>
      <Person look={look} pos={[-0.5, 0, -0.15]} rotY={0.9} pose={merge(idle(f, 4), EXPR.dumb, { armR: [arm, 0.2, 0.3], body: [0.15, 0, 0] })}
        propR={<group rotation={[Math.PI / 2, 0, 0]}><mesh position={[0, 0.1, 0]} material={mat('#8b5a3c', { r: 0.8 })}><cylinderGeometry args={[0.025, 0.025, 0.5, 8]} /></mesh><mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('#a0522d', { r: 0.7 })} castShadow><cylinderGeometry args={[0.09, 0.09, 0.26, 16]} /></mesh></group>}
        above={f >= hits[2] + 6 ? <QMark pos={[0, 0, 0]} s={0.4 * qs} /> : null} />
    </Stage>
  );
};
export { run, easeOut, Crowd };
