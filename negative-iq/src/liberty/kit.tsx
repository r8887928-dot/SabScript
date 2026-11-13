import React, { useMemo } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import helv from 'three/examples/fonts/helvetiker_bold.typeface.json';
import { mat, basic, spr, radialTex, canvasTex } from '../three/core';
import { rbox, useScreen, Glow } from '../three/props';
import { Person, randomLook, merge, EXPR, idle } from '../three/person';
import { rng, hash, clamp } from '../lib/anim';

// Liberty Computer Club — 3D set pieces
export type Zone = 'main' | 'vip' | 'pro' | 'prime';
export const ZONES: Record<Zone, { lvl: number; name: string; col: string; col2: string; specs: string[]; wd: string; we: string; kz: string }> = {
  main: { lvl: 1, name: 'MAIN', col: '#22d3ee', col2: '#0e7490', specs: ['Ryzen 5 7500F', 'RTX 5060', '32 GB RAM'], wd: '1 200', we: '1 400', kz: '1-ДЕҢГЕЙ' },
  vip: { lvl: 2, name: 'VIP', col: '#a855f7', col2: '#6b21a8', specs: ['RTX 5070', '32 GB RAM', 'Монитор 500 Гц'], wd: '2 000', we: '2 300', kz: '2-ДЕҢГЕЙ' },
  pro: { lvl: 3, name: 'PRO', col: '#fb923c', col2: '#c2410c', specs: ['Intel Core i7-14700KF', 'RTX 4070 Ti Super'], wd: '2 500', we: '2 800', kz: '3-ДЕҢГЕЙ' },
  prime: { lvl: 4, name: 'PRIME', col: '#facc15', col2: '#a16207', specs: ['Ryzen 7 7800X3D', 'RTX 4080 Super', 'Монитор 600 Гц'], wd: '3 000', we: '3 500', kz: '4-ДЕҢГЕЙ' },
};
export const ZONE_ORDER: Zone[] = ['main', 'vip', 'pro', 'prime'];

// ------------------------------------------------------------------ 3D text (Latin only: helvetiker)
const FONT3D = new FontLoader().parse(helv as any);
export const Text3D: React.FC<{ text: string; size?: number; depth?: number; color?: string; glow?: string; pos?: number[]; rot?: number[]; s?: number }> = ({ text, size = 1, depth = 0.3, color = '#ffffff', glow, pos = [0, 0, 0], rot = [0, 0, 0], s = 1 }) => {
  const g = useMemo(() => {
    const t = new TextGeometry(text, { font: FONT3D, size, depth, curveSegments: 6, bevelEnabled: true, bevelThickness: depth * 0.18, bevelSize: size * 0.025, bevelSegments: 3 });
    t.center();
    return t;
  }, [text, size, depth]);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.6, emissive: new THREE.Color(glow ?? color), emissiveIntensity: glow ? 0.9 : 0.15 }), [color, glow]);
  return (
    <group position={pos as any} rotation={rot as any} scale={[s, s, s]}>
      <mesh geometry={g} material={face} castShadow />
      {glow && <sprite position={[0, 0, -depth]} scale={[size * text.length * 1.1, size * 2.2, 1]} material={spr(glow, { map: radialTex('glow'), add: true, t: 0.55 })} />}
    </group>
  );
};

