// Титры: фраза делится на куски по 2–3 слова, время — пропорционально длине слов внутри фразы.
import { KEY } from './narration.js';
export function makeSubs(lines, vertical) {
  const chunks = [];
  for (const L of lines) {
    const words = L.text.split(/\s+/).filter((w) => w && w !== '—');
    const groups = []; let cur = [];
    for (const w of words) { cur.push(w); if (cur.length === 3 || /[.,!?:]$/.test(w) || cur.join(' ').length > 16) { groups.push(cur); cur = []; } }
    if (cur.length) groups.push(cur);
    const total = groups.reduce((s, g) => s + g.join(' ').length + 3, 0); let acc = 0;
    const speak = L.dur * 0.94;
    for (const g of groups) { const len = g.join(' ').length + 3; chunks.push({ a: L.t + 0.05 + speak * acc / total, b: L.t + 0.05 + speak * (acc + len) / total, words: g }); acc += len; }
  }
  for (let i = 0; i < chunks.length; i++) { const n = chunks[i + 1]; chunks[i].b = n && n.a - chunks[i].b < 0.5 ? n.a : chunks[i].b + 0.35; }
  return function draw(g, t, w, h) {
    const c = chunks.find((x) => t >= x.a && t < x.b); if (!c) return;
    const S = Math.min(w, h) / 1080, size = (vertical ? 84 : 70) * S, y = vertical ? h * 0.7 : h * 0.86;
    const k = Math.min(1, (t - c.a) / 0.08), pop = 1 + 0.08 * Math.sin(Math.min(1, (t - c.a) / 0.15) * Math.PI);
    g.save(); g.translate(w / 2, y); g.scale(pop, pop); g.globalAlpha = k;
    g.font = `900 ${size}px Inter, Arial, sans-serif`; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const parts = c.words.map((x) => x.toUpperCase().replace(/[.,!?:]$/, ''));
    const sp = size * 0.28, widths = parts.map((p) => g.measureText(p).width), tot = widths.reduce((s, x) => s + x, 0) + sp * (parts.length - 1);
    let x = -tot / 2;
    parts.forEach((p, i) => {
      const key = KEY.test(c.words[i].replace(/[.,!?:]$/, ''));
      g.lineWidth = size * 0.2; g.strokeStyle = 'rgba(6,8,12,0.92)'; g.strokeText(p, x, 0);
      g.fillStyle = key ? '#ffd23a' : '#ffffff'; g.fillText(p, x, 0); x += widths[i] + sp;
    });
    g.restore();
  };
}
