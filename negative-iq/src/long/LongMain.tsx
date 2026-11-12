import React from 'react';
import { Movie } from '../Main';
import TL_LONG from './timeline.json';
import * as A from './scenesA';
import { SCENES_B } from './scenesB';
import { GameHud } from '../game/overlays';
import { LongMoments } from './overlays';

export const LONG_SCENES: Record<string, React.FC> = {
  L01_wake: A.L01Wake, L02_world: A.L02World, L03_pixel: A.L03Pixel, L04_notdream: A.L04NotDream, L05_gameworld: A.L05GameWorld, L06_teaser: A.L06Teaser, title: A.TitleL,
  L07_sunrise: A.L07Sunrise, L08_eyes: A.L08Eyes, L09_hpbar: A.L09HPBar, L10_level: A.L10Level, L11_tutorial: A.L11Tutorial, L12_inventory: A.L12Inventory,
  L13_fridge: A.L13Fridge, L14_mom: A.L14Mom, L15_npc: A.L15NPC, L16_dad: A.L16Dad, L17_trash: A.L17Trash, L18_choice: A.L18Choice,
  L19_loops: A.L19Loops, L20_dog: A.L20Dog, L21_cars: A.L21Cars, L22_lod: A.L22LOD, L23_lodfact: A.L23LODFact, L24_saving: A.L24Saving, L25_teeth: A.L25Teeth,
  L26_quests: A.L26Quests, L27_bread: A.L27Bread, L28_boss: A.L28Boss, L29_wall: A.L29Wall,
  L30_pay: A.L30Pay, L31_discount: A.L31Discount, L32_garages: A.L32Garages, L33_room: A.L33Room, L34_egg: A.L34Egg, L35_name: A.L35Name,
  ...SCENES_B,
};
export const LONG_FRAMES = TL_LONG.frames;

export const LongMain: React.FC<{ only?: string[]; q?: any }> = ({ only, q }) => (
  <Movie timeline={TL_LONG} scenes={LONG_SCENES} only={only} q={q} extra={<><LongMoments /><GameHud /></>} />
);
