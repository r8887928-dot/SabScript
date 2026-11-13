import React from 'react';
import { Movie } from '../Main';
import TL_CS from './tl.json';
import { CS_SCENES } from './scenes';
import { CsHud, CsEnd } from './overlays';

export const CS_FRAMES = TL_CS.frames;
export const CsMain: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => <Movie timeline={TL_CS} scenes={CS_SCENES} only={only} q={q} extra={<><CsHud /><CsEnd /></>} />;
