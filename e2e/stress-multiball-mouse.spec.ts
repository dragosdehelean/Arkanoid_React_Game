import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('Mouse controls paddle under 6-ball stress', async ({ page }) => {
  // Load app with engine and wait ready
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');

  // Enable Multiball for consistency with game rules
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'Multiball' }).check();
  await page.getByRole('button', { name: 'Close' }).click();

  // Start game and launch the ball
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');
  await canvas.click({ position: { x: 10, y: 10 } });

  // Force up to 6 total balls (engine max)
  await page.evaluate(() => (window as any).arkEngine?.e2eSpawnExtraBalls(6));
  await page.waitForTimeout(60);
  // Call again to top up in case a ball despawned immediately
  await page.evaluate(() => (window as any).arkEngine?.e2eSpawnExtraBalls(6));

  // Verify we reached at least 6 balls
  await page.waitForFunction(() => {
    const c = document.querySelector('canvas.game-canvas');
    return !!c && Number(c.getAttribute('data-balls')) >= 6;
  });
  const ballsNow = Number(await canvas.getAttribute('data-balls'));
  expect(ballsNow).toBeGreaterThanOrEqual(6);

  // Let the 6-ball scenario run for 3 seconds before testing mouse control
  await page.waitForTimeout(3000);

  // Drive paddle with mouse movements across the canvas
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounding box unavailable');
  const midY = box.y + box.height * 0.85; // near paddle row, but any Y within canvas works

  // Move to middle to ensure focus within canvas
  await page.mouse.move(box.x + box.width * 0.5, midY);

  const px0 = Number(await canvas.getAttribute('data-paddle-x'));

  // Sweep right
  await page.mouse.move(box.x + box.width * 0.85, midY);
  await page.waitForTimeout(120);
  const pxRight = Number(await canvas.getAttribute('data-paddle-x'));
  expect(pxRight).toBeGreaterThan(px0);

  // Sweep left
  await page.mouse.move(box.x + box.width * 0.15, midY);
  await page.waitForTimeout(120);
  const pxLeft = Number(await canvas.getAttribute('data-paddle-x'));
  expect(pxLeft).toBeLessThan(pxRight);

  // Oscillate paddle via mouse for ~3 seconds to stress input path
  const leftX = box.x + box.width * 0.15;
  const rightX = box.x + box.width * 0.85;
  const endAt = Date.now() + 3_000;
  let i = 0;
  let successMoves = 0;
  let lastPx = Number(await canvas.getAttribute('data-paddle-x'));
  let minPx = lastPx;
  let maxPx = lastPx;
  while (Date.now() < endAt) {
    const target = i % 2 === 0 ? rightX : leftX;
    await page.mouse.move(target, midY);
    await page.waitForTimeout(80);
    const curPx = Number(await canvas.getAttribute('data-paddle-x'));
    if ((i % 2 === 0 && curPx > lastPx + 2) || (i % 2 === 1 && curPx < lastPx - 2)) successMoves++;
    lastPx = curPx;
    if (curPx < minPx) minPx = curPx;
    if (curPx > maxPx) maxPx = curPx;
    i++;
  }
  // Ensure we observed a reasonable number of directional movements
  expect(successMoves).toBeGreaterThanOrEqual(6);

  // Final assertion: paddle covered a meaningful horizontal range
  expect(maxPx - minPx).toBeGreaterThanOrEqual(20);
});
