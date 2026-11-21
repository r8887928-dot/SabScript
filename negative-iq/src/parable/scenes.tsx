import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mat, basic, spr, radialTex } from '../three/core';
import { Person, randomLook, merge, EXPR, idle, walk, LookP, Pose } from '../three/person';
import { shotById } from '../lib/tl';
import { camK, lerp, rng, smoother, kick, clamp, easeIn, easeOut } from '../lib/anim';
import { Block, Crate } from '../cs/map';
import { Puffs } from '../cs/actors';

// «Абрикос через стену» — an old man's parable in a mahalla. Own story; flat-shaded cartoon folk in a small 3D village.
// Layout: the wall runs along z at x = 0. Abdulla's yard x < 0 (apricot tree at (-1.6, 0, -1) leaning over the wall),
// Karim's yard x > 0 (grape vines at x 2.5..4.5). Street z > 4 with the old man's tapchan at (5.5, 0, 7).
const useShot = (id: string) => {
  const f = useCurrentFrame();
  const s = shotById(id) ?? { dur: 120, from: 0 };
  return { f, dur: s.dur as number, p: f / Math.max(1, s.dur) };
};
const DAY = { ...LOOKS.day, sunAz: 55, sunEl: 42, sunI: 2.7, hemiI: 0.95, top: '#3a86d8', hor: '#bcdcf4', fog: '#cfe2f2', fogNear: 40, fogFar: 220 };
const NIGHT = { ...LOOKS.day, sunAz: 200, sunEl: 35, sun: '#9fb4ff', sunI: 1.8, hemiSky: '#5a6ab8', hemiGround: '#252b4d', hemiI: 1.2, top: '#0b1030', hor: '#26306a', bot: '#0b0f22', fog: '#1a2150', fogNear: 20, fogFar: 120, env: 0.2 };
const GOLD = { ...LOOKS.golden, sunAz: 230, sunEl: 14, top: '#5563b5', hor: '#ffb877', fog: '#e9a880', fogNear: 40, fogFar: 200 };

// ------------------------------------------------------------------ people
const DOPPI = ({ col = '#141414' }: { col?: string }) => (
  <group position={[0, 0.2, -0.01]} rotation={[0, Math.PI / 4, 0]}>
    <mesh material={mat(col, { r: 0.7 })} castShadow><cylinderGeometry args={[0.2, 0.21, 0.09, 4, 1]} /></mesh>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[Math.sin(i * Math.PI / 2) * 0.112, 0, Math.cos(i * Math.PI / 2) * 0.112]} rotation={[0, i * Math.PI / 2, Math.PI / 4]} material={basic('#f4f1e6')}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
      </mesh>
    ))}
  </group>
);
const Beard = () => <mesh position={[0, -0.2, 0.1]} scale={[1, 1.25, 0.7]} material={mat('#f1efe8', { r: 0.9 })}><sphereGeometry args={[0.15, 14, 10]} /></mesh>;
const ABDULLA: LookP = { skin: '#e8b48f', hair: '#2b1d16', hairStyle: 'short', shirt: '#2f6b3a', pants: '#2b2b2b', shoes: '#2a2a2a' };
const KARIM: LookP = { skin: '#d9a07a', hair: '#151515', hairStyle: 'short', shirt: '#6b6f76', pants: '#3b3b3b', shoes: '#2a2a2a' };
const BOBO: LookP = { skin: '#e8b48f', hair: '#e8e8e8', hairStyle: 'bald', shirt: '#2b3f8c', pants: '#3b3b3b', shoes: '#2a2a2a', tie: '#c0392b' };
const Abdulla: React.FC<{ pos: number[]; rotY?: number; pose?: Pose; propR?: React.ReactNode; propL?: React.ReactNode }> = (p) => <Person look={ABDULLA} {...p} onHead={<DOPPI />} />;
const Karim: React.FC<{ pos: number[]; rotY?: number; pose?: Pose; propR?: React.ReactNode; propL?: React.ReactNode }> = (p) => <Person look={KARIM} {...p} onHead={<DOPPI col="#1f2a44" />} />;
const Bobo: React.FC<{ pos: number[]; rotY?: number; pose?: Pose }> = (p) => <Person look={BOBO} {...p} onHead={<><DOPPI /><Beard /></>} />;
const folk = (i: number): LookP => randomLook(700 + i, i % 3 === 2 ? { hairStyle: 'long', skirt: true, shirt: ['#2a7ab8', '#b8336a', '#8e5ec7'][i % 3] } : { hairStyle: 'short', shirt: ['#6b6f76', '#2f6b3a', '#7a5230', '#2e4057'][i % 4] });
const ARMS_CROSSED: Pose = { armL: [1.2, -0.5, 1.9], armR: [1.2, -0.5, 1.9] };
const SHOUT: Pose = { armR: [0.4, 2.3, 0.3], armL: [0.3, 0.3, 0.4] };
const NO: Pose = { armR: [1.3, 0.2, 0.3], armL: [1.3, -0.1, 0.3] };

