// Store screenshots (claude/RELEASE-CHECKLIST.md §5): plays the town with ?debug at the two store
// sizes and saves a few warm scenes to art/store/{iphone,android-phone}/ (not ios/ or android/,
// which .gitignore keeps for Capacitor's generated projects).
// Run with the dev server up: NODE_PATH=$(npm root -g) node tools/store-screenshots.cjs
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
const path = require('node:path');

const URL = process.env.URL ?? 'http://localhost:5199/Sweet-Home-reset/test/?debug';
// iPhone 6.9" (1320 × 2868) and an Android phone (1080 × 2400), both at 3× pixels.
const SIZES = process.env.ONLY ? { iphone: { width: 440, height: 956 } } : { iphone: { width: 440, height: 956 }, 'android-phone': { width: 360, height: 800 } };
// Each scene: the day and time, where Puff stands, and whether the place shows every coming-alive stage.
const SCENES = [
  { name: '01-burrow', day: 3, minutes: 9 * 60, area: 'burrow', at: [7, 8] },
  { name: '02-square', day: 6, minutes: 11 * 60, area: 'square', at: [15, 13] },
  { name: '03-garden', day: 18, minutes: 10 * 60, area: 'yard', at: [12, 6] },
  { name: '04-beach', day: 44, minutes: 16 * 60, area: 'beach', at: [6, 7] },
  { name: '05-winter', day: 50, minutes: 18 * 60, area: 'square', at: [15, 13] },
  { name: '06-fair', day: 14, minutes: 10 * 60, area: 'square', at: [15, 12] }
];

(async () => {
  const browser = await chromium.launch();
  for (const [store, viewport] of Object.entries(SIZES)) {
    const dir = path.join(__dirname, '..', 'art', 'store', store);
    mkdirSync(dir, { recursive: true });
    for (const s of SCENES.filter((x) => !process.env.ONLY || x.name === process.env.ONLY)) {
      const page = await (await browser.newContext({ viewport, deviceScaleFactor: 3 })).newPage();
      await page.goto(URL); await page.click('text=Let\'s tidy!'); await page.click('.scene-skip'); await page.waitForSelector('.name-input');
      await page.keyboard.press('Escape'); await page.waitForTimeout(600);
      // The day before, then a night's sleep, so festivals, seasons and arrivals are set up as in play.
      await page.evaluate((day) => { const t = window.__town; t.skipTips(); t.setDay(day - 1); t.sleep(); }, s.day);
      await page.waitForTimeout(2500);
      await page.evaluate((x) => { const t = window.__town; t.setMinutes(x.minutes); t.visit(x.area, x.at[0], x.at[1], true); t.restoreHere(); t.visit(x.area, x.at[0], x.at[1], true); t.showAlive(); t.face('down'); }, s);
      await page.waitForTimeout(1500);
      // Letters, the pet picker and tips wait for an answer; a screenshot shows the town instead.
      for (let pass = 0; pass < 3; pass += 1) {
        for (const sel of ['.dialogue button:has-text("Not today")', '.dialogue button:has-text("Maybe later")', '.dialogue button:has-text("OK")', '.dialogue button:has-text("Later")', '.sheet [data-close]']) {
          const b = page.locator(sel);
          for (let k = 0; k < 6 && await b.count(); k += 1) { await b.first().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(150); }
        }
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(3000); // Puff's speech bubble fades
      await page.screenshot({ path: path.join(dir, `${s.name}.png`) });
      await page.context().close();
    }
    console.log(`${store}: done`);
  }
  await browser.close();
})();
