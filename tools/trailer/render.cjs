// node render.cjs <format v|h> <shot> [out.mp4] [--still t1,t2] [--variant X]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const args = process.argv.slice(2);
const fmt = args[0], shot = args[1];
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const out = args[2] && !args[2].startsWith('--') ? args[2] : `out/${fmt}_${shot}.mp4`;
const stills = opt('--still');
const variant = opt('--variant') || '';
const FPS = 60;
const VP = fmt === 'v' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
(async () => {
  fs.mkdirSync('out', { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: VP, deviceScaleFactor: 1 });
  await ctx.addInitScript({ path: 'vclock.js' });
  await ctx.addInitScript(`try{localStorage.clear();indexedDB.deleteDatabase&&0}catch(e){}`);
  await ctx.route(/\/src\/town\/game\.ts/, async (route) => { const r = await route.fetch(); await route.fulfill({ response: r, body: (await r.text()).replace('this.bindInput();', 'this.bindInput(); window.__game = this;') }); });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('[D]')) console.log('page:', m.text()); });
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.goto('http://127.0.0.1:5173/Sweet-Home-reset/test/?debug');
  for (let i = 0; i < 400; i++) { await p.evaluate(() => window.__step(16.667)); if (await p.evaluate(() => !!document.querySelector('button'))) break; await p.waitForTimeout(25); }
  await p.locator('button').first().click();
  for (let i = 0; i < 400; i++) { await p.evaluate(() => window.__step(16.667)); if (await p.evaluate(() => !!(window.__game && window.__game.world.sprites))) break; await p.waitForTimeout(25); }
  // let images (sprites, paintings) settle
  for (let i = 0; i < 30; i++) { await p.evaluate(() => window.__step(16.667)); await p.waitForTimeout(10); }
  await p.addScriptTag({ path: 'director.js' });
  await p.addScriptTag({ path: 'shots.js' });
  await p.addScriptTag({ path: 'shots3.js' });
  await p.addScriptTag({ path: 'shots4.js' });
  await p.addScriptTag({ path: 'shots5.js' });
  await p.addScriptTag({ path: 'shots6.js' });
  await p.addScriptTag({ path: 'shots7.js' });
  const info = await p.evaluate(([shot, variant]) => { const s = window.SHOTS[shot]; D.variant = variant; D.shot = s.f; s.setup?.(D); for (let i = 0; i < (s.pre ?? 30); i++) { D.run(-1); window.__step(16.667); } D.stepMs = 1000 / 60; return { dur: s.dur }; }, [shot, variant]);
  // preload DOM images
  await p.evaluate(() => Promise.all(['puff_idle_down', 'puff_blink_down', 'item_sock', 'item_book', 'item_cup'].map((n) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = `/Sweet-Home-reset/sprites/${n}.png`; }))));
  const cdp = await ctx.newCDPSession(p);
  const shotPng = async () => Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })).data, 'base64');
  if (stills) {
    const ts = stills.split(',').map(Number); let t = 0, f = 0;
    for (const want of ts) {
      while (t < want) { await p.evaluate((t) => { window.__step(D.run(t)); }, t); f++; t = f / FPS; }
      fs.writeFileSync(`out/still_${fmt}_${shot}${variant}_${want}.png`, await shotPng());
    }
  } else {
    const n = Math.round(info.dur * FPS);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = 0; f < n; f++) {
      await p.evaluate((t) => { window.__step(D.run(t)); }, f / FPS);
      const buf = await shotPng();
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 120 === 0) console.log(`${shot}${variant} ${f}/${n} ${((Date.now() - t0) / (f + 1)).toFixed(0)}ms/f`);
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
    const sfx = await p.evaluate(() => D.sfxLog);
    fs.writeFileSync(out.replace(/\.mp4$/, '.sfx.json'), JSON.stringify({ dur: info.dur, sfx }));
    console.log('wrote', out, sfx.length, 'sfx');
  }
  await b.close();
})();
