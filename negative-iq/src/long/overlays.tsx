// 2D game UI for the long 16:9 version (1920×1080). Timed to the long voice by word index.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { tl, sf } from '../lib/tl';
import { clamp, backOut, easeOut, lerp, hash } from '../lib/anim';

const FONT = 'Montserrat, sans-serif';
const TECH = '"Russo One", Montserrat, sans-serif';
const stroke = (px: number, color = '#000') => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const });
const W = (i: number) => sf(tl.words[i].s);
const CUE = (n: string) => sf(tl.cues[n].t);
const shot = (id: string) => tl.shots.find((s: any) => s.id === id);
const inShot = (f: number, ...ids: string[]) => ids.some((id) => { const s = shot(id); return !!s && f >= s.from && f < s.to; });
const endOf = (id: string) => shot(id).to;

const Coin: React.FC<{ s?: number }> = ({ s = 44 }) => (
  <div style={{ width: s, height: s, borderRadius: s, background: 'radial-gradient(circle at 35% 30%, #fff3a0, #f5c542 45%, #b8860b)', border: '3px solid #7a5a00', boxShadow: '0 0 12px rgba(255,210,60,0.7)' }} />
);
const Pop: React.FC<{ f: number; a: number; d: number; children: React.ReactNode; style?: React.CSSProperties; rise?: number }> = ({ f, a, d, children, style, rise = 0 }) => {
  if (f < a || f >= a + d) return null;
  const l = f - a;
  return <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', transform: `translateY(${-l * rise}px) scale(${backOut(l / 9, 2.2)})`, opacity: clamp((a + d - f) / 8), ...style }}>{children}</div>;
};
const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; border?: string }> = ({ children, style, border = '#21f0ff' }) => (
  <div style={{ background: 'linear-gradient(160deg, rgba(14,18,40,0.94), rgba(30,14,52,0.94))', border: `4px solid ${border}`, borderRadius: 26, boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${border}55`, ...style }}>{children}</div>
);
/** slide-in window [a, b) */
const slide = (f: number, a: number, b: number, n = 10) => easeOut((f - a) / n) * clamp((b - f) / 8);

/** fact plaque, upper-left */
const Fact: React.FC<{ f: number; a: number; b: number; tag?: string; title: string; sub: string }> = ({ f, a, b, tag = 'ФАКТ', title, sub }) => {
  if (f < a || f >= b) return null;
  const s = slide(f, a, b, 12);
  return (
    <div style={{ position: 'absolute', left: 70, top: 80, width: 760, transform: `translateX(${(1 - s) * -820}px)` }}>
      <Panel style={{ padding: '46px 40px 34px', position: 'relative' }} border="#ffe14a">
        <div style={{ position: 'absolute', top: -30, left: 36, background: '#ffe14a', color: '#111', fontFamily: TECH, fontSize: 38, padding: '6px 26px', borderRadius: 14, transform: `rotate(-3deg) scale(${backOut((f - a - 4) / 8, 3)})` }}>{tag}</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, lineHeight: 1.1, color: '#fff' }}>{title}</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 34, lineHeight: 1.25, color: '#c9d3ff', marginTop: 14, opacity: easeOut((f - a - 12) / 10) }}>{sub}</div>
      </Panel>
    </div>
  );
};
const Big: React.FC<{ children: React.ReactNode; color?: string; size?: number; glow?: string }> = ({ children, color = '#ffd23f', size = 120, glow = 'rgba(255,210,60,0.8)' }) => (
  <div style={{ display: 'inline-block', fontFamily: TECH, fontSize: size, color, ...stroke(Math.round(size / 9)), textShadow: `0 0 50px ${glow}` }}>{children}</div>
);
const Toast: React.FC<{ title: string; sub?: string; border?: string; color?: string }> = ({ title, sub, border = '#21f0ff', color = '#fff' }) => (
  <Panel style={{ display: 'inline-block', padding: '20px 40px' }} border={border}>
    <div style={{ fontFamily: TECH, fontSize: 54, color }}>{title}</div>
    {sub && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: '#fff', marginTop: 4 }}>{sub}</div>}
  </Panel>
);

// icons for the inventory
const Key = () => (<svg width="78" height="78" viewBox="0 0 32 32"><circle cx="10" cy="16" r="6" fill="none" stroke="#ffd23f" strokeWidth="3.5" /><path d="M16 16 H29 M24 16 V21 M28 16 V20" stroke="#ffd23f" strokeWidth="3.5" strokeLinecap="round" /></svg>);
const Phone = () => (<svg width="78" height="78" viewBox="0 0 32 32"><rect x="9" y="3" width="14" height="26" rx="3" fill="#2d3436" stroke="#c9d3ff" strokeWidth="2" /><rect x="11" y="6" width="10" height="17" fill="#21f0ff" /><circle cx="16" cy="26" r="1.4" fill="#c9d3ff" /></svg>);
const Candy = () => (<svg width="78" height="78" viewBox="0 0 32 32"><path d="M3 10 L9 16 L3 22 Z M29 10 L23 16 L29 22 Z" fill="#ff7ab6" /><circle cx="16" cy="16" r="7.5" fill="#ff2a7a" stroke="#fff" strokeWidth="2" /><path d="M12 13 Q16 16 20 13" stroke="#fff" strokeWidth="1.8" fill="none" /></svg>);

const Menu: React.FC<{ f: number; a: number; items: string[]; sel: number; danger?: number; gone?: number; goneAt?: number; note?: React.ReactNode }> = ({ f, a, items, sel, danger = -1, gone = -1, goneAt = 1e9, note }) => (
  <div style={{ position: 'absolute', left: 560, width: 800, top: 70, transform: `scale(${backOut((f - a) / 10, 1.4)})` }}>
    <div style={{ fontFamily: TECH, fontSize: 96, color: '#fff', textAlign: 'center', ...stroke(10) }}>ПАУЗА</div>
    <Panel style={{ marginTop: 20, padding: '20px 24px' }}>
      {items.map((it, i) => {
        if (i === gone && f >= goneAt + 14) return null;
        const gl = i === gone && f >= goneAt;
        return (
          <div key={it} style={{ fontFamily: TECH, fontSize: 48, padding: '12px 22px', borderRadius: 14, marginTop: i ? 8 : 0, color: i === danger ? '#ff4b4b' : '#fff', background: sel === i ? (i === danger ? 'rgba(255,40,60,0.25)' : 'rgba(33,240,255,0.18)') : 'transparent', border: sel === i ? `4px solid ${i === danger ? '#ff3b3b' : '#21f0ff'}` : '4px solid transparent', transform: gl ? `translateX(${(hash(f) - 0.5) * 60}px) skewX(${(hash(f * 7) - 0.5) * 30}deg)` : i === danger ? `translateX(${(hash(f) - 0.5) * 10}px)` : 'none', opacity: gl ? (f % 3 ? 0.3 : 1) : 1, filter: gl ? 'hue-rotate(120deg)' : 'none' }}>{sel === i ? '▶ ' : '   '}{it}</div>
        );
      })}
      {note}
    </Panel>
  </div>
);

export const LongMoments: React.FC = () => {
  const f = useCurrentFrame();
  const H = tl.hud;
  const out: React.ReactNode[] = [];
  // ---------- morning
  out.push(<Pop key="lvl" f={f} a={W(58) - 2} d={48} style={{ top: 170 }}><Big size={130}>УРОВЕНЬ 1</Big></Pop>);
  {
    const a = W(74) - 3, b = W(82) - 4;
    if (f >= a && f < b) {
      const s = slide(f, a, b);
      const ok = f >= W(79) - 2;
      out.push(
        <div key="tut" style={{ position: 'absolute', right: 110, top: 120, width: 620, transform: `translateY(${(1 - s) * -400}px)`, opacity: s }}>
          <Panel style={{ padding: '28px 34px' }} border="#7dffb0">
            <div style={{ fontFamily: TECH, fontSize: 44, color: '#7dffb0' }}>ОБУЧЕНИЕ</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#fff', marginTop: 10, lineHeight: 1.15 }}>Чтобы идти — просто иди.</div>
            <div style={{ display: 'inline-block', marginTop: 22, fontFamily: TECH, fontSize: 36, padding: '8px 34px', borderRadius: 14, color: ok ? '#111' : '#fff', background: ok ? '#7dffb0' : 'rgba(255,255,255,0.08)', border: '3px solid #7dffb0', transform: ok && f < W(79) + 6 ? 'scale(0.92)' : 'none' }}>[ ПОНЯТНО ]</div>
          </Panel>
        </div>,
      );
    }
  }
  {
    const a = W(93) - 2, b = endOf('L12_inventory');
    if (f >= a && f < b) {
      const s = slide(f, a, b, 9);
      const items = [[W(95), <Key />, 'Ключи'], [W(96), <Phone />, 'Телефон'], [W(98), <Candy />, 'Конфета ×1']] as const;
      const pulse = f >= W(100) - 2 ? 0.5 + 0.5 * Math.sin(f * 0.35) : 0;
      out.push(
        <div key="inv" style={{ position: 'absolute', right: 100, top: 100, width: 660, transform: `scale(${s})`, transformOrigin: '100% 0', opacity: s }}>
          <Panel style={{ padding: '24px 28px' }}>
            <div style={{ fontFamily: TECH, fontSize: 44, color: '#21f0ff' }}>ИНВЕНТАРЬ</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 130px)', gap: 16, marginTop: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => {
                const it = items[i];
                const on = it && f >= it[0] - 2;
                return (
                  <div key={i} style={{ width: 130, height: 130, borderRadius: 16, border: `3px solid ${on ? '#ffd23f' : `rgba(33,240,255,${0.35 + pulse * 0.6})`}`, background: on ? 'rgba(255,210,60,0.12)' : `rgba(33,240,255,${0.04 + pulse * 0.12})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: !on && pulse ? `0 0 ${20 * pulse}px rgba(33,240,255,0.6)` : 'none' }}>
                    {on && <div style={{ transform: `scale(${backOut((f - it[0] + 2) / 8, 2.5)})` }}>{it[1]}</div>}
                    {on && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: '#fff' }}>{it[2]}</div>}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>,
      );
    }
  }
  // ---------- 10 minutes
  out.push(<Pop key="xp5" f={f} a={W(164) - 2} d={44} rise={2} style={{ top: 190 }}><Big color="#7dffb0" glow="#21f0ff">+5 ОПЫТА</Big></Pop>);
  {
    const a = W(186) - 2, b = endOf('L18_choice');
    if (f >= a && f < b) {
      const s = slide(f, a, b);
      const picked = f >= W(192) - 2;
      const opts = ['Кашу', 'Яичницу', '«Мам, я в игре!»'];
      out.push(
        <div key="ch" style={{ position: 'absolute', right: 90, top: 110, width: 700, transform: `translateX(${(1 - s) * 800}px)` }}>
          <Panel style={{ padding: '24px 28px' }} border="#ffd23f">
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: '#ffd23f' }}>Что будешь на завтрак?</div>
            {opts.map((o, i) => {
              const hi = picked ? i === 0 : Math.floor(f / 12) % 3 === i;
              return <div key={o} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color: picked && i ? 'rgba(255,255,255,0.35)' : '#fff', marginTop: 12, padding: '8px 18px', borderRadius: 12, background: hi ? 'rgba(255,210,60,0.2)' : 'transparent', border: `3px solid ${hi ? '#ffd23f' : 'transparent'}` }}>{i + 1}. {o}</div>;
            })}
            {f >= W(197) - 4 && <div style={{ fontFamily: TECH, fontSize: 32, color: '#7dffb0', marginTop: 14, opacity: easeOut((f - W(197) + 4) / 8) }}>✓ ВЫБОР ЗАПОМНЕН…</div>}
          </Panel>
        </div>,
      );
    }
  }
  // ---------- 1 hour
  out.push(<Pop key="x7" f={f} a={W(229) - 2} d={44} style={{ top: 150 }}><Big size={110} color="#fff" glow="rgba(255,60,60,0.8)">7-Й РАЗ</Big></Pop>);
  out.push(<Fact key="lod" f={f} a={W(263) - 2} b={endOf('L23_lodfact')} title="Уровень детализации (LOD)" sub="В играх далёкие предметы рисуются проще, чем близкие, — так компьютер экономит силы." />);
  out.push(<Pop key="xp" f={f} a={sf(H.xp) - 2} d={46} rise={2} style={{ top: 160 }}><Big color="#7dffb0" glow="#21f0ff">+10 ОПЫТА</Big></Pop>);
  out.push(<Pop key="lu" f={f} a={W(295) - 2} d={44} style={{ top: 170 }}><Big size={110}>НОВЫЙ УРОВЕНЬ!</Big></Pop>);
  // ---------- day 1
  {
    const a = W(299) - 4, b = W(337) - 2;
    if (f >= a && f < b) {
      const s = slide(f, a, b);
      const breadDone = f >= W(310) - 2;
      const bossOn = f >= W(317) - 2;
      const named = f >= W(323) - 2;
      out.push(
        <div key="q" style={{ position: 'absolute', right: 70, top: 100, width: 600, transform: `translateX(${(1 - s) * 700}px)` }}>
          <Panel style={{ padding: '22px 28px' }} border="#ffd23f">
            <div style={{ fontFamily: TECH, fontSize: 40, color: '#ffd23f' }}>! ЗАДАНИЯ</div>
            {[['Купи хлеб', 'награда: 100 монет', breadDone, true], ['Победи босса', named ? 'босс: учитель математики' : 'награда: ???', false, bossOn]].map(([t, sub, done, vis], i) => vis ? (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, border: '4px solid #fff', background: done ? '#3cff6e' : 'transparent', color: '#000', fontSize: 32, fontWeight: 900, textAlign: 'center', lineHeight: '36px', fontFamily: FONT }}>{done ? '✓' : ''}</div>
                <div>
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 38, color: '#fff', textDecoration: done ? 'line-through' : 'none' }}>{t as string}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: '#c9d3ff' }}>{sub as string}</div>
                </div>
              </div>
            ) : null)}
          </Panel>
        </div>,
      );
    }
  }
  out.push(<Pop key="coins" f={f} a={sf(H.coins) - 2} d={44} rise={2} style={{ top: 200 }}><div style={{ display: 'inline-flex', alignItems: 'center', gap: 20 }}><Coin s={96} /><Big size={110}>+100</Big></div></Pop>);
  {
    const a = W(320) - 3, b = shot('L29_wall').from;
    if (f >= a && f < b) {
      const named = f >= W(323) - 2;
      const sh = f < a + 10 ? (hash(f) - 0.5) * 24 : 0;
      out.push(
        <div key="boss" style={{ position: 'absolute', left: 430, right: 730, top: 46, transform: `translateX(${sh}px)` }}>
          <div style={{ fontFamily: TECH, fontSize: 46, color: '#fff', ...stroke(8), textAlign: 'center', textShadow: '0 0 30px #ff2a3a' }}>{named ? 'БОСС: УЧИТЕЛЬ МАТЕМАТИКИ' : 'БОСС: ???'}</div>
          <div style={{ marginTop: 10, height: 36, background: '#2a0008', border: '4px solid #000', borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 30px rgba(255,40,60,0.6)' }}>
            <div style={{ width: `${clamp((f - a) / 14) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#ff2a3a,#ff7a2a)' }} />
          </div>
        </div>,
      );
    }
  }
  out.push(<Pop key="wall" f={f} a={CUE('wall_hit')} d={60} style={{ top: 200 }}><Toast title="ГРАНИЦА КАРТЫ" sub="Дальше пути нет" border="#ff3b3b" color="#ff4b4b" /></Pop>);
  // ---------- day 2
  out.push(<Pop key="secret" f={f} a={W(396) - 2} d={60} style={{ top: 120 }}><Toast title="СЕКРЕТНАЯ ЛОКАЦИЯ!" sub="Найдено: 1 из ???" border="#ffd23f" color="#ffd23f" /></Pop>);
  out.push(<Fact key="egg" f={f} a={W(408)} b={endOf('L34_egg')} tag="ПАСХАЛКА" title="Секрет, спрятанный разработчиками" sub="В 1979 году создатель игры спрятал в ней тайную комнату со своим именем — тогда авторов не указывали в титрах." />);
  // ---------- day 3
  if (inShot(f, 'L36_lag')) out.push(<div key="spin" style={{ position: 'absolute', right: 120, top: 110 }}><div style={{ width: 110, height: 110, borderRadius: 55, border: '14px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', transform: `rotate(${Math.floor(f / 4) * 45}deg)` }} /></div>);
  out.push(<Pop key="oob" f={f} a={W(489)} d={60} style={{ top: 120 }}><Toast title="ОШИБКА" sub="Игрок вне карты" border="#ff3b3b" color="#ff4b4b" /></Pop>);
  {
    const a = W(513) - 4;
    if (f >= a && f < a + 70) {
      const done = f > a + 30;
      out.push(
        <div key="resp" style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center' }}>
          <Panel style={{ display: 'inline-flex', alignItems: 'center', gap: 22, padding: '18px 34px', transform: `scale(${backOut((f - a) / 9, 2)})` }} border={done ? '#3cff6e' : '#21f0ff'}>
            <div style={{ width: 56, height: 56, borderRadius: 28, border: '8px solid rgba(255,255,255,0.25)', borderTopColor: done ? '#3cff6e' : '#fff', transform: `rotate(${done ? 0 : (f - a) * 20}deg)` }} />
            <div style={{ fontFamily: TECH, fontSize: 48, color: done ? '#3cff6e' : '#fff' }}>{done ? 'ПОСЛЕДНЯЯ ТОЧКА СОХРАНЕНИЯ' : 'ЗАГРУЗКА…'}</div>
          </Panel>
        </div>,
      );
    }
  }
  out.push(<Fact key="lag" f={f} a={W(516)} b={endOf('L41_lagfact')} title="«Лаг» — от английского lag" sub="Значит «отставание»: это когда мир не успевает за тобой." />);
  // ---------- day 5
  {
    const a = W(556) - 3, b = endOf('L44_players');
    if (f >= a && f < b) {
      const s = slide(f, a, b);
      const lines = [['Игрок_2', 'Эй! Ты тоже настоящий?', a], ['Игрок_2', 'Я тут уже неделю', W(570)], ['Игрок_2', 'Нас много. Просто они не знают', W(580)]] as const;
      out.push(
        <div key="chat" style={{ position: 'absolute', right: 70, top: 80, width: 620, opacity: s }}>
          <div style={{ background: 'rgba(5,8,20,0.72)', borderRadius: 18, border: '3px solid rgba(125,255,176,0.6)', padding: '14px 20px' }}>
            <div style={{ fontFamily: TECH, fontSize: 28, color: '#7dffb0' }}>ЧАТ</div>
            {lines.filter((l) => f >= l[2]).map((l, i) => <div key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: '#fff', marginTop: 6 }}><span style={{ color: '#ff8c42' }}>{l[0]}:</span> {l[1]}</div>)}
          </div>
        </div>,
      );
    }
  }
  out.push(<Pop key="life" f={f} a={W(607) - 2} d={50} rise={2} style={{ top: 140 }}><Big size={120} color="#ff4b4b" glow="rgba(255,40,60,0.9)">−1 ЖИЗНЬ</Big></Pop>);
  out.push(<Pop key="resp2" f={f} a={W(611) - 2} d={40} style={{ top: 160 }}><Toast title="ВОЗРОЖДЕНИЕ" border="#7dffb0" color="#7dffb0" /></Pop>);
  // ---------- day 7
  for (const [n, a] of [['sv1', W(641) - 4], ['sv2', W(649) - 3]] as const) {
    if (f >= a && f < a + 56) {
      const done = f > a + 24;
      out.push(
        <div key={n} style={{ position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center' }}>
          <Panel style={{ display: 'inline-flex', alignItems: 'center', gap: 22, padding: '18px 34px', transform: `scale(${backOut((f - a) / 9, 2)})` }} border={done ? '#3cff6e' : '#21f0ff'}>
            <div style={{ width: 60, height: 60, background: '#2d3e8f', borderRadius: 8, border: '4px solid #fff', position: 'relative', transform: done ? 'none' : `rotate(${(f - a) * 12}deg)` }}><div style={{ position: 'absolute', left: 13, top: 4, width: 28, height: 16, background: '#c9ced6' }} /></div>
            <div style={{ fontFamily: TECH, fontSize: 50, color: done ? '#3cff6e' : '#fff' }}>{done ? 'ИГРА СОХРАНЕНА ✓' : 'СОХРАНЕНИЕ…'}</div>
          </Panel>
        </div>,
      );
    }
  }
  for (const n of ['load1', 'load2']) {
    const a = CUE(n);
    if (f >= a && f < a + 30) {
      out.push(
        <AbsoluteFill key={n}>
          <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 3px, rgba(0,0,0,0) 3px 7px)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: TECH, fontSize: 100, color: '#fff', ...stroke(10), opacity: (f - a) % 8 < 6 ? 1 : 0.4 }}>◀◀ ЗАГРУЗКА</div>
          {[0, 1, 2].map((i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: hash(i * 9 + f) * 1000, height: 14 + hash(i + f * 3) * 30, background: 'rgba(255,255,255,0.18)' }} />)}
        </AbsoluteFill>,
      );
    }
  }
  {
    const a = W(652) - 2;
    if (f >= a && f < a + 72) {
      const s = slide(f, a, a + 72);
      out.push(
        <div key="ach" style={{ position: 'absolute', left: 560, width: 800, top: 70, transform: `translateY(${(1 - s) * -200}px)`, opacity: s }}>
          <Panel style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '18px 28px' }} border="#ffd23f">
            <div style={{ width: 90, height: 90, borderRadius: 45, background: 'radial-gradient(circle at 35% 30%, #fff3a0, #f5c542 50%, #b8860b)', border: '4px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TECH, fontSize: 52 }}>★</div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#ffd23f', letterSpacing: 2 }}>ДОСТИЖЕНИЕ ПОЛУЧЕНО</div>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#fff' }}>Лучшая жизнь на свете</div>
            </div>
          </Panel>
        </div>,
      );
    }
  }
  out.push(<Fact key="react" f={f} a={W(656)} b={endOf('L52_reaction')} title="Средняя реакция ≈ 0,25 секунды" sub="Примерно столько нужно человеку, чтобы заметить сигнал и нажать кнопку." />);
  // ---------- day 14
  {
    const m = shot('L55_noload');
    const end = W(716) - 2;
    if (f >= m.from && f < end) {
      const goneAt = W(709) - 2;
      out.push(<Menu key="menu1" f={f} a={m.from} items={['ПРОДОЛЖИТЬ', 'ЗАГРУЗИТЬ', 'НАСТРОЙКИ']} sel={f < W(708) - 6 ? 0 : 1} gone={1} goneAt={goneAt}
        note={f >= W(712) - 2 ? <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#ff6b6b', marginTop: 14, padding: '0 22px' }}>⚠ Сохранения отключены в версии 1.1</div> : null} />);
    }
  }
  out.push(<Fact key="upd" f={f} a={W(723)} b={endOf('L56_updates')} tag="ФАКТ" title="Игры обновляются годами" sub="Разработчики чинят баги, добавляют новое — и иногда убирают то, что игрокам нравилось больше всего." />);
  // ---------- day 21
  out.push(<Pop key="ban" f={f} a={W(790) - 2} d={50} style={{ top: 110 }}><Toast title="БАН" sub="Нарушители заблокированы" border="#ff3b3b" color="#ff4b4b" /></Pop>);
  out.push(<Pop key="bug" f={f} a={W(818) - 1} d={50} style={{ top: 120 }}><Toast title="БАГ НАЙДЕН" sub="Проход сквозь стену" border="#ff2bd6" color="#ff7ae0" /></Pop>);
  if (inShot(f, 'L62_speedrun')) {
    const s = shot('L62_speedrun');
    const t = (f - s.from) / 30 * 1.37;
    const mm = Math.floor(t / 60), ss = Math.floor(t % 60), cs = Math.floor((t * 100) % 100);
    out.push(
      <div key="sr" style={{ position: 'absolute', right: 70, top: 70, textAlign: 'right' }}>
        <div style={{ fontFamily: TECH, fontSize: 30, color: '#7dffb0' }}>SPEEDRUN · ANY%</div>
        <div style={{ fontFamily: TECH, fontSize: 92, color: '#fff', ...stroke(8), textShadow: '0 0 30px #7dffb0' }}>{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}.{String(cs).padStart(2, '0')}</div>
      </div>,
    );
  }
  out.push(<Fact key="sr2" f={f} a={W(838) - 2} b={endOf('L62_speedrun')} tag="ФАКТ" title="Спидраннеры" sub="Ищут баги, чтобы пройти игру как можно быстрее. Некоторые огромные игры проходят меньше чем за 10 минут." />);
  // ---------- day 30
  {
    const m = shot('L63_menu');
    if (f >= m.from && f < m.to) {
      const sel = f < CUE('menu_move1') ? 0 : f < CUE('menu_move2') ? 1 : f < W(858) - 2 ? 2 : 3;
      out.push(<Menu key="menu2" f={f} a={m.from} items={['ПРОДОЛЖИТЬ', 'НАСТРОЙКИ', 'СОХРАНИТЬ', 'ВЫЙТИ ИЗ ИГРЫ']} sel={sel} danger={3} />);
    }
  }
  {
    const a = W(865) - 3, b = shot('L65_lab').from;
    if (f >= a && f < b) {
      out.push(
        <div key="dlg" style={{ position: 'absolute', left: 510, width: 900, top: 140, transform: `scale(${backOut((f - a) / 9, 1.8)})` }}>
          <Panel style={{ padding: '36px 40px 32px', textAlign: 'center' }} border="#ff3b3b">
            <div style={{ fontFamily: TECH, fontSize: 72, color: '#fff' }}>ВЫ УВЕРЕНЫ?</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#ffb3b3', marginTop: 12 }}>Весь прогресс будет потерян</div>
            <div style={{ display: 'flex', gap: 30, justifyContent: 'center', marginTop: 30 }}>
              {['ДА', 'НЕТ'].map((b2, i) => <div key={b2} style={{ fontFamily: TECH, fontSize: 52, padding: '12px 60px', borderRadius: 18, color: '#fff', background: i === 0 ? '#c0182c' : '#1d2440', border: `4px solid ${i === 0 ? '#ff5a6a' : '#21f0ff'}`, transform: i === 0 ? `scale(${1 + 0.05 * Math.sin(f * 0.3)})` : 'none' }}>{b2}</div>)}
            </div>
          </Panel>
        </div>,
      );
    }
  }
  // ---------- simulation
  out.push(<Fact key="bost" f={f} a={W(890) - 2} b={endOf('L67_bostrom')} tag="2003" title="Философ Ник Бостром" sub="«Аргумент о симуляции»: простое рассуждение о том, сколько может существовать смоделированных миров." />);
  {
    const s = shot('L68_worlds');
    if (f >= s.from && f < s.to) {
      const g0 = W(901) - 8;
      const p = clamp((f - g0) / (s.to - g0 - 20));
      const n = f < g0 ? 1 : Math.round(Math.pow(10, lerp(0, 6, Math.pow(p, 1.3))));
      out.push(
        <div key="cnt" style={{ position: 'absolute', right: 70, top: 70, textAlign: 'right' }}>
          <Panel style={{ display: 'inline-block', padding: '16px 30px', textAlign: 'left' }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#9fe8ff' }}>СИМУЛЯЦИЙ</div>
            <div style={{ fontFamily: TECH, fontSize: 72, color: '#fff' }}>{n.toLocaleString('ru-RU')}</div>
            {f >= W(911) - 2 && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 32, color: '#ffd23f', marginTop: 6 }}>НАСТОЯЩИЙ МИР: 1</div>}
          </Panel>
        </div>,
      );
    }
  }
  {
    const s = shot('L69_chance');
    if (f >= s.from && f < s.to) {
      out.push(
        <div key="ch2" style={{ position: 'absolute', right: 70, top: 70, textAlign: 'right' }}>
          <Panel style={{ display: 'inline-block', padding: '16px 30px', textAlign: 'left' }} border="#ff2bd6">
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#ffb3f0' }}>ШАНС, ЧТО НАШ МИР НАСТОЯЩИЙ</div>
            <div style={{ fontFamily: TECH, fontSize: 72, color: '#fff' }}>1 из ???</div>
          </Panel>
        </div>,
      );
      for (const [k2, a, txt, col] of [['nd', W(931) - 2, 'НЕ ДОКАЗАТЕЛЬСТВО', '#ffffff'], ['hy', W(933) - 2, 'ГИПОТЕЗА', '#ffd23f']] as const) {
        if (f >= a) out.push(<div key={k2} style={{ position: 'absolute', left: k2 === 'nd' ? 140 : 300, top: k2 === 'nd' ? 120 : 250, transform: `rotate(${k2 === 'nd' ? -6 : -3}deg) scale(${backOut((f - a) / 7, 3)})`, fontFamily: TECH, fontSize: k2 === 'nd' ? 64 : 96, color: col, border: `8px solid ${col}`, borderRadius: 18, padding: '6px 30px', background: 'rgba(5,8,20,0.55)', ...stroke(4) }}>{txt}</div>);
      }
    }
  }
  out.push(<Fact key="planck" f={f} a={W(944)} b={endOf('L70_pixels')} tag="ФИЗИКА" title="Планковская длина ≈ 1,6·10⁻³⁵ м" sub="Меньше неё расстояния уже нельзя описать привычными законами физики. Отсюда шутка про «пиксели» Вселенной." />);
  {
    const a = W(988) + 4, b = endOf('L73_press');
    if (f >= a && f < b) out.push(<div key="btn" style={{ position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', transform: `scale(${backOut((f - a) / 9, 2)})` }}><div style={{ display: 'inline-block', fontFamily: TECH, fontSize: 70, color: '#fff', background: 'rgba(190,10,30,0.85)', padding: '14px 44px', borderRadius: 20, border: '4px solid #ff6a7a', textShadow: '0 0 20px #ff2a3a' }}>ВЫЙТИ ИЗ ИГРЫ</div></div>);
  }
  // ---------- CTA
  {
    const s = shot('L74_cta');
    const net = W(1009) - 4;
    if (f >= s.from && f < net) {
      const a = W(997) - 2;
      out.push(
        <div key="cta" style={{ position: 'absolute', left: 90, top: 110, width: 960 }}>
          {f >= a && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 70, color: '#fff', ...stroke(10), transform: `scale(${backOut((f - a) / 9, 2)})`, transformOrigin: '0 50%' }}>НАПИШИ В КОММЕНТАРИЯХ:</div>}
          <div style={{ display: 'flex', gap: 40, marginTop: 34 }}>
            {[['ДА', W(1000) - 2, '#c0182c', '#ff5a6a'], ['НЕТ', W(1002) - 2, '#1d2440', '#21f0ff']].map(([t, b, bg, bd]) => f >= (b as number) ? <div key={t as string} style={{ fontFamily: TECH, fontSize: 96, padding: '14px 70px', borderRadius: 26, color: '#fff', background: bg as string, border: `6px solid ${bd}`, transform: `scale(${backOut((f - (b as number)) / 9, 2.5)})` }}>{t as string}</div> : null)}
          </div>
          {f >= W(1004) - 2 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 18, marginTop: 50, fontFamily: FONT, fontWeight: 900, fontSize: 52, color: '#fff', background: f >= W(1004) + 12 ? '#3a3a3a' : '#e62117', padding: '16px 40px', borderRadius: 16, transform: `scale(${backOut((f - W(1004) + 2) / 9, 2) * (f >= W(1004) + 8 && f < W(1004) + 12 ? 0.92 : 1)})`, transformOrigin: '0 50%' }}>
              {f >= W(1004) + 12 ? '✓ ВЫ ПОДПИСАНЫ' : 'ПОДПИСАТЬСЯ'}
            </div>
          )}
        </div>,
      );
    }
    const t0 = W(1012) - 4;
    if (f >= t0 && f < s.to) {
      out.push(
        <div key="next" style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', transform: `scale(${backOut((f - t0) / 10, 1.8)})` }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#9fe8ff', letterSpacing: 6, ...stroke(5) }}>СЛЕДУЮЩИЙ ЭКСПЕРИМЕНТ</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 92, color: '#ffe14a', ...stroke(12), marginTop: 8 }}>ЧТО, ЕСЛИ ПРОПАДЁТ ИНТЕРНЕТ?</div>
        </div>,
      );
    }
  }
  // ---------- end screen (YouTube end-screen elements go into the framed slots)
  {
    const s = shot('END');
    if (f >= s.from) {
      const l = f - s.from;
      const p = backOut(l / 14, 1.5);
      out.push(
        <AbsoluteFill key="end">
          <div style={{ position: 'absolute', left: 760, right: 60, top: 110, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 76, color: '#fff', ...stroke(10), transform: `scale(${p})` }}>СМОТРИ ДАЛЬШЕ</div>
          {[0, 1].map((i) => (
            <div key={i} style={{ position: 'absolute', left: 760 + i * 580, top: 280, width: 540, height: 304, borderRadius: 20, border: '5px solid #21f0ff', boxShadow: `0 0 ${30 + 10 * Math.sin(l * 0.1 + i)}px rgba(33,240,255,0.7)`, background: 'rgba(5,8,20,0.45)', transform: `scale(${backOut((l - 6 - i * 4) / 12, 1.6)})` }} />
          ))}
          <div style={{ position: 'absolute', left: 1180, top: 660, width: 200, height: 200, borderRadius: 100, border: '6px solid #ffd23f', boxShadow: '0 0 40px rgba(255,210,60,0.6)', background: 'rgba(5,8,20,0.45)', transform: `scale(${backOut((l - 14) / 12, 1.6)})` }} />
          <div style={{ position: 'absolute', left: 760, right: 60, top: 890, textAlign: 'center', fontFamily: TECH, fontSize: 46, color: '#ffd23f', ...stroke(6), opacity: clamp((l - 20) / 10) }}>ПОДПИШИСЬ — ВПЕРЕДИ НОВЫЕ ЭКСПЕРИМЕНТЫ</div>
        </AbsoluteFill>,
      );
    }
  }
  return <AbsoluteFill style={{ pointerEvents: 'none' }}>{out}</AbsoluteFill>;
};
