import React from 'react';
import * as THREE from 'three';
import { mat, basic } from '../three/core';
import { hash } from '../lib/anim';
import { Text3D } from '../club/kit';

/** the club entrance: dark facade, neon LIBERTY sign, 24/7 sign, glass doors */
export const Facade: React.FC<{ f: number; neon: number; open?: number }> = ({ f, neon, open = 0 }) => {
  const flick = neon > 0 && neon < 1 ? (hash(Math.floor(f / 2)) > 0.4 ? 1 : 0.2) : 1;
  const n = neon * flick;
  return (
    <group>
      <mesh position={[0, 4, -0.3]} material={mat('#1b1d27', { r: 0.8 })} receiveShadow castShadow><boxGeometry args={[12, 8, 0.6]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4]} material={mat('#2b2e38', { r: 0.9 })} receiveShadow><planeGeometry args={[30, 10]} /></mesh>
      {/* glass doors */}
      <mesh position={[0, 1.3, 0.02]} material={mat('#0a0a10', { r: 0.2, m: 0.5 })}><boxGeometry args={[2.4, 2.6, 0.06]} /></mesh>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 1.15, 1.3, 0.06]} rotation={[0, sd * open * 1.2, 0]}>
          <mesh position={[-sd * 0.575, 0, 0]} material={new THREE.MeshStandardMaterial({ color: '#7fb3ff', transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.5 })}><boxGeometry args={[1.12, 2.5, 0.03]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 1.3, -0.05]} material={basic('#ffd9a8', { t: 0.25 + 0.75 * open })}><planeGeometry args={[2.3, 2.5]} /></mesh>
      {open > 0 && <pointLight position={[0, 1.4, 1.2]} intensity={10 * open} distance={8} color="#c9a8ff" />}
      {/* neon sign */}
      <Text3D text="LIBERTY" size={0.9} depth={0.18} color={n > 0.3 ? '#ffffff' : '#555a66'} glow={n > 0.3 ? '#a855f7' : undefined} pos={[0, 4.6, 0.2]} />
      <mesh position={[0, 3.75, 0.05]} material={basic('#22d3ee', { t: 0.2 + 0.8 * n })}><boxGeometry args={[6.4, 0.05, 0.05]} /></mesh>
      <Text3D text="24/7" size={0.45} depth={0.1} color={n > 0.3 ? '#ffffff' : '#555a66'} glow={n > 0.3 ? '#22d3ee' : undefined} pos={[3.6, 2.4, 0.2]} />
      <Text3D text="COMPUTER CLUB" size={0.28} depth={0.06} color={n > 0.3 ? '#ffffff' : '#555a66'} glow={n > 0.3 ? '#22d3ee' : undefined} pos={[0, 3.35, 0.2]} />
      {n > 0.3 && <pointLight position={[0, 4.4, 2]} intensity={12 * n} distance={10} color="#a855f7" />}
      {[-4.5, 4.5].map((x) => <mesh key={x} position={[x, 1.6, 0.02]} material={basic(n > 0.3 ? '#22d3ee' : '#1a2a30', { t: 0.9 })}><boxGeometry args={[0.06, 3.2, 0.04]} /></mesh>)}
    </group>
  );
};
