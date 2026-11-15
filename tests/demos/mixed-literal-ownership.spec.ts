import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('mixed-literal-ownership', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) =>
      localStorage.setItem(
        `${family}-example-locale`,
        JSON.stringify({ version: 1, value: locale }),
      ),
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

  await apply('Schema', {
    type: 'object',
    properties: {
      value: { type: ['object', 'null'], additionalProperties: { type: 'string', format: 'byte' } },
    },
  });
  await apply('UI Schema', {
    type: 'Control',
    scope: '#/properties/value',
    options: { confirmation: { delete: 'never' } },
  });
  await apply('Config', { formatMaximum: 2, restrict: false });
  const data = { value: { 'a.b': '', '': '', neighbor: '' }, sibling: 'keep' };
  await apply('Data', data);
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await page
    .locator(`button[title=${JSON.stringify(messages[locale]['mixed.showPrimitives'])}]`)
    .click();
  const search = page.getByPlaceholder(messages[locale]['mixed.searchPlaceholder'], {
    exact: true,
  });
  const badge = page.getByTestId('form-validation-errors');
  for (const key of ['a.b', '']) {
    await search.fill(key || '""');
    const row = page
      .getByRole('treeitem')
      .filter({ hasText: key || '""' })
      .last();
    if (family === 'flowbite') await row.locator(':scope > button').click();
    else await row.click();
    await expect.poll(() => row.getAttribute('aria-selected')).toBe('true');
    const detail = page
      .getByRole('navigation', { name: messages[locale]['mixed.navigationPath'], exact: true })
      .locator('..');
    await expect.poll(() => detail.locator('[data-file-control]').count()).toBe(1);
    await detail
      .locator('input[type="file"]')
      .setInputFiles({ name: 'large.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    await expect.poll(() => badge.count()).toBe(1);
    await row.locator(`button[title=${JSON.stringify(messages[locale]['mixed.delete'])}]`).click();
    await expect.poll(() => badge.count()).toBe(0);
  }
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const text = page.locator('.monaco-editor:visible .view-lines');
  await expect
    .poll(async () => JSON.parse((await text.innerText()).replaceAll('\u00a0', ' ')))
    .toEqual({ value: { neighbor: '' }, sibling: 'keep' });
  expect(errors).toEqual([]);
});