// ------------------------------------------------------------------ monitor content (shared textures, generic «game» scenes)
const drawGame = (kind: number, f: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  const t = f / 30;
  if (kind === 0) { // corridor shooter
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#1b2a44'); sky.addColorStop(1, '#3d5a80'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2b2d42'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.35, h * 0.35); g.lineTo(w * 0.35, h * 0.7); g.lineTo(0, h); g.fill();
    g.beginPath(); g.moveTo(w, 0); g.lineTo(w * 0.65, h * 0.35); g.lineTo(w * 0.65, h * 0.7); g.lineTo(w, h); g.fill();
    g.fillStyle = '#ffb703'; g.fillRect(w * 0.45 + Math.sin(t * 2) * w * 0.08, h * 0.44, w * 0.04, h * 0.14);
    g.strokeStyle = '#7CFC00'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2 - 18, h / 2); g.lineTo(w / 2 + 18, h / 2); g.moveTo(w / 2, h / 2 - 18); g.lineTo(w / 2, h / 2 + 18); g.stroke();
    g.fillStyle = '#e63946'; g.fillRect(20, h - 34, 160, 14); g.fillStyle = '#fff'; g.font = '900 26px Montserrat'; g.fillText('30 / 90', w - 140, h - 20);
  } else if (kind === 1) { // racing
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#ff7e5f'); sky.addColorStop(0.55, '#feb47b'); sky.addColorStop(0.56, '#2d6a4f'); sky.addColorStop(1, '#1b4332'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#343a40'; g.beginPath(); g.moveTo(w * 0.47, h * 0.56); g.lineTo(w * 0.53, h * 0.56); g.lineTo(w * 0.95, h); g.lineTo(w * 0.05, h); g.fill();
    g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const p = ((i / 6 + t * 1.2) % 1); const y = h * 0.56 + p * p * h * 0.44; g.fillRect(w / 2 - 2 - p * 6, y, 4 + p * 12, 6 + p * 22); }
    g.fillStyle = '#e63946'; g.fillRect(w * 0.42, h * 0.78, w * 0.16, h * 0.12); g.fillStyle = '#111'; g.fillRect(w * 0.43, h * 0.88, w * 0.04, h * 0.04); g.fillRect(w * 0.53, h * 0.88, w * 0.04, h * 0.04);
  } else if (kind === 2) { // strategy map
    g.fillStyle = '#14281d'; g.fillRect(0, 0, w, h);
    const r = rng(7); for (let i = 0; i < 26; i++) { g.fillStyle = ['#2d6a4f', '#40916c', '#1b4332', '#74c69d'][i % 4]; g.beginPath(); g.arc(r() * w, r() * h, 20 + r() * 50, 0, 7); g.fill(); }
    g.fillStyle = '#4361ee'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w * 0.3 + i * 18 + Math.sin(t + i) * 10, h * 0.6 - i * 10, 8, 0, 7); g.fill(); }
    g.fillStyle = '#e63946'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w * 0.68 - i * 18 + Math.cos(t + i) * 10, h * 0.4 + i * 10, 8, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(w - 150, h - 110, 140, 100);
  } else { // space shooter
    g.fillStyle = '#070b1d'; g.fillRect(0, 0, w, h);
    const r = rng(9); for (let i = 0; i < 80; i++) { g.fillStyle = '#fff'; g.fillRect((r() * w + t * 40 * (1 + (i % 3))) % w, r() * h, 2, 2); }
    g.fillStyle = '#21f0ff'; g.beginPath(); g.moveTo(w * 0.2, h * 0.5 + Math.sin(t * 2) * 30); g.lineTo(w * 0.28, h * 0.46 + Math.sin(t * 2) * 30); g.lineTo(w * 0.2, h * 0.42 + Math.sin(t * 2) * 30); g.fill();
    g.fillStyle = '#ff2bd6'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(w * (0.6 + i * 0.09), h * (0.3 + ((i * 0.23 + t * 0.2) % 0.5)), 16, 0, 7); g.fill(); }
    g.fillStyle = '#ffe14a'; for (let i = 0; i < 5; i++) g.fillRect(((t * 300 + i * 90) % (w * 0.6)) + w * 0.3, h * 0.48 + Math.sin(t * 2) * 30, 30, 4);
  }
};
export function useGameTex(f: number) {
  const b = Math.floor(f / 3);
  return [0, 1, 2, 3].map((k) => useScreen(512, 288, `game${k}_${b}`, drawGame(k, b * 3 + k * 37)));
}
const offTex = () => canvasTex('mon_off', 64, 36, (g, w, h) => { g.fillStyle = '#05060a'; g.fillRect(0, 0, w, h); });

