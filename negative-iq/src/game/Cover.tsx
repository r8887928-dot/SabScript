import React, { useEffect, useState } from 'react';
import { AbsoluteFill, useDelayRender } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import '@fontsource/montserrat/900.css';
import '@fontsource/russo-one/400.css';
import { Lights, Cam, LOOKS } from '../three/core';
import { City } from '../three/city';
import { Person, EXPR, merge } from '../three/person';
import { HERO } from './scenes';

const TECH = '"Russo One", Montserrat, sans-serif';
const FONT = 'Montserrat, sans-serif';
const stroke = (px: number, color = '#000') => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const });

const useFonts = () => {
  const [ready, setReady] = useState(false);
  const { delayRender, continueRender } = useDelayRender();
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => { Promise.all([document.fonts.load('900 40px Montserrat'), document.fonts.load('400 40px "Russo One"')]).then(() => { setReady(true); continueRender(h); }); }, []);
  return ready;
};

/** city street background; px < 1 renders it low-res and upscales with hard pixels */
const CityBg: React.FC<{ w: number; h: number; px?: number; cam: { pos: number[]; look: number[]; fov: number } }> = ({ w, h, px = 1, cam }) => {
  const cw = Math.max(16, Math.round(w * px)), ch = Math.max(16, Math.round(h * px));
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: cw, height: ch, transform: `scale(${w / cw})`, transformOrigin: '0 0', imageRendering: 'pixelated' }}>
      <ThreeCanvas width={cw} height={ch} gl={{ antialias: px >= 1 }} shadows={px >= 1} camera={{ fov: 45, near: 0.1, far: 4000 }}>
        <Lights look={{ ...LOOKS.morning, sunAz: 120, sunEl: 20 }} center={[0, 0, -20]} size={80} shadow={px >= 1} />
        <Cam {...cam} />
        <City seed={7} near={3} far={7} />
      </ThreeCanvas>
    </div>
  );
};

/** the shocked hero, head and shoulders, transparent background */
const Hero: React.FC<{ w: number; h: number; camZ?: number; lookY?: number; fov?: number }> = ({ w, h, camZ = 1.5, lookY = 1.55, fov = 30 }) => (
  <ThreeCanvas width={w} height={h} gl={{ antialias: true, alpha: true }} shadows camera={{ fov, near: 0.05, far: 100 }}>
    <Lights look={{ ...LOOKS.morning, sunAz: 30, sunEl: 32, sun: '#fff1e0', sunI: 2.4, hemiI: 1.0, env: 0.6 }} center={[0, 1.5, 0]} size={3} noSky noFog />
    <directionalLight position={[-2.6, 2.6, -2.6]} intensity={3.4} color="#ff2bd6" />
    <directionalLight position={[2.6, 2.4, -2.4]} intensity={2.8} color="#21f0ff" />
    <pointLight position={[0, 1.7, 1.6]} intensity={1.4} distance={4} color="#ffffff" />
    <Cam pos={[0.08, lookY + 0.06, camZ]} look={[0, lookY, 0]} fov={fov} />
    <Person look={HERO()} blob={false} olWidth={0.009} pose={merge(EXPR.shock, { mouth: 'O', brows: [0.38, -0.38, 0.045], eyeA: [0.0, 0.006], eyeB: [0.0, 0.006], head: [0.02, -0.06, 0.08], body: [0, 0.1, 0], blink: 0 })} />
  </ThreeCanvas>
);

const Hearts: React.FC<{ n?: number; on?: number; s?: number }> = ({ n = 5, on = 1, s = 64 }) => (
  <div style={{ display: 'flex', gap: 8, padding: '12px 20px', background: 'rgba(5,8,20,0.7)', borderRadius: 26, border: '4px solid rgba(255,255,255,0.35)' }}>
    {Array.from({ length: n }).map((_, i) => (
      <svg key={i} width={s} height={s} viewBox="0 0 32 32"><path d="M16 29 C3 20 1 13 4 8 C7 3 13 4 16 9 C19 4 25 3 28 8 C31 13 29 20 16 29Z" fill={i < on ? '#ff2a4a' : '#3a2a34'} stroke="#000" strokeWidth="2.5" /></svg>
    ))}
  </div>
);
const ExitButton: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <div style={{ position: 'relative', display: 'inline-block' }}>
    <div style={{ fontFamily: TECH, fontSize: size, color: '#fff', background: 'linear-gradient(180deg,#ff3b4f,#b80d22)', padding: `${size * 0.22}px ${size * 0.6}px`, borderRadius: size * 0.4, border: `${Math.round(size / 14)}px solid #000`, boxShadow: `0 ${size * 0.15}px 0 #6a0010, 0 0 ${size * 0.8}px rgba(255,40,60,0.7)` }}>ВЫЙТИ ИЗ ИГРЫ?</div>
    <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" style={{ position: 'absolute', right: -size * 0.35, bottom: -size * 0.75 }}>
      <path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.5 14 L17.5 14 Z" fill="#fff" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  </div>
);

