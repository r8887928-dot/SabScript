import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mat, outlineMat, basic, Blob } from './core';
import { rng, hash, lerp } from '../lib/anim';

// ------------------------------------------------------------------ shared geometry
const G: Record<string, THREE.BufferGeometry> = {};
const geo = (k: string, make: () => THREE.BufferGeometry) => (G[k] ||= make());
const cap = (r: number, l: number) => geo(`cap${r}_${l}`, () => new THREE.CapsuleGeometry(r, l, 6, 14));
const sph = (r: number, w = 20, h = 14) => geo(`sph${r}_${w}`, () => new THREE.SphereGeometry(r, w, h));
const box = (x: number, y: number, z: number) => geo(`box${x}_${y}_${z}`, () => new THREE.BoxGeometry(x, y, z));
const halfSph = (r: number) => geo(`hs${r}`, () => new THREE.SphereGeometry(r, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.56));
const arc = (r: number, t: number, a: number) => geo(`arc${r}_${t}_${a}`, () => new THREE.TorusGeometry(r, t, 8, 18, a));

const OL = 0.016;
/** mesh + optional cartoon outline */
const M: React.FC<{ g: THREE.BufferGeometry; m: THREE.Material; p?: number[]; r?: number[]; s?: number[]; ol?: number; shadow?: boolean }> = ({ g, m, p, r, s, ol, shadow = true }) => (
  <group position={p as any} rotation={r as any} scale={s as any}>
    <mesh geometry={g} material={m} castShadow={shadow} receiveShadow />
    {ol ? <mesh geometry={g} material={outlineMat(ol)} /> : null}
  </group>
);

// ------------------------------------------------------------------ looks
export type LookP = {
  skin: string; hair: string; hairStyle: 'short' | 'long' | 'bun' | 'bald' | 'curly' | 'cap'; shirt: string; pants: string; shoes: string;
  kid?: boolean; tie?: string; coat?: 'lab' | 'none'; backpack?: string; glasses?: boolean; hat?: string; skirt?: boolean; scale?: number;
};
const SKIN = ['#f2c7a5', '#e8b48f', '#c98d66', '#8d5a3b', '#f6d3b8', '#d9a07a', '#b5774f'];
const HAIR = ['#2b1d16', '#4a2f1d', '#b07a3a', '#151515', '#7a3b22', '#d4b06a', '#6b6b6b'];
const SHIRT = ['#e4572e', '#3f88c5', '#f3a712', '#4caf50', '#8e5ec7', '#ef476f', '#26a69a', '#f1f1f1', '#2e4057', '#ff8c42', '#5c80bc'];
const PANTS = ['#2e4057', '#3b3b3b', '#5b4636', '#1f3a5f', '#6b6b6b', '#4a4e69'];
export function randomLook(seed: number, o: Partial<LookP> = {}): LookP {
  const r = rng(seed * 9301 + 49297);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const fem = r() < 0.48;
  return {
    skin: pick(SKIN), hair: pick(HAIR), hairStyle: fem ? pick(['long', 'bun', 'curly', 'long'] as const) : pick(['short', 'short', 'bald', 'curly', 'cap'] as const),
    shirt: pick(SHIRT), pants: pick(PANTS), shoes: pick(['#2a2a2a', '#5a3b2a', '#eeeeee', '#3a3a5a']), skirt: fem && r() < 0.35, ...o,
  };
}

