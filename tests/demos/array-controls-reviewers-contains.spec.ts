import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';

demoTest(
  'array-controls-reviewers-contains',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
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
    const arrayError = panel.getByText(
      translations[locale]['arrayControls.reviewers.error.contains'],
    );
    const lead = reviewers.getByRole('checkbox').last();
    await expect.poll(() => arrayError.count()).toBeGreaterThan(0);
    await expect.poll(() => reviewers.locator('[data-row-summary]').count()).toBe(0);
    await expect.poll(() => lead.isChecked()).toBe(false);
    await lead.click();
    await expect.poll(() => lead.isChecked()).toBe(true);
    await expect.poll(() => arrayError.count()).toBe(0);
    await lead.click();
    await expect.poll(() => lead.isChecked()).toBe(false);
    await expect.poll(() => arrayError.count()).toBeGreaterThan(0);
    await expect.poll(() => reviewers.locator('[data-row-summary]').count()).toBe(0);
    expect(errors).toEqual([]);
  },
);
