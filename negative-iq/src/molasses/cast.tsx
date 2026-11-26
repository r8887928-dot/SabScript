import React, { createContext, useContext, useMemo } from 'react';
import * as THREE from 'three';
import { canvasTex, basic } from '../three/core';

// Flat 2D character cards (cartoon-3d-short look): bean heads, stick limbs, plum variable-width ink, camera-facing
// billboards standing in the 3D world. Design canvas 600×1000, soles at y = 975.
export const INK = '#241726';
export const CamCtx = createContext<number[]>([0, 2, 10]);

export type Expr = 'neutral' | 'happy' | 'shock' | 'sly' | 'sad' | 'scream' | 'sniff' | 'focus';
export type Role = 'kid' | 'girl' | 'owner' | 'worker' | 'cop' | 'runner' | 'engineer' | 'tourist' | 'lady';
export type CardPose = { expr?: Expr; armL?: number; armR?: number; walk?: number; stride?: number; blink?: boolean; prop?: 'stick' | 'brush' | 'pen' | 'none'; stuck?: number };

const LOOK: Record<Role, { skin: string; coat: string; pants: string; hat?: string; kid?: boolean; scarf?: string; extra?: string }> = {
  kid: { skin: '#f3d2b5', coat: '#3b6fb6', pants: '#4a3b30', hat: 'cap', kid: true, scarf: '#d8332b' },
  girl: { skin: '#f6dcc4', coat: '#b8336a', pants: '#3a2a2a', hat: 'beret', kid: true, scarf: '#f0c419' },
  owner: { skin: '#f1cfb0', coat: '#2b2b33', pants: '#1d1d22', hat: 'top', extra: 'mustache' },
  worker: { skin: '#e4b48f', coat: '#6b5a3a', pants: '#3a4a6a', hat: 'flat' },
  cop: { skin: '#f0c9a6', coat: '#1f3a6e', pants: '#1a2a4e', hat: 'helmet' },
  runner: { skin: '#eec39f', coat: '#7a4a2a', pants: '#3b3b3b', hat: 'bowler' },
  engineer: { skin: '#f3d6bd', coat: '#5a6a7a', pants: '#2b2b33', extra: 'glasses' },
  tourist: { skin: '#e9be98', coat: '#e4572e', pants: '#2e4057', extra: 'cap_mod' },
  lady: { skin: '#f6d8c0', coat: '#5c3a6e', pants: '#3a2a3a', hat: 'bonnet' },
};

