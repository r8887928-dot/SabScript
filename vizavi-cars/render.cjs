// node render.cjs <url> <out.mp4> <w> <h> <N> <audio.wav> — кадры по одному в ffmpeg
const { chromium } = require('playwright'); const { spawn } = require('child_process');
(async () => {
  const [url, out, w, h, N, wav] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } }); p.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await p.goto(url); await p.waitForFunction(() => window.sceneReady, null, { timeout: 300000 });
  const frames = await p.evaluate(() => window.vizaviScene.frames);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    const d = await p.evaluate(([f, n]) => { window.vizaviScene.drawFrame(f, n); return window.vizaviScene.E.renderer.domElement.toDataURL('image/jpeg', 0.92); }, [f, +N]);
    const buf = Buffer.from(d.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(new Date().toISOString().slice(11, 19), out, 'frame', f, '/', frames, 'avg ms', Math.round((Date.now() - t0) / (f + 1)));
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close(); console.log('DONE', out);
})();
