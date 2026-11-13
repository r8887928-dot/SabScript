import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mat, basic, canvasTex } from '../three/core';
import { rbox } from '../three/props';
import { Car } from '../three/vehicles';
import { rng } from '../lib/anim';
import { Palm } from '../vr/props';

// A cartoon desert town in the spirit of classic tactical-shooter maps (own design, not a copy of any real map).
const SAND = '#e3c48f', STONE = '#d9b77e', STONE_D = '#b8925a', WOOD = '#8a5a2b', TEAL = '#2f7f86';

const stoneTex = (key: string, base: string) => canvasTex(key, 512, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(key.length * 13);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,90,50' : '255,240,210'},${r() * 0.08})`; g.fillRect(r() * w, r() * h, 2 + r() * 6, 2 + r() * 6); }
  g.strokeStyle = 'rgba(110,80,45,0.35)'; g.lineWidth = 3;
  for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (y / 64) % 2 ? 0 : 64; x < w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } }
  for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(120,85,45,0.18)'; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 40, 6 + r() * 20, r(), 0, 7); g.fill(); }
}, { repeat: true });
const sandTex = () => canvasTex('cs_sand', 512, 512, (g, w, h) => {
  g.fillStyle = SAND; g.fillRect(0, 0, w, h);
  const r = rng(77);
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '150,110,60' : '255,245,220'},${r() * 0.12})`; g.fillRect(r() * w, r() * h, 2, 2); }
  for (let i = 0; i < 30; i++) { g.strokeStyle = 'rgba(160,120,70,0.25)'; g.lineWidth = 2; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 20, w * 0.6, y - 20, w, y + 10); g.stroke(); }
}, { repeat: true });
const plankTex = (key: string, col: string) => canvasTex(key, 256, 512, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  const r = rng(key.length * 7);
  for (let x = 0; x < w; x += 42) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 0, 3, h); for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(x + 6 + r() * 30, r() * h, 2, 30 + r() * 60); } }
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 60, w, 14); g.fillRect(0, h - 74, w, 14);
  g.fillStyle = '#c9a227'; for (const y of [67, h - 67]) for (const x of [20, w - 20]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
});
const useMat = (tex: THREE.Texture, rep: [number, number], o: { r?: number } = {}) => useMemo(() => { const t = tex.clone(); t.repeat.set(rep[0], rep[1]); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: o.r ?? 0.92 }); }, [tex, rep[0], rep[1]]);

/** a sandstone building block with a darker trim on top and a few windows */
export const Block: React.FC<{ pos: number[]; size: number[]; rotY?: number; windows?: number; seed?: number; base?: string }> = ({ pos, size, rotY = 0, windows = 2, seed = 1, base = STONE }) => {
  const [w, h, d] = size;
  const m = useMat(stoneTex('cs_stone_' + base, base), [Math.max(1, w / 3), Math.max(1, h / 3)]);
  const r = rng(seed);
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} material={m} castShadow receiveShadow><boxGeometry args={[w, h, d]} /></mesh>
      <mesh position={[0, h + 0.1, 0]} material={mat(STONE_D, { r: 0.9 })} castShadow><boxGeometry args={[w + 0.25, 0.2, d + 0.25]} /></mesh>
      {Array.from({ length: windows }).map((_, i) => {
        const x = (i - (windows - 1) / 2) * (w / Math.max(1, windows)), y = h * (0.45 + r() * 0.25);
        return (
          <group key={i} position={[x, y, d / 2 + 0.01]}>
            <mesh material={mat('#2a1c10', { r: 0.9 })}><planeGeometry args={[0.9, 1.1]} /></mesh>
            <mesh position={[0, 0.62, 0.05]} material={mat(STONE_D, { r: 0.9 })}><boxGeometry args={[1.1, 0.12, 0.12]} /></mesh>
            {[-1, 1].map((s) => <mesh key={s} position={[s * 0.62, 0, 0.04]} rotation={[0, s * 0.5, 0]} material={mat(TEAL, { r: 0.8 })}><boxGeometry args={[0.42, 1.05, 0.05]} /></mesh>)}
          </group>
        );
      })}
    </group>
  );
};
/** dark arched opening drawn on a wall (face points +z) */
export const ArchHole: React.FC<{ pos: number[]; rotY?: number; w?: number; h?: number }> = ({ pos, rotY = 0, w = 3, h = 3.2 }) => {
  const g = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.closePath();
    return new THREE.ShapeGeometry(s, 24);
  }, [w, h]);
  const rim = useMemo(() => { const c = new THREE.EllipseCurve(0, h - w / 2, w / 2 + 0.12, w / 2 + 0.12, Math.PI, 0, true); const pts = c.getPoints(24).map((p) => new THREE.Vector3(p.x, p.y, 0)); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.12, 6, false); }, [w, h]);
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh geometry={g} material={basic('#0f0a06')} />
      <mesh geometry={rim} material={mat(STONE_D, { r: 0.9 })} castShadow />
      {[-1, 1].map((s) => <mesh key={s} position={[s * (w / 2 + 0.12), (h - w / 2) / 2, 0]} material={mat(STONE_D, { r: 0.9 })}><boxGeometry args={[0.24, h - w / 2, 0.24]} /></mesh>)}
    </group>
  );
};
export const Crate: React.FC<{ pos: number[]; s?: number; rotY?: number }> = ({ pos, s = 1.1, rotY = 0 }) => {
  const t = useMemo(() => canvasTex('cs_crate', 256, 256, (g, w, h) => {
    g.fillStyle = '#a8763c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6b4520'; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18);
    g.beginPath(); g.moveTo(18, 18); g.lineTo(w - 18, h - 18); g.stroke(); g.lineWidth = 3; for (let y = 40; y < h; y += 44) { g.beginPath(); g.moveTo(18, y); g.lineTo(w - 18, y); g.stroke(); }
  }), []);
  return <mesh position={[pos[0], pos[1] + s / 2, pos[2]]} rotation={[0, rotY, 0]} material={useMemo(() => new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }), [t])} castShadow receiveShadow><boxGeometry args={[s, s, s]} /></mesh>;
};
export const Barrel: React.FC<{ pos: number[]; col?: string }> = ({ pos, col = '#3f6d8a' }) => (
  <group position={pos as any}>
    <mesh position={[0, 0.45, 0]} material={mat(col, { r: 0.6, m: 0.3 })} castShadow><cylinderGeometry args={[0.32, 0.32, 0.9, 16]} /></mesh>
    {[0.15, 0.75].map((y) => <mesh key={y} position={[0, y, 0]} material={mat('#2b2b2b', { r: 0.5 })}><torusGeometry args={[0.325, 0.02, 6, 24]} /></mesh>)}
  </group>
);
/** a big wooden double gate in a wall; `open` 0..1 (leaves swing towards +z) */
export const Gate: React.FC<{ pos: number[]; open: number; wallW?: number }> = ({ pos, open, wallW = 10 }) => {
  const m = useMat(stoneTex('cs_stone_' + STONE, STONE), [3, 2]);
  const pl = useMemo(() => new THREE.MeshStandardMaterial({ map: plankTex('cs_gate', '#3a8c8f'), roughness: 0.8 }), []);
  const side = (wallW - 2.8) / 2;
  return (
    <group position={pos as any}>
      {[-1, 1].map((s) => <mesh key={s} position={[s * (1.4 + side / 2), 2.2, 0]} material={m} castShadow receiveShadow><boxGeometry args={[side, 4.4, 0.8]} /></mesh>)}
      <mesh position={[0, 4.0, 0]} material={m} castShadow><boxGeometry args={[2.8, 0.8, 0.8]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={'d' + s} position={[s * 1.4, 0, 0.42]} rotation={[0, -s * open * 1.7, 0]}>
          <mesh position={[-s * 0.7, 1.8, 0]} material={pl} castShadow><boxGeometry args={[1.38, 3.6, 0.1]} /></mesh>
        </group>
      ))}
    </group>
  );
};
/** painted site letter */
export const SiteLetter: React.FC<{ pos: number[]; rotY?: number; s?: number }> = ({ pos, rotY = 0, s = 2.4 }) => {
  const t = useMemo(() => canvasTex('cs_siteA', 256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#c0261b'; g.font = '900 230px Montserrat'; g.textAlign = 'center'; g.fillText('A', w / 2, 210);
    g.fillStyle = 'rgba(192,38,27,0.8)'; for (const x of [70, 128, 190]) g.fillRect(x, 200, 6, 30 + (x % 40));
  }), []);
  return <mesh position={pos as any} rotation={[0, rotY, 0]} material={useMemo(() => new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9 }), [t])}><planeGeometry args={[s, s]} /></mesh>;
};
const Bush: React.FC<{ pos: number[]; s?: number }> = ({ pos, s = 1 }) => (
  <group position={pos as any} scale={[s, s, s]}>{[0, 1, 2].map((i) => <mesh key={i} position={[(i - 1) * 0.25, 0.25, (i % 2) * 0.15]} material={mat('#8a9a3b', { r: 0.9, flat: true })}><icosahedronGeometry args={[0.32, 0]} /></mesh>)}</group>
);

/**
 * The whole map. Layout (metres): landing street z 4..14 (x ±5), gate wall at z = 0,
 * bomb site A courtyard around (0, -14) with the letter on the back wall (z = -21),
 * tunnel arch on the west wall (x = -7), old car at (4.2, -10.5).
 */
export const DesertMap: React.FC<{ gate?: number }> = ({ gate = 0 }) => {
  const ground = useMat(sandTex(), [16, 16]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={ground} receiveShadow><planeGeometry args={[160, 160]} /></mesh>
      {/* landing street */}
      <Block pos={[-7.5, 0, 9]} size={[12, 6, 5]} rotY={Math.PI / 2} windows={3} seed={1} />
      <Block pos={[7.5, 0, 9]} size={[12, 5, 5]} rotY={-Math.PI / 2} windows={3} seed={2} base="#dcbd86" />
      <Block pos={[-7.5, 0, 20]} size={[10, 4, 5]} rotY={Math.PI / 2} windows={2} seed={3} base="#e0c48e" />
      <Block pos={[7.5, 0, 20]} size={[10, 7, 5]} rotY={-Math.PI / 2} windows={2} seed={4} />
      <Gate pos={[0, 0, 0]} open={gate} wallW={10} />
      <Crate pos={[-3.4, 0, 6]} /><Crate pos={[-3.4, 0, 7.2]} s={0.9} /><Crate pos={[-3.4, 1.1, 6.1]} s={0.85} rotY={0.3} />
      <Barrel pos={[3.6, 0, 5.2]} /><Barrel pos={[3.9, 0, 6.1]} col="#8a3f3f" />
      <Palm pos={[-4, 0, 13]} seed={8} s={1.1} /><Bush pos={[3.8, 0, 11]} />
      {/* site A courtyard */}
      <Block pos={[0, 0, -24]} size={[16, 6, 5]} windows={0} seed={5} />
      <SiteLetter pos={[0, 3.0, -21.48]} s={3.2} />
      <Block pos={[-9.5, 0, -14]} size={[14, 5, 5]} rotY={Math.PI / 2} windows={0} seed={6} base="#dcbd86" />
      <ArchHole pos={[-6.98, 0, -15]} rotY={Math.PI / 2} w={2.6} h={3.2} />
      <Block pos={[10, 0, -15]} size={[14, 6, 5]} rotY={-Math.PI / 2} windows={2} seed={7} />
      <Crate pos={[-4.4, 0, -8.6]} /><Crate pos={[-4.4, 0, -9.8]} /><Crate pos={[-3.3, 0, -9.3]} s={0.9} /><Crate pos={[-4.4, 1.1, -9.2]} s={0.9} />
      <Crate pos={[3.2, 0, -18]} /><Barrel pos={[5.5, 0, -19]} />
      <Car kind="sedan" color="#d1c49a" pos={[4.4, 0, -10.2]} rotY={0.35} rust={0.5} />
      <Palm pos={[6, 0, -21]} seed={11} /><Bush pos={[-5.5, 0, -19.5]} s={1.2} />
      {/* far skyline */}
      {Array.from({ length: 14 }).map((_, i) => { const r = rng(i + 30); const a = (i / 14) * Math.PI * 2; return <Block key={'f' + i} pos={[Math.cos(a) * 34, 0, Math.sin(a) * 34 - 4]} size={[6 + r() * 6, 4 + r() * 6, 6]} rotY={-a + Math.PI / 2} windows={1} seed={i + 40} base={i % 2 ? '#d8b982' : STONE} />; })}
    </group>
  );
};
export { SAND, STONE, WOOD };
void rbox;