function drawCard(g: CanvasRenderingContext2D, W: number, H: number, role: Role, p: CardPose) {
  const L = LOOK[role];
  g.clearRect(0, 0, W, H);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const kid = !!L.kid;
  const s = kid ? 0.78 : 1;
  const cx = W / 2;
  const headH = 270 * s, headW = 250 * s;
  const sole = 975, legLen = (kid ? 230 : 300);
  const hip = sole - legLen, bodyTop = hip - (kid ? 230 : 300) * 0.95;
  const headCy = bodyTop - headH * 0.38;
  const ph = p.walk ?? 0, st = (p.stride ?? 0);
  const stuck = p.stuck ?? 0;
  // legs (stick, thicker at the bottom side)
  g.strokeStyle = INK;
  const leg = (dx: number, a: number) => {
    const fx = cx + dx + Math.sin(a) * 70 * st, fy = sole - Math.max(0, Math.cos(a)) * 30 * st;
    g.lineWidth = 15; g.beginPath(); g.moveTo(cx + dx * 0.8, hip); g.lineTo(fx, fy); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.ellipse(fx + 14, fy + 4, 30 * s + 4, 13, 0, 0, 7); g.fill();
  };
  leg(-36 * s, ph); leg(36 * s, ph + Math.PI);
  // body bean
  g.fillStyle = L.coat; g.lineWidth = 12;
  g.beginPath(); g.ellipse(cx, (bodyTop + hip) / 2 + 10, 118 * s, (hip - bodyTop) / 2 + 30, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = 'rgba(20,10,30,0.16)'; g.beginPath(); g.ellipse(cx + 48 * s, (bodyTop + hip) / 2 + 20, 60 * s, (hip - bodyTop) / 2, 0, 0, 7); g.fill();
  if (role === 'worker') { g.fillStyle = '#3a4a6a'; g.fillRect(cx - 60, (bodyTop + hip) / 2, 120, (hip - bodyTop) / 2 + 20); }
  if (role === 'cop') { g.fillStyle = '#e7b52c'; for (const y of [0.35, 0.55, 0.75]) { g.beginPath(); g.arc(cx, bodyTop + (hip - bodyTop) * y, 8, 0, 7); g.fill(); } g.beginPath(); g.moveTo(cx - 70, bodyTop + 60); g.lineTo(cx - 40, bodyTop + 50); g.lineTo(cx - 55, bodyTop + 90); g.fill(); }
  if (role === 'owner') { g.fillStyle = '#f7f3ec'; g.beginPath(); g.moveTo(cx - 34, bodyTop + 4); g.lineTo(cx, bodyTop + 90); g.lineTo(cx + 34, bodyTop + 4); g.fill(); g.fillStyle = '#7a1f1f'; g.fillRect(cx - 8, bodyTop + 20, 16, 60); g.fillStyle = '#c9a227'; g.beginPath(); g.arc(cx + 40, bodyTop + 120, 7, 0, 7); g.fill(); }
  if (role === 'engineer') { g.fillStyle = '#f7f3ec'; g.beginPath(); g.moveTo(cx - 34, bodyTop + 4); g.lineTo(cx, bodyTop + 80); g.lineTo(cx + 34, bodyTop + 4); g.fill(); g.fillStyle = '#2e5a8a'; g.fillRect(cx - 9, bodyTop + 16, 18, 64); }
  if (L.scarf) { g.fillStyle = L.scarf; g.beginPath(); g.ellipse(cx, bodyTop + 14, 80 * s, 26, 0, 0, 7); g.fill(); g.stroke(); g.fillRect(cx + 30 * s, bodyTop + 14, 26, 80); }
  // arms: angle in degrees from straight down, positive = outward/up
  const arm = (side: number, deg: number) => {
    const sx = cx + side * 104 * s, sy = bodyTop + 50 * s;
    const a = (deg * Math.PI) / 180, len = 170 * s;
    const ex = sx + side * Math.sin(a) * len, ey = sy + Math.cos(a) * len;
    g.lineWidth = 13; g.strokeStyle = INK; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(ex, ey, 14, 0, 7); g.fill();
    return [ex, ey];
  };
  arm(-1, p.armL ?? 12);
  const [hx, hy] = arm(1, p.armR ?? 12);
  if (p.prop === 'stick') { g.strokeStyle = '#8a5a2b'; g.lineWidth = 8; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + 50, hy - 70); g.stroke(); g.fillStyle = '#5a2a0a'; g.beginPath(); g.arc(hx + 52, hy - 74, 16, 0, 7); g.fill(); }
  if (p.prop === 'brush') { g.strokeStyle = '#8a5a2b'; g.lineWidth = 9; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + 30, hy - 80); g.stroke(); g.fillStyle = '#5a2a0a'; g.fillRect(hx + 12, hy - 130, 44, 54); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(hx + 12, hy - 130, 44, 54); }
  if (p.prop === 'pen') { g.strokeStyle = '#1d1d1d'; g.lineWidth = 7; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + 30, hy - 50); g.stroke(); }
  // head: bean (h/w ~.94, narrower chin, slightly pointed crown)
  const hx0 = cx, hy0 = headCy;
  g.fillStyle = L.skin; g.strokeStyle = INK; g.lineWidth = 12;
  g.beginPath();
  g.moveTo(hx0 + 8, hy0 - headH / 2);
  g.bezierCurveTo(hx0 + headW * 0.62, hy0 - headH / 2, hx0 + headW * 0.6, hy0 + headH * 0.42, hx0 + 10, hy0 + headH / 2);
  g.bezierCurveTo(hx0 - headW * 0.5, hy0 + headH * 0.5, hx0 - headW * 0.62, hy0 - headH * 0.05, hx0 - headW * 0.5, hy0 - headH * 0.25);
  g.bezierCurveTo(hx0 - headW * 0.4, hy0 - headH * 0.48, hx0 - headW * 0.1, hy0 - headH / 2, hx0 + 8, hy0 - headH / 2);
  g.closePath(); g.fill(); g.stroke();
  g.save(); g.clip(); g.fillStyle = 'rgba(120,70,80,0.13)'; g.beginPath(); g.ellipse(hx0 + headW * 0.36, hy0 + 20, headW * 0.3, headH * 0.55, 0, 0, 7); g.fill(); g.restore();
  // face
  const e = p.expr ?? 'neutral';
  const ex = 0.26 * headW * 1.4, ey = hy0 - headH * 0.05;
  const eyeR = (e === 'shock' || e === 'scream') ? 30 * s : 24 * s;
  for (const side of [-1, 1]) {
    const x = hx0 + side * ex / 2 + 6;
    if (p.blink) { g.lineWidth = 8; g.beginPath(); g.moveTo(x - 18, ey); g.lineTo(x + 18, ey); g.stroke(); continue; }
    if (e === 'sly' && side === -1) { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 20, ey); g.quadraticCurveTo(x, ey - 8, x + 20, ey); g.stroke(); continue; }
    if (e === 'sniff') { g.lineWidth = 8; g.beginPath(); g.moveTo(x - 18, ey); g.quadraticCurveTo(x, ey + 10, x + 18, ey); g.stroke(); continue; }
    g.fillStyle = '#ffffff'; g.lineWidth = 7; g.beginPath(); g.ellipse(x, ey, eyeR, eyeR * 1.12, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(x + (e === 'focus' ? 0 : 4), ey + 3, eyeR * 0.45, 0, 7); g.fill();
  }
  // brows
  g.lineWidth = 10;
  const bt = e === 'shock' || e === 'scream' ? -16 : e === 'sad' ? 6 : 0;
  for (const side of [-1, 1]) {
    const x = hx0 + side * ex / 2 + 6, y = ey - eyeR * 1.6 + bt;
    const tilt = e === 'sad' ? side * -8 : e === 'sly' || e === 'focus' ? side * 8 : e === 'scream' ? side * -6 : 0;
    g.beginPath(); g.moveTo(x - 24, y - tilt); g.lineTo(x + 24, y + tilt); g.stroke();
  }
  if (L.extra === 'glasses') { g.strokeStyle = '#3a2a1a'; g.lineWidth = 6; for (const side of [-1, 1]) { g.beginPath(); g.arc(hx0 + side * ex / 2 + 6, ey, eyeR + 10, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(hx0 - 8, ey); g.lineTo(hx0 + 20, ey); g.stroke(); g.strokeStyle = INK; }
  // mouth
  const my = hy0 + headH * 0.24;
  g.lineWidth = 9; g.strokeStyle = INK;
  if (e === 'happy') { g.fillStyle = '#7a2a35'; g.beginPath(); g.moveTo(hx0 - 40, my - 6); g.quadraticCurveTo(hx0 + 5, my + 40, hx0 + 50, my - 6); g.closePath(); g.fill(); g.stroke(); }
  else if (e === 'shock') { g.fillStyle = '#5a1f2a'; g.beginPath(); g.ellipse(hx0 + 6, my + 6, 18, 24, 0, 0, 7); g.fill(); g.stroke(); }
  else if (e === 'scream') { g.fillStyle = '#5a1f2a'; g.beginPath(); g.ellipse(hx0 + 6, my + 10, 30, 38, 0, 0, 7); g.fill(); g.stroke(); }
  else if (e === 'sly') { g.beginPath(); g.moveTo(hx0 - 36, my + 6); g.quadraticCurveTo(hx0 + 10, my + 16, hx0 + 52, my - 12); g.stroke(); }
  else if (e === 'sad') { g.beginPath(); g.moveTo(hx0 - 30, my + 12); g.quadraticCurveTo(hx0 + 6, my - 8, hx0 + 42, my + 12); g.stroke(); }
  else if (e === 'sniff') { g.beginPath(); g.moveTo(hx0 - 20, my + 4); g.quadraticCurveTo(hx0 + 6, my + 14, hx0 + 32, my + 4); g.stroke(); }
  else { g.beginPath(); g.moveTo(hx0 - 26, my + 4); g.lineTo(hx0 + 36, my + 2); g.stroke(); }
  if (L.extra === 'mustache') { g.fillStyle = '#3a2418'; g.beginPath(); g.ellipse(hx0 - 18, my - 16, 30, 11, 0.25, 0, 7); g.fill(); g.beginPath(); g.ellipse(hx0 + 30, my - 16, 30, 11, -0.25, 0, 7); g.fill(); }
  // hats
  const top = hy0 - headH / 2;
  g.lineWidth = 10; g.strokeStyle = INK;
  if (L.hat === 'top') { g.fillStyle = '#1d1d22'; g.fillRect(hx0 - 80, top - 150, 170, 160); g.strokeRect(hx0 - 80, top - 150, 170, 160); g.beginPath(); g.ellipse(hx0 + 5, top + 10, 140, 22, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#7a1f1f'; g.fillRect(hx0 - 78, top - 30, 166, 24); }
  if (L.hat === 'bowler') { g.fillStyle = '#2b2018'; g.beginPath(); g.ellipse(hx0 + 5, top + 2, 115, 90, 0, Math.PI, 0); g.fill(); g.stroke(); g.beginPath(); g.ellipse(hx0 + 5, top + 6, 145, 18, 0, 0, 7); g.fill(); g.stroke(); }
  if (L.hat === 'flat' || L.hat === 'cap') { g.fillStyle = L.hat === 'cap' ? '#5a4a3a' : '#4a3a2a'; g.beginPath(); g.ellipse(hx0, top + 30 * s, 130 * s, 60 * s, 0, Math.PI, 0); g.fill(); g.stroke(); g.beginPath(); g.ellipse(hx0 + 70 * s, top + 32 * s, 70 * s, 16, 0, 0, 7); g.fill(); g.stroke(); }
  if (L.hat === 'helmet') { g.fillStyle = '#1f3a6e'; g.beginPath(); g.moveTo(hx0 - 120, top + 30); g.quadraticCurveTo(hx0, top - 200, hx0 + 130, top + 30); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e7b52c'; g.beginPath(); g.arc(hx0 + 5, top - 40, 20, 0, 7); g.fill(); }
  if (L.hat === 'beret') { g.fillStyle = '#d8332b'; g.beginPath(); g.ellipse(hx0 + 10, top + 14, 120 * s, 46 * s, -0.15, 0, 7); g.fill(); g.stroke(); }
  if (L.hat === 'bonnet') { g.fillStyle = '#5c3a6e'; g.beginPath(); g.ellipse(hx0 + 5, top + 20, 150, 70, 0, Math.PI, 0); g.fill(); g.stroke(); g.fillStyle = '#f0c419'; g.beginPath(); g.arc(hx0 + 90, top - 10, 18, 0, 7); g.fill(); }
  if (L.extra === 'cap_mod') { g.fillStyle = '#2e4057'; g.beginPath(); g.ellipse(hx0, top + 26, 130, 56, 0, Math.PI, 0); g.fill(); g.stroke(); g.beginPath(); g.ellipse(hx0 + 90, top + 30, 80, 15, 0, 0, 7); g.fill(); g.stroke(); }
  // stuck in molasses: brown goo covering legs up to the hips
  if (stuck > 0) {
    const gy = sole - (legLen + 80) * stuck;
    const grd = g.createLinearGradient(0, gy, 0, H); grd.addColorStop(0, '#6b3410'); grd.addColorStop(1, '#3a1806');
    g.fillStyle = grd; g.beginPath(); g.moveTo(0, gy + 20);
    for (let x = 0; x <= W; x += 40) g.quadraticCurveTo(x + 20, gy - 18 + ((x / 40) % 2) * 26, x + 40, gy + 10);
    g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,220,170,0.45)'; g.fillRect(cx - 160, gy + 18, 140, 8);
  }
}

/** a camera-facing 2D character standing on the ground at pos. height in metres (adult 1.8) */
export const Card: React.FC<{ role: Role; pos: number[]; pose?: CardPose; h?: number; f?: number; shadow?: boolean }> = ({ role, pos, pose = {}, h, f = 0, shadow = true }) => {
  const cam = useContext(CamCtx);
  const kid = !!LOOK[role].kid;
  const hh = h ?? (kid ? 1.25 : 1.85);
  const blink = pose.blink ?? ((f + role.length * 17) % 67) < 4;
  const q = (v: number | undefined, n = 6) => Math.round((v ?? 0) * n) / n;
  const p = { ...pose, blink, walk: q(pose.walk, 4), armL: Math.round(pose.armL ?? 12), armR: Math.round(pose.armR ?? 12), stuck: q(pose.stuck, 10) };
  const key = `mc_${role}_${p.expr}_${p.armL}_${p.armR}_${p.walk}_${q(p.stride, 4)}_${p.blink ? 1 : 0}_${p.prop}_${p.stuck}`;
  const tex = canvasTex(key, 600, 1000, (g, W, H) => drawCard(g, W, H, role, p));
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.45, roughness: 0.95, side: THREE.DoubleSide }), []);
  mat.map = tex; mat.needsUpdate = true;
  const yaw = Math.atan2(cam[0] - pos[0], cam[2] - pos[2]);
  const w = hh * 0.6;
  return (
    <group position={pos as any}>
      <mesh rotation={[0, yaw, 0]} position={[0, hh / 2, 0]} material={mat} castShadow><planeGeometry args={[w, hh]} /></mesh>
      {shadow && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={basic('#1a0e10', { t: 0.4 })}><circleGeometry args={[w * 0.32, 20]} /></mesh>}
    </group>
  );
};

