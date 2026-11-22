import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/input-adornments/translations.json';

demoTest('input-adornments', async ({ page, family, locale, webcomponent, base }) => {
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
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-input-adornments?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const field = (name: string) => page.locator(`[id="#/properties/${name}-input"]`);
  const frame = (name: string) =>
    field(name).locator('xpath=ancestor::*[@data-input-adornments][1]');
  await field('reference').waitFor();
  await expect.poll(() => frame('reference').locator('[data-adornment="start"]').count()).toBe(1);
  await expect.poll(() => frame('reference').locator('[data-adornment="end"]').count()).toBe(0);
  await expect
    .poll(() => frame('accountNumber').locator('[data-adornment="start"]').count())
    .toBe(0);
  await expect.poll(() => frame('accountNumber').locator('[data-adornment="end"]').count()).toBe(1);
  await expect.poll(() => frame('stringBoth').locator('[data-adornment="start"]').count()).toBe(1);
  await expect.poll(() => frame('stringBoth').locator('[data-adornment="end"]').count()).toBe(1);
  await expect
    .poll(() => frame('accountNumber').locator('[data-adornment="end"]').textContent())
    .toContain(translations[locale]['adornments.reference.suffix.text']);

  const weight = field('weight');
  await weight.fill('3.5');
  await expect.poll(() => weight.inputValue()).toBe('3.5');
  await expect
    .poll(() => frame('weight').locator('[data-adornment="end"][data-kind="text"]').textContent())
    .toContain(translations[locale]['adornments.weight.unit.text']);
  expect(await weight.getAttribute('type')).toBe('number');
  expect(errors).toEqual([]);
});
