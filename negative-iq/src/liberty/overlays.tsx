import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { tl } from '../lib/tl';
import { clamp, backOut, easeOut, lerp } from '../lib/anim';
import { ZONES, ZONE_ORDER, Zone } from './kit';

const FONT = 'Montserrat, sans-serif';
const TECH = '"Russo One", Montserrat, sans-serif';
const stroke = (px: number, color = '#000') => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const });
const VIO = '#a855f7', CY = '#22d3ee';
const shot = (id: string) => tl.shots.find((s: any) => s.id === id);
/** local frame inside a shot (or null if not in it) */
const loc = (f: number, id: string) => { const s = shot(id); return s && f >= s.from && f < s.to ? { l: f - s.from, s, beat: (i: number) => (s.beats?.[i] !== undefined ? Math.round(s.beats[i] * 30) - s.from : 1e9) } : null; };
const fadeOut = (l: number, dur: number, n = 6) => clamp((dur - l) / n);

/** big Russian caption with a Kazakh line under it */
const Cap: React.FC<{ l: number; dur: number; ru: string; kz: string; top?: number; col?: string; size?: number; at?: number }> = ({ l, dur, ru, kz, top = 300, col = '#fff', size = 96, at = 0 }) => {
  if (l < at) return null;
  const p = backOut((l - at) / 9, 1.8), q = easeOut((l - at - 6) / 8);
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top, textAlign: 'center', opacity: fadeOut(l, dur) }}>
      <div style={{ fontFamily: TECH, fontSize: size, lineHeight: 1.02, color: col, ...stroke(12), textShadow: `0 0 40px ${VIO}`, transform: `scale(${p})` }}>{ru}</div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: Math.round(size * 0.42), color: CY, ...stroke(7), marginTop: 10, opacity: q, letterSpacing: 2 }}>{kz}</div>
    </div>
  );
};
const Card: React.FC<{ children: React.ReactNode; col: string; style?: React.CSSProperties }> = ({ children, col, style }) => (
  <div style={{ background: 'linear-gradient(160deg, rgba(10,10,22,0.92), rgba(24,10,40,0.92))', border: `4px solid ${col}`, borderRadius: 26, boxShadow: `0 16px 50px rgba(0,0,0,0.6), 0 0 36px ${col}66`, ...style }}>{children}</div>
);
const Price: React.FC<{ l: number; dur: number; z: Zone; at: number; top?: number }> = ({ l, dur, z, at, top = 330 }) => {
  if (l < at) return null;
  const Z = ZONES[z];
  const p = backOut((l - at) / 9, 1.8);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', transform: `scale(${p})`, opacity: fadeOut(l, dur) }}>
      <Card col={Z.col} style={{ padding: '26px 46px', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: Z.col, letterSpacing: 4 }}>СТОИМОСТЬ УРОВНЯ · {Z.name}</div>
        <div style={{ fontFamily: TECH, fontSize: 120, color: '#fff', lineHeight: 1.05, ...stroke(8) }}>{Z.wd} ₸<span style={{ fontSize: 50 }}> / час</span></div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: '#e5e7eb' }}>в выходные — {Z.we} ₸</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: CY, marginTop: 6 }}>сағатына {Z.wd} ₸ · демалыста {Z.we} ₸</div>
      </Card>
    </div>
  );
};

