// A year in the browser (VISION §13, Phase 4's 'done when'): sleeps through 57 days with ?debug,
// visiting the main places each morning, and stops at the first page or console error.
// Run with the dev server up: NODE_PATH=$(npm root -g) node tools/year-soak.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const dismiss = async () => { for (const t of ['Not today', 'Maybe later', 'OK', 'Later']) { const l = page.locator('button', { hasText: t }); for (let k = 0; k < 3 && await l.count(); k += 1) await l.first().click({ timeout: 500 }).catch(() => {}); } };
  await page.goto(process.env.URL ?? 'http://localhost:5199/Sweet-Home-reset/test/?debug'); await page.click('text=Let\'s tidy!'); await page.waitForSelector('.name-input');
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  await page.evaluate(() => window.__town.skipTips());
  const tour = ['square', 'lane', 'riverside', 'yard', 'far_bank', 'cave_1', 'beach', 'woodland'];
  const log = [];
  for (let d = 1; d <= 57; d += 1) {
    await page.evaluate(() => window.__town.sleep()); await page.waitForTimeout(500); await dismiss();
    const info = await page.evaluate(() => ({ day: window.__town.debug().day, area: window.__town.debug().area }));
    for (const a of tour) { await page.evaluate((id) => { const t = window.__town; try { t.visit(id, ...({ square: [15, 13], lane: [5, 12], riverside: [14, 2], yard: [12, 6], far_bank: [20, 2], cave_1: [9, 10], beach: [2, 7], woodland: [2, 8] })[id], true); } catch (e) { console.error('visit ' + id + ' ' + e); } }, a); await page.waitForTimeout(60); }
    const n = (await page.evaluate(() => window.__town.neighbours())).length;
    log.push(`${info.day}:${n}`);
    if (errors.length) { console.log('ERR on day', info.day, errors.slice(0, 3)); break; }
  }
  console.log(log.join(' '));
  console.log('final day', await page.evaluate(() => window.__town.debug().day), 'errors', errors.length);
  await b.close();
})();