// ------------------------------------------------------------------ a gaming station (player faces −z; screen faces +z)
export const Station: React.FC<{ pos: number[]; zone: Zone; tex: THREE.Texture; on?: number; big?: boolean; chair?: boolean; seed?: number }> = ({ pos, zone, tex, on = 1, big, chair = true, seed = 1 }) => {
  const Z = ZONES[zone];
  const scr = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  scr.map = on > 0.5 ? tex : offTex(); scr.color.setScalar(on > 0.5 ? 1 : 1); scr.needsUpdate = true;
  const mw = big ? 0.72 : 0.6, mh = big ? 0.41 : 0.34;
  const lit = on > 0.5;
  return (
    <group position={pos as any}>
      {/* monitor */}
      <mesh geometry={rbox(mw + 0.03, mh + 0.03, 0.03, 0.012)} position={[0, 1.02 + mh / 2, -0.32]} material={mat('#0c0d12', { r: 0.4, m: 0.4 })} castShadow />
      <mesh position={[0, 1.02 + mh / 2, -0.302]} material={scr}><planeGeometry args={[mw, mh]} /></mesh>
      <mesh position={[0, 0.88, -0.36]} material={mat('#111', { r: 0.4, m: 0.6 })}><cylinderGeometry args={[0.02, 0.02, 0.28, 8]} /></mesh>
      {lit && <sprite position={[0, 1.02 + mh / 2, -0.4]} scale={[mw * 2, mh * 2.4, 1]} material={spr(Z.col, { map: radialTex('glow'), add: true, t: 0.22 })} />}
      {/* keyboard + mouse with RGB */}
      <mesh geometry={rbox(0.42, 0.02, 0.14, 0.008)} position={[-0.04, 0.775, -0.08]} material={mat('#16171d', { r: 0.4 })} />
      <mesh position={[-0.04, 0.765, -0.08]} material={basic(Z.col, { t: lit ? 0.9 : 0.2 })}><boxGeometry args={[0.43, 0.006, 0.15]} /></mesh>
      <mesh geometry={rbox(0.06, 0.025, 0.1, 0.012)} position={[0.25, 0.78, -0.07]} material={mat('#16171d', { r: 0.4 })} />
      {/* tower PC with glass side */}
      <group position={[0.46, 0, -0.25]}>
        <mesh geometry={rbox(0.2, 0.45, 0.42, 0.01)} position={[0, 0.225, 0]} material={mat('#121318', { r: 0.35, m: 0.5 })} castShadow />
        <mesh position={[-0.101, 0.23, 0]} rotation={[0, -Math.PI / 2, 0]} material={basic(Z.col, { t: lit ? 0.55 + 0.25 * Math.sin(seed * 2.3) : 0.1 })}><planeGeometry args={[0.36, 0.38]} /></mesh>
        {lit && <Glow pos={[-0.12, 0.23, 0]} s={0.6} color={Z.col} o={0.5} />}
      </group>
      {/* chair (back towards +z) */}
      {chair && (
        <group position={[0, 0, 0.32]}>
          <mesh position={[0, 0.25, 0]} material={mat('#222', { r: 0.4, m: 0.6 })}><cylinderGeometry args={[0.03, 0.03, 0.42, 8]} /></mesh>
          <mesh geometry={rbox(0.5, 0.08, 0.48, 0.04)} position={[0, 0.5, 0]} material={mat('#17171f', { r: 0.6 })} castShadow />
          <mesh geometry={rbox(0.5, 0.78, 0.09, 0.06)} position={[0, 0.95, 0.24]} rotation={[0.12, 0, 0]} material={mat('#17171f', { r: 0.6 })} castShadow />
          <mesh position={[0, 0.97, 0.292]} rotation={[0.12, 0, 0]} material={mat(Z.col, { r: 0.5, e: Z.col, ei: 0.25 })}><boxGeometry args={[0.1, 0.62, 0.005]} /></mesh>
          <mesh position={[0, 0.03, 0]} material={mat('#111', { r: 0.4 })}><cylinderGeometry args={[0.28, 0.28, 0.03, 5]} /></mesh>
        </group>
      )}
    </group>
  );
};

/** seated player at a station (sits in the chair, faces −z) */
export const Player: React.FC<{ pos: number[]; seed: number; f: number; cheer?: number; rotY?: number }> = ({ pos, seed, f, cheer = 0, rotY = 0 }) => {
  const look = useMemo(() => randomLook(1100 + seed, { hairStyle: seed % 3 === 0 ? 'cap' : seed % 3 === 1 ? 'short' : 'long', hat: '#1d1d1d' }), [seed]);
  const typing = Math.sin(f * 0.9 + seed) * 0.06;
  const arms = cheer > 0 ? { armL: [2.9, -0.4, 0.3], armR: [2.9, 0.4, 0.3] } : { armL: [1.15 + typing, -0.12, 0.9], armR: [1.15 - typing, 0.12, 0.9] };
  return (
    <Person look={look} pos={[pos[0], pos[1] - 0.3 + cheer * 0.25, pos[2] + 0.3]} rotY={Math.PI + rotY} blob={false}
      pose={merge(idle(f, seed), cheer > 0 ? EXPR.grin : EXPR.neutral, { legL: cheer > 0 ? 0.3 : 1.4, legR: cheer > 0 ? 0.3 : 1.4, kneeL: cheer > 0 ? 0.3 : 1.45, kneeR: cheer > 0 ? 0.3 : 1.45, head: [0.05, 0, 0] }, arms as any)} />
  );
};

