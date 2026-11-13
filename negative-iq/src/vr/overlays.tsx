import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { tl } from '../lib/tl';
import { clamp, backOut, easeOut } from '../lib/anim';

const FONT = 'Montserrat, sans-serif';
const TECH = '"Russo One", Montserrat, sans-serif';
const stroke = (px: number, color = '#000') => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const });
const MAG = '#ff2bd6', CY = '#22d3ee', YEL = '#facc15';
const shot = (id: string) => tl.shots.find((s: any) => s.id === id);
const loc = (f: number, id: string) => { const s = shot(id); return s && f >= s.from && f < s.to ? { l: f - s.from, s, beat: (i: number) => (s.beats?.[i] !== undefined ? Math.round(s.beats[i] * 30) - s.from : 1e9) } : null; };
const fade = (l: number, dur: number, n = 6) => clamp((dur - l) / n);
const Frame: React.FC<{ col: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ col, children, style }) => (
  <div style={{ background: 'linear-gradient(160deg, rgba(14,6,30,0.92), rgba(30,8,48,0.92))', border: `4px solid ${col}`, borderRadius: 24, boxShadow: `0 0 40px ${col}88, inset 0 0 30px ${col}33`, ...style }}>{children}</div>
);
/** game title plate in the style of the club's posters */
const Plate: React.FC<{ l: number; dur: number; name: string; tag: string; age: string; col: string; desc?: string }> = ({ l, dur, name, tag, age, col, desc }) => {
  const p = backOut(l / 8, 1.8);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 260, opacity: fade(l, dur, 4), transform: `scale(${p}) rotate(${(1 - p) * -3}deg)`, transformOrigin: '0 0' }}>
      <div style={{ fontFamily: TECH, fontSize: name.length > 12 ? 78 : 96, lineHeight: 1, color: '#fff', ...stroke(10), textShadow: `0 0 34px ${col}`, fontStyle: 'italic' }}>{name}</div>
      <div style={{ display: 'inline-block', marginTop: 12, fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff', border: `3px solid ${col}`, borderRadius: 12, padding: '4px 18px', background: 'rgba(10,4,24,0.75)', letterSpacing: 2 }}>{tag} | {age}</div>
      {desc && <div style={{ marginTop: 14, fontFamily: FONT, fontWeight: 800, fontSize: 36, color: '#e9d5ff', ...stroke(5), maxWidth: 900, opacity: easeOut((l - 8) / 8) }}>{desc}</div>}
    </div>
  );
};
const GAMES: [string, string, string][] = [['КИБЕРБОКС', 'КОМАНДНАЯ', '7+'], ['DANCE BATTLE', 'КОМАНДНАЯ', '7+'], ['ЗОЛОТАЯ ЛИХОРАДКА', 'КОМАНДНАЯ', '7+'], ['БИТВА КРАСОК', 'КОМАНДНАЯ', '7+'],
  ['СПАСИ ПИНГВИНОВ', 'КОМАНДНАЯ', '7+'], ['РЕАКТИВНЫЙ БОКС', 'КОМАНДНАЯ', '7+'], ['ДРЕВОРУБЫ', 'КОМАНДНАЯ', '7+'], ['ДИКИЙ ЗАПАД', 'КОМАНДНАЯ', '7+'], ['ФОТООХОТА', 'КОМАНДНАЯ', '7+'],
  ['ZOMBIES', 'КООПЕРАТИВНАЯ', '10+'], ['TACTICS', 'КООПЕРАТИВНАЯ', '7+'], ['BATTLE', 'КООПЕРАТИВНАЯ', '7+']];
const COLS = [MAG, CY, YEL, '#ec4899', '#38bdf8', '#f97316', '#84cc16', '#f59e0b', '#22c55e', '#4ade80', '#fb923c', '#ef4444'];

