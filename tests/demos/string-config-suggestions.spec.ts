import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import originalConfig from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-string-controls/config.json';

demoTest('string-config-suggestions', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-string-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const label = demoEditorLabel(locale, 'Config');
  await page.getByRole('tab', { name: label, exact: true }).click();
  const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
  const input = toolbar.locator('..').locator('.inputarea, .native-edit-context');
  await input.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await input.evaluate(
    (element, json) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', json);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    },
    JSON.stringify({
      ...originalConfig,
      suggestion: ['Boston', 'Chicago', 'Denver', 'New York', 'Miami'],
    }),
  );
  await toolbar.getByRole('button').nth(1).click();
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();

  const city = page.locator('[id="#/properties/officeCity-input"]');
  await city.waitFor();
  if (family === 'flowbite') {
    await city.fill('Por');
    await expect
      .poll(() => page.getByRole('button', { name: 'Portland', exact: true }).count())
      .toBe(1);
    await city.fill('Mia');
    await expect
      .poll(() => page.getByRole('button', { name: 'Miami', exact: true }).count())
      .toBe(0);
  } else {
    const options = city.locator('xpath=following-sibling::datalist/option');
    await expect.poll(() => options.count()).toBe(4);
    expect(
      await options.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('value'))),
    ).toEqual(['Portland', 'Seattle', 'Sacramento', 'Salt Lake City']);
  }
  expect(errors).toEqual([]);
});
