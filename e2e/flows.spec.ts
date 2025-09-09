import { test, expect } from '@playwright/test';
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('Score increments via debug and shows on HUD', async ({ page }) => {
  await page.goto('/?e2e=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Start via overlay (user flow), not debug
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.overlay')).toHaveCount(0);
  await page.getByRole('button', { name: 'Debug Add 100 Score' }).click();
  await expect(page.getByText('Score: 100')).toBeVisible();
});

test('Game over flow commits high score and restart resets score', async ({ page }) => {
  await page.goto('/?e2e=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.overlay')).toHaveCount(0);
  await page.getByRole('button', { name: 'Debug Add 100 Score' }).click();
  await page.getByRole('button', { name: 'Debug Add 100 Score' }).click();
  // Lose 3 lives
  await page.getByRole('button', { name: 'Debug Lose Life' }).click();
  await page.getByRole('button', { name: 'Debug Lose Life' }).click();
  await page.getByRole('button', { name: 'Debug Lose Life' }).click();
  await expect(page.getByRole('heading', { name: 'Game Over' })).toBeVisible();
  // Try again should commit high score and reset current score
  await page.getByRole('button', { name: 'Try Again' }).click();
  await expect(page.getByText('High: 200')).toBeVisible();
  await expect(page.getByText('Score: 0')).toBeVisible();
  await expect(page.getByText('Lives: 3')).toBeVisible();
});

test('High score is saved after Game Over', async ({ page }) => {
  await page.goto('/?e2e=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.overlay')).toHaveCount(0);
  // Build a new high score and trigger Game Over
  await page.getByRole('button', { name: 'Debug Add 100 Score' }).click();
  await page.getByRole('button', { name: 'Debug Add 100 Score' }).click();
  await page.getByRole('button', { name: 'Debug Lose Life' }).click();
  await page.getByRole('button', { name: 'Debug Lose Life' }).click();
  await page.getByRole('button', { name: 'Debug Lose Life' }).click();
  await expect(page.getByRole('heading', { name: 'Game Over' })).toBeVisible();
  // Try again commits high score
  await page.getByRole('button', { name: 'Try Again' }).click();
  await expect(page.getByText('High: 200')).toBeVisible();
  // Verify storage write (reload would clear LS via initScript)
  await page.waitForTimeout(100);
  const stored = await page.evaluate(() => localStorage.getItem('arkanoid:highScore'));
  expect(stored).toBe('200');
});

test('Level cleared overlay flow', async ({ page }) => {
  await page.goto('/?e2e=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.overlay')).toHaveCount(0);
  await page.getByRole('button', { name: 'Debug Level Cleared' }).click();
  await expect(page.getByText('Level Cleared!')).toBeVisible();
  await page.getByRole('button', { name: 'Next Level' }).click();
  await expect(page.getByText('Level Cleared!')).toHaveCount(0);
});

test('Toggle mute updates HUD indicator', async ({ page }) => {
  await page.goto('/?e2e=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Start the game to remove the menu overlay
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.overlay')).toHaveCount(0);
  // Button should show current state in label (Mute/Unmute)
  const btn = page.getByRole('button', { name: 'Mute' });
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(page.getByRole('button', { name: 'Unmute' })).toBeVisible();
  await page.getByRole('button', { name: 'Unmute' }).click();
  await expect(page.getByRole('button', { name: 'Mute' })).toBeVisible();
});
