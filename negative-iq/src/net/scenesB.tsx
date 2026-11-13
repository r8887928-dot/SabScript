import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Stage, Lights, Cam, LOOKS, mat, basic, spr, radialTex } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, Crowd, Agent } from '../three/person';
import { Room, rbox, useScreen, Glow, Lamp, QMark } from '../three/props';
import { StarField, SunGlow } from '../three/earth';
import { Headset } from '../AvatarNiches';
import { Goggles, heroPose, NeonX } from '../Channel';
import { HERO, Label, synth } from '../game/scenes';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, smoother, kick, clamp, pop, hash } from '../lib/anim';
import { Mailbox, Envelope, Telegraph, VintageLab, Block, Moon, Waves, Cables, NetArcs, SpinnerSprite, PhoneProp, spinner, statusBar, FONT, CYAN, MAG, RED } from './kit';
import { Globe, lonRot, SeaFloor, NH1Earth, NH2You, NH3World, NH4Tease, NTitle, makeNI, N1Freeze, N1Send, N1Game, N1Billions, N2Router, N2Door, N2Neighbor, N3Terminal, N3Cash, N3Courier, N3GPS, N3Map, N4Radio, N4News, N4Street } from './scenesA';

const SEA = { ...LOOKS.night, top: '#06233a', hor: '#0b3a55', bot: '#04121e', fog: '#062a40', fogNear: 4, fogFar: 40, hemiSky: '#4fa8d8', hemiI: 0.9, sunI: 1.2, sun: '#9fd8ff', stars: 0 };

