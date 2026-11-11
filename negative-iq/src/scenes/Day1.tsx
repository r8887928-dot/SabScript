import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic, textTex } from '../three/core';
import { City, Sign } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walkPath } from '../three/person';
import { Car, Plane } from '../three/vehicles';
import { QMark, Room, rbox, Glow, useScreen, Screen, Smoke } from '../three/props';
import { StuckCars } from './Hour';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, kick, clamp, pop, wobble, smoother } from '../lib/anim';

// «Работа многих важных систем...» — power plant control room in alarm
export const C1Control: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('c1_control');
  const red = Math.floor(f / 8) % 2 === 0;
  const ops = useMemo(() => [randomLook(401, { shirt: '#f1f1f1', tie: '#2e4057', glasses: true }), randomLook(402, { shirt: '#5c80bc', hairStyle: 'bun' }), randomLook(403, { shirt: '#f1f1f1', hairStyle: 'bald' })], []);
  const wall = useScreen(1024, 512, 'w' + Math.floor(f / 4), (g, w, h) => {
    g.fillStyle = '#071a2c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#123a5c'; g.lineWidth = 2; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); } for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    const fall = clamp((f - 10) / 40);
    g.strokeStyle = '#2ae8ff'; g.lineWidth = 6; g.beginPath();
    for (let x = 0; x < w; x += 8) { const y = h * 0.3 + Math.sin(x * 0.03 + f * 0.2) * 20 + (x / w) * fall * h * 0.55; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    g.fillStyle = red ? '#ff2a2a' : '#7a0000'; g.font = '900 72px Montserrat'; g.textAlign = 'center'; g.fillText('СБОЙ СИСТЕМЫ', w / 2, h - 60);
    g.font = '700 40px Montserrat'; g.fillStyle = '#ffffff'; g.fillText(`МОЩНОСТЬ: ${Math.max(3, Math.round(100 - fall * 92))}%`, w / 2, 70);
  });
  const mon = useScreen(512, 320, 'm' + Math.floor(f / 6), (g, w, h) => {
    g.fillStyle = '#0b1d2e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { g.fillStyle = (i + Math.floor(f / 6)) % 3 === 0 ? '#ff3b3b' : '#2ecc71'; g.fillRect(30, 30 + i * 46, 30, 30); g.fillStyle = '#9fb3c8'; g.fillRect(80, 38 + i * 46, 200 + ((i * 37) % 160), 14); }
  });
  const c = camK(f, [{ f: 0, p: [3.2, 2.0, 4.2], l: [0, 1.5, -2.5], fov: 46 }, { f: k.dur, p: [1.9, 1.8, 3.0], l: [-0.2, 1.6, -2.6], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.6, hemiI: 0.35, env: 0.3 }} center={[0, 1, 0]} size={8} noSky />
      <Cam {...c} />
      <group position={[0, 0, -1]}><Room w={12} d={10} h={4} wall="#2f3a48" floor="dark" light={0.5} /></group>
      <Screen tex={wall} w={6.4} h={3.2} pos={[0, 2.3, -5.9]} frame="#111" />
      <pointLight position={[0, 3.6, 0]} intensity={red ? 40 : 6} distance={14} color="#ff3030" />
      <mesh position={[3.5, 3.6, -3]} material={red ? basic('#ff2a2a') : mat('#5a0000', { r: 0.4 })}><cylinderGeometry args={[0.15, 0.15, 0.3, 12]} /></mesh>
      {red && <Glow pos={[3.5, 3.6, -3]} s={2.4} color="#ff2a2a" />}
      {[-2.2, 0, 2.2].map((x, i) => (
        <group key={i} position={[x, 0, -2.2]}>
          <mesh geometry={rbox(2.0, 0.85, 0.9, 0.04)} position={[0, 0.42, 0]} material={mat('#4a5568', { r: 0.6 })} castShadow receiveShadow />
          <mesh position={[0, 0.86, 0.15]} rotation={[-Math.PI / 2 + 0.25, 0, 0]} material={mat('#1d2633', { r: 0.4 })}><planeGeometry args={[1.8, 0.5]} /></mesh>
          {Array.from({ length: 10 }).map((_, j) => <mesh key={j} position={[-0.75 + j * 0.17, 0.9, 0.2]} material={(j + Math.floor(f / 5) + i) % 4 === 0 ? basic('#ff3b3b') : basic(j % 3 ? '#2ecc71' : '#f1c40f')}><boxGeometry args={[0.08, 0.03, 0.06]} /></mesh>)}
          <Screen tex={mon} w={0.7} h={0.44} pos={[-0.45, 1.25, -0.25]} rot={[-0.1, 0.1, 0]} />
          <Screen tex={mon} w={0.7} h={0.44} pos={[0.45, 1.25, -0.25]} rot={[-0.1, -0.1, 0]} />
        </group>
      ))}
      <Person look={ops[0]} pos={[-2.2, 0, -1.3]} rotY={Math.PI} pose={merge(idle(f, 1), EXPR.dumb, { armL: [1.4 + Math.sin(f * 0.9) * 0.3, 0.1, 0.6], armR: [1.4 + Math.cos(f * 0.8) * 0.3, 0.1, 0.6] })} />
      <Person look={ops[1]} pos={[0.3, 0, -1.2]} rotY={2.6} pose={merge(idle(f, 2), EXPR.dumb2, { armR: [2.9, 0.4, 0], head: [-0.2, 0, 0.3] })} />
      <Person look={ops[2]} pos={[2.0, 0.55, -2.1]} rotY={0.3} pose={merge(idle(f, 3), EXPR.happy, { legL: 1.5, legR: 1.5, kneeL: 1.5, kneeR: 1.5, y: -0.35, armL: [0.3, 0.5, 0.2], armR: [0.3, 0.5, 0.2] })} />
    </Stage>
  );
};

