import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-categorization/translations.json';

demoTest(
  'shadcn-accordion-indicators',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const labels = translations[locale];
    await page
      .locator('[data-slot="tabs-trigger"]')
      .filter({ hasText: labels['featureNavigation.section3.label'] })
      .first()
      .click();

    const planning = page
      .locator('[data-slot="accordion-trigger"]')
      .filter({ hasText: labels['category.planning.label'] })
      .first();
    await planning.hover();
    await expect
      .poll(() => planning.evaluate((node) => getComputedStyle(node).textDecorationLine))
      .toBe('none');
    const dataIndicator = planning.locator('[data-group-indicator]');
    await expect
      .poll(() => dataIndicator.getAttribute('aria-label'))
      .toBe(labels['group.dataIndicator']);
    expect(await dataIndicator.textContent()).toBe('');
    expect(await dataIndicator.locator('svg[aria-hidden="true"]').count()).toBe(1);
  },
  { families: ['shadcn'] },
);