// ------------------------------------------------------------------ poses
export type Pose = {
  legL?: number; legR?: number; kneeL?: number; kneeR?: number;
  armL?: number[]; armR?: number[]; // [forward, out, elbow]
  head?: number[]; // [pitch(+down), yaw, roll]
  body?: number[]; // [lean fwd, twist, tilt]
  bob?: number; y?: number;
  eyeA?: number[]; eyeB?: number[]; blink?: number; mouth?: 'smile' | 'open' | 'flat' | 'frown' | 'O' | 'grin' | 'dumb';
  brows?: number[]; // [angA, angB, raise]
  squash?: number;
};
export const EXPR: Record<string, Pose> = {
  neutral: { mouth: 'flat', brows: [0, 0, 0], eyeA: [0, 0], eyeB: [0, 0] },
  happy: { mouth: 'smile', brows: [0.1, -0.1, 0.01], eyeA: [0, 0.005], eyeB: [0, 0.005] },
  grin: { mouth: 'grin', brows: [0.15, -0.15, 0.015], eyeA: [0, 0.005], eyeB: [0, 0.005] },
  dumb: { mouth: 'dumb', brows: [-0.35, 0.3, 0.02], eyeA: [0.024, 0.012], eyeB: [-0.02, -0.018] },
  dumb2: { mouth: 'dumb', brows: [0.4, 0.4, 0.03], eyeA: [-0.02, 0.022], eyeB: [0.024, -0.01] },
  confused: { mouth: 'frown', brows: [0.45, -0.1, 0.02], eyeA: [0.012, 0.02], eyeB: [0.012, 0.02] },
  shock: { mouth: 'O', brows: [0.3, -0.3, 0.04], eyeA: [0, 0], eyeB: [0, 0] },
  sad: { mouth: 'frown', brows: [-0.35, 0.35, 0.01], eyeA: [0, -0.015], eyeB: [0, -0.015] },
};
/** walk cycle: phase in radians */
export function walk(ph: number, amp = 1): Pose {
  const s = Math.sin(ph), c = Math.cos(ph);
  return {
    legL: 0.5 * s * amp, legR: -0.5 * s * amp, kneeL: Math.max(0, -c) * 0.5 * amp, kneeR: Math.max(0, c) * 0.5 * amp,
    armL: [-0.42 * s * amp, 0.08, 0.25 + 0.15 * amp], armR: [0.42 * s * amp, 0.08, 0.25 + 0.15 * amp],
    bob: Math.abs(c) * 0.045 * amp, body: [0.05 * amp, 0.08 * s * amp, 0],
  };
}
export function run(ph: number): Pose {
  const s = Math.sin(ph), c = Math.cos(ph);
  return {
    legL: 0.85 * s, legR: -0.85 * s, kneeL: Math.max(0, -c) * 1.1, kneeR: Math.max(0, c) * 1.1,
    armL: [-0.8 * s, 0.1, 1.3], armR: [0.8 * s, 0.1, 1.3], bob: Math.abs(c) * 0.09, body: [0.22, 0.12 * s, 0],
  };
}
export function idle(f: number, seed: number): Pose {
  const t = f / 30 + seed * 7.3;
  return { body: [0.02 * Math.sin(t * 0.9), 0.04 * Math.sin(t * 0.6), 0.02 * Math.sin(t * 0.7)], head: [0.04 * Math.sin(t * 0.8), 0.12 * Math.sin(t * 0.45 + seed), 0.03 * Math.sin(t * 0.5)], armL: [0.05, 0.1, 0.15], armR: [0.05, 0.1, 0.15], blink: blinkAt(f, seed) };
}
export function blinkAt(f: number, seed: number) {
  const period = 50 + Math.floor(hash(seed) * 45);
  const ph = (f + Math.floor(hash(seed + 3) * 60)) % period;
  return ph < 4 ? [0.5, 1, 1, 0.5][ph] : 0;
}
export const merge = (...ps: Pose[]): Pose => Object.assign({}, ...ps);

