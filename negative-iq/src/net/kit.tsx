import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mat, basic, spr, radialTex, canvasTex } from '../three/core';
import { rbox, useScreen, Screen, Glow } from '../three/props';
import { rng, clamp, lerp, hash } from '../lib/anim';

// Props and screen painters for «Что, если на Земле пропадёт интернет?»
export const CYAN = '#21f0ff', MAG = '#ff2bd6', RED = '#ff3b3b';

// ------------------------------------------------------------------ geo helpers (match the Earth shader's equirect UVs)
export const latLon = (lat: number, lon: number, r: number) => {
  const phi = ((lon + 180) / 360) * Math.PI * 2, th = ((90 - lat) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.cos(phi) * Math.sin(th), r * Math.cos(th), r * Math.sin(phi) * Math.sin(th));
};
export const CITIES: Record<string, [number, number]> = {
  ny: [40.7, -74], la: [34, -118.2], sp: [-23.5, -46.6], london: [51.5, -0.1], moscow: [55.75, 37.6], cairo: [30, 31.2], lagos: [6.5, 3.4],
  mumbai: [19.1, 72.9], beijing: [39.9, 116.4], tokyo: [35.7, 139.7], sydney: [-33.9, 151.2], singapore: [1.35, 103.8], capetown: [-33.9, 18.4], lisbon: [38.7, -9.1],
  marseille: [43.3, 5.4], miami: [25.8, -80.2], honolulu: [21.3, -157.8], perth: [-31.9, 115.9], fortaleza: [-3.7, -38.5], dubai: [25.2, 55.3],
};
const ARCS = [['ny', 'london'], ['london', 'moscow'], ['moscow', 'beijing'], ['beijing', 'tokyo'], ['tokyo', 'la'], ['la', 'ny'], ['ny', 'sp'], ['sp', 'lagos'], ['lagos', 'london'],
  ['cairo', 'mumbai'], ['mumbai', 'singapore'], ['singapore', 'sydney'], ['sydney', 'la'], ['london', 'cairo'], ['moscow', 'mumbai'], ['tokyo', 'singapore'], ['capetown', 'lagos'], ['dubai', 'london']];
// undersea cable routes (coastal waypoints)
const CABLES: [number, number][][] = [
  [[40.5, -73.5], [45, -45], [50, -20], [50.5, -5]], [[25.5, -80], [32, -60], [38, -30], [38.5, -9.5]], [[34, -119], [30, -150], [32, 170], [35.3, 139.9]],
  [[-33.8, 151.5], [-20, 175], [10, -160], [21, -158], [33.8, -118.5]], [[1.2, 104], [5, 95], [8, 80], [18.8, 72.6]], [[18.8, 72.6], [14, 60], [12.5, 45], [20, 38], [29.9, 32.6]],
  [[31.3, 32.3], [33, 25], [37, 15], [43.2, 5.3]], [[-3.7, -38.4], [5, -30], [20, -22], [38.6, -9.4]], [[-33.9, 18.3], [-20, 8], [0, 0], [6.3, 3.4]], [[6.3, 3.4], [15, -18], [35, -12], [50, -6], [51, 1.4]],
  [[1.3, 104], [10, 112], [22, 116], [35, 140]], [[-31.9, 115.6], [-15, 105], [1.2, 104]],
];

function arcCurve(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const lift = r * (1.08 + a.distanceTo(b) / r * 0.22);
  mid.setLength(lift);
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}
function surfCurve(pts: [number, number][], r: number) {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = latLon(pts[i][0], pts[i][1], 1), b = latLon(pts[i + 1][0], pts[i + 1][1], 1);
    for (let k = 0; k < 16; k++) { const t = k / 16; const v = a.clone().lerp(b, t).normalize().multiplyScalar(r); out.push(v); }
  }
  const l = pts[pts.length - 1];
  out.push(latLon(l[0], l[1], r));
  return new THREE.CatmullRomCurve3(out);
}

