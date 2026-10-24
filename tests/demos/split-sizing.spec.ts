import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import type { Locator } from 'playwright';
import { demoTest } from '../helpers/demo';

const sizes = (root: Locator, axis: 'width' | 'height' = 'width') =>
  root.evaluate(
    (node, dimension) =>
      Array.from(node.querySelectorAll('[data-split-pane]'))
        .filter((pane) => pane.closest('[data-split-layout]') === node)
        .map((pane) => pane.getBoundingClientRect()[dimension]),
    axis,
  );

demoTest('split-sizing', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => {
      localStorage.setItem(`${family}-example-locale`, locale);
    },
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  await page.goto(
    `${base}/${family}/#/examples/split-layout?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
  const select = (en: string, bg: string) =>
    page.getByRole('tab', { name: text(en, bg), exact: true }).click();
  const split = () => page.locator('[data-split-layout]:visible').first();
  await page.getByRole('textbox').first().waitFor();
  await expect.poll(async () => (await sizes(split()))[0]).toBeCloseTo(160, 0);
  const handle = split().getByRole('separator').first();
  await handle.focus();
  await page.keyboard.press('End');
  await expect.poll(async () => (await sizes(split()))[0]).toBeCloseTo(200, 0);
  await page.keyboard.press('Home');
  await expect.poll(async () => (await sizes(split()))[0]).toBeCloseTo(120, 0);
  const box = await handle.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + 20, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => (await sizes(split()))[0]).toBeGreaterThan(150);
  const resized = (await sizes(split()))[0];
  const input = split().getByRole('textbox').first();
  await input.evaluate((node) => {
    node.dataset.preserved = 'yes';
  });
  await input.fill('Runtime draft');
  assert.equal(await input.getAttribute('data-preserved'), 'yes');
  assert.ok(Math.abs((await sizes(split()))[0] - resized) < 1);
  await page.setViewportSize({ width: 900, height: 1000 });
  await expect.poll(async () => (await sizes(split()))[0]).toBeLessThanOrEqual(201);
  assert.ok((await sizes(split()))[0] >= 119);
  assert.equal(await input.inputValue(), 'Runtime draft');

  await select('Nested panes', 'Вложени панели');
  const nested = page.locator('[data-split-layout]:visible').nth(1);
  const innerHandle = nested.getByRole('separator');
  await expect.poll(async () => (await sizes(nested))[0]).toBeGreaterThan(60);
  // Wait for the newly selected panes to stop moving before recording the baseline.
  await innerHandle.click({ trial: true });
  const parentBefore = await sizes(split());
  const innerBefore = (await sizes(nested))[0];
  await innerHandle.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await sizes(nested))[0]).toBeGreaterThan(innerBefore);
  assert.ok(Math.abs((await sizes(split()))[0] - parentBefore[0]) < 1);
  const touchBox = await innerHandle.boundingBox();
  assert.ok(touchBox);
  const x = touchBox.x + touchBox.width / 2;
  const y = touchBox.y + 20;
  const beforeTouch = (await sizes(nested))[0];
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 25, y }],
    });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => (await sizes(nested))[0]).toBeGreaterThan(beforeTouch);
  } finally {
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.detach();
  }
  assert.ok(Math.abs((await sizes(split()))[0] - parentBefore[0]) < 1);

  await select('Vertical content', 'Вертикално съдържание');
  await expect.poll(async () => (await sizes(split(), 'height'))[0]).toBeCloseTo(120, 0);
  const heights = await sizes(split(), 'height');
  assert.ok(heights[1] > 20 && heights[1] < 150);
  const verticalHandle = split().getByRole('separator');
  await verticalHandle.focus();
  await page.keyboard.press('End');
  await expect.poll(async () => (await sizes(split(), 'height'))[0]).toBeCloseTo(160, 0);
  await page.keyboard.press('Home');
  await expect.poll(async () => (await sizes(split(), 'height'))[0]).toBeCloseTo(80, 0);

  await select('Narrow constraints', 'Ограничения при малка ширина');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await sizes(split()))[0]).toBeCloseTo(260, 0);
  assert.ok((await sizes(split())).every((value) => value >= 259 && value <= 321));
  assert.equal(await split().getByRole('textbox').first().inputValue(), 'Runtime draft');
  assert.deepEqual(errors, []);
});
