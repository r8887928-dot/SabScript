import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Sequence, useDelayRender } from 'remotion';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/russo-one/400.css';
import { setTimeline } from './lib/tl';
import TL_IQ from './timeline.json';
import { Subtitles, HookGauge, TitleCard, Interludes, CornerHud, OutroCard, TransitionFx, ShotWrap } from './overlay/Overlays';
import { SCENES } from './scenes';
import { Q } from './three/core';

const Placeholder: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ background: '#223', color: '#fff', fontSize: 80, alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat' }}>{id}</AbsoluteFill>
);

/** generic movie: shots from a timeline, scene components by shot id, shared overlays + extra ones */
export const Movie: React.FC<{ timeline: any; scenes: Record<string, React.FC>; extra?: React.ReactNode; only?: string[]; q?: any }> = ({ timeline, scenes, extra, only, q }) => {
  setTimeline(timeline);
  if (q) Object.assign(Q, q);
  const [ready, setReady] = useState(false);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['600 40px Montserrat', '800 40px Montserrat', '900 40px Montserrat', '400 40px "Russo One"'].map((f) => document.fonts.load(f, 'АБВ abc 123')))
      .then(() => { setReady(true); continueRender(handle); });
  }, []);
  if (!ready) return <AbsoluteFill style={{ background: '#000' }} />;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {timeline.shots.map((s: any, i: number) => {
        if (only && !only.includes(s.id)) return null;
        const C = scenes[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
            <ShotWrap shot={s} next={timeline.shots[i + 1]}>{C ? <C /> : <Placeholder id={s.id} />}</ShotWrap>
          </Sequence>
        );
      })}
      <HookGauge />
      <TitleCard />
      {extra}
      <Interludes />
      <CornerHud />
      <OutroCard />
      <Subtitles />
      <TransitionFx />
    </AbsoluteFill>
  );
};

export const Main: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => <Movie timeline={TL_IQ} scenes={SCENES} only={only} q={q} />;
