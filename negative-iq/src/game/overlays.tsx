import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { tl, sf, FPS } from '../lib/tl';
import { clamp, backOut, easeOut, lerp, hash, smoother } from '../lib/anim';

const FONT = 'Montserrat, sans-serif';
const TECH = '"Russo One", Montserrat, sans-serif';
const stroke = (px: number, color = '#000') => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const });
const W = (i: number) => sf(tl.words[i].s);
const WE = (i: number) => sf(tl.words[i].e);
const CUE = (n: string) => sf(tl.cues[n].t);
const shot = (id: string) => tl.shots.find((s: any) => s.id === id);
const inShot = (f: number, ...ids: string[]) => ids.some((id) => { const s = shot(id); return f >= s.from && f < s.to; });
const inInterlude = (f: number) => tl.chapters.some((c: any) => f >= sf(c.ins_start) && f < sf(c.end) + 18);

const Coin: React.FC<{ s?: number }> = ({ s = 44 }) => (
  <div style={{ width: s, height: s, borderRadius: s, background: 'radial-gradient(circle at 35% 30%, #fff3a0, #f5c542 45%, #b8860b)', border: '3px solid #7a5a00', boxShadow: '0 0 12px rgba(255,210,60,0.7)' }} />
);
const Heart: React.FC<{ on: boolean; s?: number }> = ({ on, s = 46 }) => (
  <svg width={s} height={s} viewBox="0 0 32 32"><path d="M16 29 C3 20 1 13 4 8 C7 3 13 4 16 9 C19 4 25 3 28 8 C31 13 29 20 16 29Z" fill={on ? '#ff2a4a' : '#3a2a34'} stroke="#000" strokeWidth="2.5" /></svg>
);