// ------------------------------------------------------------------ props
const Apricot: React.FC<{ pos: number[]; s?: number }> = ({ pos, s = 1 }) => <mesh position={pos as any} scale={[s, s, s]} material={mat('#f39c12', { r: 0.5 })} castShadow><sphereGeometry args={[0.07, 10, 8]} /></mesh>;
const Grapes: React.FC<{ pos: number[]; s?: number }> = ({ pos, s = 1 }) => (
  <group position={pos as any} scale={[s, s, s]}>{[[0, 0, 0], [0.06, 0.05, 0], [-0.06, 0.05, 0], [0, 0.1, 0.03], [0.05, -0.06, 0.02], [-0.04, -0.05, 0.02], [0, -0.12, 0]].map((q, i) => <mesh key={i} position={q as any} material={mat('#6d2a7a', { r: 0.4 })}><sphereGeometry args={[0.045, 8, 6]} /></mesh>)}</group>
);
const Basket: React.FC<{ fill?: 'apricot' | 'grape' | 'none'; n?: number }> = ({ fill = 'apricot', n = 9 }) => (
  <group>
    <mesh position={[0, 0.12, 0]} material={mat('#b07a3a', { r: 0.9 })} castShadow><cylinderGeometry args={[0.22, 0.16, 0.24, 14, 1, true]} /></mesh>
    <mesh position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#8a5a2b')}><circleGeometry args={[0.16, 14]} /></mesh>
    {fill === 'apricot' && Array.from({ length: n }).map((_, i) => { const r = rng(i + 4); return <Apricot key={i} pos={[(r() - 0.5) * 0.26, 0.22 + r() * 0.06, (r() - 0.5) * 0.26]} />; })}
    {fill === 'grape' && [0, 1, 2].map((i) => <Grapes key={i} pos={[(i - 1) * 0.1, 0.28, 0]} s={0.9} />)}
  </group>
);
/** basket held in a hand (hand-prop space: −y runs along the forearm) */
const HandBasket: React.FC<{ fill?: 'apricot' | 'grape' }> = ({ fill = 'apricot' }) => <group position={[0, -0.12, 0.05]} rotation={[Math.PI / 2, 0, 0]} scale={[0.8, 0.8, 0.8]}><Basket fill={fill} /></group>;

