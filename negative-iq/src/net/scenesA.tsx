import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mixLook, mat, basic } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR, walkPath, Crowd, Agent } from '../three/person';
import { Room, Shelf, rbox, useScreen, Screen, QMark, Glow, Lamp } from '../three/props';
import { Earth, StarField, SunGlow } from '../three/earth';
import { Traffic } from '../scenes/Morning';
import { Headset } from '../AvatarNiches';
import { HERO, Label } from '../game/scenes';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, smoother, kick, clamp, pop, hash } from '../lib/anim';
import { NetArcs, Phone, PhoneProp, SpinnerSprite, NoWifiSprite, Router, Satellite, Waves, Cables, Anchor, OldTV, RadioSet, spinner, wifiOff, statusBar, bubble, FONT, CYAN, MAG, RED } from './kit';

export const lonRot = (L: number) => Math.PI / 2 - ((L + 180) * Math.PI) / 180;
export const NEIGHBOR = () => randomLook(611, { skin: '#e8b48f', hair: '#2b1d16', hairStyle: 'curly', shirt: '#f3a712', pants: '#3b3b3b' });

/** a translucent cone from `from` towards `to`, `len` long */
export const Beam: React.FC<{ from: number[]; to: number[]; len: number; col: string; r?: number; o?: number }> = ({ from, to, len, col, r = 2.4, o = 0.16 }) => {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  const mid = a.clone().add(dir.clone().multiplyScalar(len / 2));
  return <mesh position={mid} quaternion={q} material={basic(col, { add: true, t: o, side: THREE.DoubleSide })}><cylinderGeometry args={[0.08, r, len, 32, 1, true]} /></mesh>;
};
/** earth with things that turn with it (arcs, cables) */
export const Globe: React.FC<{ rot: number; r?: number; pos?: number[]; sun?: number[]; night?: number; red?: number; children?: React.ReactNode }> = ({ rot, r = 10, pos = [0, 0, 0], sun = [1, 0.3, 0.6], night = 1, red = 0, children }) => (
  <group>
    <Earth rot={rot} r={r} pos={pos} sun={sun} night={night} red={red} />
    <group position={pos as any} rotation={[0, 0, 0.41]}><group rotation={[0, rot, 0]}>{children}</group></group>
  </group>
);

// ------------------------------------------------------------------ screens
/** a short looping "video": sunny hills with a bouncing ball; frozen after `freeze` */
export function drawVideo(g: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#5fb2ff'); sky.addColorStop(1, '#c9ecff'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffe14a'; g.beginPath(); g.arc(w * 0.78, h * 0.22, h * 0.1, 0, 7); g.fill();
  g.fillStyle = '#4caf50'; g.beginPath(); g.ellipse(w * 0.3, h * 1.02, w * 0.6, h * 0.42, 0, 0, 7); g.fill();
  g.fillStyle = '#2e9e5b'; g.beginPath(); g.ellipse(w * 0.85, h * 1.05, w * 0.5, h * 0.36, 0, 0, 7); g.fill();
  const bx = (t * 9) % (w + 80) - 40, by = h * 0.62 - Math.abs(Math.sin(t * 0.35)) * h * 0.35;
  g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(bx, by, h * 0.07, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(bx - h * 0.02, by - h * 0.02, h * 0.02, 0, 7); g.fill();
}
const phoneVideo = (f: number, freeze: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  statusBar(g, w, true, f >= freeze);
  g.fillStyle = '#000'; g.fillRect(0, 44, w, h - 44);
  const vh = Math.round(w * 0.62);
  g.save(); g.translate(0, 200); drawVideo(g, w, vh, Math.min(f, freeze)); g.restore();
  g.fillStyle = '#333'; g.fillRect(20, 200 + vh + 18, w - 40, 8);
  g.fillStyle = RED; g.fillRect(20, 200 + vh + 18, (w - 40) * (0.35 + 0.004 * Math.min(f, freeze)), 8);
  if (f >= freeze) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 200, w, vh); spinner(g, w / 2, 200 + vh / 2, 46, f, '#ffffff'); }
  g.fillStyle = '#fff'; g.font = `800 30px ${FONT}`; g.textAlign = 'left'; g.fillText('Смешные котики 2026', 22, 200 + vh + 70);
  g.fillStyle = '#9aa'; g.font = `600 22px ${FONT}`; g.fillText('12 млн просмотров', 22, 200 + vh + 104);
  for (let i = 0; i < 3; i++) { g.fillStyle = '#1d1f27'; g.fillRect(20, 200 + vh + 140 + i * 120, w - 40, 100); }
};
const phoneChat = (f: number, stuck: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  statusBar(g, w, false, true);
  g.fillStyle = '#ffffff'; g.fillRect(0, 44, w, h - 44);
  g.fillStyle = '#f4f6fb'; g.fillRect(0, 44, w, 80); g.fillStyle = '#111'; g.font = `800 30px ${FONT}`; g.textAlign = 'left'; g.fillText('Макс', 90, 96);
  g.fillStyle = '#ffb020'; g.beginPath(); g.arc(50, 84, 26, 0, 7); g.fill();
  bubble(g, 24, 170, 300, 64, false, 'Ты где?');
  bubble(g, 24, 250, 380, 64, false, 'Смотри что нашёл!!');
  bubble(g, w - 400, 350, 376, 98, true, 'Иду, через 5 минут', '12:03 ✓✓');
  const shown = f >= stuck - 20;
  if (shown) {
    bubble(g, w - 420, 470, 396, 98, true, 'Скинь ссылку ещё раз', f >= stuck ? 'отправка…' : '12:04');
    if (f >= stuck) {
      g.save(); g.translate(w - 50, 548); g.strokeStyle = '#cfe0ff'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.stroke();
      g.rotate(f * 0.2); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -9); g.stroke(); g.restore();
      if (f >= stuck + 40) { g.fillStyle = RED; g.beginPath(); g.arc(w - 448, 520, 18, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = `900 26px ${FONT}`; g.textAlign = 'center'; g.fillText('!', w - 448, 529); }
    }
  }
  g.fillStyle = '#eef0f5'; g.fillRect(0, h - 90, w, 90); g.fillStyle = '#fff'; (g as any).roundRect(20, h - 74, w - 120, 56, 28); g.fill();
};

