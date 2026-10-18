import type { JsonFormsFlowbiteElement } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import { mkdir } from 'node:fs/promises';
import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-null-control/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-null-control/translations.supplement.json';

demoTest('null-control', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-null-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const field = (property: 'noSurcharge' | 'exceptionsChecked' | 'legacyApproval') =>
    page.getByRole('checkbox', {
      name: supplement[locale][`specNullControl.schema.properties.${property}.label`],
      exact: true,
    });
  await expect.poll(() => field('noSurcharge').isChecked()).toBe(true);
  expect(await field('exceptionsChecked').isChecked()).toBe(false);
  expect(await field('legacyApproval').isChecked()).toBe(false);
  if (locale === 'en' && webcomponent) {
    const form = page.locator(`jsonforms-svelte-${family}`);
    await mkdir('test-results', { recursive: true });
    await page.setViewportSize({ width: 390, height: 900 });
    for (const mode of ['light', 'dark']) {
      await form.evaluate((element, mode) => {
        (element as JsonFormsFlowbiteElement).mode = mode;
      }, mode);
      await page.screenshot({
        path: `test-results/null-control-${family}-${mode}-narrow.png`,
        animations: 'disabled',
      });
    }
    await form.evaluate((element) => {
      (element as JsonFormsFlowbiteElement).mode = 'light';
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await field('exceptionsChecked').click();
  await field('noSurcharge').click();
  await field('legacyApproval').click();
  await expect.poll(() => field('legacyApproval').isChecked()).toBe(true);
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section2.label'],
      exact: true,
    })
    .click();
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section1.label'],
      exact: true,
    })
    .click();
  await expect.poll(() => field('noSurcharge').isChecked()).toBe(false);
  expect(await field('exceptionsChecked').isChecked()).toBe(true);
  expect(await field('legacyApproval').isChecked()).toBe(true);
  expect(errors).toEqual([]);
});