const Tree: React.FC<{ f: number; sway?: number; branch?: number }> = ({ f, sway = 0.02, branch = 0 }) => {
  const fruit = useMemo(() => { const r = rng(31); return Array.from({ length: 46 }).map(() => [(r() - 0.5) * 4.2, 3.0 + r() * 2.0, (r() - 0.5) * 2.6]); }, []);
  const s = Math.sin(f * 0.25) * sway;
  return (
    <group position={[-1.9, 0, -2.2]} scale={[0.72, 0.72, 0.72]}>
      <mesh position={[0, 1.4, 0]} rotation={[0, 0, -0.18]} material={mat('#6b4a2b', { r: 0.9 })} castShadow><cylinderGeometry args={[0.16, 0.26, 2.9, 10]} /></mesh>
      <group rotation={[0, 0, s - 0.08]}>
        {[[-0.6, 3.6, 0, 1.4], [0.9, 3.9, 0.3, 1.5], [0.2, 4.6, -0.3, 1.3], [-0.3, 3.4, 0.9, 1.1], [1.8, 3.6, -0.4, 1.2]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} material={mat(i % 2 ? '#4f8a2b' : '#5c9a33', { r: 0.85, flat: true })} castShadow><icosahedronGeometry args={[r, 1]} /></mesh>
        ))}
        {fruit.map(([x, y, z], i) => <Apricot key={i} pos={[x, y, z]} s={1.4} />)}
        {/* the big branch over the wall */}
        <group position={[0.6, 3.0, 0]} rotation={[0, 0, -0.35 - branch * 1.05]}>
          <mesh position={[1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('#6b4a2b', { r: 0.9 })} castShadow><cylinderGeometry args={[0.07, 0.13, 2.8, 8]} /></mesh>
          {[[2.3, 0.4, 0, 0.9], [3.0, 0.1, 0.3, 0.8], [1.6, 0.5, -0.4, 0.7]].map(([x, y, z, r], i) => <mesh key={i} position={[x, y, z]} material={mat('#5c9a33', { r: 0.85, flat: true })} castShadow><icosahedronGeometry args={[r, 1]} /></mesh>)}
          {[[2.4, -0.2, 0.3], [3.1, -0.3, -0.2], [1.9, -0.1, 0.4], [2.8, 0.0, 0.6]].map((q, i) => <Apricot key={i} pos={q} s={1.4} />)}
        </group>
      </group>
    </group>
  );
};
const brickMat = () => mat('#c99a63', { r: 0.95 });
/** the wall between the yards: state 0 standing, 1 collapsed, 2 rebuilt low (h), crack 0..1 */
const Wall: React.FC<{ state?: number; low?: number; crack?: number }> = ({ state = 0, low = 1.3, crack = 0 }) => {
  const m = useMemo(() => brickMat(), []);
  const top = useMemo(() => mat('#a77d4c', { r: 0.95 }), []);
  const rubble = useMemo(() => { const r = rng(9); return Array.from({ length: 34 }).map(() => [(r() - 0.5) * 2.4, r() * 0.25, (r() - 0.5) * 3.2 - 1, r() * 3]); }, []);
  const h = state === 2 ? low : 2.3;
  return (
    <group>
      {/* far part of the wall always stands */}
      <mesh position={[0, 1.15, -6]} material={m} castShadow receiveShadow><boxGeometry args={[0.35, 2.3, 6]} /></mesh>
      {state !== 1 && <mesh position={[0, h / 2, 0]} material={m} castShadow receiveShadow><boxGeometry args={[0.35, h, 6]} /></mesh>}
      {state !== 1 && <mesh position={[0, h + 0.05, 0]} material={top}><boxGeometry args={[0.45, 0.1, 6.1]} /></mesh>}
      {state === 0 && crack > 0 && <mesh position={[0.19, 1.5, -0.6]} rotation={[0, Math.PI / 2, -0.4]} material={basic('#3b2a1a')}><planeGeometry args={[0.06, 1.8 * crack]} /></mesh>}
      {state === 1 && rubble.map(([x, y, z, a], i) => <mesh key={i} position={[x, y + 0.1, z]} rotation={[a, a * 2, 0]} material={m} castShadow><boxGeometry args={[0.45, 0.2, 0.3]} /></mesh>)}
    </group>
  );
};
const Vines: React.FC<{ wilt?: number }> = ({ wilt = 0 }) => (
  <group>
    {[2.4, 3.4, 4.4].map((x) => (
      <group key={x} position={[x, 0, -1]}>
        {[-2, 0, 2].map((z) => <mesh key={z} position={[0, 0.8, z]} material={mat('#6b4a2b')}><cylinderGeometry args={[0.04, 0.04, 1.6, 6]} /></mesh>)}
        <mesh position={[0, 1.55, 0]} material={mat('#6b4a2b')}><boxGeometry args={[0.04, 0.04, 4.2]} /></mesh>
        {[-1.6, -0.8, 0, 0.8, 1.6].map((z) => <mesh key={'l' + z} position={[0, 1.35 - wilt * 0.5, z]} scale={[1, 1 - wilt * 0.5, 1]} material={mat(wilt > 0.5 ? '#8a8a3a' : '#4f8a2b', { r: 0.85, flat: true })}><icosahedronGeometry args={[0.38, 0]} /></mesh>)}
        {wilt < 0.5 && [-1.2, 0.4, 1.4].map((z) => <Grapes key={'g' + z} pos={[0.15, 1.05, z]} />)}
      </group>
    ))}
  </group>
);
const Tapchan: React.FC<{ pos: number[] }> = ({ pos }) => (
  <group position={pos as any}>
    <mesh position={[0, 0.45, 0]} material={mat('#7a4a25', { r: 0.8 })} castShadow receiveShadow><boxGeometry args={[2.2, 0.12, 1.8]} /></mesh>
    {[[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]].map(([x, z], i) => <mesh key={i} position={[x, 0.2, z]} material={mat('#5a3519')}><boxGeometry args={[0.12, 0.4, 0.12]} /></mesh>)}
    <mesh position={[0, 0.52, 0]} material={mat('#b3262e', { r: 0.9 })}><boxGeometry args={[2.0, 0.03, 1.6]} /></mesh>
    <mesh position={[0, 0.6, -0.1]} material={mat('#f0c419', { r: 0.6 })}><cylinderGeometry args={[0.35, 0.35, 0.08, 16]} /></mesh>
    <mesh position={[0.1, 0.72, -0.1]} material={mat('#2a6fb3', { r: 0.4 })}><sphereGeometry args={[0.1, 12, 8]} /></mesh>
    <mesh position={[-0.2, 0.68, 0.0]} material={mat('#f4f1e6', { r: 0.4 })}><cylinderGeometry args={[0.06, 0.04, 0.08, 10]} /></mesh>
  </group>
);
const Poplar: React.FC<{ pos: number[]; s?: number }> = ({ pos, s = 1 }) => (
  <group position={pos as any} scale={[s, s, s]}>
    <mesh position={[0, 0.8, 0]} material={mat('#6b4a2b')}><cylinderGeometry args={[0.08, 0.12, 1.6, 6]} /></mesh>
    <mesh position={[0, 4, 0]} scale={[1, 3.6, 1]} material={mat('#3f7d2a', { r: 0.85, flat: true })} castShadow><icosahedronGeometry args={[0.9, 1]} /></mesh>
  </group>
);
const Mountains = () => (
  <group>{[[-60, -90, 28], [-15, -110, 36], [30, -95, 30], [70, -80, 24], [-90, -40, 22], [95, -30, 22]].map(([x, z, h], i) => (
    <group key={i} position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} material={mat('#7f8fb8', { r: 1, flat: true })}><coneGeometry args={[h * 1.1, h, 7]} /></mesh>
      <mesh position={[0, h * 0.86, 0]} material={mat('#f4f6fb', { r: 1, flat: true })}><coneGeometry args={[h * 0.31, h * 0.28, 7]} /></mesh>
    </group>
  ))}</group>
);
const Door: React.FC<{ pos: number[]; rotY: number; open?: number }> = ({ pos, rotY, open = 0 }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    <mesh position={[0, 1.15, 0]} material={mat('#3a2a1a')}><planeGeometry args={[1.5, 2.3]} /></mesh>
    {[-1, 1].map((s) => <group key={s} position={[s * 0.75, 0, 0.03]} rotation={[0, -s * open * 1.4, 0]}><mesh position={[-s * 0.37, 1.15, 0]} material={mat('#2e5fa3', { r: 0.7 })} castShadow><boxGeometry args={[0.72, 2.25, 0.06]} /></mesh></group>)}
  </group>
);
const Village: React.FC<{ f: number; wall?: number; low?: number; crack?: number; sway?: number; branch?: number; wilt?: number; doors?: number; shade?: number }> = ({ f, wall = 0, low, crack, sway, branch = 0, wilt = 0, doors = 0, shade = 0 }) => {
  const ground = useMemo(() => mat('#e2c48f', { r: 0.95 }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={ground} receiveShadow><planeGeometry args={[300, 300]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 9]} material={mat('#c9a774', { r: 0.95 })} receiveShadow><planeGeometry args={[40, 4]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 11.2]} material={mat('#3f8fd6', { r: 0.3, m: 0.2 })}><planeGeometry args={[40, 0.5]} /></mesh>
      <Block pos={[-8.5, 0, -1]} size={[10, 4, 5]} rotY={Math.PI / 2} windows={2} seed={3} base="#e3c28c" />
      <Block pos={[8.5, 0, -1]} size={[10, 4.4, 5]} rotY={-Math.PI / 2} windows={2} seed={5} base="#dcb882" />
      <Door pos={[-5.98, 0, 1.2]} rotY={Math.PI / 2} open={doors} />
      <Door pos={[5.98, 0, 1.2]} rotY={-Math.PI / 2} open={doors} />
      <Block pos={[0, 0, -9]} size={[16, 3.2, 3]} windows={0} seed={8} base="#d8b47c" />
      <Wall state={wall} low={low} crack={crack} />
      <Tree f={f} sway={sway} branch={branch} />
      <Vines wilt={wilt} />
      {shade > 0 && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.4, 0.03, -1]} material={basic('#20140c', { t: 0.35 * shade })}><circleGeometry args={[3.2, 32]} /></mesh>}
      <Tapchan pos={[5.5, 0, 7]} />
      {[-14, -10, 10, 14, -18, 18].map((x, i) => <Poplar key={i} pos={[x, 0, -6 + (i % 2) * 4]} s={1 + (i % 3) * 0.15} />)}
      {[-12, -4, 4, 12].map((x, i) => <Poplar key={'s' + i} pos={[x, 0, 13.5]} s={0.9} />)}
      <Crate pos={[-4.6, 0, 3.2]} s={0.8} /><Crate pos={[4.2, 0, -4.2]} s={0.7} rotY={0.4} />
      <Mountains />
    </group>
  );
};

