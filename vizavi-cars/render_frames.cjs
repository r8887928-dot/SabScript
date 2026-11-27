// node render_frames.cjs <url> <dir> <w> <h> <N> — кадры в JPG на диск, продолжает с места обрыва
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [url, dir, w, h, N] = process.argv.slice(2); fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } }); p.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await p.goto(url); await p.waitForFunction(() => window.sceneReady, null, { timeout: 300000 });
  const frames = await p.evaluate(() => window.vizaviScene.frames); const t0 = Date.now(); let done = 0;
  for (let f = 0; f < frames; f++) {
    const fn = `${dir}/f${String(f).padStart(5, '0')}.jpg`; if (fs.existsSync(fn) && fs.statSync(fn).size > 1000) continue;
    const d = await p.evaluate(([f, n]) => { window.vizaviScene.drawFrame(f, n); return window.vizaviScene.E.renderer.domElement.toDataURL('image/jpeg', 0.92); }, [f, +N]);
    fs.writeFileSync(fn + '.tmp', Buffer.from(d.split(',')[1], 'base64')); fs.renameSync(fn + '.tmp', fn); done++;
    if (f % 150 === 0) console.log(new Date().toISOString().slice(11, 19), dir, 'frame', f, '/', frames, 'avg ms', Math.round((Date.now() - t0) / done));
  }
  console.log('DONE', dir); await b.close();
})();
