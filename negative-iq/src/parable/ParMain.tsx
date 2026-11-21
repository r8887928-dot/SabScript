import React from 'react';
import { Movie } from '../Main';
import TL_PAR from './tl.json';
import { PAR_SCENES } from './scenes';
import { ParMoments } from './overlays';

export const PAR_FRAMES = TL_PAR.frames;
export const ParMain: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => <Movie timeline={TL_PAR} scenes={PAR_SCENES} only={only} q={q} extra={<ParMoments />} />;
