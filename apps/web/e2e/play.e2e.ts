import { expect, test } from '@playwright/test';
import { newGame, settle, tidyAll } from './helpers';

test('a new game: the opening, naming, and the first tip with its progress', async ({ page }) => {
  await newGame(page, false);
  await expect(page.locator('.tracker')).toContainText('(1/');
  await page.evaluate(() => window.__town.did({ type: 'stood', ground: 'rug', area: 'burrow' }));
  await expect(page.locator('.tracker')).toContainText('(2/');
  await expect(page.locator('.sparkles')).toContainText('2');
});

test('tidying a place fills the meter to spotless, and the map ticks it off', async ({ page }) => {
  await newGame(page);
  await page.evaluate(() => { window.__town.setDay(3); window.__town.visit('lane', 5, 8, false); });
  await expect(page.locator('.tidy-meter')).toContainText('0%');
  await tidyAll(page);
  await expect(page.locator('.tidy-meter')).toContainText('Spotless');
  await page.click('.map-btn');
  await expect(page.locator('.sheet')).toContainText('places restored');
});

test('the story: Otto asks, the step ticks off, the journal remembers it', async ({ page }) => {
  await newGame(page);
  await page.click('.pause-btn');
  await page.locator('.sheet button', { hasText: 'Feature tour' }).click();
  await page.locator('.sheet .note', { hasText: 'The Keeper\'s Story' }).locator('button').click();
  await page.locator('.sheet button', { hasText: 'Close' }).last().click();
  await expect(page.locator('.tracker')).toContainText('Otto');
  await page.evaluate(() => window.__town.tapNeighbour('otto'));
  await page.locator('button', { hasText: 'got?' }).click();
  await expect(page.locator('.tracker')).toContainText('Catch a fish');
  await page.locator('.dialogue button', { hasText: 'Bye' }).click();
  await page.click('.pause-btn');
  await page.locator('.sheet button', { hasText: 'journal' }).click();
  await expect(page.locator('.sheet')).toContainText('One spot at a time');
});

test('a night\'s sleep: the day moves on and the save keeps it after a reload', async ({ page }) => {
  await newGame(page);
  const day = await page.evaluate(() => (window.__town.debug() as { day: number }).day);
  await page.evaluate(() => window.__town.sleep());
  await page.waitForTimeout(500);
  for (const t of ['Not today', 'Maybe later', 'OK']) { const b = page.locator('.dialogue button', { hasText: t }); if (await b.count()) await b.first().click(); }
  await settle(page);
  expect(await page.evaluate(() => (window.__town.debug() as { day: number }).day)).toBe(day + 1);
  // A saved game goes straight back into town (no title).
  await page.reload();
  await page.waitForSelector('.pause-btn');
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => (window.__town.debug() as { day: number }).day)).toBe(day + 1);
});

test('the bag tidies up, keeping every item', async ({ page }) => {
  await newGame(page);
  await page.evaluate(() => { window.__town.addItem('pebble', 3); window.__town.addItem('apple', 2); window.__town.addItem('pebble', 2); });
  await page.click('.tool.bag');
  await page.locator('.sheet button', { hasText: 'Tidy up' }).click();
  await expect(page.locator('.sheet')).toContainText('All neat and tidy!');
  const bag = await page.evaluate(() => (window.__town.debug() as { bag: { id: string; count: number }[] }).bag);
  expect(bag.find((s) => s.id === 'pebble')?.count).toBe(5);
});