/** hero holding a phone, seen over his shoulder (or from the front) */
const PhoneSet: React.FC<{ f: number; tex: THREE.Texture; front?: boolean; outdoor?: boolean }> = ({ f, tex, front, outdoor }) => (
  <>
    {outdoor ? <group position={[-30, 0, -40]}><City seed={9} near={2} far={4} /></group>
      : <group position={[0, 0, 0.5]}><Room w={6} d={7} h={3} wall="#d8e4f0" floor="wood" windows="back" light={0.9} /></group>}
    {!outdoor && <>
      <mesh geometry={rbox(2.4, 0.5, 0.9, 0.12)} position={[0, 0.25, -2.6]} material={mat('#5a6fa8', { r: 0.9 })} castShadow receiveShadow />
      <mesh geometry={rbox(2.4, 0.8, 0.25, 0.1)} position={[0, 0.7, -3.0]} material={mat('#4d5f95', { r: 0.9 })} castShadow />
      <Lamp pos={[1.9, 0, -2.4]} on={0.6} />
    </>}
    <Person look={HERO()} pos={[0, 0, 0]} rotY={front ? 0 : Math.PI} pose={merge(idle(f, 1), front ? EXPR.confused : EXPR.neutral, { armL: [1.55, -0.25, 1.45], armR: [1.35, 0.2, 1.25], head: [0.42, 0, 0] })}
      propL={<PhoneProp tex={tex} tilt={0.35} />} />
  </>
);

// ------------------------------------------------------------------ HOOK
// «Что, если прямо сейчас на всей Земле пропадёт интернет?»
export const NH1Earth: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('nh1_earth');
  const off = k.cue('hook_power');
  const cut = ramp(f, off, off + 14);
  const dist = lerp(52, 38, smoother(f / k.dur));
  const sh = kick(f, off, 8) * 0.4;
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam pos={[sh, 6 + sh, dist]} look={[0, 2, 0]} fov={40} />
      <StarField />
      <SunGlow pos={[-500, 200, -300]} s={300} />
      <Globe rot={lonRot(30) + f * 0.004} sun={[-0.9, 0.35, 0.15]} night={lerp(1, 0.35, cut)}>
        <NetArcs r={10} f={f} on={1} cut={cut} />
      </Globe>
    </Stage>
  );
};
// «Не у тебя.» — your phone: no network
export const NH2You: React.FC = () => {
  const f = useCurrentFrame();
  const tex = useScreen(360, 740, 'nh2' + Math.floor(f / 2), phoneVideo(f + 200, 0));
  const c = camK(f, [{ f: 0, p: [0.35, 1.62, 1.25], l: [0, 1.5, 0], fov: 34 }, { f: 30, p: [0.28, 1.6, 1.0], l: [0, 1.52, 0], fov: 34 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <PhoneSet f={f} tex={tex} front />
      <pointLight position={[0.05, 1.35, 0.45]} intensity={2.5} distance={1.2} color="#9fc8ff" />
      <NoWifiSprite pos={[0.36, 2.0, 0.1]} s={0.34 * pop(f, 3, 7)} />
    </Stage>
  );
};
// «Везде. Сразу.» — no-network badges pop over the whole city
export const NH3World: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('nh3_world');
  const pts = useMemo(() => { const r = rng(44); return Array.from({ length: 26 }).map(() => [(r() - 0.5) * 230, 30 + r() * 40, (r() - 0.5) * 230, r() * 30]); }, []);
  const c = camK(f, [{ f: 0, p: [40, 70, 120], l: [0, 10, 0], fov: 46 }, { f: k.dur, p: [70, 150, 220], l: [0, 0, 0], fov: 48 }]);
  return (
    <Stage>
      <Lights look={LOOKS.dusk} center={[0, 0, 0]} size={140} frame={f} />
      <Cam {...c} />
      <City seed={7} near={3} far={8} night={0.8} lamps={0.6} f={f} lit={hash(Math.floor(f / 3)) > 0.3 ? 1 : 0.4} />
      {pts.map((p, i) => <NoWifiSprite key={i} pos={[p[0], p[1], p[2]]} s={22 * pop(f, p[3] * 0.6, 7)} />)}
    </Stage>
  );
};
// «Досмотри до конца…» — teaser: a glowing cable on the sea floor, an anchor falls
export const SeaFloor: React.FC<{ f: number; snap: number; anchorY: number }> = ({ f, snap, anchorY }) => {
  const sand = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a4a5c', roughness: 1 }), []);
  const gap = snap > 0 ? easeOut(snap) * 0.5 : 0;
  const r = rng(Math.floor(f / 2) + 5);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sand} receiveShadow><planeGeometry args={[80, 80, 1, 1]} /></mesh>
      {Array.from({ length: 40 }).map((_, i) => { const q = rng(i + 9); return <mesh key={i} position={[(q() - 0.5) * 30, 0.1, -q() * 30 + 4]} material={mat('#1d3a48', { r: 1 })}><sphereGeometry args={[0.2 + q() * 0.6, 8, 6]} /></mesh>; })}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * gap, 0, 0]} rotation={[0, 0, sd * gap * 0.3]}>
          <mesh position={[sd * 20.05, 0.18, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('#111820', { r: 0.6 })}><cylinderGeometry args={[0.16, 0.16, 40, 12]} /></mesh>
          <mesh position={[sd * 20.05, 0.18, 0]} rotation={[0, 0, Math.PI / 2]} material={basic(snap > 0 ? RED : CYAN, { add: true, t: snap > 0 ? 0.5 * (hash(f) > 0.5 ? 1 : 0.3) : 0.7 + 0.3 * Math.sin(f * 0.3) })}><cylinderGeometry args={[0.2, 0.2, 40, 12]} /></mesh>
        </group>
      ))}
      <Anchor pos={[0.4, anchorY, 0.3]} rot={[0.15, 0.5, 0.25]} s={1.1} />
      <mesh position={[0.4, anchorY + 2.3 + 15, 0.3]} material={mat('#2a2e33', { r: 0.6, m: 0.6 })}><cylinderGeometry args={[0.05, 0.05, 30, 6]} /></mesh>
      {snap > 0 && snap < 1.4 && Array.from({ length: 14 }).map((_, i) => {
        const a = r() * Math.PI * 2, d = r() * 1.6 * snap;
        return <sprite key={i} position={[Math.cos(a) * d, 0.3 + Math.abs(Math.sin(a)) * d, 0.2]} scale={[0.25, 0.25, 1]} material={basic('#ffffff') as any} />;
      })}
      {snap > 0 && <Glow pos={[0, 0.4, 0.3]} s={4 * (1.4 - Math.min(1.3, snap))} color="#9fdcff" />}
      <pointLight position={[0, 6, 4]} intensity={20} distance={30} color="#7fc8ff" />
    </group>
  );
};
const SEA = { ...LOOKS.night, top: '#06233a', hor: '#0b3a55', bot: '#04121e', fog: '#062a40', fogNear: 4, fogFar: 40, hemiSky: '#4fa8d8', hemiI: 0.9, sunI: 1.2, sun: '#9fd8ff', stars: 0 };
export const NH4Tease: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('nh4_tease');
  const hit = k.cue('tease_spark');
  const ay = f < hit ? lerp(9, 0.6, easeOut(f / hit)) : 0.6;
  const snap = f >= hit ? (f - hit) / 18 : 0;
  const c = camK(f, [{ f: 0, p: [3.5, 2.2, 7], l: [0, 1.2, 0], fov: 44 }, { f: k.dur, p: [1.8, 1.4, 4.4], l: [0, 0.8, 0], fov: 44 }]);
  return (
    <Stage>
      <Lights look={SEA} center={[0, 0, 0]} size={20} frame={f} />
      <Cam pos={[c.pos[0] + kick(f, hit, 8) * 0.15, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <SeaFloor f={f} snap={snap} anchorY={ay} />
    </Stage>
  );
};
// TITLE — the dark planet, arcs gone, a few red dots
export const NTitle: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam pos={[0, -4, 26]} look={[0, -8, 0]} fov={40} />
      <StarField />
      <Globe rot={lonRot(60) + f * 0.003} pos={[0, -19, 0]} sun={[-1, 0.2, 0.2]} night={0.3} red={0.3}>
        <NetArcs r={10} f={f} on={0} />
      </Globe>
    </Stage>
  );
};