/** glowing data arcs between cities; `on` 1→0 fades them, `cut` 0..1 snaps them one after another */
export const NetArcs: React.FC<{ r: number; f: number; on?: number; cut?: number }> = ({ r, f, on = 1, cut = 0 }) => {
  const arcs = useMemo(() => ARCS.map(([a, b]) => {
    const c = arcCurve(latLon(...CITIES[a], r * 1.005), latLon(...CITIES[b], r * 1.005), r);
    return { c, g: new THREE.TubeGeometry(c, 48, r * 0.006, 6, false), seed: hash(a.length * 13 + b.length * 7 + a.charCodeAt(0)) };
  }), [r]);
  const dots = useMemo(() => Object.values(CITIES).map(([la, lo]) => latLon(la, lo, r * 1.004)), [r]);
  return (
    <group>
      {arcs.map((a, i) => {
        const dead = cut * arcs.length > i + 0.5 ? 1 : 0;
        const o = on * (1 - dead) * (0.65 + 0.35 * Math.sin(f * 0.2 + i));
        if (o <= 0.01) return null;
        const pts = [0, 1, 2].map((k) => a.c.getPoint(((f * 0.012 + a.seed + k / 3) % 1)));
        return (
          <group key={i}>
            <mesh geometry={a.g} material={basic(i % 3 === 0 ? MAG : CYAN, { add: true, t: o })} />
            {pts.map((p, k) => <sprite key={k} position={p} scale={[r * 0.06, r * 0.06, 1]} material={spr('#ffffff', { map: radialTex('glow'), add: true, t: o })} />)}
          </group>
        );
      })}
      {dots.map((p, i) => <sprite key={i} position={p} scale={[r * 0.05, r * 0.05, 1]} material={spr(on > 0.5 ? '#bff8ff' : '#ff6060', { map: radialTex('glow'), add: true, t: 0.4 + 0.6 * Math.max(on, 0.4) })} />)}
    </group>
  );
};
/** undersea cables drawn on the ocean; `red` 0..1 turns them red one by one (with flicker) */
export const Cables: React.FC<{ r: number; f: number; grow?: number; red?: number }> = ({ r, f, grow = 1, red = 0 }) => {
  const cs = useMemo(() => CABLES.map((p) => { const c = surfCurve(p, r * 1.003); return { c, g: new THREE.TubeGeometry(c, 96, r * 0.0045, 5, false) }; }), [r]);
  return (
    <group>
      {cs.map((c, i) => {
        const shown = clamp(grow * cs.length - i);
        if (shown <= 0) return null;
        const isRed = red * cs.length > i + 0.3;
        const flick = isRed && hash(i * 9 + Math.floor(f / 2)) > 0.6 ? 0.25 : 1;
        const p = c.c.getPoint((f * 0.01 + i * 0.37) % 1);
        return (
          <group key={i}>
            <mesh geometry={c.g} material={basic(isRed ? RED : CYAN, { add: true, t: 0.95 * shown * flick })} />
            {!isRed && <sprite position={p} scale={[r * 0.05, r * 0.05, 1]} material={spr('#ffffff', { map: radialTex('glow'), add: true, t: 0.9 * shown })} />}
          </group>
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------------ screen painters (2D canvas)
export const FONT = 'Montserrat, sans-serif';
export function spinner(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, f: number, col = '#3c6cf0') {
  g.save(); g.translate(cx, cy); g.rotate(f * 0.22);
  for (let i = 0; i < 10; i++) { g.fillStyle = col; g.globalAlpha = 0.12 + i * 0.088; g.beginPath(); g.arc(Math.cos(i * 0.63) * R, Math.sin(i * 0.63) * R, R * 0.2, 0, 7); g.fill(); }
  g.restore(); g.globalAlpha = 1;
}
export function wifiOff(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, col = '#ff3b3b') {
  g.save(); g.translate(cx, cy); g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = s * 0.12;
  for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(0, s * 0.35, s * 0.3 * i, -Math.PI * 0.78, -Math.PI * 0.22); g.stroke(); }
  g.fillStyle = col; g.beginPath(); g.arc(0, s * 0.35, s * 0.09, 0, 7); g.fill();
  g.lineWidth = s * 0.1; g.beginPath(); g.moveTo(-s * 0.55, -s * 0.55); g.lineTo(s * 0.55, s * 0.5); g.stroke();
  g.restore();
}
export function statusBar(g: CanvasRenderingContext2D, w: number, dark = false, off = true) {
  g.fillStyle = dark ? '#0b0d14' : '#f4f6fb'; g.fillRect(0, 0, w, 44);
  g.fillStyle = dark ? '#fff' : '#111'; g.font = `700 24px ${FONT}`; g.textAlign = 'left'; g.fillText('12:04', 22, 31);
  g.textAlign = 'right'; g.fillStyle = off ? '#e23' : dark ? '#fff' : '#111'; g.fillText(off ? 'Нет сети' : '5G', w - 64, 31);
  if (off) wifiOff(g, w - 34, 20, 26); else { g.fillRect(w - 46, 14, 26, 16); }
}
export function bubble(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mine: boolean, text: string, sub?: string) {
  g.fillStyle = mine ? '#3c6cf0' : '#e7eaf2'; (g as any).roundRect(x, y, w, h, 22); g.fill();
  g.fillStyle = mine ? '#fff' : '#111'; g.font = `600 26px ${FONT}`; g.textAlign = 'left'; g.fillText(text, x + 20, y + 40);
  if (sub) { g.font = `600 18px ${FONT}`; g.fillStyle = mine ? '#cfe0ff' : '#667'; g.fillText(sub, x + 20, y + h - 14); }
}

/** a phone with a live screen; `inHand` aligns it for Person prop slots */
export const Phone: React.FC<{ tex: THREE.Texture; pos?: number[]; rot?: number[]; s?: number; color?: string }> = ({ tex, pos = [0, 0, 0], rot = [0, 0, 0], s = 1, color = '#15161c' }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  return (
    <group position={pos as any} rotation={rot as any} scale={[s, s, s]}>
      <mesh geometry={rbox(0.09, 0.185, 0.012, 0.012)} material={mat(color, { r: 0.3, m: 0.4 })} castShadow />
      <mesh position={[0, 0, 0.0065]} material={m}><planeGeometry args={[0.082, 0.172]} /></mesh>
    </group>
  );
};
export const PhoneProp: React.FC<{ tex: THREE.Texture; tilt?: number }> = ({ tex, tilt = 0.3 }) => (
  <group rotation={[Math.PI / 2 + tilt, Math.PI, 0]} position={[0.05, 0.02, 0.05]}><Phone tex={tex} /></group>
);

/** floating loading ring (sprite) */
export const SpinnerSprite: React.FC<{ pos: number[]; s?: number; f: number; col?: string }> = ({ pos, s = 0.4, f, col = '#ffffff' }) => {
  const tex = canvasTex('spin_' + col + (Math.floor(f) % 10), 256, 256, (g) => {
    g.fillStyle = 'rgba(10,14,30,0.75)'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
    g.save(); g.translate(128, 128); g.rotate((Math.floor(f) % 10) * 0.63);
    for (let i = 0; i < 10; i++) { g.fillStyle = col; g.globalAlpha = 0.12 + i * 0.088; g.beginPath(); g.arc(Math.cos(i * 0.63) * 70, Math.sin(i * 0.63) * 70, 15, 0, 7); g.fill(); }
    g.restore();
  });
  return <sprite position={pos as any} scale={[s, s, 1]} material={spr('#ffffff', { map: tex })} />;
};
/** floating crossed wi-fi badge */
export const NoWifiSprite: React.FC<{ pos: number[]; s?: number }> = ({ pos, s = 0.4 }) => {
  const tex = canvasTex('nowifi_badge', 256, 256, (g) => {
    g.fillStyle = 'rgba(10,14,30,0.82)'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
    g.strokeStyle = RED; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 116, 0, 7); g.stroke();
    wifiOff(g, 128, 118, 150, RED);
  });
  return <sprite position={pos as any} scale={[s, s, 1]} material={spr('#ffffff', { map: tex })} />;
};

// ------------------------------------------------------------------ props
export const Router: React.FC<{ f: number; state: 'ok' | 'boot' | 'fail'; pos?: number[]; s?: number }> = ({ f, state, pos = [0, 0, 0], s = 1 }) => {
  const body = mat('#f2f3f5', { r: 0.35 });
  const ledCol = (i: number) => {
    if (state === 'ok') return Math.floor(f / 3 + i) % 3 ? '#2bff88' : '#0d4a26';
    if (state === 'boot') return Math.floor(f / 4 + i * 2) % 2 ? '#ffb020' : '#3a2a0b';
    return i === 0 ? '#2bff88' : (Math.floor(f / 8) % 2 ? RED : '#4a0b0b');
  };
  return (
    <group position={pos as any} scale={[s, s, s]}>
      <mesh geometry={rbox(0.36, 0.06, 0.24, 0.025)} position={[0, 0.03, 0]} material={body} castShadow receiveShadow />
      {[-0.13, 0.13].map((x, i) => <mesh key={i} position={[x, 0.16, -0.1]} rotation={[0.12, 0, i ? -0.18 : 0.18]} material={body} castShadow><capsuleGeometry args={[0.012, 0.2, 4, 8]} /></mesh>)}
      {[0, 1, 2, 3].map((i) => {
        const c = ledCol(i);
        return <group key={i}><mesh position={[-0.1 + i * 0.065, 0.045, 0.121]} material={basic(c)}><boxGeometry args={[0.025, 0.012, 0.004]} /></mesh>
          {c !== '#0d4a26' && c !== '#3a2a0b' && c !== '#4a0b0b' && <sprite position={[-0.1 + i * 0.065, 0.05, 0.13]} scale={[0.07, 0.07, 1]} material={spr(c, { map: radialTex('glow'), add: true, t: 0.8 })} />}</group>;
      })}
    </group>
  );
};

export const Satellite: React.FC<{ pos?: number[]; rot?: number[]; s?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], s = 1 }) => {
  const panel = useMemo(() => canvasTex('solarpanel', 256, 128, (g, w, h) => {
    g.fillStyle = '#1b2c6b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7f9cff'; g.lineWidth = 2;
    for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }), []);
  const pm = useMemo(() => new THREE.MeshStandardMaterial({ map: panel, roughness: 0.3, metalness: 0.5 }), [panel]);
  return (
    <group position={pos as any} rotation={rot as any} scale={[s, s, s]}>
      <mesh geometry={rbox(1, 1.2, 1, 0.08)} material={mat('#d9b44a', { r: 0.25, m: 0.8 })} />
      {[-1, 1].map((sd) => <group key={sd}><mesh position={[sd * 0.9, 0, 0]} material={mat('#999', { r: 0.4, m: 0.7 })}><boxGeometry args={[0.8, 0.06, 0.06]} /></mesh>
        <mesh position={[sd * 2.3, 0, 0]} material={pm}><boxGeometry args={[2.2, 0.04, 1.0]} /></mesh></group>)}
      <mesh position={[0, -0.85, 0.2]} rotation={[0.5, 0, 0]} material={mat('#eeeeee', { r: 0.4, m: 0.3 })}><cylinderGeometry args={[0.55, 0.05, 0.35, 24, 1, true]} /></mesh>
    </group>
  );
};

export const Moon: React.FC<{ pos?: number[]; r?: number; o?: number }> = ({ pos = [0, 0, 0], r = 3, o = 1 }) => {
  const tex = useMemo(() => canvasTex('moonTex', 512, 256, (g, w, h) => {
    g.fillStyle = '#b9b7b0'; g.fillRect(0, 0, w, h); const rr = rng(77);
    for (let i = 0; i < 140; i++) { const x = rr() * w, y = rr() * h, s = 3 + rr() * 18; g.fillStyle = `rgba(80,78,72,${0.15 + rr() * 0.3})`; g.beginPath(); g.ellipse(x, y, s, s * 0.8, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(90,90,96,0.35)'; g.beginPath(); g.ellipse(rr() * w, h * (0.25 + rr() * 0.5), 30 + rr() * 50, 20 + rr() * 30, 0, 0, 7); g.fill(); }
  }), []);
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 1, transparent: true }), [tex]);
  m.opacity = o;
  return <mesh position={pos as any} material={m}><sphereGeometry args={[r, 48, 32]} /></mesh>;
};

/** old CRT TV with rabbit-ear antenna; screen texture passed in */
export const OldTV: React.FC<{ tex: THREE.Texture; pos?: number[]; rotY?: number }> = ({ tex, pos = [0, 0, 0], rotY = 0 }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    <mesh geometry={rbox(0.9, 0.7, 0.6, 0.08)} position={[0, 0.35, 0]} material={mat('#6b4a2f', { r: 0.6 })} castShadow />
    <Screen tex={tex} w={0.62} h={0.47} pos={[-0.08, 0.37, 0.305]} frame="#1b1b1b" depth={0.02} />
    {[0, 1].map((i) => <mesh key={i} position={[0.33, 0.48 - i * 0.14, 0.31]} material={mat('#222', { r: 0.4 })} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.03, 16]} /></mesh>)}
    {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.16, 0.92, -0.05]} rotation={[0, 0, -sd * 0.5]} material={mat('#c0c4c8', { r: 0.2, m: 0.9 })}><cylinderGeometry args={[0.008, 0.008, 0.6, 6]} /></mesh>)}
    <mesh position={[0, 0.71, -0.05]} material={mat('#333', { r: 0.4 })}><sphereGeometry args={[0.06, 16, 10]} /></mesh>
  </group>
);
export const RadioSet: React.FC<{ pos?: number[]; rotY?: number; glow?: number }> = ({ pos = [0, 0, 0], rotY = 0, glow = 1 }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    <mesh geometry={rbox(0.5, 0.3, 0.18, 0.04)} position={[0, 0.15, 0]} material={mat('#8c3b2e', { r: 0.5 })} castShadow />
    <mesh position={[-0.1, 0.16, 0.092]} material={mat('#d8c9a8', { r: 0.8 })}><boxGeometry args={[0.24, 0.2, 0.01]} /></mesh>
    <mesh position={[0.15, 0.2, 0.093]} material={basic('#ffcf6a', { t: 0.6 + 0.4 * glow })}><boxGeometry args={[0.14, 0.05, 0.01]} /></mesh>
    {[0, 1].map((i) => <mesh key={i} position={[0.12 + i * 0.07, 0.09, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={mat('#222', { r: 0.4 })}><cylinderGeometry args={[0.025, 0.025, 0.03, 14]} /></mesh>)}
    <mesh position={[0.2, 0.55, -0.05]} rotation={[0, 0, -0.3]} material={mat('#c0c4c8', { r: 0.2, m: 0.9 })}><cylinderGeometry args={[0.006, 0.006, 0.7, 6]} /></mesh>
  </group>
);
/** radio waves: expanding rings (camera-facing sprites) */
export const Waves: React.FC<{ pos: number[]; f: number; s?: number; col?: string; n?: number }> = ({ pos, f, s = 1, col = CYAN, n = 4 }) => {
  const tex = canvasTex('ring', 256, 256, (g) => { g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.stroke(); });
  return <>{Array.from({ length: n }).map((_, i) => { const t = ((f / 40 + i / n) % 1); return <sprite key={i} position={pos as any} scale={[s * t * 3, s * t * 3, 1]} material={spr(col, { map: tex, add: true, t: (1 - t) * 0.9 })} />; })}</>;
};
export const Mailbox: React.FC<{ pos?: number[]; rotY?: number }> = ({ pos = [0, 0, 0], rotY = 0 }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.5, 0]} material={mat('#2c3e50', { r: 0.5 })}><cylinderGeometry args={[0.05, 0.05, 1, 10]} /></mesh>
    <mesh geometry={rbox(0.6, 0.75, 0.42, 0.08)} position={[0, 1.3, 0]} material={mat('#1e5fb4', { r: 0.45 })} castShadow />
    <mesh position={[0, 1.5, 0.215]} material={mat('#0d2547', { r: 0.6 })}><boxGeometry args={[0.36, 0.05, 0.01]} /></mesh>
    <mesh position={[0, 1.2, 0.215]} material={basic('#ffd23f')}><boxGeometry args={[0.24, 0.16, 0.01]} /></mesh>
  </group>
);
export const Envelope: React.FC<{ pos: number[]; rot?: number[]; s?: number }> = ({ pos, rot = [0, 0, 0], s = 1 }) => {
  const tex = useMemo(() => canvasTex('envelope', 256, 160, (g, w, h) => {
    g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9bfa6'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, h * 0.55); g.lineTo(w, 0); g.stroke();
    g.fillStyle = '#e74c3c'; g.fillRect(w - 56, 14, 40, 48); g.fillStyle = '#fff'; g.fillRect(w - 50, 20, 28, 36);
    g.fillStyle = '#556'; for (let i = 0; i < 3; i++) g.fillRect(40, 92 + i * 18, 120 - i * 20, 6);
  }), []);
  return <mesh position={pos as any} rotation={rot as any} scale={[s, s, s]} material={useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }), [tex])}><planeGeometry args={[0.32, 0.2]} /></mesh>;
};

