// node shot.cjs <url> <out.png> <frame> <subframes> [w h]
const { chromium } = require('playwright');
(async () => {
  const [url, out, fr, N, w, h] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await b.newPage({ viewport: { width: +(w || 960), height: +(h || 540) } });
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('BR', m.type(), m.text().slice(0, 300)); });
  p.on('pageerror', (e) => console.log('PAGEERR', e.message.slice(0, 400)));
  await p.goto(url); await p.waitForFunction(() => window.sceneReady, null, { timeout: 120000 });
  const t0 = Date.now();
  const data = await p.evaluate(([f, n]) => { window.vizaviScene.drawFrame(+f, +n); return window.vizaviScene.E.renderer.domElement.toDataURL('image/png'); }, [fr, N]);
  console.log('frame', fr, 'N', N, Date.now() - t0, 'ms');
  require('fs').writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  await b.close();
})();
