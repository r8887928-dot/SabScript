import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame } from 'remotion';
import { Stage, Lights, Cam, LOOKS, mat, basic } from '../three/core';
import { City } from '../three/city';
import { Person, randomLook, idle, merge, EXPR } from '../three/person';
import { QMark, Room, rbox, Glow, useScreen, Screen, Card3D } from '../three/props';
import { shotClock } from '../lib/tl';
import { camK, ramp, lerp, rng, easeOut, kick, clamp, pop, wobble, backOut } from '../lib/anim';

// «Интернет всё ещё работает,» — a data centre aisle, everything blinking
export const D1Servers: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('d1_servers');
  const leds = useMemo(() => {
    const r = rng(501); const out: number[][] = [];
    for (let side = -1; side <= 1; side += 2) for (let rack = 0; rack < 9; rack++) for (let u = 0; u < 14; u++) for (let l = 0; l < 4; l++) out.push([side * 1.27, 0.35 + u * 0.14, -rack * 1.0 - 0.3 + l * 0.1, r() * 100, r()]);
    return out;
  }, []);
  const ledMesh = useMemo(() => { const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.025, 0.04), new THREE.MeshBasicMaterial({ toneMapped: false }), leds.length); return m; }, [leds]);
  const col = new THREE.Color(), M = new THREE.Matrix4();
  leds.forEach((l, i) => {
    const on = Math.floor((f + l[3]) / (3 + l[4] * 6)) % 2 === 0;
    col.set(l[4] < 0.7 ? (on ? '#2bff88' : '#0b3a20') : l[4] < 0.9 ? (on ? '#2ae8ff' : '#0b2a3a') : (on ? '#ffb020' : '#3a2a0b'));
    ledMesh.setColorAt(i, col); M.makeTranslation(l[0], l[1], l[2]); ledMesh.setMatrixAt(i, M);
  });
  ledMesh.instanceMatrix.needsUpdate = true; if (ledMesh.instanceColor) ledMesh.instanceColor.needsUpdate = true;
  const c = camK(f, [{ f: 0, p: [0.2, 1.4, 2.5], l: [0, 1.2, -8], fov: 50 }, { f: k.dur, p: [-0.1, 1.5, -0.5], l: [0, 1.25, -9], fov: 48, roll: 2 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.interior, sunI: 0.4, hemiSky: '#6aa8ff', hemiGround: '#0a1020', hemiI: 0.5, env: 0.2 }} center={[0, 1, -4]} size={8} noSky noFog />
      <Cam {...c} />
      <group position={[0, 0, -3.5]}><Room w={6} d={14} h={3} wall="#141c2b" floor="dark" ceilingLights={4} light={0.4} /></group>
      {[-1, 1].map((side) => Array.from({ length: 9 }).map((_, rack) => (
        <mesh key={side + '_' + rack} geometry={rbox(0.8, 2.2, 0.9, 0.02)} position={[side * 1.7, 1.1, -rack * 1.0 - 0.15]} material={mat('#1b222c', { r: 0.4, m: 0.5 })} castShadow />
      )))}
      <primitive object={ledMesh} />
      <pointLight position={[0, 2.5, -3]} intensity={10} distance={10} color="#4aa8ff" />
    </Stage>
  );
};

