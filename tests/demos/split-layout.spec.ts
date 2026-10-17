import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { demoTest } from '../helpers/demo';

demoTest('split-layout', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => {
      localStorage.setItem(`${family}-example-locale`, locale);
    },
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-split-layout?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const bg = locale === 'bg';
  const text = (en: string, translated: string) => (bg ? translated : en);
  const select = async (name: string) => page.getByRole('tab', { name, exact: true }).click();
  const split = () => page.locator('[data-split-layout]:visible').first();
  const panes = () => split().locator('[data-split-pane]');
  const sizes = async () =>
    panes().evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  await page.getByRole('textbox', { name: text('Queue', 'Опашка'), exact: true }).waitFor();
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  const weighted = await sizes();
  assert.ok(Math.abs(weighted[0] / weighted[1] - 2) < 0.15, `${family}: initial 2:1 sizes`);
  const handle = split().getByRole('separator');
  assert.equal(
    await handle.getAttribute('aria-label'),
    text('Resize panes', 'Промяна на размера на панелите'),
  );
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);
  assert.ok((await sizes())[0] < weighted[0], `${family}: keyboard resizing`);
  await split().evaluate((node) => {
    node.setAttribute('dir', 'rtl');
  });
  const beforeRtl = (await sizes())[0];
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);
  assert.ok((await sizes())[0] > beforeRtl, 'RTL ArrowLeft grows the first pane');
  const box = await handle.boundingBox();
  assert.ok(box);
  const startX = box.x + box.width / 2;
  const startY = box.y + Math.min(20, box.height / 2);
  const beforeMouse = (await sizes())[0];
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 40, startY, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  assert.ok((await sizes())[0] > beforeMouse, 'RTL mouse drag follows the pointer');
  const touchBox = await handle.boundingBox();
  assert.ok(touchBox);
  const x = touchBox.x + touchBox.width / 2;
  const y = touchBox.y + Math.min(20, touchBox.height / 2);
  const beforeTouch = (await sizes())[0];
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x - 40, y }],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(200);
    assert.ok((await sizes())[0] > beforeTouch, 'RTL touch drag follows the finger');
  } finally {
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.detach();
  }
  await split().evaluate((node) => {
    node.setAttribute('dir', 'ltr');
  });
  const queue = page.getByRole('textbox', { name: text('Queue', 'Опашка'), exact: true });
  await queue.fill('Edited queue');
  await select(text('Fixed boundary', 'Фиксирана граница'));
  assert.equal(
    await page.getByRole('textbox', { name: text('Queue', 'Опашка'), exact: true }).inputValue(),
    'Edited queue',
  );
  assert.equal(
    await split()
      .getByRole('separator')
      .evaluate((node) => node.tabIndex),
    -1,
  );
  const fixedSizes = await sizes();
  const boundary = await split().getByRole('separator').boundingBox();
  assert.ok(boundary, 'Disabled boundary remains visible');
  await page.mouse.move(boundary.x + boundary.width / 2, boundary.y + 10);
  await page.mouse.down();
  await page.mouse.move(boundary.x - 60, boundary.y + 10, { steps: 3 });
  await page.mouse.up();
  assert.deepEqual(await sizes(), fixedSizes, 'Disabled boundary does not drag');
  await select(text('Hidden pane', 'Скрит панел'));
  assert.equal(await panes().count(), 1);
  assert.equal(await split().getByRole('separator').count(), 0);
  await page
    .getByRole('checkbox', {
      name: text('Show audit pane', 'Показване на панела за одит'),
      exact: true,
    })
    .click();
  await page.getByRole('textbox', { name: text('Audit', 'Одит'), exact: true }).waitFor();
  assert.equal(await panes().count(), 2);
  assert.equal(await split().getByRole('separator').count(), 1);
  await select(text('Three panes', 'Три панела'));
  assert.equal(await panes().count(), 3);
  const team = page.getByRole('textbox', { name: text('Team', 'Екип'), exact: true });
  await team.fill('Preserved team');
  const toggle = page.getByRole('checkbox', {
    name: text('Show team pane', 'Показване на панела на екипа'),
    exact: true,
  });
  await toggle.click();
  await team.waitFor({ state: 'hidden' });
  assert.equal(await panes().count(), 2);
  await toggle.click();
  await team.waitFor();
  assert.equal(await team.inputValue(), 'Preserved team');
  await select(text('Vertical splitter', 'Вертикален разделител'));
  assert.equal(await split().getAttribute('data-split-layout'), 'vertical');
  assert.equal(await split().getByRole('separator').getAttribute('aria-orientation'), 'horizontal');
  await split().evaluate((node) => node.setAttribute('dir', 'rtl'));
  const verticalHandle = split().getByRole('separator');
  const heights = () =>
    panes().evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  await page.waitForTimeout(200);
  const beforeVertical = (await heights())[0];
  await verticalHandle.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  assert.ok((await heights())[0] > beforeVertical, `${family}: vertical RTL keyboard resizing`);
  const verticalBox = await verticalHandle.boundingBox();
  assert.ok(verticalBox);
  const verticalX = verticalBox.x + Math.min(20, verticalBox.width / 2);
  const verticalY = verticalBox.y + verticalBox.height / 2;
  const beforeVerticalMouse = (await heights())[0];
  await page.mouse.move(verticalX, verticalY);
  await page.mouse.down();
  await page.mouse.move(verticalX, verticalY + 30, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  assert.ok((await heights())[0] > beforeVerticalMouse, `${family}: vertical RTL mouse resizing`);
  const verticalTouchBox = await verticalHandle.boundingBox();
  assert.ok(verticalTouchBox);
  const touchX = verticalTouchBox.x + Math.min(20, verticalTouchBox.width / 2);
  const touchY = verticalTouchBox.y + verticalTouchBox.height / 2;
  const beforeVerticalTouch = (await heights())[0];
  const verticalCdp = await page.context().newCDPSession(page);
  try {
    await verticalCdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await verticalCdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: touchX, y: touchY }],
    });
    await verticalCdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: touchX, y: touchY + 30 }],
    });
    await verticalCdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(200);
    assert.ok((await heights())[0] > beforeVerticalTouch, `${family}: vertical RTL touch resizing`);
  } finally {
    await verticalCdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await verticalCdp.detach();
  }
  if (family === 'shadcn' && locale === 'bg' && !webcomponent) {
    // Capture after the native tab indicator finishes its transition.
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(tmpdir(), 'jsonforms-split-shadcn-bg-desktop.png'),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(tmpdir(), 'jsonforms-split-shadcn-bg-narrow.png'),
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    `${family} ${locale} ${webcomponent ? 'Web Component' : 'native'}: splitter example passed`,
  );
});
