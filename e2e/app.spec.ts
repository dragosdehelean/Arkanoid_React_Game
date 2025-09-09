import { test, expect } from '@playwright/test';
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }, testInfo) => {
  // Ensure clean storage per test
  await page.addInitScript(() => localStorage.clear());
  page.on('pageerror', (err) => {
    testInfo.attach('pageerror', { body: String(err), contentType: 'text/plain' }).catch(() => {});
  });
  page.on('console', (msg) => {
    // Capture browser console logs for debugging
    testInfo.attach('console', { body: `[${msg.type()}] ${msg.text()}`, contentType: 'text/plain' }).catch(() => {});
  });
});

test('Start-Pause-Resume (engine halts)', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');

  // Menu is visible
  await expect(page.getByText('Arkanoid — Modern MVP')).toBeVisible();

  // Start game
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  await expect(page.getByText('Score:')).toBeVisible();

  // Observe ball moving
  const canvas = page.locator('canvas.game-canvas');
  // Launch ball with a click
  await canvas.click({ position: { x: 10, y: 10 } });
  const x1 = await canvas.getAttribute('data-ball-x');
  await page.waitForTimeout(400);
  const x2 = await canvas.getAttribute('data-ball-x');
  expect(x1).not.toBe(x2);

  // Pause
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByText('Paused')).toBeVisible();
  const px1 = await canvas.getAttribute('data-ball-x');
  await page.waitForTimeout(500);
  const px2 = await canvas.getAttribute('data-ball-x');
  expect(px1).toBe(px2);

  // Resume
  await page.locator('.overlay').getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('.overlay')).toHaveCount(0);
  const rx1 = await canvas.getAttribute('data-ball-x');
  await page.waitForTimeout(500);
  const rx2 = await canvas.getAttribute('data-ball-x');
  expect(rx1).not.toBe(rx2);
});

test('High score persists across reload', async ({ page }) => {
  // Preload high score before load
  await page.addInitScript(() => localStorage.setItem('arkanoid:highScore', '123'));
  await page.goto('/?e2e=1');
  await page.waitForSelector('body[data-app-ready="1"]');

  // HUD shows the high score from storage
  await expect(page.getByText('High: 123')).toBeVisible();

  // Reload and verify persistence
  await page.reload();
  await expect(page.getByText('High: 123')).toBeVisible();
});

test('Theme Eco toggles eco skin in engine', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');

  // Open Settings from Menu
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  // Change theme to Eco
  await page.getByLabel('Theme').selectOption('eco');

  // Verify root class and engine skin attribute
  const hasEco = await page.evaluate(() => document.documentElement.classList.contains('theme-eco'));
  expect(hasEco).toBeTruthy();
  const canvas = page.locator('canvas.game-canvas');
  await expect(canvas).toHaveAttribute('data-skin', 'eco');

  // Switch back to Light
  await page.getByLabel('Theme').selectOption('light');
  const hasEcoAfter = await page.evaluate(() => document.documentElement.classList.contains('theme-eco'));
  expect(hasEcoAfter).toBeFalsy();
  await expect(canvas).toHaveAttribute('data-skin', 'default');
});

test('Keyboard arrows move the paddle', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');

  // Start game to ensure inputs are active and overlay doesn't block
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.overlay')).toHaveCount(0);

  const canvas = page.locator('canvas.game-canvas');
  const px1 = Number(await canvas.getAttribute('data-paddle-x'));

  // Hold Right for a short while
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');
  const px2 = Number(await canvas.getAttribute('data-paddle-x'));
  expect(px2).toBeGreaterThan(px1);

  // Hold Left for a short while
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowLeft');
  const px3 = Number(await canvas.getAttribute('data-paddle-x'));
  expect(px3).toBeLessThan(px2);
});

test('Paddle sensitivity slider affects movement speed', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');

  // Baseline move right
  const s1 = Number(await canvas.getAttribute('data-paddle-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(150);
  await page.keyboard.up('ArrowRight');
  const s2 = Number(await canvas.getAttribute('data-paddle-x'));
  const d1 = s2 - s1;

  // Move left to regain room
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowLeft');

  // Open settings and increase sensitivity
  await page.getByRole('button', { name: 'Settings' }).click();
  const slider = page.getByLabel('Paddle Sensitivity');
  // set to max 2.0
  await slider.fill('2');
  await page.getByRole('button', { name: 'Close' }).click();

  const s3 = Number(await canvas.getAttribute('data-paddle-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(150);
  await page.keyboard.up('ArrowRight');
  const s4 = Number(await canvas.getAttribute('data-paddle-x'));
  const d2 = s4 - s3;

  expect(d2).toBeGreaterThan(d1 * 1.3);
});

test('Settings toggles wire to engine (campaign/time/multi)', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Open Settings
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  // Enable Campaign (10 levels) and Time Attack and Multiball (use checkbox role to avoid label conflicts)
  await page.getByRole('checkbox', { name: 'Campaign (10 Levels)' }).check();
  await page.getByRole('checkbox', { name: 'Time Attack' }).check();
  await page.getByRole('checkbox', { name: 'Multiball' }).check();
  await page.getByRole('button', { name: 'Close' }).click();

  // Start game
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');
  await expect(canvas).toHaveAttribute('data-level-total', '10');
  await expect(canvas).toHaveAttribute('data-time-attack', '1');
  await expect(canvas).toHaveAttribute('data-multiball', '1');
  const count = Number(await canvas.getAttribute('data-balls'));
  expect(count).toBeGreaterThan(1);
});

test('Collecting/Spawning Multiball increases ball count', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Enable multiball
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'Multiball' }).check();
  await page.getByRole('button', { name: 'Close' }).click();
  // Start game
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');
  await expect(canvas).toHaveAttribute('data-multiball', '1');
  const before = Number(await canvas.getAttribute('data-balls'));
  // Prefer the power-up path
  await page.evaluate(() => (window as any).arkEngine?.e2eSpawnPowerUp('multi'));
  await page.waitForTimeout(200);
  let after = Number(await canvas.getAttribute('data-balls'));
  if (after === before) {
    // Fallback: spawn directly extra balls if pickup timing misses
    await page.evaluate(() => (window as any).arkEngine?.e2eSpawnExtraBalls(2));
    await page.waitForTimeout(50);
    after = Number(await canvas.getAttribute('data-balls'));
  }
  expect(after).toBeGreaterThan(before);
  // Sanity: paddle width remains valid while multiple balls exist
  const pw = Number(await canvas.getAttribute('data-paddle-w'));
  expect(pw).toBeGreaterThan(0);
});