export const VrMoments: React.FC = () => {
  const f = useCurrentFrame();
  const out: React.ReactNode[] = [];
  let x;
  if ((x = loc(f, 'v_logo'))) {
    const at = Math.min(x.beat(1), x.s.dur - 40), p = backOut((x.l - at) / 9, 1.8);
    if (x.l >= at) out.push(<div key="addr" style={{ position: 'absolute', left: 0, right: 0, top: 1000, display: 'flex', justifyContent: 'center', transform: `scale(${p})`, opacity: fade(x.l, x.s.dur) }}>
      <Frame col={MAG} style={{ padding: '18px 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 36, color: CY, letterSpacing: 6 }}>VR-АРЕНА</div>
        <div style={{ fontFamily: TECH, fontSize: 64, color: '#fff' }}>ул. Умитбаева, 29</div>
      </Frame>
    </div>);
  }
  if ((x = loc(f, 'v_real'))) out.push(<div key="r" style={{ position: 'absolute', left: 50, top: 260, fontFamily: TECH, fontSize: 52, color: '#fff', background: 'rgba(10,4,24,0.75)', border: `3px solid ${CY}`, borderRadius: 16, padding: '6px 22px', opacity: fade(x.l, x.s.dur) }}>РЕАЛЬНОСТЬ</div>);
  if ((x = loc(f, 'v_virtual'))) out.push(<div key="v" style={{ position: 'absolute', left: 50, top: 260, fontFamily: TECH, fontSize: 52, color: '#111', background: YEL, borderRadius: 16, padding: '6px 22px', transform: `scale(${backOut(x.l / 7, 2)})` }}>ИГРА</div>);
  if ((x = loc(f, 'v_select'))) {
    const L = x.l, off = L * 22;
    out.push(<div key="sel" style={{ position: 'absolute', left: 0, right: 0, top: 260 }}>
      <div style={{ textAlign: 'center', fontFamily: TECH, fontSize: 90, color: '#fff', ...stroke(10), textShadow: `0 0 40px ${MAG}`, transform: `scale(${backOut(L / 8, 1.8)})` }}>ВЫБИРАЙ СВОЙ МИР</div>
      {[0, 1].map((row) => (
        <div key={row} style={{ position: 'relative', height: 300, marginTop: 30, overflow: 'visible' }}>
          {GAMES.slice(row * 6, row * 6 + 6).map(([n, t, a], i) => {
            const xx = (row ? -1 : 1) * (i * 330 - off) + (row ? 900 : 60);
            const col = COLS[row * 6 + i];
            return <div key={n} style={{ position: 'absolute', left: xx, top: 0, width: 300 }}>
              <Frame col={col} style={{ height: 270, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ fontFamily: TECH, fontSize: n.length > 11 ? 30 : 40, color: '#fff', lineHeight: 1.05 }}>{n}</div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 20, color: col, marginTop: 8 }}>{t} · {a}</div>
              </Frame>
            </div>;
          })}
        </div>
      ))}
    </div>);
  }
  const plates: [string, number, string?][] = [['v_cyberbox', 0, 'Бой на крыше небоскрёба под динамичную музыку'], ['v_dance', 1, 'Запомни движения и повтори в такт!'], ['v_gold', 2, 'Собери больше монет и отнеси на базу'],
    ['v_paint', 3], ['v_penguins', 4], ['v_jetbox', 5], ['v_wood', 6], ['v_west', 7], ['v_photo', 8], ['v_zombies', 9, 'Сражайся вместе с друзьями и выживай'], ['v_tactics', 10, '4 режима спецоперации'], ['v_battle', 11, '14 тематических миров']];
  for (const [id, gi, desc] of plates) if ((x = loc(f, id))) { const [n, t, a] = GAMES[gi]; out.push(<Plate key={id} l={x.l} dur={x.s.dur} name={n} tag={t + ' ИГРА'} age={a} col={COLS[gi]} desc={desc} />); }
  if ((x = loc(f, 'v_family'))) { const at = Math.min(x.beat(0), x.s.dur - 30); if (x.l >= at) out.push(<div key="age" style={{ position: 'absolute', left: 0, right: 0, top: 280, textAlign: 'center', transform: `scale(${backOut((x.l - at) / 8, 2)})`, opacity: fade(x.l, x.s.dur) }}><div style={{ display: 'inline-block', fontFamily: TECH, fontSize: 110, color: '#111', background: YEL, borderRadius: 30, padding: '6px 40px' }}>7+</div><div style={{ fontFamily: TECH, fontSize: 64, color: '#fff', ...stroke(9), marginTop: 14 }}>ДЛЯ ВСЕЙ СЕМЬИ</div></div>); }
  if ((x = loc(f, 'v_battle'))) {
    const roles = ['ШТУРМОВИК', 'СНАЙПЕР', 'МЕДИК', 'ПОДДЕРЖКА'];
    out.push(<div key="roles" style={{ position: 'absolute', left: 50, right: 50, top: 560, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {roles.map((r, i) => { const at = Math.min(x!.beat(i + 1), x!.s.dur - 30); const p = x!.l >= at ? backOut((x!.l - at) / 8, 2) : 0; return <div key={r} style={{ transform: `scale(${p})` }}><Frame col={['#f97316', '#3b82f6', '#22c55e', '#eab308'][i]} style={{ padding: '14px 18px', textAlign: 'center' }}><div style={{ fontFamily: TECH, fontSize: 40, color: '#fff' }}>{r}</div></Frame></div>; })}
    </div>);
  }
  if ((x = loc(f, 'v_features'))) {
    const feats = [['ПОЛНОЕ', 'ПОГРУЖЕНИЕ', CY], ['НОВОЕ', 'ОБОРУДОВАНИЕ', MAG], ['ЧИСТАЯ', 'ИГРОВАЯ ЗОНА', '#22c55e'], ['ЭМОЦИИ', 'И АДРЕНАЛИН', YEL]];
    out.push(<div key="feat" style={{ position: 'absolute', left: 50, right: 50, top: 270, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, opacity: fade(x.l, x.s.dur) }}>
      {feats.map(([a, b, col], i) => { const at = i < 3 ? Math.min(x!.beat(i), x!.s.dur - 30) : Math.min(x!.beat(2) + 20, x!.s.dur - 20); const p = x!.l >= at ? backOut((x!.l - at) / 8, 2) : 0; return <div key={a} style={{ transform: `scale(${p})` }}><Frame col={col} style={{ padding: '18px 20px', textAlign: 'center' }}><div style={{ fontFamily: TECH, fontSize: 44, color: '#fff' }}>{a}</div><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: col }}>{b}</div></Frame></div>; })}
    </div>);
  }
  if ((x = loc(f, 'v_friends'))) {
    const chips = ['С ДРУЗЬЯМИ', 'С СЕМЬЁЙ', 'ВСЕЙ КОМАНДОЙ'];
    out.push(<div key="chips" style={{ position: 'absolute', left: 40, right: 40, top: 280, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
      {chips.map((c, i) => { const at = Math.min(x!.beat(i), x!.s.dur - 20); const p = x!.l >= at ? backOut((x!.l - at) / 8, 2) : 0; return <div key={c} style={{ transform: `scale(${p})`, fontFamily: TECH, fontSize: 52, color: '#fff', background: [MAG, CY, '#8b5cf6'][i], borderRadius: 22, padding: '10px 28px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>{c}</div>; })}
    </div>);
  }
  if ((x = loc(f, 'v_final'))) {
    const L = x.l;
    const w = ['ВЫБИРАЙ.', 'ИГРАЙ.', 'ПОБЕЖДАЙ!'];
    out.push(<div key="fin" style={{ position: 'absolute', left: 50, right: 50, top: 300, textAlign: 'center' }}>
      <div style={{ transform: `scale(${backOut(L / 9, 1.8)})` }}>
        <div style={{ fontFamily: TECH, fontSize: 150, lineHeight: 0.95, color: '#fff', ...stroke(12), textShadow: `0 0 50px ${MAG}` }}>GAME</div>
        <div style={{ fontFamily: TECH, fontSize: 130, lineHeight: 1, color: CY, ...stroke(12), textShadow: `0 0 50px ${CY}` }}>VR ZONE</div>
      </div>
      <div style={{ marginTop: 26, transform: `scale(${backOut((L - Math.min(x.beat(1), 200)) / 9, 1.8)})` }}>
        <Frame col={MAG} style={{ padding: '18px 30px', display: 'inline-block' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: CY, letterSpacing: 6 }}>VR-АРЕНА</div>
          <div style={{ fontFamily: TECH, fontSize: 66, color: '#fff' }}>ул. Умитбаева, 29</div>
        </Frame>
      </div>
      <div style={{ marginTop: 34, display: 'flex', justifyContent: 'center', gap: 18 }}>
        {w.map((t, i) => { const at = Math.min(x!.beat(i + 2), 230); const p = L >= at ? backOut((L - at) / 7, 2.2) : 0; return <div key={t} style={{ transform: `scale(${p})`, fontFamily: TECH, fontSize: 54, color: i === 2 ? YEL : '#fff', ...stroke(7), fontStyle: 'italic' }}>{t}</div>; })}
      </div>
      {L >= Math.min(x.beat(4) + 20, 240) && <div style={{ marginTop: 40, transform: `scale(${backOut((L - Math.min(x.beat(4) + 20, 240)) / 8, 2) * (1 + 0.04 * Math.sin(L * 0.3))})` }}>
        <div style={{ display: 'inline-block', background: `linear-gradient(90deg, ${MAG}, ${CY})`, borderRadius: 50, padding: '22px 60px', boxShadow: `0 0 50px ${MAG}` }}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', ...stroke(4) }}>ЗАБРОНИРУЙ ИГРУ</div></div>
      </div>}
    </div>);
  }
  return <AbsoluteFill>{out}</AbsoluteFill>;
};
