import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Lights, Cam, LOOKS, mat, basic, spr, radialTex } from '../three/core';
import { useScreen } from '../three/props';
import { PStage, Street, Sage as SageCard, Face } from './look';
import { shotById, tl } from '../lib/tl';
import { camK, lerp, rng, smoother, clamp, easeOut } from '../lib/anim';

// «9 монет и 2 взвешивания» — a puzzle explainer in a warm jeweller's workshop. Own world and character.
// Layout: work table top at y 0.9 spanning x −2.2..2.2, z −0.6..0.6. Balance scale on the table at x 0.
// Back wall z −2.2 with shelves, a big flip board above the scale, string lights. Character stands at x 2.9.
const useShot = (id: string) => {
  const f = useCurrentFrame();
  const s = shotById(id) ?? { dur: 120, from: 0 };
  return { f, dur: s.dur as number, p: f / Math.max(1, s.dur), board: (s as any).board as string };
};
const WARM = { ...LOOKS.golden, sunAz: 35, sunEl: 26, sun: '#ffc184', sunI: 3.4, top: '#3d4c9c', hor: '#ffb877', bot: '#5a4060', fog: '#e7a07a', fogNear: 18, fogFar: 90, hemiSky: '#b8c2f0', hemiGround: '#7a5a3a', hemiI: 1.35, env: 0.55 };
const TABLE_Y = 0.9;
const SC = 0.62;
const GOLD = '#e7b52c';

// ------------------------------------------------------------------ character
const Sage: React.FC<{ f: number; face?: Face; talk?: number; arm?: number; pos?: number[] }> = ({ f, face = 'sly', talk = 0.6, arm = 0, pos = [2.75, 0, 0.9] }) => <SageCard f={f} pos={pos} face={face} talk={talk} arm={arm} h={1.9} />;

