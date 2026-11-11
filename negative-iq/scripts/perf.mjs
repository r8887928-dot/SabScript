// usage: node scripts/perf.mjs frame1,frame2 '{"res":1}'
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition, openBrowser } from '@remotion/renderer';
import path from 'path';
const frames = process.argv[2].split(',').map(Number);
const q = JSON.parse(process.argv[3] || '{}');
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const chromiumOptions = { gl: 'swangle' };
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browser = await openBrowser('chrome', { browserExecutable, chromiumOptions });
const inputProps = { q: { ...q, debug: true } };
const composition = await selectComposition({ serveUrl, id: 'NegativeIQ', puppeteerInstance: browser, browserExecutable, chromiumOptions, inputProps });
for (const f of frames) {
  await renderStill({ composition, serveUrl, frame: f, output: `/tmp/claude-0/-home-user-SabScript/94b5b0d6-9746-57c7-b201-093383cf88c3/scratchpad/perf.png`, scale: 0.25, puppeteerInstance: browser, browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 300000,
    onBrowserLog: (l) => { if (l.text.includes('PERF') || l.text.includes('SLOWTEX')) console.log('frame', f, l.text); } });
}
await browser.close({ silent: true });
