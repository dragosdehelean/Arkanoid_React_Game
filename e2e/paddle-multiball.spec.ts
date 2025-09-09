import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function startWithMultiball(page: any) {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Enable multiball
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'Multiball' }).check();
  await page.getByRole('button', { name: 'Close' }).click();
  // Start
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  // Ensure at least 3 balls
  await page.evaluate(() => (window as any).arkEngine?.e2eSpawnExtraBalls(3));
  await page.waitForTimeout(100);
}

test('Paddle stays responsive with 3+ balls over time', async ({ page }) => {
  await startWithMultiball(page);
  const canvas = page.locator('canvas.game-canvas');
  let balls = Number(await canvas.getAttribute('data-balls'));
  if (balls < 3) {
    await page.evaluate(() => (window as any).arkEngine?.e2eSpawnExtraBalls(3));
    await page.waitForTimeout(50);
    balls = Number(await canvas.getAttribute('data-balls'));
  }
  expect(balls).toBeGreaterThanOrEqual(3);

  // Let gameplay run for a bit to simulate the issue window
  await page.waitForTimeout(2000);

  const before = Number(await canvas.getAttribute('data-paddle-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowRight');
  const afterRight = Number(await canvas.getAttribute('data-paddle-x'));
  expect(afterRight).toBeGreaterThan(before);

  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowLeft');
  const afterLeft = Number(await canvas.getAttribute('data-paddle-x'));
  expect(afterLeft).toBeLessThan(afterRight);
});

test('Paddle responsive even with Expand effect and 3+ balls', async ({ page }) => {
  await startWithMultiball(page);
  const canvas = page.locator('canvas.game-canvas');
  // Force pick-up of expand power-up
  await page.evaluate(() => (window as any).arkEngine?.e2eSpawnPowerUp('expand'));
  await page.waitForTimeout(50);

  // Ensure at least 3 balls
  let balls = Number(await canvas.getAttribute('data-balls'));
  if (balls < 3) {
    await page.evaluate(() => (window as any).arkEngine?.e2eSpawnExtraBalls(3));
    await page.waitForTimeout(50);
  }
  balls = Number(await canvas.getAttribute('data-balls'));
  expect(balls).toBeGreaterThanOrEqual(3);

  await page.waitForTimeout(1500);
  const x1 = Number(await canvas.getAttribute('data-paddle-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowRight');
  const x2 = Number(await canvas.getAttribute('data-paddle-x'));
  expect(x2).toBeGreaterThan(x1);
});

