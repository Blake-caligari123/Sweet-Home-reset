import type { Page } from '@playwright/test';

/** The test link's debug hooks (src/town/debug.ts). */
type Town = Record<string, (...a: unknown[]) => unknown>;
declare global { interface Window { __town: Town } }

/** A brand-new game, past the opening, the naming sheet and (optionally) the first-day tips. */
export async function newGame(page: Page, skipTips = true) {
  // Each test has its own fresh browser storage, so this is always a brand-new save.
  await page.goto('?debug');
  await page.click('text=Let\'s tidy!');
  await page.click('.scene-skip');
  await page.waitForSelector('.name-input');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  if (skipTips) await page.evaluate(() => window.__town.skipTips());
}

/** Wait until Puff has finished walking and swinging. */
export async function settle(page: Page) {
  for (let i = 0; i < 60 && await page.evaluate(() => window.__town.busy()); i += 1) await page.waitForTimeout(100);
}

/** Tidy every spot in this place, one after another. */
export async function tidyAll(page: Page, max = 60) {
  for (let n = 0; n < max; n += 1) {
    const left = await page.evaluate(() => window.__town.mess()) as { x: number; y: number }[];
    if (!left.length) return;
    await page.evaluate((p) => { window.__town.setFluff(100); window.__town.tapTile(p.x, p.y); }, left[0]);
    await settle(page);
  }
}