// ------------------------------------------------------------------ chapter interludes: time-lapse aerials
type ICfg = { a: any; b: any; night: [number, number]; lamps: number; ang: number };
const ICFG: Record<string, ICfg> = {
  I1: { a: LOOKS.day, b: LOOKS.day, night: [0, 0], lamps: 0, ang: 0.3 },
  I2: { a: LOOKS.day, b: LOOKS.day, night: [0, 0], lamps: 0, ang: 1.4 },
  I3: { a: LOOKS.day, b: LOOKS.golden, night: [0, 0.1], lamps: 0, ang: 2.5 },
  I4: { a: LOOKS.golden, b: LOOKS.night, night: [0.2, 1], lamps: 0.8, ang: 3.6 },
  I5: { a: LOOKS.night, b: LOOKS.morning, night: [1, 0], lamps: 0, ang: 4.7 },
  I6: { a: LOOKS.day, b: LOOKS.dusk, night: [0, 0.8], lamps: 0.7, ang: 5.6 },
};
export const makeNI = (id: string): React.FC => () => {
  const f = useCurrentFrame();
  const k = shotClock(id);
  const cfg = ICFG[id];
  const p = f / k.dur;
  const t2 = smoother(Math.min(1, f / (k.dur * 0.92)));
  const look = mixLook(cfg.a, cfg.b, t2);
  const ang = cfg.ang + p * 0.5;
  const R = lerp(200, 160, smoother(p)), Y = lerp(160, 120, smoother(p));
  return (
    <Stage>
      <Lights look={look} center={[0, 0, 0]} size={140} frame={f * 6} />
      <Cam pos={[Math.sin(ang) * R, Y, Math.cos(ang) * R]} look={[0, 0, 0]} fov={50} />
      <City seed={7} near={3} far={8} night={lerp(cfg.night[0], cfg.night[1], t2)} lamps={cfg.lamps * ramp(f, 0, 20)} f={f * 4} />
      <Traffic f={f * 3} n={40} seed={13} span={300} lights={cfg.night[1] > 0.5 ? 1 : 0} />
    </Stage>
  );
};