// ------------------------------------------------------------------ props
const coinMat = () => mat(GOLD, { r: 0.28, m: 0.85 });
export const Coin: React.FC<{ pos: number[]; glow?: number; rot?: number[] }> = ({ pos, glow = 0, rot = [0, 0, 0] }) => (
  <group position={pos as any} rotation={rot as any}>
    <mesh material={useMemo(coinMat, [])} castShadow><cylinderGeometry args={[0.11, 0.11, 0.025, 28]} /></mesh>
    <mesh position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]} material={useMemo(() => mat('#c7951c', { r: 0.35, m: 0.8 }), [])}><torusGeometry args={[0.085, 0.008, 6, 24]} /></mesh>
    {glow > 0 && <sprite position={[0, 0.05, 0]} scale={[0.6 * glow, 0.6 * glow, 1]} material={spr('#ffe7a0', { map: radialTex('glow'), add: true, t: glow })} />}
  </group>
);
/** a stack of n coins standing at pos (bottom) */
const Stack: React.FC<{ pos: number[]; n: number; glow?: number }> = ({ pos, n, glow = 0 }) => (
  <group position={pos as any}>{Array.from({ length: n }).map((_, i) => <Coin key={i} pos={[Math.sin(i * 2.1) * 0.012, 0.013 + i * 0.027, Math.cos(i * 1.7) * 0.012]} glow={i === n - 1 ? glow : 0} />)}</group>
);
/** balance scale on the table; tilt > 0 = left pan down. pans carry `left` / `right` children (coins) */
const Scale: React.FC<{ tilt: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ tilt, left, right }) => {
  const brass = useMemo(() => mat('#c08a2e', { r: 0.3, m: 0.85 }), []);
  const dark = useMemo(() => mat('#3a2412', { r: 0.6 }), []);
  const L = 0.85, a = tilt * 0.22;
  const pan = (side: number, kids: React.ReactNode) => {
    const x = side * L * Math.cos(a), y = 1.45 - side * L * Math.sin(a);
    return (
      <group position={[x, y, 0]}>
        {[0, 1, 2].map((i) => { const ang = (i / 3) * Math.PI * 2; return <mesh key={i} position={[Math.cos(ang) * 0.13, -0.3, Math.sin(ang) * 0.13]} rotation={[Math.sin(ang) * 0.4, 0, -Math.cos(ang) * 0.4]} material={brass}><cylinderGeometry args={[0.006, 0.006, 0.64, 4]} /></mesh>; })}
        <mesh position={[0, -0.6, 0]} material={brass} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.24, 0.05, 32]} /></mesh>
        <group position={[0, -0.575, 0]} scale={[1 / SC, 1 / SC, 1 / SC]}>{kids}</group>
      </group>
    );
  };
  return (
    <group position={[0, TABLE_Y, 0]} scale={[SC, SC, SC]}>
      <mesh position={[0, 0.04, 0]} material={dark} castShadow><cylinderGeometry args={[0.32, 0.38, 0.08, 24]} /></mesh>
      <mesh position={[0, 0.75, 0]} material={brass} castShadow><cylinderGeometry args={[0.035, 0.05, 1.4, 12]} /></mesh>
      <mesh position={[0, 1.5, 0]} material={brass}><sphereGeometry args={[0.07, 14, 10]} /></mesh>
      <mesh position={[0, 1.45, 0]} rotation={[0, 0, -a]} material={brass} castShadow><boxGeometry args={[L * 2 + 0.1, 0.04, 0.05]} /></mesh>
      <mesh position={[0, 1.45, 0.04]} rotation={[0, 0, -a]} material={basic('#1d1209')}><boxGeometry args={[0.02, 0.36, 0.01]} /></mesh>
      {pan(-1, left)}{pan(1, right)}
    </group>
  );
};
/** three coins in a little triangle on a pan / table */
const Trio: React.FC<{ pos?: number[]; glow?: number; n?: number }> = ({ pos = [0, 0, 0], glow = 0, n = 3 }) => (
  <group position={pos as any}>{[[-0.125, 0, 0.07], [0.125, 0, 0.07], [0, 0, -0.13]].slice(0, n).map((q, i) => <Coin key={i} pos={[q[0], 0.013 + (i === 2 ? 0.0 : 0), q[2]]} glow={glow} />)}</group>
);

