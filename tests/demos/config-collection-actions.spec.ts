import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('config-collection-actions', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const label = demoEditorLabel(locale, 'Config');
  await page.getByRole('tab', { name: label, exact: true }).click();
  const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
  const input = toolbar.locator('..').locator('.inputarea, .native-edit-context');
  await input.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await input.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', JSON.stringify({ disableAdd: true, disableRemove: true }));
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
  });
  await toolbar.getByRole('button').nth(1).click();
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();

  const panel = page.getByRole('tabpanel', {
    name: translations[locale]['tableTab.label'],
    exact: true,
  });
  const addParts = messages[locale]['array.addAriaLabelWithLabel'].split('{label}');
  const add = panel.locator(
    `button[aria-label^="${addParts[0]}"]${addParts[1] ? `[aria-label$="${addParts[1]}"]` : ''}`,
  );
  const remove = panel.locator('[data-delete-selected]').first();
  await expect.poll(() => add.first().isDisabled()).toBe(true);
  await expect.poll(() => remove.first().isDisabled()).toBe(true);
  const sessionTitle = panel.getByRole('table').getByRole('textbox').first();
  await sessionTitle.fill('Still editable');
  await sessionTitle.blur();
  await expect.poll(() => sessionTitle.inputValue()).toBe('Still editable');
  expect(errors).toEqual([]);
});
