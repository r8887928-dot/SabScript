// node frames.cjs <url> <outdir> <N> <w> <h> <f1,f2,...>
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [url, out, N, w, h, list] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', (e) => console.log('PAGEERR', e.message.slice(0, 400)));
  p.on('console', (m) => { if (m.type() === 'error') console.log('ERR', m.text().slice(0, 300)); });
  await p.goto(url); await p.waitForFunction(() => window.sceneReady, null, { timeout: 120000 });
  const t0 = Date.now();
  for (const f of list.split(',').map(Number)) {
    const d = await p.evaluate(([f, n]) => { window.vizaviScene.drawFrame(f, n); return window.vizaviScene.E.renderer.domElement.toDataURL('image/jpeg', 0.9); }, [f, +N]);
    fs.writeFileSync(`${out}/f${String(f).padStart(5, '0')}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
  }
  console.log('frames', list.split(',').length, 'ms/frame', Math.round((Date.now() - t0) / list.split(',').length));
  await b.close();
})();
