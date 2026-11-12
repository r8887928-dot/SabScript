import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { AbsoluteFill, useDelayRender } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import '@fontsource/montserrat/900.css';
import '@fontsource/russo-one/400.css';
import { Lights, Cam, LOOKS, mat, basic } from './three/core';
import { Person, EXPR, merge } from './three/person';
import { HERO } from './game/scenes';
import { rng } from './lib/anim';

// Channel kit for «ЭКСПЕРИМЕНТ ИКС»: neon X logo, avatars, watermark, banner.
const TECH = '"Russo One", Montserrat, sans-serif';
const MAG = '#ff2bd6', CYAN = '#21f0ff', INK = '#12002a';

const useFonts = () => {
  const [ready, setReady] = useState(false);
  const { delayRender, continueRender } = useDelayRender();
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => { Promise.all([document.fonts.load('900 40px Montserrat'), document.fonts.load('400 40px "Russo One"')]).then(() => { setReady(true); continueRender(h); }); }, []);
  return ready;
};

/** the logo: two neon tubes crossing (magenta under, cyan over) */
export const NeonX: React.FC<{ size: number; glow?: number; style?: React.CSSProperties }> = ({ size, glow = 1, style }) => {
  const bars: [string, number[]][] = [[MAG, [20, 20, 80, 80]], [CYAN, [80, 20, 20, 80]]];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', ...style }}>
      <defs>
        <filter id="nx-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={4.5 * glow} /></filter>
        <filter id="nx-glow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={1.6} /></filter>
      </defs>
      {bars.map(([c, [x1, y1, x2, y2]], i) => (
        <g key={i} strokeLinecap="round">
          {glow > 0 && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={20} opacity={0.85} filter="url(#nx-glow)" />}
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={19} />
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={12.5} />
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeWidth={4.5} opacity={0.75} filter="url(#nx-glow2)" />
          <line x1={x1 + (x2 > x1 ? 3 : -3)} y1={y1 + 3} x2={x1 + (x2 > x1 ? 14 : -14)} y2={y1 + 14} stroke="#ffffff" strokeWidth={3} opacity={0.9} />
        </g>
      ))}
    </svg>
  );
};