/** the club hall: rows of stations across x, rows stepping towards −z */
export const Hall: React.FC<{ f: number; zones: Zone[]; rows?: number; cols?: number; on?: (row: number, col: number) => number; players?: number; big?: boolean; gap?: number; width?: number; cheer?: number; force?: string[] }> = ({ f, zones, rows = 4, cols = 6, on = () => 1, players = 6, big, gap = 2.3, width, cheer = 0, force = [] }) => {
  const tex = useGameTex(f);
  const W = width ?? cols * (big ? 1.25 : 1.05) + 2.4;
  const D = rows * gap + 6;
  const sp = big ? 1.25 : 1.05;
  const seats = useMemo(() => { const r = rng(55); const s = new Set<string>(force); while (s.size < players + force.length) s.add(`${Math.floor(r() * rows)}_${Math.floor(r() * cols)}`); return s; }, [players, rows, cols, force.join(',')]);
  const floor = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0b0b12', roughness: 0.22, metalness: 0.35 }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -D / 2 + 3]} material={floor} receiveShadow><planeGeometry args={[W, D]} /></mesh>
      <mesh position={[0, 1.6, -D + 3]} material={mat('#0e0c18', { r: 0.9 })}><planeGeometry args={[W, 3.2]} /></mesh>
      {[-1, 1].map((sd) => <mesh key={sd} position={[sd * W / 2, 1.6, -D / 2 + 3]} rotation={[0, -sd * Math.PI / 2, 0]} material={mat('#0e0c18', { r: 0.9 })}><planeGeometry args={[D, 3.2]} /></mesh>)}
      <mesh position={[0, 3.2, -D / 2 + 3]} rotation={[Math.PI / 2, 0, 0]} material={mat('#07060c', { r: 0.9 })}><planeGeometry args={[W, D]} /></mesh>
      {/* neon: wall strips + ceiling lines */}
      {[-1, 1].map((sd) => [0.35, 2.7].map((y, k) => <mesh key={sd + '_' + k} position={[sd * (W / 2 - 0.02), y, -D / 2 + 3]} rotation={[0, -sd * Math.PI / 2, 0]} material={basic(ZONES[zones[0]].col, { t: 0.95 })}><planeGeometry args={[D, 0.05]} /></mesh>))}
      {Array.from({ length: Math.ceil(D / 2.4) }).map((_, i) => <mesh key={'c' + i} position={[0, 3.18, 2 - i * 2.4]} rotation={[Math.PI / 2, 0, 0]} material={basic(ZONES[zones[i % zones.length]].col, { t: 0.85 })}><planeGeometry args={[W * 0.7, 0.06]} /></mesh>)}
      {Array.from({ length: rows }).map((_, ri) => {
        const z = -ri * gap;
        const zone = zones[ri % zones.length];
        return (
          <group key={ri}>
            <mesh geometry={rbox(cols * sp + 0.2, 0.05, 0.75, 0.02)} position={[0, 0.74, z - 0.18]} material={mat('#121218', { r: 0.4, m: 0.3 })} castShadow receiveShadow />
            <mesh position={[0, 0.712, z + 0.2]} material={basic(ZONES[zone].col, { t: 0.9 })}><boxGeometry args={[cols * sp + 0.2, 0.012, 0.012]} /></mesh>
            {Array.from({ length: cols }).map((_, ci) => {
              const x = (ci - (cols - 1) / 2) * sp;
              const o = on(ri, ci);
              const seated = seats.has(`${ri}_${ci}`);
              return (
                <group key={ci}>
                  <Station pos={[x, 0, z]} zone={zone} tex={tex[(ri * 3 + ci) % 4]} on={o} big={big} chair={!seated} seed={ri * 10 + ci} />
                  {seated && <><Player pos={[x, 0, z]} seed={ri * 10 + ci} f={f} cheer={cheer} /><ChairBack pos={[x, 0, z + 0.32]} zone={zone} /></>}
                </group>
              );
            })}
          </group>
        );
      })}
      {Array.from({ length: rows }).map((_, ri) => <pointLight key={'pl' + ri} position={[0, 2.6, -ri * gap + 0.4]} intensity={6} distance={6} color={ZONES[zones[ri % zones.length]].col} />)}
    </group>
  );
};
/** chair seat only (for seated players, the back would cover the person) */
const ChairBack: React.FC<{ pos: number[]; zone: Zone }> = ({ pos }) => (
  <group position={pos as any}>
    <mesh position={[0, 0.25, 0]} material={mat('#222', { r: 0.4, m: 0.6 })}><cylinderGeometry args={[0.03, 0.03, 0.42, 8]} /></mesh>
    <mesh geometry={rbox(0.5, 0.08, 0.48, 0.04)} position={[0, 0.5, 0]} material={mat('#17171f', { r: 0.6 })} castShadow />
    <mesh position={[0, 0.03, 0]} material={mat('#111', { r: 0.4 })}><cylinderGeometry args={[0.28, 0.28, 0.03, 5]} /></mesh>
  </group>
);

