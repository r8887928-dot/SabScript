import React from 'react';
import { Movie } from '../Main';
import TL_MOL from './tl.json';
import { MOL_SCENES } from './scenes';
import { MolMoments } from './overlays';

export const MOL_FRAMES = TL_MOL.frames;
export const MolMain: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => <Movie timeline={TL_MOL} scenes={MOL_SCENES} only={only} q={q} extra={<MolMoments />} />;