// «...но пользоваться им становится практически невозможно.» — phone upside down
export const D2Phone: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('d2_phone');
  const err = k.cue('phone_err');
  const look = useMemo(() => randomLook(520, { hairStyle: 'long', hair: '#b07a3a', shirt: '#ef476f' }), []);
  const tex = useScreen(360, 720, 's' + Math.floor(f / 2) + (f > err), (g, w, h) => {
    g.fillStyle = '#f2f4f8'; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h / 2 - 40); g.rotate(f * 0.25);
    for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(60,90,160,${0.15 + i * 0.085})`; g.beginPath(); g.arc(Math.cos(i * 0.63) * 50, Math.sin(i * 0.63) * 50, 9, 0, 7); g.fill(); }
    g.restore();
    g.fillStyle = '#333'; g.font = '700 30px Montserrat'; g.textAlign = 'center'; g.fillText('Загрузка…', w / 2, h / 2 + 60);
    if (f > err) { g.fillStyle = '#d63031'; g.fillRect(30, h - 220, w - 60, 120); g.fillStyle = '#fff'; g.font = '900 34px Montserrat'; g.fillText('ЧТО-ТО', w / 2, h - 170); g.fillText('ПОШЛО НЕ ТАК', w / 2, h - 125); }
  });
  const shake = f > err ? Math.sin(f * 1.6) * 0.25 : 0;
  const c = camK(f, [{ f: 0, p: [0.6, 1.6, 2.3], l: [0.05, 1.45, 0], fov: 42 }, { f: k.dur, p: [0.45, 1.62, 1.85], l: [0.05, 1.48, 0], fov: 40 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.chaos} center={[0, 1, 0]} size={6} frame={f} />
      <Cam {...c} />
      <group position={[-9, -0.16, -6]}><City seed={7} near={2} far={5} trash={0.6} /></group>
      <Person look={look} pos={[0, 0, 0]} rotY={0.15} pose={merge(idle(f, 2), f > err ? EXPR.dumb : EXPR.confused, { armL: [1.6, -0.2, 1.4], armR: [1.2 + shake * 0.3, 0.1, 1.2], head: [0.3, 0, 0.25] })}
        propL={<group rotation={[Math.PI / 2 + 0.3, Math.PI + shake, 0]} position={[0.05, 0.02, 0.05]}>
          <mesh geometry={rbox(0.09, 0.18, 0.012, 0.01)} material={mat('#111', { r: 0.3, m: 0.3 })} />
          <mesh position={[0, 0, 0.007]} material={useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])}><planeGeometry args={[0.08, 0.165]} /></mesh>
        </group>} />
      {f > err && <QMark pos={[0.45, 2.3, 0]} s={0.35 * pop(f, err, 8)} />}
    </Stage>
  );
};

const POSTS = [
  ['Петя', 'ааааааааааааа', '#ff7aa2'], ['Оля', 'кто я???', '#7d4fb3'], ['Саня', 'съел пульт. вкусно', '#2e86de'], ['Мама', 'как открыть дверь ОТ СЕБЯ', '#16a085'],
  ['Гена', 'сегодня понедельник или суп', '#e67e22'], ['Ира', 'ИНСТРУКЦИЯ: нажмите на кнопку чтобы нажать на кнопку', '#d63031'], ['Дима', 'вода мокрая?? срочно', '#2ecc71'], ['Лена', 'ббббб ввв гг', '#8e44ad'],
];
// «Люди публикуют бессмысленные сообщения,» — a nonsense feed
export const D3Feed: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('d3_feed');
  const scroll = f * 7.5;
  const tex = useScreen(720, 1440, 'feed' + Math.round(scroll), (g, w, h) => {
    g.fillStyle = '#eef1f6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 110); g.fillStyle = '#2e86de'; g.font = '900 52px Montserrat'; g.textAlign = 'left'; g.fillText('лента', 40, 74);
    for (let i = 0; i < 14; i++) {
      const p = POSTS[i % POSTS.length];
      const y = 140 + i * 300 - (scroll % (POSTS.length * 300));
      if (y < -300 || y > h) continue;
      g.fillStyle = '#ffffff'; (g as any).roundRect(24, y, w - 48, 270, 26); g.fill();
      g.fillStyle = p[2]; g.beginPath(); g.arc(84, y + 60, 34, 0, 7); g.fill();
      g.fillStyle = '#222'; g.font = '800 34px Montserrat'; g.fillText(p[0], 136, y + 72);
      g.font = '700 38px Montserrat'; g.fillStyle = '#333';
      const words = p[1].split(' '); let line = '', ly = y + 140;
      for (const wd of words) { if (g.measureText(line + wd).width > w - 110) { g.fillText(line, 50, ly); line = ''; ly += 46; } line += wd + ' '; }
      g.fillText(line, 50, ly);
      g.fillStyle = '#ef476f'; g.font = '800 30px Montserrat'; g.fillText('♥ ' + ((i * 7919 + Math.floor(f / 3) * 137) % 99999), 50, y + 248);
    }
  });
  const notif = (n: number) => pop(f, k.cue('notifs') + n * 9 - k.cue('notifs') + 6 + n * 9, 7);
  const c = camK(f, [{ f: 0, p: [0.25, 0.1, 1.7], l: [0, 0, 0], fov: 40 }, { f: k.dur, p: [-0.3, 0.05, 1.45], l: [0, 0.05, 0], fov: 38 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, hor: '#264a8f', top: '#0b1430' }} center={[0, 0, 0]} size={4} frame={f} noFog />
      <Cam {...c} />
      <group rotation={[0.08, -0.25 + Math.sin(f * 0.03) * 0.05, 0.05]}>
        <mesh geometry={rbox(0.78, 1.56, 0.08, 0.08)} material={mat('#1a1a1f', { r: 0.25, m: 0.6 })} position={[0, 0, -0.045]} castShadow />
        <mesh material={useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])}><planeGeometry args={[0.7, 1.4]} /></mesh>
        {[0, 1, 2].map((n) => {
          const s = notif(n);
          return s > 0.01 ? (
            <group key={n} position={[0.3 + n * 0.08, 0.55 - n * 0.32, 0.12 + n * 0.05]} scale={[s, s, s]}>
              <mesh material={basic('#ff3b3b')}><circleGeometry args={[0.1, 24]} /></mesh>
              <mesh position={[0, 0, 0.005]} material={basic('#ffffff', { map: undefined })}><ringGeometry args={[0.085, 0.1, 24]} /></mesh>
            </group>
          ) : null;
        })}
      </group>
    </Stage>
  );
};

// «не понимают инструкции» — an upside-down chair
export const D4Chair: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('d4_chair');
  const clunk = k.cue('chair_clunk');
  const look = useMemo(() => randomLook(540, { shirt: '#3f88c5', hairStyle: 'curly', hair: '#b07a3a' }), []);
  const sit = clamp((f - clunk + 4) / 6);
  const legs: number[][] = [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]];
  const c = camK(f, [{ f: 0, p: [2.0, 1.35, 3.4], l: [0.2, 0.95, 0], fov: 44 }, { f: k.dur, p: [1.6, 1.3, 2.9], l: [0.2, 1.0, 0], fov: 42 }], (t) => t);
  return (
    <Stage>
      <Lights look={LOOKS.interior} center={[0, 1, 0]} size={6} noSky />
      <Cam {...c} />
      <group position={[0, 0, -1]}><Room w={8} d={8} h={3} wall="#e9dcc4" floor="wood" windows="back" /></group>
      <group position={[0.2, 0, 0]}>
        <mesh geometry={rbox(0.55, 0.06, 0.5, 0.02)} position={[0, 0.03, 0]} material={mat('#c99a6b', { r: 0.6 })} castShadow />
        {legs.map(([x, z], i) => <mesh key={i} position={[x, 0.28, z]} material={mat('#8b5a3c', { r: 0.7 })} castShadow><cylinderGeometry args={[0.025, 0.025, 0.5, 8]} /></mesh>)}
        <mesh geometry={rbox(0.55, 0.4, 0.04, 0.02)} position={[0, -0.0, -0.27]} rotation={[0.2, 0, 0]} material={mat('#c99a6b', { r: 0.6 })} visible={false} />
      </group>
      <mesh position={[-0.9, 0.01, 0.6]} rotation={[-Math.PI / 2, 0, 0.4]} material={basic('#ffffff', { map: undefined })}><planeGeometry args={[0.42, 0.3]} /></mesh>
      {[[-0.4, 0.8], [0.9, 0.5], [-1.1, -0.2]].map(([x, z], i) => <mesh key={i} position={[x, 0.02, z]} rotation={[0, i, 0]} material={mat('#8b5a3c', { r: 0.7 })}><boxGeometry args={[0.04, 0.04, 0.3]} /></mesh>)}
      <Person look={look} pos={[0.2, lerp(0, 0.12, sit), lerp(0.6, 0.05, sit)]} rotY={0} pose={merge(idle(f, 3), sit > 0.5 ? EXPR.dumb : EXPR.confused, sit > 0.5 ? { legL: 1.5, legR: 1.5, kneeL: 1.5, kneeR: 1.5, y: -0.08, body: [wobble(f, clunk, 0.8, 0.15) * 0.15, 0, wobble(f, clunk, 0.6, 0.12) * 0.1] } : {}, { armL: [1.3, 0.1, 0.9], armR: [1.3, 0.1, 0.9] })}
        propL={<group position={[0.12, 0.02, 0.08]} rotation={[0.3, 0, Math.PI]}><mesh material={basic('#ffffff')}><planeGeometry args={[0.3, 0.22]} /></mesh></group>} />
    </Stage>
  );
};

const cardTex = (title: string, body: string, bg: string, accent: string) => {
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 820; const g = cv.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = bg; g.fillRect(0, 0, 640, 820);
  g.fillStyle = accent; g.fillRect(0, 0, 640, 150);
  g.fillStyle = '#fff'; g.font = '900 54px Montserrat'; g.textAlign = 'center'; g.fillText(title, 320, 95);
  g.fillStyle = '#222'; g.font = '800 58px Montserrat';
  body.split('\n').forEach((l, i) => g.fillText(l, 320, 300 + i * 80));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};
// «...и не могут отличить полезную информацию от случайного набора слов.»
export const D5Choice: React.FC = () => {
  const f = useCurrentFrame();
  const k = shotClock('d5_choice');
  const useful = useMemo(() => cardTex('ПОЛЕЗНО', 'Как оказать\nпервую\nпомощь\n✚', '#e9f8ef', '#2e9e5b'), []);
  const random = useMemo(() => cardTex('???', 'кабачок\nвторник\nракета\nсиний', '#f6ecff', '#8e44ad'), []);
  const look = useMemo(() => randomLook(560, { shirt: '#f3a712', hairStyle: 'short', hair: '#151515' }), []);
  const wUse = k.w(158), wRand = k.w(161), pick = k.w(163);
  const yaw = f < wUse ? 0 : f < wRand ? 0.55 : -0.55;
  const picked = f >= pick;
  const fall = picked ? easeOut((f - pick) / 18) : 0;
  const c = camK(f, [{ f: 0, p: [0, 1.65, 5.0], l: [0, 1.5, 0], fov: 46 }, { f: k.dur, p: [0.25, 1.65, 4.3], l: [0, 1.55, 0], fov: 44 }], (t) => t);
  return (
    <Stage>
      <Lights look={{ ...LOOKS.studio, hor: '#3a2f63', top: '#141a33' }} center={[0, 1, 0]} size={6} frame={f} />
      <Cam {...c} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat('#262b45', { r: 0.9 })}><circleGeometry args={[10, 48]} /></mesh>
      <Card3D tex={useful} w={0.75} h={0.96} pos={[-0.78, 1.95 - fall * 1.4, -0.3 - fall * 0.4]} rot={[fall * -1.2, 0.35, fall * 0.6]} s={backOut(f / 10)} color="#2e9e5b" />
      <Card3D tex={random} w={0.75} h={0.96} pos={[lerp(0.78, 0.3, picked ? easeOut((f - pick) / 8) : 0), lerp(1.95, 1.5, picked ? easeOut((f - pick) / 8) : 0) + Math.sin(f * 0.1) * 0.03, lerp(-0.3, 0.45, picked ? easeOut((f - pick) / 8) : 0)]} rot={[0, -0.35 + (picked ? 0.35 : 0), 0]} s={backOut((f - 4) / 10) * (picked ? 0.7 : 1)} color="#8e44ad" />
      {f >= wUse - 2 && f < wRand && <Glow pos={[-0.78, 1.95, -0.2]} s={2.0} color="#2bff88" o={0.5} />}
      {f >= wRand - 2 && !picked && <Glow pos={[0.78, 1.95, -0.2]} s={2.0} color="#c77dff" o={0.5} />}
      <Person look={look} pos={[0, 0, 0.3]} rotY={0} pose={merge(idle(f, 5), picked ? EXPR.grin : EXPR.confused, { head: [0, yaw, 0], armR: picked ? [1.6, 0.2, 0.6] : [0.1, 0.1, 0.2], armL: picked ? [1.5, 0.2, 0.7] : [0.1, 0.1, 0.2] })} />
      {picked && f > pick + 10 && <mesh position={[-0.78, 0.05, -0.4]} rotation={[-Math.PI / 2, 0, 0]} material={basic('#2bff88', { add: true, t: 0.25 })}><circleGeometry args={[0.8, 32]} /></mesh>}
    </Stage>
  );
};
export { ramp, kick, Screen, QMark, City };
