import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { Avatar } from './Avatar';
import { AvatarNiche } from './AvatarNiches';
import { BannerGaming } from './Banner';
import { tl, FPS, W, H } from './lib/tl';
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="NegativeIQ" component={Main} durationInFrames={tl.frames} fps={FPS} width={W} height={H} defaultProps={{}} />
    <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{ variant: 'city' as const }} />
    <Composition id="AvatarNiche" component={AvatarNiche} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{ niche: 'space' as const }} />
    <Composition id="BannerGaming" component={BannerGaming} durationInFrames={1} fps={FPS} width={2560} height={1440} defaultProps={{ title: '' }} />
  </>
);
