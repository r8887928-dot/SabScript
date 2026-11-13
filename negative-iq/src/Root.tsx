import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { Avatar } from './Avatar';
import { AvatarNiche } from './AvatarNiches';
import { BannerGaming } from './Banner';
import { ChannelAvatar, ChannelWatermark, ChannelBanner } from './Channel';
import { GameMain } from './game/GameMain';
import { LongMain, LONG_FRAMES } from './long/LongMain';
import { NetMain, NET_FRAMES } from './net/NetMain';
import { CoverNet } from './net/Cover';
import { CoverGame, ThumbGame } from './game/Cover';
import TL_GAME from './game/timeline.json';
import { tl, FPS, W, H } from './lib/tl';
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="NegativeIQ" component={Main} durationInFrames={tl.frames} fps={FPS} width={W} height={H} defaultProps={{}} />
    <Composition id="GameWorld" component={GameMain} durationInFrames={TL_GAME.frames} fps={FPS} width={W} height={H} defaultProps={{}} />
    <Composition id="GameWorldLong" component={LongMain} durationInFrames={LONG_FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{}} />
    <Composition id="NoInternet" component={NetMain} durationInFrames={NET_FRAMES} fps={FPS} width={W} height={H} defaultProps={{}} />
    <Composition id="CoverNet" component={CoverNet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{}} />
    <Composition id="CoverGame" component={CoverGame} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{}} />
    <Composition id="ThumbGame" component={ThumbGame} durationInFrames={1} fps={FPS} width={1280} height={720} defaultProps={{}} />
    <Composition id="ThumbGameLong" component={ThumbGame} durationInFrames={1} fps={FPS} width={1280} height={720} defaultProps={{ top: 'ЧТО, ЕСЛИ', big: 'МИР\u00a0— ИГРА?', badge: 'УРОВЕНЬ 1', bigSize: 132 }} />
    <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{ variant: 'city' as const }} />
    <Composition id="AvatarNiche" component={AvatarNiche} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{ niche: 'space' as const }} />
    <Composition id="BannerGaming" component={BannerGaming} durationInFrames={1} fps={FPS} width={2560} height={1440} defaultProps={{ title: '' }} />
    <Composition id="ChannelAvatar" component={ChannelAvatar} durationInFrames={1} fps={FPS} width={800} height={800} defaultProps={{ variant: 'hero' as const }} />
    <Composition id="ChannelAvatarLogo" component={ChannelAvatar} durationInFrames={1} fps={FPS} width={800} height={800} defaultProps={{ variant: 'logo' as const }} />
    <Composition id="ChannelWatermark" component={ChannelWatermark} durationInFrames={1} fps={FPS} width={150} height={150} defaultProps={{}} />
    <Composition id="ChannelBanner" component={ChannelBanner} durationInFrames={1} fps={FPS} width={2560} height={1440} defaultProps={{ guides: false }} />
    <Composition id="ChannelBannerGuides" component={ChannelBanner} durationInFrames={1} fps={FPS} width={2560} height={1440} defaultProps={{ guides: true }} />
  </>
);
