import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mixLook, Look } from '../three/core';
import { City } from '../three/city';
import { Smoke } from '../three/props';
import { Traffic } from './Morning';
import { StuckCars } from './Hour';
import { shotClock } from '../lib/tl';
import { lerp, smoother, ramp } from '../lib/anim';

type Cfg = { a: Look; b: Look; smoke: number; night: [number, number]; lit: [number, number]; trash: number; over: [number, number]; lamps: number; traffic: 'normal' | 'blink' | 'off' | 'chaos'; jam: number; ang: number; moving: boolean };
const CFG: Record<string, Cfg> = {
  I1: { a: LOOKS.day, b: { ...LOOKS.day, sunAz: 160, sunEl: 40 }, smoke: 0, night: [0, 0], lit: [1, 1], trash: 0, over: [0, 0], lamps: 0, traffic: 'normal', jam: 0, ang: 0.4, moving: true },
  I2: { a: LOOKS.day, b: LOOKS.chaos, smoke: 2, night: [0, 0], lit: [1, 1], trash: 0.2, over: [0, 0], lamps: 0, traffic: 'chaos', jam: 30, ang: 1.6, moving: false },
  I3: { a: LOOKS.chaos, b: LOOKS.dusk, smoke: 3, night: [0, 0.8], lit: [1, 0.7], trash: 0.4, over: [0, 0], lamps: 0.6, traffic: 'blink', jam: 40, ang: 2.8, moving: false },
  I4: { a: LOOKS.dusk, b: LOOKS.night, smoke: 3, night: [0.8, 1], lit: [0.7, 0.3], trash: 0.6, over: [0, 0], lamps: 0.2, traffic: 'off', jam: 40, ang: 4.0, moving: false },
  I5: { a: LOOKS.night, b: { ...LOOKS.chaos, sunAz: 120 }, smoke: 2, night: [1, 0], lit: [0.3, 0.2], trash: 0.9, over: [0, 0.15], lamps: 0, traffic: 'off', jam: 40, ang: 5.2, moving: false },
  I6: { a: LOOKS.dusk, b: LOOKS.overgrown, smoke: 1, night: [0.4, 0], lit: [0.15, 0.1], trash: 1, over: [0.2, 0.75], lamps: 0, traffic: 'off', jam: 40, ang: 0.9, moving: false },
};

/** time-lapse aerial behind the fact card / experiment clock */
export const makeInterlude = (id: string): React.FC => () => {
  const f = useCurrentFrame();
  const k = shotClock(id);
  const c = CFG[id];
  const p = f / k.dur;
  const tl = smoother(Math.min(1, f / (k.dur * 0.92)));
  const look = mixLook(c.a, c.b, tl);
  look.sunAz = lerp(c.a.sunAz - 40, c.b.sunAz + 30, p);
  const ang = c.ang + p * 0.7;
  const R = lerp(190, 150, smoother(p)), Y = lerp(150, 110, smoother(p));
  const pos = [Math.sin(ang) * R, Y, Math.cos(ang) * R];
  return (
    <Stage>
      <Lights look={look} center={[0, 0, 0]} size={140} frame={f * 6} mapSize={2048} />
      <Cam pos={pos} look={[0, 0, 0]} fov={46} />
      <City seed={7} near={3} far={8} night={lerp(c.night[0], c.night[1], tl)} lit={lerp(c.lit[0], c.lit[1], tl)} trash={c.trash} overgrowth={lerp(c.over[0], c.over[1], tl)} lamps={c.lamps * ramp(f, 0, 30)} traffic={c.traffic} f={f * 4} />
      {c.moving && <Traffic f={f * 3} n={40} seed={13} span={300} />}
      {c.jam > 0 && <StuckCars seed={21} n={c.jam} f={f} area={300} rust={id === 'I6' ? 0.6 : 0} police={id === 'I2' ? 4 : 0} />}
      {c.smoke > 0 && <Smoke pos={[40, 10, -50]} f={f * 2} h={120} s={24} seed={4} />}
      {c.smoke > 1 && <Smoke pos={[-70, 10, 40]} f={f * 2 + 40} h={110} s={22} seed={5} color="#4a4644" />}
      {c.smoke > 2 && <Smoke pos={[90, 10, 80]} f={f * 2 + 80} h={100} s={20} seed={6} />}
    </Stage>
  );
};
export const I1 = makeInterlude('I1'), I2 = makeInterlude('I2'), I3 = makeInterlude('I3'), I4 = makeInterlude('I4'), I5 = makeInterlude('I5'), I6 = makeInterlude('I6');