// ------------------------------------------------------------------ FIRST WEEK
/** a shelf whose products vanish (`empty` 0..1) */
const SparseShelf: React.FC<{ pos: number[]; rotY?: number; len?: number; seed?: number; empty: number }> = ({ pos, rotY = 0, len = 6, seed = 1, empty }) => {
  const items = useMemo(() => {
    const r = rng(seed); const out: any[] = [];
    const cols = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#e67e22', '#9b59b6', '#ecf0f1', '#1abc9c', '#ff7aa2'];
    for (let lvl = 0; lvl < 4; lvl++) for (let x = -len / 2 + 0.2; x < len / 2 - 0.2;) {
      const w = 0.18 + r() * 0.22, h = 0.2 + r() * 0.28;
      out.push({ x: x + w / 2, y: 0.32 + lvl * 0.5 + h / 2, w, h, d: 0.25 + r() * 0.1, c: cols[Math.floor(r() * cols.length)], cyl: r() < 0.3, gone: r() });
      x += w + 0.02;
    }
    return out;
  }, [len, seed]);
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.1, -0.28]} material={mat('#dfe3e8', { r: 0.6 })} castShadow receiveShadow><boxGeometry args={[len, 2.2, 0.06]} /></mesh>
      {[0, 1, 2, 3].map((l) => <mesh key={l} position={[0, 0.3 + l * 0.5, 0]} material={mat('#c8cdd3', { r: 0.5, m: 0.3 })} castShadow receiveShadow><boxGeometry args={[len, 0.04, 0.6]} /></mesh>)}
      {items.map((it, i) => {
        const s = clamp((it.gone * 0.85 + 0.15 - empty) * 8);
        if (s <= 0) return null;
        return it.cyl
          ? <mesh key={i} position={[it.x, it.y, 0]} scale={[s, s, s]} material={mat(it.c, { r: 0.35 })} castShadow><cylinderGeometry args={[it.w / 2.2, it.w / 2.2, it.h, 12]} /></mesh>
          : <mesh key={i} position={[it.x, it.y, 0]} scale={[s, s, s]} material={mat(it.c, { r: 0.55 })} castShadow><boxGeometry args={[it.w, it.h, it.d]} /></mesh>;
      })}
    </group>
  );
};
// «На полках появляются пустые места: магазины заказывали товары через интернет.»
export const N5Shelves: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n5_shelves');
  const empty = lerp(0.1, 0.75, smoother(ramp(f, 0, k.w(165) - 0)));
  const shopper = useMemo(() => randomLook(901, { shirt: '#26a69a', hairStyle: 'long', hair: '#b07a3a' }), []);
  const c = camK(f, [{ f: 0, p: [0, 1.6, 4.5], l: [0, 1.2, -4], fov: 50 }, { f: k.dur, p: [0.1, 1.5, 1.6], l: [-0.2, 1.1, -5], fov: 48 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -2]} size={10} noSky />
      <Cam {...c} />
      <group position={[0, 0, -1]}><Room w={6} d={14} h={3.4} wall="#eef1f4" floor="tile" ceilingLights={4} light={1.1} /></group>
      {[0, 1, 2].map((i) => <group key={i}><SparseShelf pos={[-1.6, 0, -1 - i * 3.2]} rotY={Math.PI / 2} len={3} seed={20 + i} empty={empty} /><SparseShelf pos={[1.6, 0, -1 - i * 3.2]} rotY={-Math.PI / 2} len={3} seed={30 + i} empty={empty} /></group>)}
      <Person look={shopper} pos={[-0.3, 0, -2.4]} rotY={-Math.PI / 2 + 0.4} pose={merge(idle(f, 4), EXPR.confused, { head: [0.1, 0.4, 0] })} />
      <group position={[-0.1, 0, -2]}>
        <mesh geometry={rbox(0.6, 0.4, 0.9, 0.03)} position={[0.4, 0.62, 0]} material={mat('#9aa5b1', { r: 0.4, m: 0.6 })} />
      </group>
      {f > k.w(164) && <Label text="ТОВАР ЗАКОНЧИЛСЯ" pos={[0.2, 2.45, -4.2]} h={0.16} bg="rgba(214,48,49,0.95)" s={pop(f, k.w(164), 8)} />}
    </Stage>
  );
};
// «Почта снова принимает бумажные письма.»
export const N5Post: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n5_post');
  const ppl = useMemo(() => [randomLook(920, { shirt: '#8e5ec7' }), randomLook(921, { hairStyle: 'bun', shirt: '#f1f1f1' })], []);
  const env = useMemo(() => { const r = rng(5); return Array.from({ length: 10 }).map((_, i) => ({ t0: i * 5, x: (r() - 0.5) * 3, y: 3 + r() * 2, rz: r() * 3 })); }, []);
  const c = camK(f, [{ f: 0, p: [8.0, 1.0, 3.2], l: [9.3, 1.4, 0], fov: 46 }, { f: k.dur, p: [8.2, 1.1, 2.4], l: [9.3, 1.5, 0], fov: 44 }]);
  return (
    <Stage>
      <Lights look={LOOKS.morning} center={[9, 0, 0]} size={20} frame={f} />
      <Cam {...c} />
      <City seed={9} near={2} far={5} />
      <Mailbox pos={[9.3, 0.16, -0.2]} rotY={-0.3} />
      <Person look={ppl[0]} pos={[10.1, 0.16, 0.4]} rotY={-1.2} pose={merge(idle(f, 2), EXPR.happy, { armR: [1.5, 0.1, 0.3] })} propR={<group rotation={[0, 0, Math.PI / 2]}><Envelope pos={[0, -0.05, 0.05]} s={0.7} /></group>} />
      <Person look={ppl[1]} pos={[10.8, 0.16, -1.2]} rotY={-1.4} pose={merge(idle(f, 5), EXPR.happy, { armR: [0.8, 0.1, 1.0] })} />
      {env.map((e, i) => {
        const p = clamp((f - e.t0) / 24);
        if (p <= 0 || p >= 1) return null;
        return <Envelope key={i} pos={[lerp(9.3 + e.x, 9.3, p), lerp(e.y, 1.5, easeOut(p)), lerp(1.5, 0.1, p)]} rot={[0.2, -0.3, e.rz * (1 - p)]} s={1.4 - p * 0.6} />;
      })}
    </Stage>
  );
};
/** rooftop antenna mast */
const Mast: React.FC<{ pos: number[] }> = ({ pos }) => {
  const m = mat('#9aa2ab', { r: 0.35, m: 0.8 });
  return (
    <group position={pos as any}>
      <mesh position={[0, 2.5, 0]} material={m}><cylinderGeometry args={[0.04, 0.05, 5, 8]} /></mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, 3.2 + i * 0.4, 0]} rotation={[0, i * 0.2, Math.PI / 2]} material={m}><cylinderGeometry args={[0.02, 0.02, 1.6 - i * 0.25, 6]} /></mesh>)}
      <mesh position={[0, 5.05, 0]} material={basic('#ff3b3b')}><sphereGeometry args={[0.06, 10, 8]} /></mesh>
    </group>
  );
};
// «А герои недели — радиолюбители: их рациям не нужны ни интернет, ни вышки.»
export const N5Ham: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n5_ham');
  const op = useMemo(() => randomLook(930, { hair: '#6b6b6b', hairStyle: 'short', shirt: '#2e4057', glasses: true }), []);
  const c = camK(f, [{ f: 0, p: [3.2, 21.4, 4.2], l: [0, 20.2, -0.4], fov: 46 }, { f: k.dur, p: [1.6, 21.0, 2.6], l: [0, 20.9, -0.6], fov: 48 }]);
  return (
    <Stage>
      <Lights look={LOOKS.dusk} center={[0, 20, 0]} size={20} frame={f} />
      <Cam {...c} />
      <group position={[-30, 0, -40]}><City seed={7} near={2} far={6} night={0.6} lamps={0.6} clear={[[30, 40, 14]]} /></group>
      <mesh position={[0, 10, -1]} material={mat('#7d6f63', { r: 0.9 })} receiveShadow castShadow><boxGeometry args={[12, 20, 10]} /></mesh>
      <mesh position={[0, 20.1, -1]} material={mat('#5d5650', { r: 0.9 })} receiveShadow><boxGeometry args={[12.2, 0.2, 10.2]} /></mesh>
      <Mast pos={[-2.2, 20.2, -2.5]} />
      <mesh geometry={rbox(1.4, 0.05, 0.7, 0.02)} position={[0, 20.95, -0.5]} material={mat('#6b4a30', { r: 0.6 })} castShadow />
      {[-0.6, 0.6].map((x) => <mesh key={x} position={[x, 20.6, -0.5]} material={mat('#555', { r: 0.6, m: 0.4 })}><boxGeometry args={[0.05, 0.7, 0.6]} /></mesh>)}
      <group position={[0.1, 20.98, -0.65]}>
        <mesh geometry={rbox(0.7, 0.3, 0.35, 0.03)} position={[0, 0.15, 0]} material={mat('#2d3436', { r: 0.4, m: 0.5 })} castShadow />
        <mesh position={[-0.12, 0.17, 0.18]} material={basic('#ffcf6a')}><boxGeometry args={[0.3, 0.1, 0.01]} /></mesh>
        {[0, 1, 2].map((i) => <mesh key={i} position={[0.12 + i * 0.08, 0.1, 0.18]} rotation={[Math.PI / 2, 0, 0]} material={mat('#b2bec3', { r: 0.3, m: 0.8 })}><cylinderGeometry args={[0.03, 0.03, 0.03, 14]} /></mesh>)}
      </group>
      <Person look={op} pos={[0.1, 20.2, 0.25]} rotY={Math.PI} onHead={<Headset />} pose={merge(idle(f, 3), EXPR.happy, { armR: [1.1, 0.1, 1.0], armL: [1.4 + Math.sin(f * 0.3) * 0.05, -0.1, 1.2], head: [0.15, 0, 0] })} />
      <Waves pos={[-2.2, 25.2, -2.5]} f={f} s={3} col="#ffcf6a" n={5} />
      <pointLight position={[0.1, 21.3, -0.2]} intensity={3} distance={3} color="#ffcf6a" />
    </Stage>
  );
};

