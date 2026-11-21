import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { tl } from '../lib/tl';
import { clamp, easeOut } from '../lib/anim';

const FONT = 'Montserrat, sans-serif';
const RED = '#c0262d';
const pop = (l: number) => { const t = clamp(l / 7); return 1 + Math.sin(t * Math.PI) * 0.12 - (1 - t) * 0.3; };

/** top caption plate (small grey line + white box with a red frame), the moral board and the yes/no question */
export const ParMoments: React.FC = () => {
  const f = useCurrentFrame();
  const s = tl.shots.find((x: any) => f >= x.from && f < x.to) ?? tl.shots[tl.shots.length - 1];
  const l = f - s.from;
  const out: React.ReactNode[] = [];
  out.push(
    <div key="plate" style={{ position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', transform: `scale(${pop(l)})`, opacity: clamp(l / 4) }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#2b2b2b', letterSpacing: 2, textShadow: '0 0 8px rgba(255,255,255,0.9)' }}>{s.small}</div>
      <div style={{ display: 'inline-block', marginTop: 6, background: '#fbf7ee', border: `6px solid ${RED}`, borderRadius: 14, padding: '6px 26px', boxShadow: '0 8px 0 rgba(0,0,0,0.25)' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: s.big.length > 14 ? 48 : 62, color: RED }}>{s.big}</div>
      </div>
    </div>,
  );
  if (s.id === 'p_moral') {
    const a = easeOut(clamp((l - 8) / 12)), b = easeOut(clamp((l - 60) / 12));
    out.push(
      <div key="board" style={{ position: 'absolute', top: 470, left: 90, right: 90, height: 620, background: '#fbf7ee', border: '10px solid #3a2a1a', borderRadius: 24, display: 'flex', transform: `scale(${0.7 + 0.3 * a})`, opacity: a, boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
        {[['ОТНЯТОЕ', '1 ДЕНЬ', '#c0262d', '✕', 1], ['ОТДАННОЕ', 'КАЖДЫЙ ГОД', '#1f8a3a', '♥', b]].map(([h, t, c, ic, o], i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', paddingTop: 40, borderLeft: i ? '6px solid #3a2a1a' : 'none', opacity: o as number }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: c as string }}>{h}</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 190, color: c as string, lineHeight: 1.3 }}>{ic}</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: c as string }}>{t}</div>
          </div>
        ))}
      </div>,
    );
  }
  if (s.id === 'p_ask') {
    const a = easeOut(clamp((l - 6) / 10));
    const yes = 0.5 + 0.5 * Math.sin(l * 0.25);
    out.push(
      <div key="ask" style={{ position: 'absolute', top: 470, left: 120, right: 120, background: '#fbf7ee', border: `8px solid ${RED}`, borderRadius: 24, padding: '30px 20px 40px', textAlign: 'center', transform: `scale(${0.7 + 0.3 * a})`, opacity: a, boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 80, color: '#222' }}>А ВЫ?</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 24 }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 70, color: '#fff', background: '#1f9d45', borderRadius: 18, padding: '8px 44px', transform: `scale(${1 + yes * 0.08})` }}>ДА</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 70, color: '#fff', background: RED, borderRadius: 18, padding: '8px 44px', transform: `scale(${1 + (1 - yes) * 0.08})` }}>НЕТ</div>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: '#444', marginTop: 26 }}>Напиши в комментариях</div>
      </div>,
    );
  }
  return <AbsoluteFill>{out}</AbsoluteFill>;
};
