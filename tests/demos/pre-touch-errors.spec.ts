import { demoEditorLabel } from '../helpers/demo-labels';
import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-pre-touch-errors/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-pre-touch-errors/translations.supplement.json';
import config from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-pre-touch-errors/config.json';

demoTest('pre-touch-errors', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-pre-touch-errors?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const required = page
    .getByText(translations[locale]['error.required'], { exact: true })
    .filter({ visible: true });
  await expect.poll(() => required.count()).toBe(2);
  const demoTab = page.getByRole('tab', {
    name: new RegExp('^' + demoEditorLabel(locale, 'Demo')),
  });
  const initialSummary = await demoTab.innerText();
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Config'), exact: true }).click();
  const toolbar = page
    .getByRole('heading', { name: demoEditorLabel(locale, 'Config'), exact: true })
    .locator('..');
  const editor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await editor.evaluate(
    (element, value) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', value);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    },
    JSON.stringify({ ...config, enableFilterErrorsBeforeTouch: true }),
  );
  await toolbar.getByRole('button').nth(1).click();
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await expect.poll(() => required.count()).toBe(0);
  expect(await demoTab.innerText()).toBe(initialSummary);
  await expect
    .poll(() =>
      page
        .getByText(translations[locale]['memberNumber.error.pattern'], { exact: true })
        .isVisible(),
    )
    .toBe(true);
  const legalName = page.getByRole('textbox', {
    name: supplement[locale]['legalName.label'],
    exact: false,
  });
  await legalName.focus();
  expect(await required.count()).toBe(0);
  await page.keyboard.press('Tab');
  await expect.poll(() => required.count()).toBe(1);
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section2.label'],
      exact: true,
    })
    .click();
  await expect.poll(() => required.count()).toBe(1);
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const data = page.locator('.monaco-editor:visible .view-lines');
  await expect.poll(() => data.innerText()).toContain('12ab');
  expect(await data.innerText()).not.toContain('legalName');
  expect(errors).toEqual([]);
});