export const LibMoments: React.FC = () => {
  const f = useCurrentFrame();
  const out: React.ReactNode[] = [];
  let x;
  // hook
  if ((x = loc(f, 'l_crack'))) out.push(<Cap key="crack" l={x.l} dur={x.s.dur} ru="ЗАБУДЬ ПРО ЛАГИ" kz="ЛАГТАРДЫ ҰМЫТ" col="#ff4b5c" />);
  if ((x = loc(f, 'l_logo'))) out.push(<Cap key="welc" l={x.l} dur={x.s.dur} ru="ДОБРО ПОЖАЛОВАТЬ" kz="ҚОШ КЕЛДІҢІЗ" size={74} top={250} at={10} />);
  if ((x = loc(f, 'l_map'))) {
    const p = backOut(x.l / 9, 1.8);
    out.push(<div key="pin" style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', transform: `scale(${p})`, opacity: fadeOut(x.l, x.s.dur) }}>
      <Card col={VIO} style={{ padding: '22px 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: TECH, fontSize: 70, color: '#fff' }}>пр. Достык, 55</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#e5e7eb' }}>Алматы</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: CY, marginTop: 6 }}>Достық даңғылы, 55</div>
      </Card>
    </div>);
  }
  // 24/7
  if ((x = loc(f, 'l_door'))) {
    const t = clamp(x.l / (x.s.dur * 0.85));
    const hours = (8 + t * 19) % 24;
    const hh = String(Math.floor(hours)).padStart(2, '0'), mm = String(Math.floor((hours % 1) * 60)).padStart(2, '0');
    out.push(<div key="clk" style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', transform: `scale(${backOut(x.l / 9, 1.8)})`, opacity: fadeOut(x.l, x.s.dur) }}>
      <div style={{ display: 'inline-block', fontFamily: TECH, fontSize: 130, color: '#fff', background: 'rgba(8,6,20,0.75)', border: `4px solid ${CY}`, borderRadius: 30, padding: '6px 40px', boxShadow: `0 0 40px ${CY}66` }}>{hh}:{mm}</div>
    </div>);
    out.push(<Cap key="247" l={x.l} dur={x.s.dur} ru="КРУГЛОСУТОЧНО" kz="ТӘУЛІК БОЙЫ" top={460} size={92} at={Math.max(10, Math.min(x.beat(0), x.s.dur - 40))} />);
  }
  if ((x = loc(f, 'l_night'))) {
    out.push(<div key="clk3" style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', transform: `scale(${backOut(x.l / 9, 1.8)})`, opacity: fadeOut(x.l, x.s.dur) }}>
      <div style={{ display: 'inline-block', fontFamily: TECH, fontSize: 130, color: '#fff', background: 'rgba(8,6,20,0.75)', border: `4px solid ${VIO}`, borderRadius: 30, padding: '6px 40px' }}>03:00</div>
    </div>);
    out.push(<Cap key="open" l={x.l} dur={x.s.dur} ru="ДВЕРИ ОТКРЫТЫ" kz="ЕСІКТЕР АШЫҚ" top={460} size={86} at={Math.min(x.beat(1), x.s.dur - 30)} />);
  }
  // level select
  if ((x = loc(f, 'l_select'))) {
    const L = x.l;
    const hi = [0, 1, 2, 3].filter((i) => L >= x!.beat(i)).length - 1;
    out.push(<div key="sel" style={{ position: 'absolute', left: 50, right: 50, top: 260, opacity: fadeOut(L, x.s.dur) }}>
      <div style={{ textAlign: 'center', transform: `scale(${backOut(L / 9, 1.8)})` }}>
        <div style={{ fontFamily: TECH, fontSize: 84, color: '#fff', ...stroke(10) }}>ВЫБЕРИ УРОВЕНЬ</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 36, color: CY, ...stroke(6) }}>ДЕҢГЕЙІҢДІ ТАҢДА</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 30 }}>
        {ZONE_ORDER.map((z, i) => {
          const Z = ZONES[z];
          const on = i === hi;
          const p = backOut((L - 6 - i * 4) / 9, 1.8);
          return (
            <div key={z} style={{ transform: `scale(${p * (on ? 1.06 : 1)})`, opacity: hi >= 0 && !on ? 0.55 : 1 }}>
              <Card col={Z.col} style={{ padding: '20px 22px', height: 250, position: 'relative', boxShadow: on ? `0 0 60px ${Z.col}` : undefined }}>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 28, color: Z.col, letterSpacing: 3 }}>LEVEL {Z.lvl}</div>
                <div style={{ fontFamily: TECH, fontSize: 76, color: '#fff', lineHeight: 1.05 }}>{Z.name}</div>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#d1d5db', marginTop: 6 }}>{Z.specs[Z.specs.length > 2 && z !== 'main' ? 0 : 1]}</div>
                <div style={{ position: 'absolute', bottom: 18, left: 22, fontFamily: TECH, fontSize: 40, color: Z.col }}>от {Z.wd} ₸</div>
                {[...Array(Z.lvl)].map((_, k) => <div key={k} style={{ position: 'absolute', top: 22, right: 22 + k * 22, width: 16, height: 16, borderRadius: 8, background: Z.col }} />)}
              </Card>
            </div>
          );
        })}
      </div>
    </div>);
  }
  // levels
  for (const z of ZONE_ORDER) {
    const Z = ZONES[z];
    if ((x = loc(f, 'lv_' + z))) {
      const L = x.l, p = backOut(L / 8, 2.2), fl = clamp(1 - L / 10);
      out.push(<div key={'lv' + z}>
        <AbsoluteFill style={{ background: Z.col, opacity: fl * 0.35 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', transform: `scale(${p})`, opacity: fadeOut(L, x.s.dur) }}>
          <div style={{ display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#111', background: Z.col, padding: '8px 30px', borderRadius: 16, letterSpacing: 6 }}>LEVEL UP</div>
          <div style={{ fontFamily: TECH, fontSize: 150, color: '#fff', lineHeight: 1.05, ...stroke(12), textShadow: `0 0 50px ${Z.col}`, marginTop: 14 }}>УРОВЕНЬ {Z.lvl}</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: Z.col, ...stroke(8) }}>{Z.kz}</div>
        </div>
      </div>);
    }
    if ((x = loc(f, 'spec_' + z))) {
      const L = x.l;
      out.push(<div key={'spec' + z} style={{ position: 'absolute', left: 60, right: 60, top: 290, opacity: fadeOut(L, x.s.dur) }}>
        <div style={{ fontFamily: TECH, fontSize: 60, color: Z.col, ...stroke(8), marginBottom: 18 }}>{Z.name} · ЖЕЛЕЗО</div>
        {Z.specs.map((sp, i) => {
          const at = Math.min(x!.beat(i) < 1e8 ? x!.beat(i) : 8 + i * 12, x!.s.dur - 20 + i * 2);
          const p = easeOut((L - at) / 8);
          if (L < at) return null;
          return (
            <div key={i} style={{ transform: `translateX(${(1 - p) * -500}px)`, opacity: p, marginBottom: 16 }}>
              <Card col={Z.col} style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 22 }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: Z.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TECH, fontSize: 34, color: '#111' }}>{['CPU', 'GPU', 'RAM', 'Гц'][sp.includes('RTX') ? 1 : sp.includes('RAM') ? 2 : sp.includes('Гц') ? 3 : 0].slice(0, 3)}</div>
                <div style={{ fontFamily: TECH, fontSize: 54, color: '#fff' }}>{sp}</div>
              </Card>
            </div>
          );
        })}
      </div>);
    }
    if ((x = loc(f, 'hz_' + z))) {
      const hz = z === 'prime' ? 600 : 500;
      const v = Math.round(lerp(60, hz, easeOut(x.l / 26)));
      out.push(<div key={'hz' + z} style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: fadeOut(x.l, x.s.dur) }}>
        <div style={{ fontFamily: TECH, fontSize: 200, color: '#fff', lineHeight: 1, ...stroke(14), textShadow: `0 0 60px ${Z.col}` }}>{v}<span style={{ fontSize: 100, color: Z.col }}> Гц</span></div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#e5e7eb', ...stroke(6) }}>частота монитора · монитор жиілігі</div>
      </div>);
    }
    if ((x = loc(f, 'play_' + z))) out.push(<Price key={'pr' + z} l={x.l} dur={x.s.dur} z={z} at={Math.min(x.beat(0), x.s.dur - 40)} />);
  }
  if ((x = loc(f, 'max_prime'))) {
    if (x.beat(1) < 1e8) out.push(<Price key="prmax" l={x.l} dur={x.s.dur} z="prime" at={x.beat(1)} />);
    else out.push(<Cap key="mx" l={x.l} dur={x.s.dur} ru="КАЖДЫЙ УРОВЕНЬ МОЩНЕЕ" kz="ӘР ДЕҢГЕЙ ҚУАТТЫРАҚ" size={70} col="#fde68a" />);
  }
  if ((x = loc(f, 'l_team'))) out.push(<Cap key="team" l={x.l} dur={x.s.dur} ru="ПРИХОДИ С КОМАНДОЙ" kz="КОМАНДАҢМЕН КЕЛ" size={80} />);
  if ((x = loc(f, 'l_team2'))) out.push(<Cap key="t2" l={x.l} dur={x.s.dur} ru="ИГРАЙТЕ ВМЕСТЕ" kz="БІРГЕ ОЙНАҢДАР" size={86} at={6} />);
  // final cards
  const Info: React.FC<{ l: number; dur: number; phone?: boolean }> = ({ l, dur, phone }) => (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', opacity: fadeOut(l, dur, 4) }}>
      <div style={{ transform: `scale(${backOut(l / 9, 1.8)})` }}>
        <div style={{ fontFamily: TECH, fontSize: 150, color: '#fff', lineHeight: 1, ...stroke(12), textShadow: `0 0 60px ${VIO}` }}>LIBERTY</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: CY, letterSpacing: 10, marginTop: 6 }}>COMPUTER CLUB</div>
      </div>
      <div style={{ marginTop: 34, opacity: easeOut((l - 10) / 10) }}>
        <Card col={VIO} style={{ padding: '24px 30px' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 48, color: '#fff' }}>пр. Достык, 55 · Алматы</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 48, color: '#fff', marginTop: 10 }}>24/7 · круглосуточно</div>
          {phone && <div style={{ fontFamily: TECH, fontSize: 66, color: CY, marginTop: 14 }}>+7 747 577 44 55</div>}
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: '#c4b5fd', marginTop: 10 }}>Достық даңғылы, 55 · Тәулік бойы</div>
        </Card>
      </div>
    </div>
  );
  if ((x = loc(f, 'l_final'))) out.push(<Info key="fin" l={x.l} dur={x.s.dur} />);
  if ((x = loc(f, 'l_call'))) {
    const L = x.l, pulse = 1 + 0.05 * Math.sin(L * 0.3);
    out.push(<div key="call" style={{ position: 'absolute', left: 50, right: 50, top: 300, textAlign: 'center', opacity: fadeOut(L, x.s.dur, 4) }}>
      <div style={{ fontFamily: TECH, fontSize: 80, color: '#fff', ...stroke(10), transform: `scale(${backOut(L / 9, 1.8)})` }}>ЗВОНИ</div>
      <div style={{ display: 'inline-block', marginTop: 20, transform: `scale(${backOut((L - 4) / 9, 1.8)})` }}>
        <Card col={CY} style={{ padding: '22px 40px' }}><div style={{ fontFamily: TECH, fontSize: 82, color: '#fff' }}>+7 747 577 44 55</div></Card>
      </div>
      <div style={{ marginTop: 40, transform: `scale(${backOut((L - 14) / 9, 2) * pulse})` }}>
        <div style={{ display: 'inline-block', background: 'linear-gradient(90deg,#a855f7,#22d3ee)', borderRadius: 50, padding: '22px 60px', boxShadow: '0 0 50px rgba(168,85,247,0.8)' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 58, color: '#fff', ...stroke(4) }}>ЗАБРОНИРОВАТЬ</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 32, color: '#111' }}>ОРЫН БРОНДАУ</div>
        </div>
      </div>
      <div style={{ marginTop: 26, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: '#e5e7eb', ...stroke(5), opacity: easeOut((L - 20) / 10) }}>пр. Достык, 55 · 24/7</div>
    </div>);
  }
  if ((x = loc(f, 'l_save'))) {
    const L = x.l;
    out.push(<Info key="sv" l={L} dur={x.s.dur + 100} phone />);
    out.push(<div key="save" style={{ position: 'absolute', left: 0, right: 0, top: 1060, textAlign: 'center', transform: `scale(${backOut((L - 6) / 9, 2)})` }}>
      <div style={{ display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#111', background: '#facc15', padding: '14px 36px', borderRadius: 24 }}>СОХРАНИ ВИДЕО · БЕЙНЕНІ САҚТА</div>
    </div>);
  }
  return <AbsoluteFill>{out}</AbsoluteFill>;
};

/** small brand pill, top-left, during the zone tour */
export const LibBug: React.FC = () => {
  const f = useCurrentFrame();
  const ids = ['spec_main', 'play_main', 'spec_vip', 'hz_vip', 'play_vip', 'spec_pro', 'play_pro', 'spec_prime', 'hz_prime', 'l_team2'];
  if (!ids.some((id) => loc(f, id))) return null;
  return (
    <div style={{ position: 'absolute', left: 50, top: 230, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 22px', borderRadius: 30, background: 'rgba(8,6,20,0.7)', border: `3px solid ${VIO}` }}>
      <div style={{ fontFamily: TECH, fontSize: 32, color: '#fff' }}>LIBERTY</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: CY }}>Достык 55 · 24/7</div>
    </div>
  );
};
