// usage: node render.mjs stills t1,t2,...  |  node render.mjs video out.mp4 audio.wav
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const dir = __dirname;
(async () => {
const [mode, arg, audio] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => console.log('page:', m.text())); page.on('pageerror', e => console.log('ERR', e.message));
await page.goto('file://' + dir + '/trailer.html');
await page.evaluate(() => window.ready);
const shot = t => page.evaluate(t => window.draw(t), t).then(() => page.screenshot({ type: 'jpeg', quality: 94 }));
if (mode === 'stills') {
  for (const t of arg.split(',').map(Number)) { const b = await shot(t); fs.writeFileSync(`${dir}/stills/t${t.toFixed(2)}.jpg`, b); }
} else {
  const fps = 30, n = Math.round(await page.evaluate(() => DURATION) * fps);
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-i', audio,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '9M', '-bufsize', '18M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) { const b = await shot(i / fps); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 90 === 0) console.log('frame', i); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
})();
