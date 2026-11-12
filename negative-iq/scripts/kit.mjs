// Render still images (channel kit, thumbnails) with one bundle:
//   node scripts/kit.mjs out/kit ChannelAvatar ChannelBanner ...
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition, openBrowser } from '@remotion/renderer';
import path from 'path';
const [out = 'out/kit', ...ids] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const chromiumOptions = { gl: 'swangle' };
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browser = await openBrowser('chrome', { browserExecutable, chromiumOptions });
for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable, chromiumOptions });
  await renderStill({ composition, serveUrl, frame: 0, output: `${out}/${id}.png`, puppeteerInstance: browser, browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000,
    onBrowserLog: (l) => { if (l.type === 'error') console.log('BROWSER', l.text.slice(0, 200)); } });
  console.log('done', id);
}
await browser.close({ silent: true });
