import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('tuple-ownership', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
  );
  async function apply(name: string, value: unknown) {
    await page.getByRole('tab', { name: demoEditorLabel(locale, name), exact: true }).click();
    const toolbar = page
      .getByRole('heading', { name: demoEditorLabel(locale, name), exact: true })
      .locator('..');
    const editor = toolbar.locator('..').locator('.monaco-editor');
    const input = editor.locator('.inputarea, .native-edit-context');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate(
      (element, text) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      },
      JSON.stringify(value, null, 2),
    );
    await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await toolbar.getByRole('button').nth(1).click();
  }

  const field = 'value.key';
  await apply('Schema', {
    type: 'object',
    properties: {
      [field]: {
        type: 'array',
        items: [{ type: 'string', title: 'Code' }],
        additionalItems: { type: 'string', format: 'byte' },
      },
    },
  });
  await apply('UI Schema', {
    type: 'Control',
    scope: '#/properties/' + field,
    options: { confirmation: { delete: 'never' } },
  });
  await apply('Config', { formatMaximum: 2, restrict: false });
  await apply('Data', { [field]: ['fixed', 'aGVsbG8=', ''], sibling: 'keep' });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  const controls = page.locator('[data-file-control]:visible');
  const badge = page.getByTestId('form-validation-errors');
  await expect.poll(() => controls.count()).toBe(2);
  const input = controls.nth(1).locator('input[type="file"]');
  const original = await input.elementHandle();
  await input.setInputFiles({
    name: 'large.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  });
  await expect.poll(() => badge.count()).toBe(1);
  await page.getByRole('button', { name: messages[locale]['tuple.add'], exact: true }).click();
  await expect.poll(() => controls.count()).toBe(3);
  const remove = () =>
    page.locator('[data-additional-item="1"] .additional-item-actions button').click();
  await remove();
  await expect.poll(() => controls.count()).toBe(2);
  await expect
    .poll(() =>
      controls
        .nth(0)
        .locator('input[type="file"]')
        .evaluate((element, previous) => element === previous, original),
    )
    .toBe(true);
  await expect.poll(() => badge.count()).toBe(1);
  await remove();
  await expect.poll(() => controls.count()).toBe(1);
  await expect.poll(() => badge.count()).toBe(0);
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const text = page.locator('.monaco-editor:visible .view-lines');
  await expect
    .poll(async () => JSON.parse((await text.innerText()).replaceAll('\u00a0', ' ')))
    .toEqual({ [field]: ['fixed', ''], sibling: 'keep' });
  expect(errors).toEqual([]);
});
