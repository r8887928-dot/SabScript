// Хронометраж, состояние мира и путь камеры. Всё — функции от времени t (секунды, дробные).
import { AMG, BMW, FINISH } from './race.js';

export const FPS = 30, DUR = 180, FRAMES = DUR * FPS;
export const T = {
  hook: 0, asmB: 7, asmA: 24, lights: 41, specs: 52, gate: 100, roll: 104, stage: 118, go: 136,
  slowEnd: 142, finishSlow: 152.48, finale: 160.5, end: 180,
};
export const SCENES = [
  ['Сцена 1: решётка в темноте', 0, 7], ['Сцена 2: сборка BMW', 7, 24], ['Сцена 3: сборка Mercedes', 24, 40],
  ['Сцена 4: свет фар', 40, 52], ['Сцена 5: мощность', 52, 64], ['Сцена 6: разгон 0–100', 64, 76], ['Сцена 7: скорость', 76, 88], ['Сцена 8: масса', 88, 100],
  ['Сцена 9: ворота', 100, 118], ['Сцена 10: старт', 118, 136], ['Сцена 11: рывок', 136, 142], ['Сцена 12: гонка', 142, 152.48],
  ['Сцена 13: финиш', 152.48, 160.5], ['Сцена 14: рассвет', 160.5, 180],
];
export const START_X = 60, LANE = 2.6; // BMW z = -LANE, AMG z = +LANE

// ---- время гонки: замедление на старте и на финише
const WARP = [ // [t, rt, скорость]
  [T.go, 0, 0.12], [T.slowEnd, 0.72, 1.0], [T.finishSlow, 0.72 + (T.finishSlow - T.slowEnd), 0.17], [T.finale, 0.72 + (T.finishSlow - T.slowEnd) + 0.17 * (T.finale - T.finishSlow), 1.0],
];
export function raceTime(t) {
  if (t < WARP[0][0]) return 0;
  let k = WARP[0];
  for (const w of WARP) if (t >= w[0]) k = w;
  return k[1] + (t - k[0]) * k[2];
}
export function timeRate(t) { if (t < T.go) return 1; let k = WARP[0]; for (const w of WARP) if (t >= w[0]) k = w; return k[2]; }

const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * u * (u * (u * 6 - 15) + 10); };
/** положение машины по x и её скорость (м/с) в момент t */
export function carX(kind, t) {
  if (t < T.roll) return { x: 0, v: 0, a: 0 };
  if (t < T.stage) { const u = (t - T.roll) / (T.stage - T.roll); const x = START_X * sm(u); return { x, v: START_X * 30 * u * u * (1 - u) * (1 - u) / (T.stage - T.roll), a: 0 }; }
  const P = kind === 'amg' ? AMG : BMW; const rt = raceTime(t);
  return { x: START_X + P.x(rt), v: P.v(rt), a: P.a(rt), rt };
}
export const finishTimes = { amg: AMG.crossing(FINISH), bmw: BMW.crossing(FINISH) };

