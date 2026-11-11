// Render selected frames as PNG stills with one bundle + one browser.
// usage: node scripts/stills.mjs <frames comma list | shot ids> <outDir> [scale]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition, openBrowser } from '@remotion/renderer';
import fs from 'fs';
import path from 'path';
const tl = JSON.parse(fs.readFileSync('src/timeline.json', 'utf8'));
const arg = process.argv[2];
const out = process.argv[3] || 'out/stills';
const scale = Number(process.argv[4] || 0.5);
let frames = [];
for (const a of (arg === 'all' ? tl.shots.map((s) => 'mid:' + s.id) : arg.split(','))) {
  if (a.startsWith('mid:')) { const s = tl.shots.find((x) => x.id === a.slice(4)); frames.push(s.from + Math.floor(s.dur * 0.6)); continue; }
  if (/^\d+$/.test(a)) frames.push(Number(a));
  else { const s = tl.shots.find((x) => x.id === a); if (s) frames.push(s.from + Math.floor(s.dur * 0.15), s.from + Math.floor(s.dur * 0.6), s.to - 2); }
}
fs.mkdirSync(out, { recursive: true });
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const chromiumOptions = { gl: 'swangle' };
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), webpackOverride: (c) => c });
const browser = await openBrowser('chrome', { browserExecutable, chromiumOptions });
const composition = await selectComposition({ serveUrl, id: 'NegativeIQ', puppeteerInstance: browser, browserExecutable, chromiumOptions });
for (const f of frames) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${out}/f${String(f).padStart(5, '0')}.png`, scale, puppeteerInstance: browser, browserExecutable, chromiumOptions, imageFormat: 'png', timeoutInMilliseconds: 180000, onBrowserLog: (l) => { if (l.text.includes('TIMING') || ((l.type === 'error' || l.type === 'warning') && !l.text.includes('map') && !l.text.includes('fallback'))) console.log('BROWSER', l.type, l.text.slice(0, 300)); } });
  console.log('frame', f, Date.now() - t0, 'ms');
}
await browser.close({ silent: true });
