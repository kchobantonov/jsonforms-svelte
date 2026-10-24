import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('destructive-confirmation', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const remove = page
    .getByRole('tabpanel', {
      name: translations[locale]['featureNavigation.section1.label'],
      exact: true,
    })
    .locator('[data-additional-properties]')
    .first()
    .getByRole('button', {
      name: messages[locale]['additionalProperties.removeAriaLabel'],
      exact: true,
    })
    .first();
  await remove.click();
  const dialog = page.getByRole('dialog', {
    name: translations[locale]['confirm.delete.title'],
    exact: true,
  });
  await expect.poll(() => dialog.isVisible()).toBe(true);
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
    .click();
  await expect.poll(() => dialog.count()).toBe(0);
  await remove.click();
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
    .click();
  await expect.poll(() => remove.count()).toBe(0);
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section2.label'],
      exact: true,
    })
    .click();
  const grid = page.locator('.jsonforms-ag-grid');
  await expect.poll(() => grid.locator('.ag-row').count()).toBe(3);
  await grid.locator('.ag-row').first().getByRole('checkbox').check();
  await grid.locator('.jsonforms-ag-grid__actions').getByRole('button').first().click();
  await expect.poll(() => dialog.isVisible()).toBe(true);
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
    .click();
  await expect.poll(() => grid.locator('.ag-row').count()).toBe(2);
  expect(errors).toEqual([]);
});
