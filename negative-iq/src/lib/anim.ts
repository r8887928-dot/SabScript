// Small deterministic animation helpers (everything is a pure function of the frame).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = (t: number) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = (t: number) => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
export const easeIn = (t: number) => { t = clamp(t); return t * t * t; };
export const easeInOut = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const backOut = (t: number, s = 1.70158) => { t = clamp(t); const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
export const elastic = (t: number) => { t = clamp(t); if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1; };
/** 0..1 progress between frames a and b, eased */
export const ramp = (f: number, a: number, b: number, ease: (t: number) => number = smoother) => ease((f - a) / Math.max(1e-6, b - a));
/** a pop that overshoots: 0 before a, 1 after a+d */
export const pop = (f: number, a: number, d = 8) => backOut((f - a) / d, 2.2);
/** decaying wobble after an impact at frame a */
export const wobble = (f: number, a: number, freq = 0.9, decay = 0.18) => (f < a ? 0 : Math.sin((f - a) * freq) * Math.exp(-(f - a) * decay));
/** flip-sign impact shake (decays over ~n frames) */
export const kick = (f: number, a: number, n = 7) => (f < a || f > a + n ? 0 : (((f - a) % 2) ? -1 : 1) * (1 - (f - a) / n));
export const v3 = (a: number[], b: number[], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** keyframed vector track: keys [{f, v}], smoother between keys */
export function track(f: number, keys: { f: number; v: number[] }[], ease = smoother): number[] {
  if (f <= keys[0].f) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f <= b.f) { const t = ease((f - a.f) / (b.f - a.f)); return a.v.map((x, j) => lerp(x, b.v[j], t)); }
  }
  return keys[keys.length - 1].v;
}

// seeded random
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; };
}
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const noise1 = (x: number) => { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };

/** camera keys -> {pos, look, fov, roll} */
export function camK(f: number, keys: { f: number; p: number[]; l: number[]; fov?: number; roll?: number }[], ease = smoother) {
  const pos = track(f, keys.map((k) => ({ f: k.f, v: k.p })), ease);
  const look = track(f, keys.map((k) => ({ f: k.f, v: k.l })), ease);
  const fov = track(f, keys.map((k) => ({ f: k.f, v: [k.fov ?? 45] })), ease)[0];
  const roll = track(f, keys.map((k) => ({ f: k.f, v: [k.roll ?? 0] })), ease)[0];
  return { pos, look, fov, roll };
}
