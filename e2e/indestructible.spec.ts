import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('Does not clear when only indestructible bricks remain', async ({ page }) => {
  // Choose a level that includes indestructible bricks (code 9 in patterns)
  await page.goto('/?e2e=1&engine=1&level=7');
  await page.waitForSelector('body[data-app-ready="1"]');

  // Start gameplay
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');

  // In E2E, the engine is exposed on window. Remove all destructible bricks, leave only indestructibles.
  const remainingIndestructibles = await page.evaluate(() => {
    const eng: any = (window as any).arkEngine;
    if (!eng) return -1;
    const bricks: any[] = eng['bricks'];
    if (!Array.isArray(bricks)) return -2;
    const onlyInd = bricks.filter((b: any) => b.kind === 'indestructible');
    eng['bricks'] = onlyInd;
    return onlyInd.length;
  });

  expect(remainingIndestructibles).toBeGreaterThan(0);

  // Give the engine a moment to run; it should NOT consider the level cleared
  await page.waitForTimeout(800);

  // Overlay for Level Cleared should not appear
  await expect(page.getByText('Level Cleared!')).toHaveCount(0);

  // Canvas attribute should reflect that bricks still remain (>0)
  const bricksAttr = Number(await canvas.getAttribute('data-bricks'));
  expect(bricksAttr).toBe(remainingIndestructibles);
});
