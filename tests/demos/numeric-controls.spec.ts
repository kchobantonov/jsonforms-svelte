import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-numeric-controls/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-numeric-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('numeric-controls', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-numeric-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const quantity = page.getByRole('spinbutton', {
    name: supplement[locale]['specNumericControls.schema.properties.quantity.label'],
    exact: true,
  });
  await expect.poll(() => quantity.inputValue()).toBe('0');
  await quantity.fill('1.9');
  await expect
    .poll(() => page.getByText(messages[locale]['numeric.integer'], { exact: true }).isVisible())
    .toBe(true);
  expect(await quantity.inputValue()).toBe('1.9');
  await quantity.fill('1e3');
  await quantity.blur();
  await expect.poll(async () => Number(await quantity.inputValue())).toBe(1000);
  await quantity.fill('9007199254740993');
  await expect
    .poll(() => page.getByText(messages[locale]['numeric.precision'], { exact: true }).isVisible())
    .toBe(true);
  await quantity.fill('4');
  const tab = (section: 1 | 2 | 3) =>
    page.getByRole('tab', {
      name: translations[locale][`featureNavigation.section${section}.label`],
      exact: true,
    });
  await tab(2).click();
  const weight = page.getByRole('spinbutton', {
    name: supplement[locale]['specNumericControls.schema.properties.weightKg.label'],
    exact: true,
  });
  await expect.poll(() => weight.inputValue()).toBe('0');
  await weight.fill('1.25');
  await tab(1).click();
  await expect.poll(() => quantity.inputValue()).toBe('4');
  expect(errors).toEqual([]);
});