export const Telegraph: React.FC<{ f: number; spark?: number; pos?: number[]; rotY?: number }> = ({ f, spark = 0, pos = [0, 0, 0], rotY = 0 }) => {
  const brass = mat('#c9a13b', { r: 0.25, m: 0.9 });
  const down = Math.floor(f / 5) % 3 === 0 ? 0.02 : 0;
  const r = rng(Math.floor(f / 2) + 3);
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh geometry={rbox(0.7, 0.06, 0.4, 0.02)} position={[0, 0.03, 0]} material={mat('#6b3f22', { r: 0.6 })} castShadow receiveShadow />
      {[-0.22, 0.22].map((x, i) => <group key={i} position={[x, 0.06, -0.06]}>
        <mesh position={[0, 0.07, 0]} material={mat('#2a2a2a', { r: 0.5 })}><cylinderGeometry args={[0.05, 0.05, 0.14, 16]} /></mesh>
        <mesh position={[0, 0.15, 0]} material={brass}><cylinderGeometry args={[0.055, 0.055, 0.02, 16]} /></mesh></group>)}
      <group position={[0, 0.1, 0.08]} rotation={[down * 4, 0, 0]}>
        <mesh position={[0, 0, 0]} material={brass}><boxGeometry args={[0.36, 0.02, 0.04]} /></mesh>
        <mesh position={[0.17, 0.03, 0]} material={mat('#111', { r: 0.4 })}><cylinderGeometry args={[0.035, 0.035, 0.03, 16]} /></mesh>
      </group>
      {spark > 0 && Array.from({ length: 10 }).map((_, i) => {
        const a = r() * Math.PI * 2, d = 0.05 + r() * 0.25 * spark;
        return <sprite key={i} position={[Math.cos(a) * d * 0.8, 0.2 + Math.abs(Math.sin(a)) * d, Math.sin(a) * d * 0.3 + 0.05]} scale={[0.05 + r() * 0.06, 0.05 + r() * 0.06, 1]} material={spr(r() < 0.5 ? '#bfe9ff' : '#fff6b0', { map: radialTex('glow'), add: true, t: spark })} />;
      })}
      {spark > 0 && <Glow pos={[0, 0.2, 0.05]} s={0.8 * spark} color="#9fdcff" o={spark} />}
    </group>
  );
};

