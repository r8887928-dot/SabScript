import React from 'react';
import { Movie } from '../Main';
import TL_FULL from './tl_full.json';
import TL_SHORT from './tl_short.json';
import { LIB_SCENES } from './scenes';
import { LibMoments, LibBug } from './overlays';

export const LIB_FULL_FRAMES = TL_FULL.frames;
export const LIB_SHORT_FRAMES = TL_SHORT.frames;
export const LibFull: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => <Movie timeline={TL_FULL} scenes={LIB_SCENES} only={only} q={q} extra={<><LibMoments /><LibBug /></>} />;
export const LibShort: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => <Movie timeline={TL_SHORT} scenes={LIB_SCENES} only={only} q={q} extra={<><LibMoments /><LibBug /></>} />;