/** vertical cover 1080×1920 (Shorts / TikTok / Reels) */
export const CoverGame: React.FC = () => {
  const ready = useFonts();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const cam = { pos: [0.6, 1.7, 30], look: [0, 6, -60], fov: 50 };
  return (
    <AbsoluteFill style={{ background: '#111' }}>
      <CityBg w={1080} h={1920} cam={cam} />
      {/* the right part of the world has already turned into pixels */}
      <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(62% 0, 100% 0, 100% 100%, 38% 100%)' }}>
        <CityBg w={1080} h={1920} px={0.045} cam={cam} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,0,30,0.55) 0%, rgba(10,0,30,0.1) 35%, rgba(10,0,30,0.15) 70%, rgba(10,0,30,0.8) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 58%, rgba(255,43,214,0.35) 0%, rgba(255,43,214,0) 45%)' }} />
      {/* hero */}
      <div style={{ position: 'absolute', left: 0, top: 640, width: 1080, height: 1080 }}><Hero w={1080} h={1080} camZ={1.55} lookY={1.5} /></div>
      {/* HUD */}
      <div style={{ position: 'absolute', left: 60, top: 600, transform: 'rotate(-4deg)' }}><Hearts on={1} s={58} /></div>
      <div style={{ position: 'absolute', right: 60, top: 640, fontFamily: TECH, fontSize: 56, color: '#ffd23f', ...stroke(8), transform: 'rotate(5deg)', background: 'rgba(5,8,20,0.7)', padding: '6px 22px', borderRadius: 18, border: '4px solid #ffd23f' }}>УР. 1</div>
      {/* headline */}
      <div style={{ position: 'absolute', left: 40, right: 40, top: 230, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 112, lineHeight: 1.0, color: '#fff', ...stroke(16), textShadow: '0 10px 30px rgba(0,0,0,0.7)' }}>ТЫ ПРОСНУЛСЯ</div>
        <div style={{ position: 'relative', marginTop: 6 }}>
          {[['#00f0ff', -9], ['#ff2050', 9]].map(([c, dx]: any, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, fontFamily: TECH, fontSize: 170, lineHeight: 1.0, color: c, opacity: 0.75, transform: `translateX(${dx}px)` }}>В ИГРЕ?!</div>)}
          <div style={{ position: 'relative', fontFamily: TECH, fontSize: 170, lineHeight: 1.0, color: '#ffe14a', ...stroke(16), textShadow: '0 0 50px rgba(255,43,214,0.9)' }}>В ИГРЕ?!</div>
        </div>
      </div>
      {/* the button */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1560, textAlign: 'center' }}><ExitButton size={74} /></div>
    </AbsoluteFill>
  );
};

/** horizontal thumbnail 1280×720 (YouTube) */
export const ThumbGame: React.FC<{ top?: string; big?: string; badge?: string; bigSize?: number }> = ({ top = 'ТЫ ПРОСНУЛСЯ', big = 'В ИГРЕ?!', badge, bigSize }) => {
  const ready = useFonts();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const cam = { pos: [0.6, 1.7, 30], look: [0, 5, -60], fov: 40 };
  return (
    <AbsoluteFill style={{ background: '#111' }}>
      <CityBg w={1280} h={720} cam={cam} />
      <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 42% 100%)' }}>
        <CityBg w={1280} h={720} px={0.05} cam={cam} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,0,30,0.15) 0%, rgba(10,0,30,0.25) 45%, rgba(10,0,30,0.7) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 26% 55%, rgba(255,43,214,0.4) 0%, rgba(255,43,214,0) 40%)' }} />
      <div style={{ position: 'absolute', left: -60, top: 20, width: 760, height: 760 }}><Hero w={760} h={760} camZ={1.6} lookY={1.5} /></div>
      <div style={{ position: 'absolute', left: 30, top: 620, transform: 'rotate(-3deg)' }}><Hearts on={1} s={44} /></div>
      {badge && <div style={{ position: 'absolute', left: 30, top: 30, fontFamily: TECH, fontSize: 46, color: '#111', background: '#ffd23f', padding: '6px 22px', borderRadius: 14, border: '4px solid #000', transform: 'rotate(-4deg)' }}>{badge}</div>}
      <div style={{ position: 'absolute', left: 600, right: 30, top: 70, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 78, lineHeight: 1.0, color: '#fff', ...stroke(12) }}>{top}</div>
        <div style={{ fontFamily: TECH, fontSize: bigSize ?? (big.length > 9 ? 104 : 132), lineHeight: 1.05, color: '#ffe14a', ...stroke(12), textShadow: '-6px 0 0 rgba(0,240,255,0.7), 6px 0 0 rgba(255,32,80,0.7), 0 0 40px rgba(255,43,214,0.9)' }}>{big}</div>
        <div style={{ marginTop: 40 }}><ExitButton size={50} /></div>
      </div>
    </AbsoluteFill>
  );
};