// ------------------------------------------------------------------ FIRST SECOND
// «Видео замирает, крутится кружок загрузки.» — over the shoulder, the video freezes
export const N1Freeze: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n1_freeze');
  const fr = k.cue('freeze_tape');
  const tex = useScreen(360, 740, 'n1f' + Math.floor(f / 2) + (f >= fr), phoneVideo(f, fr));
  const c = camK(f, [{ f: 0, p: [0.05, 1.86, 0.22], l: [0.18, 1.27, -0.36], fov: 36 }, { f: k.dur, p: [0.08, 1.76, 0.08], l: [0.18, 1.27, -0.36], fov: 34 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <PhoneSet f={f} tex={tex} />
    </Stage>
  );
};
// «Сообщение другу зависает на «отправке».»
export const N1Send: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n1_send');
  const st = k.cue('send_tick');
  const tex = useScreen(360, 740, 'n1s' + Math.floor(f / 3) + (f >= st), phoneChat(f, st));
  const c = camK(f, [{ f: 0, p: [0.32, 1.84, 0.18], l: [0.18, 1.27, -0.36], fov: 34 }, { f: k.dur, p: [0.26, 1.76, 0.06], l: [0.18, 1.27, -0.36], fov: 32 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <PhoneSet f={f} tex={tex} />
    </Stage>
  );
};
// «А в онлайн-игре появляется надпись: «Соединение потеряно».»
const gameScreen = (f: number, lost: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  const t = Math.min(f, lost);
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#2b1055'); sky.addColorStop(1, '#ff7e5f'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1b0f2e'; for (let i = 0; i < 6; i++) g.fillRect(i * 180 - 20, h * 0.45 - (i % 3) * 40, 120, h);
  g.fillStyle = '#3a2a55'; g.fillRect(0, h * 0.78, w, h * 0.22);
  const hx = w * 0.3 + Math.sin(t * 0.2) * 40;
  g.fillStyle = '#21f0ff'; g.fillRect(hx, h * 0.6, 50, 90); g.beginPath(); g.arc(hx + 25, h * 0.57, 26, 0, 7); g.fill();
  g.fillStyle = '#ff2bd6'; g.fillRect(w * 0.68, h * 0.6, 50, 90); g.beginPath(); g.arc(w * 0.68 + 25, h * 0.57, 26, 0, 7); g.fill();
  if (f < lost) { g.strokeStyle = '#ffe14a'; g.lineWidth = 6; g.beginPath(); g.moveTo(hx + 60, h * 0.64); g.lineTo(hx + 60 + ((t * 25) % (w * 0.35)), h * 0.64); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(20, 20, 300, 40); g.fillStyle = '#3cff6e'; g.fillRect(24, 24, 220, 32);
  g.fillStyle = '#fff'; g.font = `800 28px ${FONT}`; g.textAlign = 'right'; g.fillText(f < lost ? 'PING 24 мс' : 'PING ---', w - 24, 50);
  if (f >= lost) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, w, h);
    const s = Math.min(1, (f - lost) / 6);
    g.save(); g.translate(w / 2, h / 2); g.scale(s, s);
    g.fillStyle = 'rgba(20,10,30,0.95)'; (g as any).roundRect(-330, -130, 660, 260, 26); g.fill(); g.strokeStyle = RED; g.lineWidth = 6; (g as any).roundRect(-330, -130, 660, 260, 26); g.stroke();
    g.fillStyle = RED; g.font = `900 48px ${FONT}`; g.textAlign = 'center'; g.fillText('СОЕДИНЕНИЕ', 0, -40); g.fillText('ПОТЕРЯНО', 0, 16);
    g.fillStyle = '#ccd'; g.font = `700 26px ${FONT}`; g.fillText('Переподключение…', 30, 84); spinner(g, -150, 75, 16, f, '#ccd');
    g.restore();
  }
};
export const N1Game: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n1_game');
  const lost = k.cue('game_err');
  const tex = useScreen(1024, 576, 'n1g' + Math.floor(f / 2) + (f >= lost), gameScreen(f, lost));
  const c = camK(f, [{ f: 0, p: [0.9, 1.6, 1.6], l: [0, 1.2, -0.6], fov: 44 }, { f: lost, p: [0.45, 1.5, 0.9], l: [0, 1.2, -0.6], fov: 42 }, { f: k.dur, p: [0.3, 1.4, 0.55], l: [0, 1.22, -0.6], fov: 40 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, sunI: 0.6, hemiI: 0.5 }} center={[0, 1, 0]} size={6} noSky noFog />
      <Cam {...c} />
      <group position={[0, 0, -1]}><Room w={5} d={5} h={2.8} wall="#241b3d" floor="dark" light={0.25} /></group>
      <mesh geometry={rbox(1.8, 0.05, 0.8, 0.02)} position={[0, 0.75, -0.75]} material={mat('#1b1b22', { r: 0.4 })} castShadow receiveShadow />
      <Screen tex={tex} w={1.1} h={0.62} pos={[0, 1.2, -0.95]} frame="#111" depth={0.04} />
      <pointLight position={[0, 1.2, -0.5]} intensity={f >= lost ? 3 : 4} distance={2.5} color={f >= lost ? '#ff6a6a' : '#9f7bff'} />
      <mesh position={[-1.2, 1.4, -2.9]} material={basic(MAG, { t: 0.9 })}><boxGeometry args={[1.4, 0.05, 0.02]} /></mesh>
      <mesh position={[1.2, 1.6, -2.9]} material={basic(CYAN, { t: 0.9 })}><boxGeometry args={[1.4, 0.05, 0.02]} /></mesh>
      <Person look={HERO()} pos={[0, 0, 0.2]} rotY={Math.PI} onHead={<Headset />} pose={merge(idle(f, 4), f >= lost ? EXPR.shock : EXPR.grin, { armL: [1.2, 0.1, 1.1], armR: [1.2, 0.1, 1.1], head: [0.1, 0, 0], body: [f >= lost ? -0.12 : 0.05, 0, 0] })} />
    </Stage>
  );
};
// «Больше пяти миллиардов человек одновременно смотрят на экран и ждут.»
export const N1Billions: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n1_billions');
  const tex = useScreen(180, 370, 'spinph' + (Math.floor(f / 2) % 10), (g, w, h) => { g.fillStyle = '#f2f4f8'; g.fillRect(0, 0, w, h); spinner(g, w / 2, h / 2, 26, Math.floor(f / 2) * 2); });
  const near = useMemo(() => { const r = rng(71); return Array.from({ length: 14 }).map((_, i) => ({ look: randomLook(700 + i), x: 7.4 + (i % 7) * 1.25 + r() * 0.4, z: -2 - Math.floor(i / 7) * 2.2 + r(), rot: (r() - 0.5) * 1.2 })); }, []);
  const far = useMemo(() => { const r = rng(72); const a: Agent[] = []; for (let i = 0; i < 260; i++) a.push({ x: 7.2 + r() * 5, z: -6 - r() * 110, rot: r() * 6, seed: i }); for (let i = 0; i < 160; i++) a.push({ x: -7.2 - r() * 5, z: -r() * 110, rot: r() * 6, seed: 400 + i }); return a; }, []);
  const c = camK(f, [{ f: 0, p: [10.8, 1.7, 4.2], l: [10, 1.3, -3], fov: 44 }, { f: k.dur, p: [12, 9, 10], l: [8, 0.5, -16], fov: 48 }]);
  return (
    <Stage>
      <Lights look={LOOKS.chaos} center={[8, 0, -8]} size={40} frame={f} />
      <Cam {...c} />
      <City seed={7} near={2} far={6} />
      <Crowd agents={far} f={0} />
      {near.map((p, i) => (
        <group key={i}>
          <Person look={p.look} pos={[p.x, 0.16, p.z]} rotY={p.rot} pose={merge(idle(f, i), EXPR.neutral, { head: [0.45, 0, 0], armL: [1.5, -0.2, 1.4], armR: [0.1, 0.1, 0.2] })} propL={<PhoneProp tex={tex} />} />
          <SpinnerSprite pos={[p.x, 2.3, p.z]} s={0.42 * pop(f, 8 + i * 3, 8)} f={f / 2} />
        </group>
      ))}
    </Stage>
  );
};

