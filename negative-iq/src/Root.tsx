import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { tl, FPS, W, H } from './lib/tl';
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="NegativeIQ" component={Main} durationInFrames={tl.frames} fps={FPS} width={W} height={H} defaultProps={{}} />
  </>
);