// ------------------------------------------------------------------ dog card (side view, faces +x of the card; flip mirrors)
export type DogPose = { run?: number; carrot?: boolean; expr?: 'sly' | 'shock' | 'sad' | 'happy'; scarf?: boolean; blink?: boolean };
function drawDog(g: CanvasRenderingContext2D, W: number, H: number, p: DogPose) {
  g.clearRect(0, 0, W, H); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK;
  const r = p.run ?? 0, base = 560;
  const bob = Math.abs(Math.sin(r)) * 14;
  // legs
  g.lineWidth = 16;
  const legs: [number, number][] = [[230, r], [300, r + Math.PI], [480, r + Math.PI], [550, r]];
  for (const [x, ph] of legs) { const sw = Math.sin(ph) * 40 * (p.run !== undefined ? 1 : 0); g.beginPath(); g.moveTo(x, 420 - bob); g.lineTo(x + sw, base); g.stroke(); g.fillStyle = INK; g.beginPath(); g.ellipse(x + sw + 10, base + 4, 22, 10, 0, 0, 7); g.fill(); }
  // tail
  g.lineWidth = 18; g.beginPath(); g.moveTo(190, 360 - bob); g.quadraticCurveTo(120, 300 - bob + Math.sin(r * 2) * 30, 110, 230 - bob); g.stroke();
  // body
  g.fillStyle = '#c98a4b'; g.lineWidth = 12; g.beginPath(); g.ellipse(390, 360 - bob, 210, 95, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#f3e2c8'; g.beginPath(); g.ellipse(420, 400 - bob, 120, 40, 0, 0, 7); g.fill();
  g.fillStyle = '#8a5a2b'; g.beginPath(); g.ellipse(330, 320 - bob, 60, 40, 0.3, 0, 7); g.fill();
  if (p.scarf) { g.fillStyle = '#d8332b'; g.beginPath(); g.ellipse(560, 320 - bob, 50, 70, 0.4, 0, 7); g.fill(); g.stroke(); g.fillRect(540, 340 - bob, 30, 110); }
  // head
  const hx = 640, hy = 220 - bob;
  g.fillStyle = '#c98a4b'; g.beginPath(); g.ellipse(hx, hy, 115, 105, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#f3e2c8'; g.beginPath(); g.ellipse(hx + 80, hy + 40, 75, 50, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.ellipse(hx + 145, hy + 22, 22, 16, 0, 0, 7); g.fill();
  g.fillStyle = '#6b3e1a'; g.beginPath(); g.ellipse(hx - 70, hy - 20, 38, 95, 0.35, 0, 7); g.fill(); g.stroke();
  // eye + brow
  const e = p.expr ?? 'happy';
  if (p.blink) { g.lineWidth = 9; g.beginPath(); g.moveTo(hx + 5, hy - 25); g.lineTo(hx + 50, hy - 25); g.stroke(); }
  else { g.fillStyle = '#fff'; g.lineWidth = 7; g.beginPath(); g.ellipse(hx + 28, hy - 28, e === 'shock' ? 30 : 24, e === 'sly' ? 14 : (e === 'shock' ? 34 : 26), 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(hx + 36, hy - 26, e === 'shock' ? 9 : 11, 0, 7); g.fill(); }
  g.lineWidth = 10; g.beginPath();
  if (e === 'sly') { g.moveTo(hx - 5, hy - 62); g.lineTo(hx + 60, hy - 50); } else if (e === 'sad') { g.moveTo(hx - 5, hy - 50); g.lineTo(hx + 60, hy - 66); } else if (e === 'shock') { g.moveTo(hx, hy - 82); g.lineTo(hx + 60, hy - 86); } else { g.moveTo(hx, hy - 64); g.lineTo(hx + 60, hy - 64); }
  g.stroke();
  // mouth / carrot
  if (p.carrot) { g.fillStyle = '#f07a1a'; g.beginPath(); g.moveTo(hx + 110, hy + 62); g.lineTo(hx + 300, hy + 40); g.lineTo(hx + 110, hy + 92); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#3f8a2a'; g.beginPath(); g.ellipse(hx + 100, hy + 76, 26, 12, 0.4, 0, 7); g.fill(); }
  else if (e === 'shock') { g.fillStyle = '#5a1f2a'; g.beginPath(); g.ellipse(hx + 100, hy + 78, 24, 18, 0, 0, 7); g.fill(); g.stroke(); }
  else { g.lineWidth = 8; g.beginPath(); g.moveTo(hx + 60, hy + 72); g.quadraticCurveTo(hx + 100, hy + (e === 'sad' ? 62 : 90), hx + 140, hy + 70); g.stroke(); }
}
/** dog card standing at pos; dir +1 faces +x in world, −1 faces −x */
export const Dog: React.FC<{ pos: number[]; pose?: DogPose; dir?: number; f?: number; h?: number }> = ({ pos, pose = {}, dir = 1, f = 0, h = 0.9 }) => {
  const cam = useContext(CamCtx);
  const blink = pose.blink ?? (f % 59) < 4;
  const run = pose.run === undefined ? undefined : Math.round((pose.run % (Math.PI * 2)) * 2) / 2;
  const key = `dog_${run}_${pose.carrot ? 1 : 0}_${pose.expr}_${pose.scarf ? 1 : 0}_${blink ? 1 : 0}`;
  const tex = canvasTex(key, 1000, 600, (g, W, H) => drawDog(g, W, H, { ...pose, run, blink }));
  const m = useMemo(() => new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.45, roughness: 0.95, side: THREE.DoubleSide }), []);
  m.map = tex; m.needsUpdate = true;
  const yaw = Math.atan2(cam[0] - pos[0], cam[2] - pos[2]);
  // mirror so the dog's nose points along world dir as seen from the camera
  const camRight = Math.cos(yaw);
  const sx = Math.sign(camRight * dir) || 1;
  const w = h * (1000 / 600) * 0.96;
  return (
    <group position={pos as any}>
      <mesh rotation={[0, yaw, 0]} scale={[sx, 1, 1]} position={[0, h / 2 - h * 0.04, 0]} material={m} castShadow><planeGeometry args={[w, h]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={basic('#1a0e10', { t: 0.35 })}><circleGeometry args={[w * 0.3, 20]} /></mesh>
    </group>
  );
};