// ------------------------------------------------------------------ FIRST MINUTE
// «Весь мир перезагружает роутеры. Не помогает.»
export const N2Router: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n2_router');
  const click = k.cue('router_click'), fail = k.cue('router_fail');
  const state = f < click ? 'fail' : f < click + 8 ? 'off' : f < fail ? 'boot' : 'fail';
  const plugOut = f >= click - 4 && f < click + 10 ? 0.12 : 0;
  const c = camK(f, [{ f: 0, p: [0.7, 1.25, 0.9], l: [0, 0.95, 0], fov: 38 }, { f: k.dur, p: [-0.45, 1.15, 0.75], l: [0, 0.95, 0], fov: 34 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={4} noSky />
      <Cam {...c} />
      <group position={[0, 0, 0.8]}><Room w={4} d={4} h={2.8} wall="#e6dccb" floor="wood" light={0.6} /></group>
      <mesh geometry={rbox(1.2, 0.04, 0.45, 0.02)} position={[0, 0.88, -0.05]} material={mat('#8a6243', { r: 0.6 })} castShadow receiveShadow />
      <mesh position={[0, 0.45, -0.05]} material={mat('#7a5537', { r: 0.6 })}><boxGeometry args={[1.1, 0.85, 0.4]} /></mesh>
      {state === 'off' ? <Router f={f} state="ok" pos={[0, 0.9, 0]} s={1.3} /> : <Router f={f} state={state as any} pos={[0, 0.9, 0]} s={1.3} />}
      {state === 'off' && <mesh position={[0, 0.98, 0.16]} material={mat('#f2f3f5', { r: 0.35 })}><boxGeometry args={[0.44, 0.03, 0.02]} /></mesh>}
      <mesh position={[0.3 + plugOut, 0.92, -0.18]} rotation={[0, 0, Math.PI / 2]} material={mat('#222', { r: 0.5 })}><cylinderGeometry args={[0.012, 0.012, 0.5, 8]} /></mesh>
      <mesh position={[0.56 + plugOut, 0.92, -0.18]} material={mat('#111', { r: 0.4 })}><boxGeometry args={[0.06, 0.04, 0.04]} /></mesh>
      {f >= fail && <QMark pos={[0, 1.35, 0]} s={0.18 * pop(f, fail, 8)} color={RED} />}
    </Stage>
  );
};
/** a corridor with a door; `open` 0..1 */
const Corridor: React.FC<{ open: number }> = ({ open }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#8e7d6b', { r: 0.8 })}><planeGeometry args={[4, 14]} /></mesh>
    <mesh position={[0, 1.4, -1.0]} receiveShadow material={mat('#d9cdb5', { r: 0.9 })}><boxGeometry args={[4, 2.8, 0.1]} /></mesh>
    <mesh position={[-2, 1.4, 4]} rotation={[0, Math.PI / 2, 0]} material={mat('#cbbd9f', { r: 0.9 })}><planeGeometry args={[14, 2.8]} /></mesh>
    <mesh position={[0, 2.8, 4]} rotation={[Math.PI / 2, 0, 0]} material={mat('#efe9dd', { r: 0.9 })}><planeGeometry args={[4, 14]} /></mesh>
    <mesh position={[0, 1.05, -0.94]} material={mat('#4a3324', { r: 0.6 })}><boxGeometry args={[1.05, 2.15, 0.04]} /></mesh>
    <group position={[-0.47, 1.0, -0.9]} rotation={[0, -open * 1.6, 0]}>
      <mesh position={[0.47, 0, 0]} material={mat('#7b4a2c', { r: 0.6 })} castShadow><boxGeometry args={[0.94, 2.0, 0.05]} /></mesh>
      <mesh position={[0.85, 0, 0.05]} material={mat('#d4af37', { r: 0.3, m: 0.9 })}><sphereGeometry args={[0.04, 12, 8]} /></mesh>
      <mesh position={[0.47, 0.62, 0.03]} material={mat('#d4af37', { r: 0.3, m: 0.9 })}><boxGeometry args={[0.16, 0.08, 0.01]} /></mesh>
    </group>
    {open > 0 && <pointLight position={[0, 1.4, -2]} intensity={4 * open} distance={4} color="#ffd9a8" />}
    <pointLight position={[0, 2.5, 1.5]} intensity={8} distance={7} color="#fff1dc" />
  </group>
);
// «Ты идёшь к соседу и стучишь в дверь.»
export const N2Door: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n2_door');
  const kn = k.cue('knock');
  const wp = walkPath(f, [0.6, 3.5], [0.15, 0.05], 1.6, 0);
  const knockArm = f >= kn - 6 && f < kn + 14 ? 1.75 + Math.sin((f - kn) * 1.4) * 0.25 : 0.1;
  const c = camK(f, [{ f: 0, p: [1.6, 1.6, 2.4], l: [0.1, 1.2, -0.6], fov: 46 }, { f: k.dur, p: [1.3, 1.55, 1.3], l: [0, 1.25, -0.8], fov: 44 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <Corridor open={0} />
      <Person look={HERO()} pos={wp.pos} rotY={Math.PI} pose={merge(wp.pose, EXPR.neutral, { armR: [knockArm, 0.15, knockArm > 1 ? 1.5 : 0.15] })} />
    </Stage>
  );
};
// «Он открывает. В руке у него телефон. И тоже кружок загрузки.»
export const N2Neighbor: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n2_neighbor');
  const sp = k.cue('neighbor_spin');
  const tex = useScreen(180, 370, 'spinph' + (Math.floor(f / 2) % 10), (g, w, h) => { g.fillStyle = '#f2f4f8'; g.fillRect(0, 0, w, h); spinner(g, w / 2, h / 2, 26, Math.floor(f / 2) * 2); });
  const open = ramp(f, 0, 16);
  const c = camK(f, [{ f: 0, p: [0.55, 1.75, 1.7], l: [-0.05, 1.45, -1.4], fov: 42 }, { f: sp - 4, p: [0.4, 1.7, 1.2], l: [-0.05, 1.5, -1.4], fov: 40 }, { f: k.dur, p: [0.25, 1.62, 0.55], l: [-0.08, 1.45, -1.4], fov: 34 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <Corridor open={open} />
      <Person look={HERO()} pos={[0.2, 0, 0.15]} rotY={Math.PI} pose={merge(idle(f, 2), EXPR.neutral)} />
      <Person look={NEIGHBOR()} pos={[-0.05, 0, -1.45]} rotY={0} pose={merge(idle(f, 5), f >= sp ? EXPR.sad : EXPR.neutral, { armL: [1.5, -0.2, 1.4], head: [0.15, 0, 0] })} propL={<PhoneProp tex={tex} tilt={-0.9} />} />
      <SpinnerSprite pos={[-0.05, 2.25, -1.45]} s={0.4 * pop(f, sp, 8)} f={f / 2} />
    </Stage>
  );
};

// ------------------------------------------------------------------ FIRST HOUR
const terminalScreen = (f: number, err: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#0d1a24'; g.fillRect(0, 0, w, h);
  if (f < err) { g.fillStyle = '#e7f2ff'; g.font = `800 40px ${FONT}`; g.textAlign = 'center'; g.fillText('1 249 ₽', w / 2, 90); g.font = `600 26px ${FONT}`; g.fillText('Приложите карту', w / 2, 150); spinner(g, w / 2, 230, 26, f, '#7fc8ff'); }
  else {
    g.fillStyle = RED; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.textAlign = 'center';
    g.lineWidth = 12; g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(w / 2 - 34, 46); g.lineTo(w / 2 + 34, 114); g.moveTo(w / 2 + 34, 46); g.lineTo(w / 2 - 34, 114); g.stroke();
    g.font = `900 40px ${FONT}`; g.fillText('НЕТ СВЯЗИ', w / 2, 190); g.fillText('С БАНКОМ', w / 2, 238);
  }
};
// «Терминалы в магазинах пишут «Нет связи с банком».»
export const N3Terminal: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n3_terminal');
  const err = k.cue('term_err');
  const tex = useScreen(384, 288, 'term' + Math.floor(f / 2) + (f >= err), terminalScreen(f, err));
  const cardZ = lerp(0.5, 0.18, smoother(ramp(f, 0, 24)));
  const c = camK(f, [{ f: 0, p: [0.25, 1.4, 0.6], l: [0, 1.0, 0], fov: 38 }, { f: k.dur, p: [0.12, 1.25, 0.42], l: [0, 1.0, 0], fov: 34 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={4} noSky />
      <Cam pos={[c.pos[0] + kick(f, err, 6) * 0.01, c.pos[1], c.pos[2]]} look={c.look} fov={c.fov} />
      <group position={[0, 0, 1]}><Room w={8} d={8} h={3.4} wall="#eef1f4" floor="tile" ceilingLights={2} light={1} /></group>
      <Shelf pos={[-1.5, 0, -2.2]} len={3} seed={4} />
      <Shelf pos={[1.6, 0, -2.2]} len={3} seed={5} />
      <mesh geometry={rbox(1.6, 0.85, 0.8, 0.03)} position={[0, 0.43, -0.05]} material={mat('#dfe6e9', { r: 0.4 })} castShadow receiveShadow />
      <group position={[0, 0.88, 0]} rotation={[-0.5, 0, 0]}>
        <mesh geometry={rbox(0.2, 0.32, 0.06, 0.02)} position={[0, 0.16, 0]} material={mat('#2d3436', { r: 0.4 })} castShadow />
        <Screen tex={tex} w={0.16} h={0.12} pos={[0, 0.23, 0.031]} frame="#111" depth={0.005} />
        {Array.from({ length: 9 }).map((_, i) => <mesh key={i} position={[-0.05 + (i % 3) * 0.05, 0.12 - Math.floor(i / 3) * 0.035, 0.032]} material={mat('#b2bec3', { r: 0.5 })}><boxGeometry args={[0.036, 0.024, 0.006]} /></mesh>)}
      </group>
      <mesh position={[0.02, 1.13, cardZ]} rotation={[-0.5, 0, 0.15]} material={mat('#2e86de', { r: 0.3, m: 0.4 })}><boxGeometry args={[0.085, 0.054, 0.002]} /></mesh>
      {f >= err && <Glow pos={[0, 1.12, 0.06]} s={0.5} color="#ff3b3b" o={0.7} />}
    </Stage>
  );
};
// «Люди ищут по карманам наличные.»
export const N3Cash: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n3_cash');
  const ppl = useMemo(() => Array.from({ length: 4 }).map((_, i) => randomLook(630 + i)), []);
  const coin = k.cue('cash_coins');
  const c = camK(f, [{ f: 0, p: [2.6, 1.7, 2.6], l: [0, 1.1, -1.2], fov: 46 }, { f: k.dur, p: [2.1, 1.6, 1.9], l: [0, 1.15, -1.4], fov: 44 }]);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, -1]} size={8} noSky />
      <Cam {...c} />
      <group position={[0, 0, -1]}><Room w={10} d={10} h={3.4} wall="#eef1f4" floor="tile" ceilingLights={3} light={1.1} /></group>
      <Shelf pos={[-2.4, 0, -5]} len={4} seed={8} />
      <mesh geometry={rbox(0.9, 0.9, 2.6, 0.04)} position={[-1.1, 0.45, -1.2]} material={mat('#dfe6e9', { r: 0.4 })} castShadow receiveShadow />
      {ppl.map((p, i) => {
        const dig = Math.sin(f * 0.35 + i * 1.7);
        const pose = i === 0 && f >= coin ? { armR: [1.4, 0.1, 1.2], armL: [0.1, 0.1, 0.2] } : { armL: [-0.15 + dig * 0.1, 0.35, 1.0 + dig * 0.2], armR: [-0.15 - dig * 0.1, 0.35, 1.0 - dig * 0.2] };
        return <Person key={i} look={p} pos={[0, 0, -0.2 - i * 0.95]} rotY={Math.PI + 0.25 * (i % 2 ? 1 : -1)} pose={merge(idle(f, i + 3), i === 0 && f >= coin ? EXPR.happy : EXPR.confused, pose as any, { head: [0.35, 0, 0] })}
          propR={i === 0 && f >= coin ? <group>{[0, 1, 2].map((j) => <mesh key={j} position={[0, -0.02 + j * 0.012, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={mat('#d4af37', { r: 0.25, m: 0.9 })}><cylinderGeometry args={[0.022, 0.022, 0.006, 16]} /></mesh>)}</group> : null} />;
      })}
      {f >= coin && <Glow pos={[0.2, 1.4, -0.1]} s={0.6} color="#ffd23f" o={0.6} />}
    </Stage>
  );
};
// «Курьер стоит посреди улицы с пакетом еды и не знает, куда его нести.»
const COURIER = () => randomLook(640, { shirt: '#ffb020', hairStyle: 'cap', hat: '#ffb020', pants: '#2d3436' });
export const N3Courier: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n3_courier');
  const q = k.w(109) - 2;
  const tex = useScreen(180, 370, 'spinph' + (Math.floor(f / 2) % 10), (g, w, h) => { g.fillStyle = '#f2f4f8'; g.fillRect(0, 0, w, h); spinner(g, w / 2, h / 2, 26, Math.floor(f / 2) * 2); });
  const look = Math.sin(f * 0.08) * 0.6;
  const c = camK(f, [{ f: 0, p: [8.6, 1.5, 4.2], l: [9.4, 1.3, 0], fov: 44 }, { f: k.dur, p: [8.2, 1.65, 2.6], l: [9.4, 1.45, 0], fov: 40 }]);
  return (
    <Stage>
      <Lights look={LOOKS.day} center={[9, 0, 0]} size={30} frame={f} />
      <Cam {...c} />
      <City seed={7} near={2} far={6} />
      <Traffic f={f} n={18} seed={5} axis="z" />
      <Person look={COURIER()} pos={[9.4, 0.16, 0]} rotY={0.2} pose={merge(idle(f, 7), f >= q ? EXPR.confused : EXPR.neutral, { head: [0.05, look, 0], armL: [1.4, -0.2, 1.3], armR: [0.2, 0.25, 0.3] })}
        propL={<PhoneProp tex={tex} />} propR={<group position={[0, -0.12, 0]}><mesh geometry={rbox(0.24, 0.3, 0.14, 0.03)} material={mat('#f5f0e6', { r: 0.8 })} castShadow /><mesh position={[0, 0.17, 0]} material={mat('#c9b48a', { r: 0.8 })}><torusGeometry args={[0.06, 0.01, 6, 16, Math.PI]} /></mesh></group>} />
      <mesh geometry={rbox(0.5, 0.5, 0.36, 0.04)} position={[9.4, 1.35, -0.32]} rotation={[0, 0.2, 0]} material={mat('#ffb020', { r: 0.6 })} castShadow />
      {f >= q && <QMark pos={[9.4, 2.35, 0]} s={0.38 * pop(f, q, 8)} />}
    </Stage>
  );
};
// «Кстати, GPS продолжит работать: спутникам интернет не нужен.»
export const N3GPS: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n3_gps');
  const ok = k.cue('gps_shimmer');
  const a = f * 0.004;
  const sat = [Math.sin(a) * 4 + 3, 14, Math.cos(a) * 3 + 6];
  const c = camK(f, [{ f: 0, p: [10, 18, 22], l: [3, 9, 4], fov: 44 }, { f: k.dur, p: [14, 15, 18], l: [3, 9, 5], fov: 46 }]);
  return (
    <Stage>
      <Lights look={LOOKS.space} shadow={false} noSky noFog />
      <Cam {...c} />
      <StarField />
      <SunGlow pos={[400, 300, -400]} s={250} />
      <Globe rot={lonRot(20) + f * 0.002} sun={[0.8, 0.6, 0.4]} night={0.6} />
      <Satellite pos={sat} rot={[0.4, f * 0.01, 0.2]} s={0.9} />
      <Beam from={sat} to={[0, 0, 0]} len={Math.hypot(sat[0], sat[1], sat[2]) - 10} col={f >= ok ? '#3cff6e' : CYAN} />
      <Waves pos={sat} f={f} s={2.4} col={f >= ok ? '#3cff6e' : CYAN} />
    </Stage>
  );
};
// «Но карта не загрузится, и ты станешь синей точкой на сером фоне.»
const mapScreen = (f: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  statusBar(g, w, false, true);
  g.fillStyle = '#d9dbe0'; g.fillRect(0, 44, w, h - 44);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#cfd2d8' : '#e2e4e8'; g.fillRect(x * 90, 44 + y * 90, 90, 90); }
  g.fillStyle = 'rgba(60,108,240,0.18)'; const pr = 40 + ((f * 2) % 60); g.beginPath(); g.arc(w / 2, h / 2, pr, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, 20, 0, 7); g.fill(); g.fillStyle = '#3c6cf0'; g.beginPath(); g.arc(w / 2, h / 2, 14, 0, 7); g.fill();
  g.fillStyle = 'rgba(20,20,30,0.85)'; (g as any).roundRect(30, h - 150, w - 60, 90, 20); g.fill();
  g.fillStyle = '#fff'; g.font = `800 26px ${FONT}`; g.textAlign = 'center'; g.fillText('Карта недоступна', w / 2, h - 100);
  g.fillStyle = '#aab'; g.font = `600 20px ${FONT}`; g.fillText('Нет подключения к интернету', w / 2, h - 72);
};
export const N3Map: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n3_map');
  const tex = useScreen(360, 740, 'map' + Math.floor(f / 2), mapScreen(f));
  const z = k.w(128) - 4;
  const c = camK(f, [{ f: 0, p: [0.05, 1.86, 0.22], l: [0.18, 1.27, -0.36], fov: 38 }, { f: z, p: [0.08, 1.76, 0.06], l: [0.18, 1.27, -0.36], fov: 34 }, { f: k.dur, p: [0.12, 1.62, -0.1], l: [0.18, 1.27, -0.36], fov: 30 }]);
  return (
    <Stage>
      <Lights look={LOOKS.day} center={[0, 1, 0]} size={8} frame={f} />
      <Cam {...c} />
      <PhoneSet f={f} tex={tex} outdoor />
    </Stage>
  );
};

