import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mixLook } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, Crowd, Agent, walk } from '../three/person';
import { IQTag, Glow } from '../three/props';
import { Earth, StarField, SunGlow } from '../three/earth';
import { shotClock } from '../lib/tl';
import { track, ramp, lerp, rng, easeOut, smoother, kick, clamp } from '../lib/anim';

export const lonRot = (L: number) => Math.PI / 2 - ((L + 180) * Math.PI) / 180;

// 0.00 «Что если» — face close-up, IQ 100 hologram, fast pull-back
export const H1Face: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('h1_face');
  const look = useMemo(() => randomLook(3, { skin: '#f0c4a0', hair: '#3a2416', hairStyle: 'short', shirt: '#3f88c5' }), []);
  const p = easeOut(f / k.dur);
  const cam = { pos: [lerp(0.15, 0.6, p), lerp(1.66, 1.75, p), lerp(0.95, 2.6, p)], look: [0, lerp(1.68, 1.82, p), 0], fov: lerp(30, 38, p) };
  return (
    <Stage>
      <Lights look={LOOKS.morning} center={[0, 1, 0]} size={8} />
      <Cam {...cam} />
      <group position={[0, 0, 0]}>
        <City seed={7} near={2} far={5} />
      </group>
      <Person look={look} rotY={0} pose={merge(idle(f, 3), EXPR.happy, { blink: f > 14 && f < 18 ? 1 : 0, eyeA: [0, 0], eyeB: [0, 0], head: [0.02, 0, 0] })} pos={[0, 0, 0]} />
      <IQTag value={100} pos={[0, 2.2, 0]} s={0.9} />
    </Stage>
  );
};

// «у всех людей» — aerial over the plaza crowd, crane up fast
export const H2Crowd: React.FC = () => {
  const f = useCurrentFrame();
  const agents = useMemo<Agent[]>(() => {
    const r = rng(12); const out: Agent[] = [];
    for (let i = 0; i < 520; i++) {
      const a = r() * Math.PI * 2, d = 6 + Math.sqrt(r()) * 30;
      out.push({ x: -28 + Math.cos(a) * d * 0.95, z: -28 + Math.sin(a) * d * 0.95, rot: r() * 6.28, seed: i });
    }
    for (let i = 0; i < 260; i++) { const along = (r() - 0.5) * 300; const side = (r() < 0.5 ? -1 : 1) * (8 + r() * 3); out.push(r() < 0.5 ? { x: side, z: along, rot: r() * 6, seed: 900 + i } : { x: along, z: side, rot: r() * 6, seed: 900 + i }); }
    return out;
  }, []);
  agents.forEach((a, i) => { a.bob = Math.abs(Math.sin(f * 0.35 + i)) * 0.06; });
  const p = smoother(f / 21);
  const cam = { pos: [lerp(-8, 10, p), lerp(14, 55, p), lerp(6, 40, p)], look: [-26, 0, -26], fov: 50 };
  return (
    <Stage>
      <Lights look={LOOKS.morning} center={[-20, 0, -20]} size={70} />
      <Cam {...cam} />
      <City seed={7} near={3} far={7} />
      <Crowd agents={agents} />
      {agents.slice(0, 520).filter((_, i) => i % 3 === 0).map((a, i) => <Glow key={i} pos={[a.x, 2.4, a.z]} s={1.4} color="#2ae8ff" o={0.85} />)}
    </Stage>
  );
};

// «на Земле внезапно станет отрицательный IQ?» — the planet, red wave
export const H3Earth: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('h3_earth');
  const red = ramp(f, k.w(7), k.w(9) + 6);
  const boom = k.cue('hook_boom');
  const shake = kick(f, boom, 8) * 0.25;
  const dist = lerp(60, 44, smoother(f / k.dur)) + (f > boom ? -3 * easeOut((f - boom) / 12) : 0);
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam pos={[shake, 4 + shake, dist]} look={[0, -1.5, 0]} fov={40} />
      <StarField />
      <SunGlow pos={[400, 120, -500]} s={260} />
      <Earth rot={lonRot(35) + f * 0.004} sun={[0.9, 0.25, 0.5]} red={red} r={10} pos={[0, -2.5, 0]} />
    </Stage>
  );
};

// TITLE — red planet, title card overlay
export const TitleShot: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('title');
  const p = smoother(f / k.dur);
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam pos={[0, lerp(-6, -9, p), lerp(23, 19, p)]} look={[0, -9, 0]} fov={40} />
      <StarField />
      <Earth rot={lonRot(45) + f * 0.003} sun={[0.4, 0.4, 0.8]} red={1} r={10} pos={[0, -20, 0]} night={0.6} />
    </Stage>
  );
};
export { walk, mixLook, clamp };