// ------------------------------------------------------------------ FIRST MONTH
// «Люди соединяют компьютеры в своём доме проводами,»
export const N6Wires: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n6_wires');
  const w = smoother(ramp(f, 6, k.dur - 6));
  const c = camK(f, [{ f: 0, p: [0, 5.0, 21], l: [0, 4.6, 0], fov: 50 }, { f: k.dur, p: [2.0, 4.8, 18], l: [0, 4.6, 0], fov: 50 }]);
  return (
    <Stage>
      <Lights look={LOOKS.dusk} center={[0, 4, 0]} size={20} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#55606b', { r: 0.9 })}><planeGeometry args={[80, 80]} /></mesh>
      <group position={[-30, 0, -30]}><City seed={11} near={2} far={5} night={0.5} lamps={0.5} clear={[[30, 30, 14]]} /></group>
      <Block f={f} wires={w} />
      <Lamp pos={[4.6, 0, 2.2]} on={0.8} />
    </Stage>
  );
};
// «и появляется маленький интернет на 30 квартир. Со своим чатом и своими новостями.»
const CHAT = [['кв. 12', 'У кого есть батарейки?'], ['кв. 5', 'Завтра субботник!'], ['кв. 30', 'Нашёл бумажную карту'], ['кв. 18', 'Кто в шахматы?']];
export const N6Chat: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n6_chat');
  const times = [k.w(199), k.w(203), k.w(207), k.w(209)];
  const c = camK(f, [{ f: 0, p: [0.6, 5.2, 20], l: [0, 5.2, 0], fov: 50 }, { f: k.dur, p: [-0.6, 5.3, 21.5], l: [0, 5.3, 0], fov: 50 }]);
  return (
    <Stage>
      <Lights look={LOOKS.night} center={[0, 4, 0]} size={20} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#3b434c', { r: 0.9 })}><planeGeometry args={[80, 80]} /></mesh>
      <group position={[-30, 0, -30]}><City seed={11} near={2} far={5} night={1} lamps={1} clear={[[30, 30, 14]]} /></group>
      <Block f={f} wires={1} />
      {CHAT.map(([a, b], i) => f >= times[i] ? (
        <Label key={i} text={`${a}:\n${b}`} pos={[[0, 0.3, -0.2, 0.2][i], [8.6, 6.8, 5.0, 3.2][i], 1.0]} h={0.46} s={pop(f, times[i], 8)} bg={i % 2 ? 'rgba(60,108,240,0.95)' : 'rgba(18,0,42,0.92)'} />
      ) : null)}
    </Stage>
  );
};

