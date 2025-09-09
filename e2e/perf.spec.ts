import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.clear());
  // Lightweight frame stats collector running from earliest point
  await page.addInitScript(() => {
    (window as any).__frameStats = { count: 0, long: 0, max: 0, samples: [] as number[] };
    let last = performance.now();
    function loop(t: number) {
      const dt = t - last;
      last = t;
      if (Number.isFinite(dt) && dt > 0 && dt < 1000) {
        const s: any = (window as any).__frameStats;
        s.count++;
        s.max = Math.max(s.max, dt);
        if (dt > 50) s.long++;
        s.samples.push(dt);
        if (s.samples.length > 6000) s.samples.shift();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
  page.on('pageerror', (err) => {
    testInfo.attach('pageerror', { body: String(err), contentType: 'text/plain' }).catch(() => {});
  });
  page.on('console', (msg) => {
    testInfo.attach('console', { body: `[${msg.type()}] ${msg.text()}`, contentType: 'text/plain' }).catch(() => {});
  });
});

test('Load metrics within reasonable budgets', async ({ page }, testInfo) => {
  await page.goto('/?e2e=1');
  await page.waitForSelector('body[data-app-ready="1"]');

  const nav = await page.evaluate(() => {
    const e = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!e) return null;
    return {
      type: e.type,
      startTime: e.startTime,
      domContentLoaded: e.domContentLoadedEventEnd - e.startTime,
      load: e.loadEventEnd - e.startTime,
      response: e.responseEnd - e.requestStart,
      ttfb: e.responseStart - e.requestStart,
      transferSize: (e as any).transferSize ?? 0
    };
  });

  testInfo.attach('navigationTiming', { body: JSON.stringify(nav, null, 2), contentType: 'application/json' });

  if (nav) {
    // eslint-disable-next-line no-console
    console.log(`NavSummary: dcl=${Math.round(nav.domContentLoaded)}ms load=${Math.round(nav.load)}ms ttfb=${Math.round(nav.ttfb)}ms`);
  }

  // Very generous local budgets; we will tighten after optimizations
  // These are smoke checks to catch regressions.
  expect(nav).not.toBeNull();
  if (nav) {
    expect(nav.domContentLoaded).toBeLessThan(1500);
    expect(nav.load).toBeLessThan(2500);
    expect(nav.response).toBeLessThan(1000);
  }
});

test('Game loop performance snapshot (5s)', async ({ page, context }, testInfo) => {
  await page.goto('/?e2e=1&engine=1');
  await page.waitForSelector('body[data-app-ready="1"]');
  // Start game and launch ball
  await page.locator('.overlay').getByRole('button', { name: 'Start' }).click();
  const canvas = page.locator('canvas.game-canvas');
  await canvas.click({ position: { x: 10, y: 10 } });

  // Enable CDP performance metrics (Chromium)
  const client = await context.newCDPSession(page);
  await client.send('Performance.enable');

  // Record memory baseline
  const mem0 = await page.evaluate(() => {
    const m: any = (performance as any).memory;
    return m ? m.usedJSHeapSize : 0;
  });

  await page.waitForTimeout(5000);

  // Gather frame stats and memory after 5s
  const stats = await page.evaluate(() => {
    const s: any = (window as any).__frameStats;
    if (!s || !s.samples?.length) return null;
    const avg = s.samples.reduce((a: number, b: number) => a + b, 0) / s.samples.length;
    const p95 = s.samples.slice().sort((a: number, b: number) => a - b)[Math.floor(s.samples.length * 0.95)] ?? s.max;
    return { count: s.count, long: s.long, max: s.max, avg, p95 };
  });

  const perfMetrics = await client.send('Performance.getMetrics');
  const map = Object.fromEntries((perfMetrics.metrics || []).map((m: any) => [m.name, m.value]));

  const mem1 = await page.evaluate(() => {
    const m: any = (performance as any).memory;
    return m ? m.usedJSHeapSize : 0;
  });

  const report = {
    frameStats: stats,
    jsHeapDeltaBytes: mem1 && mem0 ? (mem1 - mem0) : 0,
    cdp: {
      TaskDuration: map['TaskDuration'],
      ScriptDuration: map['ScriptDuration'],
      LayoutDuration: map['LayoutDuration'],
      RecalcStyleDuration: map['RecalcStyleDuration']
    }
  };
  // Log a concise summary to the console for easy comparison across runs
  if (stats) {
    const avgFps = 1000 / stats.avg;
    // eslint-disable-next-line no-console
    console.log(`PerfSummary: avgFps=${avgFps.toFixed(1)} p95=${stats.p95.toFixed(1)} longFrames=${stats.long} heapDeltaMB=${(report.jsHeapDeltaBytes/1048576).toFixed(2)}`);
  } else {
    // eslint-disable-next-line no-console
    console.log('PerfSummary: no-stats');
  }
  testInfo.attach('gameLoopPerf', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });

  // Basic sanity budgets (loose). We’ll aim to improve them.
  expect(stats).not.toBeNull();
  if (stats) {
    const avgFps = 1000 / stats.avg;
    testInfo.attach('avgFps', { body: String(avgFps.toFixed(2)), contentType: 'text/plain' });
    expect(avgFps).toBeGreaterThan(45); // target >= ~45 FPS baseline
    expect(stats.p95).toBeLessThan(40); // 95th percentile frame under 40ms
  }

  // Memory shouldn’t balloon in 5 seconds (allowing some noise)
  expect(report.jsHeapDeltaBytes).toBeLessThan(8 * 1024 * 1024); // < 8MB growth
});
