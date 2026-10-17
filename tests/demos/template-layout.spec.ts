import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-template-layout/translations.supplement.json';

demoTest('template-layout', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-template-layout?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
  const customer = page.getByRole('textbox', {
    name: fields[locale]['specTemplateLayout.schema.properties.customerName.label'],
    exact: true,
  });
  await customer.fill('Updated customer');
  await customer.blur();
  const ractive = page.getByRole('tabpanel', { name: 'lang: ractive', exact: true });
  await expect
    .poll(() => ractive.locator('[data-greeting]').textContent())
    .toBe(fields[locale]['specTemplateLayout.greeting'] + ' Updated customer');
  const ractiveNote = page.getByRole('textbox', {
    name: fields[locale]['specTemplateLayout.schema.properties.ractiveNote.label'],
    exact: true,
  });
  await ractiveNote.fill('Ractive slot edit');
  await ractiveNote.blur();
  await page
    .getByRole('tab', { name: fields[locale]['specTemplateLayout.native.label'], exact: true })
    .click();
  const native = page.getByRole('tabpanel', {
    name: fields[locale]['specTemplateLayout.native.label'],
    exact: true,
  });
  await expect
    .poll(() => native.locator('[data-greeting]').textContent())
    .toBe(fields[locale]['specTemplateLayout.greeting'] + ' Updated customer');
  const nativeNote = page.getByRole('textbox', {
    name: fields[locale]['specTemplateLayout.schema.properties.nativeNote.label'],
    exact: true,
  });
  await nativeNote.fill('Native slot edit');
  await nativeNote.blur();
  await expect.poll(() => nativeNote.inputValue()).toBe('Native slot edit');
  await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
  await expect.poll(() => ractiveNote.inputValue()).toBe('Ractive slot edit');
  expect(errors).toEqual([]);
});