// ------------------------------------------------------------------ IS IT POSSIBLE?
// «А это вообще возможно?»
export const N7Possible: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n7_possible');
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam pos={[0, 3, lerp(40, 33, smoother(f / k.dur))]} look={[0, 1, 0]} fov={40} />
      <StarField />
      <Globe rot={lonRot(-30) + f * 0.004} sun={[-0.4, 0.3, 0.9]} night={0.8}>
        <NetArcs r={10} f={f} on={0.8} />
      </Globe>
    </Stage>
  );
};
// «Почти весь интернет между континентами идёт по кабелям на дне океана.»
export const N7Cables: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n7_cables');
  const grow = smoother(ramp(f, 4, k.dur * 0.7));
  const c = camK(f, [{ f: 0, p: [0, 6, 30], l: [0, 2, 0], fov: 40 }, { f: k.dur, p: [8, 10, 34], l: [0, 2, 0], fov: 42 }]);
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam {...c} />
      <StarField />
      <SunGlow pos={[400, 260, 300]} s={240} />
      <Globe rot={lonRot(-35) + f * 0.003} sun={[0.6, 0.5, 0.7]} night={0.5}>
        <Cables r={10} f={f} grow={grow} />
      </Globe>
    </Stage>
  );
};
// «И их иногда рвут якоря кораблей.»
export const N7Anchor: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n7_anchor');
  const hit = k.cue('anchor_clunk');
  const ay = f < hit ? lerp(7, 0.6, easeOut(f / hit)) : 0.6;
  const snap = f >= k.cue('anchor_spark') ? (f - k.cue('anchor_spark')) / 18 : 0;
  const c = camK(f, [{ f: 0, p: [-4, 2.6, 9], l: [0, 1.6, 0], fov: 46 }, { f: k.dur, p: [-3, 1.8, 7], l: [0, 1.0, 0], fov: 44 }]);
  return (
    <Stage>
      <Lights look={SEA} center={[0, 0, 0]} size={20} frame={f} />
      <Cam pos={[c.pos[0] + kick(f, hit, 8) * 0.2, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <SeaFloor f={f} snap={snap} anchorY={ay} />
    </Stage>
  );
};
// «В 1859 году солнечная буря была такой сильной,» — the sun at the top, the storm pours down onto the Earth
export const N7Sun: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n7_sun');
  const parts = useMemo(() => { const r = rng(9); return Array.from({ length: 110 }).map(() => [r(), (r() - 0.5) * 26, (r() - 0.5) * 10, 0.6 + r() * 1.4]); }, []);
  const z = lerp(96, 88, smoother(f / k.dur));
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam pos={[0, 0, z]} look={[0, 0, 0]} fov={50} />
      <StarField />
      <mesh position={[0, 46, -10]} material={basic('#ffb347')}><sphereGeometry args={[18, 48, 32]} /></mesh>
      <sprite position={[0, 40, -8]} scale={[90, 90, 1]} material={spr('#ff9f43', { map: radialTex('glow'), add: true, t: 0.95 })} />
      <sprite position={[2, 27, -4]} scale={[18, 26, 1]} material={spr('#ffd27a', { map: radialTex('glow'), add: true, t: 0.6 + 0.3 * Math.sin(f * 0.3) })} />
      {parts.map((p, i) => {
        const t = ((f / 55 + p[0]) % 1);
        return <sprite key={i} position={[p[1] * (1 - t * 0.75), lerp(28, -20, t), p[2]]} scale={[p[3], p[3] * 1.6, 1]} material={spr(i % 3 ? '#ffcf6a' : '#ff6a3c', { map: radialTex('glow'), add: true, t: 0.85 })} />;
      })}
      <Globe rot={lonRot(0) + f * 0.004} r={7} pos={[0, -28, 0]} sun={[0, 1, 0.3]} night={0.8} />
      <sprite position={[0, -20.4, 1]} scale={[12, 3.5, 1]} material={spr('#3cff9e', { map: radialTex('glow'), add: true, t: 0.55 + 0.35 * Math.sin(f * 0.5) })} />
    </Stage>
  );
};
// «что из телеграфов летели искры.»
const OPERATOR = () => randomLook(941, { hair: '#4a2f1d', hairStyle: 'short', shirt: '#f4f1ea', tie: '#2d1e14', pants: '#3b2a1e' });
export const N7Telegraph: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n7_telegraph');
  const sp = k.cue('tele_spark');
  const spark = f >= sp - 4 ? clamp(1 - (f - sp - 14) / 20) * (0.6 + 0.4 * hash(f)) : 0;
  const c = camK(f, [{ f: 0, p: [0.95, 1.45, 1.6], l: [0, 1.22, -0.7], fov: 46 }, { f: k.dur, p: [0.8, 1.4, 1.35], l: [0, 1.2, -0.7], fov: 46 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.5, hemiI: 0.35, hemiSky: '#ffd9a8' }} center={[0, 1, 0]} size={5} noSky />
      <Cam pos={[c.pos[0] + kick(f, sp, 8) * 0.03, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <group position={[0, 0, 1]}><Room w={5} d={5} h={3} wall="#b89a72" floor="wood" light={0.35} /></group>
      <mesh geometry={rbox(1.6, 0.06, 0.8, 0.02)} position={[0, 0.78, -0.2]} material={mat('#5c3a22', { r: 0.6 })} castShadow receiveShadow />
      <mesh position={[0, 0.39, -0.2]} material={mat('#4a2f1c', { r: 0.6 })}><boxGeometry args={[1.5, 0.78, 0.7]} /></mesh>
      <Telegraph f={f} spark={spark} pos={[0, 0.81, -0.15]} />
      <mesh position={[-0.6, 0.95, -0.35]} material={basic('#ffcf6a')}><sphereGeometry args={[0.07, 12, 10]} /></mesh>
      <Glow pos={[-0.6, 0.98, -0.35]} s={0.9} color="#ffb347" o={0.6} />
      <pointLight position={[-0.6, 1.1, -0.3]} intensity={4} distance={4} color="#ffb347" />
      <Person look={OPERATOR()} pos={[0.05, 0, -0.95]} rotY={0} pose={merge(idle(f, 2), f >= sp ? EXPR.shock : EXPR.neutral, { armR: f >= sp ? [2.6, -0.5, 1.3] : [1.1, 0.1, 1.2], armL: f >= sp ? [2.6, -0.5, 1.3] : [0.9, 0.1, 1.2], body: [f >= sp ? -0.18 : 0.1, 0, 0] })} />
      {spark > 0 && <pointLight position={[0, 1.0, -0.1]} intensity={8 * spark} distance={3} color="#9fdcff" />}
    </Stage>
  );
};
// «Если такая буря случится сегодня, она может повредить кабели по всему миру.»
export const N7Today: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n7_today');
  const red = smoother(ramp(f, k.w(250), k.dur - 10));
  const c = camK(f, [{ f: 0, p: [0, 4, 30], l: [0, 1, 0], fov: 40 }, { f: k.dur, p: [-6, 6, 26], l: [0, 1, 0], fov: 40 }]);
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam pos={[c.pos[0] + kick(f, k.w(252), 8) * 0.3, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <StarField />
      <SunGlow pos={[-500, 100, 200]} s={320} />
      <Globe rot={lonRot(60) + f * 0.003} sun={[-0.8, 0.2, 0.5]} night={lerp(0.8, 0.3, red)} red={red * 0.35}>
        <Cables r={10} f={f} grow={1} red={red} />
      </Globe>
      <sprite position={[0, 9.2, 0]} scale={[9, 3, 1]} material={spr('#3cff9e', { map: radialTex('glow'), add: true, t: 0.35 + 0.2 * Math.sin(f * 0.4) })} />
    </Stage>
  );
};
// «А в 2021 году из-за одной ошибки в настройках на 6 часов отключились 3 огромных сервиса,»
const APPS: [string, string, string][] = [['#ff7a45', '#ffb347', 'cam'], ['#3c6cf0', '#6f9bff', 'ppl'], ['#16a085', '#2ecc71', 'chat']];
const appsScreen = (f: number, off: number[]) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  statusBar(g, w, true, f >= off[2]);
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1d1340'); bg.addColorStop(1, '#3b1d5c'); g.fillStyle = bg; g.fillRect(0, 44, w, h - 44);
  const s = 130;
  APPS.forEach(([a, b, kind], i) => {
    const x = w / 2 - s / 2, y = 120 + i * 190;
    const dead = f >= off[i];
    const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, dead ? '#666' : a); gr.addColorStop(1, dead ? '#444' : b);
    g.fillStyle = gr; (g as any).roundRect(x, y, s, s, 32); g.fill();
    g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 9;
    if (kind === 'cam') { (g as any).roundRect(x + 30, y + 30, s - 60, s - 60, 20); g.stroke(); g.beginPath(); g.arc(x + s / 2, y + s / 2, 20, 0, 7); g.stroke(); }
    if (kind === 'ppl') { g.beginPath(); g.arc(x + s / 2, y + 48, 18, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + s / 2, y + 100, 34, 22, 0, Math.PI, 0); g.fill(); }
    if (kind === 'chat') { g.beginPath(); g.ellipse(x + s / 2, y + s / 2 - 4, 40, 32, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 40, y + 88); g.lineTo(x + 34, y + 108); g.lineTo(x + 60, y + 92); g.fill(); }
    if (dead) { g.fillStyle = RED; g.beginPath(); g.arc(x + s - 6, y + 6, 24, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = `900 32px ${FONT}`; g.textAlign = 'center'; g.fillText('!', x + s - 6, y + 17); }
  });
};
export const N7Outage: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n7_outage');
  const off = [k.w(270), k.w(271) + 4, k.w(272)];
  const tex = useScreen(360, 740, 'apps' + off.map((o) => (f >= o ? 1 : 0)).join('') + Math.floor(f / 4), appsScreen(f, off));
  const c = camK(f, [{ f: 0, p: [0, 1.42, 1.45], l: [0, 1.4, 0], fov: 30 }, { f: k.dur, p: [0, 1.42, 1.3], l: [0, 1.4, 0], fov: 30 }]);
  return (
    <Stage bg="#120028">
      <Lights look={LOOKS.studio} center={[0, 1.3, 0]} size={3} noSky noFog />
      <Cam pos={[c.pos[0] + kick(f, off[0], 6) * 0.004, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <mesh position={[0, 1.3, -1]} material={basic('#1a0636')}><planeGeometry args={[6, 6]} /></mesh>
      <group position={[0, 1.3, 0]} rotation={[0, Math.sin(f * 0.03) * 0.12, 0]}>
        <group scale={[1.15, 1.15, 1.15]}><PhoneFace tex={tex} /></group>
      </group>
      <pointLight position={[0, 1.6, 0.6]} intensity={2} distance={2} color="#c9a8ff" />
    </Stage>
  );
};
const PhoneFace: React.FC<{ tex: THREE.Texture }> = ({ tex }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  return (
    <group>
      <mesh geometry={rbox(0.2, 0.41, 0.025, 0.03)} material={mat('#15161c', { r: 0.3, m: 0.4 })} />
      <mesh position={[0, 0, 0.0131]} material={m}><planeGeometry args={[0.184, 0.38]} /></mesh>
    </group>
  );
};
// «и миллиарды людей остались без сообщений.» — the night city, phones glowing, nothing arrives
export const N7People: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n7_people');
  const near = useMemo(() => { const r = rng(91); return Array.from({ length: 10 }).map((_, i) => ({ look: randomLook(960 + i), x: 7.4 + (i % 5) * 1.3 + r() * 0.3, z: -1 - Math.floor(i / 5) * 2.4, rot: (r() - 0.5) })); }, []);
  const far = useMemo(() => { const r = rng(92); const a: Agent[] = []; for (let i = 0; i < 200; i++) a.push({ x: 7.2 + r() * 5, z: -6 - r() * 100, rot: r() * 6, seed: i }); return a; }, []);
  const tex = useScreen(180, 370, 'spinph' + (Math.floor(f / 2) % 10), (g, w, h) => { g.fillStyle = '#f2f4f8'; g.fillRect(0, 0, w, h); spinner(g, w / 2, h / 2, 26, Math.floor(f / 2) * 2); });
  const c = camK(f, [{ f: 0, p: [9.6, 11, 3.2], l: [9.6, 0.5, -2.6], fov: 46 }, { f: k.dur, p: [9.6, 13.5, 4.5], l: [9.6, 0.4, -3], fov: 48 }]);
  return (
    <Stage>
      <Lights look={LOOKS.night} center={[8, 0, -8]} size={40} frame={f} />
      <Cam {...c} />
      <City seed={7} near={2} far={6} night={1} lamps={1} />
      <Crowd agents={far} f={0} />
      {near.map((p, i) => (
        <group key={i}>
          <Person look={p.look} pos={[p.x, 0.16, p.z]} rotY={p.rot} pose={merge(idle(f, i), EXPR.sad, { head: [0.45, 0, 0], armL: [1.5, -0.2, 1.4] })} propL={<PhoneProp tex={tex} />} />
          <pointLight position={[p.x, 1.5, p.z + 0.3]} intensity={0.8} distance={1.2} color="#9fc8ff" />
          <SpinnerSprite pos={[p.x, 2.3, p.z]} s={0.4 * pop(f, 4 + i * 2, 8)} f={f / 2} />
        </group>
      ))}
    </Stage>
  );
};

