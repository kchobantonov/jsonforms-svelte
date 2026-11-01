import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('literal-file-ownership', async ({ page, family, locale, webcomponent, base }) => {
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

  await apply('Schema', {
    type: 'object',
    properties: {
      bag: { type: 'object', additionalProperties: { type: 'string', format: 'byte' } },
    },
  });
  await apply('UI Schema', { type: 'Control', scope: '#/properties/bag' });
  await apply('Config', { formatMaximum: 2, restrict: false, allowEmptyPropertyNames: true });
  const data: { bag: Record<string, string>; sibling: string } = {
    bag: { 'a.b': '', '': '' },
    sibling: 'keep',
  };
  await apply('Data', data);
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  const controls = page.locator('[data-file-control]:visible');
  const badge = page.getByTestId('form-validation-errors');
  await expect.poll(() => controls.count()).toBe(2);
  await expect.poll(() => badge.count()).toBe(0);
  for (const index of [0, 1]) {
    const control = controls.nth(index);
    await control
      .locator('input[type="file"]')
      .setInputFiles({ name: 'large.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    await expect.poll(() => badge.count()).toBe(1);
    const originalInput = await control.locator('input[type="file"]').elementHandle();
    const rename = page
      .getByRole('button', {
        name: messages[locale]['additionalProperties.renameAriaLabel'],
        exact: true,
      })
      .nth(index);
    await rename.click();
    const field = page.locator('[id$="-rename-property"]:visible');
    const nextName = index === 0 ? 'renamed' : 'renamed.literal';
    await field.fill(nextName);
    await field.press('Enter');
    await expect.poll(() => field.count()).toBe(0);
    await expect
      .poll(() =>
        control
          .locator('input[type="file"]')
          .evaluate((element, original) => element === original, originalInput),
      )
      .toBe(true);
    await expect.poll(() => badge.count()).toBe(1);
    await expect
      .poll(() =>
        rename.evaluate(
          (element) => element === (element.getRootNode() as Document | ShadowRoot).activeElement,
        ),
      )
      .toBe(true);
    delete data.bag[index === 0 ? 'a.b' : ''];
    data.bag[nextName] = '';
    await control
      .getByRole('button', { name: messages[locale]['file.clear'], exact: true })
      .click();
    await expect.poll(() => badge.count()).toBe(0);
    expect(await controls.count()).toBe(2);
  }
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const text = page.locator('.monaco-editor:visible .view-lines');
  await expect
    .poll(async () => JSON.parse((await text.innerText()).replaceAll('\u00a0', ' ')))
    .toEqual(data);
  expect(errors).toEqual([]);
});
