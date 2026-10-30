// Renders a trailer page frame by frame with Playwright and encodes it with ffmpeg.
// usage: node lib/render.js <page.html[?query]> stills t1,t2,...     (writes <page dir>/stills/*.jpg)
//        node lib/render.js <page.html[?query]> video out.mp4 audio.wav
// Audio is loudness-normalised to -14 LUFS, the level the short-form platforms play at.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const [pageArg, mode, arg, audio] = process.argv.slice(2);
const [file, query = ''] = pageArg.split('?');
const pagePath = path.resolve(file);
(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('ERR', e.message); process.exit(1); });
  await page.goto(`file://${pagePath}${query ? '?' + query : ''}`);
  await page.evaluate(() => window.ready);
  const shot = t => page.evaluate(t => window.draw(t), t).then(() => page.screenshot({ type: 'jpeg', quality: 94 }));
  if (mode === 'stills') {
    const dir = path.join(path.dirname(pagePath), 'stills'); fs.mkdirSync(dir, { recursive: true });
    const tag = query.replace(/[^a-z0-9]/gi, '');
    for (const t of arg.split(',').map(Number)) fs.writeFileSync(path.join(dir, `${tag}t${t.toFixed(2)}.jpg`), await shot(t));
  } else {
    const fps = 30, n = Math.round(await page.evaluate(() => DURATION) * fps);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-i', audio,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '9M', '-bufsize', '18M', '-pix_fmt', 'yuv420p',
      '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '44100', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < n; i++) { const b = await shot(i / fps); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); const code = await new Promise(r => ff.on('close', r)); if (code) process.exit(code);
  }
  await browser.close();
})();
