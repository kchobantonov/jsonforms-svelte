import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import fields from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

demoTest(
  'array-controls-reviewers-contains',
  async ({ page, family, locale, webcomponent, base }) => {
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
    const tabLabel = translations[locale]['boundsTab.label'];
    await page.getByRole('tab', { name: tabLabel, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: tabLabel, exact: true });
    const reviewers = panel
      .getByRole('heading', {
        name: fields[locale]['specArrayControls.schema.properties.reviewers.label'],
        exact: true,
      })
      .locator('..')
      .locator('..')
      .locator('..');
    const arrayErrorMessage = translations[locale]['arrayControls.reviewers.error.contains'];
    const arrayError = panel.locator('[data-array-own-errors]');
    const arrayIndicator = reviewers.locator('[data-array-own-error-indicator]');
    const lead = reviewers.getByRole('checkbox').last();
    await expect.poll(() => arrayError.count()).toBeGreaterThan(0);
    await expect.poll(() => arrayError.innerText()).toContain(arrayErrorMessage);
    await expect.poll(() => arrayIndicator.count()).toBe(1);
    await expect.poll(() => arrayIndicator.getAttribute('aria-label')).toBe(arrayErrorMessage);
    await expect.poll(() => reviewers.locator('[data-row-summary]').count()).toBe(0);
    await expect.poll(() => lead.isChecked()).toBe(false);
    await lead.click();
    await expect.poll(() => lead.isChecked()).toBe(true);
    await expect.poll(() => arrayError.count()).toBe(0);
    await expect.poll(() => arrayIndicator.count()).toBe(0);
    await lead.click();
    await expect.poll(() => lead.isChecked()).toBe(false);
    await expect.poll(() => arrayError.count()).toBeGreaterThan(0);
    await expect.poll(() => arrayIndicator.count()).toBe(1);
    await expect.poll(() => reviewers.locator('[data-row-summary]').count()).toBe(0);
    await reviewers.locator('[data-array-panel-toggle]').click();
    await expect.poll(() => arrayError.isVisible()).toBe(true);
    await expect.poll(() => arrayIndicator.isVisible()).toBe(true);
    expect(errors).toEqual([]);
  },
);
