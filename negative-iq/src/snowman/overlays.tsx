import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { tl } from '../lib/tl';
import { clamp } from '../lib/anim';

const FONT = 'Montserrat, sans-serif';
/** big comic caption per shot (wordless short: the text carries the story) */
export const SnowCaps: React.FC = () => {
  const f = useCurrentFrame();
  const s = tl.shots.find((x: any) => f >= x.from && f < x.to);
  if (!s || !s.cap) return null;
  const l = f - s.from, t = clamp(l / 7), out = clamp((s.dur - l) / 5);
  const sc = 1 + Math.sin(t * Math.PI) * 0.18 - (1 - t) * 0.4;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 260, left: 60, right: 60, textAlign: 'center', opacity: Math.min(t, out), transform: `scale(${sc}) rotate(${Math.sin(l * 0.05) * 1.2}deg)` }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: s.cap.length > 16 ? 70 : 92, lineHeight: 1.08, color: '#fff', WebkitTextStroke: '14px #1a1020', paintOrder: 'stroke fill', textShadow: '0 10px 0 rgba(0,0,0,0.35)' }}>{s.cap}</span>
      </div>
    </AbsoluteFill>
  );
};
