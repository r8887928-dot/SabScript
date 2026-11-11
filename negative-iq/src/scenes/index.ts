import React from 'react';
import { H1Face, H2Crowd, H3Earth, TitleShot } from './Hook';
import { M1Sunrise, M2Alarm, M3Commute, M4School, M5Cross, T1Freeze, T2Heads, T3Face } from './Morning';
import { A1Pole, A2Absurd, A3Door, A4Glass, A5Shop, A6Reverse, A7Inter, A8CrowdQ } from './Ten';
import { B1Chaos, B2Jam, B3Checkout, B4Class, B5Board, B6Peg } from './Hour';
import { C1Control, C2Blackout, C3Airport, C4Hospital, C5Shutters, C6Sofa } from './Day1';
import { D1Servers, D2Phone, D3Feed, D4Chair, D5Choice } from './Day3';
import { E1Dusk, E2Curb, E3Pillars, F1Overgrown, F2EarthNight, F3Artifact, F4Rope } from './Late';
import { G1Dark, G2Ruins, G3Rewind, G4Earth, Outro } from './Final';
import { I1, I2, I3, I4, I5, I6 } from './Interlude';
export const SCENES: Record<string, React.FC> = {
  h1_face: H1Face, h2_crowd: H2Crowd, h3_earth: H3Earth, title: TitleShot,
  m1_sunrise: M1Sunrise, m2_alarm: M2Alarm, m3_commute: M3Commute, m4_school: M4School, m5_cross: M5Cross,
  t1_freeze: T1Freeze, t2_heads: T2Heads, t3_face: T3Face,
  I1, a1_pole: A1Pole, a2_absurd: A2Absurd, a3_door: A3Door, a4_glass: A4Glass, a5_shop: A5Shop, a6_reverse: A6Reverse, a7_inter: A7Inter, a8_crowdq: A8CrowdQ,
  I2, b1_chaos: B1Chaos, b2_jam: B2Jam, b3_checkout: B3Checkout, b4_class: B4Class, b5_board: B5Board, b6_peg: B6Peg,
  I3, c1_control: C1Control, c2_blackout: C2Blackout, c3_airport: C3Airport, c4_hospital: C4Hospital, c5_shutters: C5Shutters, c6_sofa: C6Sofa,
  I4, d1_servers: D1Servers, d2_phone: D2Phone, d3_feed: D3Feed, d4_chair: D4Chair, d5_choice: D5Choice,
  I5, e1_dusk: E1Dusk, e2_curb: E2Curb, e3_pillars: E3Pillars,
  I6, f1_overgrown: F1Overgrown, f2_earthnight: F2EarthNight, f3_artifact: F3Artifact, f4_rope: F4Rope,
  g1_dark: G1Dark, g2_ruins: G2Ruins, g3_rewind: G3Rewind, g4_earth: G4Earth, outro: Outro,
};
