import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { tl, sf } from '../lib/tl';
import { clamp, backOut, easeOut } from '../lib/anim';

// A tactical-shooter style HUD (own design): health, armour, ammo, round timer, 5v5 bar, kill feed, voice chat.
const FONT = 'Montserrat, sans-serif';
const TECH = '"Russo One", Montserrat, sans-serif';
const stroke = (px: number, color = '#000') => ({ WebkitTextStroke: `${px}px ${color}`, paintOrder: 'stroke fill' as const });
const BLUE = '#5eb3ff', ORANGE = '#ff9a3c', RED = '#ff3b3b', YEL = '#ffd23f';
const T = (k: string) => sf(tl.beats[k]);
const OURS = ['Aidos', 'Kazbek', 'TimurBRO', 'Dimon_AWP', 'Erke_47'];
const THEIRS = ['KZ_Tigr', 'ShadowFox', 'Nomad_77', 'SnowLeo', 'Bars_x'];
/** kill feed: [beat, killer, victim, killerIsOurs, headshot] */
const FEED: [string, string, string, boolean, boolean][] = [
  ['td1', 'ShadowFox', 'Erke_47', false, false], ['td2', 'Nomad_77', 'Kazbek', false, true], ['td3', 'SnowLeo', 'TimurBRO', false, false], ['td4', 'Bars_x', 'Dimon_AWP', false, false],
  ['headshot', 'Aidos', 'KZ_Tigr', true, true], ['k1', 'Aidos', 'ShadowFox', true, false], ['k2', 'Aidos', 'Nomad_77', true, true], ['k3', 'Aidos', 'SnowLeo', true, false], ['kill_last', 'Aidos', 'Bars_x', true, true],
];
const deadOurs = (f: number) => ['', 'Erke_47', 'Kazbek', 'TimurBRO', 'Dimon_AWP'].filter((n, i) => i > 0 && f >= T(['', 'td1', 'td2', 'td3', 'td4'][i]));
const deadTheirs = (f: number) => FEED.filter(([b, , , ours]) => ours && f >= T(b)).map(([, , v]) => v);

const Skull: React.FC<{ s?: number }> = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2C7 2 3.5 5.6 3.5 10c0 2.7 1.3 4.6 3 5.8V19h2v2h2v-2h3v2h2v-2h2v-3.2c1.7-1.2 3-3.1 3-5.8C20.5 5.6 17 2 12 2Zm-3.5 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="#fff" /></svg>;
const Gun: React.FC<{ w?: number; col?: string }> = ({ w = 56, col = '#fff' }) => <svg width={w} height={w * 0.4} viewBox="0 0 60 24"><path d="M2 10h30l3-3h10v3h13v4H44l-2 3h-6l-2 6h-6l2-6H2z" fill={col} /><rect x="56" y="10" width="4" height="4" fill="#f97316" /></svg>;
const Cross: React.FC<{ col: string }> = ({ col }) => <svg width="44" height="44" viewBox="0 0 24 24"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" fill={col} /></svg>;
const Shield: React.FC = () => <svg width="40" height="44" viewBox="0 0 24 26"><path d="M12 1 2 5v7c0 6 4.3 11 10 13 5.7-2 10-7 10-13V5z" fill="#9fd8ff" /></svg>;