/** the club entrance: dark facade, neon LIBERTY sign, 24/7 sign, glass doors */
export const Facade: React.FC<{ f: number; neon: number; open?: number }> = ({ f, neon, open = 0 }) => {
  const flick = neon > 0 && neon < 1 ? (hash(Math.floor(f / 2)) > 0.4 ? 1 : 0.2) : 1;
  const n = neon * flick;
  return (
    <group>
      <mesh position={[0, 4, -0.3]} material={mat('#1b1d27', { r: 0.8 })} receiveShadow castShadow><boxGeometry args={[12, 8, 0.6]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4]} material={mat('#2b2e38', { r: 0.9 })} receiveShadow><planeGeometry args={[30, 10]} /></mesh>
      {/* glass doors */}
      <mesh position={[0, 1.3, 0.02]} material={mat('#0a0a10', { r: 0.2, m: 0.5 })}><boxGeometry args={[2.4, 2.6, 0.06]} /></mesh>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 1.15, 1.3, 0.06]} rotation={[0, sd * open * 1.2, 0]}>
          <mesh position={[-sd * 0.575, 0, 0]} material={new THREE.MeshStandardMaterial({ color: '#7fb3ff', transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.5 })}><boxGeometry args={[1.12, 2.5, 0.03]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 1.3, -0.05]} material={basic('#ffd9a8', { t: 0.25 + 0.75 * open })}><planeGeometry args={[2.3, 2.5]} /></mesh>
      {open > 0 && <pointLight position={[0, 1.4, 1.2]} intensity={10 * open} distance={8} color="#c9a8ff" />}
      {/* neon sign */}
      <Text3D text="LIBERTY" size={0.9} depth={0.18} color={n > 0.3 ? '#ffffff' : '#555a66'} glow={n > 0.3 ? '#a855f7' : undefined} pos={[0, 4.6, 0.2]} />
      <mesh position={[0, 3.75, 0.05]} material={basic('#22d3ee', { t: 0.2 + 0.8 * n })}><boxGeometry args={[6.4, 0.05, 0.05]} /></mesh>
      <Text3D text="24/7" size={0.45} depth={0.1} color={n > 0.3 ? '#ffffff' : '#555a66'} glow={n > 0.3 ? '#22d3ee' : undefined} pos={[3.6, 2.4, 0.2]} />
      <Text3D text="COMPUTER CLUB" size={0.28} depth={0.06} color={n > 0.3 ? '#ffffff' : '#555a66'} glow={n > 0.3 ? '#22d3ee' : undefined} pos={[0, 3.35, 0.2]} />
      {n > 0.3 && <pointLight position={[0, 4.4, 2]} intensity={12 * n} distance={10} color="#a855f7" />}
      {[-4.5, 4.5].map((x) => <mesh key={x} position={[x, 1.6, 0.02]} material={basic(n > 0.3 ? '#22d3ee' : '#1a2a30', { t: 0.9 })}><boxGeometry args={[0.06, 3.2, 0.04]} /></mesh>)}
    </group>
  );
};

export { clamp };
