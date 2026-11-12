import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { Avatar } from './Avatar';
import { AvatarNiche } from './AvatarNiches';
import { BannerGaming } from './Banner';
import { GameMain } from './game/GameMain';
import { LongMain, LONG_FRAMES } from './long/LongMain';
import { CoverGame, ThumbGame } from './game/Cover';
import TL_GAME from './game/timeline.json';
import { tl, FPS, W, H } from './lib/tl';
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="NegativeIQ" component={Main} durationInFrames={tl.frames} fps={FPS} width={W} height={H} defaultProps={{}} />
    <Composition id="GameWorld" component={GameMain} durationInFrames={TL_GAME.frames} fps={FPS} width={W} height={H} defaultProps={{}} />
    <Composition id="GameWorldLong" component={LongMain} durationInFrames={LONG_FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{}} />
    <Composition id="CoverGame" component={CoverGame} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{}} />
    <Composition id="ThumbGame" component={ThumbGame} durationInFrames={1} fps={FPS} width={1280} height={720} defaultProps={{}} />
    <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{ variant: 'city' as const }} />
    <Composition id="AvatarNiche" component={AvatarNiche} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{ niche: 'space' as const }} />
    <Composition id="BannerGaming" component={BannerGaming} durationInFrames={1} fps={FPS} width={2560} height={1440} defaultProps={{ title: '' }} />
  </>
);
