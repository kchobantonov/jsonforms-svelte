import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('config-collapse-new-items', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const configLabel = demoEditorLabel(locale, 'Config');
  await page.getByRole('tab', { name: configLabel, exact: true }).click();
  const toolbar = page.getByRole('heading', { name: configLabel, exact: true }).locator('..');
  const editor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await editor.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', JSON.stringify({ collapseNewItems: true }));
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
  });
  await toolbar.getByRole('button').nth(1).click();
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await page
    .getByRole('tab', { name: translations[locale]['expandableTab.label'], exact: true })
    .click();

  const speakers = page
    .getByRole('heading', {
      name: fields[locale]['specArrayControls.schema.properties.speakers.label'],
      exact: true,
    })
    .locator('..')
    .locator('..')
    .locator('..');
  const itemTriggers = speakers.locator(
    'button[aria-expanded]:not([aria-haspopup]):not([data-array-panel-toggle])',
  );
  await expect.poll(() => itemTriggers.count()).toBe(2);
  await expect.poll(() => itemTriggers.first().getAttribute('aria-expanded')).toBe('true');
  const add = speakers.getByRole('button', {
    name: messages[locale]['array.addAriaLabelWithLabel'].replace(
      '{label}',
      fields[locale]['specArrayControls.schema.properties.speakers.label'],
    ),
    exact: true,
  });
  await add.click();
  await expect.poll(() => itemTriggers.count()).toBe(3);
  await expect.poll(() => itemTriggers.first().getAttribute('aria-expanded')).toBe('true');
  await expect.poll(() => itemTriggers.last().getAttribute('aria-expanded')).toBe('false');
  expect(errors).toEqual([]);
});
