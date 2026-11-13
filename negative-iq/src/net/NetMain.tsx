import React from 'react';
import { Movie } from '../Main';
import TL_NET from './timeline.json';
import { NET_SCENES } from './scenesB';
import { NetHud, NetMoments } from './overlays';

export const NET_FRAMES = TL_NET.frames;
export const NetMain: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => (
  <Movie timeline={TL_NET} scenes={NET_SCENES} only={only} q={q} extra={<><NetMoments /><NetHud /></>} />
);
