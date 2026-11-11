import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mat, basic, outlineMat, textTex, radialTex, smokeTex, canvasTex, Blob, spr } from './core';
import { rng, clamp, lerp } from '../lib/anim';

const G: Record<string, THREE.BufferGeometry> = {};
const geo = (k: string, make: () => THREE.BufferGeometry) => (G[k] ||= make());
export const rbox = (x: number, y: number, z: number, r = 0.05) => geo(`rb${x}_${y}_${z}_${r}`, () => new RoundedBoxGeometry(x, y, z, 3, r));

// ------------------------------------------------------------------ question mark (3D)
export const QMark: React.FC<{ pos?: number[]; s?: number; rotY?: number; color?: string; ol?: boolean }> = ({ pos = [0, 0, 0], s = 1, rotY = 0, color = '#ffd23f', ol = true }) => {
  const arc = geo('qarc', () => new THREE.TorusGeometry(0.3, 0.1, 12, 28, Math.PI * 1.35));
  const stem = geo('qstem', () => new THREE.CapsuleGeometry(0.1, 0.18, 6, 12));
  const dot = geo('qdot', () => new THREE.SphereGeometry(0.12, 16, 12));
  const m = mat(color, { r: 0.35, e: color, ei: 0.25 });
  const o = outlineMat(0.03, '#2a1a10');
  return (
    <group position={pos as any} scale={[s, s, s]} rotation={[0, rotY, 0]}>
      <group position={[0, 0.55, 0]} rotation={[0, 0, -Math.PI * 0.42]}>
        <mesh geometry={arc} material={m} castShadow />{ol && <mesh geometry={arc} material={o} />}
      </group>
      <mesh geometry={stem} material={m} position={[0.0, 0.08, 0]} castShadow />{ol && <mesh geometry={stem} material={o} position={[0.0, 0.08, 0]} />}
      <mesh geometry={dot} material={m} position={[0, -0.32, 0]} castShadow />{ol && <mesh geometry={dot} material={o} position={[0, -0.32, 0]} />}
    </group>
  );
};

// ------------------------------------------------------------------ IQ hologram tag (sprite, live number)
export const IQTag: React.FC<{ value: number; pos?: number[]; s?: number; glitch?: number }> = ({ value, pos = [0, 0, 0], s = 1, glitch = 0 }) => {
  const { tex, cv } = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    return { tex, cv };
  }, []);
  const v = Math.round(value);
  const key = v + '_' + Math.round(glitch * 10);
  if ((cv as any)._k !== key) {
    (cv as any)._k = key;
    const g = cv.getContext('2d', { willReadFrequently: true })!;
    g.clearRect(0, 0, 512, 256);
    const neg = v < 0;
    const col = neg ? '#ff3b4a' : v < 60 ? '#ffb020' : '#3ff0ff';
    g.fillStyle = neg ? 'rgba(90,0,10,0.55)' : 'rgba(0,40,60,0.5)';
    (g as any).roundRect(16, 16, 480, 224, 36); g.fill();
    g.strokeStyle = col; g.lineWidth = 8; (g as any).roundRect(16, 16, 480, 224, 36); g.stroke();
    g.fillStyle = col; g.font = '800 64px Montserrat, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillText('IQ', 52, 128);
    g.font = '900 150px Montserrat, sans-serif'; g.textAlign = 'right';
    const off = glitch > 0 ? (Math.sin(v * 12.9898 + glitch * 78.233) * 0.5) * 24 * glitch : 0;
    if (glitch > 0) { g.fillStyle = 'rgba(0,255,255,0.6)'; g.fillText(String(v), 470 + off, 136); g.fillStyle = 'rgba(255,0,80,0.7)'; g.fillText(String(v), 462 - off, 132); }
    g.fillStyle = col; g.fillText(String(v), 466, 134);
    tex.needsUpdate = true;
  }
  return (
    <group position={pos as any}>
      <sprite scale={[1.1 * s, 0.55 * s, 1]} material={useMemo(() => new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }), [tex])} />
      <sprite scale={[1.9 * s, 1.1 * s, 1]} material={spr(value < 0 ? '#ff2a3a' : '#2ae8ff', { map: radialTex('glow'), add: true, t: 0.35 })} />
    </group>
  );
};

// ------------------------------------------------------------------ dizzy stars
export const Stars: React.FC<{ f: number; pos?: number[]; n?: number; r?: number; s?: number }> = ({ f, pos = [0, 0, 0], n = 5, r = 0.45, s = 1 }) => {
  const star = geo('star', () => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 0.06 : 0.14; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } return new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }); });
  return (
    <group position={pos as any} scale={[s, s, s]}>
      {Array.from({ length: n }).map((_, i) => {
        const a = f * 0.18 + (i / n) * Math.PI * 2;
        return <mesh key={i} geometry={star} material={basic('#ffe14d')} position={[Math.cos(a) * r, Math.sin(a * 2) * 0.05, Math.sin(a) * r]} rotation={[0, -a, f * 0.1]} />;
      })}
    </group>
  );
};