// ------------------------------------------------------------------ persistent HUD
export const GameHud: React.FC = () => {
  const f = useCurrentFrame();
  const H = tl.hud;
  const show = (f >= sf(H.start) && f < sf(H.end)) || inShot(f, 'gh2_world', 'gh3_pixel');
  if (!show || inInterlude(f) || inShot(f, 'title', 'loading')) return null;
  const tease = inShot(f, 'gh2_world', 'gh3_pixel');
  const flick = tease ? (hash(Math.floor(f / 3)) > 0.35 ? 1 : 0.15) : 1;
  const t = f / FPS;
  const lvl = t < H.lvl2 ? 1 : t < tl.inserts.I4.start ? 2 + (t > sf(H.coins) / FPS ? 1 : 0) : t < tl.inserts.I5.start ? 6 : t < tl.inserts.I6.start ? 11 : 30;
  const xp = t < H.xp ? 0.15 : t < H.lvl2 ? lerp(0.15, 1, easeOut((t - H.xp) / 0.6)) : t < tl.inserts.I4.start ? 0.25 : 0.6;
  let hp = 5;
  if (t >= H.wall) hp = 4;
  if (t >= H.fall + 1.2) hp = 3;
  if (t >= H.load) hp = 5;
  const coins = t < H.coins ? 0 : t < tl.inserts.I5.start ? 100 : t < tl.inserts.I6.start ? 4250 : 99999;
  const coinPop = t >= H.coins && t < H.coins + 0.5 ? 1 + 0.3 * Math.sin(((t - H.coins) / 0.5) * Math.PI) : 1;
  const lag = t >= H.lag0 && t < H.lag1 && !inInterlude(f);
  const appear = backOut((f - sf(H.start)) / 10, 1.6);
  return (
    <div style={{ position: 'absolute', left: 50, top: 240, opacity: flick, transform: `scale(${tease ? 1 : Math.min(1, appear)})`, transformOrigin: '0 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(5,8,20,0.6)', borderRadius: 22, border: '3px solid rgba(255,255,255,0.25)' }}>
        {[0, 1, 2, 3, 4].map((i) => <Heart key={i} on={i < hp} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, padding: '8px 18px', background: 'rgba(5,8,20,0.6)', borderRadius: 22, border: '3px solid rgba(255,255,255,0.25)', width: 430 }}>
        <div style={{ fontFamily: TECH, fontSize: 34, color: '#ffd23f', minWidth: 110 }}>УР. {lvl}</div>
        <div style={{ flex: 1, height: 18, background: '#1d2440', borderRadius: 9, overflow: 'hidden', border: '2px solid #000' }}>
          <div style={{ width: `${xp * 100}%`, height: '100%', background: 'linear-gradient(90deg,#21f0ff,#7b5cff)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '8px 18px', background: 'rgba(5,8,20,0.6)', borderRadius: 22, border: '3px solid rgba(255,255,255,0.25)', width: 'fit-content', transform: `scale(${coinPop})`, transformOrigin: '0 50%' }}>
        <Coin s={38} />
        <div style={{ fontFamily: TECH, fontSize: 34, color: '#fff' }}>{coins.toLocaleString('ru-RU')}</div>
      </div>
      {lag && (
        <div style={{ marginTop: 12, padding: '8px 18px', background: 'rgba(120,0,10,0.75)', borderRadius: 18, border: '3px solid #ff3b3b', width: 'fit-content', fontFamily: TECH, fontSize: 32, color: '#fff', opacity: (f % 10) < 6 ? 1 : 0.5 }}>
          PING 999 мс · FPS 3
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ one-off game UI moments
const Pop: React.FC<{ f: number; a: number; d: number; children: React.ReactNode; style?: React.CSSProperties; rise?: number }> = ({ f, a, d, children, style, rise = 0 }) => {
  if (f < a || f >= a + d) return null;
  const l = f - a;
  const s = backOut(l / 9, 2.2);
  const o = clamp((a + d - f) / 8);
  return <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', transform: `translateY(${-l * rise}px) scale(${s})`, opacity: o, ...style }}>{children}</div>;
};
const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; border?: string }> = ({ children, style, border = '#21f0ff' }) => (
  <div style={{ background: 'linear-gradient(160deg, rgba(14,18,40,0.94), rgba(30,14,52,0.94))', border: `4px solid ${border}`, borderRadius: 30, boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${border}55`, ...style }}>{children}</div>
);

export const GameMoments: React.FC = () => {
  const f = useCurrentFrame();
  const H = tl.hud;
  const out: React.ReactNode[] = [];
  // hook: PRESS START
  if (inShot(f, 'gh3_pixel')) {
    out.push(<div key="ps" style={{ position: 'absolute', top: 720, left: 0, right: 0, textAlign: 'center', fontFamily: TECH, fontSize: 96, color: '#fff', ...stroke(10), textShadow: '0 0 40px #ff2bd6', opacity: (f % 12) < 8 ? 1 : 0.2 }}>НАЖМИ СТАРТ</div>);
  }
  // loading screen
  const ld = shot('loading');
  if (f >= ld.from && f < ld.to) {
    const p = clamp((f - ld.from) / (ld.dur - 14));
    const pct = Math.min(100, Math.round(easeOut(p) * 100));
    out.push(
      <div key="ld" style={{ position: 'absolute', left: 90, right: 90, top: 640 }}>
        <div style={{ fontFamily: TECH, fontSize: 84, color: '#fff', textAlign: 'center', textShadow: '0 0 30px #21f0ff' }}>ЗАГРУЗКА МИРА</div>
        <div style={{ marginTop: 40, height: 46, borderRadius: 23, background: '#0d1430', border: '4px solid #21f0ff', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'repeating-linear-gradient(45deg,#21f0ff 0 22px,#7b5cff 22px 44px)' }} />
        </div>
        <div style={{ marginTop: 16, fontFamily: TECH, fontSize: 56, color: '#ffd23f', textAlign: 'center' }}>{pct}%</div>
        <Panel style={{ marginTop: 50, padding: '28px 34px' }} border="#ffd23f">
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#ffd23f' }}>СОВЕТ</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: '#fff', marginTop: 8, lineHeight: 1.2 }}>Не доверяй людям, которые повторяют одну и ту же фразу.</div>
        </Panel>
      </div>,
    );
  }
  // level badge
  out.push(<Pop key="lvl" f={f} a={W(29) - 2} d={44} style={{ top: 620 }}><div style={{ display: 'inline-block', fontFamily: TECH, fontSize: 130, color: '#ffd23f', ...stroke(14), textShadow: '0 0 50px rgba(255,210,60,0.8)' }}>УРОВЕНЬ 1</div></Pop>);
  // +10 XP, level up
  out.push(<Pop key="xp" f={f} a={sf(H.xp) - 2} d={40} rise={3} style={{ top: 700 }}><div style={{ display: 'inline-block', fontFamily: TECH, fontSize: 120, color: '#7dffb0', ...stroke(14), textShadow: '0 0 40px #21f0ff' }}>+10 ОПЫТА</div></Pop>);
  out.push(<Pop key="lu" f={f} a={sf(H.lvl2) + 14} d={40} style={{ top: 600 }}><div style={{ display: 'inline-block', fontFamily: TECH, fontSize: 92, color: '#ffd23f', ...stroke(12) }}>НОВЫЙ УРОВЕНЬ!</div></Pop>);
  // quests panel
  const q0 = W(102) - 4, q1 = W(113);
  if (f >= q0 && f < q1) {
    const sl = easeOut((f - q0) / 10) * clamp((q1 - f) / 8);
    const breadDone = f >= W(109);
    const boss = f >= W(110) - 2;
    out.push(
      <div key="q" style={{ position: 'absolute', right: 40, top: 520, width: 640, transform: `translateX(${(1 - sl) * 700}px)` }}>
        <Panel style={{ padding: '26px 30px' }} border="#ffd23f">
          <div style={{ fontFamily: TECH, fontSize: 46, color: '#ffd23f' }}>! НОВЫЕ ЗАДАНИЯ</div>
          {[['Купи хлеб', 'награда: 100 монет', breadDone], ['Победи босса', boss ? 'босс: ???' : 'награда: ???', false]].map(([a, b, done], i) => (
            <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 18, opacity: i === 1 && !boss && f < W(110) - 20 ? 0.75 : 1 }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, border: '4px solid #fff', background: done ? '#3cff6e' : 'transparent', color: '#000', fontSize: 38, fontWeight: 900, textAlign: 'center', lineHeight: '40px', fontFamily: FONT }}>{done ? '✓' : ''}</div>
              <div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 42, color: '#fff', textDecoration: done ? 'line-through' : 'none' }}>{a as string}</div>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: '#c9d3ff' }}>{b as string}</div>
              </div>
            </div>
          ))}
        </Panel>
      </div>,
    );
  }
  out.push(<Pop key="coins" f={f} a={sf(H.coins) - 2} d={42} rise={2} style={{ top: 860 }}><div style={{ display: 'inline-flex', alignItems: 'center', gap: 20, fontFamily: TECH, fontSize: 104, color: '#ffd23f', ...stroke(12) }}><Coin s={90} /> +100</div></Pop>);
  // boss bar
  const b0 = W(110) - 3, b1 = shot('gc4_wall').from;
  if (f >= b0 && f < b1) {
    const named = f >= W(116) - 2;
    const sh = f < b0 + 10 ? (hash(f) - 0.5) * 20 : 0;
    out.push(
      <div key="boss" style={{ position: 'absolute', left: 70, right: 70, top: 470, transform: `translateX(${sh}px)` }}>
        <div style={{ fontFamily: TECH, fontSize: 48, color: '#fff', ...stroke(8), textAlign: 'center', textShadow: '0 0 30px #ff2a3a' }}>{named ? 'БОСС: УЧИТЕЛЬ МАТЕМАТИКИ' : 'БОСС: ???'}</div>
        <div style={{ marginTop: 12, height: 40, background: '#2a0008', border: '4px solid #000', borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 30px rgba(255,40,60,0.6)' }}>
          <div style={{ width: `${clamp((f - b0) / 14) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#ff2a3a,#ff7a2a)' }} />
        </div>
      </div>,
    );
  }
  // invisible wall
  out.push(<Pop key="wall" f={f} a={CUE('wall_hit')} d={55} style={{ top: 560 }}><Panel style={{ display: 'inline-block', padding: '24px 40px' }} border="#ff3b3b"><div style={{ fontFamily: TECH, fontSize: 64, color: '#ff4b4b' }}>ГРАНИЦА КАРТЫ</div><div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: '#fff', marginTop: 6 }}>Дальше пути нет</div></Panel></Pop>);
  // under the map
  out.push(<Pop key="oob" f={f} a={W(147)} d={50} style={{ top: 560 }}><Panel style={{ display: 'inline-block', padding: '20px 36px' }} border="#ff3b3b"><div style={{ fontFamily: TECH, fontSize: 50, color: '#ff4b4b' }}>ОШИБКА</div><div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: '#fff' }}>Игрок вне карты</div></Panel></Pop>);
  // save indicator
  const sv = W(153) - 4;
  if (f >= sv && f < sv + 70) {
    const done = f > sv + 34;
    out.push(
      <div key="save" style={{ position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center' }}>
        <Panel style={{ display: 'inline-flex', alignItems: 'center', gap: 22, padding: '20px 34px', transform: `scale(${backOut((f - sv) / 9, 2)})` }} border={done ? '#3cff6e' : '#21f0ff'}>
          <div style={{ width: 64, height: 64, background: '#2d3e8f', borderRadius: 8, border: '4px solid #fff', position: 'relative', transform: done ? 'none' : `rotate(${(f - sv) * 12}deg)` }}><div style={{ position: 'absolute', left: 14, top: 4, width: 30, height: 18, background: '#c9ced6' }} /></div>
          <div style={{ fontFamily: TECH, fontSize: 52, color: done ? '#3cff6e' : '#fff' }}>{done ? 'ИГРА СОХРАНЕНА ✓' : 'СОХРАНЕНИЕ…'}</div>
        </Panel>
      </div>,
    );
  }
  // rewind / load
  for (const n of ['load1', 'load2']) {
    const a = CUE(n);
    if (f >= a && f < a + 30) {
      const l = f - a;
      out.push(
        <AbsoluteFill key={n} style={{ pointerEvents: 'none' }}>
          <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 3px, rgba(0,0,0,0) 3px 7px)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: TECH, fontSize: 92, color: '#fff', ...stroke(10), opacity: l % 8 < 6 ? 1 : 0.4 }}>◀◀ ЗАГРУЗКА</div>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: hash(i * 9 + f) * 1800, height: 18 + hash(i + f * 3) * 40, background: 'rgba(255,255,255,0.18)' }} />)}
        </AbsoluteFill>,
      );
    }
  }
  // achievement
  const ac = W(168) - 2;
  if (f >= ac && f < ac + 80) {
    const sl = easeOut((f - ac) / 10) * clamp((ac + 80 - f) / 10);
    out.push(
      <div key="ach" style={{ position: 'absolute', left: 60, right: 60, top: 470, transform: `translateY(${(1 - sl) * -200}px)`, opacity: sl }}>
        <Panel style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '22px 30px' }} border="#ffd23f">
          <div style={{ width: 96, height: 96, borderRadius: 48, background: 'radial-gradient(circle at 35% 30%, #fff3a0, #f5c542 50%, #b8860b)', border: '4px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TECH, fontSize: 56 }}>★</div>
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: '#ffd23f', letterSpacing: 2 }}>ДОСТИЖЕНИЕ ПОЛУЧЕНО</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#fff' }}>Лучшая жизнь на свете</div>
          </div>
        </Panel>
      </div>,
    );
  }
  // pause menu
  const m = shot('gf1_menu');
  if (f >= m.from && f < m.to) {
    const items = ['ПРОДОЛЖИТЬ', 'НАСТРОЙКИ', 'СОХРАНИТЬ', 'ВЫЙТИ ИЗ ИГРЫ'];
    const sel = f < CUE('menu_move1') ? 0 : f < CUE('menu_move2') ? 1 : f < W(182) - 2 ? 2 : 3;
    const glitch = sel === 3 ? (hash(f) - 0.5) * 14 : 0;
    out.push(
      <div key="menu" style={{ position: 'absolute', left: 120, right: 120, top: 470, transform: `scale(${backOut((f - m.from) / 10, 1.4)})` }}>
        <div style={{ fontFamily: TECH, fontSize: 110, color: '#fff', textAlign: 'center', ...stroke(10) }}>ПАУЗА</div>
        <Panel style={{ marginTop: 30, padding: '24px 26px' }}>
          {items.map((it, i) => (
            <div key={it} style={{ fontFamily: TECH, fontSize: 54, padding: '16px 22px', borderRadius: 16, marginTop: i ? 10 : 0, color: i === 3 ? '#ff4b4b' : '#fff', background: sel === i ? (i === 3 ? 'rgba(255,40,60,0.25)' : 'rgba(33,240,255,0.18)') : 'transparent', border: sel === i ? `4px solid ${i === 3 ? '#ff3b3b' : '#21f0ff'}` : '4px solid transparent', transform: i === 3 ? `translateX(${glitch}px)` : 'none' }}>{sel === i ? '▶ ' : '   '}{it}</div>
          ))}
        </Panel>
      </div>,
    );
  }
  // confirm dialog
  const d0 = W(190) - 3, dEnd = shot('gg1_lab').from;
  if (f >= d0 && f < dEnd) {
    out.push(
      <div key="dlg" style={{ position: 'absolute', left: 80, right: 80, top: 480, transform: `scale(${backOut((f - d0) / 9, 1.8)})` }}>
        <Panel style={{ padding: '40px 40px 36px', textAlign: 'center' }} border="#ff3b3b">
          <div style={{ fontFamily: TECH, fontSize: 76, color: '#fff' }}>ВЫ УВЕРЕНЫ?</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: '#ffb3b3', marginTop: 14, lineHeight: 1.2 }}>Весь прогресс будет потерян</div>
          <div style={{ display: 'flex', gap: 30, justifyContent: 'center', marginTop: 36 }}>
            {['ДА', 'НЕТ'].map((b, i) => <div key={b} style={{ fontFamily: TECH, fontSize: 56, padding: '14px 60px', borderRadius: 18, color: '#fff', background: i === 0 ? '#c0182c' : '#1d2440', border: `4px solid ${i === 0 ? '#ff5a6a' : '#21f0ff'}`, transform: i === 0 ? `scale(${1 + 0.05 * Math.sin(f * 0.3)})` : 'none' }}>{b}</div>)}
          </div>
        </Panel>
      </div>,
    );
  }
  // the button label
  const bt = W(219) + 4, btEnd = shot('outro').from;
  if (f >= bt && f < btEnd) out.push(<div key="btn" style={{ position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', transform: `scale(${backOut((f - bt) / 9, 2)})` }}><div style={{ display: 'inline-block', fontFamily: TECH, fontSize: 70, color: '#fff', background: 'rgba(190,10,30,0.85)', padding: '14px 40px', borderRadius: 20, border: '4px solid #ff6a7a', textShadow: '0 0 20px #ff2a3a' }}>ВЫЙТИ ИЗ ИГРЫ</div></div>);
  // lag spinner on the lag shot
  if (inShot(f, 'gd1_lag')) {
    out.push(<div key="spin" style={{ position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center' }}><div style={{ display: 'inline-block', width: 120, height: 120, borderRadius: 60, border: '14px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', transform: `rotate(${Math.floor(f / 4) * 45}deg)` }} /></div>);
  }
  return <AbsoluteFill style={{ pointerEvents: 'none' }}>{out}</AbsoluteFill>;
};
export { smoother };