export const Anchor: React.FC<{ pos?: number[]; rot?: number[]; s?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], s = 1 }) => {
  const m = mat('#3b3f45', { r: 0.6, m: 0.7 });
  return (
    <group position={pos as any} rotation={rot as any} scale={[s, s, s]}>
      <mesh position={[0, 1, 0]} material={m} castShadow><cylinderGeometry args={[0.09, 0.09, 2, 12]} /></mesh>
      <mesh position={[0, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} material={m}><torusGeometry args={[0.18, 0.05, 8, 20]} /></mesh>
      <mesh position={[0, 1.65, 0]} rotation={[0, 0, Math.PI / 2]} material={m}><cylinderGeometry args={[0.06, 0.06, 1.0, 10]} /></mesh>
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI]} material={m}><torusGeometry args={[0.6, 0.08, 8, 24, Math.PI]} /></mesh>
      {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.6, 0.6, 0]} rotation={[0, 0, sd * 0.6]} material={m}><coneGeometry args={[0.16, 0.36, 4]} /></mesh>)}
    </group>
  );
};

/** the 1969 computer room: cabinets with tape reels and a terminal */
export const VintageLab: React.FC<{ f: number; tex: THREE.Texture; crash?: number }> = ({ f, tex, crash = 0 }) => {
  const cab = mat('#d9d2bd', { r: 0.6 });
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={i} position={[-2.2 + i * 1.1, 0, -2.6]}>
          <mesh geometry={rbox(1.0, 2.0, 0.7, 0.03)} position={[0, 1, 0]} material={cab} castShadow receiveShadow />
          {[0, 1].map((k) => <mesh key={k} position={[-0.2 + k * 0.4, 1.45, 0.36]} rotation={[Math.PI / 2, (crash > 0 ? 0 : f * 0.08 * (k ? 1 : -1)), 0]} material={mat('#3b3b3b', { r: 0.5 })}><cylinderGeometry args={[0.17, 0.17, 0.03, 24]} /></mesh>)}
          {Array.from({ length: 6 }).map((_, l) => {
            const on = crash > 0 ? (hash(l + i * 7 + Math.floor(f / 3)) > 0.5 ? RED : '#3a0b0b') : (Math.floor(f / 6 + l + i) % 3 ? '#ffb020' : '#3a2a0b');
            return <mesh key={l} position={[-0.3 + l * 0.12, 0.85, 0.36]} material={basic(on)}><circleGeometry args={[0.025, 10]} /></mesh>;
          })}
        </group>
      ))}
      <mesh geometry={rbox(1.4, 0.75, 0.8, 0.03)} position={[0.4, 0.375, -0.6]} material={mat('#8c8676', { r: 0.6 })} castShadow receiveShadow />
      <group position={[0.4, 0.75, -0.75]}>
        <mesh geometry={rbox(0.7, 0.55, 0.55, 0.06)} position={[0, 0.3, 0]} material={mat('#cfc6ad', { r: 0.6 })} castShadow />
        <Screen tex={tex} w={0.5} h={0.37} pos={[0, 0.32, 0.28]} frame="#2a2a2a" depth={0.02} glow={1} />
        <mesh geometry={rbox(0.62, 0.05, 0.26, 0.02)} position={[0, 0.03, 0.42]} material={mat('#5c5648', { r: 0.6 })} castShadow />
      </group>
      <pointLight position={[0.4, 1.3, 0]} intensity={crash > 0 ? 3 : 6} distance={4} color={crash > 0 ? '#ff6a5a' : '#9fffb0'} />
    </group>
  );
};

