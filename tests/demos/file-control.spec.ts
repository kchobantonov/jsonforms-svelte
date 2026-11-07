import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { demoTest } from '../helpers/demo';
import { expect } from 'vite-plus/test';

demoTest('file-control', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) =>
      localStorage.setItem(
        `${family}-example-locale`,
        JSON.stringify({ version: 1, value: locale }),
      ),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-file-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
  const lists = () =>
    page.getByRole('list', { name: text('Attachments', 'Прикачени файлове'), exact: true });
  const fileControls = () => page.locator('[data-file-control]:visible');
  const files = () => fileControls().locator('input[type="file"]');
  const attachment = (name: string, contents: string) => ({
    name,
    mimeType: 'text/plain',
    buffer: Buffer.from(contents),
  });
  await files().first().waitFor({ state: 'attached' });
  assert.equal(await files().first().getAttribute('multiple'), '');
  assert.equal(await lists().first().locator('li').count(), 1);
  const firstField = fileControls().first();
  const picker = firstField.getByRole('button', {
    name: `${text('Supporting files (restricted)', 'Придружаващи файлове (с ограничения)')}: ${text('Select files', 'Избор на файлове')}`,
    exact: true,
  });
  const clear = firstField.getByRole('button', {
    name: text('Clear all files', 'Премахване на всички файлове'),
    exact: true,
  });
  const [fieldBox, pickerInField, filesInField, clearInField] = await Promise.all([
    firstField.boundingBox(),
    picker.boundingBox(),
    lists().first().boundingBox(),
    clear.boundingBox(),
  ]);
  assert.ok(fieldBox && pickerInField && filesInField && clearInField);
  assert.ok(
    pickerInField.x < filesInField.x && filesInField.x < clearInField.x,
    `${family}: picker, files, and clear action share one field`,
  );
  assert.ok(
    pickerInField.y >= fieldBox.y &&
      clearInField.x + clearInField.width <= fieldBox.x + fieldBox.width,
    `${family}: file actions stay inside the field`,
  );
  assert.notEqual(
    await firstField.evaluate((element) => getComputedStyle(element).borderTopStyle),
    'none',
    `${family}: attachments are enclosed by the file field`,
  );
  await picker.focus();
  const pickerHint = page
    .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
    .filter({ hasText: text('Select files', 'Избор на файлове') })
    .first();
  await expect.poll(() => pickerHint.isVisible()).toBe(true);
  assert.equal(
    await pickerHint.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
    webcomponent,
  );
  assert.notEqual(
    await pickerHint.evaluate((element) => getComputedStyle(element).backgroundColor),
    'rgba(0, 0, 0, 0)',
  );
  await page.keyboard.press('Escape');
  await pickerHint.waitFor({ state: 'hidden' });
  assert.equal(
    await picker.evaluate(
      (element) => element === (element.getRootNode() as Document | ShadowRoot).activeElement,
    ),
    true,
  );
  const remove = lists()
    .nth(1)
    .getByRole('button', {
      name: `${text('Remove file', 'Премахване на файл')}: agreement.txt`,
      exact: true,
    });
  assert.equal(await remove.isEnabled(), true);
  await remove.focus();
  const removeHint = page
    .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
    .filter({ hasText: `${text('Remove file', 'Премахване на файл')}: agreement.txt` })
    .first();
  await expect.poll(() => removeHint.isVisible()).toBe(true);
  assert.equal(
    await removeHint.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
    webcomponent,
  );
  assert.notEqual(
    await removeHint.evaluate((element) => getComputedStyle(element).backgroundColor),
    'rgba(0, 0, 0, 0)',
  );
  await page.keyboard.press('Escape');
  await removeHint.waitFor({ state: 'hidden' });
  assert.equal(
    await remove.evaluate(
      (element) => element === (element.getRootNode() as Document | ShadowRoot).activeElement,
    ),
    true,
  );
  const enabledClear = fileControls()
    .nth(1)
    .getByRole('button', {
      name: text('Clear all files', 'Премахване на всички файлове'),
      exact: true,
    });
  assert.equal(await enabledClear.isEnabled(), true);
  await enabledClear.focus();
  const clearHint = page
    .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
    .filter({ hasText: text('Clear all files', 'Премахване на всички файлове') })
    .first();
  await expect.poll(() => clearHint.isVisible()).toBe(true);
  assert.equal(
    await clearHint.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
    webcomponent,
  );
  assert.notEqual(
    await clearHint.evaluate((element) => getComputedStyle(element).backgroundColor),
    'rgba(0, 0, 0, 0)',
  );
  await page.keyboard.press('Escape');
  await clearHint.waitFor({ state: 'hidden' });
  assert.equal(
    await enabledClear.evaluate(
      (element) => element === (element.getRootNode() as Document | ShadowRoot).activeElement,
    ),
    true,
  );
  const chooserPromise = page.waitForEvent('filechooser');
  await picker.click();
  await (
    await chooserPromise
  ).setFiles([attachment('first.txt', 'first'), attachment('second.txt', 'second')]);
  await lists().first().getByText('second.txt', { exact: true }).waitFor();
  assert.equal(await lists().first().locator('li').count(), 3);
  await files().first().setInputFiles(attachment('excess.txt', 'excess'));
  await page
    .getByRole('status')
    .filter({ hasText: text('A maximum of 3 attachments', 'най-много 3 прикачени файла') })
    .waitFor();
  assert.equal(await lists().first().locator('li').count(), 3);
  await lists()
    .first()
    .getByRole('button', {
      name: `${text('Remove file', 'Премахване на файл')}: second.txt`,
      exact: true,
    })
    .click();
  await lists().first().getByText('second.txt', { exact: true }).waitFor({ state: 'hidden' });
  await lists()
    .first()
    .getByRole('button', {
      name: `${text('Remove file', 'Премахване на файл')}: first.txt`,
      exact: true,
    })
    .click();
  await lists().first().getByText('first.txt', { exact: true }).waitFor({ state: 'hidden' });
  assert.equal(await lists().first().locator('li').count(), 1);
  assert.equal(await lists().first().getByRole('button').isDisabled(), true);
  await files()
    .nth(1)
    .setInputFiles([
      attachment('one.txt', 'one'),
      attachment('two.txt', 'two'),
      attachment('three.txt', 'three'),
    ]);
  await lists().nth(1).getByText('three.txt', { exact: true }).waitFor();
  assert.equal(await lists().nth(1).locator('li').count(), 4);
  await page
    .getByRole('tab', { name: text('Table cells', 'Клетки в таблица'), exact: true })
    .click();
  await fileControls()
    .getByText('supplier-agreement-supporting-notes.txt', { exact: true })
    .waitFor();
  await page
    .getByRole('columnheader', {
      name: new RegExp(`^${text('Document name', 'Име на документа')}(?:\\s|$)`),
    })
    .waitFor();
  const multipleInputs = fileControls().locator('input[type="file"][multiple]');
  assert.equal(await multipleInputs.count(), 2);
  await multipleInputs.first().setInputFiles(attachment('cell.txt', 'cell'));
  await fileControls().getByText('cell.txt', { exact: true }).waitFor();
  await page.getByRole('tab', { name: 'AG Grid', exact: true }).click();
  await page.locator('.ag-root:visible').waitFor();
  await page
    .getByRole('columnheader', {
      name: new RegExp(`^${text('Document name', 'Име на документа')}(?:\\s|$)`),
    })
    .waitFor();
  // Compact cells can scroll their chips; the file must still reach the grid's control.
  await page
    .locator('.ag-root:visible [data-file-control]')
    .getByText('cell.txt', { exact: true })
    .waitFor({ state: 'attached' });
  assert.equal(await fileControls().locator('input[type="file"][multiple]').count(), 2);
  const pickerBox = await fileControls()
    .getByTitle(text('Select files', 'Избор на файлове'), { exact: true })
    .first()
    .boundingBox();
  assert.ok(
    pickerBox && pickerBox.width >= 24 && pickerBox.height >= 24,
    `${family}: compact chooser has a usable target`,
  );
  await fileControls()
    .locator('input[type="file"][multiple]')
    .first()
    .setInputFiles(attachment('cell-excess.txt', 'excess'));
  const countMessage = text(
    'These files were not added. A maximum of 3 attachments is allowed; existing files were kept.',
    'Файловете не са добавени. Допускат се най-много 3 прикачени файла; съществуващите са запазени.',
  );
  const feedback = page.getByRole('button', { name: countMessage, exact: true });
  await feedback.waitFor();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await feedback.focus();
  try {
    await page.getByText(countMessage, { exact: true }).last().waitFor({ timeout: 5000 });
  } catch (error) {
    await page.screenshot({
      path: path.join(tmpdir(), `jsonforms-files-${family}-${locale}-feedback-failure.png`),
      fullPage: true,
    });
    throw error;
  }
  assert.equal(await fileControls().getByText('cell-excess.txt', { exact: true }).count(), 0);
  if (family === 'shadcn' && locale === 'bg' && !webcomponent) {
    await page.screenshot({
      path: path.join(tmpdir(), 'jsonforms-files-shadcn-bg-desktop.png'),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    // AG Grid virtualizes columns when the viewport narrows. Bring the
    // attachment column into view, then exercise its newly mounted picker.
    // Local operation feedback is owned by the cell that displayed it.
    await page
      .locator('.ag-root-wrapper:visible .ag-body-horizontal-scroll-viewport')
      .evaluate(async (element) => {
        element.scrollLeft = element.scrollWidth;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
    await fileControls()
      .locator('input[type="file"][multiple]')
      .first()
      .setInputFiles(attachment('narrow-excess.txt', 'excess'));
    await feedback.waitFor();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await feedback.focus();
    await page.waitForFunction(() => {
      const popup = document.querySelector('[data-slot="popover-content"]');
      if (!popup) return false;
      const bounds = popup.getBoundingClientRect();
      return bounds.left >= 0 && bounds.right <= innerWidth;
    });
    await page.screenshot({
      path: path.join(tmpdir(), 'jsonforms-files-shadcn-bg-narrow.png'),
      fullPage: true,
    });
  }
  assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
  console.log(`PASS file-control ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`);
});
