import React from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mat, basic, Blob, textTex, radialTex, spr } from './core';

const G: Record<string, THREE.BufferGeometry> = {};
const geo = (k: string, make: () => THREE.BufferGeometry) => (G[k] ||= make());
const rbox = (x: number, y: number, z: number, r = 0.12) => geo(`rb${x}_${y}_${z}_${r}`, () => new RoundedBoxGeometry(x, y, z, 3, r));
const wheelG = () => geo('wheel', () => { const g = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 20); g.rotateZ(Math.PI / 2); return g; });
const hubG = () => geo('hub', () => { const g = new THREE.CylinderGeometry(0.2, 0.2, 0.27, 12); g.rotateZ(Math.PI / 2); return g; });

export type CarKind = 'sedan' | 'taxi' | 'police' | 'ambulance' | 'bus' | 'van' | 'hatch';
export const CAR_COLORS = ['#c0392b', '#2e86de', '#f5f6fa', '#2d3436', '#e1b12c', '#16a085', '#8e44ad', '#d35400', '#7f8c8d', '#273c75'];

const Wheels: React.FC<{ xs: number; zs: number[]; spin: number; y?: number }> = ({ xs, zs, spin, y = 0.36 }) => (
  <>
    {zs.flatMap((z, i) => [-1, 1].map((sd) => (
      <group key={i + '_' + sd} position={[sd * xs, y, z]} rotation={[spin, 0, 0]}>
        <mesh geometry={wheelG()} material={mat('#1b1b1f', { r: 0.9 })} castShadow />
        <mesh geometry={hubG()} material={mat('#b8bcc2', { r: 0.35, m: 0.6 })} />
      </group>
    )))}
  </>
);

const Beacon: React.FC<{ on: boolean; color: string; pos: number[] }> = ({ on, color, pos }) => (
  <group position={pos as any}>
    <mesh material={on ? basic(color) : mat(color, { r: 0.4 })}><boxGeometry args={[0.32, 0.14, 0.22]} /></mesh>
    {on && <sprite scale={[2.4, 2.4, 1]} material={spr(color, { map: radialTex('glow'), add: true })} />}
  </group>
);