// ---- камера: ключи {t, p, l, fov, ap, roll, f:'mid'|'amg'|'bmw' (относительно машины), cut}
const K = [
  // 1. хук: макро решётки BMW (уже собранной — взгляд в будущее), вспышка
  { t: 0, p: [3.15, 0.74, -3.95], l: [2.26, 0.63, -3.26], fov: 22, ap: 0.01, cut: true },
  { t: 3.2, p: [3.35, 0.7, -3.3], l: [2.3, 0.6, -2.95], fov: 24, ap: 0.012 },
  { t: 5.2, p: [6.5, 1.6, -0.4], l: [0, 0.6, -1.0], fov: 30, ap: 0.03 },
  { t: 6.99, p: [8.5, 2.6, 2.5], l: [0, 0.6, 0], fov: 34, ap: 0.03 },
  // 2. сборка BMW
  { t: 7, p: [-7, 5.2, -8.5], l: [0, 0.6, -2.6], fov: 32, ap: 0.05, cut: true },
  { t: 11, p: [-2.5, 1.3, -9], l: [0, 0.7, -2.6], fov: 32, ap: 0.05 },
  { t: 15, p: [3.6, 0.35, -6.2], l: [0, 0.5, -2.6], fov: 28, ap: 0.04 },
  { t: 19, p: [6.2, 2.4, -3.6], l: [0.5, 0.8, -2.6], fov: 30, ap: 0.05 },
  { t: 23.5, p: [2.0, 3.6, 0], l: [0, 0.8, 0.5], fov: 34, ap: 0.05 },
  // 3. сборка Mercedes
  { t: 27, p: [-5.5, 1.0, 7.5], l: [0, 0.6, 2.6], fov: 30, ap: 0.05 },
  { t: 31, p: [-5.2, 2.8, 3.0], l: [-1, 1.0, 2.6], fov: 32, ap: 0.05 },
  { t: 35, p: [3.5, 0.55, 7.8], l: [0.5, 0.6, 2.6], fov: 28, ap: 0.04 },
  { t: 40, p: [9.5, 1.2, 0], l: [0, 0.7, 0], fov: 30, ap: 0.04 },
  // 4. фары, пролёт между машинами
  { t: 43, p: [6.0, 0.95, 0], l: [-10, 0.95, 0], fov: 28, ap: 0.03 },
  { t: 46.5, p: [-3.5, 0.9, 0], l: [-12, 1.2, 0], fov: 28, ap: 0.03 },
  { t: 49.5, p: [-8.5, 2.0, -1.5], l: [0, 0.8, 0], fov: 34, ap: 0.04 },
  // 5–8. замеры
  { t: 54, p: [-6, 2.2, -8], l: [0, 1.0, -2], fov: 32, ap: 0.04 },
  { t: 59, p: [5, 1.5, -8.5], l: [0, 1.2, -2.6], fov: 30, ap: 0.04 },
  { t: 64, p: [9, 2.6, 0], l: [0, 1.4, 0], fov: 32, ap: 0.04 },
  { t: 70, p: [6, 0.8, 7.5], l: [0, 0.8, 2.6], fov: 30, ap: 0.04 },
  { t: 76, p: [-3, 1.2, 8.5], l: [0, 1.0, 2.6], fov: 30, ap: 0.04 },
  { t: 82, p: [-9.5, 2.0, 3], l: [0, 1.0, 0], fov: 32, ap: 0.04 },
  { t: 88, p: [-8, 3.0, -5.5], l: [0, 1.0, -1], fov: 32, ap: 0.04 },
  { t: 94, p: [-2, 5.2, -9.2], l: [0, 0.5, 0], fov: 34, ap: 0.04 },
  { t: 99.9, p: [-11, 2.2, 0], l: [15, 2.0, 0], fov: 34, ap: 0.03 },
  // 9. ворота и выезд
  { t: 104, p: [-4, 1.5, 0.5], l: [15, 1.8, 0], fov: 32, ap: 0.03 },
  { t: 108, p: [-7, 1.3, 0], l: [3, 0.8, 0], fov: 32, ap: 0.03, f: 'mid' },
  { t: 113, p: [10, 3.0, 9], l: [0, 0.7, 0], fov: 32, ap: 0.03, f: 'mid' },
  { t: 117.9, p: [66, 1.0, 7.5], l: [60, 0.6, 0], fov: 30, ap: 0.03 },
  // 10. старт: колёса, огни, длиннофокус
  { t: 118, p: [68.5, 0.38, -6.0], l: [61.5, 0.4, -2.6], fov: 22, ap: 0.03, cut: true },
  { t: 123, p: [64.5, 0.38, 5.6], l: [61.5, 0.45, 2.6], fov: 22, ap: 0.03 },
  { t: 127, p: [110, 1.6, 0.0], l: [60, 0.8, 0], fov: 10, ap: 0.05, cut: true },
  { t: 131.5, p: [96, 1.3, 0.0], l: [60, 0.8, 0], fov: 12, ap: 0.05 },
  { t: 132, p: [72, 7, -16], l: [60, 0.5, 0], fov: 30, ap: 0.04, cut: true },
  { t: 135.99, p: [64, 1.0, -9], l: [60, 0.6, 0], fov: 30, ap: 0.03 },
  // 11. рывок (замедление ×0,12): камера едет вместе с машинами
  { t: 136, p: [1.5, 0.7, -8], l: [1.0, 0.6, 0], fov: 30, ap: 0.03, f: 'mid' },
  { t: 139, p: [-2.0, 0.5, -5.5], l: [1.5, 0.6, -1], fov: 28, ap: 0.03, f: 'mid' },
  { t: 141.99, p: [-6, 1.0, 0], l: [2, 0.7, 0], fov: 30, ap: 0.03, f: 'mid' },
  // 12. гонка: бок, лоб, сверху, сзади
  { t: 142, p: [6, 1.1, 9], l: [0, 0.6, 0], fov: 32, ap: 0.02, f: 'amg', cut: true },
  { t: 144.5, p: [30, 0.7, 0], l: [0, 0.7, 0], fov: 18, ap: 0.03, f: 'amg' },
  { t: 147, p: [-4, 14, -7], l: [4, 0, 0], fov: 34, ap: 0.01, f: 'mid' },
  { t: 152.47, p: [-12, 1.6, 2], l: [6, 0.8, 0], fov: 30, ap: 0.02, f: 'mid' },
  // 13. финиш в замедлении: BMW пересекает линию (≈154,5 с), камера ведёт Mercedes до линии (≈157,2 с)
  { t: 152.48, p: [START_X + FINISH - 2, 0.6, -11], l: [START_X + FINISH - 3, 0.8, 0], fov: 36, ap: 0.03, cut: true },
  { t: 154.5, p: [START_X + FINISH - 0.5, 0.65, -10.8], l: [START_X + FINISH, 0.8, 0], fov: 34, ap: 0.03 },
  { t: 156.5, p: [2.5, 0.8, 10.5], l: [0, 0.7, 0], fov: 32, ap: 0.03, f: 'amg' },
  { t: 160.49, p: [START_X + FINISH + 2, 0.75, 10.5], l: [START_X + FINISH + 3, 0.8, 0], fov: 32, ap: 0.03 },
  // 14. рассвет: кран вверх
  { t: 160.5, p: [START_X + FINISH + 20, 3, -14], l: [START_X + FINISH + 60, 0.8, 0], fov: 34, ap: 0.02, cut: true },
  { t: 168, p: [START_X + FINISH + 40, 18, -32], l: [START_X + FINISH + 120, 0, 0], fov: 38, ap: 0.0 },
  { t: 180, p: [START_X + FINISH + 30, 38, -46], l: [START_X + FINISH + 170, 0, 0], fov: 40, ap: 0.0 },
];
export const CAM_KEYS = K;