// ------------------------------------------------------------------ FIRST DAY
const newsScreen = (f: number, on: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  if (f < on) { for (let i = 0; i < 1400; i++) { const v = Math.floor(hash(i * 7.3 + f * 1.7) * 255); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect((i * 37) % w, Math.floor((i * 37) / w) * 8 % h, 8, 8); } return; }
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0f2a5c'); bg.addColorStop(1, '#173f86'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8c39e'; g.beginPath(); g.arc(w * 0.3, h * 0.42, h * 0.14, 0, 7); g.fill(); g.fillStyle = '#2d3436'; g.fillRect(w * 0.18, h * 0.55, w * 0.24, h * 0.3);
  g.fillStyle = '#fff'; g.font = `900 ${Math.round(h * 0.08)}px ${FONT}`; g.textAlign = 'left'; g.fillText('НОВОСТИ', w * 0.52, h * 0.32);
  g.fillStyle = RED; g.fillRect(0, h * 0.8, w, h * 0.12); g.fillStyle = '#fff'; g.font = `800 ${Math.round(h * 0.065)}px ${FONT}`;
  const msg = 'СРОЧНО: ИНТЕРНЕТ ПРОПАЛ ВО ВСЁМ МИРЕ · ОСТАВАЙТЕСЬ С НАМИ · ';
  g.fillText(msg + msg, w - ((f * 6) % (w * 2.2)), h * 0.885);
};
// «Самыми важными снова становятся радио и телевизор с антенной.»
export const N4Radio: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n4_radio');
  const tvOn = k.cue('tv_news');
  const tex = useScreen(512, 384, 'news' + Math.floor(f / 2) + (f >= tvOn), newsScreen(f, tvOn));
  const fam = useMemo(() => [HERO(), randomLook(901, { skin: '#f2c7a5', hair: '#7a3b22', hairStyle: 'bun', shirt: '#e86f8a', skirt: true }), randomLook(905, { hairStyle: 'short', shirt: '#5c80bc', glasses: true })], []);
  const c = camK(f, [{ f: 0, p: [0.2, 1.7, 3.4], l: [0, 1.0, -0.6], fov: 46 }, { f: k.dur, p: [-0.6, 1.5, 2.4], l: [0, 1.0, -0.8], fov: 44 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 1.2, hemiI: 0.6 }} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <group position={[0, 0, 1]}><Room w={6} d={7} h={2.9} wall="#e8d9c0" floor="wood" windows="left" light={0.6} /></group>
      <mesh geometry={rbox(1.2, 0.05, 0.7, 0.02)} position={[0, 0.72, -0.55]} material={mat('#7b5537', { r: 0.6 })} castShadow receiveShadow />
      {[-0.5, 0.5].map((x) => <mesh key={x} position={[x, 0.36, -0.55]} material={mat('#6a4a30', { r: 0.6 })}><boxGeometry args={[0.06, 0.72, 0.6]} /></mesh>)}
      <RadioSet pos={[0.25, 0.745, -0.6]} rotY={-0.2} glow={0.6 + 0.4 * Math.sin(f * 0.4)} />
      <OldTV tex={tex} pos={[-1.6, 0, -2.4]} rotY={0.5} />
      {fam.map((l, i) => <Person key={i} look={l} pos={[[-0.75, 0.75, 0][i], 0, [-0.2, -0.25, -1.35][i]]} rotY={[0.9, -0.9, 0][i]} pose={merge(idle(f, i + 8), i === 0 ? EXPR.shock : EXPR.confused, { head: [0.2, 0, 0], body: [0.15, 0, 0] })} />)}
      <Waves pos={[0.25, 1.05, -0.6]} f={f} s={0.25} col="#ffcf6a" n={3} />
    </Stage>
  );
};
// «Только там можно узнать новости.» — the TV close-up
export const N4News: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n4_news');
  const tex = useScreen(512, 384, 'news' + Math.floor(f / 2) + 'on', newsScreen(f + 60, 0));
  const c = camK(f, [{ f: 0, p: [-1.2, 0.75, -1.4], l: [-1.65, 0.38, -2.3], fov: 40 }, { f: k.dur, p: [-1.35, 0.6, -1.65], l: [-1.65, 0.38, -2.3], fov: 38 }]);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 1.0, hemiI: 0.5 }} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <group position={[0, 0, 1]}><Room w={6} d={7} h={2.9} wall="#e8d9c0" floor="wood" windows="left" light={0.6} /></group>
      <OldTV tex={tex} pos={[-1.6, 0, -2.4]} rotY={0.5} />
      <pointLight position={[-1.4, 0.5, -1.9]} intensity={2} distance={2} color="#7fa8ff" />
    </Stage>
  );
};
// «А на улицах вдруг становится многолюдно. Дома без интернета… скучно.»
export const N4Street: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('n4_street');
  const walkers = useMemo(() => { const r = rng(81); return Array.from({ length: 16 }).map((_, i) => ({ look: randomLook(800 + i, i % 5 === 0 ? { kid: true } : {}), x: 7.6 + r() * 4, z0: 8 - r() * 40, sp: (0.9 + r() * 0.6) * (r() < 0.5 ? 1 : -1), ph: r() * 6 })); }, []);
  const pairs = useMemo(() => [[-1, 0.6, randomLook(851), randomLook(852)], [-6, 0.4, randomLook(853), randomLook(854)]] as any[], []);
  const far = useMemo(() => { const r = rng(82); const a: Agent[] = []; for (let i = 0; i < 160; i++) a.push({ x: 7.4 + r() * 4.5, z: -14 - r() * 90, rot: r() * 6, seed: i }); return a; }, []);
  const c = camK(f, [{ f: 0, p: [7.4, 2.0, 7], l: [9.5, 1.2, -6], fov: 48 }, { f: k.dur, p: [7.3, 2.6, 4.5], l: [9.8, 1.0, -9], fov: 50 }]);
  return (
    <Stage>
      <Lights look={LOOKS.day} center={[9, 0, -6]} size={40} frame={f} />
      <Cam {...c} />
      <City seed={7} near={2} far={6} />
      <Crowd agents={far} f={f} />
      {walkers.map((p, i) => {
        const z0 = p.z0, z1 = p.z0 + p.sp * 12;
        const wp = walkPath(f, [p.x, z0], [p.x + (i % 2 ? 0.3 : -0.3), z1], Math.abs(p.sp), 0, p.ph);
        return <Person key={i} look={p.look} pos={[wp.pos[0], 0.16, wp.pos[2]]} rotY={wp.rotY} pose={merge(wp.pose, EXPR.happy)} />;
      })}
      {pairs.map(([z, x, a, b]: any, i: number) => (
        <group key={i}>
          <Person look={a} pos={[9 + x, 0.16, z]} rotY={Math.PI / 2} pose={merge(idle(f, 20 + i), EXPR.grin, { armR: [0.6 + Math.sin(f * 0.25) * 0.3, 0.3, 0.8] })} />
          <Person look={b} pos={[9 + x + 0.9, 0.16, z]} rotY={-Math.PI / 2} pose={merge(idle(f, 30 + i), EXPR.happy)} />
        </group>
      ))}
      <mesh position={[10.2, 0.16 + 0.12 + Math.abs(Math.sin(f * 0.18)) * 0.8, -3 + Math.sin(f * 0.09) * 0.6]} material={mat('#ff5a3c', { r: 0.4 })} castShadow><sphereGeometry args={[0.12, 16, 12]} /></mesh>
    </Stage>
  );
};

export { Label, CYAN, MAG, RED, wifiOff, statusBar, bubble, spinner, FONT, Phone, Cables, Waves, Anchor, SpinnerSprite, NoWifiSprite };
