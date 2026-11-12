// Render all niche avatars with one bundle: node scripts/avatars.mjs out/avatar
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition, openBrowser } from '@remotion/renderer';
import path from 'path';
const out = process.argv[2] || 'out/avatar';
const niches = (process.argv[3] || 'space,money,gaming,horror,facts,ai').split(',');
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const chromiumOptions = { gl: 'swangle' };
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browser = await openBrowser('chrome', { browserExecutable, chromiumOptions });
for (const niche of niches) {
  const inputProps = { niche };
  const composition = await selectComposition({ serveUrl, id: 'AvatarNiche', puppeteerInstance: browser, browserExecutable, chromiumOptions, inputProps });
  await renderStill({ composition, serveUrl, frame: 0, output: `${out}/niche_${niche}.png`, puppeteerInstance: browser, browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 300000,
    onBrowserLog: (l) => { if (l.type === 'error') console.log('BROWSER', l.text.slice(0, 200)); } });
  console.log('done', niche);
}
await browser.close({ silent: true });