// ------------------------------------------------------------------ simple street props
export const Lamp: React.FC<{ pos: number[]; on?: number; rotY?: number }> = ({ pos, on = 0, rotY = 0 }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    <mesh position={[0, 3.5, 0]} material={mat('#3b3f45', { r: 0.5, m: 0.4 })} castShadow><cylinderGeometry args={[0.07, 0.11, 7, 10]} /></mesh>
    <mesh position={[0.6, 6.95, 0]} material={mat('#3b3f45', { r: 0.5, m: 0.4 })}><boxGeometry args={[1.3, 0.1, 0.1]} /></mesh>
    <mesh position={[1.2, 6.85, 0]} material={on ? basic('#ffe2a8') : mat('#d8d8d0', { r: 0.3 })}><boxGeometry args={[0.6, 0.16, 0.36]} /></mesh>
  </group>
);
export const Bench: React.FC<{ pos: number[]; rotY?: number }> = ({ pos, rotY = 0 }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.45, 0]} material={mat('#8b5a3c', { r: 0.8 })} castShadow receiveShadow><boxGeometry args={[1.8, 0.08, 0.5]} /></mesh>
    <mesh position={[0, 0.8, -0.24]} rotation={[-0.15, 0, 0]} material={mat('#8b5a3c', { r: 0.8 })} castShadow><boxGeometry args={[1.8, 0.4, 0.06]} /></mesh>
    {[-0.75, 0.75].map((x) => <mesh key={x} position={[x, 0.22, 0]} material={mat('#333', { r: 0.5, m: 0.5 })}><boxGeometry args={[0.08, 0.45, 0.45]} /></mesh>)}
  </group>
);
export const Bin: React.FC<{ pos: number[]; tip?: number }> = ({ pos, tip = 0 }) => (
  <group position={pos as any} rotation={[0, 0, tip]}>
    <mesh position={[0, 0.5, 0]} material={mat('#2f6f4f', { r: 0.6, m: 0.2 })} castShadow><cylinderGeometry args={[0.32, 0.27, 1, 16]} /></mesh>
    <mesh position={[0, 1.02, 0]} material={mat('#244f39', { r: 0.6 })}><cylinderGeometry args={[0.34, 0.34, 0.06, 16]} /></mesh>
  </group>
);
export const Hydrant: React.FC<{ pos: number[] }> = ({ pos }) => (
  <group position={pos as any}>
    <mesh position={[0, 0.4, 0]} material={mat('#d63031', { r: 0.5 })} castShadow><cylinderGeometry args={[0.16, 0.2, 0.8, 12]} /></mesh>
    <mesh position={[0, 0.85, 0]} material={mat('#d63031', { r: 0.5 })}><sphereGeometry args={[0.17, 12, 8]} /></mesh>
  </group>
);

