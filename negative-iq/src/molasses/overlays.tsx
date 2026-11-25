import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { tl } from '../lib/tl';
import { clamp } from '../lib/anim';

const FONT = 'Montserrat, sans-serif';
const stroke = (px: number) => ({ WebkitTextStroke: `${px}px #120a06`, paintOrder: 'stroke fill' as const });
/** top fact plate: small grey-gold caption + a big number/word that pops in */
export const MolMoments: React.FC = () => {
  const f = useCurrentFrame();
  const s = tl.shots.find((x: any) => f >= x.from && f < x.to);
  if (!s || (!s.big && !s.small)) return null;
  const l = f - s.from;
  const t = clamp(l / 8);
  const sc = 1 + Math.sin(t * Math.PI) * 0.15 - (1 - t) * 0.35;
  const out = clamp((s.dur - l) / 6);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', opacity: Math.min(t, out), transform: `scale(${sc})` }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: '#ffd27a', ...stroke(6) }}>{s.small}</div>
        {s.big && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: s.big.length > 10 ? 74 : 110, lineHeight: 1.05, color: '#fff', ...stroke(12), textShadow: '0 8px 0 rgba(0,0,0,0.35)' }}>{s.big}</div>}
      </div>
    </AbsoluteFill>
  );
};
