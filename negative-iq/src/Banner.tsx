import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { AbsoluteFill, useDelayRender } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import '@fontsource/montserrat/900.css';
import '@fontsource/russo-one/400.css';
import { Lights, Cam, LOOKS, mat, basic } from './three/core';
import { Person, randomLook, EXPR, merge } from './three/person';
import { Headset } from './AvatarNiches';
import { rng } from './lib/anim';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// YouTube channel art: 2560×1440, everything important inside the centre 1546×423 safe area (x 507–2053, y 508–931)
const BW = 2560, BH = 1440;

function synthwaveWide() {
  const hz = 790; // horizon
  let grid = '';
  for (let i = -30; i <= 30; i++) grid += `<line x1='${1280 + i * 34}' y1='${hz}' x2='${1280 + i * 330}' y2='${BH}' stroke='#ff3df2' stroke-width='3' opacity='0.75'/>`;
  for (let k = 0; k < 11; k++) { const y = hz + Math.pow(k / 10, 1.8) * (BH - hz); grid += `<line x1='0' y1='${y}' x2='${BW}' y2='${y}' stroke='#ff3df2' stroke-width='${2 + k * 0.5}' opacity='0.8'/>`; }
  let cuts = '';
  for (let k = 0; k < 6; k++) cuts += `<rect x='1480' y='${hz - 150 + k * 26}' width='640' height='${4 + k * 3}' fill='#2a0845'/>`;
  const r = rng(4);
  let stars = '';
  for (let i = 0; i < 160; i++) stars += `<circle cx='${r() * BW}' cy='${r() * (hz - 60)}' r='${0.8 + r() * 2}' fill='#ffffff' opacity='${0.3 + r() * 0.6}'/>`;
  let mtn = `<path d='M0 ${hz} `;
  for (let x = 0; x <= BW; x += 80) mtn += `L${x} ${hz - 30 - Math.abs(Math.sin(x * 0.004) * 110 + Math.sin(x * 0.011) * 40)} `;
  mtn += `L${BW} ${hz} Z' fill='#1a0636' stroke='#21f0ff' stroke-width='3' opacity='0.95'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${BW}' height='${BH}' viewBox='0 0 ${BW} ${BH}'><defs>
    <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0b0020'/><stop offset='0.42' stop-color='#3d0a78'/><stop offset='0.55' stop-color='#ff4fb3'/></linearGradient>
    <linearGradient id='sun' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffe259'/><stop offset='1' stop-color='#ff2f8e'/></linearGradient>
    <linearGradient id='flo' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a0057'/><stop offset='1' stop-color='#09001a'/></linearGradient></defs>
    <rect width='${BW}' height='${BH}' fill='url(#sky)'/>${stars}<circle cx='1800' cy='${hz - 40}' r='320' fill='url(#sun)'/>${cuts}${mtn}<rect y='${hz}' width='${BW}' height='${BH - hz}' fill='url(#flo)'/>${grid}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const Gamepad: React.FC = () => {
  const body = useMemo(() => new RoundedBoxGeometry(0.42, 0.2, 0.1, 4, 0.05), []);
  const shell = mat('#1c1c26', { r: 0.35, m: 0.4 });
  return (
    <group>
      <mesh geometry={body} material={shell} castShadow />
      {[-1, 1].map((s) => <mesh key={s} material={shell} position={[s * 0.17, -0.09, 0]} rotation={[0, 0, s * 0.35]}><capsuleGeometry args={[0.06, 0.1, 6, 12]} /></mesh>)}
      <mesh material={basic('#21f0ff')} position={[-0.12, 0.02, 0.052]}><boxGeometry args={[0.07, 0.022, 0.01]} /></mesh>
      <mesh material={basic('#21f0ff')} position={[-0.12, 0.02, 0.052]}><boxGeometry args={[0.022, 0.07, 0.01]} /></mesh>
      {[[0.12, 0.05, '#ff2bd6'], [0.155, 0.015, '#ffe259'], [0.085, 0.015, '#21f0ff'], [0.12, -0.02, '#7dffb0']].map(([x, y, c], i) => (
        <mesh key={i} material={basic(c as string)} position={[x as number, y as number, 0.055]}><sphereGeometry args={[0.018, 12, 10]} /></mesh>
      ))}
      {[-0.05, 0.05].map((x) => <mesh key={x} material={mat('#333', { r: 0.5 })} position={[x, -0.04, 0.055]}><cylinderGeometry args={[0.025, 0.025, 0.02, 16]} /></mesh>)}
    </group>
  );
};

export const BannerGaming: React.FC<{ title?: string }> = ({ title = '' }) => {
  const [ready, setReady] = useState(false);
  const { delayRender, continueRender } = useDelayRender();
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => { Promise.all([document.fonts.load('900 40px Montserrat'), document.fonts.load('400 40px "Russo One"')]).then(() => { setReady(true); continueRender(h); }); }, []);
  const look = useMemo(() => randomLook(3, { skin: '#f0c4a0', hair: '#3a2416', hairStyle: 'short', shirt: '#7b2ff7' }), []);
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const C = 820; // character canvas size
  return (
    <AbsoluteFill style={{ backgroundImage: synthwaveWide(), backgroundSize: 'cover' }}>
      {/* character (right side of the safe area) */}
      <div style={{ position: 'absolute', left: 1390, top: 330, width: C, height: 1110 }}>
        <ThreeCanvas width={C} height={1110} gl={{ antialias: true, alpha: true }} shadows camera={{ fov: 30, near: 0.05, far: 100 }}>
          <Lights look={{ ...LOOKS.morning, sunAz: 30, sunEl: 32, sun: '#f0e6ff', sunI: 2.2, hemiI: 1.0, env: 0.6 }} center={[0, 1.4, 0]} size={3} noSky noFog />
          <directionalLight position={[-2.6, 2.6, -2.6]} intensity={3.2} color="#ff2bd6" />
          <directionalLight position={[2.6, 2.4, -2.4]} intensity={2.6} color="#21f0ff" />
          <pointLight position={[0, 1.6, 1.6]} intensity={1.5} distance={4} color="#ffffff" />
          <Cam pos={[0.12, 1.16, 3.6]} look={[0, 1.04, 0]} fov={39.7} />
          <Person look={look} blob olWidth={0.008} onHead={<Headset />}
            pose={merge(EXPR.happy, { head: [0.04, -0.15, -0.06], body: [0.04, -0.15, 0], brows: [0.2, -0.2, 0.02], armL: [0.6, 0.15, 1.4], armR: [0.6, 0.15, 1.4], blink: 0 })} />
          <group position={[0.0, 1.2, 0.44]} rotation={[-0.35, -0.12, 0.0]}><Gamepad /></group>
        </ThreeCanvas>
      </div>
      {/* left side of the safe area: channel name (optional) */}
      {title ? (
        <div style={{ position: 'absolute', left: 560, top: 560, width: 860, height: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: '"Russo One", Montserrat', fontSize: title.length > 12 ? 104 : 140, lineHeight: 1.0, color: '#ffffff', textShadow: '0 0 18px #ff2bd6, 0 0 42px #ff2bd6, 0 6px 0 #2a0845', letterSpacing: 2 }}>{title}</div>
          <div style={{ marginTop: 22, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 36, color: '#21f0ff', letterSpacing: 5, whiteSpace: 'nowrap', textShadow: '0 0 16px #21f0ff' }}>ИГРЫ · ЧЕЛЛЕНДЖИ · ЭКСПЕРИМЕНТЫ</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