// ------------------------------------------------------------------ scenes
export const PHook: React.FC = () => {
  const { f, dur } = useShot('p_hook');
  const c = camK(f, [{ f: 0, p: [0.4, 4.2, 15], l: [0, 1.8, 0], fov: 46 }, { f: dur, p: [0.2, 3.2, 10.5], l: [0, 1.6, 0], fov: 44 }]);
  return (
    <Stage><Lights look={DAY} center={[0, 0, 0]} size={30} frame={f} /><Cam {...c} />
      <Village f={f} />
      <Abdulla pos={[-1.2, 0, 2.6]} rotY={-0.5} pose={merge(EXPR.sad, ARMS_CROSSED, idle(f, 1), { head: [0, -0.4, 0] })} />
      <Karim pos={[1.2, 0, 2.6]} rotY={0.5} pose={merge(EXPR.sad, ARMS_CROSSED, idle(f, 2), { head: [0, 0.4, 0] })} />
    </Stage>
  );
};
export const PTree: React.FC = () => {
  const { f, dur } = useShot('p_tree');
  const c = camK(f, [{ f: 0, p: [-5.0, 3.4, 3.2], l: [-1.2, 2.8, -2.2], fov: 50 }, { f: dur, p: [4.8, 3.2, 3.0], l: [0.4, 2.4, -2.2], fov: 50 }]);
  return <Stage><Lights look={DAY} center={[0, 0, 0]} size={30} frame={f} /><Cam {...c} /><Village f={f} /></Stage>;
};
export const PPick: React.FC = () => {
  const { f, dur } = useShot('p_pick');
  const c = camK(f, [{ f: 0, p: [5.2, 1.6, 3.6], l: [2.0, 0.6, 0.2], fov: 44 }, { f: dur, p: [4.4, 1.4, 3.0], l: [2.0, 0.6, 0.2], fov: 42 }]);
  const reach = Math.abs(Math.sin(f * 0.18));
  const drops = useMemo(() => { const r = rng(12); return Array.from({ length: 10 }).map(() => [0.8 + r() * 2.4, (r() - 0.5) * 3]); }, []);
  const taken = Math.floor(f / 9);
  return (
    <Stage><Lights look={DAY} center={[1, 0, 0]} size={20} frame={f} /><Cam {...c} />
      <Village f={f} />
      {drops.map(([x, z], i) => i >= taken && <Apricot key={i} pos={[x, 0.07, z]} s={1.3} />)}
      <group position={[2.6, 0, 0.9]}><Basket n={Math.min(14, 4 + taken)} /></group>
      <Karim pos={[2.0, 0, 0.4]} rotY={0.9} pose={merge(EXPR.grin, { legL: 1.2, legR: 0.9, kneeL: 1.9, kneeR: 1.7, y: -0.42, body: [0.45, 0, 0], armR: [0.9 + reach * 0.5, 0.15, 0.4], armL: [0.7, 0.2, 0.6] })} />
    </Stage>
  );
};
export const PShout: React.FC = () => {
  const { f, dur } = useShot('p_shout');
  const c = camK(f, [{ f: 0, p: [2.8, 2.9, 3.6], l: [-0.6, 2.7, 0.8], fov: 42 }, { f: dur, p: [2.3, 2.9, 3.0], l: [-0.6, 2.8, 0.8], fov: 40 }]);
  const k = kick(f, 20, 7);
  return (
    <Stage><Lights look={DAY} center={[0, 0, 0]} size={20} frame={f} /><Cam pos={[c.pos[0] + k * 0.05, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <Village f={f} />
      <Crate pos={[-0.7, 0, 0.8]} s={1.1} />
      <Abdulla pos={[-0.7, 1.1, 0.8]} rotY={Math.PI / 2} pose={merge(f > 18 ? EXPR.shock : EXPR.confused, SHOUT, { armR: [0.4, 2.2 + Math.sin(f * 0.5) * 0.25, 0.3], mouth: f > 18 ? 'open' : 'frown' })} />
    </Stage>
  );
};
export const PNo: React.FC = () => {
  const { f, dur } = useShot('p_no');
  const c = camK(f, [{ f: 0, p: [3.6, 2.7, 6.0], l: [0.2, 2.0, 0.8], fov: 46 }, { f: dur, p: [3.2, 2.6, 5.2], l: [0.2, 2.0, 0.8], fov: 44 }]);
  return (
    <Stage><Lights look={DAY} center={[0, 0, 0]} size={20} frame={f} /><Cam {...c} />
      <Village f={f} />
      <Crate pos={[-0.7, 0, 0.8]} s={1.1} />
      <Abdulla pos={[-0.7, 1.1, 0.8]} rotY={Math.PI / 2} pose={merge(EXPR.shock, SHOUT)} />
      <Karim pos={[1.6, 0, 0.9]} rotY={-Math.PI / 2 + 0.3} pose={merge(EXPR.confused, NO, { armR: [1.3, 0.2 + Math.sin(f * 0.45) * 0.4, 0.3], mouth: 'open' })} propL={<HandBasket />} />
    </Stage>
  );
};
export const PCrowd: React.FC = () => {
  const { f, dur } = useShot('p_crowd');
  const c = camK(f, [{ f: 0, p: [0.5, 3.6, 15], l: [0, 1.2, 4], fov: 44 }, { f: dur, p: [1.5, 2.8, 12.5], l: [0.4, 1.3, 4], fov: 42 }]);
  const crowd = useMemo(() => Array.from({ length: 12 }).map((_, i) => { const r = rng(i + 70); return { x: (r() - 0.5) * 9, z: 5.6 + r() * 3, i }; }), []);
  return (
    <Stage><Lights look={DAY} center={[0, 0, 4]} size={24} frame={f} /><Cam {...c} />
      <Village f={f} />
      {crowd.map(({ x, z, i }) => { const arrive = clamp((f - i * 4) / 30); return <Person key={i} look={folk(i)} pos={[x + (x > 0 ? 6 : -6) * (1 - arrive), 0, z]} rotY={Math.PI + (x > 0 ? 0.3 : -0.3)} pose={merge(arrive < 1 ? walk(f * 0.3 + i, 0.8) : idle(f, i), EXPR.confused)} onHead={i % 3 !== 2 ? <DOPPI /> : undefined} />; })}
      <Abdulla pos={[-1.1, 0, 4.4]} rotY={0.6} pose={merge(EXPR.sad, ARMS_CROSSED)} />
      <Karim pos={[1.1, 0, 4.4]} rotY={-0.6} pose={merge(EXPR.sad, ARMS_CROSSED)} />
    </Stage>
  );
};
export const PJudge: React.FC = () => {
  const { f, dur } = useShot('p_judge');
  const c = camK(f, [{ f: 0, p: [3.6, 1.6, 10.6], l: [5.5, 1.5, 7], fov: 40 }, { f: dur, p: [4.4, 1.55, 9.6], l: [5.5, 1.55, 7], fov: 38 }]);
  return (
    <Stage><Lights look={DAY} center={[5, 0, 7]} size={16} frame={f} /><Cam {...c} />
      <Village f={f} />
      <Bobo pos={[5.5, 0.15, 7.2]} rotY={-0.4} pose={merge(EXPR.happy, idle(f, 4), { legL: 1.4, legR: 1.4, kneeL: 1.45, kneeR: 1.45, armR: [1.9, 0.15, 1.6 + Math.sin(f * 0.12) * 0.1], armL: [0.5, 0.2, 1.2] })} />
    </Stage>
  );
};
export const PShade: React.FC = () => {
  const { f, dur } = useShot('p_shade');
  const c = camK(f, [{ f: 0, p: [7.6, 7.2, 6.4], l: [2.2, 0.6, -1], fov: 46 }, { f: dur, p: [6.6, 6.2, 5.2], l: [2.4, 0.6, -1], fov: 44 }]);
  return (
    <Stage><Lights look={DAY} center={[1, 0, -1]} size={20} frame={f} /><Cam {...c} />
      <Village f={f} wilt={1} shade={clamp(f / 30)} />
      <Karim pos={[3.6, 0, 2.2]} rotY={Math.PI + 0.3} pose={merge(EXPR.sad, { head: [0.3, 0, 0], armL: [0.2, 0.1, 0.3], armR: [0.2, 0.1, 0.3] })} />
    </Stage>
  );
};
export const PThink: React.FC = () => {
  const { f, dur } = useShot('p_think');
  const c = camK(f, [{ f: 0, p: [0, 2.3, 9.4], l: [0, 1.4, 1.2], fov: 46 }, { f: dur, p: [0, 2.2, 8.4], l: [0, 1.45, 1.2], fov: 44 }]);
  const hand: Pose = { armR: [1.6, 0.1, 2.3], head: [0.25, 0, 0] };
  return (
    <Stage><Lights look={DAY} center={[0, 0, 0]} size={20} frame={f} /><Cam {...c} />
      <Village f={f} />
      <Abdulla pos={[-0.9, 0, 2.2]} rotY={0.4} pose={merge(EXPR.sad, hand, { armL: [1.2, -0.5, 1.9] })} />
      <Karim pos={[0.9, 0, 2.2]} rotY={-0.4} pose={merge(EXPR.sad, hand, { armL: [1.2, -0.5, 1.9] })} />
    </Stage>
  );
};
const Leaves: React.FC<{ f: number }> = ({ f }) => (
  <>{Array.from({ length: 40 }).map((_, i) => { const r = rng(i + 90); const x = ((r() * 14 + f * (0.12 + r() * 0.1)) % 14) - 7; return <mesh key={i} position={[x, 1 + r() * 4 + Math.sin(f * 0.2 + i) * 0.3, (r() - 0.5) * 6]} rotation={[f * 0.2 + i, f * 0.13, i]} material={mat('#5c9a33', { side: THREE.DoubleSide })}><planeGeometry args={[0.12, 0.08]} /></mesh>; })}</>
);
export const PWind: React.FC = () => {
  const { f, dur } = useShot('p_wind');
  const c = camK(f, [{ f: 0, p: [3.8, 2.2, 8.5], l: [-0.6, 3.0, -1], fov: 48, roll: -3 }, { f: dur, p: [3.2, 2.0, 7.4], l: [-0.6, 3.1, -1], fov: 46, roll: 3 }]);
  return (
    <Stage><Lights look={NIGHT} center={[0, 0, 0]} size={24} frame={f} /><Cam {...c} />
      <Village f={f} sway={0.14} />
      <Leaves f={f} />
      <sprite position={[-14, 22, -40]} scale={[5, 5, 1]} material={spr('#fff7d6', { map: radialTex('glow'), add: true, t: 1 })} />
    </Stage>
  );
};
export const PCrack: React.FC = () => {
  const { f, dur } = useShot('p_crack');
  const hit = 32;
  const br = easeIn(clamp((f - 6) / (hit - 6)));
  const k = kick(f, hit, 8);
  const c = camK(f, [{ f: 0, p: [4.2, 2.6, 10.5], l: [0, 2.4, -0.5], fov: 52 }, { f: dur, p: [3.4, 2.3, 9.2], l: [0, 1.8, 0], fov: 50 }]);
  const out = clamp((f - hit - 10) / 20);
  return (
    <Stage><Lights look={DAY} center={[0, 0, 0]} size={24} frame={f} /><Cam pos={[c.pos[0] + k * 0.12, c.pos[1] + k * 0.08, c.pos[2]]} look={c.look} fov={c.fov} />
      <Village f={f} branch={br} crack={f >= hit ? 1 : 0} doors={out} />
      <Puffs pos={[0.4, 1.6, 0]} t={f >= hit ? (f - hit) / 30 : 0} n={16} r={1.6} col="#d8b98a" o={0.9} s={1.2} />
      {out > 0 && <Abdulla pos={[lerp(-6.2, -3.6, out), 0, 1.4]} rotY={Math.PI / 2} pose={merge(EXPR.shock, walk(f * 0.35, out < 1 ? 1 : 0))} />}
      {out > 0 && <Karim pos={[lerp(6.2, 3.6, out), 0, 1.4]} rotY={-Math.PI / 2} pose={merge(EXPR.shock, walk(f * 0.35 + 1, out < 1 ? 1 : 0))} />}
    </Stage>
  );
};
export const PFall: React.FC = () => {
  const { f, dur } = useShot('p_fall');
  const c = camK(f, [{ f: 0, p: [0.3, 2.0, 7.0], l: [0, 1.3, 0], fov: 44 }, { f: dur, p: [0.2, 1.8, 5.8], l: [0, 1.4, 0], fov: 42 }]);
  return (
    <Stage><Lights look={DAY} center={[0, 0, 0]} size={20} frame={f} /><Cam {...c} />
      <Village f={f} wall={1} branch={1} />
      <Puffs pos={[0, 0.3, 0]} t={0.6 + f / 200} n={10} r={2.4} col="#d8b98a" o={0.5} s={1.4} />
      <Abdulla pos={[-0.55, 0, 1.4]} rotY={0.25} pose={merge(EXPR.confused, idle(f, 1), { armL: [0.2, 0.1, 0.3] })} />
      <Karim pos={[0.55, 0, 1.4]} rotY={-0.25} pose={merge(EXPR.confused, idle(f, 2), { armR: [0.2, 0.1, 0.3] })} />
    </Stage>
  );
};
export const PBuild: React.FC = () => {
  const { f, dur } = useShot('p_build');
  const c = camK(f, [{ f: 0, p: [4.6, 2.4, 6.4], l: [0, 0.8, 0], fov: 44 }, { f: dur, p: [3.8, 2.2, 5.4], l: [0, 0.8, 0], fov: 42 }]);
  const h = lerp(0.2, 1.3, smoother(clamp(f / (dur - 20))));
  const lift = Math.abs(Math.sin(f * 0.16));
  const brick = <mesh position={[0, -0.12, 0.12]} material={brickMat()}><boxGeometry args={[0.3, 0.14, 0.2]} /></mesh>;
  return (
    <Stage><Lights look={DAY} center={[0, 0, 0]} size={20} frame={f} /><Cam {...c} />
      <Village f={f} wall={2} low={h} />
      <Abdulla pos={[-0.9, 0, 1.2]} rotY={Math.PI / 2} pose={merge(EXPR.happy, { armR: [0.8 + lift * 0.7, 0.1, 0.4], armL: [0.8 + lift * 0.7, -0.1, 0.4], body: [0.2, 0, 0] })} propR={brick} />
      <Karim pos={[0.9, 0, 1.2]} rotY={-Math.PI / 2} pose={merge(EXPR.happy, { armR: [0.8 + (1 - lift) * 0.7, 0.1, 0.4], armL: [0.8 + (1 - lift) * 0.7, -0.1, 0.4], body: [0.2, 0, 0] })} propR={brick} />
    </Stage>
  );
};
export const PTrade: React.FC = () => {
  const { f, dur } = useShot('p_trade');
  const c = camK(f, [{ f: 0, p: [0.2, 2.0, 6.2], l: [0, 1.3, 0.8], fov: 42 }, { f: dur, p: [0.1, 1.9, 5.2], l: [0, 1.35, 0.8], fov: 40 }]);
  const reach = smoother(clamp((f - 10) / 25));
  return (
    <Stage><Lights look={DAY} center={[0, 0, 0]} size={20} frame={f} /><Cam {...c} />
      <Village f={f} wall={2} low={1.3} />
      <Abdulla pos={[-0.75, 0, 0.9]} rotY={Math.PI / 2 - 0.3} pose={merge(EXPR.grin, { armR: [lerp(0.6, 1.45, reach), 0.1, 0.2] })} propR={<HandBasket fill="apricot" />} />
      <Karim pos={[0.75, 0, 0.9]} rotY={-Math.PI / 2 + 0.3} pose={merge(EXPR.grin, { armR: [lerp(0.6, 1.45, reach), 0.1, 0.2] })} propR={<HandBasket fill="grape" />} />
    </Stage>
  );
};
export const PMoral: React.FC = () => {
  const { f, dur } = useShot('p_moral');
  const c = camK(f, [{ f: 0, p: [-3, 3.0, 12], l: [0, 2.6, 0], fov: 46 }, { f: dur, p: [-2, 2.8, 10.5], l: [0, 2.6, 0], fov: 44 }]);
  return <Stage><Lights look={GOLD} center={[0, 0, 0]} size={30} frame={f} /><Cam {...c} /><Village f={f} wall={2} low={1.3} /></Stage>;
};
export const PAsk: React.FC = () => {
  const { f, dur } = useShot('p_ask');
  const c = camK(f, [{ f: 0, p: [4.2, 2.0, 10.4], l: [5.5, 1.85, 7], fov: 40 }, { f: dur, p: [4.7, 1.95, 9.6], l: [5.5, 1.9, 7], fov: 38 }]);
  return (
    <Stage><Lights look={GOLD} center={[5, 0, 7]} size={16} frame={f} /><Cam {...c} />
      <Village f={f} wall={2} low={1.3} />
      <Bobo pos={[5.5, 0.15, 7.2]} rotY={-0.3} pose={merge(EXPR.grin, idle(f, 4), { legL: 1.4, legR: 1.4, kneeL: 1.45, kneeR: 1.45, armR: [1.3, 0.3, 0.6], armL: [0.5, 0.2, 1.2] })} />
    </Stage>
  );
};

export const PAR_SCENES: Record<string, React.FC> = {
  p_hook: PHook, p_tree: PTree, p_pick: PPick, p_shout: PShout, p_no: PNo, p_crowd: PCrowd, p_judge: PJudge, p_shade: PShade,
  p_think: PThink, p_wind: PWind, p_crack: PCrack, p_fall: PFall, p_build: PBuild, p_trade: PTrade, p_moral: PMoral, p_ask: PAsk,
};
void easeOut;
