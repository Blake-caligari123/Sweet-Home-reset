// usage: node render.js stills <variant> t1,t2,...  |  node render.js video <variant> out.mp4 audio.wav
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const [mode, variant, arg, audio] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('ERR', e.message); process.exit(1); });
  await page.goto(`file://${__dirname}/short.html?v=${variant}`);
  await page.evaluate(() => window.ready);
  const shot = t => page.evaluate(t => window.draw(t), t).then(() => page.screenshot({ type: 'jpeg', quality: 94 }));
  if (mode === 'stills') {
    fs.mkdirSync(`${__dirname}/stills`, { recursive: true });
    for (const t of arg.split(',').map(Number)) fs.writeFileSync(`${__dirname}/stills/${variant}_t${t.toFixed(2)}.jpg`, await shot(t));
  } else {
    const fps = 30, n = Math.round(await page.evaluate(() => DURATION) * fps);
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-i', audio,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', arg], { stdio: ['pipe', 'ignore', 'inherit'] });
    for (let i = 0; i < n; i++) { const b = await shot(i / fps); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
