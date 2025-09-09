import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function enableTimeAttackAndStart(page: any) {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Enable Time Attack from Settings
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'Time Attack' }).check();
  await page.getByRole('button', { name: 'Close' }).click();
  // Start game
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
}

test('HUD timer updates while playing', async ({ page }) => {
  await enableTimeAttackAndStart(page);
  const canvas = page.locator('canvas.game-canvas');
  const hud = page.getByLabel('Time Attack');

  await expect(hud).toBeVisible();
  await expect(hud).toContainText('Time:');

  // Wait until engine exposes elapsed time > 0
  await page.waitForFunction(() => {
    const c = document.querySelector('canvas.game-canvas');
    const v = c ? parseFloat((c as HTMLElement).getAttribute('data-elapsed') || '0') : 0;
    return v > 0.1;
  });

  const e0 = Number((await canvas.getAttribute('data-elapsed')) || '0');
  await page.waitForTimeout(500);
  const e1 = Number((await canvas.getAttribute('data-elapsed')) || '0');
  expect(e1).toBeGreaterThan(e0);

  // UI text shows seconds with one decimal (avoid exact equality flakiness)
  await expect(hud).toContainText(/Time:\s*\d+\.\ds/);
});

test('HUD timer stops on Pause and resumes after Resume', async ({ page }) => {
  await enableTimeAttackAndStart(page);
  const canvas = page.locator('canvas.game-canvas');

  // Let timer advance a bit
  await page.waitForTimeout(400);
  const beforePause = Number((await canvas.getAttribute('data-elapsed')) || '0');

  // Pause via HUD
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByText('Paused')).toBeVisible();
  // Ensure engine acknowledged pause
  await expect(canvas).toHaveAttribute('data-paused', '1');
  const pausedStart = Number((await canvas.getAttribute('data-elapsed')) || '0');

  // While paused, elapsed time should not advance meaningfully
  await page.waitForTimeout(400);
  const duringPause = Number((await canvas.getAttribute('data-elapsed')) || '0');
  expect(duringPause - pausedStart).toBeLessThan(0.12); // allow minor rounding jitter

  // Resume and expect time to advance again
  await page.locator('.overlay').getByRole('button', { name: 'Resume' }).click();
  await page.locator('.overlay').waitFor({ state: 'detached' });
  const afterResume = Number((await canvas.getAttribute('data-elapsed')) || '0');
  await page.waitForTimeout(400);
  const afterResumeLater = Number((await canvas.getAttribute('data-elapsed')) || '0');
  expect(afterResumeLater).toBeGreaterThan(afterResume);
});

test('HUD timer updates in non-e2e mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Ensure Time Attack is enabled (default true). Start the game.
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');
  const hud = page.getByLabel('Time Attack');
  await expect(hud).toBeVisible();
  await expect(hud).toContainText('Time:');

  // Wait enough so throttled attribute sync kicks in
  await page.waitForFunction(() => {
    const c = document.querySelector('canvas.game-canvas');
    const v = c ? parseFloat((c as HTMLElement).getAttribute('data-elapsed') || '0') : 0;
    return v > 0.1;
  });
  const start = Number((await canvas.getAttribute('data-elapsed')) || '0');
  await page.waitForTimeout(500);
  const later = Number((await canvas.getAttribute('data-elapsed')) || '0');
  expect(later).toBeGreaterThan(start);
});

test('Pause stops timer in non-e2e mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('body[data-app-ready="1"]');
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');

  await page.waitForTimeout(300);
  const before = Number((await canvas.getAttribute('data-elapsed')) || '0');
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByText('Paused')).toBeVisible();
  await page.waitForTimeout(400);
  const during = Number((await canvas.getAttribute('data-elapsed')) || '0');
  expect(during - before).toBeLessThan(0.11);
});