// ------------------------------------------------------------------ 1969
const loScreen = (f: number, typed: number, crash: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = crash > 0 ? '#120404' : '#041208'; g.fillRect(0, 0, w, h);
  g.font = `700 54px "Courier New", monospace`; g.textAlign = 'left';
  g.fillStyle = '#5dff8a';
  g.fillText('UCLA > SRI', 30, 70);
  g.fillText('> ' + 'LOGIN'.slice(0, typed) + (Math.floor(f / 8) % 2 && crash <= 0 ? '_' : ''), 30, 150);
  if (crash > 0) {
    g.fillStyle = RED; g.font = `900 46px "Courier New", monospace`;
    for (let i = 0; i < 4; i++) { let s = ''; for (let j = 0; j < 18; j++) s += String.fromCharCode(33 + Math.floor(hash(i * 31 + j + Math.floor(f / 2)) * 60)); g.fillText(s, 30, 230 + i * 50); }
    g.fillStyle = '#fff'; g.fillRect(0, h - 90, w, 90); g.fillStyle = RED; g.font = `900 44px ${FONT}`; g.textAlign = 'center'; g.fillText('СБОЙ СИСТЕМЫ', w / 2, h - 30);
  }
};
// «Кстати, первое сообщение в истории интернета тоже оборвалось.»
export const N8Lab: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n8_lab');
  const tex = useScreen(640, 480, 'lo0' + Math.floor(f / 8), loScreen(f, 0, 0));
  const c = camK(f, [{ f: 0, p: [3.2, 1.9, 3.6], l: [0, 1.1, -1.4], fov: 46 }, { f: k.dur, p: [2.0, 1.7, 2.6], l: [0.2, 1.1, -1.2], fov: 44 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 1.0, hemiSky: '#fff1d6' }} center={[0, 1, -1]} size={8} noSky />
      <Cam {...c} />
      <group position={[0, 0, 0.5]}><Room w={8} d={8} h={3} wall="#c9c2a8" floor="lino" ceilingLights={2} light={0.8} /></group>
      <VintageLab f={f} tex={tex} />
      <Person look={randomLook(970, { hair: '#2b1d16', hairStyle: 'short', shirt: '#f1f1f1', tie: '#2e4057', glasses: true })} pos={[0.4, 0, 0.15]} rotY={Math.PI} pose={merge(idle(f, 3), EXPR.neutral, { armL: [1.0, 0.05, 1.2], armR: [1.0, 0.05, 1.2] })} />
    </Stage>
  );
};
// «В 1969 году хотели отправить слово «LOGIN», а успели только «LO».»
export const N8LO: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n8_lo');
  const t1 = k.w(294), t2 = k.w(298) - 6, crash = k.cue('lo_crash');
  const typed = f < t1 ? 0 : f < t1 + 8 ? 1 : f < t2 ? 2 : 2;
  const cr = f >= crash ? 1 : 0;
  const tex = useScreen(640, 480, 'lo' + typed + cr + Math.floor(f / (cr ? 2 : 8)), loScreen(f, typed, cr));
  const c = camK(f, [{ f: 0, p: [0.42, 1.12, 1.05], l: [0.4, 1.02, -0.47], fov: 40 }, { f: k.dur, p: [0.41, 1.1, 0.85], l: [0.4, 1.02, -0.47], fov: 40 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.8, hemiSky: '#fff1d6' }} center={[0, 1, -1]} size={8} noSky />
      <Cam pos={[c.pos[0] + kick(f, crash, 8) * 0.02, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <group position={[0, 0, 0.5]}><Room w={8} d={8} h={3} wall="#c9c2a8" floor="lino" ceilingLights={2} light={0.8} /></group>
      <VintageLab f={f} tex={tex} crash={cr} />
    </Stage>
  );
};

// ------------------------------------------------------------------ CTA + teaser
// «Сколько бы ты продержался без интернета? Час, день или неделю? Пиши в комментариях и подписывайся:»
export const N9CTA: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#140033' }}>
      <div style={{ position: 'absolute', inset: -80, backgroundImage: synth(), backgroundSize: 'cover', transform: `scale(${1 + f * 0.0012})` }} />
      <div style={{ position: 'absolute', left: 540 - 330, top: 640, opacity: 0.9 }}><NeonX size={660} /></div>
      <div style={{ position: 'absolute', left: 90, top: 760, width: 900, height: 1160 }}>
        <ThreeCanvas width={900} height={1160} gl={{ antialias: true, alpha: true }} camera={{ fov: 30, near: 0.05, far: 100 }}>
          <Lights look={{ ...LOOKS.morning, sunAz: 30, sunEl: 32, sun: '#fff1e0', sunI: 2.3, hemiI: 1.0, env: 0.6 }} center={[0, 1.4, 0]} size={3} noSky noFog />
          <directionalLight position={[-2.6, 2.6, -2.6]} intensity={3.4} color={MAG} />
          <directionalLight position={[2.6, 2.4, -2.4]} intensity={2.8} color={CYAN} />
          <pointLight position={[0, 1.7, 1.6]} intensity={1.4} distance={4} color="#ffffff" />
          <Cam pos={[0.1, 1.42, 3.4]} look={[0, 1.3, 0]} fov={30} />
          <Person look={HERO()} blob={false} olWidth={0.008} onHead={<Goggles />}
            pose={heroPose({ head: [0.04, Math.sin(f * 0.05) * 0.12, -0.05], armR: [2.3 + Math.sin(f * 0.25) * 0.12, -0.3, 0.6], blink: (f % 80) < 4 ? 1 : 0 })} />
        </ThreeCanvas>
      </div>
    </div>
  );
};
// «дальше — что будет, если исчезнет Луна.»
export const N9Moon: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n9_moon');
  const gone = smoother(ramp(f, k.w(318), k.w(319) + 18));
  const r = rng(Math.floor(f / 2) + 1);
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam pos={[0, 2, lerp(60, 54, f / k.dur)]} look={[2, 0, 0]} fov={40} />
      <StarField />
      <SunGlow pos={[-400, 120, 300]} s={260} />
      <Globe rot={lonRot(10) + f * 0.003} pos={[-6, -12, -10]} sun={[-0.7, 0.3, 0.6]} night={0.6} />
      <Moon pos={[7, 9, 0]} r={3.4} o={1 - gone} />
      {gone > 0 && gone < 1 && Array.from({ length: 30 }).map((_, i) => {
        const a = r() * Math.PI * 2, d = 3.4 + gone * 10 * r();
        return <sprite key={i} position={[7 + Math.cos(a) * d, 9 + Math.sin(a) * d, 0]} scale={[0.6, 0.6, 1]} material={spr('#d9d6cf', { map: radialTex('glow'), add: true, t: 1 - gone })} />;
      })}
      {gone > 0 && <sprite position={[7, 9, 0.5]} scale={[16 * gone, 16 * gone, 1]} material={spr('#ffffff', { map: radialTex('glow'), add: true, t: 0.5 * (1 - gone) })} />}
    </Stage>
  );
};

