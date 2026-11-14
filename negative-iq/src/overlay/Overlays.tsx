import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { tl, sf, FPS } from '../lib/tl';
import { clamp, backOut, easeOut, smoother, ramp, hash, lerp, easeInOut } from '../lib/anim';

const FONT = 'Montserrat, sans-serif';
const TECH = '"Russo One", Montserrat, sans-serif';
const stroke = (px: number, color = '#000') => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const });

/** true for 16:9 compositions */
export const useLand = () => { const v = useVideoConfig(); return v.width > v.height; };
/** in landscape, place portrait-designed overlays (1080×1920 coordinates) into a centred column */
export const PortraitColumn: React.FC<{ children: React.ReactNode; dy?: number }> = ({ children, dy = -330 }) => {
  const land = useLand();
  if (!land) return <>{children}</>;
  return <div style={{ position: 'absolute', left: 420, top: dy, width: 1080, height: 1920 }}>{children}</div>;
};

// ------------------------------------------------------------------ subtitles
const IQ_RED = [9, 10, 28, 29, 35, 80, 85, 118, 127, 146, 215, 221, 222];
export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const land = useLand();
  const t = f / FPS;
  if (tl.outro?.fast && t >= tl.inserts.OUTRO.start) return null;
  if (tl.title?.fast && t >= tl.inserts.TITLE.start && t < tl.inserts.TITLE.start + tl.title.dur + 0.2) return null;
  const sub = tl.subs.find((s: any) => t >= s.s - 0.05 && t < s.e);
  if (!sub) return null;
  const inF = f - sf(sub.s);
  const outF = sf(sub.e) - f;
  const fade = clamp(outF / 3);
  const lift = (1 - easeOut(inF / 6)) * 24;
  return (
    <div style={{ position: 'absolute', left: land ? 160 : 60, right: land ? 160 : 60, top: land ? 790 : 1150, height: land ? 250 : 420, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fade, transform: `translateY(${lift}px) scale(${land ? 0.86 : 1})` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 26, rowGap: 4, maxWidth: land ? 1500 : 960 }}>
        {sub.words.filter((w: any) => w.w && w.w !== '—').map((w: any, i: number) => {
          const ws = sf(w.s) - 1;
          const shown = f >= ws;
          const p = shown ? backOut((f - ws) / 6, 1.4) : 0;
          const active = f >= ws && f < sf(w.e) + 2;
          const key = w.k;
          const red = key && (tl.red ?? IQ_RED).includes(w.i);
          const size = key ? Math.min(112, Math.floor(940 / (w.w.length * 0.78))) : Math.min(78, Math.floor(940 / (w.w.length * 0.62)));
          const color = key ? (red ? '#ff3b3b' : '#ffe14a') : active ? '#ffffff' : '#f1f1f1';
          const wig = key && shown ? Math.sin((f - ws) * 0.35) * 2.2 * Math.exp(-(f - ws) * 0.08) : 0;
          return (
            <span key={i} style={{
              fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.08, color,
              textTransform: key ? 'uppercase' : 'none', letterSpacing: key ? 1 : 0,
              ...stroke(key ? 14 : 11), textShadow: '0 8px 18px rgba(0,0,0,0.55)',
              opacity: shown ? 1 : 0.0, transform: `scale(${(0.6 + 0.4 * p) * (active && !key ? 1.06 : 1)}) rotate(${wig}deg)`, display: 'inline-block',
            }}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ hook IQ gauge
export const HookGauge: React.FC = () => {
  const f = useCurrentFrame();
  if (tl.kind === 'game' || tl.kind === 'net' || tl.kind === 'liberty' || tl.kind === 'club') return null;
  const a = sf(tl.words[9].s) - 3, b = sf(tl.words[10].e) + 2, end = sf(tl.inserts.TITLE.start);
  if (f < a || f >= end) return null;
  const p = smoother((f - a) / (b - a));
  const val = Math.round(lerp(100, -100, easeInOut(p)));
  const ang = lerp(-60, -170, p) + (f > b ? Math.sin(f * 2.1) * 3 : 0) + 180 * 0;
  const enter = backOut((f - a) / 8, 1.8);
  const neg = val < 0;
  const shake = f > b - 4 ? Math.sin(f * 7) * 10 * clamp((end - f) / 10) : 0;
  return (
    <div style={{ position: 'absolute', left: 140, top: 330, width: 800, height: 520, transform: `scale(${enter}) translateX(${shake}px)`, transformOrigin: '50% 60%' }}>
      <svg width={800} height={520} viewBox="0 0 800 520">
        <defs>
          <linearGradient id="gg" x1="0" x2="1"><stop offset="0" stopColor="#ff2a3a" /><stop offset="0.45" stopColor="#ffb020" /><stop offset="1" stopColor="#2ae8ff" /></linearGradient>
          <filter id="glw"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <path d="M 90 430 A 310 310 0 0 1 710 430" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="70" strokeLinecap="round" />
        <path d="M 90 430 A 310 310 0 0 1 710 430" fill="none" stroke="url(#gg)" strokeWidth="44" strokeLinecap="round" />
        <path d="M 90 430 A 310 310 0 0 1 710 430" fill="none" stroke="url(#gg)" strokeWidth="44" strokeLinecap="round" filter="url(#glw)" opacity="0.6" />
        <text x="110" y="500" fill="#ff5a5a" fontFamily={TECH} fontSize="40" textAnchor="middle">-100</text>
        <text x="690" y="500" fill="#7ff4ff" fontFamily={TECH} fontSize="40" textAnchor="middle">150</text>
        <g transform={`translate(400 430) rotate(${-180 + ((val + 100) / 250) * 180 + (f > b ? Math.sin(f * 2.1) * 3 : 0)})`}>
          <polygon points="0,-18 290,0 0,18" fill="#fff" stroke="#000" strokeWidth="6" />
        </g>
        <circle cx="400" cy="430" r="34" fill="#111" stroke="#fff" strokeWidth="8" />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontFamily: TECH, fontSize: 150, color: neg ? '#ff3b3b' : '#ffffff', ...stroke(14), textShadow: neg ? '0 0 40px rgba(255,0,0,0.8)' : '0 0 30px rgba(0,220,255,0.6)' }}>
        <span style={{ fontSize: 70, marginRight: 16, verticalAlign: 'middle' }}>IQ</span>{val}
      </div>
      {void ang}
    </div>
  );
};

// ------------------------------------------------------------------ title card
export const TitleCard: React.FC = () => {
  const f = useCurrentFrame();
  const land = useLand();
  if (!tl.inserts.TITLE) return null;
  const T = tl.title ?? { small: 'ЧТО, ЕСЛИ…', big: 'IQ < 0', sub: 'НАУЧНО-ФАНТАСТИЧЕСКИЙ ЭКСПЕРИМЕНТ', dur: tl.inserts.TITLE.dur };
  const k = T.fast ? 2.5 : 1;
  const s = sf(tl.inserts.TITLE.start), d = sf(T.dur) * k;
  const l = (f - s) * k;
  if (l < 0 || l >= d + 6) return null;
  const out = clamp((d + 6 - l) / 8);
  const g = l < 10 ? (hash(l) - 0.5) * 40 : 0;
  const p1 = backOut((l - 2) / 10, 2), p2 = backOut((l - 8) / 12, 1.6), p3 = easeOut((l - 22) / 12);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: out }}>
      <div style={{ position: 'absolute', top: 560, width: '100%', textAlign: 'center', transform: `translateX(${g}px)` }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: T.smallSize ?? 92, color: '#fff', ...stroke(12), transform: `scale(${p1})`, letterSpacing: 4 }}>{T.small}</div>
        <div style={{ position: 'relative', height: 330, marginTop: 10 }}>
          {[['#00f0ff', -8, 0.7], ['#ff2050', 8, 0.7], ['#ffffff', 0, 1]].map(([c, dx, o]: any, i) => (
            <div key={i} style={{ position: 'absolute', left: land ? -400 : 0, right: land ? -400 : 0, whiteSpace: land ? 'nowrap' : undefined, fontFamily: TECH, fontSize: T.size ?? (T.big.length > 7 ? (land ? 200 : 190) : 300), lineHeight: 1.05, color: c, opacity: o, mixBlendMode: i < 2 ? 'screen' : 'normal', transform: `translateX(${dx * (l < 14 ? 3 : 1) + (i < 2 ? Math.sin(l * 1.3 + i) * 4 : 0)}px) scale(${p2})`, ...(i === 2 ? stroke(16) : {}), textShadow: i === 2 ? (tl.kind === 'game' ? '0 0 60px rgba(255,43,214,0.9)' : tl.kind === 'net' ? '0 0 60px rgba(33,240,255,0.9)' : '0 0 60px rgba(255,40,60,0.9)') : 'none' }}>{T.big}</div>
          ))}
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: '#ffe14a', ...stroke(8), opacity: p3, transform: `translateY(${(1 - p3) * 30}px)`, letterSpacing: 6 }}>{T.sub}</div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ interlude: fact card + experiment clock + chapter title
const fmt = (sec: number) => { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
const TARGET: Record<string, [number, number]> = { I1: [0, 600], I2: [600, 3600], I3: [3600, 86400], I4: [86400, 3 * 86400], I5: [3 * 86400, 7 * 86400], I6: [7 * 86400, 30 * 86400] };
const clockText = (sec: number) => (sec < 86400 ? fmt(sec) : `ДЕНЬ ${Math.max(1, Math.floor(sec / 86400))}`);

export const Interludes: React.FC = () => {
  const f = useCurrentFrame();
  const ch = tl.chapters.find((c: any) => f >= sf(c.ins_start) && f < sf(c.end) + 18);
  if (!ch) return null;
  const s = sf(ch.ins_start), l = f - s;
  const D = sf(ch.ins_dur);
  const short = !!ch.short;
  const noFact = !ch.fact;
  const cardIn = 10, cardOut = short || noFact ? -1 : Math.round(D * 0.535), clkIn = short || noFact ? 0 : cardOut + 2, titleF = short ? 10 : sf(ch.start) - s;
  const endF = sf(ch.end) + 18 - s;
  const fact = ch.fact;
  // fact card
  const cIn = backOut((l - cardIn) / 12, 1.5), cOut = clamp((cardOut - l) / 8);
  const qIn = easeOut((l - Math.round(D * 0.3)) / 10);
  const showCard = !!fact && l >= cardIn && l < cardOut;
  // clock
  const [t0, t1] = ch.target ?? TARGET[ch.ins];
  const race = clamp((l - clkIn) / Math.max(1, titleF - clkIn - 2));
  const val = lerp(t0, t1, Math.pow(race, 1.6));
  const slam = l >= titleF - 2;
  const clkP = backOut((l - clkIn) / (short ? 6 : 10), 1.6);
  const titleP = backOut((l - titleF + 1) / 9, 2.2);
  const outP = clamp((endF - l) / 8);
  const shake = slam && l < titleF + 8 ? (((l - titleF) % 2) ? -1 : 1) * (1 - (l - titleF) / 8) * 14 : 0;
  return (
    <AbsoluteFill>
      {showCard && (
        <div style={{ position: 'absolute', left: 70, right: 70, top: 560, transform: `scale(${cIn}) rotate(${(1 - cIn) * -4}deg)`, opacity: cOut, transformOrigin: '50% 50%' }}>
          <div style={{ background: 'linear-gradient(160deg, rgba(18,22,40,0.92), rgba(30,18,48,0.92))', border: '4px solid rgba(255,225,74,0.85)', borderRadius: 42, padding: '64px 56px 56px', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(255,200,40,0.25)' }}>
            <div style={{ position: 'absolute', top: -40, left: 56, background: '#ffe14a', color: '#111', fontFamily: TECH, fontSize: 52, padding: '8px 34px', borderRadius: 18, transform: `rotate(-3deg) scale(${backOut((l - cardIn - 4) / 8, 3)})`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>{fact.tag}</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, lineHeight: 1.12, color: '#fff' }}>{fact.text}</div>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 46, lineHeight: 1.2, color: '#c9d3ff', marginTop: 22, opacity: easeOut((l - cardIn - 14) / 10) }}>{fact.sub}</div>
            {fact.q && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 54, lineHeight: 1.15, color: '#ffe14a', marginTop: 30, opacity: qIn, transform: `translateY(${(1 - qIn) * 20}px)` }}>{fact.q}</div>}
          </div>
        </div>
      )}
      {l >= clkIn && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 520, textAlign: 'center', opacity: outP, transform: `translateX(${shake}px)` }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, letterSpacing: 8, color: '#9fe8ff', ...stroke(6), opacity: clkP }}>{tl.clockLabel ?? 'ВРЕМЯ ПОСЛЕ СОБЫТИЯ'}</div>
          <div style={{ display: 'inline-block', marginTop: 18, padding: '18px 44px', borderRadius: 28, background: 'rgba(5,10,20,0.75)', border: `4px solid ${slam ? '#ff3b3b' : '#2ae8ff'}`, boxShadow: `0 0 50px ${slam ? 'rgba(255,40,40,0.6)' : 'rgba(40,220,255,0.45)'}`, transform: `scale(${clkP * (slam ? 1 + 0.12 * Math.exp(-(l - titleF) * 0.3) : 1)})` }}>
            <span style={{ fontFamily: TECH, fontSize: 120, color: slam ? '#ff4b4b' : '#ffffff', letterSpacing: 4 }}>{slam ? ch.clock : clockText(val)}</span>
          </div>
          {l >= titleF - 1 && (
            <div style={{ marginTop: 40, fontFamily: FONT, fontWeight: 900, fontSize: 104, color: '#ffe14a', ...stroke(14), textShadow: '0 10px 30px rgba(0,0,0,0.6)', transform: `scale(${titleP})` }}>{ch.title}</div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ corner HUD (documentary feel)
export const CornerHud: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (tl.kind === 'game' || tl.kind === 'net' || tl.kind === 'liberty' || tl.kind === 'club') return null;
  const start = sf(tl.words[11].s);
  const end = sf(tl.inserts.OUTRO.start);
  if (f < start || f >= end) return null;
  let label = 'T−00:00:00';
  let col = '#7ff4ff';
  const ev = tl.words[29].s; // the moment IQ drops
  if (t < ev) { label = `ОБЫЧНЫЙ ДЕНЬ`; }
  else {
    const chs = tl.chapters.filter((c: any) => t >= c.start);
    const c = chs[chs.length - 1];
    label = c ? `T+ ${c.clock}` : `T+ ${fmt((t - ev) * 20)}`;
    col = '#ff6b6b';
  }
  if (t >= tl.inserts.BEAT2.start) { label = 'СЕЙЧАС'; col = '#7ff4ff'; }
  const inInterlude = tl.chapters.some((c: any) => f >= sf(c.ins_start) && f < sf(c.end) + 18);
  if (inInterlude) return null;
  const rec = Math.floor(f / 15) % 2 === 0;
  return (
    <div style={{ position: 'absolute', left: 60, top: 250, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 26px', borderRadius: 40, background: 'rgba(0,0,0,0.45)', border: '2px solid rgba(255,255,255,0.25)' }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: rec ? '#ff3030' : 'rgba(255,48,48,0.3)' }} />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#fff', letterSpacing: 2 }}>ЭКСПЕРИМЕНТ IQ&lt;0</div>
      <div style={{ fontFamily: TECH, fontSize: 30, color: col }}>{label}</div>
    </div>
  );
};

// ------------------------------------------------------------------ outro
export const OutroCard: React.FC = () => {
  const f = useCurrentFrame();
  if (!tl.inserts.OUTRO || tl.outro === null) return null;
  const s = sf(tl.inserts.OUTRO.start), l = f - s;
  if (l < 0) return null;
  const O = tl.outro ?? { big: ['А ТЫ КАК', 'ДУМАЕШЬ?'], small: ['Смогли бы мы вернуть', 'прежний мир?'], follow: 'Подпишись — впереди новые эксперименты' };
  const fast = !!O.fast;
  const a = fast ? backOut(l / 7, 1.8) : backOut((l - 4) / 12, 1.8), b = fast ? easeOut((l - 4) / 7) : easeOut((l - 22) / 12), c = fast ? backOut((l - 8) / 7, 2) : backOut((l - 46) / 12, 2), d = fast ? easeOut((l - 12) / 8) : easeOut((l - 70) / 14);
  const bounce = Math.abs(Math.sin(l * 0.15)) * 18;
  return (
    <AbsoluteFill>
      {fast && <AbsoluteFill style={{ background: 'rgba(5,6,20,0.55)', opacity: clamp(l / 6) }} />}
      <div style={{ position: 'absolute', top: 360, left: 60, right: 60, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 110, lineHeight: 1.05, color: '#ffe14a', ...stroke(16), transform: `scale(${a})`, textShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>{O.big[0]}<br />{O.big[1]}</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, lineHeight: 1.2, color: '#fff', ...stroke(10), marginTop: 40, opacity: b, transform: `translateY(${(1 - b) * 30}px)` }}>{O.small[0]}<br />{O.small[1]}</div>
      </div>
      <div style={{ position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', transform: `scale(${c})` }}>
        <div style={{ display: 'inline-block', background: '#ff3b3b', color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 56, padding: '22px 48px', borderRadius: 30, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>Пиши в комментариях</div>
        <div style={{ marginTop: 18, transform: `translateY(${bounce}px)` }}>
          <svg width="90" height="90" viewBox="0 0 90 90"><path d="M45 10 L45 70 M20 48 L45 74 L70 48" stroke="#fff" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1450, left: 60, right: 60, textAlign: 'center', opacity: d, fontFamily: FONT, fontWeight: 700, fontSize: 40, color: '#dfe6ff', ...stroke(6) }}>{O.follow}</div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ shot transitions (global overlay part) + vignette
export const TransitionFx: React.FC = () => {
  const f = useCurrentFrame();
  let flash = 0, black = 0, glitch = 0;
  for (const s of tl.shots) {
    const d = f - s.from;
    if (s.tr === 'flash') { if (d >= -3 && d < 0) flash = Math.max(flash, (d + 4) / 4 * 0.7); if (d >= 0 && d < 10) flash = Math.max(flash, 1 - d / 10); }
    if (s.tr === 'fade') { if (d >= -8 && d < 0) black = Math.max(black, (d + 8) / 8); if (d >= 0 && d < 10) black = Math.max(black, 1 - d / 10); }
    if (s.tr === 'glitch') { if (d >= -4 && d < 9) glitch = Math.max(glitch, 1 - Math.abs(d - 1) / 9); }
  }
  // extra flashes on big impacts
  for (const n of (tl.flashCues ?? ['shockwave', 'flash_hit', 'hook_boom'])) { if (!tl.cues[n]) continue; const c = sf(tl.cues[n].t); const d = f - c; if (d >= 0 && d < 8) flash = Math.max(flash, (1 - d / 8) * (n === 'hook_boom' ? 0.55 : 0.8)); }
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)' }} />
      {glitch > 0 && (
        <AbsoluteFill>
          {Array.from({ length: 9 }).map((_, i) => {
            const y = hash(i * 7.1 + Math.floor(f / 2) * 3.3) * 1920, h = 20 + hash(i + f) * 140;
            const c = i % 3 === 0 ? 'rgba(0,240,255,0.5)' : i % 3 === 1 ? 'rgba(255,0,90,0.5)' : 'rgba(255,255,255,0.35)';
            return <div key={i} style={{ position: 'absolute', left: (hash(i * 3 + f) - 0.5) * 300, top: y, width: 2200, height: h * glitch, background: c, mixBlendMode: 'screen' }} />;
          })}
        </AbsoluteFill>
      )}
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}
      {black > 0 && <AbsoluteFill style={{ background: '#000', opacity: black }} />}
    </AbsoluteFill>
  );
};

/** per-shot wrapper: enter/exit transforms for whip / zoom / glitch transitions */
export const ShotWrap: React.FC<{ shot: any; next?: any; children: React.ReactNode }> = ({ shot, next, children }) => {
  const f = useCurrentFrame(); // local to the Sequence
  const left = shot.dur - f;
  let tx = 0, sc = 1, blur = 0, ty = 0, rot = 0;
  const tr = shot.tr;
  if (tr === 'whip' && f < 6) { const p = 1 - easeOut(f / 6); tx = p * 110; sc = 1 + p * 0.22; blur = p * 22; }
  if (tr === 'zoomin' && f < 8) { const p = 1 - easeOut(f / 8); sc = 1 + p * 0.35; blur = p * 18; }
  if (tr === 'zoomout' && f < 8) { const p = 1 - easeOut(f / 8); sc = 1 + p * 0.5; blur = p * 14; rot = p * -4; }
  if (tr === 'glitch' && f < 8) { tx = (hash(f * 3.1) - 0.5) * 60 * (1 - f / 8); }
  const ntr = next?.tr;
  if (ntr === 'whip' && left <= 5) { const p = easeOut(1 - left / 5); tx = -p * 110; sc = 1 + p * 0.22; blur = p * 22; }
  if (ntr === 'zoomin' && left <= 5) { const p = (1 - left / 5); sc = 1 + p * p * 0.5; blur = p * 16; }
  if (ntr === 'zoomout' && left <= 5) { const p = (1 - left / 5); sc = 1 + p * p * 0.9; blur = p * 18; rot = p * 3; }
  if (ntr === 'glitch' && left <= 4) { tx = (hash(f * 5.7) - 0.5) * 80; ty = (hash(f * 2.3) - 0.5) * 30; }
  return (
    <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) scale(${sc}) rotate(${rot}deg)`, filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : undefined, overflow: 'hidden' }}>
      {children}
    </AbsoluteFill>
  );
};
export { ramp };