/** the flip board on the back wall (text from the shot) */
const Board: React.FC<{ text: string; f: number }> = ({ text, f }) => {
  const flip = clamp(f / 8);
  const tex = useScreen(1024, 384, 'coin_board_' + text, (g, w, h) => {
    g.fillStyle = '#1b120b'; g.fillRect(0, 0, w, h);
    const chars = Array.from(text); const cw = Math.min(170, (w - 60) / Math.max(1, chars.length));
    chars.forEach((c, i) => {
      const x = w / 2 + (i - (chars.length - 1) / 2) * cw - cw / 2 + 6;
      g.fillStyle = '#f4e3b8'; g.beginPath(); (g as any).roundRect(x, 40, cw - 12, h - 80, 14); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, h / 2 - 2, cw - 12, 4);
      g.fillStyle = '#2a1a0e'; g.font = `900 ${Math.min(240, cw * 1.35)}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c, x + (cw - 12) / 2, h / 2 + 8);
    });
  });
  return (
    <group position={[0, 2.25, -0.62]} scale={[0.75, 0.75, 0.75]}>
      <mesh material={mat('#4a2c16', { r: 0.6 })}><boxGeometry args={[3.3, 1.35, 0.12]} /></mesh>
      <mesh position={[0, 0, 0.07]} scale={[1, Math.max(0.02, Math.abs(Math.cos((1 - flip) * Math.PI))), 1]} material={useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), [])}>
        <planeGeometry args={[3.05, 1.15]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {[-1.45, -0.5, 0.5, 1.45].map((x) => <mesh key={x} position={[x, 0.72, 0.1]} material={basic('#ffcf7a')}><sphereGeometry args={[0.05, 10, 8]} /></mesh>)}
    </group>
  );
};
const Workshop: React.FC<{ f: number; board: string; bf: number }> = ({ f, board, bf }) => {
  const wood = useMemo(() => mat('#6b4124', { r: 0.75 }), []);
  const woodD = useMemo(() => mat('#3f2512', { r: 0.8 }), []);
  return (
    <group>
      <Street f={f} />
      <mesh position={[0, TABLE_Y - 0.04, 0]} material={wood} castShadow receiveShadow><boxGeometry args={[4.6, 0.08, 1.4]} /></mesh>
      <mesh position={[0, TABLE_Y / 2 - 0.04, 0.68]} material={woodD} castShadow><boxGeometry args={[4.6, TABLE_Y - 0.08, 0.06]} /></mesh>
      {[[-2.1, -0.55], [2.1, -0.55]].map(([x, z], i) => <mesh key={i} position={[x, (TABLE_Y - 0.08) / 2, z]} material={woodD} castShadow><boxGeometry args={[0.1, TABLE_Y - 0.08, 0.1]} /></mesh>)}
      <mesh position={[0, TABLE_Y + 0.004, 0.05]} material={mat('#2e5a3a', { r: 0.95 })}><boxGeometry args={[3.6, 0.008, 1.1]} /></mesh>
      {[-2.25, 2.25].map((x) => <mesh key={'p' + x} position={[x, 1.6, -0.65]} material={woodD} castShadow><boxGeometry args={[0.1, 3.2, 0.1]} /></mesh>)}
      {Array.from({ length: 8 }).map((_, i) => <mesh key={'cn' + i} position={[-2.3 + i * 0.575 + 0.29, 3.25, -0.1]} rotation={[0.35, 0, 0]} material={mat(i % 2 ? '#f3ead7' : '#b3262e', { r: 0.9, side: THREE.DoubleSide })} castShadow><planeGeometry args={[0.575, 1.4]} /></mesh>)}
      <Board text={board} f={bf} />
    </group>
  );
};
const W = (f: number, ax: number, ay: number, az: number) => <Lights look={WARM} center={[ax, ay, az]} size={14} frame={f} />;
const T = TABLE_Y + 0.008;
const ROW9 = Array.from({ length: 9 }).map((_, i) => [-1.4 + i * 0.35, T, 0.25]);
const PILES = [[-1.1, T, 0.3], [0, T, 0.45], [1.1, T, 0.3]];

// ------------------------------------------------------------------ shots
const Base: React.FC<{ f: number; board: string; c: any; tilt?: number; left?: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode; far?: number; blur?: number }> = ({ f, board, c, tilt = 0, left, right, children, far = 1.45, blur = 3 }) => {
  const fr = useCurrentFrame();
  const fl = [Math.sin(fr * 0.021) * 0.06, Math.sin(fr * 0.017 + 1) * 0.04, Math.cos(fr * 0.013) * 0.05];
  const pos = c.pos.map((v: number, i: number) => c.look[i] + (v - c.look[i]) * far + fl[i]);
  const focus = Math.hypot(pos[0] - c.look[0], pos[1] - c.look[1], pos[2] - c.look[2]);
  return (
    <PStage focus={focus} blur={blur}>{W(f, 0, 1, 0)}<Cam pos={pos} look={c.look} fov={c.fov} roll={(c.roll ?? 0) + Math.sin(fr * 0.011) * 0.8} />
      <Workshop f={f} board={board} bf={f} /><Scale tilt={tilt} left={left} right={right} />{children}</PStage>
  );
};
export const CIntro: React.FC = () => {
  const { f, dur, board } = useShot('c_intro');
  const c = camK(f, [{ f: 0, p: [0, 1.6, 2.4], l: [0, 1.0, 0.2], fov: 44 }, { f: dur, p: [0, 1.7, 3.0], l: [0, 1.2, 0], fov: 46 }]);
  return <Base f={f} board={board} c={c}>{ROW9.map((p, i) => <Coin key={i} pos={[p[0], p[1] + 0.013 + Math.max(0, 0.4 - f * 0.05 + i * 0.05) * 0, p[2]]} />)}</Base>;
};
export const CFake: React.FC = () => {
  const { f, dur, board } = useShot('c_fake');
  const c = camK(f, [{ f: 0, p: [0.4, 1.3, 1.1], l: [0.3, 0.92, 0.25], fov: 40 }, { f: dur, p: [0.25, 1.15, 0.8], l: [0.3, 0.92, 0.25], fov: 36 }]);
  const g = f < dur * 0.55 ? 0.6 + 0.4 * Math.sin(f * 0.25) : clamp(1 - (f - dur * 0.55) / 15);
  return <Base f={f} board={board} c={c}>{ROW9.map((p, i) => <Coin key={i} pos={[p[0], p[1] + 0.013, p[2]]} glow={i === 5 ? g : 0} />)}</Base>;
};
export const CScaleShot: React.FC = () => {
  const { f, dur, board } = useShot('c_scale');
  const c = camK(f, [{ f: 0, p: [1.6, 2.0, 3.2], l: [0, 1.8, 0], fov: 46 }, { f: dur, p: [-0.8, 2.3, 2.6], l: [0, 1.9, -0.6], fov: 46 }]);
  return <Base f={f} board={board} c={c} tilt={Math.sin(f * 0.08) * 0.15}>{ROW9.map((p, i) => <Coin key={i} pos={[p[0], p[1] + 0.013, p[2]]} />)}</Base>;
};
export const CAsk: React.FC = () => {
  const { f, dur, board } = useShot('c_ask');
  const c = camK(f, [{ f: 0, p: [2.0, 1.55, 4.2], l: [2.75, 1.25, 0.9], fov: 40 }, { f: dur, p: [2.3, 1.5, 3.4], l: [2.75, 1.3, 0.9], fov: 38 }]);
  return <Base far={1} f={f} board={board} c={c}><Sage f={f} face="think" arm={1} />{ROW9.map((p, i) => <Coin key={i} pos={[p[0], p[1] + 0.013, p[2]]} />)}</Base>;
};
export const CTrick: React.FC = () => {
  const { f, dur, board } = useShot('c_trick');
  const c = camK(f, [{ f: 0, p: [2.0, 1.55, 4.2], l: [2.75, 1.25, 0.9], fov: 40 }, { f: dur, p: [2.3, 1.5, 3.4], l: [2.75, 1.3, 0.9], fov: 38 }]);
  return <Base far={1} f={f} board={board} c={c}><Sage f={f} face="sly" arm={1.2} /></Base>;
};
export const CSplit: React.FC = () => {
  const { f, dur, board } = useShot('c_split');
  const c = camK(f, [{ f: 0, p: [0, 2.4, 1.9], l: [0, 0.9, 0.3], fov: 46 }, { f: dur, p: [0, 2.2, 1.6], l: [0, 0.9, 0.35], fov: 44 }]);
  const t = smoother(clamp((f - 30) / 40));
  return <Base f={f} board={board} c={c}>{ROW9.map((p, i) => { const pile = PILES[Math.floor(i / 3)]; const off = [[-0.125, 0.07], [0.125, 0.07], [0, -0.13]][i % 3]; return <Coin key={i} pos={[lerp(p[0], pile[0] + off[0], t), p[1] + 0.013 + Math.sin(t * Math.PI) * 0.15, lerp(p[2], pile[2] + off[1], t)]} />; })}</Base>;
};
const panTrio = (glow = 0) => <Trio glow={glow} />;
export const CPlace: React.FC = () => {
  const { f, dur, board } = useShot('c_place');
  const c = camK(f, [{ f: 0, p: [0.3, 1.7, 3.0], l: [0, 1.3, 0], fov: 46 }, { f: dur, p: [0.1, 1.75, 2.6], l: [0, 1.35, 0], fov: 44 }]);
  const l1 = f > 25, r1 = f > 70;
  return (
    <Base f={f} board={board} c={c} left={l1 ? panTrio() : null} right={r1 ? panTrio() : null}>
      {!l1 && <Trio pos={PILES[0]} />}{!r1 && <Trio pos={PILES[2]} />}
      <Trio pos={[0, T, 0.45]} />
    </Base>
  );
};
export const CBalance: React.FC = () => {
  const { f, dur, board } = useShot('c_balance');
  const c = camK(f, [{ f: 0, p: [0, 1.9, 2.9], l: [0, 1.25, 0.2], fov: 46 }, { f: dur, p: [0, 1.6, 2.2], l: [0, 1.05, 0.4], fov: 42 }]);
  const tilt = Math.sin(f * 0.15) * 0.25 * Math.exp(-f * 0.03);
  return <Base f={f} board={board} c={c} tilt={tilt} left={panTrio()} right={panTrio()}><Trio pos={[0, T, 0.45]} glow={f > 40 ? 0.7 + 0.3 * Math.sin(f * 0.2) : 0} /></Base>;
};
export const CTilt: React.FC = () => {
  const { f, dur, board } = useShot('c_tilt');
  const c = camK(f, [{ f: 0, p: [0.4, 1.8, 2.8], l: [0, 1.35, 0], fov: 46 }, { f: dur, p: [0.8, 1.9, 2.4], l: [0.4, 1.45, 0], fov: 42 }]);
  const tilt = easeOut(clamp((f - 10) / 20));
  return <Base f={f} board={board} c={c} tilt={tilt} left={panTrio()} right={panTrio(f > 40 ? 0.8 : 0)}><Trio pos={[0, T, 0.45]} /></Base>;
};
export const CThree: React.FC = () => {
  const { f, dur, board } = useShot('c_three');
  const c = camK(f, [{ f: 0, p: [0, 2.6, 3.4], l: [0, 2.4, -1.5], fov: 48 }, { f: dur, p: [0, 2.0, 2.0], l: [0, 1.0, 0.3], fov: 44 }]);
  return <Base f={f} board={board} c={c}><Trio pos={[0, T, 0.4]} /></Base>;
};
export const CAgain: React.FC = () => {
  const { f, dur, board } = useShot('c_again');
  const c = camK(f, [{ f: 0, p: [2.0, 1.55, 4.2], l: [2.75, 1.25, 0.9], fov: 40 }, { f: dur, p: [2.3, 1.5, 3.4], l: [2.75, 1.3, 0.9], fov: 38 }]);
  return <Base far={1} f={f} board={board} c={c}><Sage f={f} face="grin" arm={0.5} /><Trio pos={[0, T, 0.4]} /></Base>;
};
export const CSecond: React.FC = () => {
  const { f, dur, board } = useShot('c_second');
  const c = camK(f, [{ f: 0, p: [0.3, 1.7, 2.8], l: [0, 1.3, 0], fov: 46 }, { f: dur, p: [0.1, 1.7, 2.4], l: [0, 1.3, 0], fov: 42 }]);
  const l1 = f > 18, r1 = f > 45;
  return (
    <Base f={f} board={board} c={c} left={l1 ? <Coin pos={[0, 0.013, 0]} /> : null} right={r1 ? <Coin pos={[0, 0.013, 0]} /> : null}>
      {!l1 && <Coin pos={[-0.12, T + 0.013, 0.4]} />}{!r1 && <Coin pos={[0.12, T + 0.013, 0.4]} />}
      <Coin pos={[0, T + 0.013, 0.55]} glow={f > 75 ? 0.3 : 0} />
    </Base>
  );
};
export const CResult: React.FC = () => {
  const { f, dur, board } = useShot('c_result');
  const c = camK(f, [{ f: 0, p: [-0.3, 1.8, 2.6], l: [-0.3, 1.4, 0], fov: 44 }, { f: dur, p: [-0.7, 1.9, 2.1], l: [-0.7, 1.55, 0], fov: 38 }]);
  const tilt = -easeOut(clamp((f - 6) / 18));
  return <Base f={f} board={board} c={c} tilt={tilt} left={<Coin pos={[0, 0.013, 0]} glow={f > 30 ? 0.9 : 0} />} right={<Coin pos={[0, 0.013, 0]} />}><Coin pos={[0, T + 0.013, 0.55]} /></Base>;
};
export const CEq: React.FC = () => {
  const { f, dur, board } = useShot('c_eq');
  const c = camK(f, [{ f: 0, p: [0, 1.75, 2.7], l: [0, 1.2, 0.2], fov: 44 }, { f: dur, p: [0, 1.5, 1.9], l: [0, 1.0, 0.45], fov: 40 }]);
  const tilt = Math.sin(f * 0.15) * 0.2 * Math.exp(-f * 0.04);
  return <Base f={f} board={board} c={c} tilt={tilt} left={<Coin pos={[0, 0.013, 0]} />} right={<Coin pos={[0, 0.013, 0]} />}><Coin pos={[0, T + 0.013, 0.55]} glow={f > 35 ? 0.9 : 0} /></Base>;
};
export const CWhy: React.FC = () => {
  const { f, dur, board } = useShot('c_why');
  const c = camK(f, [{ f: 0, p: [2.0, 1.55, 4.2], l: [2.75, 1.25, 0.9], fov: 40 }, { f: dur, p: [2.3, 1.5, 3.4], l: [2.75, 1.3, 0.9], fov: 38 }]);
  return <Base far={1} f={f} board={board} c={c}><Sage f={f} face="wow" arm={1.2} /></Base>;
};
export const CMath: React.FC = () => {
  const { f, dur, board } = useShot('c_math');
  const c = camK(f, [{ f: 0, p: [0, 3.0, 2.0], l: [0, 3.0, -2], fov: 46 }, { f: dur, p: [0, 2.6, 3.2], l: [0, 2.0, -1], fov: 50 }]);
  // nine coins in a 3×3 grid on the table, lighting up one by one
  const lit = Math.floor(clamp((f - 150) / 120) * 9.99);
  return <Base f={f} board={board} c={c} tilt={Math.sin(f * 0.06) * 0.4}>{Array.from({ length: 9 }).map((_, i) => <Coin key={i} pos={[-0.4 + (i % 3) * 0.4, T + 0.013, 0.05 + Math.floor(i / 3) * 0.25]} glow={i < lit ? 0.6 : 0} />)}</Base>;
};
export const CEnd: React.FC = () => {
  const { f, dur, board } = useShot('c_end');
  const c = camK(f, [{ f: 0, p: [2.0, 1.55, 4.2], l: [2.75, 1.25, 0.9], fov: 40 }, { f: dur, p: [2.3, 1.5, 3.4], l: [2.75, 1.3, 0.9], fov: 38 }]);
  return <Base far={1} f={f} board={board} c={c}><Sage f={f} face="grin" arm={1.4} />{ROW9.slice(0, 8).map((p, i) => <Coin key={i} pos={[p[0] - 0.5, p[1] + 0.013, p[2]]} />)}</Base>;
};

export const COIN_SCENES: Record<string, React.FC> = {
  c_intro: CIntro, c_fake: CFake, c_scale: CScaleShot, c_ask: CAsk, c_trick: CTrick, c_split: CSplit, c_place: CPlace, c_balance: CBalance, c_tilt: CTilt,
  c_three: CThree, c_again: CAgain, c_second: CSecond, c_result: CResult, c_eq: CEq, c_why: CWhy, c_math: CMath, c_end: CEnd,
};
void tl; void Stack;