/** car facing +z; dist = travelled distance (wheel spin) ; lights: 0..1 headlights; flash: frame for beacons */
export const Car: React.FC<{ kind?: CarKind; color?: string; pos?: number[]; rotY?: number; dist?: number; lights?: number; flash?: number; reverse?: boolean; tilt?: number[]; brake?: boolean; rust?: number }> = ({ kind = 'sedan', color = '#c0392b', pos = [0, 0, 0], rotY = 0, dist = 0, lights = 0, flash = -1, reverse, tilt = [0, 0], brake, rust = 0 }) => {
  const spin = dist / 0.36;
  const glass = mat('#1d2a3a', { r: 0.12, m: 0.4 });
  const c0 = rust > 0 ? new THREE.Color(color).lerp(new THREE.Color('#7a4a2a'), rust).getStyle() : color;
  const paint = mat(c0, { r: 0.32 + rust * 0.5, m: 0.25 * (1 - rust) });
  const head = lights > 0 ? basic('#fff6d8') : mat('#e8e8e8', { r: 0.2 });
  const tail = brake || reverse ? basic(reverse ? '#ffffff' : '#ff2a2a') : mat('#a01010', { r: 0.3 });
  const beaconOn = flash >= 0 && Math.floor(flash / 4) % 2 === 0;
  if (kind === 'bus') {
    return (
      <group position={pos as any} rotation={[tilt[0], rotY, tilt[1]]}>
        <Blob r={3.4} o={0.35} pos={[0, 0.02, 0]} />
        <mesh geometry={rbox(2.5, 2.7, 10.5, 0.25)} material={paint} position={[0, 1.75, 0]} castShadow receiveShadow />
        <mesh geometry={rbox(2.54, 1.0, 9.6, 0.1)} material={glass} position={[0, 2.25, -0.2]} />
        <mesh geometry={rbox(2.3, 1.2, 0.1, 0.05)} material={glass} position={[0, 2.1, 5.24]} />
        <mesh geometry={rbox(2.56, 0.3, 10.56, 0.1)} material={mat('#f1f1f1', { r: 0.5 })} position={[0, 1.2, 0]} />
        <mesh position={[-0.8, 0.9, 5.26]} material={head}><boxGeometry args={[0.35, 0.2, 0.05]} /></mesh>
        <mesh position={[0.8, 0.9, 5.26]} material={head}><boxGeometry args={[0.35, 0.2, 0.05]} /></mesh>
        <Wheels xs={1.15} zs={[3.4, -3.4]} spin={spin} y={0.48} />
      </group>
    );
  }
  const L = kind === 'van' || kind === 'ambulance' ? 4.9 : 4.3;
  const cabinH = kind === 'van' || kind === 'ambulance' ? 1.25 : 0.7;
  return (
    <group position={pos as any} rotation={[tilt[0], rotY, tilt[1]]}>
      <Blob r={2.4} o={0.4} pos={[0, 0.015, 0]} />
      <mesh geometry={rbox(1.86, 0.72, L, 0.16)} material={paint} position={[0, 0.72, 0]} castShadow receiveShadow />
      {kind === 'van' || kind === 'ambulance' ? (
        <>
          <mesh geometry={rbox(1.84, cabinH, L * 0.78, 0.14)} material={paint} position={[0, 1.65, -L * 0.1]} castShadow />
          <mesh geometry={rbox(1.7, 0.55, 0.1, 0.04)} material={glass} position={[0, 1.55, L * 0.3 + 0.02]} rotation={[-0.35, 0, 0]} />
          <mesh geometry={rbox(1.88, 0.45, 1.0, 0.05)} material={glass} position={[0, 1.6, L * 0.18]} />
        </>
      ) : (
        <>
          <mesh geometry={rbox(1.66, cabinH, L * 0.5, 0.2)} material={glass} position={[0, 1.3, -L * 0.06]} castShadow />
          <mesh geometry={rbox(1.6, 0.08, L * 0.36, 0.04)} material={paint} position={[0, 1.66, -L * 0.07]} />
        </>
      )}
      {kind === 'taxi' && (
        <mesh position={[0, 1.82, -0.2]} material={basic('#ffe066')}><boxGeometry args={[0.6, 0.2, 0.3]} /></mesh>
      )}
      {kind === 'police' && (
        <>
          <mesh geometry={rbox(1.9, 0.22, L * 0.6, 0.05)} material={mat('#1e3799', { r: 0.4 })} position={[0, 0.78, 0]} />
          <Beacon on={beaconOn} color="#2a6bff" pos={[-0.3, 1.78, -0.3]} />
          <Beacon on={flash >= 0 && !beaconOn} color="#ff2a2a" pos={[0.3, 1.78, -0.3]} />
        </>
      )}
      {kind === 'ambulance' && (
        <>
          <mesh geometry={rbox(1.9, 0.2, L * 0.95, 0.05)} material={mat('#e84118', { r: 0.4 })} position={[0, 1.05, 0]} />
          <mesh position={[0.95, 1.75, -0.6]} rotation={[0, Math.PI / 2, 0]} material={basic('#ffffff', { map: textTex('+', { w: 128, h: 128, fg: '#e84118', size: 120 }) })}><planeGeometry args={[0.8, 0.8]} /></mesh>
          <mesh position={[-0.95, 1.75, -0.6]} rotation={[0, -Math.PI / 2, 0]} material={basic('#ffffff', { map: textTex('+', { w: 128, h: 128, fg: '#e84118', size: 120 }) })}><planeGeometry args={[0.8, 0.8]} /></mesh>
          <Beacon on={beaconOn} color="#ff2a2a" pos={[-0.4, 2.36, 0.9]} />
          <Beacon on={flash >= 0 && !beaconOn} color="#2a6bff" pos={[0.4, 2.36, 0.9]} />
        </>
      )}
      <mesh position={[-0.62, 0.8, L / 2 + 0.01]} material={head}><boxGeometry args={[0.36, 0.16, 0.04]} /></mesh>
      <mesh position={[0.62, 0.8, L / 2 + 0.01]} material={head}><boxGeometry args={[0.36, 0.16, 0.04]} /></mesh>
      <mesh position={[-0.65, 0.82, -L / 2 - 0.01]} material={tail}><boxGeometry args={[0.36, 0.14, 0.04]} /></mesh>
      <mesh position={[0.65, 0.82, -L / 2 - 0.01]} material={tail}><boxGeometry args={[0.36, 0.14, 0.04]} /></mesh>
      {lights > 0 && (
        <>
          <sprite position={[-0.62, 0.8, L / 2 + 0.2]} scale={[1.4 * lights, 1.4 * lights, 1]} material={spr('#fff3c4', { map: radialTex('glow'), add: true })} />
          <sprite position={[0.62, 0.8, L / 2 + 0.2]} scale={[1.4 * lights, 1.4 * lights, 1]} material={spr('#fff3c4', { map: radialTex('glow'), add: true })} />
        </>
      )}
      {(brake || reverse) && (
        <>
          <sprite position={[-0.65, 0.82, -L / 2 - 0.2]} scale={[1.1, 1.1, 1]} material={spr(reverse ? '#ffffff' : '#ff3030', { map: radialTex('glow'), add: true })} />
          <sprite position={[0.65, 0.82, -L / 2 - 0.2]} scale={[1.1, 1.1, 1]} material={spr(reverse ? '#ffffff' : '#ff3030', { map: radialTex('glow'), add: true })} />
        </>
      )}
      <mesh geometry={rbox(1.9, 0.2, 0.3, 0.06)} material={mat('#2b2b2b', { r: 0.6 })} position={[0, 0.42, L / 2 - 0.05]} />
      <mesh geometry={rbox(1.9, 0.2, 0.3, 0.06)} material={mat('#2b2b2b', { r: 0.6 })} position={[0, 0.42, -L / 2 + 0.05]} />
      <Wheels xs={0.86} zs={[L * 0.31, -L * 0.31]} spin={spin} />
    </group>
  );
};