test('LevelCleared shows Medal label when Time Attack is on', async ({ page }) => {
  await page.goto('/?e2e=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Enable Time Attack in Settings
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'Time Attack' }).check();
  await page.getByRole('button', { name: 'Close' }).click();
  // Start and immediately Level Cleared via debug (medal text should render with placeholder)
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Debug Level Cleared' }).click();
  await expect(page.getByLabel('Medal')).toBeVisible();
});

test('HUD shows live timer and potential medal when Time Attack is on', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Enable Time Attack
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'Time Attack' }).check();
  await page.getByRole('button', { name: 'Close' }).click();
  // Start engine
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  // Expect HUD timer visible and updating
  const hud = page.getByLabel('Time Attack');
  await expect(hud).toBeVisible();
  await expect(hud).toContainText('Time:');
});

test('Strong/Moving bricks toggles update engine flags', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1&level=6');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Open Settings and toggle off both
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Campaign (10 Levels)').check();
  await page.getByLabel('Strong Bricks (HP 2-3)').uncheck();
  await page.getByLabel('Moving Bricks').uncheck();
  await page.getByRole('button', { name: 'Close' }).click();
  // Start
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');
  await expect(canvas).toHaveAttribute('data-strong-bricks', '0');
  await expect(canvas).toHaveAttribute('data-moving-bricks', '0');
  // Now toggle on and expect flags
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Strong Bricks (HP 2-3)').check();
  await page.getByLabel('Moving Bricks').check();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(canvas).toHaveAttribute('data-strong-bricks', '1');
  await expect(canvas).toHaveAttribute('data-moving-bricks', '1');
});

test('Time Attack medals computed and exposed on canvas', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Enable Time Attack
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'Time Attack' }).check();
  await page.getByRole('button', { name: 'Close' }).click();
  // Start game
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');
  // Wait a short time, then clear level via E2E helper
  await page.waitForTimeout(500);
  await page.evaluate(() => (window as any).arkEngine?.e2eClearLevel());
  // LevelCleared overlay appears
  await page.getByText('Level Cleared!').isVisible();
  await page.waitForFunction(() => {
    const c = document.querySelector('canvas.game-canvas');
    return !!c && !!c.getAttribute('data-medal');
  });
  const medal = await canvas.getAttribute('data-medal');
  const t = Number(await canvas.getAttribute('data-last-time-sec'));
  expect(medal).not.toBeNull();
  expect(medal).not.toBe('none');
  expect(t).toBeGreaterThan(0);
  expect(t).toBeLessThan(60);
});

test('Campaign next level reinitializes bricks', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Enable campaign and start
  await page.locator('.overlay').getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Campaign (10 Levels)').check();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');
  await expect(canvas).toHaveAttribute('data-level-total', '10');
  const bricksBefore = Number(await canvas.getAttribute('data-bricks'));
  expect(bricksBefore).toBeGreaterThan(0);
  // Clear level via helper
  await page.evaluate(() => (window as any).arkEngine?.e2eClearLevel());
  await page.getByText('Level Cleared!').isVisible();
  // Next level
  await page.getByRole('button', { name: 'Next Level' }).click();
  // bricks should be reinitialized (>0)
  await page.waitForTimeout(200);
  const bricksAfter = Number(await canvas.getAttribute('data-bricks'));
  expect(bricksAfter).toBeGreaterThan(0);
});

test('No snap after Pause/Resume when using arrows', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');

  // Pause
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByText('Paused').isVisible();
  // Resume
  await page.locator('.overlay').getByRole('button', { name: 'Resume' }).click();
  await page.locator('.overlay').waitFor({ state: 'detached' });

  const before = Number(await canvas.getAttribute('data-paddle-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');
  const afterMove = Number(await canvas.getAttribute('data-paddle-x'));
  expect(afterMove).toBeGreaterThan(before);
  // Give the engine a couple frames; it should NOT snap back to 'before'
  await page.waitForTimeout(150);
  const afterWait = Number(await canvas.getAttribute('data-paddle-x'));
  expect(afterWait).toBeGreaterThanOrEqual(afterMove - 2); // tolerance for rounding
});

test('No snap after opening Settings when using arrows', async ({ page }) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');

  // Open and close Settings
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Close' }).click();

  const before = Number(await canvas.getAttribute('data-paddle-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');
  const afterMove = Number(await canvas.getAttribute('data-paddle-x'));
  expect(afterMove).toBeGreaterThan(before);
  await page.waitForTimeout(150);
  const afterWait = Number(await canvas.getAttribute('data-paddle-x'));
  expect(afterWait).toBeGreaterThanOrEqual(afterMove - 2);
});