// «...начинает останавливаться.» — a wave of blackout over the evening city
export const C2Blackout: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('c2_blackout');
  const start = k.cue('power_down');
  const R = f < start ? -1 : (f - start) * 9;
  const c = camK(f, [{ f: 0, p: [70, 70, 150], l: [0, 0, 0], fov: 44 }, { f: k.dur, p: [56, 62, 130], l: [0, 6, 0], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.dusk} center={[0, 0, 0]} size={120} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} night={1} lit={0.85} wave={[0, 0, R]} lamps={f < start + 8 ? 1 : 0} traffic="off" />
      <StuckCars seed={33} n={30} f={f} area={260} />
    </Stage>
  );
};

/** departures board texture */
const Board: React.FC<{ f: number; flipAt: number }> = ({ f, flipAt }) => {
  const rows = [['SU 1402', 'МОСКВА', '10:15'], ['FV 6031', 'САНКТ-ПЕТЕРБУРГ', '10:40'], ['U6 263', 'СОЧИ', '11:05'], ['S7 2511', 'НОВОСИБИРСК', '11:20'], ['DP 405', 'КАЗАНЬ', '11:45'], ['SU 1130', 'ЕКАТЕРИНБУРГ', '12:10']];
  const tex = useScreen(1024, 640, 'b' + Math.floor(f / 2), (g, w, h) => {
    g.fillStyle = '#0b0f17'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd34d'; g.font = '900 52px Montserrat'; g.textAlign = 'left'; g.fillText('ВЫЛЕТ', 30, 66);
    rows.forEach((r, i) => {
      const y = 140 + i * 82;
      g.fillStyle = '#1a2130'; g.fillRect(20, y - 50, w - 40, 72);
      g.font = '700 38px Montserrat'; g.fillStyle = '#ffffff'; g.fillText(r[0], 36, y); g.fillText(r[1], 230, y); g.fillText(r[2], 640, y);
      const flipped = f >= flipAt + i * 3;
      const mid = f >= flipAt + i * 3 - 3 && !flipped;
      g.fillStyle = flipped ? '#ff3b3b' : '#2ecc71'; g.font = '900 34px Montserrat';
      g.fillText(mid ? '########' : flipped ? 'ОТМЕНЁН' : 'ПО ПЛАНУ', 780, y);
    });
  });
  return <Screen tex={tex} w={4.8} h={3.0} pos={[0, 3.2, -4]} frame="#222" />;
};

