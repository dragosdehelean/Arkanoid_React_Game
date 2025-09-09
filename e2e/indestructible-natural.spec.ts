import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('@natural Naturally clears when only indestructibles remain (no internals mutation)', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('/?e2e=1&engine=1&level=7');
  await page.waitForSelector('body[data-app-ready="1"]');

  // Speed up clearing: disable strong/moving, enable multiball
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Strong Bricks (HP 2-3)').uncheck();
  await page.getByLabel('Moving Bricks').uncheck();
  await page.getByRole('checkbox', { name: 'Multiball' }).check();
  await page.getByRole('button', { name: 'Close' }).click();

  // Start game
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');

  // Snapshot initial counts (read-only)
  const counts = await page.evaluate(() => {
    const eng: any = (window as any).arkEngine;
    const bricks: any[] = eng?.bricks || [];
    const ind = bricks.filter((b: any) => b.kind === 'indestructible').length;
    return { total: bricks.length, ind };
  });
  expect(counts.total).toBeGreaterThan(counts.ind);
  expect(counts.ind).toBeGreaterThan(0);

  // Launch attached ball via synthetic click on canvas event handler
  await page.evaluate(() => {
    const c = document.querySelector('canvas.game-canvas');
    if (c) c.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  // Ensure active moving balls (top up extras with velocity)
  await page.evaluate(() => (window as any).arkEngine?.e2eSpawnExtraBalls(6));
  await page.waitForTimeout(120);

  // Aggressively spawn power-ups to accelerate natural destruction
  // Top-up balls and oscillate paddle for up to 40s to allow clearing
  const deadline = Date.now() + 40_000;
  let cleared = false;
  const box = await canvas.boundingBox();
  const midY = box ? box.y + box.height * 0.85 : 600;
  while (Date.now() < deadline) {
    await page.evaluate(() => {
      const eng: any = (window as any).arkEngine;
      // Instant pickup over paddle
      eng?.e2eSpawnPowerUp('multi');
      eng?.e2eSpawnPowerUp('expand');
      eng?.e2eSpawnExtraBalls(6);
    });
    // Small delay for simulation to progress
    await page.waitForTimeout(100);
    // Oscillate paddle to keep balls in play
    if (box) {
      const t = Date.now() % 800 < 400 ? 0.2 : 0.8;
      await page.mouse.move(box.x + box.width * t, midY);
    }
    // Check for Level Cleared overlay
    if (await page.getByText('Level Cleared!').isVisible().catch(() => false)) {
      cleared = true;
      break;
    }
  }

  expect(cleared).toBeTruthy();
  await page.getByRole('button', { name: 'Next Level' }).click();
  await expect(page.getByText('Level Cleared!')).toHaveCount(0);
});