/** an apartment block facade with lit windows and glowing cables connecting flats */
export const Block: React.FC<{ f: number; wires?: number; floors?: number; cols?: number }> = ({ f, wires = 0, floors = 6, cols = 5 }) => {
  const win = useMemo(() => { const r = rng(31); return Array.from({ length: floors * cols }).map(() => r()); }, [floors, cols]);
  const W = cols * 1.6, H = floors * 1.4;
  const routes = useMemo(() => {
    const pts: THREE.Vector3[][] = [];
    for (let fl = 0; fl < floors; fl++) pts.push([new THREE.Vector3(-W / 2 + 0.8, 0.9 + fl * 1.4, 0.32), new THREE.Vector3(W / 2 - 0.8, 0.9 + fl * 1.4, 0.32)]);
    for (let c = 0; c < cols; c += 2) pts.push([new THREE.Vector3(-W / 2 + 0.8 + c * 1.6, 0.9, 0.33), new THREE.Vector3(-W / 2 + 0.8 + c * 1.6, 0.9 + (floors - 1) * 1.4, 0.33)]);
    return pts.map((p) => new THREE.TubeGeometry(new THREE.LineCurve3(p[0], p[1]), 8, 0.035, 6, false));
  }, [floors, cols, W]);
  return (
    <group>
      <mesh position={[0, H / 2, -0.4]} material={mat('#c9b8a3', { r: 0.85 })} castShadow receiveShadow><boxGeometry args={[W + 0.6, H + 0.4, 1.2]} /></mesh>
      <mesh position={[0, H + 0.3, -0.4]} material={mat('#6d5d4e', { r: 0.8 })}><boxGeometry args={[W + 0.9, 0.2, 1.4]} /></mesh>
      {win.map((r, i) => {
        const c = i % cols, fl = Math.floor(i / cols);
        const lit = wires > 0 ? (r < 0.15 + 0.85 * clamp(wires * 1.4 - fl * 0.1) ? 1 : 0) : r < 0.4 ? 1 : 0;
        return <mesh key={i} position={[-W / 2 + 0.8 + c * 1.6, 0.9 + fl * 1.4, 0.21]} material={basic(lit ? (wires > 0 ? '#ffe9b0' : '#ffd79a') : '#2a3346')}><planeGeometry args={[1.0, 0.8]} /></mesh>;
      })}
      {routes.map((g, i) => {
        const shown = clamp(wires * routes.length * 1.2 - i);
        return shown > 0 ? <mesh key={i} geometry={g} material={basic(i % 2 ? CYAN : MAG, { add: true, t: shown * (0.75 + 0.25 * Math.sin(f * 0.3 + i)) })} /> : null;
      })}
    </group>
  );
};

export { lerp };
