import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { tl, sf, FPS } from '../lib/tl';
import { clamp, backOut, easeOut, lerp, hash } from '../lib/anim';

const FONT = 'Montserrat, sans-serif';
const TECH = '"Russo One", Montserrat, sans-serif';
const stroke = (px: number, color = '#000') => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const });
const W = (i: number) => sf(tl.words[i].s);
const WE = (i: number) => sf(tl.words[i].e);
const shot = (id: string) => tl.shots.find((s: any) => s.id === id);
const inShot = (f: number, ...ids: string[]) => ids.some((id) => { const s = shot(id); return !!s && f >= s.from && f < s.to; });
const inInterlude = (f: number) => tl.chapters.some((c: any) => f >= sf(c.ins_start) && f < sf(c.end) + 18);
const RED = '#ff3b3b', CYAN = '#21f0ff', YEL = '#ffe14a';

const WifiIcon: React.FC<{ s: number; col: string; cut?: number; crack?: number }> = ({ s, col, cut = 1, crack = 0 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    {[1, 2, 3].map((i) => <path key={i} d={`M ${50 - 13 * i} ${70 - 11 * i} A ${18 * i} ${18 * i} 0 0 1 ${50 + 13 * i} ${70 - 11 * i}`} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round" transform={crack ? `translate(${(i % 2 ? 1 : -1) * crack * 4} ${crack * i * 2}) rotate(${(i % 2 ? 1 : -1) * crack * 6} 50 70)` : undefined} />)}
    <circle cx="50" cy="78" r="7" fill={col} />
    {cut > 0 && <line x1="18" y1="16" x2={18 + 66 * cut} y2={16 + 70 * cut} stroke={col} strokeWidth="9" strokeLinecap="round" />}
  </svg>
);
const Plaque: React.FC<{ f: number; a: number; b: number; tag: string; text: string; sub?: string; top?: number; big?: string; bigCol?: string }> = ({ f, a, b, tag, text, sub, top = 250, big, bigCol = YEL }) => {
  if (f < a || f >= b) return null;
  const l = f - a, p = backOut(l / 10, 1.6), o = clamp((b - f) / 8);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top, transform: `scale(${p}) rotate(${(1 - p) * -3}deg)`, opacity: o, transformOrigin: '50% 0' }}>
      <div style={{ position: 'relative', background: 'linear-gradient(160deg, rgba(14,18,40,0.93), rgba(30,14,52,0.93))', border: `4px solid ${CYAN}`, borderRadius: 34, padding: '50px 44px 36px', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(33,240,255,0.3)' }}>
        <div style={{ position: 'absolute', top: -34, left: 44, background: YEL, color: '#111', fontFamily: TECH, fontSize: 42, padding: '6px 26px', borderRadius: 14, transform: 'rotate(-3deg)' }}>{tag}</div>
        {big && <div style={{ fontFamily: TECH, fontSize: 120, lineHeight: 1, color: bigCol, ...stroke(10), marginBottom: 10 }}>{big}</div>}
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, lineHeight: 1.12, color: '#fff' }}>{text}</div>
        {sub && <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 38, lineHeight: 1.2, color: '#c9d3ff', marginTop: 14, opacity: easeOut((l - 10) / 10) }}>{sub}</div>}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ persistent status pill: no network + time since
const fmt = (sec: number) => { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
export const NetHud: React.FC = () => {
  const f = useCurrentFrame();
  const H = tl.hud;
  if (f < sf(H.start) || f >= W(211) || inInterlude(f) || inShot(f, 'title', 'n9_cta', 'n9_moon')) return null;
  const t = f / FPS;
  const chs = tl.chapters.filter((c: any) => t >= c.start);
  const c = chs[chs.length - 1];
  const label = c ? c.clock : fmt(Math.max(0, (t - H.start) * 0.3));
  const appear = backOut((f - sf(H.start)) / 10, 1.6);
  const blink = Math.floor(f / 15) % 2 === 0;
  return (
    <div style={{ position: 'absolute', left: 50, top: 240, transform: `scale(${Math.min(1, appear)})`, transformOrigin: '0 0', display: 'flex', alignItems: 'center', gap: 14, padding: '10px 24px 10px 16px', borderRadius: 40, background: 'rgba(5,8,20,0.62)', border: `3px solid ${blink ? RED : 'rgba(255,59,59,0.45)'}` }}>
      <WifiIcon s={52} col={RED} />
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 32, color: '#fff', letterSpacing: 1 }}>НЕТ СЕТИ</div>
      <div style={{ fontFamily: TECH, fontSize: 32, color: '#ffb3b3' }}>{label === '00:00:00' ? '' : (c ? '· ' + label : '')}</div>
    </div>
  );
};