// ------------------------------------------------------------------ the character
export const Person: React.FC<{
  look: LookP; pose?: Pose; pos?: number[]; rotY?: number; ol?: boolean; olWidth?: number; propR?: React.ReactNode; propL?: React.ReactNode; above?: React.ReactNode; shadow?: boolean; blob?: boolean;
}> = ({ look, pose = {}, pos = [0, 0, 0], rotY = 0, ol = true, olWidth = OL, propR, propL, above, shadow = true, blob = true }) => {
  const sc = (look.scale ?? 1) * (look.kid ? 0.66 : 1);
  const o = ol ? olWidth / sc : 0;
  const skin = mat(look.skin, { r: 0.65 });
  const shirt = mat(look.coat === 'lab' ? '#f4f6f7' : look.shirt, { r: 0.85 });
  const pants = mat(look.pants, { r: 0.85 });
  const shoes = mat(look.shoes, { r: 0.55 });
  const hair = mat(look.hair, { r: 0.7 });
  const white = mat('#ffffff', { r: 0.25 });
  const black = mat('#141018', { r: 0.3 });
  const mouthM = mat('#3a1520', { r: 0.6 });
  const P = { ...EXPR.neutral, ...pose };
  const [lean, twist, tilt] = P.body ?? [0, 0, 0];
  const [hp, hy, hr] = P.head ?? [0, 0, 0];
  const aL = P.armL ?? [0, 0.08, 0.15], aR = P.armR ?? [0, 0.08, 0.15];
  const bl = 1 - (P.blink ?? 0) * 0.92;
  const eA = P.eyeA ?? [0, 0], eB = P.eyeB ?? [0, 0];
  const [bA, bB, bRaise] = P.brows ?? [0, 0, 0];
  const headScale = look.kid ? 1.18 : 1;
  const hipY = 0.8;
  const leg = (side: number, swing: number, knee: number) => (
    <group position={[side * 0.095, hipY, 0]} rotation={[-swing, 0, 0]}>
      <M g={cap(0.072, 0.3)} m={look.skirt ? skin : pants} p={[0, -0.2, 0]} ol={o} shadow={shadow} />
      <group position={[0, -0.4, 0]} rotation={[knee, 0, 0]}>
        <M g={cap(0.066, 0.26)} m={look.skirt ? skin : pants} p={[0, -0.17, 0]} ol={o} shadow={shadow} />
        <M g={box(0.12, 0.085, 0.24)} m={shoes} p={[0, -0.355, 0.045]} ol={o} shadow={shadow} />
      </group>
    </group>
  );
  const arm = (side: number, a: number[], prop?: React.ReactNode) => (
    <group position={[side * 0.235, 1.33, 0]} rotation={[-a[0], 0, side * a[1]]}>
      <M g={cap(0.054, 0.2)} m={look.coat === 'lab' ? shirt : shirt} p={[0, -0.14, 0]} ol={o} shadow={shadow} />
      <group position={[0, -0.28, 0]} rotation={[-(a[2] ?? 0), 0, 0]}>
        <M g={cap(0.048, 0.18)} m={look.coat === 'lab' ? shirt : skin} p={[0, -0.12, 0]} ol={o} shadow={shadow} />
        <M g={sph(0.06, 12, 10)} m={skin} p={[0, -0.27, 0]} ol={o} shadow={shadow} />
        {prop ? <group position={[0, -0.3, 0.02]}>{prop}</group> : null}
      </group>
    </group>
  );
  const mouth = () => {
    const y = -0.085;
    switch (P.mouth) {
      case 'smile': return <M g={arc(0.055, 0.013, Math.PI)} m={mouthM} p={[0, y + 0.03, 0.188]} r={[0, 0, Math.PI]} />;
      case 'grin': return <M g={sph(0.06, 16, 10)} m={mouthM} p={[0, y + 0.005, 0.17]} s={[1.1, 0.55, 0.5]} />;
      case 'frown': return <M g={arc(0.045, 0.012, Math.PI)} m={mouthM} p={[0, y - 0.02, 0.188]} />;
      case 'O': return <M g={sph(0.045, 14, 10)} m={mouthM} p={[0, y - 0.01, 0.175]} s={[0.8, 1.05, 0.5]} />;
      case 'open': return <M g={sph(0.05, 14, 10)} m={mouthM} p={[0, y, 0.175]} s={[1, 0.6, 0.5]} />;
      case 'dumb': return (
        <group>
          <M g={sph(0.05, 14, 10)} m={mouthM} p={[0.01, y - 0.01, 0.172]} s={[1.05, 0.7, 0.5]} r={[0, 0, 0.15]} />
          <M g={sph(0.03, 12, 8)} m={mat('#e2687a', { r: 0.5 })} p={[0.025, y - 0.035, 0.19]} s={[1, 0.6, 0.6]} />
        </group>
      );
      default: return <M g={box(0.07, 0.014, 0.02)} m={mouthM} p={[0, y, 0.19]} />;
    }
  };
  const hairEl = () => {
    switch (look.hairStyle) {
      case 'bald': return null;
      case 'cap': return (
        <group>
          <M g={halfSph(0.208)} m={mat(look.hat ?? '#d33', { r: 0.7 })} p={[0, 0.02, 0]} ol={o} />
          <M g={box(0.2, 0.02, 0.16)} m={mat(look.hat ?? '#d33', { r: 0.7 })} p={[0, 0.07, 0.2]} ol={o} />
        </group>
      );
      case 'long': return (
        <group>
          <M g={halfSph(0.214)} m={hair} p={[0, 0.02, -0.01]} r={[-0.5, 0, 0]} ol={o} />
          <M g={box(0.38, 0.32, 0.12)} m={hair} p={[0, -0.12, -0.12]} ol={o} />
        </group>
      );
      case 'bun': return (
        <group>
          <M g={halfSph(0.213)} m={hair} p={[0, 0.02, -0.01]} r={[-0.5, 0, 0]} ol={o} />
          <M g={sph(0.09)} m={hair} p={[0, 0.2, -0.1]} ol={o} />
        </group>
      );
      case 'curly': return (
        <group>
          {[[-0.12, 0.1, 0.02], [0, 0.16, 0.02], [0.12, 0.1, 0.02], [-0.08, 0.12, -0.1], [0.08, 0.12, -0.1], [0, 0.06, -0.16], [-0.15, 0.0, -0.08], [0.15, 0.0, -0.08]].map((q, i) => (
            <M key={i} g={sph(0.095, 12, 10)} m={hair} p={q} ol={o} />
          ))}
        </group>
      );
      default: return <M g={halfSph(0.212)} m={hair} p={[0, 0.03, -0.02]} r={[-0.62, 0, 0]} ol={o} />;
    }
  };
  return (
    <group position={pos as any} rotation={[0, rotY, 0]} scale={[sc, sc * (1 - (P.squash ?? 0)), sc * (1 + (P.squash ?? 0) * 0.5)]}>
      {blob && <Blob r={0.42} o={0.4} />}
      <group position={[0, (P.bob ?? 0) + (P.y ?? 0), 0]} rotation={[lean, twist, tilt]}>
        {leg(-1, P.legL ?? 0, P.kneeL ?? 0)}
        {leg(1, P.legR ?? 0, P.kneeR ?? 0)}
        {/* torso */}
        <M g={cap(0.19, 0.3)} m={shirt} p={[0, 1.08, 0]} s={[1.08, 1, 0.82]} ol={o} shadow={shadow} />
        {look.skirt && <M g={geo('skirt', () => new THREE.ConeGeometry(0.26, 0.36, 18, 1, true))} m={pants} p={[0, 0.78, 0]} ol={o} />}
        {!look.skirt && <M g={cap(0.17, 0.08)} m={pants} p={[0, 0.84, 0]} s={[1.12, 1, 0.85]} shadow={shadow} />}
        {look.tie && <M g={box(0.05, 0.26, 0.02)} m={mat(look.tie, { r: 0.5 })} p={[0, 1.2, 0.165]} />}
        {look.coat === 'lab' && <M g={cap(0.2, 0.42)} m={shirt} p={[0, 0.98, -0.005]} s={[1.1, 1, 0.84]} ol={o} />}
        {look.backpack && <M g={box(0.3, 0.36, 0.16)} m={mat(look.backpack, { r: 0.7 })} p={[0, 1.12, -0.22]} ol={o} />}
        {arm(-1, aL, propL)}
        {arm(1, aR, propR)}
        {/* head */}
        <group position={[0, 1.42, 0]} rotation={[hp, hy, hr]} scale={[headScale, headScale, headScale]}>
          <group position={[0, 0.2, 0]}>
            <M g={sph(0.205, 28, 20)} m={skin} s={[1, 1.06, 0.97]} ol={o} shadow={shadow} />
            <M g={sph(0.05, 10, 8)} m={skin} p={[-0.2, -0.01, 0]} s={[0.5, 1, 0.8]} />
            <M g={sph(0.05, 10, 8)} m={skin} p={[0.2, -0.01, 0]} s={[0.5, 1, 0.8]} />
            {/* eyes */}
            {[[-1, eA, bA], [1, eB, bB]].map(([sd, e, ba]: any, i) => (
              <group key={i} position={[sd * 0.075, 0.035, 0.162]}>
                <group scale={[1, bl, 1]}>
                  <mesh geometry={sph(0.064, 18, 14)} material={white} scale={[1, 1.12, 0.62]} />
                  <mesh geometry={sph(0.032, 12, 10)} material={black} position={[e[0], e[1], 0.036]} scale={[1, 1, 0.6]} />
                  <mesh geometry={sph(0.01, 6, 6)} material={basic('#ffffff')} position={[e[0] + 0.01, e[1] + 0.012, 0.052]} />
                </group>
                <mesh geometry={box(0.08, 0.016, 0.02)} material={mat('#2a1d18', { r: 0.95 })} position={[0, 0.082 + bRaise, 0.03]} rotation={[0, 0, sd * ba]} />
              </group>
            ))}
            {look.glasses && (
              <group position={[0, 0.035, 0.2]}>
                <mesh geometry={arc(0.07, 0.008, Math.PI * 2)} material={black} position={[-0.075, 0, 0]} />
                <mesh geometry={arc(0.07, 0.008, Math.PI * 2)} material={black} position={[0.075, 0, 0]} />
                <mesh geometry={box(0.03, 0.01, 0.01)} material={black} />
              </group>
            )}
            <M g={sph(0.034, 12, 10)} m={mat(new THREE.Color(look.skin).multiplyScalar(0.9).getStyle(), { r: 0.6 })} p={[0, -0.025, 0.2]} />
            {mouth()}
            {hairEl()}
          </group>
          {above ? <group position={[0, 0.75, 0]}>{above}</group> : null}
        </group>
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ far crowd (instanced, cheap)
export type Agent = { x: number; z: number; rot?: number; seed: number; bob?: number; scale?: number; color?: string };
export const Crowd: React.FC<{ agents: Agent[]; f?: number }> = ({ agents, f = 0 }) => {
  const n = agents.length;
  const meshes = useMemo(() => {
    const body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.2, 0.62, 4, 10), new THREE.MeshStandardMaterial({ roughness: 0.85 }), n);
    const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.19, 14, 10), new THREE.MeshStandardMaterial({ roughness: 0.7 }), n);
    const legs = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.15, 0.5, 4, 8), new THREE.MeshStandardMaterial({ roughness: 0.85 }), n);
    body.castShadow = head.castShadow = legs.castShadow = true;
    const c = new THREE.Color();
    agents.forEach((a, i) => {
      const r = rng(a.seed + 11);
      body.setColorAt(i, c.set(a.color ?? SHIRT[Math.floor(r() * SHIRT.length)]));
      head.setColorAt(i, c.set(SKIN[Math.floor(r() * SKIN.length)]));
      legs.setColorAt(i, c.set(PANTS[Math.floor(r() * PANTS.length)]));
    });
    return { body, head, legs };
  }, [n]);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  agents.forEach((a, i) => {
    const sc = a.scale ?? 1;
    const b = a.bob ?? 0;
    e.set(0, a.rot ?? 0, 0); q.setFromEuler(e); s.set(sc, sc, sc);
    p.set(a.x, (0.45 + b) * sc, a.z); m.compose(p, q, s); meshes.legs.setMatrixAt(i, m);
    p.set(a.x, (1.08 + b) * sc, a.z); m.compose(p, q, s); meshes.body.setMatrixAt(i, m);
    p.set(a.x, (1.62 + b) * sc, a.z); m.compose(p, q, s); meshes.head.setMatrixAt(i, m);
  });
  meshes.body.instanceMatrix.needsUpdate = meshes.head.instanceMatrix.needsUpdate = meshes.legs.instanceMatrix.needsUpdate = true;
  return (
    <group>
      <primitive object={meshes.body} />
      <primitive object={meshes.head} />
      <primitive object={meshes.legs} />
    </group>
  );
};
export { lerp };

/** walk from a to b (x,z) at speed m/s starting at frame start; returns pos/rotY/pose */
export function walkPath(f: number, a: number[], b: number[], speed = 1.3, start = 0, phase = 0) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const d = Math.hypot(dx, dz);
  const s = Math.max(0, Math.min(d, ((f - start) / 30) * speed));
  const moving = s > 0 && s < d;
  return {
    pos: [a[0] + (dx * s) / d, 0, a[1] + (dz * s) / d],
    rotY: Math.atan2(dx, dz),
    pose: moving ? walk((s / 0.72) * Math.PI + phase, Math.min(1, speed / 1.2)) : {},
    done: s >= d,
  };
}
