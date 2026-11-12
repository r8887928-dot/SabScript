import React from 'react';
import { Movie } from '../Main';
import TL_GAME from './timeline.json';
import { GAME_SCENES } from './scenes';
import { GameHud, GameMoments } from './overlays';

export const GameMain: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => (
  <Movie timeline={TL_GAME} scenes={GAME_SCENES} only={only} q={q} extra={<><GameMoments /><GameHud /></>} />
);
