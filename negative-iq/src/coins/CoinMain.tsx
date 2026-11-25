import React from 'react';
import { Movie } from '../Main';
import TL_COIN from './tl.json';
import { COIN_SCENES } from './scenes';

export const COIN_FRAMES = TL_COIN.frames;
export const CoinMain: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => <Movie timeline={TL_COIN} scenes={COIN_SCENES} only={only} q={q} />;