const cr = (p0, p1, p2, p3, u) => { const u2 = u * u, u3 = u2 * u; return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3); };
function anchor(key, t) {
  if (!key.f) return [0, 0, 0];
  if (key.f === 'mid') { const a = carX('amg', t).x, b = carX('bmw', t).x; return [(a + b) / 2, 0, 0]; }
  return [carX(key.f, t).x, 0, key.f === 'amg' ? LANE : -LANE];
}
function absKey(key, t) { const o = anchor(key, t); return { p: key.p.map((v, i) => v + o[i]), l: key.l.map((v, i) => v + o[i]), fov: key.fov, ap: key.ap ?? 0.03, roll: key.roll ?? 0 }; }

/** камера в момент t; vertical — вертикальный кадр (шире угол) */
export function camAt(t, vertical = false) {
  let i = 0; while (i < K.length - 1 && K[i + 1].t <= t) i++;
  const k1 = K[i], k2 = K[Math.min(K.length - 1, i + 1)];
  const seg0 = K[i - 1] && !k1.cut ? K[i - 1] : k1;
  const seg3 = K[i + 2] && !K[i + 2].cut ? K[i + 2] : k2;
  const same = k2 === k1 || k2.cut;
  const u = same ? 0 : Math.min(1, Math.max(0, (t - k1.t) / (k2.t - k1.t)));
  const A = absKey(seg0, t), B = absKey(k1, t), C = absKey(same ? k1 : k2, t), D = absKey(same ? k1 : seg3, t);
  const p = [0, 1, 2].map((j) => cr(A.p[j], B.p[j], C.p[j], D.p[j], u));
  const l = [0, 1, 2].map((j) => cr(A.l[j], B.l[j], C.l[j], D.l[j], u));
  let fov = B.fov + (C.fov - B.fov) * sm(u), ap = B.ap + (C.ap - B.ap) * u;
  // дыхание оператора: медленный дрейф, не синус одной частоты
  const n1 = Math.sin(t * 0.71) * 0.6 + Math.sin(t * 1.33 + 1.7) * 0.4, n2 = Math.sin(t * 0.53 + 0.3) * 0.5 + Math.sin(t * 1.07 + 2.1) * 0.5;
  p[0] += n1 * 0.02; p[1] += n2 * 0.015;
  let roll = (B.roll + (C.roll - B.roll) * u) + n1 * 0.25;
  if (vertical) fov = Math.min(75, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * 1.6) * 180 / Math.PI);
  return { pos: p, look: l, fov, aperture: ap, roll, focus: Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]) };
}
export function sceneAt(t) { for (const s of SCENES) if (t >= s[1] && t < s[2]) return s[0]; return SCENES[SCENES.length - 1][0]; }
