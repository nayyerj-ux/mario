import { test, expect } from '@playwright/test';

test.describe('قارچ‌خور gameplay', () => {
  test('loads with no console errors, page errors, or unexpected failed requests', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      // Missing voice-line mp3s (only generated at deploy time) are an
      // accepted, silently-handled 404 - filter those out specifically.
      if (/\.mp3(\?|$)/.test(msg.location().url || '')) return;
      consoleErrors.push(msg.text());
    });
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    const failedResponses = [];
    page.on('response', (res) => {
      if (res.status() >= 400) failedResponses.push(`${res.status()} ${res.url()}`);
    });

    await page.goto('/qarchkhor.html');
    await expect(page.locator('#start-screen')).toBeVisible();
    await page.waitForTimeout(300);

    const unexpectedFailures = failedResponses.filter((m) => !/\.mp3(\?|$)/.test(m));
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(unexpectedFailures).toEqual([]);
  });

  test('start screen exposes controls instructions and a start button', async ({ page }) => {
    await page.goto('/qarchkhor.html');
    await expect(page.getByRole('button', { name: 'شروع بازی' })).toBeVisible();
    await expect(page.locator('#start-screen')).toContainText('حرکت');
  });

  test('starting the game shows the HUD and hides the start overlay', async ({ page }) => {
    await page.goto('/qarchkhor.html');
    await page.getByRole('button', { name: 'شروع بازی' }).click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#hud')).toBeVisible();
    await expect(page.locator('#hud-score')).toHaveText('۰');
    await expect(page.locator('#hud-level')).toHaveText('۱');
  });

  test('moving right collects a mushroom and increments the score in Persian numerals', async ({ page }) => {
    await page.goto('/qarchkhor.html');
    await page.getByRole('button', { name: 'شروع بازی' }).click();
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1800);
    await page.keyboard.up('ArrowRight');

    const scoreText = await page.locator('#hud-score').textContent();
    expect(scoreText).not.toBe('۰');
    expect(scoreText).toMatch(/^[۰-۹]+$/); // Persian digits only, never Western
  });

  test('jump input keeps the game running without errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    await page.goto('/qarchkhor.html');
    await page.getByRole('button', { name: 'شروع بازی' }).click();
    await page.waitForTimeout(1100); // clear spawn invincibility flicker
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await expect(page.locator('#hud')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test.describe('on touch devices', () => {
    test.use({ hasTouch: true });

    test('mobile control buttons are shown, keyboard-focusable and operable', async ({ page }) => {
      await page.goto('/qarchkhor.html');
      await page.getByRole('button', { name: 'شروع بازی' }).click();
      const rightBtn = page.locator('#mc-right');
      await expect(page.locator('#mobile-controls')).toHaveClass(/show/);
      await expect(rightBtn).toHaveAttribute('role', 'button');
      await expect(rightBtn).toHaveAttribute('tabindex', '0');
      await rightBtn.focus();
      await expect(rightBtn).toBeFocused();
    });
  });

  test('the accessibility live region is wired for announcements', async ({ page }) => {
    await page.goto('/qarchkhor.html');
    const announcer = page.locator('#sr-announcer');
    await expect(announcer).toHaveAttribute('aria-live', 'polite');
    await expect(announcer).toHaveAttribute('role', 'status');
  });

  test('losing all lives shows the game-over overlay with Persian-numeral announcer text, moves focus to retry', async ({
    page,
  }) => {
    test.setTimeout(30000);
    await page.goto('/qarchkhor.html');
    await page.getByRole('button', { name: 'شروع بازی' }).click();
    // Walk into level 1's first enemy repeatedly until all 3 lives are gone.
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(() => !document.getElementById('gameover-screen').classList.contains('hidden'), {
      timeout: 20000,
    });
    await page.keyboard.up('ArrowRight');

    await expect(page.locator('#gameover-screen')).toBeVisible();
    await expect(page.getByRole('button', { name: 'دوباره تلاش کن' })).toBeFocused();

    const announcerText = await page.locator('#sr-announcer').textContent();
    expect(announcerText).toContain('باختی');
    expect(announcerText).toMatch(/^[^0-9]*$/); // no Western digits anywhere in the announcement

    const scoreText = await page.locator('#go-score').textContent();
    expect(scoreText).toMatch(/^[^0-9]*$/);
  });

  test('a Content-Security-Policy is enforced', async ({ page }) => {
    await page.goto('/qarchkhor.html');
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("default-src 'self'");
  });

  test('canvas has descriptive fallback content for assistive tech', async ({ page }) => {
    await page.goto('/qarchkhor.html');
    // innerText on a canvas element returns '' in Chromium (fallback content
    // isn't rendered visually), so assert on the underlying HTML instead -
    // that's what assistive tech reads from the accessibility tree.
    const html = await page.locator('#gameCanvas').innerHTML();
    expect(html.trim().length).toBeGreaterThan(0);
  });

  test('runs at a healthy frame rate while idle', async ({ page }) => {
    await page.goto('/qarchkhor.html');
    await page.getByRole('button', { name: 'شروع بازی' }).click();
    const fps = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let frames = 0;
          const start = performance.now();
          function count() {
            frames++;
            if (performance.now() - start < 1000) requestAnimationFrame(count);
            else resolve(frames);
          }
          requestAnimationFrame(count);
        }),
    );
    expect(fps).toBeGreaterThan(30);
  });
});