// ------------------------------------------------------------------ one-off moments
export const NetMoments: React.FC = () => {
  const f = useCurrentFrame();
  const out: React.ReactNode[] = [];
  // hook: the wi-fi symbol breaks
  {
    const a = W(6), b = W(9) + 2;
    if (f >= a && f < b) {
      const l = f - a, p = backOut(l / 8, 2), cut = clamp((f - W(7)) / 8), crack = clamp((f - W(8)) / 6);
      const col = f >= W(7) ? RED : '#ffffff';
      out.push(<div key="wifi" style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', transform: `scale(${p}) translateX(${crack > 0 ? (hash(f) - 0.5) * 30 : 0}px)`, opacity: clamp((b - f) / 4), filter: `drop-shadow(0 0 30px ${col})` }}><WifiIcon s={340} col={col} cut={cut} crack={crack} /></div>);
    }
  }
  // 5 000 000 000+
  {
    const a = W(48) - 2, b = WE(57) + 6;
    if (f >= a && f < b) {
      const p = easeOut((f - a) / 30);
      const v = Math.round(lerp(0, 5e9, p));
      out.push(<div key="bil" style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', transform: `scale(${backOut((f - a) / 9, 1.8)})`, opacity: clamp((b - f) / 6) }}>
        <div style={{ fontFamily: TECH, fontSize: 118, color: '#fff', ...stroke(12), textShadow: `0 0 40px ${CYAN}` }}>{v.toLocaleString('ru-RU')}{p >= 1 ? '+' : ''}</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, color: YEL, ...stroke(8), marginTop: 6 }}>ЧЕЛОВЕК ЖДУТ</div>
      </div>);
    }
  }
  out.push(<Plaque key="gps" f={f} a={W(113) - 2} b={W(121) + 4} tag="ФАКТ" text="GPS работает без интернета" sub="Телефон сам вычисляет, где ты, по сигналам спутников" />);
  out.push(<Plaque key="cab" f={f} a={W(215) - 2} b={WE(225) + 8} tag="ФАКТ" big="95%+" text="трафика между континентами" sub="идёт по кабелям на дне океана" />);
  out.push(<Plaque key="1859" f={f} a={W(232) - 2} b={WE(239) + 4} tag="1859" text="Событие Кэррингтона" sub="самая мощная солнечная буря за всю историю наблюдений" />);
  {
    const a = W(267) - 2, b = WE(273) + 8;
    if (f >= a && f < b) {
      const p = backOut((f - a) / 9, 2);
      out.push(<div key="6h" style={{ position: 'absolute', left: 0, right: 0, top: 280, textAlign: 'center', transform: `scale(${p})`, opacity: clamp((b - f) / 6) }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 22, background: RED, padding: '16px 44px', borderRadius: 30, border: '5px solid #fff', boxShadow: '0 16px 50px rgba(255,40,40,0.55)' }}>
          <svg width="90" height="90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="10" /><line x1="50" y1="50" x2="50" y2="22" stroke="#fff" strokeWidth="9" strokeLinecap="round" transform={`rotate(${(f - a) * 12} 50 50)`} /><line x1="50" y1="50" x2="70" y2="50" stroke="#fff" strokeWidth="9" strokeLinecap="round" /></svg>
          <span style={{ fontFamily: TECH, fontSize: 104, color: '#fff' }}>6 ЧАСОВ</span>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 48, color: '#fff', ...stroke(8), marginTop: 18 }}>БЕЗ СВЯЗИ · 2021</div>
      </div>);
    }
  }
  out.push(<Plaque key="1969" f={f} a={W(288) - 2} b={WE(298) + 10} tag="29 ОКТЯБРЯ 1969" text="Первое сообщение в сети ARPANET" sub="Оборвалось на второй букве" top={230} />);
  // CTA: options
  {
    const a = W(299) - 2;
    if (f >= a && f < W(314)) {
      const q = backOut((f - a) / 9, 1.8);
      const opts: [string, number][] = [['ЧАС', W(305)], ['ДЕНЬ', W(306)], ['НЕДЕЛЮ', W(308)]];
      out.push(<div key="cta" style={{ position: 'absolute', left: 40, right: 40, top: 250, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 70, lineHeight: 1.05, color: '#fff', ...stroke(12), transform: `scale(${q})` }}>СКОЛЬКО БЫ ТЫ<br /><span style={{ color: YEL }}>ПРОДЕРЖАЛСЯ?</span></div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 34 }}>
          {opts.map(([t, at], i) => {
            const p = f >= at ? backOut((f - at) / 8, 2.2) : 0;
            return <div key={i} style={{ transform: `scale(${p})`, fontFamily: TECH, fontSize: 52, color: '#fff', padding: '14px 30px', borderRadius: 24, background: ['#3c6cf0', '#ff2bd6', '#ff3b3b'][i], border: '4px solid #fff', boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}>{t}</div>;
          })}
        </div>
        {f >= W(309) && <div style={{ marginTop: 34, display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#111', background: YEL, padding: '12px 34px', borderRadius: 22, transform: `scale(${backOut((f - W(309)) / 8, 2)})` }}>ПИШИ В КОММЕНТАРИЯХ ↓</div>}
      </div>);
      if (f >= W(312)) {
        const p = backOut((f - W(312)) / 8, 2);
        const click = f >= W(313) + 6;
        out.push(<div key="sub" style={{ position: 'absolute', left: 0, right: 0, top: 1000, textAlign: 'center', transform: `scale(${p * (click && f < W(313) + 12 ? 0.92 : 1)})` }}>
          <div style={{ display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: 54, color: '#fff', background: click ? '#555' : '#ff0033', padding: '18px 48px', borderRadius: 40, boxShadow: '0 14px 40px rgba(0,0,0,0.5)' }}>{click ? 'ВЫ ПОДПИСАНЫ ✓' : 'ПОДПИСАТЬСЯ'}</div>
        </div>);
      }
    }
  }
  // teaser: next experiment
  if (f >= W(314) - 2) {
    const a = W(314) - 2, p = backOut((f - a) / 10, 1.6);
    out.push(<div key="next" style={{ position: 'absolute', left: 40, right: 40, top: 300, textAlign: 'center', transform: `scale(${p})` }}>
      <div style={{ display: 'inline-block', fontFamily: TECH, fontSize: 44, color: '#111', background: CYAN, padding: '8px 28px', borderRadius: 16 }}>СЛЕДУЮЩИЙ ЭКСПЕРИМЕНТ</div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 84, lineHeight: 1.05, color: '#fff', ...stroke(12), marginTop: 24 }}>ЧТО, ЕСЛИ<br /><span style={{ color: YEL }}>ИСЧЕЗНЕТ ЛУНА?</span></div>
    </div>);
  }
  return <AbsoluteFill>{out}</AbsoluteFill>;
};