/** airliner, nose +z */
export const Plane: React.FC<{ pos?: number[]; rotY?: number; livery?: string; scale?: number }> = ({ pos = [0, 0, 0], rotY = 0, livery = '#2e86de', scale = 1 }) => {
  const white = mat('#f4f6f8', { r: 0.35, m: 0.1 });
  const liv = mat(livery, { r: 0.4 });
  const fus = geo('fus', () => { const g = new THREE.CapsuleGeometry(1.9, 30, 8, 20); g.rotateX(Math.PI / 2); return g; });
  const wing = geo('wing', () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(17, -7); s.lineTo(17, -9.5); s.lineTo(0, -6); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g; });
  const fin = geo('fin', () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-6, 0); s.lineTo(-9, 8); s.lineTo(-6.5, 8); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false }); g.rotateY(-Math.PI / 2); return g; });
  const eng = geo('eng', () => { const g = new THREE.CylinderGeometry(1.15, 1.0, 4, 16); g.rotateX(Math.PI / 2); return g; });
  return (
    <group position={pos as any} rotation={[0, rotY, 0]} scale={[scale, scale, scale]}>
      <Blob r={18} o={0.3} pos={[0, 0.05, 0]} />
      <mesh geometry={fus} material={white} position={[0, 4, 0]} castShadow receiveShadow />
      <mesh position={[0, 4.9, 4]} material={mat('#1d2a3a', { r: 0.2 })}><boxGeometry args={[3.9, 0.5, 26]} /></mesh>
      <mesh position={[0, 3.2, 0]} material={liv}><boxGeometry args={[3.9, 0.5, 30]} /></mesh>
      <mesh geometry={wing} material={white} position={[1, 3.4, 3]} castShadow />
      <mesh geometry={wing} material={white} position={[-1, 3.4, 3]} scale={[-1, 1, 1]} castShadow />
      <mesh geometry={fin} material={liv} position={[0.2, 5.6, -6]} castShadow />
      <mesh geometry={eng} material={mat('#c9ced6', { r: 0.3, m: 0.4 })} position={[6.5, 2.4, 1.5]} castShadow />
      <mesh geometry={eng} material={mat('#c9ced6', { r: 0.3, m: 0.4 })} position={[-6.5, 2.4, 1.5]} castShadow />
      {[[0, 1.2, 12], [2.6, 1.2, -1], [-2.6, 1.2, -1]].map((q, i) => (
        <group key={i} position={q as any}>
          <mesh material={mat('#222', { r: 0.9 })}><cylinderGeometry args={[0.7, 0.7, 0.6, 14]} /></mesh>
          <mesh position={[0, 1.2, 0]} material={mat('#999', { m: 0.5, r: 0.4 })}><cylinderGeometry args={[0.15, 0.15, 2.2, 8]} /></mesh>
        </group>
      ))}
    </group>
  );
};
