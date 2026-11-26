// Гонка по паспортным данным. Скорость задана точками (с, км/ч), сглажена, проинтегрирована.
// После финиша (420 м) машина тормозит с замедлением 9 м/с².
const DT = 1 / 240;
function build(points, brakeAt = 430, decel = 9) {
  const vAt = (t) => {
    if (t <= points[0][0]) return 0;
    for (let i = 0; i < points.length - 1; i++) {
      const [t0, v0] = points[i], [t1, v1] = points[i + 1];
      if (t <= t1) { const u = (t - t0) / (t1 - t0); return (v0 + (v1 - v0) * u) / 3.6; }
    }
    return points[points.length - 1][1] / 3.6;
  };
  const N = Math.ceil(40 / DT); const x = new Float64Array(N), v = new Float64Array(N);
  let braking = false;
  for (let i = 1; i < N; i++) {
    const t = i * DT;
    // сглаживание: среднее за 0,3 с
    let s = 0; for (let k = -4; k <= 4; k++) s += vAt(t + k * 0.035); let vv = s / 9;
    if (x[i - 1] > brakeAt) braking = true;
    if (braking) vv = Math.max(0, v[i - 1] - decel * DT);
    v[i] = vv; x[i] = x[i - 1] + (v[i - 1] + v[i]) / 2 * DT;
  }
  const at = (arr, t) => { if (t <= 0) return 0; const f = t / DT, i = Math.floor(f); if (i >= N - 1) return arr[N - 1]; return arr[i] + (arr[i + 1] - arr[i]) * (f - i); };
  const crossing = (d) => { for (let i = 1; i < N; i++) if (x[i] >= d) return (i - 1 + (d - x[i - 1]) / (x[i] - x[i - 1])) * DT; return Infinity; };
  return { x: (t) => at(x, t), v: (t) => at(v, t), a: (t) => (at(v, t + 0.02) - at(v, t - 0.02)) / 0.04, crossing };
}
// Mercedes CLS 63 AMG S (W218): 585 л.с., 800 Н·м, 0–100 3,6 с (паспорт); 0–200 ~12,0 с (оценка); ограничение 250 км/ч
export const AMG = build([[0, 0], [3.6, 100], [12.0, 200], [22, 245], [26, 250], [40, 250]]);
// BMW M5 Competition (F90): 625 л.с., 750 Н·м, 0–100 3,3 с; 0–200 10,8 с (паспорт); 250 км/ч (305 с пакетом M Driver's)
export const BMW = build([[0, 0], [3.3, 100], [10.8, 200], [19, 245], [23, 250], [40, 250]]);
export const FINISH = 400;
