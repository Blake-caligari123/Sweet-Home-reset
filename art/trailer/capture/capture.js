// Records real gameplay from the town game, frame by frame, under Playwright's virtual clock, so every frame is
// captured at full 1080×1920 with nothing dropped (the game renders slowly in software here, which doesn't matter).
// A scenario script drives the game through its ?debug hooks and decides what gets recorded and at what speed.
//
// usage: node capture/capture.js <scenario.js> <outDir> [baseUrl]
//   writes <outDir>/frames/00000.jpg … and <outDir>/events.json ({ fps, frames, events: [{ f, name, ... }] })
// The dev server must be running: (cd apps/web && npx vite --port 5199)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FPS = 30;
const [scenarioPath, outDir, baseUrl = 'http://localhost:5199/Sweet-Home-reset/test/?debug'] = process.argv.slice(2);

(async () => {
  const scenario = require(path.resolve(scenarioPath));
  const framesDir = path.join(outDir, 'frames');
  fs.rmSync(framesDir, { recursive: true, force: true }); fs.mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  page.on('pageerror', e => { console.error('page error:', e.message); });
  const cdp = await page.context().newCDPSession(page);
  await page.clock.install({ time: new Date('2026-10-30T09:00:00') });
  await page.goto(baseUrl);

  let frame = 0, speed = 1;
  const events = [];
  const s = {
    page,
    /** Call a ?debug hook: s.T('tapTile', 4, 8). */
    T: (fn, ...args) => page.evaluate(([fn, args]) => window.__town[fn](...args), [fn, args]),
    /** Time passes without recording (setup, or a cut). */
    skip: (seconds) => page.clock.runFor(seconds * 1000),
    /** Game seconds per video second while recording. */
    speed: (x) => { speed = x; },
    frame: () => frame,
    mark: (name, extra = {}) => { events.push({ f: frame, name, speed, ...extra }); },
    /** Record one video frame. */
    async shoot() {
      await page.clock.runFor(1000 / FPS * speed);
      const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 360, height: 640, scale: 3 } });
      fs.writeFileSync(path.join(framesDir, `${String(frame).padStart(5, '0')}.jpg`), Buffer.from(r.data, 'base64'));
      frame += 1;
      if (frame % 60 === 0) console.log(`frame ${frame}`);
    },
    async rec(seconds) { const n = Math.round(seconds * FPS); for (let i = 0; i < n; i++) await s.shoot(); },
    /** Record until Puff has stopped walking and swinging (or a time limit, in video seconds). */
    async recUntilIdle(max = 6) { for (let i = 0; i < max * FPS; i++) { await s.shoot(); if (i > 9 && !(await s.T('busy'))) return; } },
    /** Click a button by its text, letting time run until it shows. */
    async click(text, { record = false } = {}) {
      const btn = page.getByRole('button', { name: text, exact: true }).first();
      for (let i = 0; i < 200 && !(await btn.isVisible().catch(() => false)); i++) record ? await s.shoot() : await s.skip(.05);
      await btn.click(); s.mark('click', { text });
    },
    /** The nearest mess tile to Puff (optionally of some types). */
    async nearestMess(types) {
      const [mess, feet] = await Promise.all([s.T('mess'), s.T('feet')]);
      const list = types ? mess.filter(m => types.includes(m.type)) : mess;
      return list.sort((a, b) => Math.hypot(a.x * 16 - feet.x, a.y * 16 - feet.y) - Math.hypot(b.x * 16 - feet.x, b.y * 16 - feet.y))[0];
    },
    /** Tap a mess tile and record (or skip) until it has gone; a tough one (hp > 1) gets tapped again.
     *  stop() is checked as it goes, for scenes that end mid-clean (Puff dozing off). */
    async clean(m, { record = true, stop } = {}) {
      const gone = async () => !(await s.T('mess')).some(x => x.x === m.x && x.y === m.y);
      for (let hit = 0; hit < 4; hit++) {
        s.mark('tap', { type: m.type });
        await s.T('tapTile', m.x, m.y);
        for (let i = 0; i < 6 * FPS; i++) {
          record ? await s.shoot() : await s.skip(1 / FPS);
          if (i % 3) continue;
          if (stop && await stop()) return false;
          if (await gone()) { s.mark('cleaned', { type: m.type }); return true; }
          if (i > 9 && !(await s.T('busy'))) break;      // the swing landed but the mess needs another hit
        }
      }
      return false;
    },
  };

  try { await scenario(s); } finally {
    fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify({ fps: FPS, frames: frame, events }, null, 1));
    console.log(`done: ${frame} frames, ${events.length} events`);
    await browser.close();
  }
})();