export const CsHud: React.FC = () => {
  const f = useCurrentFrame();
  const show = f >= T('hud') && f < T('back');
  if (!show) return null;
  const l = f - T('hud');
  const inP = backOut(l / 10, 1.6);
  // values
  let hp = 100, armor = 100;
  if (f >= T('k1') - 10) { hp = 64; armor = 60; }
  if (f >= T('k2') - 6) { hp = 27; armor = 12; }
  if (f >= T('hp1')) { hp = 1; armor = 0; }
  const shotsFired = (f >= T('headshot') ? 1 : 0) + (f >= T('k1') ? 3 : 0) + (f >= T('k2') ? 3 : 0) + (f >= T('k3') ? 4 : 0) + (f >= T('kill_last') ? 2 : 0);
  const hasGun = f >= T('pickup');
  const hasBomb = f >= T('pickup') && f < T('plant1');
  const planted = f >= T('plant1');
  const won = f >= T('win');
  const roundLeft = Math.max(0, 75 - (f - T('hud')) / 30);
  const bombLeft = Math.max(0, 40 - (f - T('plant1')) / 30);
  const dO = deadOurs(f), dT = deadTheirs(f);
  const aliveO = 5 - dO.length, aliveT = 5 - dT.length;
  const low = hp <= 27;
  const hitFlash = [T('k1') - 10, T('k2') - 6, T('hp1')].some((x) => f >= x && f < x + 6);
  // active voice
  const mic = Object.entries(tl.at as Record<string, number>).filter(([id]) => id.startsWith('M')).find(([id, t]) => { const ws = tl.words.filter((w: any) => w.line === id); const e = ws.length ? ws[ws.length - 1].e : t + 1.5; return f >= sf(t) - 2 && f < sf(e) + 8; });
  const micWho = mic ? tl.words.find((w: any) => w.line === mic[0])?.who : null;
  return (
    <AbsoluteFill style={{ transform: `scale(${Math.min(1, inP)})`, transformOrigin: '50% 50%' }}>
      {/* damage / low-hp vignette */}
      {(low || hitFlash) && <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(255,0,0,0) 45%, rgba(255,0,0,${hitFlash ? 0.55 : 0.28 + 0.12 * Math.sin(f * 0.3)}) 100%)` }} />}
      {/* top bar: 5 v 5 + timer */}
      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>{OURS.map((n, i) => <div key={n} style={{ width: 54, height: 54, borderRadius: 8, background: dO.includes(n) ? 'rgba(40,40,48,0.85)' : BLUE, border: '3px solid rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TECH, fontSize: 24, color: '#0b1220' }}>{dO.includes(n) ? <Skull /> : n[0]}</div>)}</div>
        <div style={{ textAlign: 'center', minWidth: 160 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontFamily: TECH, fontSize: 34 }}><span style={{ color: BLUE }}>{won ? 8 : 7}</span><span style={{ color: '#fff' }}>:</span><span style={{ color: ORANGE }}>8</span></div>
          <div style={{ fontFamily: TECH, fontSize: 40, color: planted ? RED : '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '0 14px', ...stroke(2) }}>
            {planted ? (won ? 'ПОБЕДА' : `БОМБА ${Math.ceil(bombLeft)}`) : `${Math.floor(roundLeft / 60)}:${String(Math.floor(roundLeft % 60)).padStart(2, '0')}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>{THEIRS.map((n) => <div key={n} style={{ width: 54, height: 54, borderRadius: 8, background: dT.includes(n) ? 'rgba(40,40,48,0.85)' : ORANGE, border: '3px solid rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TECH, fontSize: 24, color: '#1a0d00' }}>{dT.includes(n) ? <Skull /> : n[0]}</div>)}</div>
      </div>
      {dO.length >= 4 && !won && <div style={{ position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center' }}><span style={{ fontFamily: TECH, fontSize: 40, color: '#fff', background: 'rgba(160,0,0,0.75)', borderRadius: 10, padding: '2px 20px', transform: `scale(${backOut((f - T('td4')) / 8, 2)})`, display: 'inline-block' }}>{aliveO} vs {aliveT}</span></div>}
      {/* kill feed */}
      <div style={{ position: 'absolute', top: 210, right: 30, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        {FEED.filter(([b]) => f >= T(b) && f < T(b) + 150).slice(-5).map(([b, k, v, ours, hs]) => {
          const p = easeOut((f - T(b)) / 6);
          return (
            <div key={b} style={{ transform: `translateX(${(1 - p) * 120}px)`, opacity: clamp((T(b) + 150 - f) / 15), display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderRadius: 8, background: ours ? 'rgba(120,0,0,0.55)' : 'rgba(0,0,0,0.55)', border: ours ? `2px solid ${RED}` : '2px solid transparent' }}>
              <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 26, color: ours ? BLUE : ORANGE }}>{k}</span>
              <Gun w={48} />
              {hs && <span style={{ fontFamily: TECH, fontSize: 18, color: YEL }}>HS</span>}
              <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 26, color: ours ? ORANGE : BLUE }}>{v}</span>
            </div>
          );
        })}
      </div>
      {/* voice chat */}
      {mic && micWho && (
        <div style={{ position: 'absolute', left: 30, top: 300, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px', borderRadius: 12, background: 'rgba(0,0,0,0.6)', border: `2px solid ${BLUE}` }}>
          <svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 15a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1A7 7 0 0 0 19 12z" fill="#7CFC00" /></svg>
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: BLUE }}>{micWho}</span>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 26 }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 5, height: 6 + Math.abs(Math.sin(f * 0.6 + i * 1.3)) * 18, background: '#7CFC00', borderRadius: 2 }} />)}</div>
        </div>
      )}
      {/* center messages */}
      {f >= T('headshot') && f < T('headshot') + 30 && <div style={{ position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', fontFamily: TECH, fontSize: 90, color: YEL, ...stroke(10), transform: `scale(${backOut((f - T('headshot')) / 6, 2.4)})` }}>HEADSHOT!</div>}
      {f >= T('pickup') && f < T('pickup') + 50 && <div style={{ position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 48, color: '#fff', ...stroke(8), opacity: clamp((T('pickup') + 50 - f) / 10) }}>+ АВТОМАТ&nbsp;&nbsp;+ БОМБА</div>}
      {f >= T('plant0') && f < T('plant1') && <ProgressBar label="Установка бомбы…" p={(f - T('plant0')) / (T('plant1') - T('plant0'))} col={YEL} />}
      {f >= T('plant1') && f < T('plant1') + 60 && <div style={{ position: 'absolute', top: 620, left: 0, right: 0, textAlign: 'center', fontFamily: TECH, fontSize: 80, color: RED, ...stroke(9), transform: `scale(${backOut((f - T('plant1')) / 7, 2)})` }}>БОМБА ЗАЛОЖЕНА</div>}
      {f >= T('defuse0') && f < T('kill_last') && <ProgressBar label="Враг разминирует!" p={((f - T('defuse0')) / (sf(10))) } col={BLUE} />}
      {won && <div style={{ position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', transform: `scale(${backOut((f - T('win')) / 8, 1.8)})` }}>
        <div style={{ fontFamily: TECH, fontSize: 110, color: YEL, ...stroke(12), textShadow: '0 0 40px rgba(255,210,63,0.8)' }}>РАУНД ВЫИГРАН</div>
        <div style={{ display: 'inline-block', marginTop: 10, fontFamily: TECH, fontSize: 64, color: '#fff', background: RED, borderRadius: 16, padding: '4px 30px' }}>КЛАТЧ 1 vs 5</div>
      </div>}
      {/* bottom: health / armour / ammo */}
      <div style={{ position: 'absolute', left: 30, bottom: 70, display: 'flex', alignItems: 'center', gap: 22, padding: '12px 22px', borderRadius: 14, background: 'rgba(0,0,0,0.55)' }}>
        <Cross col={low ? RED : '#e5e7eb'} />
        <span style={{ fontFamily: TECH, fontSize: 64, color: low ? RED : '#fff', minWidth: 110, opacity: low && Math.floor(f / 8) % 2 ? 0.55 : 1 }}>{hp}</span>
        <Shield />
        <span style={{ fontFamily: TECH, fontSize: 52, color: '#9fd8ff' }}>{armor}</span>
      </div>
      <div style={{ position: 'absolute', right: 30, bottom: 70, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 22px', borderRadius: 14, background: 'rgba(0,0,0,0.55)' }}>
        {hasBomb && <span style={{ fontSize: 40 }}><svg width="40" height="32" viewBox="0 0 40 32"><rect x="2" y="6" width="36" height="22" rx="4" fill="#8a5a2b" /><rect x="10" y="6" width="5" height="22" fill="#facc15" /><rect x="25" y="6" width="5" height="22" fill="#facc15" /><circle cx="33" cy="10" r="3" fill="#ef4444" /></svg></span>}
        {hasGun ? <><Gun w={80} /><span style={{ fontFamily: TECH, fontSize: 60, color: '#fff' }}>{30 - (shotsFired % 30)}</span><span style={{ fontFamily: TECH, fontSize: 36, color: '#9ca3af' }}>/ 90</span></> : <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: '#9ca3af' }}>нет оружия</span>}
      </div>
    </AbsoluteFill>
  );
};
const ProgressBar: React.FC<{ label: string; p: number; col: string }> = ({ label, p, col }) => (
  <div style={{ position: 'absolute', top: 760, left: 190, right: 190, textAlign: 'center' }}>
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#fff', ...stroke(6) }}>{label}</div>
    <div style={{ marginTop: 10, height: 26, borderRadius: 13, background: 'rgba(0,0,0,0.6)', border: '3px solid #fff', overflow: 'hidden' }}><div style={{ width: `${Math.min(1, p) * 100}%`, height: '100%', background: col }} /></div>
  </div>
);

/** end card: club info */
export const CsEnd: React.FC = () => {
  const f = useCurrentFrame();
  const s = tl.shots.find((x: any) => x.id === 'c_end');
  const back = tl.shots.find((x: any) => x.id === 'c_back');
  const out: React.ReactNode[] = [];
  if (back && f >= back.from + 10 && f < back.to) {
    const l = f - back.from - 10;
    out.push(<div key="prov" style={{ position: 'absolute', left: 60, right: 60, top: 260, textAlign: 'center', transform: `scale(${backOut(l / 10, 1.6)})` }}>
      <div style={{ fontFamily: TECH, fontSize: 64, lineHeight: 1.1, color: '#fff', ...stroke(9), textShadow: '0 0 30px rgba(168,85,247,0.8)' }}>ЛУЧШЕ ЧАС ЭМОЦИЙ В КЛУБЕ,</div>
      <div style={{ fontFamily: TECH, fontSize: 56, lineHeight: 1.1, color: YEL, ...stroke(8), marginTop: 8 }}>ЧЕМ ВЕЧЕР СКУКИ ДОМА</div>
    </div>);
  }
  if (s && f >= s.from) {
    const l = f - s.from;
    out.push(<div key="end" style={{ position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center' }}>
      <div style={{ transform: `scale(${backOut(l / 9, 1.8)})` }}>
        <div style={{ fontFamily: TECH, fontSize: 150, lineHeight: 1, color: '#fff', ...stroke(12), textShadow: '0 0 60px #a855f7' }}>LIBERTY</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#22d3ee', letterSpacing: 10, marginTop: 8 }}>COMPUTER CLUB</div>
      </div>
      <div style={{ marginTop: 36, opacity: easeOut((l - 10) / 10) }}>
        <div style={{ display: 'inline-block', background: 'linear-gradient(160deg, rgba(10,10,22,0.92), rgba(24,10,40,0.92))', border: '4px solid #a855f7', borderRadius: 26, padding: '24px 36px', boxShadow: '0 0 40px rgba(168,85,247,0.6)' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, color: '#fff' }}>пр. Достык, 55 · Алматы</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#fff', marginTop: 10 }}>24/7 · круглосуточно</div>
          <div style={{ fontFamily: TECH, fontSize: 76, color: '#22d3ee', marginTop: 14 }}>+7 747 577 44 55</div>
        </div>
      </div>
      <div style={{ marginTop: 34, opacity: easeOut((l - 30) / 10), fontFamily: TECH, fontSize: 48, color: YEL, ...stroke(7) }}>ПРИХОДИ ЗА ЭМОЦИЯМИ!</div>
    </div>);
  }
  return <AbsoluteFill>{out}</AbsoluteFill>;
};
