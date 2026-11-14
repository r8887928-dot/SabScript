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
      <mesh position={[0, 0.25, 0]} material={mat(STONE_D, { r: 0.95 })} receiveShadow><boxGeometry args={[w + 0.08, 0.5, d + 0.08]} /></mesh>
      {Array.from({ length: Math.max(2, Math.floor(w / 1.6)) }).map((_, i, arr) => <mesh key={'bm' + i} position={[(i - (arr.length - 1) / 2) * (w / arr.length), h - 0.45, d / 2 + 0.22]} material={mat('#6b4423', { r: 0.9 })} castShadow><boxGeometry args={[0.16, 0.16, 0.5]} /></mesh>)}
      {windows > 0 && <Lamp pos={[w / 2 - 0.8, h * 0.62, d / 2]} />}
      {windows > 1 && seed % 2 === 1 && <Awning pos={[-(w / Math.max(1, windows)) * ((windows - 1) / 2), h * 0.45 + 1.0, d / 2]} w={1.8} col={seed % 4 === 1 ? '#c0392b' : '#2e6f9e'} />}
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

const cobbleTex = (key: string, base: string) => canvasTex(key, 512, 512, (g, w, h) => {
  g.fillStyle = '#9c7f55'; g.fillRect(0, 0, w, h);
  const r = rng(key.length * 31);
  const n = 8, cw = w / n;
  for (let j = 0; j < n * 2; j++) for (let i = -1; i < n + 1; i++) {
    const x = i * cw + (j % 2) * cw / 2 + (r() - 0.5) * 6, y = j * (h / (n * 2)) + (r() - 0.5) * 4;
    const c = new THREE.Color(base).offsetHSL((r() - 0.5) * 0.02, (r() - 0.5) * 0.08, (r() - 0.5) * 0.1).getStyle();
    g.fillStyle = c; g.beginPath(); (g as any).roundRect(x + 3, y + 3, cw - 6, h / (n * 2) - 6, 8); g.fill();
    g.fillStyle = 'rgba(255,250,235,0.18)'; g.fillRect(x + 8, y + 5, cw - 22, 4);
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,65,35,${0.05 + r() * 0.12})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 50, 6 + r() * 26, r(), 0, 7); g.fill(); }
}, { repeat: true });
/** a flat paved area lying on the ground */
const Paving: React.FC<{ pos: number[]; size: number[]; base?: string }> = ({ pos, size, base = '#cfae78' }) => {
  const m = useMemo(() => { const t = cobbleTex('cs_cobble_' + base, base).clone(); t.repeat.set(size[0] / 2.2, size[1] / 2.2); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1 }); }, [base, size[0], size[1]]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos[0], 0.012, pos[1]]} material={m} receiveShadow><planeGeometry args={[size[0], size[1]]} /></mesh>;
};
/** soft dark dirt patch on the ground */
const Dirt: React.FC<{ pos: number[]; s?: number[]; o?: number }> = ({ pos, s = [3, 1.5], o = 0.25 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos[0], 0.02, pos[1]]} material={useMemo(() => new THREE.MeshBasicMaterial({ map: canvasTex('cs_dirt', 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(110,78,40,1)'); gr.addColorStop(1, 'rgba(110,78,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, opacity: o, depthWrite: false }), [o])}><planeGeometry args={[s[0], s[1]]} /></mesh>
);
export const Sandbags: React.FC<{ pos: number[]; n?: number; rows?: number; rotY?: number }> = ({ pos, n = 4, rows = 2, rotY = 0 }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    {Array.from({ length: rows }).map((_, j) => Array.from({ length: n - j }).map((_, i) => (
      <mesh key={j + '_' + i} geometry={rbox(0.62, 0.22, 0.36, 0.1)} position={[(i - (n - j - 1) / 2) * 0.6, 0.11 + j * 0.21, (j % 2) * 0.03]} rotation={[0, ((i + j) % 3 - 1) * 0.06, 0]} material={mat(j % 2 ? '#a99266' : '#b59e70', { r: 0.95 })} castShadow receiveShadow />
    )))}
  </group>
);
export const Pallet: React.FC<{ pos: number[]; rotY?: number; stack?: number }> = ({ pos, rotY = 0, stack = 1 }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    {Array.from({ length: stack }).map((_, k) => (
      <group key={k} position={[0, k * 0.16, 0]}>
        {[-0.45, 0, 0.45].map((x) => <mesh key={x} position={[x, 0.05, 0]} material={mat('#7a5230', { r: 0.9 })} castShadow><boxGeometry args={[0.12, 0.1, 1.1]} /></mesh>)}
        {[-0.45, -0.22, 0, 0.22, 0.45].map((z) => <mesh key={'t' + z} position={[0, 0.125, z]} material={mat('#9a6a3c', { r: 0.9 })} castShadow receiveShadow><boxGeometry args={[1.1, 0.04, 0.16]} /></mesh>)}
      </group>
    ))}
  </group>
);
const Jar: React.FC<{ pos: number[]; s?: number; col?: string }> = ({ pos, s = 1, col = '#b5643a' }) => (
  <group position={pos as any} scale={[s, s, s]}>
    <mesh position={[0, 0.35, 0]} scale={[1, 1.25, 1]} material={mat(col, { r: 0.8 })} castShadow><sphereGeometry args={[0.28, 16, 12]} /></mesh>
    <mesh position={[0, 0.72, 0]} material={mat(col, { r: 0.8 })}><cylinderGeometry args={[0.1, 0.14, 0.16, 12]} /></mesh>
  </group>
);
const Tire: React.FC<{ pos: number[]; flat?: boolean }> = ({ pos, flat = true }) => (
  <mesh position={[pos[0], pos[1] + (flat ? 0.12 : 0.36), pos[2]]} rotation={flat ? [Math.PI / 2, 0, 0] : [0, 0.4, 0]} material={mat('#262626', { r: 0.8 })} castShadow><torusGeometry args={[0.28, 0.12, 8, 18]} /></mesh>
);
/** striped canvas awning sticking out of a wall (face +z) */
const Awning: React.FC<{ pos: number[]; w?: number; rotY?: number; col?: string }> = ({ pos, w = 2.2, rotY = 0, col = '#c0392b' }) => {
  const t = useMemo(() => canvasTex('cs_awn_' + col, 256, 64, (g, W, H) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f3ead7' : col; g.fillRect(i * W / 8, 0, W / 8, H); } g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, H - 8, W, 8); }), [col]);
  return (
    <group position={pos as any} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, 0.55]} rotation={[0.5, 0, 0]} material={useMemo(() => new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide }), [t])} castShadow><planeGeometry args={[w, 1.25]} /></mesh>
      {[-1, 1].map((sd) => <mesh key={sd} position={[sd * w / 2, -0.25, 0.55]} rotation={[0.5, 0, 0]} material={mat('#5a3d22')}><boxGeometry args={[0.04, 0.04, 1.3]} /></mesh>)}
    </group>
  );
};
/** wall lamp (face +z) */
const Lamp: React.FC<{ pos: number[]; rotY?: number }> = ({ pos, rotY = 0 }) => (
  <group position={pos as any} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0, 0.18]} material={mat('#2b2b2b', { r: 0.5, m: 0.5 })}><boxGeometry args={[0.05, 0.05, 0.36]} /></mesh>
    <mesh position={[0, -0.1, 0.36]} material={mat('#2b2b2b', { r: 0.5, m: 0.5 })}><coneGeometry args={[0.16, 0.16, 12, 1, true]} /></mesh>
    <mesh position={[0, -0.16, 0.36]} material={basic('#ffe7a8')}><sphereGeometry args={[0.07, 10, 8]} /></mesh>
  </group>
);
/** sagging cable between two points */
const Cable: React.FC<{ a: number[]; b: number[]; sag?: number }> = ({ a, b, sag = 0.8 }) => {
  const g = useMemo(() => { const pts = Array.from({ length: 16 }).map((_, i) => { const t = i / 15; return new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t); }); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.025, 5, false); }, [a.join(), b.join(), sag]);
  return <mesh geometry={g} material={mat('#1d1d1d', { r: 0.6 })} />;
};
const Cloud: React.FC<{ pos: number[]; s?: number }> = ({ pos, s = 1 }) => (
  <group position={pos as any} scale={[s, s * 0.55, s]}>{[[-1.2, 0, 0, 1.1], [0, 0.35, 0, 1.4], [1.3, 0, 0, 1.0], [0.4, -0.2, 0.6, 1.0]].map(([x, y, z, r], i) => <mesh key={i} position={[x, y, z]} material={basic('#ffffff', { t: 0.92 })}><sphereGeometry args={[r, 12, 10]} /></mesh>)}</group>
);
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
      <Car kind="sedan" color="#d1c49a" pos={[3.74, 0, -8.75]} rotY={-1.0} rust={0.5} />
      <Palm pos={[6, 0, -21]} seed={11} /><Bush pos={[-5.5, 0, -19.5]} s={1.2} />
      {/* paving, dirt and clutter */}
      <Paving pos={[0, 8]} size={[8.6, 14]} />
      <Paving pos={[0, -12.5]} size={[13, 17]} base="#d4b47f" />
      <Dirt pos={[-4.4, 9]} s={[2.4, 9]} o={0.3} /><Dirt pos={[4.4, 9]} s={[2.4, 9]} o={0.3} /><Dirt pos={[-6, -14]} s={[2, 12]} o={0.3} /><Dirt pos={[7, -14]} s={[2, 12]} o={0.3} /><Dirt pos={[0, -20.5]} s={[14, 2]} o={0.3} />
      <Dirt pos={[3.74, -8.75]} s={[3.2, 5]} o={0.35} />
      <Sandbags pos={[2.8, 0, 2.1]} n={4} rows={2} /><Sandbags pos={[-5.2, 0, -5.4]} n={3} rows={2} rotY={0.4} />
      <Pallet pos={[3.6, 0, 9.4]} rotY={0.3} stack={3} /><Pallet pos={[-5.3, 0, -18.6]} rotY={-0.2} stack={2} />
      <Jar pos={[-4.2, 0, 11.2]} /><Jar pos={[-3.7, 0, 11.6]} s={0.8} col="#9c5a34" /><Jar pos={[6.3, 0, -17.8]} s={0.9} />
      <Tire pos={[4.6, 0, 4.2]} /><Tire pos={[4.6, 0.24, 4.2]} /><Tire pos={[1.4, 0, -19.6]} flat={false} />
      <Barrel pos={[-5.6, 0, -11.6]} col="#5d7d3a" /><Barrel pos={[-5.2, 0, -12.3]} />
      <Cable a={[-5, 5.6, 6]} b={[5, 4.8, 7]} /><Cable a={[-5, 5.4, 12]} b={[5, 4.8, 11]} sag={1.0} /><Cable a={[-7, 4.8, -9]} b={[7.5, 5.8, -10]} sag={1.2} />
      <Awning pos={[-3.6, 3.0, 0.42]} w={1.8} col="#2e6f9e" /><Lamp pos={[2.2, 3.4, 0.42]} /><Lamp pos={[-2.2, 3.4, -0.42]} rotY={Math.PI} />
      <Lamp pos={[-3.5, 3.6, -21.5]} /><Lamp pos={[3.5, 3.6, -21.5]} />
      <Cloud pos={[-30, 34, -60]} s={6} /><Cloud pos={[18, 40, -70]} s={7} /><Cloud pos={[40, 30, -20]} s={5} /><Cloud pos={[-38, 36, 30]} s={6} /><Cloud pos={[10, 42, 60]} s={7} />
      {/* far skyline */}
      {Array.from({ length: 14 }).map((_, i) => { const r = rng(i + 30); const a = (i / 14) * Math.PI * 2; return <Block key={'f' + i} pos={[Math.cos(a) * 34, 0, Math.sin(a) * 34 - 4]} size={[6 + r() * 6, 4 + r() * 6, 6]} rotY={-a + Math.PI / 2} windows={1} seed={i + 40} base={i % 2 ? '#d8b982' : STONE} />; })}
    </group>
  );
};
export { SAND, STONE, WOOD };
void rbox;
