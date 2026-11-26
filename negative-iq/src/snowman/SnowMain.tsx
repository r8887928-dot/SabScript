import React from 'react';
import { Movie } from '../Main';
import TL_SNOW from './tl.json';
import { SNOW_SCENES } from './scenes';
import { SnowCaps } from './overlays';

export const SNOW_FRAMES = TL_SNOW.frames;
export const SnowMain: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => <Movie timeline={TL_SNOW} scenes={SNOW_SCENES} only={only} q={q} extra={<SnowCaps />} />;
