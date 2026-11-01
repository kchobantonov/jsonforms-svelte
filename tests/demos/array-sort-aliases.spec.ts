import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('array-sort-aliases', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
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
      {
        type: 'Control',
        scope: '#/properties/sessions',
        options: { table: true, showSortButtons: false },
      },
      { type: 'Control', scope: '#/properties/speakers', options: { showSortButtons: false } },
    ],
  });
  await applyEditor('Config', {
    showArrayTableSortButtons: true,
    showArrayLayoutSortButtons: true,
    disableAdd: true,
    disableRemove: true,
  });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();

  const addButtons = await page
    .getByRole('button', { name: /^(Add|Добавяне|Бутон за добавяне)/ })
    .all();
  const deleteButtons = await page
    .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true })
    .all();
  for (const button of [...addButtons, ...deleteButtons])
    expect(await button.isDisabled()).toBe(true);

  const down = messages[locale]['array.downAriaLabel'];
  const table = page.getByRole('table').first();
  await table.getByRole('button', { name: down, exact: true }).first().click();
  const speakers = page
    .getByRole('heading', { name: /^(Speakers|Лектори)$/ })
    .locator('..')
    .locator('..')
    .locator('..');
  await speakers.getByRole('button', { name: down, exact: true }).first().click();

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const expected = structuredClone(original) as typeof original;
  expected.sessions.reverse();
  expected.speakers.reverse();
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