// ------------------------------------------------------------------ fx
export const Glow: React.FC<{ pos: number[]; s: number; color: string; o?: number }> = ({ pos, s, color, o = 1 }) => (
  <sprite position={pos as any} scale={[s, s, 1]} material={spr(color, { map: radialTex('glow'), add: true, t: o })} />
);
/** rising smoke column; f = frame, n puffs */
export const Smoke: React.FC<{ pos: number[]; f: number; n?: number; h?: number; s?: number; color?: string; o?: number; seed?: number }> = ({ pos, f, n = 16, h = 60, s = 10, color = '#5b5753', o = 0.75, seed = 1 }) => {
  const m = useMemo(() => new THREE.SpriteMaterial({ map: smokeTex(), color, transparent: true, opacity: o, depthWrite: false, fog: true }), [color, o]);
  const r = rng(seed);
  const offs = useMemo(() => Array.from({ length: n }).map(() => [r(), r(), r()]), [n]);
  return (
    <group position={pos as any}>
      {offs.map(([a, b, c], i) => {
        const life = ((f / 90 + i / n + a * 0.1) % 1);
        const y = life * h;
        const sc = s * (0.5 + life * 1.6);
        return <sprite key={i} position={[(b - 0.5) * s * 0.5 + life * h * 0.25, y, (c - 0.5) * s * 0.5]} scale={[sc, sc, 1]} material={m} />;
      })}
    </group>
  );
};
export const Ring: React.FC<{ r: number; w?: number; color?: string; o?: number; y?: number }> = ({ r, w = 1.5, color = '#a46bff', o = 0.9, y = 0.3 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} material={basic(color, { add: true, t: o, side: THREE.DoubleSide })}>
    <ringGeometry args={[Math.max(0.01, r - w), r, 96]} />
  </mesh>
);
/** a flock of simple birds (V-shapes flapping) */
export const Birds: React.FC<{ f: number; n?: number; center?: number[]; spread?: number; color?: string; speed?: number }> = ({ f, n = 7, center = [0, 30, 0], spread = 12, color = '#2a2a33', speed = 0.25 }) => {
  const wing = geo('wing', () => { const g = new THREE.PlaneGeometry(0.9, 0.28); g.translate(0.45, 0, 0); return g; });
  const r = rng(77);
  const pts = useMemo(() => Array.from({ length: n }).map(() => [(r() - 0.5) * spread, (r() - 0.5) * spread * 0.3, (r() - 0.5) * spread, r() * 6]), [n]);
  const m = mat(color, { r: 0.8, side: THREE.DoubleSide });
  return (
    <group position={[center[0] + f * speed, center[1], center[2]]}>
      {pts.map(([x, y, z, ph], i) => {
        const fl = Math.sin(f * 0.6 + ph) * 0.7;
        return (
          <group key={i} position={[x, y + Math.sin(f * 0.05 + ph) * 0.5, z]} rotation={[0, -Math.PI / 2, 0]} scale={[1.4, 1.4, 1.4]}>
            <mesh geometry={wing} material={m} rotation={[0, 0, fl]} />
            <mesh geometry={wing} material={m} rotation={[0, Math.PI, fl]} />
          </group>
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------------ dynamic screen texture
export function useScreen(w: number, h: number, key: string, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const { tex, cv } = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    return { tex, cv };
  }, [w, h]);
  if ((cv as any)._k !== key) { (cv as any)._k = key; const g = cv.getContext('2d', { willReadFrequently: true })!; g.clearRect(0, 0, w, h); draw(g, w, h); tex.needsUpdate = true; }
  return tex;
}
export const Screen: React.FC<{ tex: THREE.Texture; w: number; h: number; pos?: number[]; rot?: number[]; frame?: string; depth?: number; glow?: number }> = ({ tex, w, h, pos = [0, 0, 0], rot = [0, 0, 0], frame = '#222', depth = 0.08, glow = 1 }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  m.color.setScalar(glow);
  return (
    <group position={pos as any} rotation={rot as any}>
      <mesh geometry={rbox(w + 0.08, h + 0.08, depth, Math.min(0.04, depth / 2))} material={mat(frame, { r: 0.4, m: 0.3 })} position={[0, 0, -depth / 2 - 0.002]} castShadow />
      <mesh material={m}><planeGeometry args={[w, h]} /></mesh>
    </group>
  );
};

// ------------------------------------------------------------------ interior helpers
export const Room: React.FC<{ w: number; d: number; h: number; wall?: string; floor?: 'wood' | 'tile' | 'lino' | 'dark'; ceilingLights?: number; windows?: 'left' | 'back' | 'none'; light?: number }> = ({ w, d, h, wall = '#e8e2d6', floor = 'tile', ceilingLights = 0, windows = 'none', light = 1 }) => {
  const floorTex = useMemo(() => {
    const t = canvasTex('floor' + floor, 512, 512, (g, W, H) => {
      const r = rng(3);
      if (floor === 'wood') { for (let i = 0; i < 16; i++) { const v = 140 + r() * 40; g.fillStyle = `rgb(${v + 30},${v - 10},${v - 50})`; g.fillRect(0, i * 32, W, 31); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(r() * W, i * 32, 2, 32); } }
      else if (floor === 'dark') { g.fillStyle = '#2a2d33'; g.fillRect(0, 0, W, H); g.strokeStyle = '#1d1f23'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, H); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(W, i * 128); g.stroke(); } }
      else if (floor === 'lino') { g.fillStyle = '#b9a98f'; g.fillRect(0, 0, W, H); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(r() * W, r() * H, 3, 3); } }
      else { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 215 + r() * 20; g.fillStyle = `rgb(${v},${v},${v - 6})`; g.fillRect(x * 64 + 1, y * 64 + 1, 62, 62); } }
    }, { repeat: true }).clone();
    t.repeat.set(w / 4, d / 4); t.needsUpdate = true; return t;
  }, [floor, w, d]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={useMemo(() => new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55 }), [floorTex])}><planeGeometry args={[w, d]} /></mesh>
      <mesh position={[0, h / 2, -d / 2]} receiveShadow material={mat(wall, { r: 0.9 })}><planeGeometry args={[w, h]} /></mesh>
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow material={mat(wall, { r: 0.9 })}><planeGeometry args={[d, h]} /></mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow material={mat(wall, { r: 0.9 })}><planeGeometry args={[d, h]} /></mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat('#f4f2ee', { r: 0.9 })}><planeGeometry args={[w, d]} /></mesh>
      <mesh position={[0, 0.06, -d / 2 + 0.03]} material={mat('#8a7f70', { r: 0.7 })}><boxGeometry args={[w, 0.12, 0.06]} /></mesh>
      {Array.from({ length: ceilingLights }).map((_, i) => (
        <mesh key={i} position={[0, h - 0.02, -d / 2 + (d / (ceilingLights + 1)) * (i + 1)]} rotation={[Math.PI / 2, 0, 0]} material={basic('#ffffff')}><planeGeometry args={[Math.min(w * 0.5, 3), 0.5]} /></mesh>
      ))}
      {windows === 'left' && [0.25, 0.5, 0.75].map((t) => (
        <group key={t} position={[-w / 2 + 0.02, h * 0.55, -d / 2 + d * t]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={basic('#dff0ff')}><planeGeometry args={[d * 0.2, h * 0.5]} /></mesh>
          <mesh position={[0, 0, 0.01]} material={mat('#f5f5f5', { r: 0.6 })}><boxGeometry args={[0.08, h * 0.5, 0.04]} /></mesh>
        </group>
      ))}
      {windows === 'back' && [-0.3, 0, 0.3].map((t) => (
        <group key={t} position={[w * t, h * 0.55, -d / 2 + 0.02]}>
          <mesh material={basic('#dff0ff')}><planeGeometry args={[w * 0.2, h * 0.5]} /></mesh>
          <mesh position={[0, 0, 0.01]} material={mat('#f5f5f5', { r: 0.6 })}><boxGeometry args={[0.08, h * 0.5, 0.04]} /></mesh>
        </group>
      ))}
      <pointLight position={[0, h - 0.4, 0]} intensity={light * 30} distance={Math.max(w, d) * 2} decay={1.5} color="#fff3e2" />
    </group>
  );
};