// «Аэропорты прекращают работу.»
export const C3Airport: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('c3_airport');
  const cutAt = 28;
  if (f < cutAt) {
    const c = camK(f, [{ f: 0, p: [0.6, 2.9, 0.4], l: [0, 3.2, -4], fov: 46 }, { f: cutAt, p: [0.3, 3.0, -0.6], l: [0, 3.2, -4], fov: 44 }], (t) => t);
    return (
      <Stage>
        <Lights look={LOOKS.interior} center={[0, 1, 0]} size={8} noSky />
        <Cam {...c} />
        <group position={[0, 0, 0]}><Room w={14} d={10} h={6} wall="#dfe4ea" floor="tile" ceilingLights={3} /></group>
        <Board f={f} flipAt={k.cue('flapboard')} />
      </Stage>
    );
  }
  const g = f - cutAt;
  const ang = g * 0.03;
  const c = camK(g, [{ f: 0, p: [-60, 14, 70], l: [0, 4, 0], fov: 42 }, { f: k.dur - cutAt, p: [-48, 12, 58], l: [0, 4, 0], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.chaos} center={[0, 0, 0]} size={70} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#7a7d80', { r: 0.95 })}><planeGeometry args={[2000, 2000]} /></mesh>
      {Array.from({ length: 16 }).map((_, i) => <mesh key={i} position={[-150 + i * 20, 0.02, 30]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#f2f2ee', { r: 0.6 })}><planeGeometry args={[8, 0.4]} /></mesh>)}
      <mesh position={[40, 9, -50]} material={mat('#c9d6e3', { r: 0.25, m: 0.35 })} castShadow receiveShadow><boxGeometry args={[160, 18, 30]} /></mesh>
      <mesh position={[40, 18.2, -50]} material={mat('#9aa6b2', { r: 0.6 })}><boxGeometry args={[162, 0.8, 32]} /></mesh>
      <Sign text="АЭРОПОРТ" pos={[10, 14, -34.8]} w={30} h={5} bg="#1f4e8c" glow />
      <Plane pos={[-10, 0, -8]} rotY={Math.PI / 2 + 0.2} livery="#d63031" />
      <Plane pos={[Math.cos(ang) * 30 + 30, 0, Math.sin(ang) * 30 + 10]} rotY={-ang} livery="#2e86de" scale={0.9} />
      <Plane pos={[70, 0, -10]} rotY={-Math.PI / 2 - 0.4} livery="#16a085" scale={0.95} />
      <Car kind="van" color="#f1c40f" pos={[10, 0, 14]} rotY={1.2} />
    </Stage>
  );
};

/** hospital building */
const Hospital: React.FC = () => (
  <group>
    <mesh position={[0, 12, -6]} material={mat('#f4f6f7', { r: 0.8 })} castShadow receiveShadow><boxGeometry args={[40, 24, 14]} /></mesh>
    {Array.from({ length: 6 }).flatMap((_, fl) => Array.from({ length: 12 }).map((__, i) => (
      <mesh key={fl + '_' + i} position={[-17 + i * 3.1, 4.6 + fl * 3.4, 1.01]} material={mat('#6f9fc9', { r: 0.2, m: 0.3 })}><planeGeometry args={[2.0, 2.0]} /></mesh>
    )))}
    <mesh position={[0, 21.5, 1.05]} material={basic('#ffffff', { map: textTex('БОЛЬНИЦА', { w: 1024, h: 200, bg: '#ffffff', fg: '#d63031' }) })}><planeGeometry args={[16, 3.1]} /></mesh>
    <group position={[-12, 21.5, 1.1]}>
      <mesh material={basic('#e84118')}><boxGeometry args={[3.2, 1.0, 0.2]} /></mesh>
      <mesh material={basic('#e84118')}><boxGeometry args={[1.0, 3.2, 0.2]} /></mesh>
    </group>
    <mesh position={[0, 2, 1.2]} material={mat('#9fb7cc', { r: 0.2, m: 0.3 })}><boxGeometry args={[8, 4, 0.3]} /></mesh>
    <mesh position={[0, 4.4, 4]} material={mat('#dfe4ea', { r: 0.6 })} castShadow><boxGeometry args={[12, 0.4, 7]} /></mesh>
  </group>
);

// «Больницы испытывают огромные трудности.»
export const C4Hospital: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('c4_hospital');
  const cutAt = 48;
  if (f < cutAt) {
    const c = camK(f, [{ f: 0, p: [14, 3.2, 34], l: [0, 6, 0], fov: 46 }, { f: cutAt, p: [10, 2.6, 26], l: [0, 7, 0], fov: 46 }], (t) => t);
    return (
      <Stage>
        <Lights look={LOOKS.chaos} center={[0, 0, 10]} size={40} frame={f} />
        <Cam {...c} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#5a5d63', { r: 0.95 })}><planeGeometry args={[600, 600]} /></mesh>
        <group position={[0, 0, -60]}><City seed={7} near={2} far={5} /></group>
        <Hospital />
        {[0, 1, 2, 3, 4].map((i) => <Car key={i} kind="ambulance" color="#f5f6fa" pos={[-12 + i * 5.5, 0, 12 + (i % 2) * 2]} rotY={Math.PI + (i - 2) * 0.12} flash={f + i * 2} />)}
        {Array.from({ length: 8 }).map((_, i) => <Person key={i} look={randomLook(420 + i)} pos={[6 + (i % 4) * 1.1, 0, 6 + Math.floor(i / 4) * 1.2]} rotY={Math.PI - 0.3} pose={merge(idle(f, i), i % 2 ? EXPR.confused : EXPR.dumb)} />)}
      </Stage>
    );
  }
  const g = f - cutAt;
  const doc = randomLook(440, { coat: 'lab', glasses: true, hairStyle: 'short', hair: '#6b6b6b' });
  const c = camK(g, [{ f: 0, p: [0.9, 1.7, 2.2], l: [0, 1.6, 0], fov: 38 }, { f: k.dur - cutAt, p: [0.6, 1.72, 1.7], l: [0, 1.65, 0], fov: 36 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <group position={[0, 0, -1]}><Room w={8} d={8} h={3.2} wall="#dff3ef" floor="lino" ceilingLights={2} /></group>
      <Monitor f={g} />
      <Person look={doc} pos={[0, 0, 0]} rotY={0.1} pose={merge(idle(g, 5), EXPR.dumb, { armL: [1.2, 0.1, 1.1], armR: [1.2, 0.1, 1.1], head: [0.25, 0, 0.2] })}
        propL={<group position={[0.15, 0, 0.08]} rotation={[0.2, 0, Math.PI]}><mesh material={mat('#8b5a3c', { r: 0.7 })}><boxGeometry args={[0.3, 0.4, 0.02]} /></mesh><mesh position={[0, 0, 0.012]} material={basic('#ffffff', { map: textTex('АНАЛИЗЫ\n✓ ✓ ✗', { w: 256, h: 340, bg: '#ffffff', fg: '#333', size: 46 }) })}><planeGeometry args={[0.26, 0.34]} /></mesh></group>}
        above={<QMark pos={[0.1, 0, 0]} s={0.35 * pop(g, 10, 8)} />} />
    </Stage>
  );
};
const Monitor: React.FC<{ f: number }> = ({ f }) => {
  const tex = useScreen(512, 300, 'e' + f, (g, w, h) => {
    g.fillStyle = '#04140c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2bff88'; g.lineWidth = 5; g.beginPath();
    for (let x = 0; x < w; x += 4) { const ph = ((x + f * 14) % 160); const y = h / 2 + (ph > 70 && ph < 78 ? -90 : ph > 78 && ph < 86 ? 50 : Math.sin(x * 0.05) * 4); x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.fillStyle = '#2bff88'; g.font = '800 44px Montserrat'; g.fillText('♥ 128', w - 170, 50);
  });
  return <Screen tex={tex} w={0.9} h={0.53} pos={[-1.2, 1.7, -1.5]} rot={[0, 0.4, 0]} />;
};

/** roller shutter shop fronts */
export const C5Shutters: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('c5_shutters');
  const s1 = k.cue('shutter1'), s2 = k.cue('shutter2');
  const shops = [['ПЕКАРНЯ', '#d68910'], ['ЦВЕТЫ', '#d1477a'], ['АПТЕКА', '#20a4c9'], ['КАФЕ', '#c0392b']];
  const downAt = [s1 - 10, s1, s2 - 4, s2 + 8];
  const c = camK(f, [{ f: 0, p: [-9.5, 2.6, 16], l: [-7.5, 2.4, 0], fov: 48 }, { f: k.dur, p: [4.5, 2.6, 16], l: [6.5, 2.4, 0], fov: 48 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.chaos} center={[0, 0, 0]} size={16} frame={f} />
      <Cam {...c} />
      <group position={[0, 0, -40]}><City seed={7} near={2} far={5} /></group>
      <mesh position={[0, 4, -0.5]} material={mat('#d8c8b0', { r: 0.85 })} castShadow receiveShadow><boxGeometry args={[30, 8, 1]} /></mesh>
      <mesh position={[0, 0.08, 3]} material={mat('#bdb8ae', { r: 0.9 })} receiveShadow><boxGeometry args={[34, 0.16, 6]} /></mesh>
      {shops.map(([nm, col], i) => {
        const x = -10.5 + i * 7;
        const p = easeOut(clamp((f - downAt[i]) / 7));
        const bounce = f >= downAt[i] + 7 && f < downAt[i] + 14 ? Math.sin((f - downAt[i] - 7) * 0.9) * 0.08 * (1 - (f - downAt[i] - 7) / 7) : 0;
        const h = 3.4 * p;
        return (
          <group key={i} position={[x, 0, 0.05]}>
            <mesh position={[0, 4.4, 0.02]} material={basic('#ffffff', { map: textTex(nm, { w: 1024, h: 200, bg: col, fg: '#fff', radius: 20 }) })}><planeGeometry args={[5, 0.98]} /></mesh>
            <mesh position={[0, 1.85, 0]} material={mat('#3d4f63', { r: 0.2, m: 0.3 })}><planeGeometry args={[5, 3.4]} /></mesh>
            <mesh position={[0, 3.75, 0.12]} material={mat('#8a8f96', { r: 0.4, m: 0.6 })}><boxGeometry args={[5.3, 0.4, 0.3]} /></mesh>
            {h > 0.01 && (
              <group position={[0, 3.55 - h / 2 + bounce, 0.08]}>
                <mesh material={mat('#a9adb3', { r: 0.35, m: 0.7 })} castShadow><boxGeometry args={[5.1, h, 0.06]} /></mesh>
                {Array.from({ length: Math.max(1, Math.floor(h / 0.17)) }).map((_, j) => <mesh key={j} position={[0, h / 2 - j * 0.17 - 0.08, 0.035]} material={mat('#7f848a', { r: 0.4, m: 0.6 })}><boxGeometry args={[5.1, 0.03, 0.01]} /></mesh>)}
              </group>
            )}
            {p > 0.98 && <mesh position={[0, 1.6 + Math.sin(f * 0.2 + i) * 0.03, 0.2]} rotation={[0, 0, Math.sin(f * 0.15 + i) * 0.06]} material={basic('#ffffff', { map: textTex('ЗАКРЫТО', { w: 512, h: 160, bg: '#d63031', fg: '#fff', radius: 18 }) })}><planeGeometry args={[1.6, 0.5]} /></mesh>}
          </group>
        );
      })}
    </Stage>
  );
};

// «Люди больше не могут координировать свои действия.» — two movers, one sofa
export const C6Sofa: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('c6_sofa');
  const drop = k.cue('sofa_drop');
  const A = useMemo(() => randomLook(460, { shirt: '#e67e22', hairStyle: 'cap', hat: '#2e4057' }), []);
  const B = useMemo(() => randomLook(461, { shirt: '#2e86de', hairStyle: 'short' }), []);
  const tug = Math.sin(f * 0.11) * 0.6;
  const dropped = f >= drop;
  const yS = dropped ? lerp(0.9, 0.35, easeOut((f - drop) / 5)) : 0.9 + Math.sin(f * 0.2) * 0.04;
  const rot = tug * 0.5 + (dropped ? 0 : 0);
  const sh = kick(f, drop, 8) * 0.06;
  const pull = (side: number) => ({ body: [-0.2, 0, 0], armL: [1.0, 0.2, 0.3], armR: [1.0, 0.2, 0.3], legL: 0.4 * Math.sin(f * 0.4 + side), legR: -0.4 * Math.sin(f * 0.4 + side) });
  const c = camK(f, [{ f: 0, p: [0.6, 2.6, 11.5], l: [0, 1.0, 0], fov: 44 }, { f: k.dur, p: [-1.2, 2.3, 9.8], l: [0, 1.0, 0], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.chaos} center={[0, 0, 0]} size={14} frame={f} />
      <Cam pos={[c.pos[0] + sh, c.pos[1] + sh, c.pos[2]]} look={c.look} fov={c.fov} />
      <group position={[20, -0.16, 40]}><City seed={7} near={3} far={6} /></group>
      <group rotation={[0, rot, 0]}>
        <group position={[0, yS, 0]} rotation={[0, 0, dropped ? 0 : Math.sin(f * 0.13) * 0.12]}>
          <mesh geometry={rbox(2.6, 0.45, 0.9, 0.08)} material={mat('#8e44ad', { r: 0.9 })} castShadow receiveShadow />
          <mesh geometry={rbox(2.6, 0.6, 0.25, 0.08)} position={[0, 0.45, -0.33]} material={mat('#7d3c98', { r: 0.9 })} castShadow />
          {[-1.25, 1.25].map((x) => <mesh key={x} geometry={rbox(0.25, 0.5, 0.9, 0.08)} position={[x, 0.25, 0]} material={mat('#7d3c98', { r: 0.9 })} castShadow />)}
        </group>
        <Person look={A} pos={[-1.75 - Math.max(0, tug) * 0.3, 0, 0]} rotY={-Math.PI / 2} pose={merge(dropped ? EXPR.shock : EXPR.dumb, pull(0))} />
        <Person look={B} pos={[1.75 + Math.max(0, -tug) * 0.3, 0, 0]} rotY={Math.PI / 2} pose={merge(dropped ? EXPR.shock : EXPR.dumb2, pull(1.5))} />
      </group>
    </Stage>
  );
};
export { mixLook, smoother, wobble, ramp, rng, walkPath, Smoke, THREE };