export const NET_SCENES: Record<string, React.FC> = {
  nh1_earth: NH1Earth, nh2_you: NH2You, nh3_world: NH3World, nh4_tease: NH4Tease, title: NTitle,
  I1: makeNI('I1'), I2: makeNI('I2'), I3: makeNI('I3'), I4: makeNI('I4'), I5: makeNI('I5'), I6: makeNI('I6'),
  n1_freeze: N1Freeze, n1_send: N1Send, n1_game: N1Game, n1_billions: N1Billions,
  n2_router: N2Router, n2_door: N2Door, n2_neighbor: N2Neighbor,
  n3_terminal: N3Terminal, n3_cash: N3Cash, n3_courier: N3Courier, n3_gps: N3GPS, n3_map: N3Map,
  n4_radio: N4Radio, n4_news: N4News, n4_street: N4Street,
  n5_shelves: N5Shelves, n5_post: N5Post, n5_ham: N5Ham,
  n6_wires: N6Wires, n6_chat: N6Chat,
  n7_possible: N7Possible, n7_cables: N7Cables, n7_anchor: N7Anchor, n7_sun: N7Sun, n7_telegraph: N7Telegraph, n7_today: N7Today, n7_outage: N7Outage, n7_people: N7People,
  n8_lab: N8Lab, n8_lo: N8LO, n9_cta: N9CTA, n9_moon: N9Moon,
};
void QMark;