/** shelves with products */
export const Shelf: React.FC<{ pos: number[]; rotY?: number; len?: number; seed?: number }> = ({ pos, rotY = 0, len = 6, seed = 1 }) => {
  const items = useMemo(() => {
    const r = rng(seed); const out: any[] = [];
    const cols = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#e67e22', '#9b59b6', '#ecf0f1', '#1abc9c', '#ff7aa2'];
    for (let lvl = 0; lvl < 4; lvl++) for (let x = -len / 2 + 0.2; x < len / 2 - 0.2;) {
      const w = 0.18 + r() * 0.22, h = 0.2 + r() * 0.28;
      out.push({ x: x + w / 2, y: 0.32 + lvl * 0.5 + h / 2, w, h, d: 0.25 + r() * 0.1, c: cols[Math.floor(r() * cols.length)], cyl: r() < 0.3 });
      x += w + 0.02;
    }
    return out;
  }, [len, seed]);
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.1, -0.28]} material={mat('#dfe3e8', { r: 0.6 })} castShadow receiveShadow><boxGeometry args={[len, 2.2, 0.06]} /></mesh>
      {[0, 1, 2, 3].map((l) => <mesh key={l} position={[0, 0.3 + l * 0.5, 0]} material={mat('#c8cdd3', { r: 0.5, m: 0.3 })} castShadow receiveShadow><boxGeometry args={[len, 0.04, 0.6]} /></mesh>)}
      {items.map((it, i) => it.cyl
        ? <mesh key={i} position={[it.x, it.y, 0]} material={mat(it.c, { r: 0.35 })} castShadow><cylinderGeometry args={[it.w / 2.2, it.w / 2.2, it.h, 12]} /></mesh>
        : <mesh key={i} position={[it.x, it.y, 0]} material={mat(it.c, { r: 0.55 })} castShadow><boxGeometry args={[it.w, it.h, it.d]} /></mesh>)}
    </group>
  );
};

/** a 3D floating info card */
export const Card3D: React.FC<{ tex: THREE.Texture; w: number; h: number; pos?: number[]; rot?: number[]; s?: number; color?: string }> = ({ tex, w, h, pos = [0, 0, 0], rot = [0, 0, 0], s = 1, color = '#ffffff' }) => (
  <group position={pos as any} rotation={rot as any} scale={[s, s, s]}>
    <mesh geometry={rbox(w + 0.12, h + 0.12, 0.12, 0.06)} material={mat(color, { r: 0.35 })} position={[0, 0, -0.07]} castShadow />
    <mesh material={useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])}><planeGeometry args={[w, h]} /></mesh>
  </group>
);

export { Blob, clamp, lerp, textTex };