/** dark synthwave backdrop: stars, horizon glow, perspective grid */
function gridBg(W: number, H: number, hz: number, seed = 5, mtn = false) {
  let grid = '';
  const n = Math.ceil(W / 60);
  for (let i = -n; i <= n; i++) grid += `<line x1='${W / 2 + i * (W / 75)}' y1='${hz}' x2='${W / 2 + i * (W / 7.8)}' y2='${H}' stroke='${MAG}' stroke-width='${W / 850}' opacity='0.7'/>`;
  for (let k = 0; k < 11; k++) { const y = hz + Math.pow(k / 10, 1.8) * (H - hz); grid += `<line x1='0' y1='${y}' x2='${W}' y2='${y}' stroke='${MAG}' stroke-width='${(W / 1300) * (1 + k * 0.25)}' opacity='0.75'/>`; }
  const r = rng(seed);
  let stars = '';
  for (let i = 0; i < W / 16; i++) stars += `<circle cx='${r() * W}' cy='${r() * (hz - 30)}' r='${(0.6 + r() * 1.8) * W / 2560 * 1.6}' fill='#ffffff' opacity='${0.25 + r() * 0.6}'/>`;
  let m = '';
  if (mtn) {
    m = `<path d='M0 ${hz} `;
    for (let x = 0; x <= W; x += 80) m += `L${x} ${hz - 24 - Math.abs(Math.sin(x * 0.004) * 90 + Math.sin(x * 0.011) * 34)} `;
    m += `L${W} ${hz} Z' fill='#1a0636' stroke='${CYAN}' stroke-width='3' opacity='0.95'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'><defs>
    <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#07001a'/><stop offset='${(hz / H) * 0.62}' stop-color='#2c0861'/><stop offset='${hz / H}' stop-color='#ff4fb3'/></linearGradient>
    <linearGradient id='flo' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a0057'/><stop offset='1' stop-color='#07001a'/></linearGradient></defs>
    <rect width='${W}' height='${H}' fill='url(#sky)'/>${stars}${m}<rect y='${hz}' width='${W}' height='${H - hz}' fill='url(#flo)'/>${grid}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/** lab goggles pushed up on the forehead (head-centre coordinates) */
const Goggles: React.FC = () => {
  const rubber = mat('#1c1c26', { r: 0.5 });
  const rim = mat(MAG, { r: 0.35, m: 0.2 });
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8ff8ff', transparent: true, opacity: 0.8, roughness: 0.08, metalness: 0.2, emissive: new THREE.Color(CYAN), emissiveIntensity: 1.1 }), []);
  return (
    <group>
      <mesh material={rubber} position={[0, 0.172, -0.02]} rotation={[Math.PI / 2 - 0.12, 0, 0]}><torusGeometry args={[0.178, 0.016, 10, 48]} /></mesh>
      <group position={[0, 0.205, 0.112]} rotation={[-0.8, 0, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.07, 0, 0]}>
            <mesh material={rubber} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.06, 0.062, 0.05, 28]} /></mesh>
            <mesh material={rim} position={[0, 0, 0.026]}><torusGeometry args={[0.054, 0.01, 10, 32]} /></mesh>
            <mesh material={glass} position={[0, 0, 0.027]}><circleGeometry args={[0.048, 28]} /></mesh>
            <mesh material={basic('#ffffff', { t: 0.8 })} position={[-0.02, 0.02, 0.03]} rotation={[0, 0, 0.7]}><planeGeometry args={[0.032, 0.009]} /></mesh>
          </group>
        ))}
        <mesh material={rubber} position={[0, 0, 0.005]}><boxGeometry args={[0.04, 0.022, 0.03]} /></mesh>
      </group>
    </group>
  );
};

const heroPose = (extra = {}) => merge(EXPR.happy, { brows: [0.3, -0.06, 0.004], eyeA: [0, 0.002], eyeB: [0, 0.002], head: [0.03, -0.1, 0.07], body: [0.02, 0.08, 0], armL: [0.05, 0.12, 0.15], armR: [0.05, 0.12, 0.15], blink: 0, ...extra });

const HeroRig: React.FC<{ pose: any; cam: { pos: number[]; look: number[]; fov: number } }> = ({ pose, cam }) => (
  <>
    <Lights look={{ ...LOOKS.morning, sunAz: 30, sunEl: 32, sun: '#fff1e0', sunI: 2.3, hemiI: 1.0, env: 0.6 }} center={[0, 1.4, 0]} size={3} noSky noFog />
    <directionalLight position={[-2.6, 2.6, -2.6]} intensity={3.4} color={MAG} />
    <directionalLight position={[2.6, 2.4, -2.4]} intensity={2.8} color={CYAN} />
    <pointLight position={[0, 1.7, 1.6]} intensity={1.4} distance={4} color="#ffffff" />
    <Cam {...cam} />
    <Person look={HERO()} blob={false} olWidth={0.008} pose={pose} onHead={<Goggles />} />
  </>
);

/** channel avatar 800×800: the hero in lab goggles in front of the neon X */
export const ChannelAvatar: React.FC<{ variant?: 'hero' | 'logo' }> = ({ variant = 'hero' }) => {
  const ready = useFonts();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const S = 800;
  return (
    <AbsoluteFill style={{ backgroundImage: gridBg(S, S, 560, 9), backgroundSize: 'cover' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 42%, rgba(123,47,247,0.55) 0%, rgba(123,47,247,0) 55%)' }} />
      {variant === 'hero' ? (
        <>
          <div style={{ position: 'absolute', left: 400 - 330, top: 330 - 330 }}><NeonX size={660} /></div>
          <AbsoluteFill>
            <ThreeCanvas width={S} height={S} gl={{ antialias: true, alpha: true }} shadows camera={{ fov: 30, near: 0.05, far: 100 }}>
              <HeroRig pose={heroPose()} cam={{ pos: [0.12, 1.66, 2.0], look: [0, 1.57, 0], fov: 30 }} />
            </ThreeCanvas>
          </AbsoluteFill>
        </>
      ) : (
        <div style={{ position: 'absolute', left: 400 - 260, top: 380 - 260 }}><NeonX size={520} glow={1.3} /></div>
      )}
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 46%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.38) 100%)' }} />
    </AbsoluteFill>
  );
};

/** video watermark 150×150 (transparent) */
export const ChannelWatermark: React.FC = () => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <NeonX size={118} glow={0.6} />
  </AbsoluteFill>
);

/** YouTube channel art 2560×1440; everything important inside the centre 1546×423 (x 507–2053, y 508–931) */
export const ChannelBanner: React.FC<{ guides?: boolean }> = ({ guides = false }) => {
  const ready = useFonts();
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  const W = 2560, H = 1440, CW = 820, CH = 1110;
  const qs: [number, number, number, string, number][] = [[250, 600, 150, MAG, -14], [400, 830, 90, CYAN, 10], [150, 900, 70, '#ffe14a', -6], [2230, 560, 140, CYAN, 12], [2400, 790, 100, MAG, -10], [2180, 880, 70, '#ffe14a', 8]];
  return (
    <AbsoluteFill style={{ backgroundImage: gridBg(W, H, 900, 4, true), backgroundSize: 'cover' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 69% 50%, rgba(123,47,247,0.55) 0%, rgba(123,47,247,0) 32%)' }} />
      {/* floating question marks (decor, may be cropped on phones) */}
      {qs.map(([x, y, s, c, rot], i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y, fontFamily: TECH, fontSize: s, lineHeight: 1, color: c, transform: `rotate(${rot}deg)`, textShadow: `0 0 ${s * 0.25}px ${c}, 0 0 ${s * 0.5}px ${c}`, opacity: 0.85 }}>?</div>
      ))}
      <div style={{ position: 'absolute', left: 1765 - 310, top: 665 - 310 }}><NeonX size={620} /></div>
      {/* the hero points at the channel name */}
      <div style={{ position: 'absolute', left: 1765 - CW / 2, top: 362, width: CW, height: CH }}>
        <ThreeCanvas width={CW} height={CH} gl={{ antialias: true, alpha: true }} shadows camera={{ fov: 30, near: 0.05, far: 100 }}>
          <HeroRig pose={heroPose({ armL: [0.25, 1.25, 0.35], armR: [0.1, 0.18, 0.5], head: [0.03, 0.12, 0.05], eyeA: [-0.012, 0.004], eyeB: [-0.012, 0.004] })}
            cam={{ pos: [0.12, 1.16, 3.6], look: [0, 1.04, 0], fov: 39.7 }} />
        </ThreeCanvas>
      </div>
      {/* channel name */}
      <div style={{ position: 'absolute', left: 560, top: 535, width: 900 }}>
        <div style={{ fontFamily: TECH, fontSize: 116, lineHeight: 1.0, color: '#ffffff', letterSpacing: 2, textShadow: `0 0 18px ${MAG}, 0 0 44px ${MAG}, 0 7px 0 #2a0845` }}>ЭКСПЕРИМЕНТ</div>
        <div style={{ position: 'relative', height: 190, marginTop: 4 }}>
          {[[CYAN, -8], ['#ff2050', 8]].map(([c, dx]: any, i) => (
            <div key={i} style={{ position: 'absolute', left: dx, top: 0, fontFamily: TECH, fontSize: 196, lineHeight: 1.0, color: c, opacity: 0.7, letterSpacing: 8 }}>ИКС</div>
          ))}
          <div style={{ position: 'absolute', left: 0, top: 0, fontFamily: TECH, fontSize: 196, lineHeight: 1.0, color: '#ffe14a', letterSpacing: 8, WebkitTextStroke: '10px #12002a', paintOrder: 'stroke fill', textShadow: '0 0 50px rgba(255,43,214,0.9)' }}>ИКС</div>
        </div>
        <div style={{ marginTop: 18, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 38, color: CYAN, letterSpacing: 4, whiteSpace: 'nowrap', WebkitTextStroke: '8px #12002a', paintOrder: 'stroke fill', textShadow: `0 0 16px ${CYAN}` }}>ЧТО БУДЕТ, ЕСЛИ…? · 3D-ЭКСПЕРИМЕНТЫ</div>
      </div>
      {guides && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 508, height: 423, border: '4px dashed rgba(255,255,255,0.5)' }} />
          <div style={{ position: 'absolute', left: 352, width: 1855, top: 508, height: 423, border: '4px dashed rgba(255,255,0,0.6)' }} />
          <div style={{ position: 'absolute', left: 507, width: 1546, top: 508, height: 423, border: '6px solid #7dff7d' }} />
        </>
      )}
    </AbsoluteFill>
  );
};
