import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import originalConfig from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-string-controls/config.json';
import originalData from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-string-controls/data.json';

demoTest('string-config-multiline', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-string-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const applyEditor = async (name: 'UI Schema' | 'Config', value: unknown) => {
    const label = demoEditorLabel(locale, name);
    await page.getByRole('tab', { name: label, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
    const input = toolbar.locator('..').locator('.inputarea, .native-edit-context');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate((element, json) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', json);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    }, JSON.stringify(value));
    await toolbar.getByRole('button').nth(1).click();
  };
  await applyEditor('UI Schema', {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/contactName', options: { multi: false } },
      { type: 'Control', scope: '#/properties/officeCity' },
    ],
  });
  await applyEditor('Config', { ...originalConfig, multi: true });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();

  await page.locator('input[id="#/properties/contactName-input"]').waitFor();
  const city = page.locator('textarea:visible').first();
  await city.waitFor();
  await city.fill('First line\nSecond line');
  await city.blur();
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const expected = { ...originalData, officeCity: 'First line\nSecond line' };
  await expect
    .poll(async () => {
      await page
        .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
        .focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    })
    .toEqual(expected);
  expect(errors).toEqual([]);
});
