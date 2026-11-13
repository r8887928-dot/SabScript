import React from 'react';
import { Movie } from '../Main';
import TL_VR from './tl.json';
import { VR_SCENES } from './scenes';
import { VrMoments } from './overlays';

export const VR_FRAMES = TL_VR.frames;
export const VrMain: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => <Movie timeline={TL_VR} scenes={VR_SCENES} only={only} q={q} extra={<VrMoments />} />;
