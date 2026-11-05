import { mkdir } from 'node:fs/promises';
import type { JsonFormsFlowbiteElement } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('numeric-controls', async ({ page, family, locale, webcomponent, base }) => {
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
  const batches = page.getByRole('spinbutton', {
    name: supplement[locale]['specNumericControls.schema.properties.batchCount.label'],
    exact: true,
  });
  await expect.poll(() => batches.getAttribute('step')).toBe('2');
  await expect
    .poll(() =>
      page
        .getByRole('alert')
        .filter({ hasText: translations[locale]['error.multipleOf'].replace('{multipleOf}', '2') })
        .count(),
    )
    .toBeGreaterThan(0);
  await batches.fill('42');
  await expect
    .poll(() =>
      page
        .getByRole('alert')
        .filter({ hasText: messages[locale]['numeric.maximum'].replace('{limit}', '40') })
        .count(),
    )
    .toBeGreaterThan(0);
  await batches.fill('4');
  await expect.poll(() => batches.inputValue()).toBe('4');
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
  await expect
    .poll(() =>
      page
        .getByRole('alert')
        .filter({ hasText: translations[locale]['error.exclusiveMinimum'].replace('{limit}', '0') })
        .count(),
    )
    .toBeGreaterThan(0);
  await weight.fill('-1');
  await expect
    .poll(() =>
      page
        .getByRole('alert')
        .filter({ hasText: messages[locale]['numeric.exclusiveMinimum'].replace('{limit}', '0') })
        .count(),
    )
    .toBeGreaterThan(0);
  await weight.fill('1.25');
  const price = page.getByRole('spinbutton', {
    name: supplement[locale]['specNumericControls.schema.properties.unitPrice.label'],
    exact: true,
  });
  await expect.poll(() => price.getAttribute('step')).toBe('0.01');
  const tolerance = page.getByRole('spinbutton', {
    name: supplement[locale]['specNumericControls.schema.properties.toleranceMm.label'],
    exact: true,
  });
  await expect.poll(() => tolerance.inputValue()).toBe('-2.5');
  await tab(3).click();
  const slider = page.getByRole('slider', {
    name: supplement[locale]['specNumericControls.schema.properties.discountPercent.label'],
    exact: true,
  });
  await expect.poll(() => slider.getAttribute('aria-valuetext')).toBe('0');
  await slider.focus();
  await slider.press('ArrowRight');
  await expect.poll(() => slider.getAttribute('aria-valuetext')).toBe('5');
  await page
    .getByRole('button', { name: messages[locale]['control.clearValue'], exact: true })
    .click();
  // The demo validator applies schema defaults to form data after clearing.
  // The component harness separately verifies missing values without that host transform.
  await expect.poll(() => slider.getAttribute('aria-valuetext')).toBe('10');
  if (locale === 'en' && webcomponent) {
    const form = page.locator(`jsonforms-svelte-${family}`);
    await mkdir('test-results', { recursive: true });
    await page.setViewportSize({ width: 390, height: 900 });
    await slider.scrollIntoViewIfNeeded();
    for (const mode of ['light', 'dark']) {
      await form.evaluate((element, mode) => {
        (element as JsonFormsFlowbiteElement).mode = mode;
      }, mode);
      await form.screenshot({
        path: `test-results/slider-${family}-${mode}-narrow.png`,
        animations: 'disabled',
      });
    }
    await form.evaluate((element) => {
      (element as JsonFormsFlowbiteElement).mode = 'light';
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await slider.focus();
  await slider.press('ArrowLeft');
  await expect.poll(() => slider.getAttribute('aria-valuetext')).toBe('5');
  await tab(1).click();
  await expect.poll(() => quantity.inputValue()).toBe('4');
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await page
        .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
        .focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    })
    .toEqual({
      quantity: 4,
      batchCount: 4,
      unitPrice: 12.5,
      weightKg: 1.25,
      discountPercent: 5,
      toleranceMm: -2.5,
    });
  expect(errors).toEqual([]);
});
