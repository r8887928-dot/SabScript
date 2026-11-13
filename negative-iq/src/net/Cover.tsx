import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { AbsoluteFill, useDelayRender } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import '@fontsource/montserrat/900.css';
import '@fontsource/russo-one/400.css';
import { Lights, Cam, LOOKS } from '../three/core';
import { Person, EXPR, merge } from '../three/person';
import { useScreen } from '../three/props';
import { StarField } from '../three/earth';
import { HERO } from '../game/scenes';
import { NeonX } from '../Channel';
import { Globe, lonRot } from './scenesA';
import { NetArcs, spinner, statusBar } from './kit';

const FONT = 'Montserrat, sans-serif';
const TECH = '"Russo One", Montserrat, sans-serif';
const stroke = (px: number, color = '#000') => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const });
const RED = '#ff3b3b', YEL = '#ffe14a';

const useFonts = () => {
  const [ready, setReady] = useState(false);
  const { delayRender, continueRender } = useDelayRender();
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => { Promise.all([document.fonts.load('900 40px Montserrat'), document.fonts.load('400 40px "Russo One"')]).then(() => { setReady(true); continueRender(h); }); }, []);
  return ready;
};
const Wifi: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 24px ${RED})` }}>
    {[1, 2, 3].map((i) => <path key={i} d={`M ${50 - 13 * i} ${70 - 11 * i} A ${18 * i} ${18 * i} 0 0 1 ${50 + 13 * i} ${70 - 11 * i}`} fill="none" stroke={RED} strokeWidth="8" strokeLinecap="round" />)}
    <circle cx="50" cy="78" r="7" fill={RED} />
    <line x1="16" y1="14" x2="86" y2="88" stroke="#12002a" strokeWidth="17" strokeLinecap="round" />
    <line x1="16" y1="14" x2="86" y2="88" stroke={RED} strokeWidth="9" strokeLinecap="round" />
  </svg>
);
const HeroPhone: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const tex = useScreen(360, 740, 'coverphone', (g, W, H) => { statusBar(g, W, false, true); g.fillStyle = '#f2f4f8'; g.fillRect(0, 44, W, H - 44); spinner(g, W / 2, H / 2, 60, 3); g.fillStyle = '#e23'; g.font = '900 30px Montserrat'; g.textAlign = 'center'; g.fillText('Нет подключения', W / 2, H / 2 + 130); });
  return (
    <ThreeCanvas width={w} height={h} gl={{ antialias: true, alpha: true }} shadows camera={{ fov: 30, near: 0.05, far: 100 }}>
      <Lights look={{ ...LOOKS.morning, sunAz: 30, sunEl: 32, sun: '#fff1e0', sunI: 2.4, hemiI: 1.0, env: 0.6 }} center={[0, 1.4, 0]} size={3} noSky noFog />
      <directionalLight position={[-2.6, 2.6, -2.6]} intensity={3.4} color="#ff2bd6" />
      <directionalLight position={[2.6, 2.4, -2.4]} intensity={2.8} color="#21f0ff" />
      <pointLight position={[0, 1.3, 0.8]} intensity={1.6} distance={3} color="#9fc8ff" />
      <Cam pos={[0.1, 1.5, 2.3]} look={[0, 1.38, 0]} fov={30} />
      <Person look={HERO()} blob={false} olWidth={0.009} pose={merge(EXPR.shock, { mouth: 'O', brows: [0.38, -0.38, 0.045], head: [0.05, -0.08, 0.06], armL: [1.15, -0.25, 1.15], armR: [2.4, -0.4, 1.6], blink: 0 })} />
      <group position={[-0.1, 1.16, 0.4]} rotation={[0.02, 0.22, -0.1]} scale={[1.7, 1.7, 1.7]}>
        <mesh><boxGeometry args={[0.094, 0.19, 0.012]} /><meshStandardMaterial color="#15161c" roughness={0.3} metalness={0.4} /></mesh>
        <mesh position={[0, 0, 0.0065]}><planeGeometry args={[0.084, 0.176]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      </group>
    </ThreeCanvas>
  );
};

/** Shorts cover 1080×1920 */
export const CoverNet: React.FC = () => {
  const ready = useFonts();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  return (
    <AbsoluteFill style={{ background: '#05030f' }}>
      <AbsoluteFill>
        <ThreeCanvas width={1080} height={1920} gl={{ antialias: true }} camera={{ fov: 40, near: 0.1, far: 4000 }}>
          <Lights look={LOOKS.space} shadow={false} noSky noFog />
          <Cam pos={[0, -6, 34]} look={[0, -9, 0]} fov={40} />
          <StarField />
          <Globe rot={lonRot(25)} pos={[0, -24, 0]} sun={[-0.9, 0.4, 0.3]} night={0.45} red={0.25}>
            <NetArcs r={10} f={30} on={0.25} />
          </Globe>
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,40,60,0.28) 0%, rgba(255,40,60,0) 55%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center' }}><Wifi s={300} /></div>
      <div style={{ position: 'absolute', left: 40, right: 40, top: 470, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 104, lineHeight: 1, color: '#fff', ...stroke(14) }}>ЧТО, ЕСЛИ</div>
        <div style={{ position: 'relative', height: 200, marginTop: 10 }}>
          {[['#00f0ff', -9], ['#ff2050', 9]].map(([c, dx]: any, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, fontFamily: TECH, fontSize: 168, lineHeight: 1.1, color: c, opacity: 0.75, transform: `translateX(${dx}px)` }}>ИНТЕРНЕТ</div>)}
          <div style={{ position: 'relative', fontFamily: TECH, fontSize: 168, lineHeight: 1.1, color: YEL, ...stroke(16), textShadow: '0 0 50px rgba(255,43,214,0.8)' }}>ИНТЕРНЕТ</div>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 128, lineHeight: 1, color: RED, ...stroke(14), marginTop: 6 }}>ПРОПАДЁТ?</div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1000, transform: 'rotate(-5deg)', fontFamily: TECH, fontSize: 52, color: '#fff', background: 'rgba(5,8,20,0.8)', border: `4px solid ${RED}`, padding: '8px 26px', borderRadius: 22 }}>НЕТ СЕТИ</div>
      <div style={{ position: 'absolute', right: 50, top: 1010, transform: 'rotate(4deg)', fontFamily: TECH, fontSize: 52, color: '#111', background: YEL, border: '4px solid #000', padding: '8px 26px', borderRadius: 22 }}>ДЕНЬ 30</div>
      <div style={{ position: 'absolute', left: 90, top: 1060, width: 900, height: 860 }}><HeroPhone w={900} h={860} /></div>
      <div style={{ position: 'absolute', right: 34, top: 40, opacity: 0.95 }}><NeonX size={110} glow={0.6} /></div>
    </AbsoluteFill>
  );
};
void THREE;
