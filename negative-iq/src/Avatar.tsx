import React, { useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, useDelayRender } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import '@fontsource/montserrat/900.css';
import { Lights, Cam, LOOKS } from './three/core';
import { City } from './three/city';
import { Person, randomLook, EXPR, merge } from './three/person';

const S = 1080;

/** the hero of the video (same look as the opening close-up) */
const heroLook = () => randomLook(3, { skin: '#f0c4a0', hair: '#3a2416', hairStyle: 'short', shirt: '#3f88c5' });

const Background: React.FC<{ variant: string }> = ({ variant }) => {
  if (variant === 'studio') {
    return (
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 38%, #8fd3ff 0%, #3a7bd5 45%, #1d2b64 100%)' }}>
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 35%)' }} />
      </AbsoluteFill>
    );
  }
  // soft-focus city street in warm morning light
  return (
    <AbsoluteFill style={{ filter: 'blur(13px) saturate(1.1)', transform: 'scale(1.08)' }}>
      <ThreeCanvas width={S} height={S} gl={{ antialias: true }} shadows camera={{ fov: 40, near: 0.1, far: 4000 }}>
        <Lights look={{ ...LOOKS.golden, sunAz: 178, sunEl: 8, sunI: 3.6 }} center={[0, 0, -20]} size={60} />
        <Cam pos={[0.6, 1.75, 8]} look={[0, 4.5, -60]} fov={44} />
        <City seed={7} near={3} far={7} lamps={0.6} night={0.25} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const Avatar: React.FC<{ variant?: 'city' | 'studio' }> = ({ variant = 'city' }) => {
  const [ready, setReady] = useState(false);
  const { delayRender, continueRender } = useDelayRender();
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => { document.fonts.load('900 40px Montserrat').then(() => { setReady(true); continueRender(h); }); }, []);
  const look = useMemo(heroLook, []);
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  return (
    <AbsoluteFill style={{ background: '#1b2033' }}>
      <Background variant={variant} />
      {/* warm light bloom behind the head */}
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 42%, rgba(255,214,160,0.45) 0%, rgba(255,214,160,0) 42%)' }} />
      <AbsoluteFill>
        <ThreeCanvas width={S} height={S} gl={{ antialias: true, alpha: true }} shadows camera={{ fov: 30, near: 0.05, far: 100 }}>
          <Lights look={{ ...LOOKS.morning, sunAz: 35, sunEl: 32, sunI: 2.6, hemiI: 1.0, env: 0.6 }} center={[0, 1.5, 0]} size={3} noSky noFog />
          <directionalLight position={[-2.5, 3.0, -3.0]} intensity={2.2} color={variant === 'studio' ? '#bfe6ff' : '#ffd9a8'} />
          <directionalLight position={[2.5, 2.4, -2.5]} intensity={1.4} color="#bcd6ff" />
          <pointLight position={[0, 1.7, 1.6]} intensity={1.6} distance={4} color="#ffffff" />
          <Cam pos={[0.14, 1.64, 1.95]} look={[0, 1.53, 0]} fov={30} />
          <Person look={look} blob={false} olWidth={0.008} pose={merge(EXPR.happy, {
            head: [0.04, -0.08, 0.07], body: [0.02, 0.12, 0], eyeA: [0.004, 0.0], eyeB: [0.004, 0.0], blink: 0,
            armL: [0.05, 0.12, 0.15], armR: [0.05, 0.12, 0.15], brows: [0.12, -0.12, 0.012],
          })} />
        </ThreeCanvas>
      </AbsoluteFill>
      {/* gentle vignette */}
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.35) 100%)' }} />
    </AbsoluteFill>
  );
};
